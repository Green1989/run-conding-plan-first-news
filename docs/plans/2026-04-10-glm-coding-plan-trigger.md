# GLM Coding Plan Trigger Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a GitHub Actions workflow that triggers one minimal GLM Coding Plan API call every day at 05:00 Beijing time, with 3 retry attempts spaced 1 minute apart.

**Architecture:** A scheduled GitHub Actions workflow runs a small Node.js script. The script constructs a minimal OpenAI-compatible request against the GLM Coding Plan base URL, validates required environment variables, retries failures with a fixed delay, and exits non-zero only after the retry budget is exhausted.

**Tech Stack:** GitHub Actions, Node.js 20, native `fetch`, native `node:test`, Markdown docs

---

### Task 1: Scaffold the repository files

**Files:**
- Create: `.github/workflows/glm-coding-plan-trigger.yml`
- Create: `scripts/trigger-glm-coding-plan.mjs`
- Create: `tests/trigger-glm-coding-plan.test.mjs`
- Create: `package.json`
- Create: `README.md`

**Step 1: Write the failing test**

Add a test file that expects helpers for payload creation, retry behavior, and response extraction to exist and behave correctly.

**Step 2: Run test to verify it fails**

Run: `node --test tests/trigger-glm-coding-plan.test.mjs`
Expected: FAIL because the script module does not exist yet.

**Step 3: Write minimal implementation**

Create the trigger script with exported helpers and a `main()` entry point, plus the `package.json` test script.

**Step 4: Run test to verify it passes**

Run: `node --test tests/trigger-glm-coding-plan.test.mjs`
Expected: PASS

**Step 5: Commit**

```bash
git add package.json scripts/trigger-glm-coding-plan.mjs tests/trigger-glm-coding-plan.test.mjs
git commit -m "feat: add GLM trigger script"
```

### Task 2: Add the scheduled workflow

**Files:**
- Modify: `.github/workflows/glm-coding-plan-trigger.yml`

**Step 1: Write the failing test**

Add a test that inspects the workflow file contents and asserts the workflow includes:
- cron `0 21 * * *`
- `workflow_dispatch`
- `GLM_API_KEY` environment wiring
- script execution step

**Step 2: Run test to verify it fails**

Run: `node --test tests/trigger-glm-coding-plan.test.mjs`
Expected: FAIL because the workflow file does not exist yet or is missing required fields.

**Step 3: Write minimal implementation**

Create the workflow with scheduled and manual triggers, Node.js setup, dependency-free script execution, and the secret environment variable.

**Step 4: Run test to verify it passes**

Run: `node --test tests/trigger-glm-coding-plan.test.mjs`
Expected: PASS

**Step 5: Commit**

```bash
git add .github/workflows/glm-coding-plan-trigger.yml tests/trigger-glm-coding-plan.test.mjs
git commit -m "feat: add daily GitHub Actions trigger"
```

### Task 3: Document setup and usage

**Files:**
- Modify: `README.md`

**Step 1: Write the failing test**

Add a test that expects the README to mention:
- the required `GLM_API_KEY` secret
- the Beijing time to UTC conversion
- the retry policy
- the manual trigger option

**Step 2: Run test to verify it fails**

Run: `node --test tests/trigger-glm-coding-plan.test.mjs`
Expected: FAIL because the README is missing the required sections.

**Step 3: Write minimal implementation**

Write concise setup and maintenance instructions in the README.

**Step 4: Run test to verify it passes**

Run: `node --test tests/trigger-glm-coding-plan.test.mjs`
Expected: PASS

**Step 5: Commit**

```bash
git add README.md tests/trigger-glm-coding-plan.test.mjs
git commit -m "docs: document GLM trigger workflow"
```

### Task 4: Verify the full solution

**Files:**
- Verify: `.github/workflows/glm-coding-plan-trigger.yml`
- Verify: `scripts/trigger-glm-coding-plan.mjs`
- Verify: `tests/trigger-glm-coding-plan.test.mjs`
- Verify: `README.md`

**Step 1: Run the automated tests**

Run: `node --test tests/trigger-glm-coding-plan.test.mjs`
Expected: PASS

**Step 2: Run the package test command**

Run: `npm test`
Expected: PASS

**Step 3: Run the script without secrets to verify guardrails**

Run: `node scripts/trigger-glm-coding-plan.mjs`
Expected: FAIL with a clear missing `GLM_API_KEY` message.

**Step 4: Review documentation and cron**

Confirm the workflow uses UTC `21:00` and README explains it maps to Beijing `05:00`.

**Step 5: Commit**

```bash
git add .github/workflows/glm-coding-plan-trigger.yml scripts/trigger-glm-coding-plan.mjs tests/trigger-glm-coding-plan.test.mjs README.md docs/plans/2026-04-10-glm-coding-plan-trigger*.md
git commit -m "feat: automate daily GLM Coding Plan trigger"
```
