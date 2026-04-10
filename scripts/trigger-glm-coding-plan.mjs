export const DEFAULT_BASE_URL = 'https://open.bigmodel.cn/api/coding/paas/v4';
export const DEFAULT_MODEL = 'glm-4.7';
export const DEFAULT_PROMPT = 'Please reply with OK only.';
export const DEFAULT_RETRIES = 3;
export const DEFAULT_RETRY_DELAY_MS = 60_000;

import path from 'node:path';
import { pathToFileURL } from 'node:url';

export function buildRequestBody({
  model = DEFAULT_MODEL,
  prompt = DEFAULT_PROMPT,
} = {}) {
  return {
    model,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    max_tokens: 8,
    temperature: 0,
  };
}

export function describeSuccess(payload) {
  const content = payload?.choices?.[0]?.message?.content;

  if (typeof content === 'string' && content.trim() !== '') {
    return content.trim();
  }

  if (typeof payload?.request_id === 'string' && payload.request_id.trim() !== '') {
    return '[no assistant text returned]';
  }

  if (typeof payload?.id === 'string' && payload.id.trim() !== '') {
    return '[no assistant text returned]';
  }

  return '[successful response without assistant text]';
}

export function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function normalizeBaseUrl(baseUrl) {
  return baseUrl.replace(/\/+$/, '');
}

async function callOnce({
  apiKey,
  baseUrl = DEFAULT_BASE_URL,
  model = DEFAULT_MODEL,
  prompt = DEFAULT_PROMPT,
  fetchImpl = fetch,
}) {
  const response = await fetchImpl(
    `${normalizeBaseUrl(baseUrl)}/chat/completions`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(buildRequestBody({ model, prompt })),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `GLM request failed with status ${response.status}: ${errorBody}`,
    );
  }

  const payload = await response.json();
  const content = describeSuccess(payload);

  return {
    content,
    payload,
  };
}

export async function callWithRetry({
  apiKey,
  baseUrl = DEFAULT_BASE_URL,
  model = DEFAULT_MODEL,
  prompt = DEFAULT_PROMPT,
  retries = DEFAULT_RETRIES,
  retryDelayMs = DEFAULT_RETRY_DELAY_MS,
  fetchImpl = fetch,
  sleepImpl = sleep,
  logger = console,
}) {
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      logger.info(`Attempt ${attempt}/${retries}: triggering GLM Coding Plan.`);

      const result = await callOnce({
        apiKey,
        baseUrl,
        model,
        prompt,
        fetchImpl,
      });

      logger.info(`Attempt ${attempt}/${retries} succeeded.`);
      return {
        ...result,
        attempts: attempt,
      };
    } catch (error) {
      lastError = error;
      logger.warn(`Attempt ${attempt}/${retries} failed: ${error.message}`);

      if (attempt < retries) {
        logger.info(`Waiting ${retryDelayMs}ms before retrying.`);
        await sleepImpl(retryDelayMs);
      }
    }
  }

  throw lastError;
}

export async function main({
  env = process.env,
  logger = console,
  fetchImpl = fetch,
  sleepImpl = sleep,
} = {}) {
  const apiKey = env.GLM_API_KEY;

  if (!apiKey) {
    throw new Error('Missing required environment variable: GLM_API_KEY');
  }

  const result = await callWithRetry({
    apiKey,
    baseUrl: env.GLM_BASE_URL || DEFAULT_BASE_URL,
    model: env.GLM_MODEL || DEFAULT_MODEL,
    prompt: env.GLM_PROMPT || DEFAULT_PROMPT,
    retries: Number(env.GLM_RETRIES || DEFAULT_RETRIES),
    retryDelayMs: Number(env.GLM_RETRY_DELAY_MS || DEFAULT_RETRY_DELAY_MS),
    fetchImpl,
    sleepImpl,
    logger,
  });

  logger.info(`GLM trigger completed with response: ${result.content}`);
  return result;
}

export function isDirectExecution({
  argv1 = process.argv[1],
  metaUrl = import.meta.url,
  cwd = process.cwd(),
} = {}) {
  if (!argv1) {
    return false;
  }

  const resolvedPath = path.resolve(cwd, argv1);
  return metaUrl === pathToFileURL(resolvedPath).href;
}

if (isDirectExecution()) {
  try {
    await main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
