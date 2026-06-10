# @fgladisch/pi-welcome-message

## 0.4.3

- Wrap long welcome message lines to the terminal width while preserving leading indentation.

## 0.4.2

- Show the Pi logo header even when no package, git, or resource summary sections have content.

## 0.4.1

- Truncate rendered welcome message lines to the terminal width to prevent TUI crashes on long package descriptions.

## 0.4.0

- Add a configurable gradient logo header for the welcome message.

## 0.3.0

- Show the welcome message for new interactive sessions created with `/new`.
- Add the Pi logo and current model header above welcome sections.
- Add `welcomeMessage.showOnNewSession` to control whether `/new` sessions show the welcome message; defaults to `true`.
- Add `welcomeMessage.showLogo` to hide the Pi logo, model line, and header margin; defaults to `true`.
- Document the new welcome message settings in README.

## 0.2.0

- Add `welcomeMessage.sections` support in `~/.pi/agent/settings.json` to enable/disable top-level welcome sections.
- Rename section keys to `nodePackage`, `git`, and `piResources`.
- Document section configuration in README.

## 0.1.0

- Initial release of startup welcome summary (package, git, and pi resources) for interactive sessions.
