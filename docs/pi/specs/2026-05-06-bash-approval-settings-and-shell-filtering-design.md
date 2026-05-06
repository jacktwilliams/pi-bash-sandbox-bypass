# Design: `@fgladisch/pi-bash-approval` settings migration + shell control filtering

- Date: 2026-05-06
- Status: Approved (design)
- Owner: @fgladisch

## 1) Problem Statement

`pi-bash-approval` currently stores both settings and allow-list rules in `~/.pi/agent/bash-approval.json`.

Wanted changes:

1. Move extension settings to global `~/.pi/agent/settings.json` (like `pi-persistent-history`).
2. Replace JSON rule file with newline-based `~/.pi/agent/.bash-approval`.
3. Stop prompting on shell control-flow tokens (`if`, `for`, etc.) and variable declarations; only evaluate real commands.
4. Prepare release as `0.2.0`.

## 2) Goals

1. Keep existing approval UX and rule matching behavior where possible.
2. Store only `splitChains` in `settings.json` under a namespaced key.
3. Make allow-list hand-editable as plain text line list.
4. Reduce false-positive prompts from shell syntax scaffolding.
5. Keep non-interactive behavior safe (unknown command => blocked).

## 3) Non-Goals

1. Full shell parser/AST support.
2. Backward migration tooling for legacy `bash-approval.json` beyond safe fallback defaults.
3. Changes to unrelated packages.

## 4) Chosen Approach

### Option selected

**Targeted lexical filtering + split config sources**:

- Settings: `~/.pi/agent/settings.json` key `bashApproval.splitChains`.
- Rules: `~/.pi/agent/.bash-approval` plain text list.
- Keep existing pattern syntax (`:*`, trailing `*`, exact matching).
- Ignore blank lines and `#` comments in `.bash-approval`.
- After command splitting, ignore non-command segments:
  - shell control keywords (`if`, `then`, `elif`, `else`, `fi`, `for`, `do`, `done`, `while`, `until`, `case`, `esac`, `function`, `{`, `}`, `(`)
  - assignment-only segments (`FOO=bar`, `FOO=bar BAR=baz`, optional `export` prefix)
- Preserve behavior for assignment-prefix + real command (`FOO=bar npm test` => evaluate `npm test`).

### Why this option

- Solves user-requested behavior with small focused changes.
- Avoids dependency and complexity cost of shell AST parser.
- Fits current extension architecture and tests.

### Trade-off accepted

- Heuristic shell-token handling is not full grammar coverage.
- Some exotic shell constructs may still require allow-once/manual rule tuning.

## 5) Public Surface Changes

### Files

- **Rules file**: `~/.pi/agent/.bash-approval`
- **Settings file**: `~/.pi/agent/settings.json`

### Settings schema

```json
{
  "bashApproval": {
    "splitChains": true
  }
}
```

Default when missing/malformed: `splitChains = true`.

### Rule file format

One rule per line.

- Empty lines ignored.
- Lines starting with `#` ignored.
- Other lines treated as rule patterns exactly as today.

Example:

```text
# bash approval allow-list
ls
cd:*
git status:*
npm test:*
```

### Commands/help text

- `/bash-approval-reload` and error/help messages should reference:
  - `~/.pi/agent/settings.json` for settings,
  - `~/.pi/agent/.bash-approval` for rules.

## 6) Runtime Behavior Specification

### 6.1 Config load

1. Load `splitChains` from `settings.json` key `bashApproval.splitChains`.
2. Load allow-list rules from `.bash-approval` lines.
3. If files are missing:
   - create `.bash-approval` with empty/default content best-effort,
   - treat missing/malformed settings as defaults.

### 6.2 Command evaluation

1. Split command into segments (existing splitter behavior, controlled by `splitChains`).
2. Normalize each segment to a candidate command segment:
   - strip assignment prefixes,
   - detect and skip control-flow-only/assignment-only segments.
3. Evaluate only real command segments against allow-list.
4. If all evaluated segments match => allow silently.
5. Otherwise prompt/block as before.

### 6.3 Prompt suggestions

- Exact command option stays based on full trimmed command.
- Prefix suggestion derives from **first failing real command segment**.

### 6.4 Non-interactive mode

- Unmatched command still blocked with informative reason.

## 7) Test Plan

File: `packages/pi-bash-approval/tests/bash-approval.spec.ts`

Add/adjust tests for:

1. Reads `splitChains` from `settings.json` at `bashApproval.splitChains`.
2. Reads rules from `.bash-approval` lines.
3. Ignores blank/comment lines in `.bash-approval`.
4. `if/then/fi` scaffolding ignored; inner allowed command passes.
5. `for/do/done` scaffolding ignored; inner allowed command passes.
6. Assignment-only segments ignored.
7. Assignment-prefix + command still evaluated.
8. Reload/list messages and block reason mention new file locations.

Keep existing tests for pattern matching/prompt options intact where behavior unchanged.

## 8) Documentation Updates

Update `packages/pi-bash-approval/README.md`:

1. Replace JSON config section with dual-file config (`settings.json` + `.bash-approval`).
2. Document new settings key: `bashApproval.splitChains`.
3. Document line-based rule format with comments/blank lines.
4. Keep pattern semantics and prompt behavior docs aligned with implementation.

## 9) Acceptance Criteria

1. Settings live in `~/.pi/agent/settings.json` under `bashApproval.splitChains`.
2. Rules live in `~/.pi/agent/.bash-approval` as newline list.
3. `if`, `for`, and assignment-only shell segments do not trigger prompts.
4. Real commands in those blocks still require allow-list match.
5. Existing allow/prompt flow remains functional.
6. Tests/lint/typecheck pass.
7. Changeset present for `@fgladisch/pi-bash-approval` minor release (`0.2.0`).
