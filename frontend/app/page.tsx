import { App } from '@/components/app/app';

export default function Page() {
  return (
    <App
      agentName={process.env.NEXT_PUBLIC_AGENT_NAME}
      isVideoInputSupported={false}
    />
  );
}

