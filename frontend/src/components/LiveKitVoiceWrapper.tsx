import React from 'react';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  BarVisualizer,
  useVoiceAssistant,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { AgentStatus, ChatMessage, LiveKitConfig } from '../types';
import { VoiceAssistantView } from './VoiceAssistantView';

interface LiveKitVoiceWrapperProps {
  agentStatus: AgentStatus;
  setAgentStatus: (status: AgentStatus) => void;
  isLiveKitConnected: boolean;
  onToggleVoice: () => void;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  liveKitConfig: LiveKitConfig;
}

// Inner component when inside an active LiveKitRoom
const ActiveLiveKitRoomInner: React.FC<{
  agentStatus: AgentStatus;
  setAgentStatus: (status: AgentStatus) => void;
  onToggleVoice: () => void;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  liveKitConfig: LiveKitConfig;
}> = (props) => {
  // useVoiceAssistant hook provides agent track and state
  const { state: lkAgentState, audioTrack } = useVoiceAssistant();

  React.useEffect(() => {
    if (lkAgentState === 'speaking') props.setAgentStatus('speaking');
    else if (lkAgentState === 'listening') props.setAgentStatus('listening');
    else if (lkAgentState === 'thinking') props.setAgentStatus('thinking');
  }, [lkAgentState, props.setAgentStatus]);

  return (
    <div className="h-full flex flex-col">
      {/* LiveKit Room-wide audio renderer */}
      <RoomAudioRenderer />

      {/* Floating real LiveKit Bar Visualizer if audio track is active */}
      {audioTrack && (
        <div className="absolute top-20 right-8 z-20 bg-zinc-950/90 border border-indigo-500/40 p-2.5 rounded-xl flex items-center gap-2 shadow-lg">
          <span className="text-[10px] text-indigo-400 font-mono">LiveKit Audio:</span>
          <div className="w-24 h-6">
            <BarVisualizer state={lkAgentState} trackRef={audioTrack} barCount={7} />
          </div>
        </div>
      )}

      <VoiceAssistantView {...props} isLiveKitConnected={true} />
    </div>
  );
};

export const LiveKitVoiceWrapper: React.FC<LiveKitVoiceWrapperProps> = (props) => {
  // If LiveKit token & server URL are provided and connected, render within LiveKitRoom
  if (props.isLiveKitConnected && props.liveKitConfig.token && props.liveKitConfig.serverUrl) {
    return (
      <LiveKitRoom
        token={props.liveKitConfig.token}
        serverUrl={props.liveKitConfig.serverUrl}
        connect={true}
        audio={true}
        video={false}
        data-lk-theme="default"
        onError={(err) => {
          console.error('LiveKit connection error:', err);
        }}
        onDisconnected={() => {
          props.onToggleVoice();
        }}
      >
        <ActiveLiveKitRoomInner {...props} />
      </LiveKitRoom>
    );
  }

  // Standby / Local Voice Simulation Mode
  return <VoiceAssistantView {...props} />;
};
