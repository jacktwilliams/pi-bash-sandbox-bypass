# pi-sandbox-bypass

I forked https://github.com/fgladisch/pi-extensions
However I'm only interested in their pi-bash-approval extension.

The problem I'm trying to solve is described here
https://github.com/carderne/pi-sandbox/issues/50

Now I made this fork to adjust the extension so that it exposes a bash_full_permissions tool. The system prompt should guide the model to use the bash tool. If the bash tool fails with permissions issues, then the model should select the bash_full_permissions tool, which will prompt me whether I want to allow it or not. I can also use the existing allowlist config from the forked extension, so that some commands can be ran unsandboxed without a prompt.
