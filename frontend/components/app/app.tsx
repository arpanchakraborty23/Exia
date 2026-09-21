'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { TokenSource } from 'livekit-client';
import { Loader2 } from 'lucide-react';
import { useSession } from '@livekit/components-react';
import { WarningIcon } from '@phosphor-icons/react/dist/ssr';
import { AgentSessionProvider } from '@/components/agents-ui/agent-session-provider';
import { StartAudioButton } from '@/components/agents-ui/start-audio-button';
import { ViewController } from '@/components/app/view-controller';
import { AppShell } from '@/components/layout/app-shell';
import { NavTab } from '@/components/layout/sidebar';
import { HistoryView } from '@/components/screens/history-view';
import { LoginView } from '@/components/screens/login-view';
import { MCPView } from '@/components/screens/mcp-view';
import { ModelSelectionView } from '@/components/screens/model-selection-view';
import { PromptsView } from '@/components/screens/prompts-view';
import { SettingsView } from '@/components/screens/settings-view';
import { Toaster } from '@/components/ui/sonner';
import { useAuth } from '@/context/auth-context';
import { useAgentErrors } from '@/hooks/useAgentErrors';
import { useDebugMode } from '@/hooks/useDebug';
import { api } from '@/lib/api';

const IN_DEVELOPMENT = process.env.NODE_ENV !== 'production';

function AppSetup() {
  useDebugMode({ enabled: IN_DEVELOPMENT });
  useAgentErrors();

  return null;
}

interface AppProps {
  agentName?: string;
  isVideoInputSupported?: boolean;
}

export function App({ agentName, isVideoInputSupported = true }: AppProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavTab>('session');
  const [visualizerType, setVisualizerType] = useState<'aura' | 'wave' | 'bar' | 'radial'>('aura');
  const activeSessionIdRef = useRef<string | null>(null);

  // LiveKit token is fetched directly from the FastAPI backend (POST /livekit/token or POST /agent/token)
  const tokenSource = useMemo(
    () =>
      TokenSource.custom(async () => {
        const data = await api.livekit.getToken();
        activeSessionIdRef.current = data.session_id;
        return {
          serverUrl: data.server_url,
          participantToken: data.token,
        };
      }),
    []
  );

  const session = useSession(tokenSource, agentName ? { agentName } : undefined);

  // Auto-cleanup backend session when LiveKit disconnects, preserving exact stock components
  useEffect(() => {
    if (!session.isConnected && activeSessionIdRef.current) {
      api.livekit.endSession(activeSessionIdRef.current).catch((err) => {
        console.warn('Backend endSession call:', err);
      });
      activeSessionIdRef.current = null;
    }
  }, [session.isConnected]);

  // Auth Loading
  if (isLoading) {
    return (
      <div className="bg-background text-muted-foreground flex h-screen w-screen flex-col items-center justify-center gap-3">
        <Loader2 className="text-primary size-8 animate-spin" />
        <p className="text-xs font-medium">Loading Home Assistant...</p>
      </div>
    );
  }

  // Auth Guard: Redirect / show Login if not authenticated
  if (!isAuthenticated) {
    return <LoginView onSuccess={() => setCurrentTab('session')} />;
  }

  return (
    <AgentSessionProvider session={session}>
      <AppSetup />
      <AppShell
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isCallActive={session.isConnected}
      >
        {/* Screen 2: Voice Session Stage */}
        {currentTab === 'session' && (
          <div className="relative h-full w-full">
            <ViewController
              isVideoInputSupported={isVideoInputSupported}
              visualizerType={visualizerType}
            />
          </div>
        )}

        {/* Screen 3: Session History */}
        {currentTab === 'history' && <HistoryView />}

        {/* Screen 4: MCP Servers */}
        {currentTab === 'mcp' && <MCPView />}

        {/* Screen 5: Prompts Library */}
        {currentTab === 'prompts' && <PromptsView />}

        {/* Screen 6: Model Selection */}
        {currentTab === 'models' && <ModelSelectionView />}

        {/* Screen 7: Settings & Account */}
        {currentTab === 'settings' && (
          <SettingsView
            visualizerType={visualizerType}
            onChangeVisualizerType={(type: string) =>
              setVisualizerType(type as 'aura' | 'wave' | 'bar' | 'radial')
            }
          />
        )}
      </AppShell>
      <StartAudioButton label="Start Audio" />
      <Toaster
        icons={{
          warning: <WarningIcon weight="bold" />,
        }}
        position="top-center"
        className="toaster group"
        style={
          {
            '--normal-bg': 'var(--popover)',
            '--normal-text': 'var(--popover-foreground)',
            '--normal-border': 'var(--border)',
          } as React.CSSProperties
        }
      />
    </AgentSessionProvider>
  );
}
