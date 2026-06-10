# @fgladisch/pi-footer

## 0.8.0

### Minor Changes

- Add optional provider segment to display the active model's provider before the model segment.

## 0.7.0

### Minor Changes

- Add a `customMessageBg` background, horizontal padding, and matching pointed cap to the footer.

## 0.6.1

### Patch Changes

- Hide footer segments when their runtime data is unavailable.

## 0.6.0

### Minor Changes

- Add configurable context usage segment to the footer.

## 0.5.2

### Patch Changes

- Render footer items and extension statuses with the explicit theme `text` color.

## 0.5.1

### Patch Changes

- Normalize extension status colors in the footer by stripping existing ANSI styling and reapplying the dim footer color.

## 0.5.0

### Minor Changes

- Add a configurable prompt input prefix, defaulting to an accent-colored `➜` via `promptInput.prefix` in `footer.json`.

## 0.4.1

### Patch Changes

- Show the current thinking level in the footer immediately on session start.

## 0.4.0

### Minor Changes

- Render the footer as one line, display the selected model/thinking level, and rename the visibility settings from `show` to `segments`.

## 0.3.0

### Minor Changes

- Render extension status entries from `ctx.ui.setStatus()` after the git branch.

## 0.2.0

### Minor Changes

- Add minimal configurable Pi footer extension.

## 0.1.0

### Minor Changes

- Initial package version for the Pi footer extension.
