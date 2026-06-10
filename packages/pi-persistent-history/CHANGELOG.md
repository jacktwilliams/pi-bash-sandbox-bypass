# @fgladisch/pi-persistent-history

## 0.4.2

- Fix a startup crash caused by a recursive extension shortcut handler when reusing Pi's focused editor for history injection.

## 0.4.1

- Style `[Persistent History]` heading with `theme.bold(theme.fg("mdHeading", `[${HEADING}]`))` in the custom status message renderer.

## 0.4.0

- Render startup and status output in multiline section format:
  - `[Persistent History]`
  - `  Loaded N entries (max: M)`
  - `  Since: YYYY/MM/DD, HH:mm`
  - `  From file: .pi/input-history.jsonl`
- Keep reload message behavior unchanged.

## 0.3.0

- Render persistent history startup/reload/status updates as custom messages via `pi.sendMessage` and `registerMessageRenderer`.
- Preserve existing history behavior while improving status message presentation in the TUI.

## 0.2.0

- Switch project history storage to JSONL at `<project>/.pi/input-history.jsonl` with one entry per line.
- Persist Unix timestamps (milliseconds) with each history line.
- Load `maxEntries` and `showStartupMessage` from `~/.pi/agent/settings.json` under `persistentHistory`.
- Add one-line startup/status summary format:
  `[Persistent History] Loaded N entries (max: M) since YYYY/MM/DD, HH:mm from .pi/input-history.jsonl.`

## 0.1.0

- Initial release of per-project prompt history persistence with startup injection and reload/status commands.
