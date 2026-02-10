// config/gemini.js
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

/**
 * =========================================================
 * Helpers
 * =========================================================
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = undefined) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

function withTimeout(promise, ms, timeoutCode = 'LLM_TIMEOUT') {
  if (!ms || Number.isNaN(ms) || ms <= 0) return promise;
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(new AppError('Timeout na chamada ao provedor LLM.', 503, timeoutCode));
    }, ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

function normalizeProvider(raw) {
  const value = (raw || '').toLowerCase().trim();

  // aliases para AI Studio / API Key
  if (['google_ai_studio', 'ai_studio', 'google', 'gemini', 'developer'].includes(value)) {
    return 'developer';
  }

  // vertex
  if (['vertex', 'vertex_ai', 'google_vertex'].includes(value)) {
    return 'vertex';
  }

  // fallback padrão
  if (!value) return 'developer';

  return value;
}

function isLocationUnsupportedError(error) {
  const text = String(error?.message || '').toLowerCase();
  return (
    text.includes('user location is not supported') ||
    text.includes('location is not supported') ||
    text.includes('unsupported location')
  );
}

function isRetryableProviderError(error) {
  const text = String(error?.message || '').toLowerCase();
  return (
    text.includes('timeout') ||
    text.includes('429') ||
    text.includes('rate limit') ||
    text.includes('temporarily unavailable') ||
    text.includes('service unavailable') ||
    text.includes('503')
  );
}

/**
 * =========================================================
 * Env + Config
 * =========================================================
 */
const PRIMARY_PROVIDER = normalizeProvider(process.env.LLM_PROVIDER || 'developer');
const FALLBACK_PROVIDER = normalizeProvider(process.env.LLM_PROVIDER_FALLBACK || '');

const PRIMARY_MODEL = process.env.GEMINI_MODEL_PRIMARY || process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const FALLBACK_MODEL = process.env.GEMINI_MODEL_FALLBACK || PRIMARY_MODEL;

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const VERTEX_AI_PROJECT = process.env.VERTEX_AI_PROJECT;
const VERTEX_AI_LOCATION = process.env.VERTEX_AI_LOCATION || 'us-central1';

const LLM_TIMEOUT_MS = Number(process.env.LLM_TIMEOUT_MS || 25000);

// validações mínimas
function assertProviderEnv(provider) {
  if (provider === 'developer') {
    if (!GOOGLE_API_KEY) {
      throw new AppError(
        'GOOGLE_API_KEY não configurada para provider "developer".',
        500,
        'LLM_CONFIG_ERROR'
      );
    }
    return;
  }

  if (provider === 'vertex') {
    if (!GOOGLE_API_KEY && (!VERTEX_AI_PROJECT || !VERTEX_AI_LOCATION)) {
      throw new AppError(
        'Configuração incompleta para provider "vertex". Defina GOOGLE_API_KEY (SDK novo) ou VERTEX_AI_PROJECT + VERTEX_AI_LOCATION.',
        500,
        'LLM_CONFIG_ERROR'
      );
    }
    return;
  }

  throw new AppError(`Provider LLM inválido: ${provider}`, 500, 'LLM_CONFIG_ERROR');
}

assertProviderEnv(PRIMARY_PROVIDER);
if (FALLBACK_PROVIDER) {
  assertProviderEnv(FALLBACK_PROVIDER);
}

/**
 * =========================================================
 * Clients
 * =========================================================
 */
let developerClient = null;
let vertexClient = null;

function getProviderClient(provider) {
  if (provider === 'developer') {
    if (!developerClient) {
      developerClient = new GoogleGenerativeAI(GOOGLE_API_KEY);
    }
    return { type: 'developer', client: developerClient };
  }

  if (provider === 'vertex') {
    // Com @google/genai (requer configuração apropriada)
    // Obs.: mantendo simples e compatível com API key quando possível.
    if (!vertexClient) {
      vertexClient = new GoogleGenAI({
        apiKey: GOOGLE_API_KEY,
        vertexai: true,
        project: VERTEX_AI_PROJECT,
        location: VERTEX_AI_LOCATION,
      });
    }
    return { type: 'vertex', client: vertexClient };
  }

  throw new AppError(`Provider LLM inválido: ${provider}`, 500, 'LLM_CONFIG_ERROR');
}

/**
 * =========================================================
 * Core generation
 * =========================================================
 */
async function generateWithProvider({ provider, model, prompt }) {
  const { type, client } = getProviderClient(provider);

  if (type === 'developer') {
    const modelHandle = client.getGenerativeModel({ model });
    const result = await withTimeout(modelHandle.generateContent(prompt), LLM_TIMEOUT_MS);
    const text = result?.response?.text?.() ?? '';
    return { text, raw: result };
  }

  if (type === 'vertex') {
    // @google/genai style
    const result = await withTimeout(
      client.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      }),
      LLM_TIMEOUT_MS
    );

    // normalização de texto
    const text =
      result?.text ||
      result?.candidates?.[0]?.content?.parts?.map((p) => p?.text || '').join('') ||
      '';

    return { text, raw: result };
  }

  throw new AppError('Provider não suportado.', 500, 'LLM_CONFIG_ERROR');
}

async function generateWithFallback(prompt) {
  try {
    return await generateWithProvider({
      provider: PRIMARY_PROVIDER,
      model: PRIMARY_MODEL,
      prompt,
    });
  } catch (primaryError) {
    // localização não suportada -> erro sem fallback "mágico"
    if (isLocationUnsupportedError(primaryError)) {
      throw new AppError(
        'Serviço de IA indisponível para esta localização no momento.',
        503,
        'LLM_LOCATION_UNSUPPORTED'
      );
    }

    // se não há fallback, propaga
    if (!FALLBACK_PROVIDER) {
      throw primaryError;
    }

    // fallback só para erro recuperável
    if (!isRetryableProviderError(primaryError)) {
      throw primaryError;
    }

    try {
      return await generateWithProvider({
        provider: FALLBACK_PROVIDER,
        model: FALLBACK_MODEL,
        prompt,
      });
    } catch (fallbackError) {
      if (isLocationUnsupportedError(fallbackError)) {
        throw new AppError(
          'Serviço de IA indisponível para esta localização no momento.',
          503,
          'LLM_LOCATION_UNSUPPORTED'
        );
      }
      throw fallbackError;
    }
  }
}

/**
 * =========================================================
 * Compat layer for existing controllers
 * Your code calls:
 *   const model = genAI.getGenerativeModel({ model: geminiModelName });
 *   const result = await model.generateContent(prompt);
 *   const text = result.response.text();
 * =========================================================
 */
export const genAI = {
  getGenerativeModel({ model }) {
    const selectedModel = model || PRIMARY_MODEL;
    return {
      async generateContent(prompt) {
        const { text, raw } = await generateWithFallback(prompt);

        // resposta compatível com @google/generative-ai
        return {
          response: {
            text: () => text,
            raw,
          },
        };
      },
    };
  },
};

// Mantém compatibilidade com controllers existentes
export const geminiModelName = PRIMARY_MODEL;

// opcional para debug controlado
export const llmConfig = {
  primaryProvider: PRIMARY_PROVIDER,
  fallbackProvider: FALLBACK_PROVIDER || null,
  primaryModel: PRIMARY_MODEL,
  fallbackModel: FALLBACK_MODEL,
  timeoutMs: LLM_TIMEOUT_MS,
};
