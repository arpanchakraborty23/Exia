import logging
import os
from datetime import datetime, timezone

from fastapi import HTTPException, status

from .db import MongoServices
from src.constants import get_settings, ModelConfigSchema

# Configuration
settings = get_settings()
logger = logging.getLogger(__name__)


def _update_runtime_env(key: str, value: str) -> None:
    """Applies a settings change to the running process environment.

    The source of truth is MongoDB (model_config collection); environment
    updates apply in-memory so token minting picks them up immediately.
    """
    os.environ[key] = value
    try:
        get_settings.cache_clear()
    except Exception:
        pass


# Defaults for fresh/unconfigured profiles
DEFAULT_MODEL_CONFIG: dict = {
    "mode": "gemini_live",
    "gemini_model": "gemini-2.0-flash-realtime",
    "gemini_voice": "Puck",
    "temperature": 0.7,
    "max_output_tokens": 1024,
    "fallback_enabled": False,
    "fallback_stt_enabled": False,
    "fallback_tts_enabled": False,
}

# Mapping of ModelConfig key attributes to standard Environment variable names
MODEL_KEY_TO_ENV = {
    "gemini_api_key": "GEMINI_API_KEY",
    "openai_api_key": "OPENAI_API_KEY",
    "anthropic_api_key": "ANTHROPIC_API_KEY",
    "deepgram_api_key": "DEEPGRAM_API_KEY",
    "cartesia_api_key": "CARTESIA_API_KEY",
    "elevenlabs_api_key": "ELEVENLABS_API_KEY",
    "speechmatics_api_key": "SPEECHMATICS_API_KEY",
    "groq_api_key": "GROQ_API_KEY",
    "deepseek_api_key": "DEEPSEEK_API_KEY",
}

# Legacy keys the frontend sometimes sends — normalized on read
_LEGACY_ALIASES = {
    "pipeline_mode": "mode",
    "llt_provider": "llm_provider",
}


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _normalize(raw: dict) -> dict:
    normalized = dict(raw or {})
    for old, new in _LEGACY_ALIASES.items():
        if old in normalized and new not in normalized:
            normalized[new] = normalized.pop(old)
        else:
            normalized.pop(old, None)
    return normalized


