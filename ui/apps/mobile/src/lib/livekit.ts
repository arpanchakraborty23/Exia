import type { ModelConfig } from '@exia/shared-types';

/**
 * Pure helper (no native side effects): safe to import on any platform,
 * including web. Native side effects (`registerGlobals`) are confined to the
 * native-only voice route.
 */
export function liveKitOverridesFromConfig(config: ModelConfig) {
  const lk = config.livekit ?? {};
  return {
    url: lk.url || config.livekit_url || undefined,
    apiKey: lk.apiKey || config.livekit_api_key || undefined,
    apiSecret: lk.apiSecret || config.livekit_api_secret || undefined,
  };
}
