import asyncio
import json
import logging
import os
from dotenv import load_dotenv
from livekit import agents, rtc
from livekit.agents import JobContext, WorkerOptions, cli, llm
from livekit.agents.voice_assistant import VoiceAssistant
from livekit.plugins import openai, silero

from db import db_manager
from mcp_manager import mcp_manager

# Mem0 - Universal Memory Layer
try:
    from mem0 import Memory
    MEM0_AVAILABLE = True
except ImportError:
    MEM0_AVAILABLE = False

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("home-assistant-agent")

async def entrypoint(ctx: JobContext):
    """
    LiveKit Agent Entrypoint.
    Connects to:
      1) MongoDB Atlas for persistent state and tasks
      2) Mem0 for semantic user memory
      3) MCP servers dynamically passed via token
    Registers TWO core tools:
      - search_mcp_tools: Discover available tools and inspect their schemas
      - execute_mcp_tool: Execute an MCP tool with parameters
    """
    logger.info(f"Connecting to LiveKit room: {ctx.room.name}")
    await ctx.connect()

    # 1. Connect to MongoDB Atlas
    mongo_connected = await db_manager.connect()
    if mongo_connected:
        logger.info("MongoDB Atlas connected and ready for tasks & logs.")

    # 2. Wait for user participant
    participant = await ctx.wait_for_participant()
    logger.info(f"Participant joined: {participant.identity}")

    # 3. Parse token metadata (Model, MCP servers, Mem0 config)
    metadata = {}
    if participant.metadata:
        try:
            metadata = json.loads(participant.metadata)
        except Exception as e:
            logger.warning(f"Could not parse token metadata: {e}")

    model_config = metadata.get("model_config", {})
    mcp_servers = metadata.get("mcp_servers", [])
    memory_config = metadata.get("memory_config", {})
    voice_config = metadata.get("voice_config", {})

    provider = model_config.get("provider", "ollama")
    model_name = model_config.get("model", "llama3.2:latest")
    temperature = model_config.get("temperature", 0.7)
    base_url = model_config.get("base_url", "http://localhost:11434/v1")
    user_id = memory_config.get("user_id", participant.identity)

    # 4. Load MCP servers from MongoDB Atlas (Clean architecture: no token bloat)
    db_mcp_servers = await db_manager.get_mcp_servers()
    if db_mcp_servers:
        mcp_servers = db_mcp_servers
        logger.info(f"Loaded {len(mcp_servers)} MCP servers directly from MongoDB Atlas 'mcp_servers' collection.")
    else:
        logger.info(f"Using {len(mcp_servers)} MCP servers from metadata/fallback.")
    mcp_manager.load_servers_from_metadata(mcp_servers)

    # 5. Initialize Mem0 Memory with SQLite
    mem0_instance = None
    sqlite_db_path = memory_config.get("local_storage_path", "./memory.db")
    if not sqlite_db_path.endswith(".db"):
        sqlite_db_path = "./memory.db"

    if MEM0_AVAILABLE:
        try:
            # Mem0 with SQLite history store & local vector indexing
            mem0_cfg = {
                "vector_store": {
                    "provider": "qdrant",
                    "config": {
                        "path": "./mem0_sqlite_vectors",
                    }
                },
                "history_store": {
                    "provider": "sqlite",
                    "config": {
                        "db_path": sqlite_db_path
                    }
                }
            }
            mem0_instance = Memory.from_config(mem0_cfg)
            logger.info(f"✅ Mem0 Memory initialized using SQLite: '{sqlite_db_path}'")
        except Exception as e:
            logger.warning(f"Mem0 SQLite initialization note: {e}.")

    # =========================================================================
    # 6. REGISTER THE TWO REQUIRED MCP TOOLS (SEARCH + EXECUTE)
    # =========================================================================
    fnc_ctx = llm.FunctionContext()

    @fnc_ctx.ai_callable(
        description=(
            "Discover which MCP tools are available across all connected servers. "
            "Returns tool names, server names, descriptions, and expected parameter schemas. "
            "Always call this first when the user asks for actions or external tools."
        )
    )
    def search_mcp_tools(
        query: str = ""
    ) -> str:
        """
        Tool 1: Search and inspect available MCP tools.
        """
        logger.info(f"🔍 [Tool 1] search_mcp_tools called with query='{query}'")
        res = mcp_manager.search_mcp_tools(query)
        return json.dumps(res)

    @fnc_ctx.ai_callable(
        description=(
            "Execute an MCP tool on a specific server using its tool name and arguments. "
            "Call 'search_mcp_tools' first to get the server_name and argument schema."
        )
    )
    async def execute_mcp_tool(
        server_name: str,
        tool_name: str,
        arguments_json: str = "{}"
    ) -> str:
        """
        Tool 2: Execute an MCP tool client.
        """
        logger.info(f"⚙️ [Tool 2] execute_mcp_tool called: server='{server_name}', tool='{tool_name}', args={arguments_json}")
        try:
            args = json.loads(arguments_json) if isinstance(arguments_json, str) else arguments_json
        except Exception:
            args = {}
        res = await mcp_manager.execute_mcp_tool(server_name, tool_name, args)
        return json.dumps(res)

    # =========================================================================
    # 7. CONFIGURE DYNAMIC LLM
    # =========================================================================
    if provider == "ollama" or provider == "lmstudio":
        llm_instance = openai.LLM(
            model=model_name,
            base_url=base_url,
            api_key=os.getenv("OPENAI_API_KEY", "ollama"),
            temperature=temperature
        )
    else:
        llm_instance = openai.LLM(
            model=model_name or "gpt-4o-mini",
            temperature=temperature
        )

    # 8. BUILD MULTIMODAL VOICE & VISION ASSISTANT
    latest_video_frame = None

    @ctx.room.on("track_subscribed")
    def on_track_subscribed(
        track: rtc.Track,
        publication: rtc.TrackPublication,
        participant: rtc.RemoteParticipant,
    ):
        if track.kind == rtc.TrackKind.KIND_VIDEO:
            source_name = "Camera" if track.source == rtc.TrackSource.SOURCE_CAMERA else "ScreenShare"
            logger.info(f"📸 [Multimodal] Subscribed to user video track: {track.sid} ({source_name})")
            asyncio.create_task(_stream_video_frames(track, source_name))

    async def _stream_video_frames(video_track: rtc.RemoteVideoTrack, source_name: str):
        nonlocal latest_video_frame
        try:
            video_stream = rtc.VideoStream(video_track)
            async for event in video_stream:
                latest_video_frame = event.frame
        except Exception as e:
            logger.warning(f"Video stream {source_name} stopped: {e}")

    @fnc_ctx.ai_callable(
        description="Inspect the user's live camera or screen share feed. Call this whenever the user asks 'What do you see?', 'Can you see this?', or shows something via camera or screen."
    )
    def inspect_visual_feed() -> str:
        """Inspect the current video feed from the user's camera or screen."""
        if latest_video_frame is not None:
            return (
                f"User video is actively streaming ({latest_video_frame.width}x{latest_video_frame.height}). "
                "The agent has live visual input of the user's camera/screen."
            )
        return "Camera or screen feed is currently off. Ask the user to click the camera button to enable video."

    system_prompt = (
        f"You are an advanced multimodal private desktop home assistant powered by {model_name}. "
        "You can hear the user and see their video when they turn on their camera or share their screen. "
        "When the user shares video or asks what you see, describe and acknowledge what is visible. "
        "You have access to MCP operations and visual inspection:\n"
        "1. 'inspect_visual_feed': Check and inspect what is currently visible on camera or screen.\n"
        "2. 'search_mcp_tools': Call this first to discover external tools.\n"
        "3. 'execute_mcp_tool': Call this to execute a tool with arguments matching its schema.\n"
        "You also use Mem0 for user memory and MongoDB Atlas for tasks. Keep answers conversational and concise for voice."
    )

    chat_ctx = openai.ChatContext().append(role="system", text=system_prompt)

    assistant = VoiceAssistant(
        vad=silero.VAD.load(),
        stt=openai.STT(),
        llm=llm_instance,
        tts=openai.TTS(voice=voice_config.get("voice", "alloy")),
        chat_ctx=chat_ctx,
        fnc_ctx=fnc_ctx, # Attached tools!
    )

    # Mem0 memory hook: search memories before speaking
    @assistant.on("user_speech_committed")
    def on_user_speech(msg: str):
        if mem0_instance:
            try:
                relevant = mem0_instance.search(msg, user_id=user_id, limit=3)
                if relevant:
                    mem_texts = [r.get("memory", "") for r in relevant if r.get("memory")]
                    if mem_texts:
                        logger.info(f"Injecting Mem0 context: {mem_texts}")
                        chat_ctx.append(
                            role="system",
                            text=f"[Mem0 User Context]: {' | '.join(mem_texts)}"
                        )
                # Store user interaction in Mem0
                mem0_instance.add(msg, user_id=user_id)
            except Exception as e:
                logger.error(f"Mem0 error: {e}")

    # Start voice session
    assistant.start(ctx.room, participant)
    await assistant.say(
        f"Hello! Multimodal agent running with {model_name}. Camera, screen share, MongoDB, Mem0, and MCP tools are ready.",
        allow_interruptions=True
    )

if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))