def sanitize_model_config(data: dict) -> dict:
    """
    Sanitizes and isolates model configuration before saving to MongoDB:
    1. Mode Isolation (Mode is the key, model config is the value):
       - If mode is 'realtime' or 'gemini_live':
         Store key 'realtime' with model, voice, api_key, and generation params.
         Do NOT store modular (STT, LLM, TTS) models or keys.
       - If mode is 'modular':
         Store key 'modular' with STT, LLM, and TTS configurations and api_keys.
         Do NOT store realtime models or keys.
    2. Fallbacks (Works for both Realtime and Modular):
       - Fallback Realtime model/voice/api_key.
       - Fallback LLM, STT, and TTS models/api_keys.
       - Store fallback settings ONLY if fallback_enabled is True.
    3. Voice Recognition / Speaker Identification:
       - If STT is Speechmatics and voice recognition is enabled:
         Store speaker identification, diarization, threshold, voice profiles.
       - If disabled, keep STT simple with pure transcription and do NOT store voice profiles.
    4. Turn and VAD:
       - Store sensitivity, barge-in, silence duration, prefix padding.
    5. LiveKit credentials are strictly in .env (never in DB).
    """
    raw_mode = str(data.get("mode") or data.get("pipeline_mode") or "gemini_live").lower()
    if raw_mode in ("realtime", "gemini_live"):
        mode = "realtime"
        pipeline_mode = "gemini_live"
    else:
        mode = "modular"
        pipeline_mode = "modular"

    clean: dict = {
        "mode": mode,
        "pipeline_mode": pipeline_mode,
    }

    # Common parameters & VAD
    temperature = float(data.get("temperature", 0.7) if data.get("temperature") is not None else 0.7)
    max_output_tokens = int(data.get("max_output_tokens", 1024) if data.get("max_output_tokens") is not None else 1024)
    top_p = float(data.get("top_p", 0.95) if data.get("top_p") is not None else 0.95)
    system_prompt_override = data.get("system_prompt_override")

    clean["temperature"] = temperature
    clean["max_output_tokens"] = max_output_tokens
    clean["top_p"] = top_p
    if system_prompt_override:
        clean["system_prompt_override"] = system_prompt_override

    for key in ("base_system_prompt", "skills"):
        if key in data and data[key] is not None:
            clean[key] = data[key]

    # -------------------------------------------------------------
    # 1. Mode Isolation (Mode as key, model config as value)
    # -------------------------------------------------------------
    if mode == "realtime":
        realtime_data = data.get("realtime") if isinstance(data.get("realtime"), dict) else {}
        realtime_provider = (
            realtime_data.get("provider")
            or data.get("realtime_model_provider")
            or data.get("realttime_model_provider")
            or data.get("realtime_provider")
            or "google"
        )
        realtime_model = (
            realtime_data.get("model")
            or data.get("realtime_model")
            or data.get("gemini_model")
            or "gemini-2.0-flash"
        )
        realtime_voice = (
            realtime_data.get("voice")
            or data.get("realtime_voice")
            or data.get("gemini_voice")
            or "Charon"
        )
        realtime_key = (
            realtime_data.get("api_key")
            or data.get("realtime_api_key")
            or data.get("gemini_api_key")
            or data.get("openai_api_key")
        )
        realtime_temp = float(
            data.get("realtime_model_temperature")
            if data.get("realtime_model_temperature") is not None
            else (data.get("temperature", 0.7) if data.get("temperature") is not None else 0.7)
        )
        realtime_max_tokens = int(
            data.get("realtime_model_max_output_tokens")
            if data.get("realtime_model_max_output_tokens") is not None
            else (data.get("max_output_tokens", 1024) if data.get("max_output_tokens") is not None else 1024)
        )

        realtime_dict = {
            "provider": realtime_provider,
            "model": realtime_model,
            "voice": realtime_voice,
            "api_key": realtime_key,
            "temperature": realtime_temp,
            "max_output_tokens": realtime_max_tokens,
            "top_p": top_p,
        }
        if system_prompt_override:
            realtime_dict["system_prompt_override"] = system_prompt_override
        clean["realtime"] = realtime_dict

        # Flat aliases for backward compatibility & user schema
        clean["realtime_model_provider"] = realtime_provider
        clean["realtime_model"] = realtime_model
        clean["realtime_voice"] = realtime_voice
        clean["realtime_api_key"] = realtime_key
        clean["realtime_model_temperature"] = realtime_temp
        clean["realtime_model_max_output_tokens"] = realtime_max_tokens
        clean["gemini_model"] = realtime_model
        clean["gemini_voice"] = realtime_voice
        if realtime_key:
            if realtime_provider == "google":
                clean["gemini_api_key"] = realtime_key
            elif realtime_provider == "openai":
                clean["openai_api_key"] = realtime_key

    elif mode == "modular":
        modular_data = data.get("modular") if isinstance(data.get("modular"), dict) else {}
        stt_data = modular_data.get("stt") if isinstance(modular_data.get("stt"), dict) else {}
        llm_data = modular_data.get("llm") if isinstance(modular_data.get("llm"), dict) else {}
        tts_data = modular_data.get("tts") if isinstance(modular_data.get("tts"), dict) else {}

        stt_provider = (stt_data.get("provider") or data.get("stt_provider") or "deepgram").lower()
        stt_model = stt_data.get("model") or data.get("stt_model") or "nova-3"
        stt_key = (
            stt_data.get("api_key")
            or data.get("stt_model_api_key")
            or data.get("stt_api_key")
            or data.get("deepgram_api_key")
            or data.get("speechmatics_api_key")
        )
        stt_language = (
            stt_data.get("language")
            or data.get("stt_language")
            or data.get("speechmatics_language")
            or "en"
        )
        stt_server_url = stt_data.get("server_url") or data.get("stt_server_url") or data.get("server_url")

        llm_provider = (llm_data.get("provider") or data.get("llm_provider") or "anthropic").lower()
        llm_model = llm_data.get("model") or data.get("llm_model") or "claude-3-5-sonnet-latest"
        llm_key = (
            llm_data.get("api_key")
            or data.get("llm_api_key")
            or data.get("anthropic_api_key")
            or data.get("openai_api_key")
            or data.get("gemini_api_key")
            or data.get("groq_api_key")
        )
        llm_server_url = llm_data.get("server_url") or data.get("llm_server_url") or data.get("server_url")
        ollama_url = llm_data.get("ollama_base_url") or data.get("ollama_base_url") or "http://localhost:11434/v1"
        llm_temp = float(
            data.get("llm_temperature")
            if data.get("llm_temperature") is not None
            else (data.get("temperature", 0.7) if data.get("temperature") is not None else 0.7)
        )
        llm_max_tokens = int(
            data.get("llm_max_output_tokens")
            if data.get("llm_max_output_tokens") is not None
            else (data.get("max_output_tokens", 1024) if data.get("max_output_tokens") is not None else 1024)
        )
        llm_top_p = float(
            data.get("llm_top_p")
            if data.get("llm_top_p") is not None
            else (data.get("top_p", 0.95) if data.get("top_p") is not None else 0.95)
        )

        tts_provider = (tts_data.get("provider") or data.get("tts_provider") or "cartesia").lower()
        tts_model = tts_data.get("model") or data.get("tts_model") or "sonic-3.6"
        tts_voice = tts_data.get("voice") or data.get("tts_voice") or data.get("voice_id") or "baritone-us"
        tts_key = tts_data.get("api_key") or data.get("tts_api_key") or data.get("cartesia_api_key") or data.get("elevenlabs_api_key")
        tts_server_url = tts_data.get("server_url") or data.get("tts_server_url") or data.get("server_url")

        # Speechmatics Voice Recognition handling
        stt_voice_rec = None
        if stt_provider == "speechmatics":
            explicit_vr = data.get("speechmatics_voice_recognition_enabled")
            if explicit_vr is not None:
                voice_rec_enabled = bool(explicit_vr)
            else:
                voice_rec_enabled = bool(
                    stt_data.get("voice_recognition", {}).get("enabled")
                    or data.get("speechmatics_speaker_identification")
                    or data.get("speechmatics_diarization")
                )

            if voice_rec_enabled:
                stt_voice_rec = {
                    "enabled": True,
                    "speaker_identification": bool(data.get("speechmatics_speaker_identification", False)),
                    "diarization": bool(data.get("speechmatics_diarization", False)),
                    "speaker_threshold": data.get("speechmatics_speaker_threshold", 0.82),
                    "voice_profile_name": data.get("speechmatics_voice_profile_name", "Primary User"),
                    "turn_detection": data.get("speechmatics_turn_detection", "vad"),
                    "max_delay": data.get("speechmatics_max_delay", 1.0),
                    "enable_partials": data.get("speechmatics_enable_partials", True),
                    "custom_dictionary": data.get("speechmatics_custom_dictionary", ""),
                    "voice_users": data.get("voice_users", []),
                }
                clean["speechmatics_voice_recognition_enabled"] = True
                clean["speechmatics_speaker_identification"] = stt_voice_rec["speaker_identification"]
                clean["speechmatics_diarization"] = stt_voice_rec["diarization"]
                clean["speechmatics_speaker_threshold"] = stt_voice_rec["speaker_threshold"]
                clean["speechmatics_voice_profile_name"] = stt_voice_rec["voice_profile_name"]
                clean["voice_users"] = stt_voice_rec["voice_users"]
            else:
                clean["speechmatics_voice_recognition_enabled"] = False
                clean.pop("speechmatics_speaker_identification", None)
                clean.pop("speechmatics_diarization", None)
                clean.pop("speechmatics_speaker_threshold", None)
                clean.pop("speechmatics_voice_profile_name", None)
                clean.pop("voice_users", None)

            if data.get("speechmatics_model"):
                clean["speechmatics_model"] = data["speechmatics_model"]
            if data.get("speechmatics_language"):
                clean["speechmatics_language"] = data["speechmatics_language"]
            if stt_key:
                clean["speechmatics_api_key"] = stt_key

        stt_dict = {
            "provider": stt_provider,
            "model": stt_model,
            "api_key": stt_key,
            "language": stt_language,
            "server_url": stt_server_url,
        }
        if stt_provider == "speechmatics":
            if stt_voice_rec is not None:
                stt_dict["voice_recognition"] = stt_voice_rec

        llm_dict = {
            "provider": llm_provider,
            "model": llm_model,
            "api_key": llm_key,
            "server_url": llm_server_url,
            "ollama_base_url": ollama_url if llm_provider == "ollama" else None,
            "temperature": llm_temp,
            "max_output_tokens": llm_max_tokens,
            "top_p": llm_top_p,
        }
        if system_prompt_override:
            llm_dict["system_prompt_override"] = system_prompt_override

        clean["modular"] = {
            "stt": stt_dict,
            "llm": llm_dict,
            "tts": {
                "provider": tts_provider,
                "model": tts_model,
                "voice": tts_voice,
                "api_key": tts_key,
                "server_url": tts_server_url,
            },
        }

        # Flat aliases for backward compatibility & user schema
        clean["stt_provider"] = stt_provider
        clean["stt_model"] = stt_model
        clean["stt_model_api_key"] = stt_key
        clean["stt_language"] = stt_language
        if stt_server_url:
            clean["stt_server_url"] = stt_server_url
        clean["llm_provider"] = llm_provider
        clean["llm_model"] = llm_model
        clean["llm_api_key"] = llm_key
        clean["llm_temperature"] = llm_temp
        clean["llm_max_output_tokens"] = llm_max_tokens
        clean["llm_top_p"] = llm_top_p
        clean["temperature"] = llm_temp
        clean["max_output_tokens"] = llm_max_tokens
        if llm_server_url:
            clean["llm_server_url"] = llm_server_url
        clean["tts_provider"] = tts_provider
        clean["tts_model"] = tts_model
        clean["tts_voice"] = tts_voice
        clean["voice_id"] = tts_voice
        clean["tts_api_key"] = tts_key
        if tts_server_url:
            clean["tts_server_url"] = tts_server_url

        # Persist provider API keys
        if stt_provider == "deepgram" and stt_key:
            clean["deepgram_api_key"] = stt_key
        if llm_provider == "anthropic" and llm_key:
            clean["anthropic_api_key"] = llm_key
        elif llm_provider == "openai" and llm_key:
            clean["openai_api_key"] = llm_key
        elif llm_provider == "google" and llm_key:
            clean["gemini_api_key"] = llm_key
        elif llm_provider == "groq" and llm_key:
            clean["groq_api_key"] = llm_key
        if tts_provider == "cartesia" and tts_key:
            clean["cartesia_api_key"] = tts_key
        elif tts_provider == "elevenlabs" and tts_key:
            clean["elevenlabs_api_key"] = tts_key

    # -------------------------------------------------------------
    # 2. Fallback Models: Works for both Realtime and Modular
    # -------------------------------------------------------------
    fallback_data = data.get("fallback") if isinstance(data.get("fallback"), dict) else {}
    fallback_enabled = bool(data.get("fallback_enabled") or fallback_data.get("enabled"))
    clean["fallback_enabled"] = fallback_enabled

    if fallback_enabled:
        # Realtime Fallback
        rt_fb_data = fallback_data.get("realtime") if isinstance(fallback_data.get("realtime"), dict) else {}
        rt_fb_enabled = bool(data.get("fallback_realtime_enabled") or rt_fb_data.get("enabled"))
        rt_fb_provider = rt_fb_data.get("provider") or data.get("fallback_realtime_provider") or "livekit"
        rt_fb_model = rt_fb_data.get("model") or data.get("fallback_realtime_model") or "google/gemini-3.8-live"
        rt_fb_voice = rt_fb_data.get("voice") or data.get("fallback_realtime_voice") or "Charon"
        rt_fb_key = rt_fb_data.get("api_key") or data.get("fallback_realtime_api_key")

        # Modular Fallback (LLM, STT, TTS)
        modular_fb = fallback_data.get("modular") if isinstance(fallback_data.get("modular"), dict) else {}
        llm_fb_data = modular_fb.get("llm") or fallback_data.get("llm") or fallback_data
        llm_fb_enabled = bool(
            data.get("fallback_llm_enabled")
            if data.get("fallback_llm_enabled") is not None
            else (llm_fb_data.get("enabled", True) if isinstance(llm_fb_data, dict) else True)
        )
        llm_fb_provider = (llm_fb_data.get("provider") if isinstance(llm_fb_data, dict) else None) or data.get("fallback_provider") or "livekit"
        llm_fb_model = (llm_fb_data.get("model") if isinstance(llm_fb_data, dict) else None) or data.get("fallback_model") or "google/gemma-4-31b-it"
        llm_fb_temp = (llm_fb_data.get("temperature") if isinstance(llm_fb_data, dict) else None) or data.get("fallback_temperature") or 0.7
        llm_fb_key = (llm_fb_data.get("api_key") if isinstance(llm_fb_data, dict) else None) or data.get("fallback_api_key")

        stt_fb_data = modular_fb.get("stt") or fallback_data.get("stt") or {}
        stt_fb_enabled = bool(data.get("fallback_stt_enabled") or stt_fb_data.get("enabled"))
        stt_fb_provider = stt_fb_data.get("provider") or data.get("fallback_stt_provider") or "livekit"
        stt_fb_model = stt_fb_data.get("model") or data.get("fallback_stt_model") or "deepgram/nova-3"
        stt_fb_key = stt_fb_data.get("api_key") or data.get("fallback_stt_api_key")

        tts_fb_data = modular_fb.get("tts") or fallback_data.get("tts") or {}
        tts_fb_enabled = bool(data.get("fallback_tts_enabled") or tts_fb_data.get("enabled"))
        tts_fb_provider = tts_fb_data.get("provider") or data.get("fallback_tts_provider") or "livekit"
        tts_fb_model = tts_fb_data.get("model") or data.get("fallback_tts_model") or "cartesia/sonic-3.6"
        tts_fb_voice = tts_fb_data.get("voice") or data.get("fallback_tts_voice") or "baritone-us"
        tts_fb_key = tts_fb_data.get("api_key") or data.get("fallback_tts_api_key")

        clean["fallback"] = {
            "enabled": True,
            "realtime": {
                "enabled": rt_fb_enabled,
                "provider": rt_fb_provider,
                "model": rt_fb_model,
                "voice": rt_fb_voice,
                "api_key": rt_fb_key,
            },
            "modular": {
                "llm": {
                    "enabled": llm_fb_enabled,
                    "provider": llm_fb_provider,
                    "model": llm_fb_model,
                    "temperature": llm_fb_temp,
                    "api_key": llm_fb_key,
                },
                "stt": {
                    "enabled": stt_fb_enabled,
                    "provider": stt_fb_provider,
                    "model": stt_fb_model,
                    "api_key": stt_fb_key,
                },
                "tts": {
                    "enabled": tts_fb_enabled,
                    "provider": tts_fb_provider,
                    "model": tts_fb_model,
                    "voice": tts_fb_voice,
                    "api_key": tts_fb_key,
                },
            },
        }

        # Flat aliases for fallback
        clean["fallback_realtime_enabled"] = rt_fb_enabled
        clean["fallback_realtime_provider"] = rt_fb_provider
        clean["fallback_realtime_model"] = rt_fb_model
        clean["fallback_realtime_voice"] = rt_fb_voice
        clean["fallback_realtime_api_key"] = rt_fb_key

        clean["fallback_provider"] = llm_fb_provider
        clean["fallback_model"] = llm_fb_model
        clean["fallback_temperature"] = llm_fb_temp
        clean["fallback_api_key"] = llm_fb_key

        clean["fallback_stt_enabled"] = stt_fb_enabled
        clean["fallback_stt_provider"] = stt_fb_provider
        clean["fallback_stt_model"] = stt_fb_model
        clean["fallback_stt_api_key"] = stt_fb_key

        clean["fallback_tts_enabled"] = tts_fb_enabled
        clean["fallback_tts_provider"] = tts_fb_provider
        clean["fallback_tts_model"] = tts_fb_model
        clean["fallback_tts_voice"] = tts_fb_voice
        clean["fallback_tts_api_key"] = tts_fb_key
    else:
        clean["fallback_enabled"] = False
        clean["fallback"] = {"enabled": False}
        clean["fallback_realtime_enabled"] = False
        clean["fallback_llm_enabled"] = False
        clean["fallback_stt_enabled"] = False
        clean["fallback_tts_enabled"] = False
        clean.pop("fallback_realtime_model", None)
        clean.pop("fallback_realtime_provider", None)
        clean.pop("fallback_realtime_voice", None)
        clean.pop("fallback_realtime_api_key", None)
        clean.pop("fallback_provider", None)
        clean.pop("fallback_model", None)
        clean.pop("fallback_temperature", None)
        clean.pop("fallback_api_key", None)
        clean.pop("fallback_stt_provider", None)
        clean.pop("fallback_stt_model", None)
        clean.pop("fallback_stt_api_key", None)
        clean.pop("fallback_tts_provider", None)
        clean.pop("fallback_tts_model", None)
        clean.pop("fallback_tts_voice", None)
        clean.pop("fallback_tts_api_key", None)

    # -------------------------------------------------------------
    # 3. Turn & VAD Configuration
    # -------------------------------------------------------------
    vad_data = data.get("vad") if isinstance(data.get("vad"), dict) else {}
    vad_threshold = float(vad_data.get("vad_threshold") or data.get("vad_threshold") or 0.5)
    allow_interruptions = bool(
        vad_data.get("allow_interruptions")
        if vad_data.get("allow_interruptions") is not None
        else (data.get("allow_interruptions") if data.get("allow_interruptions") is not None else True)
    )
    silence_duration_ms = int(vad_data.get("silence_duration_ms") or data.get("silence_duration_ms") or 500)
    prefix_padding_ms = int(vad_data.get("prefix_padding_ms") or data.get("prefix_padding_ms") or 300)

    clean["vad_threshold"] = vad_threshold
    clean["allow_interruptions"] = allow_interruptions
    clean["silence_duration_ms"] = silence_duration_ms
    clean["prefix_padding_ms"] = prefix_padding_ms

    clean["vad"] = {
        "vad_threshold": vad_threshold,
        "allow_interruptions": allow_interruptions,
        "silence_duration_ms": silence_duration_ms,
        "prefix_padding_ms": prefix_padding_ms,
    }

    return clean


