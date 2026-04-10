# GLM Coding Plan Daily Trigger

This repository keeps the GLM Coding Plan usage window anchored by sending one minimal API request from GitHub Actions every day.

## What it does

- Runs twice per day at Beijing time `05:00` and `10:30`
- Uses GitHub Actions instead of a local computer
- Calls the GLM Coding base URL `https://open.bigmodel.cn/api/coding/paas/v4`
- Treats the run as successful as long as one API call returns HTTP 2xx, even if no assistant text is returned
- Retries up to 3 attempts, waiting 1 minute between failures
- Keeps `workflow_dispatch` enabled for a manual trigger when you want to verify the setup

## Time conversion

GitHub Actions cron uses UTC. The workflow keeps two daily trigger points:

- Beijing time `05:00` -> `21:00 UTC` on the previous day
- Beijing time `10:30` -> `02:30 UTC` on the same day

So the workflow uses:

```yaml
cron: '0 21 * * *'
cron: '30 2 * * *'
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
