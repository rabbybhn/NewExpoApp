/**
 * Runtime configuration. Values are read from `EXPO_PUBLIC_*` env vars (see `.env.example`).
 *
 * NOTE: anything prefixed with `EXPO_PUBLIC_` is inlined into the JS bundle. Shipping a raw
 * OpenAI key in a store build exposes it to anyone who unpacks the app — for production, set
 * `EXPO_PUBLIC_PLANTID_API_URL` to your own backend proxy and leave the OpenAI key unset.
 */
export const config = {
  openAiApiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? '',
  openAiModel: process.env.EXPO_PUBLIC_OPENAI_MODEL || 'gpt-4o-mini',
  proxyUrl: process.env.EXPO_PUBLIC_PLANTID_API_URL ?? '',
  requestTimeoutMs: 45_000,
  /** Longest edge (px) of the image sent to the model. Keeps uploads small and fast. */
  maxImageDimension: 1024,
} as const;

const PACK_PRICE_USD = 1.99;

export const credits = {
  freeStarter: 3,
  packSize: 20,
  packPriceUsd: PACK_PRICE_USD,
  packPrice: `$${PACK_PRICE_USD.toFixed(2)}`,
  packName: 'Green Thumb Pack',
} as const;
