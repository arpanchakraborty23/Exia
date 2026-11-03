from typing import Any

from cryptography.fernet import Fernet, InvalidToken

ENCRYPTED_PREFIX = "enc:v1:"


def build_runtime_model_config(config: dict[str, Any], encryption_key: str) -> dict[str, Any]:
    """Return only the selected model mode and enabled fallback configuration."""
    config = decrypt_model_secrets(config, encryption_key)
    mode = str(config.get("mode") or config.get("pipeline_mode") or "gemini_live").lower()

    if mode in {"realtime", "gemini_live"}:
        realtime = config.get("realtime")
        realtime = realtime if isinstance(realtime, dict) else {}
        model_config = {
            "provider": realtime.get("provider") or config.get("realtime_model_provider") or "google",
            "model": realtime.get("model") or config.get("realtime_model") or config.get("gemini_model"),
            "voice": realtime.get("voice") or config.get("realtime_voice") or config.get("gemini_voice"),
            "api_key": realtime.get("api_key") or config.get("realtime_api_key"),
            "temperature": realtime.get("temperature")
            if realtime.get("temperature") is not None
            else config.get("realtime_model_temperature", config.get("temperature")),
            "max_output_tokens": realtime.get("max_output_tokens")
            if realtime.get("max_output_tokens") is not None
            else config.get("realtime_model_max_output_tokens", config.get("max_output_tokens")),
            "top_p": realtime.get("top_p")
            if realtime.get("top_p") is not None
            else config.get("realtime_model_top_p", config.get("top_p")),
            "system_prompt_override": realtime.get("system_prompt_override")
            or config.get("system_prompt_override"),
        }
        result: dict[str, Any] = {
            "mode": "realtime",
            "realtime": {
                key: value for key, value in model_config.items() if value is not None
            },
        }
    else:
        modular = config.get("modular")
        modular = modular if isinstance(modular, dict) else {}
        result = {"mode": "modular", "modular": {}}
        for component in ("stt", "llm", "tts"):
            section = modular.get(component)
            section = section if isinstance(section, dict) else {}
            result["modular"][component] = {
                key: value
                for key, value in section.items()
                if value is not None
            }

    fallback = config.get("fallback")
    fallback_enabled = config.get("fallback_enabled")
    if isinstance(fallback, dict) and fallback.get("enabled") is not None:
        fallback_enabled = fallback.get("enabled")
    if fallback_enabled:
        result["fallback"] = fallback if isinstance(fallback, dict) else {
            key.removeprefix("fallback_"): value
            for key, value in config.items()
            if key.startswith("fallback_")
        }

    return result


def decrypt_model_secrets(value: Any, key: str) -> Any:
    if isinstance(value, dict):
        return {
            name: _decrypt_secret(name, item, key)
            for name, item in value.items()
        }
    if isinstance(value, list):
        return [decrypt_model_secrets(item, key) for item in value]
    return value


def _decrypt_secret(name: str, value: Any, key: str) -> Any:
    if name == "api_keys" and isinstance(value, dict):
        return {
            provider: _decrypt_secret("api_key", secret, key)
            for provider, secret in value.items()
        }
    if name == "api_key" or name.endswith("_api_key"):
        if not isinstance(value, str) or not value.startswith(ENCRYPTED_PREFIX):
            return value
        if not key:
            raise ValueError(
                "MODEL_CONFIG_ENCRYPTION_KEY is required to decrypt model API keys."
            )
        try:
            token = value[len(ENCRYPTED_PREFIX):].encode("ascii")
            return Fernet(key.encode("ascii")).decrypt(token).decode("utf-8")
        except (InvalidToken, ValueError, UnicodeEncodeError) as exc:
            raise ValueError(
                "Could not decrypt a model API key; verify MODEL_CONFIG_ENCRYPTION_KEY."
            ) from exc
    return decrypt_model_secrets(value, key)
