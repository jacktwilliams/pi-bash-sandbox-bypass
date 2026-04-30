# pi-extensions

Monorepo for personal Pi extensions.

This root workspace holds shared tooling and local auto-discovery shims
(`*.ts`). Source-of-truth extension code and full documentation live in
`packages/`.

> Do **not** add a `pi.extensions` field to root `package.json` — that would
> override Pi auto-discovery.

## Packages

- [`@fgladisch/pi-bash-approval`](packages/pi-bash-approval/README.md)
- [`@fgladisch/pi-caveman`](packages/pi-caveman/README.md)
- [`@fgladisch/pi-user-select`](packages/pi-user-select/README.md)
- [`@fgladisch/pi-welcome-message`](packages/pi-welcome-message/README.md)
