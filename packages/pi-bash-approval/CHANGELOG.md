# @fgladisch/pi-bash-approval

## 0.2.0

- Migrate configuration to `~/.pi/agent/.bash-approval` (rules) and `~/.pi/agent/settings.json` (`bashApproval.splitChains`) instead of `bash-approval.json`.
- Improve shell-chain parsing by ignoring control/declaration scaffolding (`if/then/fi`, `for/do/done`, assignment-only segments) and evaluating real command segments.
- Update reload/help text and non-interactive block reason to point to new config paths.

_Changes based on: `ab08f61`._

## 0.1.0

- Initial release of interactive bash allow-list guard.

_Changes based on: `c32e7ac`._
