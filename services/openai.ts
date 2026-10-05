import { config } from '@/constants/config';
import type { CareDifficulty, PlantIdentification, ToxicityLevel } from './types';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

const SYSTEM_PROMPT =
  'You are an expert botanist and horticulturist. Analyze the provided image of a plant, flower, tree, ' +
  'succulent, or fungus. Return valid JSON matching the schema. ' +
  'Set is_plant to false if the image does not clearly show a plant or fungus. ' +
  'confidence is a 0-100 integer reflecting how certain the visual identification is — lower it for blurry ' +
  'photos, seedlings, or species with close look-alikes, and never invent precision you do not have. ' +
  'description is one engaging paragraph of 2-4 sentences about the plant, its origins and anything notable. ' +
  'key_features lists 2-4 short visible traits that support the identification. ' +
  'care gives concise, practical instructions (one short sentence each) for growing it. ' +
  'toxicity rates the risk to cats/dogs and to humans if ingested, with a one-sentence note; ' +
  'use "Unknown" rather than guessing. ' +
  'health_assessment is one sentence on any visible issues (pests, disease, over/under-watering) or ' +
  'states that it looks healthy.';

const DIFFICULTIES: readonly CareDifficulty[] = ['Easy', 'Moderate', 'Challenging', 'Expert'];
const TOXICITY: readonly ToxicityLevel[] = ['Non-toxic', 'Mildly toxic', 'Toxic', 'Highly toxic', 'Unknown'];

/** Strict JSON schema so the model can only return the shape the UI expects. */
const RESPONSE_SCHEMA = {
  name: 'plant_identification',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: [
      'is_plant',
      'common_name',
      'scientific_name',
      'family',
      'plant_type',
      'confidence',
      'description',
      'native_region',
      'key_features',
      'care',
      'toxicity',
      'health_assessment',
    ],
    properties: {
      is_plant: { type: 'boolean' },
      common_name: { type: 'string', description: 'e.g. "Swiss Cheese Plant".' },
      scientific_name: { type: 'string', description: 'Binomial name, e.g. "Monstera deliciosa".' },
      family: { type: 'string', description: 'e.g. "Araceae".' },
      plant_type: {
        type: 'string',
        description: 'e.g. Houseplant, Flowering perennial, Annual, Shrub, Tree, Succulent, Herb, Fungus.',
      },
      confidence: { type: 'integer', minimum: 0, maximum: 100 },
      description: { type: 'string' },
      native_region: { type: 'string' },
      key_features: { type: 'array', items: { type: 'string' } },
      care: {
        type: 'object',
        additionalProperties: false,
        required: ['difficulty', 'light', 'water', 'soil', 'temperature'],
        properties: {
          difficulty: { type: 'string', enum: DIFFICULTIES },
          light: { type: 'string' },
          water: { type: 'string' },
          soil: { type: 'string' },
          temperature: { type: 'string' },
        },
      },
      toxicity: {
        type: 'object',
        additionalProperties: false,
        required: ['pets', 'humans', 'notes'],
        properties: {
          pets: { type: 'string', enum: TOXICITY },
          humans: { type: 'string', enum: TOXICITY },
          notes: { type: 'string' },
        },
      },
      health_assessment: { type: 'string' },
    },
  },
} as const;

export type PlantIdErrorKind =
  | 'config'
  | 'network'
  | 'timeout'
  | 'auth'
  | 'rate_limit'
  | 'server'
  | 'invalid_response'
  | 'cancelled';

export class PlantIdError extends Error {
  constructor(
    public readonly kind: PlantIdErrorKind,
    message: string,
  ) {
    super(message);
    this.name = 'PlantIdError';
  }
}

interface IdentifyOptions {
  /** Abort an in-flight request, e.g. when the user leaves the result screen. */
  signal?: AbortSignal;
}

/**
 * Sends a base64-encoded JPEG to the vision model and returns a structured identification.
 *
 * If `EXPO_PUBLIC_PLANTID_API_URL` is set the image is posted to that backend instead
 * (body: `{ image: <base64> }`, response: `PlantIdentification` JSON), which keeps the
 * OpenAI key off the device.
 */
