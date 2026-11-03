# Exia — Remote Desktop & Local MCP Architecture Specification
**Two-Tier System: Cloud Voice Orchestrator + On-Device Tool Engine (Cactus Needle 3 + Scoped Local MCP)**

---

## 1. System Overview & The Needle 3 Advantage

Exia divides cognitive responsibilities into two distinct, highly-specialized layers:

```
┌────────────────────────────────────────────────────────────────────────┐
│               TIER 1: CLOUD VOICE ORCHESTRATOR (LiveKit + Cloud LLM)   │
│                                                                        │
│   • Conversational UI, Voice Tone & Spoken Persona (Gemini Live)       │
│   • High-level reasoning, empathy, and multi-turn voice memory        │
│   • Dispatches high-level intents (e.g. "Organize downloads")          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                       LiveKit WebRTC Data Channel (Outbound)
                       Topic: "exia.local_task" · Reliable DTLS/SCTP
                       Payload: { "intent": "Move PDFs to Documents" }
                                    │
┌───────────────────────────────────┼────────────────────────────────────┐
│      TIER 2: ON-DEVICE TOOL EXECUTOR (Cactus Needle 3 Engine)           │
│                                   ▼                                    │
│   • Model: Cactus Needle 3 (Ultra-compact 8 MB – 29 MB footprint)      │
│   • Architecture: 29M–121M Parameter Laddered Attention Network        │
│   • Execution: 100% On-Device CPU / Edge Inference (<50ms latency)     │
│   • Grammar-Gated Decoding: 100% syntactically guaranteed JSON schemas │
│                                   │                                    │
│                    ┌──────────────┴──────────────┐                     │
│                    ▼                             ▼                     │
│       [Scoped Local MCP Tools]      [Fallback GUI Automation]          │
│       • Filesystem MCP (whitelisted) • agent-desktop (Windows UIA)     │
│       • Browser / Chrome DevTools   • System Settings / Apps           │
│                                                                        │
│   • Emits completion results back to Cloud Voice Agent via WebRTC      │
└────────────────────────────────────────────────────────────────────────┘
```

---

### Why Cactus Needle 3 is a Revolutionary Fit for Exia:

| Feature | Standard Local LLMs (3B–8B) | Cactus Needle 3 (29M–121M) |
| :--- | :--- | :--- |
| **Footprint** | 2 GB to 6 GB (heavy VRAM/RAM) | **8 MB to 29 MB** (runs on any PC/laptop) |
| **Focus** | General chat, creative writing | **Dedicated Tool Calling & Data Extraction** |
| **Output Validity** | Can hallucinate parameters or break JSON | **Byte-Level Grammar Constrained** (100% valid JSON) |
| **Inference Latency** | 300ms – 1,500ms per tool turn | **< 50ms** on standard CPU |
| **Hardware Reqs** | Dedicated GPU / Heavy CPU | **Zero GPU required** — runs inside client process |

---

## 2. Tier 1: Cloud Voice Agent Tool (`agent/agent.py`)

The Cloud Voice Agent (Gemini Live) does not micromanage local files or Windows UI trees. It invokes a single high-level dispatch tool:

```python
@fnc_ctx.ai_callable(
    description=(
        "Delegate a desktop or local system task to the user's on-device Needle 3 executor. "
        "Use this for file management, desktop app clicks, or local web automation. "
        "State the exact goal clearly."
    )
)
async def delegate_local_task(
    intent: str,
    parameters_hint: str = "",
) -> str:
    """Delegates a high-level intent to the on-device Needle 3 engine."""
    logger.info(f"🚀 [Orchestrator] Delegating intent to Needle 3: '{intent}'")
    
    result = await local_task_bridge.send_task(
        intent=intent,
        parameters=parameters_hint,
        timeout=30.0
    )
    return json.dumps(result)
```

---

## 3. Tier 2: On-Device Needle 3 Execution (`desktop/`)

Because Needle 3 is only 8–29 MB, it can be bundled directly with Exia's desktop client (or run via lightweight ONNX / C++ runtime locally).

### 3.1 Grammar-Constrained Tool Invocation
Needle 3 compiles the schemas of the available Local MCP tools (`filesystem`, `agent-desktop`) into a byte-level decoding grammar:

```
[User Intent from Cloud]: "Move all invoices to C:/Accounting"
                      │
                      ▼
[Cactus Needle 3 Engine (<50ms)]:
• Evaluates available tool schemas
• Grammar constraint prevents syntax errors
• Emits exact function call:
  filesystem:move_files({
    "source_pattern": "*.pdf",
    "filter_keyword": "invoice",
    "destination": "C:/Accounting"
  })
                      │
                      ▼
[Execution on Local Hard Drive]: Executed in 10ms
                      │
                      ▼
[Return to Cloud]: "Successfully moved 4 invoices to C:/Accounting"
```

### 3.2 JavaScript Bridge in Desktop Client (`desktop/needleRunner.js`)

```javascript
import { RoomEvent } from "livekit-client";
// Cactus runtime or local ONNX / WASM runner for Needle 3
import { Needle3Engine } from "@cactus/needle3-runtime";

const needle = new Needle3Engine({
  modelPath: "./models/needle3-121m.bin", // ~29MB
  tools: [
    {
      name: "desktop_click",
      description: "Click an element by @ref in Windows",
      parameters: { type: "object", properties: { ref: { type: "string" } }, required: ["ref"] }
    },
    {
      name: "fs_move",
      description: "Move files matching pattern",
      parameters: { type: "object", properties: { src: { type: "string" }, dest: { type: "string" } } }
    }
  ]
});

export function setupNeedle3Executor(room) {
  room.on(RoomEvent.DataReceived, async (payload, participant, kind, topic) => {
    if (topic !== "exia.local_task") return;

    const { request_id, intent } = JSON.parse(new TextDecoder().decode(payload));
    console.log(`⚡ [Needle 3] Processing intent: "${intent}"`);

    // 1. Run ultra-fast grammar-constrained tool selection (<50ms)
    const toolCall = await needle.predictToolCall(intent);

    // 2. Execute against local MCP / agent-desktop
    const result = await executeLocalTool(toolCall.name, toolCall.args);

    // 3. Send structured report back to Cloud Agent
    const response = {
      type: "exia_local_task_completed",
      request_id,
      status: "success",
      summary: result.summary
    };

    await room.localParticipant.publishData(
      new TextEncoder().encode(JSON.stringify(response)),
      { topic: "exia.local_task", reliable: true }
    );
  });
}
```

---

## 4. End-to-End Synergy

1. **Cloud Voice Agent (Gemini Live):** The charismatic, natural voice of Exia talking to you with zero lag.
2. **LiveKit WebRTC Channel:** The private, real-time message bus between cloud and home.
3. **Cactus Needle 3 (8–29 MB on your PC):** The hyper-efficient local translator that maps your voice intents to local MCP tools with 100% grammar accuracy.
4. **Local Tools (`agent-desktop` + Filesystem MCP):** The native hands interacting with your files and Windows software.
