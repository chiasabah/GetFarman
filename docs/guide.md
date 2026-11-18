# GetFarman guide

A sidecar prompt coach for Claude Code. It keeps a log of what you said and what Claude answered, and in the background it works out what you could have said: the standard term for the thing you described, and the shortest prompt that would have had the same result.

Its goal is to help you, the operator, write prompts with more specific terms. So it is a prompt buddy that coaches your prompts, corrects your terminology and keeps a glossary of the terms that you learnt.

Nothing is ever written into your chat. GetFarman runs beside the session, not in it. Reading the conversations that Claude Code already keeps does not change that. GetFarman only reads them.

## What it does

- **Logs every prompt** you send in Claude Code, with the end of Claude's reply and the files that changed, to one SQLite file.
- **Reads your history.** At install it reads the conversations that Claude Code already keeps on this machine, so the log does not start empty.
- **Reviews in the background.** After every 10 new prompts of a session, Haiku reviews those 10 and nothing else. You can choose Sonnet instead. You can also review any prompts you pick.
- **Shows it all on one page**: sessions, your prompt beside the better one, the lay phrase matched to its term, a glossary for each session, filters, a period picker and a selection to review.

## Install

GetFarman needs Node 22.13 or newer and Claude Code. It works on Windows, macOS and Linux. It uses no packages, only what Node ships with.

```sh
npx getfarman
```

The first run sets GetFarman up and opens the log in your browser. `yarn dlx getfarman` does the same. The setup also puts the `getfarman` command on your PATH, so from then on you type `getfarman` in any new terminal, without npx.

The setup:

1. copies the app to `~/.getfarman/app`, so that the hooks keep working after npx clears its cache;
2. creates `~/.getfarman/getfarman.db` and `config.json`;
3. adds three hooks to `~/.claude/settings.json`, after saving a backup beside it, and leaves your other hooks alone;
4. adds the `/getfarman` command (`~/.claude/skills/getfarman`);
5. puts the `getfarman` command on your PATH. It uses `~/.local/bin` when that folder is on your PATH already. Otherwise it adds `~/.getfarman/bin` to your PATH, in your user settings on Windows and in your shell's start-up file elsewhere (skip with `--no-path`);
6. reads your existing conversations (skip with `npx getfarman --no-history`).

Then check it:

```sh
getfarman doctor --call   # checks the install and tries one real review
getfarman open            # opens the log in your browser
```

Open a new terminal after the first run, so that it sees the new PATH. If `getfarman` is still not found, run `npx getfarman setup` again. Inside Claude Code, `/getfarman` always works.

On Windows, `~` in this guide means your user folder, for example `C:\Users\You`. If you run Claude Code inside WSL, run `npx getfarman` there instead.

Claude Code picks up the new hooks by itself. If nothing is logged after your next prompt, restart Claude Code once.

## How it works

```
 you type a prompt ──► UserPromptSubmit hook ──► row in getfarman.db        (prints nothing)
 Claude edits files ─► PostToolUse hook ───────► file names on that row    (prints nothing)
 Claude finishes ────► Stop hook ──────────────► end of the reply on the row
                              │
                              └─ counter: 10 new prompts waiting in this session?
                                    └─ yes ─► detached reviewer ─► claude -p (Haiku) ─► results in getfarman.db

 getfarman open ──► small local server ──► the page reads getfarman.db and shows it live
```

- **The hooks** are one small Node script. It reads what Claude Code hands it, writes to SQLite and exits. It never prints to the chat, so nothing enters the context. If it ever fails, it fails silently into `~/.getfarman/getfarman.log` and your session carries on.
- **The counter** looks only at prompts logged live in the current session. When 10 wait, it hands exactly those 10 to a detached process and returns at once. It never touches imported history and never runs twice at the same time for one session.
- **The reviewer** runs `claude -p` with your normal login, with tools, hooks, MCP servers and session saving all switched off, from an empty folder. It gets the prompts, the end of each reply and the changed files, and returns a verdict for each prompt. No daemon stays running.
- **The page's server.** `getfarman open` starts a small HTTP server so that your browser can show the log. It answers on `127.0.0.1` only, which means only this computer, and it stops by itself after 30 idle minutes. Stop it sooner with "Stop the server" in Settings, or with `getfarman stop`. Logging and reviews do not need it.

Why not the system prompt or CLAUDE.md? Anything put there is read by Claude on every turn, which is the thing you wanted to avoid. Hooks run outside the model.

