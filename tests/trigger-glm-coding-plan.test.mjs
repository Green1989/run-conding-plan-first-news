import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const scriptPath = path.join(repoRoot, 'scripts', 'trigger-glm-coding-plan.mjs');
const workflowPath = path.join(
  repoRoot,
  '.github',
  'workflows',
  'glm-coding-plan-trigger.yml',
);
const readmePath = path.join(repoRoot, 'README.md');

async function loadScriptModule() {
  return import(pathToFileURL(scriptPath).href);
}

test('buildRequestBody creates the minimal GLM Coding request payload', async () => {
  const { buildRequestBody } = await loadScriptModule();

  const payload = buildRequestBody({
    model: 'glm-4.7',
    prompt: 'Please reply with OK only.',
  });

  assert.equal(payload.model, 'glm-4.7');
  assert.deepEqual(payload.messages, [
    {
      role: 'user',
      content: 'Please reply with OK only.',
    },
  ]);
});

test('describeSuccess returns the first assistant message content when present', async () => {
  const { describeSuccess } = await loadScriptModule();

  const content = describeSuccess({
    choices: [
      {
        message: {
          role: 'assistant',
          content: 'OK',
        },
      },
    ],
  });

  assert.equal(content, 'OK');
});

test('callWithRetry retries twice before succeeding on the third attempt', async () => {
  const { callWithRetry } = await loadScriptModule();
  let attempts = 0;
  const sleepCalls = [];

  const result = await callWithRetry({
    apiKey: 'test-key',
    retries: 3,
    retryDelayMs: 10,
    fetchImpl: async () => {
      attempts += 1;

      if (attempts < 3) {
        return {
          ok: false,
          status: 500,
          async text() {
            return `failure-${attempts}`;
          },
        };
      }

      return {
        ok: true,
        status: 200,
        async json() {
          return {
            choices: [
              {
                message: {
                  role: 'assistant',
                  content: 'OK',
                },
              },
            ],
          };
        },
      };
    },
    sleepImpl: async (ms) => {
      sleepCalls.push(ms);
    },
    logger: {
      info() {},
      warn() {},
      error() {},
    },
  });

  assert.equal(result.attempts, 3);
  assert.equal(result.content, 'OK');
  assert.deepEqual(sleepCalls, [10, 10]);
});

test('callWithRetry treats a 2xx response without assistant text as success', async () => {
  const { callWithRetry } = await loadScriptModule();

  const result = await callWithRetry({
    apiKey: 'test-key',
    retries: 3,
    retryDelayMs: 10,
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      async json() {
        return {
          id: 'chatcmpl-triggered',
          request_id: 'req-triggered',
          choices: [
            {
              message: {
                role: 'assistant',
                content: null,
              },
            },
          ],
        };
      },
    }),
    sleepImpl: async () => {},
    logger: {
      info() {},
      warn() {},
      error() {},
    },
  });

  assert.equal(result.attempts, 1);
  assert.equal(result.content, '[no assistant text returned]');
  assert.equal(result.payload.request_id, 'req-triggered');
});

test('isDirectExecution recognizes a relative CLI script path', async () => {
  const { isDirectExecution } = await loadScriptModule();

  const result = isDirectExecution({
    argv1: path.join('scripts', 'trigger-glm-coding-plan.mjs'),
    metaUrl: pathToFileURL(scriptPath).href,
    cwd: repoRoot,
  });

  assert.equal(result, true);
});

test('workflow config schedules the job for 05:00 and repeated 08:00-11:00 Beijing time checkpoints', async () => {
  const workflow = await fs.readFile(workflowPath, 'utf8');

  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /cron:\s*'0 21 \* \* \*'/);
  assert.match(workflow, /cron:\s*'0 0 \* \* \*'/);
  assert.match(workflow, /cron:\s*'30 0 \* \* \*'/);
  assert.match(workflow, /cron:\s*'0 1 \* \* \*'/);
  assert.match(workflow, /cron:\s*'30 1 \* \* \*'/);
  assert.match(workflow, /cron:\s*'0 2 \* \* \*'/);
  assert.match(workflow, /cron:\s*'30 2 \* \* \*'/);
  assert.match(workflow, /cron:\s*'0 3 \* \* \*'/);
  assert.match(workflow, /GLM_API_KEY:\s*\$\{\{\s*secrets\.GLM_API_KEY\s*\}\}/);
  assert.match(workflow, /node\s+scripts\/trigger-glm-coding-plan\.mjs/);
});

test('README documents the required secret, UTC conversion, retries, and manual trigger', async () => {
  const readme = await fs.readFile(readmePath, 'utf8');

  assert.match(readme, /GLM_API_KEY/);
  assert.match(readme, /05:00/);
  assert.match(readme, /08:00/);
  assert.match(readme, /08:30/);
  assert.match(readme, /09:00/);
  assert.match(readme, /09:30/);
  assert.match(readme, /10:00/);
  assert.match(readme, /10:30/);
  assert.match(readme, /11:00/);
  assert.match(readme, /21:00 UTC/);
  assert.match(readme, /00:00 UTC/);
  assert.match(readme, /00:30 UTC/);
  assert.match(readme, /01:00 UTC/);
  assert.match(readme, /01:30 UTC/);
  assert.match(readme, /02:00 UTC/);
  assert.match(readme, /02:30 UTC/);
  assert.match(readme, /03:00 UTC/);
  assert.match(readme, /3\s+times|3\s+attempts/);
  assert.match(readme, /workflow_dispatch|manual trigger/i);
});
