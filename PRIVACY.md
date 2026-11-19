# GetFarman privacy

GetFarman runs on your own computer. It has no server of its own, no account and no telemetry. This page says what it stores, what it sends and where.

## What it stores

GetFarman keeps its files in a folder named `.getfarman` in your user folder.

| File | What it holds |
|---|---|
| `getfarman.db` | Each prompt that you send in Claude Code, the end of Claude's reply and the names of the files that changed. It also holds the reviews of those prompts |
| `config.json` | Your settings |
| `getfarman.log` | What the hooks and the reviews did. Any errors are written here too |
| `token` | A random key that the page uses to talk to its own server |
| `update.json` | When GetFarman last asked npm for the latest version. The answer is kept here too. Only the npm install uses it |

The text is stored as plain text and is readable only by your user account. GetFarman can also read the conversations that Claude Code already keeps in the `.claude/projects` folder. It only reads them and never changes them.

## What it sends and where

| Destination | When | What is sent |
|---|---|---|
| Anthropic, through the `claude` command and your own Claude login | When a review runs | The prompts under review, the end of each reply and the names of the changed files. You can switch off the reply and the file names in Settings |
| The npm registry, `registry.npmjs.org` | At most once a day. Only when GetFarman was installed with npm | A request for the latest version number of the `getfarman` package. Nothing from your log |

Nothing else leaves your computer. The page that shows your log is served on `127.0.0.1`, so only your own computer can reach it.

## What it runs

- Three Claude Code hooks run `node` with GetFarman's own script when you send a prompt, when Claude edits a file and when Claude finishes a reply. They print nothing into your chat.
- A review starts the `claude` command in the background with its tools and its MCP servers switched off.
- The page starts a small web server on `127.0.0.1`. It stops by itself after 30 idle minutes.

## How to delete your data

- `getfarman forget --all` empties the log.
- `getfarman remove --purge` uninstalls GetFarman and deletes its folder.
- Deleting the `.getfarman` folder by hand does the same.

## Contact

Questions about privacy go to the issues page of the repository at https://github.com/chiasabah/GetFarman/issues.
