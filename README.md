<h1 align="center">Fermande</h1>

<p align="center">
  <img src="assets/icon.svg" alt="Fermande icon" width="128" height="128">
</p>

<p align="center">Fermande is a prompt coach for Claude Code. It shows the shorter, more precise prompt that you could have sent.</p>

Fermande keeps a log of the prompts that you send in Claude Code and of what Claude answered. In the background, Haiku or Sonnet reviews them. For each prompt you get the standard term for the thing that you described and the shortest prompt that would have given the same result. Nothing is written into your chat.

![The page as it opens. The sidebar is on the left and the prompts are on the right](docs/screenshots/messages.png)

The screenshots on this page show sample data.

## How it works

1. You send a prompt in Claude Code. A hook saves the prompt to a file on your computer.
2. Claude replies. A second hook saves the end of the reply and the names of the files that changed.
3. After every 10 new prompts in a session, Haiku reviews those 10 in the background. You can choose Sonnet instead.
4. You open the page at `http://127.0.0.1:4777/` and read the results.

The hooks run outside the model and print nothing, so they add nothing to what Claude reads. No program stays running between prompts.

The reviewer marks each prompt as "Could be better" or "Already precise". For a prompt that could be better it writes the shorter prompt, the term for each lay phrase and a short definition. It works out what you meant from Claude's reply and from the changed files.

## The page

Run `fermande open` in a terminal or type `/fermande` in a Claude Code session. The page opens in your browser. It answers on `127.0.0.1` only, which means that only your own computer can reach it.

### The default view

The page opens on Messages with every session in the list, as in the screenshot above. The newest prompt is at the top.

The sidebar on the left lists your projects and sessions, the terms to keep and the filters. The top bar holds the search box, the three views, "Review now", Settings and the theme button.

A prompt that waits for a review says "Not reviewed yet". "Review now" sends every waiting prompt in the list to the reviewer.

### Messages

![One session in the Messages view. One prompt is opened to show its details](docs/screenshots/session.png)

Your prompt is on the left and the better prompt is on the right. A lay phrase has a dashed underline. Its term has a solid underline in the same colour. The definition of the term is under the pair. Claude's reply and the changed files are below.

The arrow under a prompt's number opens the details. "How the coach knew" says what in the reply or in the files showed the reviewer what you meant.

Click a project or a session in the sidebar to see only its prompts. "Terms to keep" then lists the terms of that session.

### Reviews

![The Reviews view, a table of the same prompts](docs/screenshots/reviews.png)

Reviews shows the same prompts as a table. The columns are You said, Meant, Better and Words. Words gives the length of your prompt and the length of the better one.

### Cards

![The Cards view, one row for each term](docs/screenshots/cards.png)

Cards has one row for each term. A row gives the term, its definition, what you said instead, the project, when you last used it and how often. Click a column name to sort by it. Click a term to see the prompts that it came from.

### Filters

![The filters with a custom period open and one switch turned off](docs/screenshots/filters.png)

The filters are at the bottom of the sidebar. Choose a period (All, Today, 7 days or 30 days) or choose Custom and set your own From and To.

Three switches show or hide the prompts that could be better, the ones that are already precise and the ones that are not reviewed yet. A fourth switch hides Claude's replies.

### The sidebar

<p align="center">
  <img src="docs/screenshots/view-menu.png" alt="The View choices at the top of the sidebar" width="270">
</p>

"View" opens the choices for the sidebar. Arrange the entries by project or as one list. Order them by latest prompt, start, name or size. Show the prompts of a session oldest first or newest first. Choose whether an entry shows its date, its prompt count and its state bar.

The button at the top edge of the sidebar folds it to a narrow rail. The rail keeps two letters for each project and the three filter signs.

![The sidebar folded to a narrow rail](docs/screenshots/rail.png)

### Pick the prompts to review

![Three prompts selected. The Review selected button is in the top right](docs/screenshots/selection.png)

Click a prompt's number to select it. "Review selected" then reviews only the prompts that you picked. A prompt that was reviewed before is reviewed again in place.

### Settings

![The Settings panel](docs/screenshots/settings.png)

| Setting | What it does |
|---|---|
| Mode | Automatic reviews after a set number of prompts. By hand reviews only when you ask. Off also stops the log. |
| Review every | The number of new prompts that starts a review, from 3 to 50. |
| Reviewer | Haiku is quick and cheap. Try Sonnet if the terms come back too general. |
| Reviewer's instructions | The text that the reviewer is given. You can edit it and you can restore the default. |
| Send with each prompt | Whether the reviewer also gets the end of Claude's reply and the changed files. |
| History | Reads the conversations that Claude Code already keeps on your computer. |

### Dark theme

![The page in the dark theme](docs/screenshots/dark.png)

The button at the right of the top bar switches between the light theme and the dark theme.

## Install

Fermande needs Python 3.8 or newer and Claude Code. It works on Windows, macOS and Linux.

On Windows, open the `fermande` folder and run `install.cmd`.

On macOS and Linux, run this in the `fermande` folder.

```sh
./install.sh
```

Then check the install and open the page.

```sh
fermande doctor --call
fermande open
```

## Commands

Type these in a Claude Code session. The hook answers them, so they never reach Claude.

| Command | What happens |
|---|---|
| `/fermande` | Opens the page |
| `/fermande now` | Reviews the new prompts that wait in this session |
| `/fermande status` | Shows the mode, the counts and the last review |
| `/fermande on`, `hand` or `off` | Sets the mode |

In a terminal, `fermande model sonnet` changes the reviewer and `fermande remove` uninstalls Fermande.

## Privacy

Your prompts and the ends of Claude's replies are stored as plain text in `~/.fermande/fermande.db`. They leave your computer only when a review sends them to Claude through your own `claude` login. `fermande forget --all` empties the log.

## Full guide

The full guide is in [fermande/README.md](fermande/README.md). It covers every command, the files that Fermande keeps and what to do when something fails.
