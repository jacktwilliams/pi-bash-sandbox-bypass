# @fgladisch/pi-persistent-history

Persist Pi prompt input history per project.

## Install

```bash
pi install npm:@fgladisch/pi-persistent-history
```

## Behavior

- Stores history in `<project>/.pi/input-history.jsonl`
- Writes each line with prompt text + Unix timestamp (milliseconds)
- Captures prompts from `input` events (including slash commands)
- Skips consecutive duplicates
- Reads `maxEntries` only from `~/.pi/agent/settings.json` at `persistentHistory.maxEntries` (default `250`)
- Loads and injects history at startup for up/down recall
- In non-interactive mode, performs no action

## Slash commands

- `/history-reload` — Reload project history file and re-inject entries into editor history
- `/history-status` — Show file path, entry count, maxEntries, and injection status

## Settings

Global settings file path: `~/.pi/agent/settings.json`.

This extension reads `persistentHistory.maxEntries` and `persistentHistory.showStartupMessage` from that file (on startup and `/history-reload`).

```json
{
  "persistentHistory": {
    "maxEntries": 250,
    "showStartupMessage": true
  }
}
```

- `persistentHistory.maxEntries`: number of lines kept in project JSONL history (default `250`)
- `persistentHistory.showStartupMessage`: show one-line startup notify like `[Persistent History] Loaded N entries (max: M) since YYYY/MM/DD, HH:mm from .pi/input-history.jsonl.` (default `true`)

## File format

```json
{"text":"summarize src/auth/session.ts and suggest 3 refactors","timestamp":1746523456123}
{"text":"/model claude-sonnet-4","timestamp":1746523470091}
{"text":"write failing tests for retry timeout edge cases","timestamp":1746523484550}
```
