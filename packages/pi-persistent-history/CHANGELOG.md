# @fgladisch/pi-persistent-history

## 0.2.0

- Switch project history storage to JSONL at `<project>/.pi/input-history.jsonl` with one entry per line.
- Persist Unix timestamps (milliseconds) with each history line.
- Load `maxEntries` and `showStartupMessage` from `~/.pi/agent/settings.json` under `persistentHistory`.
- Add one-line startup/status summary format:
  `[Persistent History] Loaded N entries (max: M) since YYYY/MM/DD, HH:mm from .pi/input-history.jsonl.`

_Changes based on: `ef2a22b`._

## 0.1.0

- Initial release of per-project prompt history persistence with startup injection and reload/status commands.

_Changes based on: `3f9e7fb`._
