# @fgladisch/pi-welcome-message

## Unreleased

- Truncate rendered welcome message lines to the terminal width to prevent TUI crashes on long package descriptions.

## 0.3.0

- Show the welcome message for new interactive sessions created with `/new`.
- Add `welcomeMessage.showOnNewSession` to control whether `/new` sessions show the welcome message; defaults to `true`.
- Add the Pi logo and current model header above welcome sections.
- Add `welcomeMessage.showLogo` to hide the Pi logo, model line, and header margin; defaults to `true`.
- Document the new welcome message settings in README.

_Changes based on: `4562cd8`._

## 0.2.0

- Add `welcomeMessage.sections` support in `~/.pi/agent/settings.json` to enable/disable top-level welcome sections.
- Rename section keys to `nodePackage`, `git`, and `piResources`.
- Document section configuration in README.

_Changes based on: `e0e3736`._

## 0.1.0

- Initial release of startup welcome summary (package, git, and pi resources) for interactive sessions.

_Changes based on: `c32e7ac`._
