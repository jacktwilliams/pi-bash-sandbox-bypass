---
"@fgladisch/pi-persistent-history": minor
---

Release 0.2.0 with JSONL-based project history and richer startup reporting.

- switch history file to `.pi/input-history.jsonl`
- write Unix timestamps (milliseconds) per JSONL line
- load `maxEntries` and `showStartupMessage` from `~/.pi/agent/settings.json` under `persistentHistory`
- show one-line startup/status summary:
  `[Persistent History] Loaded N entries (max: M) since YYYY/MM/DD, HH:mm from .pi/input-history.jsonl.`
