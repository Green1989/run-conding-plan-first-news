# GLM Coding Plan Daily Trigger

This repository keeps the GLM Coding Plan usage window anchored by sending one minimal API request from GitHub Actions each morning.

## What it does

- Runs once per day at Beijing time `05:00`
- Uses GitHub Actions instead of a local computer
- Calls the GLM Coding base URL `https://open.bigmodel.cn/api/coding/paas/v4`
- Treats the run as successful as long as one API call returns HTTP 2xx, even if no assistant text is returned
- Retries up to 3 attempts, waiting 1 minute between failures
- Keeps `workflow_dispatch` enabled for a manual trigger when you want to verify the setup

## Time conversion

GitHub Actions cron uses UTC. Beijing time `05:00` maps to `21:00 UTC` on the previous day, so the workflow uses:

```yaml
cron: '0 21 * * *'
```

## Required setup

Add this repository secret in GitHub:

- `GLM_API_KEY`: your official GLM API key

## Request details

The script sends a minimal OpenAI-compatible request to:

`POST https://open.bigmodel.cn/api/coding/paas/v4/chat/completions`

Default request behavior:

- Model: `glm-4.7`
- Prompt: `Please reply with OK only.`
- Success rule: any HTTP 2xx response counts as a successful trigger

You can override these values with optional environment variables if you ever need to adjust them:

- `GLM_BASE_URL`
- `GLM_MODEL`
- `GLM_PROMPT`
- `GLM_RETRIES`
- `GLM_RETRY_DELAY_MS`

## Local verification

Run:

```bash
npm test
```

This checks the workflow schedule, script behavior, retry policy, and README setup instructions.
