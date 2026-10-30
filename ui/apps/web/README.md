# Exia — Web Client (Next.js 15 & React 19)

> **[LEGACY during UI migration]** This Next.js app remains the production web
> client while the Expo/React Native migration (see `ui/README.md`) is in
> progress. It will be replaced by the Expo web export at Milestone 4.

The modern, responsive web application for **Exia**, the AI-powered Home Assistant and Voice Agent platform. This package is the single source of truth for the user interface across all three client form factors:
- **Web Browser** (`ui/apps/web` directly deployed or statically exported)
- **Android App** (`ui/apps/mobile` — Expo/React Native, replacing the retired Capacitor shell)
- **Windows Desktop App** (`ui/apps/windows` — React Native Windows, replacing the retired Tauri shell)

---

## 1. Key Capabilities & Features

- **LiveKit Realtime Voice Stage**: Sub-second bidirectional WebRTC voice streaming powered by `@livekit/components-react` and `@agents-ui`.
- **Dynamic Audio Visualizers**: 5 reactive visualizer styles (`wave`, `bar`, `grid`, `radial`, `aura`) adapting to agent listening, thinking, and speaking states.
- **Multimodal Video & Screen Share**: Camera and screen-sharing pipelines for visual perception.
- **Token Studio**: Direct in-browser cryptographic JWT minting and session registration with MongoDB Atlas.
- **MCP Server Hub**: In-app management, testing, and connection validation for Model Context Protocol servers (`stdio` & `sse`).
- **Model Selection & Parameters**: Configuration for Gemini Live, OpenAI, Ollama local models, voice personas, and temperature settings.
- **Prompt Library**: Customizable persona directives, task templates, and system prompts.
- **Session History & Analytics**: Session inspector displaying historical transcripts, token usage, latency, and participant metadata.
- **Dual-Theme Tactical UI**: High-contrast tactical dark mode (`#07090e`) with GN emerald accents, and crisp solar light mode.

---

## 2. Tech Stack

- **Framework**: Next.js 15 (App Router, Turbopack, static output mode)
- **Library**: React 19 & TypeScript
- **Styling**: Tailwind CSS v4, Lucide React, Phosphor Icons
- **Realtime**: LiveKit Client SDK (`livekit-client`, `@livekit/components-react`)
- **UI Primitives**: Radix UI primitives & `@shadcn/ui` components

---

## 3. Directory Layout

```
ui/apps/web/
├── app/                    # Next.js App Router entrypoint and layouts
│   ├── layout.tsx          # Root HTML layout with font declarations & ThemeProvider
│   └── page.tsx            # Main application orchestrator & view state router
├── components/
│   ├── agents-ui/          # LiveKit visualizers, control bars, session indicators
│   ├── app/                # Application state, view controller, welcome screen, theme toggle
│   ├── layout/             # Responsive AppShell, collapsible sidebar, mobile bottom dock
│   ├── screens/            # Screen views (voice, login, history, mcp, prompts, models, settings)
│   └── ui/                 # Accessible primitives (button, alert, bubble, toggle, select, sonner)
├── context/                # Authentication & session context
├── hooks/                  # Custom hooks (appearance, visualizers, debug telemetry)
├── lib/                    # Strongly typed API client (`api.ts`), constants, and types
├── public/                 # Static branding assets, icons, and favicon
└── styles/                 # Tailwind CSS v4 design tokens and theme variables
```

---

## 4. Development & Build Commands

```bash
# 1. Install dependencies
pnpm install # or npm install

# 2. Start development server with HMR (Turbopack)
pnpm dev # runs on http://localhost:3000

# 3. Compile production static export (outputs to ui/apps/web/out)
pnpm run build
```

The static export generated in `ui/apps/web/out` is automatically consumed by:
- `backend/dist` (static SPA fallback in FastAPI)

> The Capacitor (`ui/android`) and Tauri (`ui/windows`) shells were retired when
> the project adopted the Expo / React Native Windows stack — see `ui/README.md`.
