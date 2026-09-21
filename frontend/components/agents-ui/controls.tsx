'use client';

import { TokenSource } from 'livekit-client';
import { useSession } from '@livekit/components-react';
import { AgentControlBar } from '@/components/agents-ui/agent-control-bar';
import { AgentSessionProvider } from '@/components/agents-ui/agent-session-provider';

const TOKEN_SOURCE = TokenSource.endpoint('/api/token');

export function Controls() {
  const session = useSession(TOKEN_SOURCE);

  return (
    <AgentSessionProvider session={session}>
      <AgentControlBar
        variant="livekit"
        isChatOpen={false}
        isConnected={true}
        controls={{
          microphone: true,
          camera: true,
          screenShare: true,
          chat: true,
          leave: true,
        }}
      />
    </AgentSessionProvider>
  );
}