export async function identifyPlant(
  base64Image: string,
  { signal }: IdentifyOptions = {},
): Promise<PlantIdentification> {
  if (!config.proxyUrl && !config.openAiApiKey) {
    throw new PlantIdError(
      'config',
      'No API key configured. Add EXPO_PUBLIC_OPENAI_API_KEY (or EXPO_PUBLIC_PLANTID_API_URL) to your .env file and restart Expo.',
    );
  }

  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, config.requestTimeoutMs);
  const forwardAbort = () => controller.abort();
  if (signal?.aborted) controller.abort();
  signal?.addEventListener('abort', forwardAbort);

  try {
    const raw = config.proxyUrl
      ? await callProxy(base64Image, controller.signal)
      : await callOpenAI(base64Image, controller.signal);
    return normalize(raw);
  } catch (err) {
    if (err instanceof PlantIdError) throw err;
    if (isAbortError(err)) {
      throw timedOut
        ? new PlantIdError('timeout', 'The analysis took too long. Check your connection and try again.')
        : new PlantIdError('cancelled', 'Analysis cancelled.');
    }
    throw new PlantIdError('network', 'Could not reach the identification service. Are you online?');
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', forwardAbort);
  }
}

async function callOpenAI(base64Image: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(OPENAI_URL, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.openAiApiKey}`,
    },
    body: JSON.stringify({
      model: config.openAiModel,
      temperature: 0.2,
      max_tokens: 1000,
      response_format: { type: 'json_schema', json_schema: RESPONSE_SCHEMA },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Identify this plant.' },
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${base64Image}`, detail: 'high' },
            },
          ],
        },
      ],
    }),
  });

  await throwForStatus(response);

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string | null; refusal?: string | null } }[];
  };
  const message = payload.choices?.[0]?.message;
  if (message?.refusal) {
    throw new PlantIdError('invalid_response', 'The model declined to analyze this image.');
  }
  if (!message?.content) {
    throw new PlantIdError('invalid_response', 'The model returned an empty response.');
  }
  try {
    return JSON.parse(message.content);
  } catch {
    throw new PlantIdError('invalid_response', 'The model returned malformed data. Please try again.');
  }
}

async function callProxy(base64Image: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(config.proxyUrl, {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64Image }),
  });
  await throwForStatus(response);
  try {
    return await response.json();
  } catch {
    throw new PlantIdError('invalid_response', 'The server returned malformed data. Please try again.');
  }
}

async function throwForStatus(response: Response): Promise<void> {
  if (response.ok) return;

  let detail = '';
  try {
    const body = (await response.json()) as { error?: { message?: string } };
    detail = body.error?.message ?? '';
  } catch {
    // Non-JSON error body; fall through with the status code only.
  }

  if (response.status === 401 || response.status === 403) {
    throw new PlantIdError('auth', 'The API key was rejected. Double-check EXPO_PUBLIC_OPENAI_API_KEY.');
  }
  if (response.status === 429) {
    throw new PlantIdError('rate_limit', 'Too many requests right now. Wait a moment and try again.');
  }
  throw new PlantIdError(
    'server',
    `The identification service had a problem (${response.status})${detail ? `: ${detail}` : '.'}`,
  );
}

/** Defensive parsing — never trust a model (or proxy) to match the schema exactly. */
function normalize(raw: unknown): PlantIdentification {
  if (!raw || typeof raw !== 'object') {
    throw new PlantIdError('invalid_response', 'Unexpected response from the identification service.');
  }
  const r = raw as Record<string, unknown>;
  const care = (r.care ?? {}) as Record<string, unknown>;
  const tox = (r.toxicity ?? {}) as Record<string, unknown>;

  const isPlant = r.is_plant !== false;
  const commonName = str(r.common_name);
  const scientificName = str(r.scientific_name);
  if (isPlant && !commonName && !scientificName) {
    throw new PlantIdError('invalid_response', 'The plant could not be identified. Try a clearer photo.');
  }

  return {
    is_plant: isPlant,
    common_name: commonName || scientificName || 'Unknown',
    scientific_name: scientificName,
    family: str(r.family, 'Unknown family'),
    plant_type: str(r.plant_type, 'Plant'),
    confidence: Math.round(Math.min(100, Math.max(0, num(r.confidence)))),
    description: str(r.description),
    native_region: str(r.native_region, 'Unknown'),
    key_features: Array.isArray(r.key_features)
      ? r.key_features.filter((f): f is string => typeof f === 'string' && f.trim().length > 0).slice(0, 4)
      : [],
    care: {
      difficulty: oneOf(care.difficulty, DIFFICULTIES, 'Moderate'),
      light: str(care.light, '—'),
      water: str(care.water, '—'),
      soil: str(care.soil, '—'),
      temperature: str(care.temperature, '—'),
    },
    toxicity: {
      pets: oneOf(tox.pets, TOXICITY, 'Unknown'),
      humans: oneOf(tox.humans, TOXICITY, 'Unknown'),
      notes: str(tox.notes),
    },
    health_assessment: str(r.health_assessment),
  };
}

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' && v.trim() ? v.trim() : fallback;
}

function num(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function oneOf<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(v as T) ? (v as T) : fallback;
}

function isAbortError(err: unknown): boolean {
  return err instanceof Error && err.name === 'AbortError';
}