## Using it

### In a Claude Code session

Type these like any command. The hook answers and blocks them, so they never reach Claude.

| Command | What happens |
|---|---|
| `/getfarman` | Opens the log in your browser |
| `/getfarman now` | Reviews the new prompts that wait in this session |
| `/getfarman status` | Mode, counts and the last review |
| `/getfarman on` / `hand` / `off` | Automatic, by hand, or off |
| `/getfarman every 5` | Review after every 5 prompts |
| `/getfarman import` | Reads Claude Code's history again |

### In a terminal

```
getfarman open              open the log in your browser
getfarman now               review the new prompts that wait in the most recent session
getfarman import [--days N] read the conversations Claude Code already keeps into the log
getfarman status            mode, counts and the last review
getfarman mode MODE         automatic | by_hand | off
getfarman every N           automatic: review after every N prompts (3 to 50)
getfarman model NAME        haiku | sonnet | any name that claude --model takes
getfarman glossary [ID]     the terms taught, for one session id or for all
getfarman forget OPTION     --all | --session ID | --older-than DAYS
getfarman doctor [--call]   check the installation; --call also tries one review
getfarman stop              stop the page's server
getfarman update [--check]  install the latest version from npm; --check only says whether there is one
getfarman setup             install or update: the hooks, the /getfarman command and the app
getfarman remove [--purge]  uninstall; --purge also deletes the log
```

### On the page

- **Top bar:** what the list shows (everything, one project, or one session with its project in front), the prompt search, the three views, "Review now", Settings and the theme. The chip next to "Live" shows the coach's mode; click it to change the mode.
- **Search prompts and terms** (top bar, shortcut `/`) narrows the prompts, and in the Glossary view the terms. It looks in what you said, the better prompt, Claude's reply and the terms.
- **Sidebar, projects first:** each project is the folder that Claude Code ran in. Click a project to see only its prompts and to open its sessions. The one with the latest prompt comes first.
- **The round button on the sidebar's edge** folds the sidebar to a narrow rail: two letters for each project and the three filter signs. It does not hide the sidebar. The same button opens it again.
- **Search sessions and projects** (top of the sidebar) narrows the sidebar. Type a project name and only that project and its sessions stay. It never changes the list of prompts.
- **View** (next to the sidebar heading) is where you arrange the entries: by project or as one list, ordered by latest prompt, start, name or size, prompts newest or oldest first, and whether an entry shows its date, its count and its state bar. The newest prompt comes first unless you change it. Your choice is remembered.
- **Filters** (bottom of the sidebar, always in reach): a period (All, Today, 7 days, 30 days, or your own From and To) and switches for "Could be better", "Already precise" and "Not reviewed yet".
- **Messages:** your prompt on the left, the better prompt on the right. The lay phrase has a dashed underline and the term a solid one, in the same colour. Under each pair is the term's definition. Claude's reply and the changed files sit underneath.
- **Reviews:** the same prompts as a table: you said, meant, better, words. The arrow under a prompt's number opens a long prompt in full and shows how the coach knew.
- **Glossary:** one row for each term: the term, its definition, what you said instead, the project, when it was last used and how often. Click a column name to sort by it, and again to turn the order round. Click a term to see the prompts behind it. The glossary follows the project or session that you chose, the period and the search. The Since taught column shows whether you wrote the term yourself in a later prompt, described it again in other words, or neither. It is a plain text comparison, not a model.
- **"found, not used":** the reviewer is told to use every term it names inside the better prompt. After each review, GetFarman compares the term with the better prompt as plain text, with no model, and marks a pair whose term is missing.
- **System reminders:** an app can put its own text in front of what you typed, for example a note about other sessions. GetFarman folds that text into a yellow block above your prompt, leaves it out of the word count, and does not send it to the reviewer. A reminder in the middle of your text stays where it is.
- **Review now:** reviews everything that waits in the current view, the latest 300 at most.
- **Pick your own:** click a prompt's number to select it, or use the box at the left of the header row to select everything in a list of 300 prompts or fewer. Then press "Review selected". Prompts that were reviewed before are reviewed again in place.
- **Settings:** mode, the number of prompts, the model, what the reviewer is sent, "Read history again", and "Stop the server".
- **Reviewer's instructions:** Settings, then "Edit". Change what the reviewer is told: other fields, another tone, stricter or looser rules. The next review uses what you save, and "Restore the default" brings the built-in text back. GetFarman adds the output format after your text, so an edit cannot break the page.

