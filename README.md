# pi-extensions

Personal pi extensions. Pi auto-discovers `*.ts` files in this directory at
runtime; the `package.json`, `tsconfig.json`, and `node_modules/` here exist
solely to give VSCode/tsserver type resolution and to host dev tooling.

> Do **not** add a `pi.extensions` field to `package.json` — that would
> override pi's auto-discovery.

## `caveman.ts`

Always-on **caveman mode**: prepends the upstream
[JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman) ruleset to
the system prompt every turn so the model speaks like a smart caveman and
burns ~75% fewer output tokens.

### Install

First run fetches the upstream repo:

```
/caveman update
```

This clones into `~/.pi/agent/caveman/upstream/`. Re-running `/caveman
update` pulls the latest. If the ruleset is missing on session start, the
extension warns you to run `/caveman update` and skips injection until you
do — pi keeps working normally.

### Slash commands

| Command                         | Action                                                                           |
| ------------------------------- | -------------------------------------------------------------------------------- |
| `/caveman` or `/caveman status` | Show current status (level + whether `SKILL.md` is loaded)                       |
| `/caveman lite`                 | Enable, intensity `lite` — no filler/hedging, full sentences                     |
| `/caveman full`                 | Enable, intensity `full` (default) — drop articles, fragments OK, short synonyms |
| `/caveman ultra`                | Enable, intensity `ultra` — abbreviations, arrows, one-word answers              |
| `/caveman off`                  | Disable injection (state persists, data stays installed)                         |
| `/caveman update`               | `git clone` (first run) or `git pull --ff-only` upstream repo                    |

Argument completion is wired up — typing `/caveman ` and tabbing cycles
through the valid tokens above. Status bar shows `🪨 caveman <level>` or
`🪨 caveman off`.

### Switching off mid-session

The ruleset itself reserves the phrases **`stop caveman`** and **`normal
mode`** — say either to the model and it drops caveman style for the
remainder of the response. The injection itself stays active until you run
`/caveman off`. To kill it permanently for the session, use the slash
command.

### Levels at a glance

Example — "Why React component re-render?"

- **lite**: "Your component re-renders because you create a new object reference each render. Wrap it in `useMemo`."
- **full**: "New object ref each render. Inline object prop = new ref = re-render. Wrap in `useMemo`."
- **ultra**: "Inline obj prop → new ref → re-render. `useMemo`."

### Auto-clarity

The ruleset tells the model to drop caveman style for security warnings,
irreversible-action confirmations, multi-step sequences where fragment order
risks misreads, and explicit "clarify / repeat that" requests — then resume
caveman after the clear part is done. Code, commits, and PR text are always
written in normal English.

## `welcome-message.ts`

Shows a workspace summary in the UI when a session starts. Only runs on real
startup in an interactive UI — `/new`, forks, and headless (`pi -p`) runs
are silent. Sections with nothing to show are dropped; if every section is
empty, no message appears.

The summary covers:

- **📦 Package** — name, version, and description from `package.json`.
- **🌿 Git** — current branch, working-tree status (clean, or a dirty
  shortstat), and the last 5 commits.
- **Resources** — three optional lists of what's available in this session:
  - `[Skills]` — registered skill commands.
  - `[Prompts]` — registered prompt commands.
  - `[Extensions]` — extensions installed locally in
    `~/.pi/agent/extensions/` plus any `packages` entries from
    `~/.pi/agent/settings.json`.

No config, no slash commands — drop the file in and it runs.

## `bash-approval.ts`

Guards the `bash` tool behind an interactive allow-list. Every bash tool call
is intercepted; commands matching a configured pattern run silently, anything
else prompts the user. In non-interactive contexts (`pi -p`, no UI), unknown
commands are blocked outright with a reason pointing at the config file.

### Config

Lives at `~/.pi/agent/bash-approval.json`. Created with sensible defaults on
first run. If the file is malformed, every command just prompts — pi keeps
working.

```json
{
  "allowed": ["ls", "ls:*", "git status:*", "npm test:*"],
  "splitChains": true
}
```

**Pattern syntax** (`allowed[]`):

