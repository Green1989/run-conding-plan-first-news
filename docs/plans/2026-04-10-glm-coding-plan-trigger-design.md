# GLM Coding Plan Fixed Trigger Design

**Date:** 2026-04-10

## Goal

Create a cloud-based automation that triggers one minimal GLM Coding Plan request every day at 05:00 Beijing time so the package's daily 5-hour window starts at a stable time without relying on the user's local machine.

## Constraints

- Must run off the local computer.
- Must execute automatically while the user is asleep.
- Must use GitHub Actions on a schedule.
- Must store the API key in GitHub Secrets.
- Must target the GLM Coding base URL: `https://open.bigmodel.cn/api/coding/paas/v4`
- Must use a minimal viable request.
- Success only requires a successful API call.
- Failure handling must retry 3 times with a 1 minute gap between attempts.
- The trigger time is 05:00 in Beijing time, which maps to 21:00 UTC on the previous day for GitHub Actions cron.

## Recommended Approach

Use a scheduled GitHub Actions workflow that runs a small Node.js script. The script sends one OpenAI-compatible `chat/completions` request to the Coding Plan base URL with a short prompt asking for `OK` only. The script handles retry logic itself so the policy is explicit and easy to maintain.

This approach keeps the repository lightweight, avoids external infrastructure, and makes later adjustments simple if the endpoint, model, or prompt need to change.

## Workflow Design

- `schedule` trigger with cron `0 21 * * *`
- `workflow_dispatch` trigger for manual verification and troubleshooting
- `ubuntu-latest` runner
- Node runtime available through `actions/setup-node`
- Secret: `GLM_API_KEY`

## Request Design

- Endpoint: `POST https://open.bigmodel.cn/api/coding/paas/v4/chat/completions`
- Auth: `Authorization: Bearer ${GLM_API_KEY}`
- Model: one model allowed by GLM Coding Plan, defaulting to `glm-4.7`
- Minimal message: ask the model to reply with `OK` only

## Success Handling

If the API returns an HTTP 2xx response and a model response can be read, the workflow is considered successful. No persistent storage is required.

## Failure Handling

The script retries up to 3 attempts total with a 60 second delay between failed attempts. If all attempts fail, the GitHub Actions job fails so GitHub preserves the failure record for inspection.

## Maintenance Notes

- The user only needs to configure the repository secret once.
- Manual runs remain available through `workflow_dispatch`.
- The request prompt stays intentionally minimal to reduce cost and reduce the chance of tool-specific side effects.
