---
"@fgladisch/pi-bash-approval": minor
---

Move bash-approval config to `~/.pi/agent/settings.json` (`bashApproval.splitChains`) and migrate allow-list rules to `~/.pi/agent/.bash-approval` newline format.

Also improve command evaluation by ignoring shell control/declaration segments (`if`/`for` scaffolding, assignment-only segments) so approval decisions focus on actual executable commands.