| Pattern        | Matches                                             |
| -------------- | --------------------------------------------------- |
| `ls`           | exact: `ls` only                                    |
| `ls:*`         | `ls` exactly, or `ls <anything>` (space-separated)  |
| `git status:*` | `git status` exactly, or `git status <anything>`    |
| `git*`         | trailing-`*` glob — any command starting with `git` |

The `:*` form is the recommended one: it requires either an exact match or a
trailing space, so `git status:*` does **not** accidentally match
`git statusfoo`. The bare-`*` form is a raw prefix match — use sparingly.

**`splitChains`** (default `true`): split incoming commands on shell
separators (`&&`, `||`, `;`, `|`, newline) and require **every** segment to
match the allow-list. A chain like `cd foo && git log` only runs unprompted
when both `cd foo` and `git log` are allow-listed. Set `false` to match the
entire command string as one unit.

### Approval prompt

On a non-matching command in interactive mode, the user picks from:

- **Allow once** — run this invocation, persist nothing.
- **Allow always (exact): `<command>`** — append the literal command to
  `allowed[]` (truncated to 60 chars in the label only). Hidden when the
  exact command is already on the list.
- **Allow always: `<prefix>:*`** — append a suggested prefix rule. Suggestion
  uses the first two tokens when present (`git status:*`, `npm install:*`,
  `kubectl get:*`) so subcommand-style tools get a useful default; falls back
  to the first token alone (`ls:*`). Crucially, the suggestion is derived from
  the **first failing segment** of a chain, not the head — so
  `cd /tmp && git log` with only `cd` allow-listed offers `git log:*`, not
  `cd /tmp:*`. Hidden when the suggested rule equals the exact command or is
  already on the list.
- **Deny** — block with reason `Blocked by user`.

Selecting nothing (cancel) is treated as deny. "Allow always" choices are
persisted to `bash-approval.json` immediately.

### Slash commands

| Command                 | Action                                                                          |
| ----------------------- | ------------------------------------------------------------------------------- |
| `/bash-approval-reload` | Re-read `~/.pi/agent/bash-approval.json` from disk (use after editing by hand). |
| `/bash-approval-list`   | Show currently allowed bash patterns.                                           |

## `user-select.ts`

Registers a `user_select` tool the LLM (or skills) can call to ask the human
a multiple-choice question. Use whenever a workflow needs explicit user
input to disambiguate, confirm, or pick between mutually exclusive paths
instead of guessing.

No config, no slash commands — drop the file in and the tool is available.

### Tool schema

| Field         | Type       | Required | Description                                                   |
| ------------- | ---------- | -------- | ------------------------------------------------------------- |
| `question`    | `string`   | yes      | The question or prompt shown to the user.                     |
| `options`     | `Option[]` | yes      | Mutually exclusive choices (`{ label, description? }`, ≥ 1).  |
| `allowCustom` | `boolean`  | no       | When `true`, append a "(Type custom answer)" free-text entry. |

Example tool call:

```json
{
  "question": "Which package manager should I use?",
  "options": [
    { "label": "npm" },
    { "label": "pnpm", "description": "Faster, content-addressable" },
    { "label": "yarn" }
  ],
  "allowCustom": true
}
```

### Behavior

- **Interactive UI**: shows the question, numbered options (with optional
  descriptions rendered inline as `2. pnpm — Faster, content-addressable`),
  and — when `allowCustom` is true — a final `(Type custom answer)` entry
  that opens a text input prompt.
- **Non-interactive** (`pi -p`, JSON mode): throws so the LLM sees an error
  result and stops looping on a tool that has no human to answer it.
- **Cancellation** (Esc / null result / whitespace-only custom answer):
  returns a non-error result with `answer: null` and `cancelled: true`, so
  the calling skill can react explicitly to the user backing out instead of
  treating it as a normal answer.

Tool result content is a short, LLM-friendly string:

| Outcome           | `content[0].text`                       |
| ----------------- | --------------------------------------- |
| Pre-baked option  | `User selected: <n>. <label>`           |
| Free-text answer  | `User wrote: <trimmed text>`            |
| Cancelled         | `User cancelled the selection`          |
| Empty custom text | `User submitted an empty custom answer` |

`details` exposes the structured form (`question`, `options`, `answer`,
`wasCustom`, `cancelled`) for renderers and downstream skills.
