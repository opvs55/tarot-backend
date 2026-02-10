// config/gemini.js
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const PRIMARY_PROVIDER = (process.env.LLM_PROVIDER || 'developer').toLowerCase();
const FALLBACK_PROVIDER = (process.env.LLM_PROVIDER_FALLBACK || '').toLowerCase();

const PRIMARY_MODEL = process.env.GEMINI_MODEL_PRIMARY || 'gemini-3-flash-preview';
const FALLBACK_MODEL = process.env.GEMINI_MODEL_FALLBACK || PRIMARY_MODEL;

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const VERTEX_AI_PROJECT = process.env.VERTEX_AI_PROJECT;
const VERTEX_AI_LOCATION = process.env.VERTEX_AI_LOCATION;

const providerClients = new Map();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getStatusCode = (error) => {
  const rawStatus = error?.status ?? error?.code ?? error?.response?.status;
  const status = Number(rawStatus);
  return Number.isFinite(status) ? status : null;
};

const isTransientError = (error) => {
  const status = getStatusCode(error);
  if (status === 429 || (status !== null && status >= 500)) {
    return true;
  }

  const message = (error?.message || '').toLowerCase();
  const code = error?.code;
  const networkCodes = ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN', 'ECONNREFUSED'];
  if (networkCodes.includes(code)) {
    return true;
  }

  return message.includes('socket hang up') || message.includes('network') || message.includes('timeout');
};

const isLocationUnsupported = (error) => {
  const message = (error?.message || '').toLowerCase();
  if (!message.includes('location')) {
    return false;
  }
  return (
    message.includes('unsupported') ||
    message.includes('not supported') ||
    message.includes('not available') ||
    message.includes('invalid location') ||
    message.includes('not in the list')
  );
};

const normalizeVertexResult = (result) => {
  if (result?.response?.text instanceof Function) {
    return result;
  }

  if (typeof result?.text === 'function') {
    return {
      ...result,
      response: {
        text: () => result.text(),
      },
    };
  }

  if (typeof result?.response?.text === 'string') {
    const textValue = result.response.text;
    return {
      ...result,
      response: {
        ...result.response,
        text: () => textValue,
      },
    };
  }

  const parts = result?.response?.candidates?.[0]?.content?.parts;
  if (Array.isArray(parts)) {
    const textValue = parts.map((part) => part.text || '').join('');
    return {
      ...result,
      response: {
        text: () => textValue,
      },
    };
  }

  return result;
};

const getProviderClient = (provider) => {
  if (providerClients.has(provider)) {
    return providerClients.get(provider);
  }

  let client;
  if (provider === 'developer') {
    if (!GOOGLE_API_KEY) {
      throw new Error('GOOGLE_API_KEY não configurada para o provider developer.');
    }
    client = new GoogleGenerativeAI(GOOGLE_API_KEY);
  } else if (provider === 'vertex') {
    if (!VERTEX_AI_PROJECT || !VERTEX_AI_LOCATION) {
      throw new Error('VERTEX_AI_PROJECT ou VERTEX_AI_LOCATION não configurados para o provider vertex.');
    }
    client = new GoogleGenAI({
      vertexai: true,
      project: VERTEX_AI_PROJECT,
      location: VERTEX_AI_LOCATION,
    });
  } else {
    throw new Error(`Provider LLM inválido: ${provider}`);
  }

  providerClients.set(provider, client);
  return client;
};

const withRetry = async (operation, { maxRetries = 2 } = {}) => {
  let attempt = 0;
  while (true) {
    try {
      return await operation();
    } catch (error) {
      if (isLocationUnsupported(error)) {
        error.code = 'LLM_LOCATION_UNSUPPORTED';
        throw error;
      }

      if (!isTransientError(error) || attempt >= maxRetries) {
        throw error;
      }

      const backoffMs = 500 * Math.pow(2, attempt) + Math.floor(Math.random() * 150);
      await sleep(backoffMs);
      attempt += 1;
    }
  }
};

const generateWithProvider = async ({ provider, model, prompt }) => {
  const client = getProviderClient(provider);

  if (provider === 'developer') {
    const generativeModel = client.getGenerativeModel({ model });
    return withRetry(() => generativeModel.generateContent(prompt));
  }

  const generativeModel = client.getGenerativeModel({ model });
  const result = await withRetry(() =>
    generativeModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    })
  );

  return normalizeVertexResult(result);
};

const getFallbackModel = (model) => FALLBACK_MODEL || model || PRIMARY_MODEL;

export const genAI = {
  getGenerativeModel({ model }) {
    return {
      generateContent: async (prompt) => {
        const attempts = [
          { provider: PRIMARY_PROVIDER, model: model || PRIMARY_MODEL },
        ];

        if (FALLBACK_PROVIDER || process.env.GEMINI_MODEL_FALLBACK) {
          const fallbackProvider = FALLBACK_PROVIDER || PRIMARY_PROVIDER;
          const fallbackModel = getFallbackModel(model);
          if (
            fallbackProvider !== attempts[0].provider ||
            fallbackModel !== attempts[0].model
          ) {
            attempts.push({ provider: fallbackProvider, model: fallbackModel });
          }
        }

        let lastError;

        for (let index = 0; index < attempts.length; index += 1) {
          const { provider, model: modelName } = attempts[index];
          try {
            return await generateWithProvider({ provider, model: modelName, prompt });
          } catch (error) {
            lastError = error;
            if (index === attempts.length - 1) {
              throw error;
            }
          }
        }

        throw lastError || new Error('Falha ao gerar conteúdo com o LLM.');
      },
    };
  },
};

export const geminiModelName = PRIMARY_MODEL;