The list draws only the rows near the window, so a log of many thousands of prompts stays quick.

## Modes

| Mode | Logging | Reviews |
|---|---|---|
| Automatic | yes | after every N new prompts of a session |
| By hand | yes | only when you ask |
| Off | no | none |

## Where things live

```
~/.getfarman/
  getfarman.db           the log (SQLite)
  config.json           settings; the hooks read it at every prompt
  update.json           what the last look at the npm registry found
  getfarman.log          what the hooks and reviews did, and any errors
  reviewer_prompt.txt   your own reviewer instructions, once you edit them on the page
  app/bin/getfarman.js   the whole engine
  app/ui/index.html     the page
  bin/getfarman          the command (getfarman.cmd on Windows)
```

Tables in `getfarman.db`:

| Table | Holds |
|---|---|
| `sessions` | one row for each Claude Code session: title, project folder, times |
| `turns` | one row for each prompt: what you said, the end of the reply, changed files, the verdict, the better prompt, and whether it was logged live or imported |
| `pairs` | each lay phrase with its term and a short definition |
| `glossary` | the terms taught in each session, with how often and in which words you said them |
| `reviews` | each review: when, by which model, how many prompts, cost, any error |
| `review_items`, `imports`, `meta` | bookkeeping |

Query it yourself with `sqlite3 ~/.getfarman/getfarman.db`.

## Privacy and cost

- Your prompts and the ends of Claude's replies are stored in plain text in `~/.getfarman/getfarman.db`, readable only by your user. They leave your machine only when a review sends them to Claude through your own `claude` login.
- The page answers on `127.0.0.1` only and needs a key that only the page itself carries.
- Once a day GetFarman asks the npm registry which version is the latest. The request carries the package name and nothing from your log. `getfarman config update_check off` stops it.
- The reviewer runs with its tools and its MCP servers switched off. Text from your log is escaped before it is sent. So an instruction inside a pasted page cannot make the reviewer read or change anything on your computer.
- A review is one small call for up to 12 prompts. Reviewing 300 prompts is about 25 calls.
- `getfarman forget --all` empties the log.

## History

New prompts reach the log live: Claude Code calls the hooks at the moment you send a prompt and again when the reply ends. GetFarman does not watch or poll Claude Code's files. It reads them at install and when you press "Read history again", which you need only for sessions from before the install. The page asks GetFarman's own database every few seconds whether something changed.

When you resume a session, Claude Code writes a new file that repeats the earlier messages. GetFarman keeps each prompt once, with the session that it was first sent in, and dates every session by its own prompts.

Claude Code keeps its conversations under `~/.claude/projects` and by default deletes them after 30 days, so the import reaches back about that far. The file format is internal to Claude Code and can change between versions. GetFarman reads it tolerantly and skips what it does not recognise; if an update changes the format, new history may stop importing until GetFarman is updated. Live logging through the hooks does not depend on that format.

## Uninstall

```sh
getfarman remove           # removes the hooks, the command and the app; keeps the log
getfarman remove --purge   # also deletes the log and settings
```


## If something is off

| You see | Do this |
|---|---|
| Nothing is logged | `getfarman doctor`. If the hooks are listed, restart Claude Code. Check `getfarman status` is not "off". |
| "This version of claude does not know `--tools`" | Update Claude Code, then press "Review now". GetFarman runs a review only when the reviewer's tools can be switched off. |
| "The update did not finish" | Run `npx getfarman@latest` yourself. It installs the latest version and keeps your log. |
| "The last review failed" | The reason is on the page and in `getfarman status`. A login problem needs `claude` to work in a terminal first; then press "Review now". |
| `/getfarman` reaches Claude | The hook did not run. `getfarman doctor`, then run `getfarman setup`. |
| A hook error after a Node update | Run `getfarman setup`. It records the new path to Node. |
| "GetFarman needs Node 22.13 or newer" | Install a newer Node from nodejs.org, then run `npx getfarman` again. |
| The page says "Offline" | Run `getfarman open` again. The server stops after 30 idle minutes. |
| "GetFarman was updated, but the server…" | Press "Stop the server" in that notice, then run `getfarman open`. The server restarts itself after an update. |
| A prompt you just sent seems missing | It is in the session at the top of the sidebar. Inside a session the newest prompt is at the bottom; View, "Newest first" turns that round. |
| Terms come back too general | `getfarman model sonnet`, or edit the reviewer's instructions in Settings. |
