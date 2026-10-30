/**
 * LiveKit native bootstrap.
 *
 * `registerGlobals()` installs the react-native-webrtc polyfills
 * (getUserMedia, RTCPeerConnection, …) that livekit-client needs on native.
 * It must run before any livekit-client usage, so it is called here at module
 * scope — import this module first in the voice session route
 * (Expo-quickstart pattern).
 */
import { registerGlobals } from '@livekit/react-native';
import type { ModelConfig } from '@exia/shared-types';

registerGlobals();

/**
 * LiveKit credential overrides extracted from the stored model config —
 * same fields the Settings tab persists and the legacy web client read from
 * its `exia_unified_model_config` local storage key.
 */
export function liveKitOverridesFromConfig(config: ModelConfig) {
  const lk = config.livekit ?? {};
  return {
    url: lk.url || config.livekit_url || undefined,
    apiKey: lk.apiKey || config.livekit_api_key || undefined,
    apiSecret: lk.apiSecret || config.livekit_api_secret || undefined,
  };
}
