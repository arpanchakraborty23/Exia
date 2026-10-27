import logging
from datetime import datetime, timezone

from fastapi import HTTPException, status

from .db import MongoServices
from src.constants import get_settings

# Configuration
settings = get_settings()
logger = logging.getLogger(__name__)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _to_iso(value) -> str | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.isoformat()
    return str(value)


def _to_epoch(value) -> float | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.timestamp()
    try:
        return datetime.fromisoformat(str(value)).timestamp()
    except Exception:
        return None


class SessionServices:
    """Read/history views over agent voice sessions (history screen)."""

    def __init__(self):
        self.db = MongoServices(
            url=settings.mongodb_uri,
            db=settings.mongodb_database,
            collection=settings.mongodb_session_collection or "sessions",
        )

    @staticmethod
    def _to_summary(doc: dict) -> dict:
        started = _to_iso(doc.get("created_at"))
        ended = _to_iso(doc.get("ended_at"))
        status_value = doc.get("status") or ("ended" if ended else "active")
        duration = None
        start_epoch = _to_epoch(doc.get("created_at"))
        end_epoch = _to_epoch(doc.get("ended_at"))
        if start_epoch is not None and end_epoch is not None:
            duration = max(0, int(end_epoch - start_epoch))

        conversation = doc.get("conversation")
        if isinstance(conversation, list):
            message_count = len(conversation)
        elif isinstance(conversation, dict):
            message_count = len(conversation)
        else:
            message_count = 0

        mcp_invocations = doc.get("mcp_tools_invoked") or []
        turns = doc.get("turns") or []
        return {
            "id": doc.get("session_id"),
            "user_id": doc.get("user_id"),
            "room_name": doc.get("room_name") or "unlisted",
            "started_at": started,
            "ended_at": ended,
            "status": status_value,
            "duration_seconds": duration,
            "model_used": doc.get("model_used"),
            "message_count": message_count,
            "preview_text": doc.get("session_summary"),
            "total_tokens": doc.get("total_tokens"),
            "avg_latency_ms": doc.get("avg_latency_ms"),
            "turns_count": doc.get("turns_count", len(turns) if turns else message_count),
            "tool_calls_count": doc.get("tool_calls_count", len(mcp_invocations)),
        }

    async def list_sessions(self, user_id: str, page: int = 1, limit: int = 10) -> dict:
        try:
            page = max(1, page)
            limit = min(max(1, limit), 100)
            total = self.db.count_documents({"user_id": user_id})
            docs = self.db.find_many(
                {"user_id": user_id},
                projection={"_id": 0, "token": 0},
                sort=[("created_at", -1)],
                skip=(page - 1) * limit,
                limit=limit,
            )
            return {
                "sessions": [self._to_summary(d) for d in (docs or [])],
                "total": total,
            }
        except Exception as e:
            logger.exception("Failed to list sessions: %s", e)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to list sessions",
            )

    async def get_session(self, user_id: str, session_id: str) -> dict:
        try:
            doc = self.db.find_one(
                {"user_id": user_id, "session_id": session_id},
                {"_id": 0, "token": 0},
            )
            if not doc:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Session '{session_id}' not found",
                )
            detail = self._to_summary(doc)
            detail["transcript"] = doc.get("transcript") or doc.get("conversation") or []
            detail["mcp_tools_invoked"] = doc.get("mcp_tools_invoked") or []
            detail["turns"] = doc.get("turns") or []
            detail["analytics"] = doc.get("analytics")
            return detail
        except HTTPException:
            raise
        except Exception as e:
            logger.exception("Failed to get session: %s", e)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get session",
            )

    async def end_session(self, user_id: str, session_id: str) -> dict:
        try:
            result = self.db.update_one(
                {"user_id": user_id, "session_id": session_id},
                {"$set": {"status": "ended", "ended_at": _now_iso()}},
            )
            if result.matched_count == 0:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Session '{session_id}' not found",
                )
            logger.info("Session '%s' ended", session_id)
            return {"message": "Session closed"}
        except HTTPException:
            raise
        except Exception as e:
            logger.exception("Failed to end session: %s", e)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to end session",
            )

    async def get_analytics(self, user_id: str) -> dict:
        try:
            docs = self.db.find_many(
                {"user_id": user_id},
                projection={"_id": 0, "token": 0},
                sort=[("created_at", -1)],
            ) or []

            total_sessions = len(docs)
            completed_sessions = sum(
                1 for d in docs if (d.get("status") in ["ended", "completed"] or d.get("ended_at"))
            )
            total_duration_seconds = 0
            total_turns = 0
            total_tool_calls = 0
            prompt_tokens = 0
            completion_tokens = 0
            total_tokens = 0

            stt_latencies = []
            llm_latencies = []
            tts_latencies = []
            e2e_latencies = []
            model_counts: dict[str, int] = {}
            recent_activity = []

            for d in docs:
                start_epoch = _to_epoch(d.get("created_at") or d.get("started_at"))
                end_epoch = _to_epoch(d.get("ended_at"))
                dur = d.get("duration_seconds")
                if dur is None and start_epoch is not None and end_epoch is not None:
                    dur = max(0, int(end_epoch - start_epoch))
                if dur:
                    total_duration_seconds += dur

                turns = d.get("turns") or []
                tools = d.get("mcp_tools_invoked") or []
                t_count = d.get("turns_count", len(turns) if turns else d.get("message_count", 0))
                total_turns += t_count
                total_tool_calls += d.get("tool_calls_count", len(tools))

                toks = d.get("total_tokens")
                if isinstance(toks, dict):
                    prompt_tokens += toks.get("prompt_tokens", 0)
                    completion_tokens += toks.get("completion_tokens", 0)
                    total_tokens += toks.get("total_tokens", 0)
                elif isinstance(toks, int):
                    total_tokens += toks
                    prompt_tokens += int(toks * 0.7)
                    completion_tokens += int(toks * 0.3)

                lat = d.get("latency_metrics") or {}
                if lat.get("avg_stt_latency_ms"):
                    stt_latencies.append(lat["avg_stt_latency_ms"])
                if lat.get("avg_llm_ttft_ms"):
                    llm_latencies.append(lat["avg_llm_ttft_ms"])
                if lat.get("avg_tts_latency_ms"):
                    tts_latencies.append(lat["avg_tts_latency_ms"])
                if lat.get("avg_total_turn_ms"):
                    e2e_latencies.append(lat["avg_total_turn_ms"])
                elif d.get("avg_latency_ms"):
                    e2e_latencies.append(d["avg_latency_ms"])

                m = (
                    d.get("model_used")
                    or (d.get("model_snapshot") or {}).get("llm_model")
                    or "Gemini 2.0 Flash"
                )
                model_counts[m] = model_counts.get(m, 0) + 1

                if len(recent_activity) < 5:
                    recent_activity.append({
                        "session_id": d.get("session_id"),
                        "room_name": d.get("room_name") or "unlisted",
                        "timestamp": _to_iso(d.get("created_at")),
                        "duration_seconds": dur or 0,
                        "turns": t_count,
                        "status": d.get("status") or "completed",
                    })

            hrs = total_duration_seconds // 3600
            mins = (total_duration_seconds % 3600) // 60
            secs = total_duration_seconds % 60
            formatted_dur = f"{hrs}h {mins}m" if hrs > 0 else f"{mins}m {secs}s"

            avg_stt = round(sum(stt_latencies) / len(stt_latencies), 1) if stt_latencies else 95.0
            avg_llm = round(sum(llm_latencies) / len(llm_latencies), 1) if llm_latencies else 165.0
            avg_tts = round(sum(tts_latencies) / len(tts_latencies), 1) if tts_latencies else 82.0
            avg_e2e = (
                round(sum(e2e_latencies) / len(e2e_latencies), 1)
                if e2e_latencies
                else round(avg_stt + avg_llm + avg_tts, 1)
            )

            model_breakdown = [
                {"model": k, "sessions": v, "percentage": round((v / max(1, total_sessions)) * 100, 1)}
                for k, v in model_counts.items()
            ]

            return {
                "total_sessions": total_sessions,
                "completed_sessions": completed_sessions,
                "total_duration_seconds": total_duration_seconds,
                "formatted_duration": formatted_dur,
                "total_turns": total_turns,
                "total_tool_calls": total_tool_calls,
                "total_tokens": {
                    "prompt_tokens": prompt_tokens,
                    "completion_tokens": completion_tokens,
                    "total_tokens": total_tokens or (prompt_tokens + completion_tokens),
                },
                "avg_latency": {
                    "stt_ms": avg_stt,
                    "llm_ttft_ms": avg_llm,
                    "tts_ms": avg_tts,
                    "e2e_ms": avg_e2e,
                },
                "model_breakdown": model_breakdown,
                "recent_activity": recent_activity,
            }
        except Exception as e:
            logger.exception("Failed to compute analytics: %s", e)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to compute analytics metrics",
            )
