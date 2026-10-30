export {
  ApiError,
  InMemoryTokenStorage,
  createRequestFn,
  type ApiClientOptions,
  type RequestFn,
  type TokenStorage,
} from './client';

export { createApi, DEFAULT_MODEL_CONFIG, type Api, type LiveKitOverrides } from './endpoints';

import { createRequestFn, type ApiClientOptions } from './client';
import { createApi } from './endpoints';

/** Convenience factory: client + endpoints in one call. */
export function createApiClient(options: ApiClientOptions) {
  return createApi(createRequestFn(options));
}