class ModelConfigServices:
    """Single model-engine config document per user (upsert + merge)."""

    def __init__(self):
        self.db = MongoServices(
            url=settings.mongodb_uri,
            db=settings.mongodb_database,
            collection=settings.mongodb_model_collection or "model_config",
        )

    async def get_config(self, user_id: str) -> dict:
        try:
            doc = self.db.find_one({"user_id": user_id}, {"_id": 0})
            stored = _normalize((doc or {}).get("config", {}))

            raw_mode = str(stored.get("mode") or stored.get("pipeline_mode") or "gemini_live").lower()
            if raw_mode in ("realtime", "gemini_live"):
                active_mode = "realtime"
                pipeline_mode = "gemini_live"
            else:
                active_mode = "modular"
                pipeline_mode = "modular"

            # Base merged object starts from stored clean config
            merged = dict(stored)
            merged["mode"] = active_mode
            merged["pipeline_mode"] = pipeline_mode

            # Common defaults
            if "temperature" not in merged:
                merged["temperature"] = 0.7
            if "max_output_tokens" not in merged:
                merged["max_output_tokens"] = 1024

            # Mode-specific models and API keys
            if active_mode == "realtime":
                rt_cfg = stored.get("realtime") if isinstance(stored.get("realtime"), dict) else {}
                realtime_model = rt_cfg.get("model") or stored.get("gemini_model") or "gemini-2.0-flash"
                realtime_voice = rt_cfg.get("voice") or stored.get("gemini_voice") or "Charon"
                realtime_provider = rt_cfg.get("provider") or "google"
                rt_temp = (
                    rt_cfg.get("temperature")
                    if rt_cfg.get("temperature") is not None
                    else (
                        stored.get("realtime_model_temperature")
                        if stored.get("realtime_model_temperature") is not None
                        else merged.get("temperature", 0.7)
                    )
                )
                rt_max_tokens = (
                    rt_cfg.get("max_output_tokens")
                    if rt_cfg.get("max_output_tokens") is not None
                    else (
                        stored.get("realtime_model_max_output_tokens")
                        if stored.get("realtime_model_max_output_tokens") is not None
                        else merged.get("max_output_tokens", 1024)
                    )
                )

                # Fetch realtime API key from env if not in DB
                for model_attr in ("gemini_api_key", "openai_api_key"):
                    env_var = MODEL_KEY_TO_ENV.get(model_attr)
                    env_val = os.environ.get(env_var) or (os.environ.get("GOOGLE_API_KEY") if env_var == "GEMINI_API_KEY" else None)
                    if env_val and not stored.get(model_attr):
                        merged[model_attr] = env_val

                realtime_key = rt_cfg.get("api_key") or merged.get("gemini_api_key") or merged.get("openai_api_key")
                merged["realtime"] = {
                    "provider": realtime_provider,
                    "model": realtime_model,
                    "voice": realtime_voice,
                    "api_key": realtime_key,
                    "temperature": rt_temp,
                    "max_output_tokens": rt_max_tokens,
                    "top_p": merged.get("top_p", 0.95),
                    "system_prompt_override": merged.get("system_prompt_override", ""),
                }
                merged["realtime_model_provider"] = realtime_provider
                merged["realtime_model"] = realtime_model
                merged["realtime_voice"] = realtime_voice
                merged["realtime_api_key"] = realtime_key
                merged["realtime_model_temperature"] = rt_temp
                merged["realtime_model_max_output_tokens"] = rt_max_tokens
                merged["gemini_model"] = realtime_model
                merged["gemini_voice"] = realtime_voice

            elif active_mode == "modular":
                mod_cfg = stored.get("modular") if isinstance(stored.get("modular"), dict) else {}
                stt_cfg = mod_cfg.get("stt") if isinstance(mod_cfg.get("stt"), dict) else {}
                llm_cfg = mod_cfg.get("llm") if isinstance(mod_cfg.get("llm"), dict) else {}
                tts_cfg = mod_cfg.get("tts") if isinstance(mod_cfg.get("tts"), dict) else {}

                stt_provider = stt_cfg.get("provider") or stored.get("stt_provider") or "deepgram"
                stt_model = stt_cfg.get("model") or stored.get("stt_model") or "nova-3"
                stt_language = stt_cfg.get("language") or stored.get("stt_language") or "en"
                stt_server_url = stt_cfg.get("server_url") or stored.get("stt_server_url")

                llm_provider = llm_cfg.get("provider") or stored.get("llm_provider") or "anthropic"
                llm_model = llm_cfg.get("model") or stored.get("llm_model") or "claude-3-5-sonnet-latest"
                llm_server_url = llm_cfg.get("server_url") or stored.get("llm_server_url") or stored.get("ollama_base_url") or stored.get("server_url")
                llm_temp = (
                    llm_cfg.get("temperature")
                    if llm_cfg.get("temperature") is not None
                    else (
                        stored.get("llm_temperature")
                        if stored.get("llm_temperature") is not None
                        else merged.get("temperature", 0.7)
                    )
                )
                llm_max_tokens = (
                    llm_cfg.get("max_output_tokens")
                    if llm_cfg.get("max_output_tokens") is not None
                    else (
                        stored.get("llm_max_output_tokens")
                        if stored.get("llm_max_output_tokens") is not None
                        else merged.get("max_output_tokens", 1024)
                    )
                )

                tts_provider = tts_cfg.get("provider") or stored.get("tts_provider") or "cartesia"
                tts_model = tts_cfg.get("model") or stored.get("tts_model") or "sonic-3.6"
                tts_voice = tts_cfg.get("voice") or stored.get("tts_voice") or stored.get("voice_id") or "baritone-us"
                tts_server_url = tts_cfg.get("server_url") or stored.get("tts_server_url")

                # Load relevant provider keys from environment if not explicitly set in stored doc
                for model_attr, env_var in MODEL_KEY_TO_ENV.items():
                    env_val = os.environ.get(env_var) or (os.environ.get("GOOGLE_API_KEY") if env_var == "GEMINI_API_KEY" else None)
                    if env_val and not stored.get(model_attr):
                        merged[model_attr] = env_val

                stt_key = stt_cfg.get("api_key") or stored.get("stt_model_api_key") or merged.get("deepgram_api_key") or merged.get("speechmatics_api_key")
                llm_key = (
                    llm_cfg.get("api_key")
                    or stored.get("llm_api_key")
                    or merged.get("anthropic_api_key")
                    or merged.get("openai_api_key")
                    or merged.get("gemini_api_key")
                    or merged.get("groq_api_key")
                )
                tts_key = tts_cfg.get("api_key") or stored.get("tts_api_key") or merged.get("cartesia_api_key") or merged.get("elevenlabs_api_key")

                merged["modular"] = {
                    "stt": {
                        "provider": stt_provider,
                        "model": stt_model,
                        "api_key": stt_key,
                        "language": stt_language,
                        "server_url": stt_server_url,
                        "voice_recognition": stt_cfg.get("voice_recognition", {"enabled": False}),
                    },
                    "llm": {
                        "provider": llm_provider,
                        "model": llm_model,
                        "api_key": llm_key,
                        "server_url": llm_server_url,
                        "temperature": llm_temp,
                        "max_output_tokens": llm_max_tokens,
                        "top_p": merged.get("top_p", 0.95),
                        "system_prompt_override": merged.get("system_prompt_override", ""),
                    },
                    "tts": {
                        "provider": tts_provider,
                        "model": tts_model,
                        "voice": tts_voice,
                        "api_key": tts_key,
                        "server_url": tts_server_url,
                    },
                }
                merged["stt_provider"] = stt_provider
                merged["stt_model"] = stt_model
                merged["stt_model_api_key"] = stt_key
                merged["stt_language"] = stt_language
                merged["stt_server_url"] = stt_server_url
                merged["llm_provider"] = llm_provider
                merged["llm_model"] = llm_model
                merged["llm_api_key"] = llm_key
                merged["llm_temperature"] = llm_temp
                merged["llm_max_output_tokens"] = llm_max_tokens
                merged["llm_server_url"] = llm_server_url
                merged["tts_provider"] = tts_provider
                merged["tts_model"] = tts_model
                merged["tts_voice"] = tts_voice
                merged["voice_id"] = tts_voice
                merged["tts_api_key"] = tts_key
                merged["tts_server_url"] = tts_server_url

            # Fallback flags default to False
            if "fallback_enabled" not in merged:
                merged["fallback_enabled"] = False
            if "fallback_stt_enabled" not in merged:
                merged["fallback_stt_enabled"] = False
            if "fallback_tts_enabled" not in merged:
                merged["fallback_tts_enabled"] = False

            return merged
        except Exception as e:
            logger.exception("Failed to get model config: %s", e)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get model config",
            )

    async def update_config(self, user_id: str, patch: ModelConfigSchema) -> dict:
        try:
            # Normalized field names (mode, llm_provider), extras preserved
            patch_dict = _normalize(patch.model_dump(exclude_unset=True))
            if not patch_dict:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="No fields to update",
                )

            # Sync model provider API keys to persistent .env and process environment
            for model_attr, env_var in MODEL_KEY_TO_ENV.items():
                key_val = patch_dict.get(model_attr)
                if key_val is not None and isinstance(key_val, str) and key_val.strip():
                    try:
                        _update_runtime_env(env_var, key_val.strip())
                        logger.info("Updated %s in runtime environment", env_var)
                    except Exception as env_err:
                        logger.warning("Could not update %s in runtime environment: %s", env_var, env_err)

            # Get previously stored config
            doc = self.db.find_one({"user_id": user_id}, {"_id": 0})
            stored = _normalize((doc or {}).get("config", {}))

            # Combine stored and patch, preserving user credentials if not re-sent
            combined = {**stored, **patch_dict}

            # Sanitize to save ONLY selected models for the active mode,
            # store fallbacks ONLY if enabled, and voice recognition ONLY if enabled.
            # LiveKit credentials are NEVER stored in MongoDB (loaded strictly from .env).
            clean_config = sanitize_model_config(combined)

            # Replace stored document config with clean, isolated configuration
            self.db.update_one(
                {"user_id": user_id},
                {"$set": {"user_id": user_id, "config": clean_config, "updated_at": _now_iso()}},
                upsert=True,
            )
            logger.info("Clean model config saved in MongoDB for user %s (mode=%s)", user_id, clean_config.get("mode"))
            return await self.get_config(user_id)
        except HTTPException:
            raise
        except Exception as e:
            logger.exception("Failed to update model config: %s", e)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update model config",
            )
