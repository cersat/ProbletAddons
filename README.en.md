[Русский](README.md) · **English**

# Problet addons

A catalog of addons for the [Problet](https://github.com/cersat/Problet) browser. Each addon is a folder with an `addon.json` file and files next to it. The list of addons shown by the browser is in `index.json`.

## How to install

Settings → Extensions → “Add a Problet addon”, then one of three ways:

- pick an addon from the list (this is the catalog from this repository);
- “Add by a link” — a link to `addon.json`; the browser downloads the other files next to it (an ordinary link to a file on GitHub works too);
- “Upload an archive” — a `.zip` where `addon.json` is in the root or in the only folder.

Before installing, the browser shows what the addon will be able to do. Installed addons appear in the same list as Chrome extensions, and their buttons are placed on the bars in Settings → Bars.

## Addons

| Addon | What it does | Permissions |
| --- | --- | --- |
| 🌙 Dark Sites | A dark theme for chosen sites; images and videos keep their own colors | storage, tabs |
| ⏱ Reading Time | How many minutes a long article takes to read | — |
| 🗂 Tab Sets | Save the open tabs as a set and open them again | storage, tabs |
| 📝 Page as Markdown | Save a page to an .md file | tabs, pages, files, notifications |
| ⏩ Video Speed | Speed and seek keys for any video | storage |
| >_ Quick Command | Run a system command right from the bar | exec, storage |

## The addon.json format

```json
{
	"id": "my-addon",
	"name": "My addon",
	"version": "1.0.0",
	"description": "What it does",
	"locales": { "en": { "name": "My addon", "description": "What it does", "buttonTitle": "Button hint" } },
	"icon": "🧩",
	"permissions": ["storage", "tabs"],
	"content": [{ "matches": ["*://*.example.com/*"], "js": ["content.js"], "css": ["content.css"], "runAt": "end" }],
	"background": "background.js",
	"button": { "title": "Button hint", "popup": "popup.html" },
	"options": "options.html",
	"files": ["picture.png"]
}
```

- `id` — Latin letters, digits and hyphens, up to 40 characters. Matches the folder name in the catalog.
- `locales` — optional: the name, description and button hint in other languages (only `en` for now). If Problet’s interface language is English, the browser shows them instead of the main ones. The addon translates its own labels itself using `problet.lang`.
- `icon` — an emoji or a symbol (up to 4 characters) or a path to an `.svg` or `.png`.
- `content` — scripts and styles for web pages. `matches` — patterns like in Chrome extensions: `<all_urls>`, `*://*/*`, `https://*.site.ru/path*`. `runAt`: `start` (before the page’s scripts), `end` (DOM ready, the default), `idle` (the page has loaded). Scripts run in a separate world: the DOM is shared with the page, but the page’s variables are not visible.
- `background` — a background script that runs all the time while the browser is open.
- `button` — a button on the bar. With `popup` a window opens on click; without it the click goes to the background (`problet.on('buttonClick', …)`).
- `options` — a settings page, opened by the “Settings” button in the extension list.
- `files` — extra files to download when installing by a link (whatever is named in other fields is downloaded automatically).

## Permissions

Without asking (only what is declared in `permissions`):

- `storage` — its own data (up to 5 MB);
- `notifications` — notifications;
- `tabs` — the list of tabs; open, close, switch, reload; messages to scripts on pages.

Ask the user on first use (the answer is remembered and can be reset in the settings):

- `pages` — run code on any open page;
- `network` — requests to any sites without CORS limits;
- `bookmarks` — read and add bookmarks;
- `history` — read history;
- `clipboard` — the clipboard.

Ask on every action, showing exactly what (you can answer “Always allow”):

- `files` — read and write files (a file the user picked through `files.pick` is not asked about);
- `exec` — run programs and commands.

## API

In the background and on the addon’s pages (the button window, settings) there is a `problet` object. All methods return a Promise.

```js
problet.lang                            // the browser interface language: 'ru' or 'en' (a string, not a method)
problet.info()                          // { id, name, version, permissions, problet, platform }
problet.on(name, fn)                    // events: buttonClick, message, tabCreated, tabUpdated, tabActivated, tabClosed
problet.storage.get(key?) / set(key, value) / remove(key)
problet.notify(title, body)
problet.tabs.list() / active()          // [{ id, url, title, active }]
problet.tabs.open(url, { active }) / close(id) / activate(id) / navigate(id, url) / reload(id)
problet.tabs.eval(id, code)             // pages: the result of code on the page
problet.tabs.send(id, message)          // to this addon’s scripts on the page
problet.fetch(url, { method, headers, body, as: 'base64' })   // network: { status, ok, url, headers, text, base64 }
problet.bookmarks.list() / add({ title, url })
problet.history.list(limit)
problet.clipboard.read() / write(text)
problet.files.pick({ save, name, folder }) / read(path, 'base64'?) / write(path, data, 'base64'?) / list(dir) / reveal(path)
problet.exec(command)                   // through the system shell
problet.exec(file, [args], { cwd, timeout })   // without a shell; { code, stdout, stderr }
problet.button.setTitle(text)
problet.openOptions()
```

The `message` event handler receives `{ message, tab }`, and whatever it returns becomes the reply for the page script.

Scripts on pages (`content`) have their own `problet` object:

```js
problet.id
problet.lang                // 'ru' or 'en'
problet.send(message)       // to the addon background; the reply is what the message handler returned
problet.onMessage(fn)       // messages from the background (tabs.send)
problet.storage.get(key) / set(key, value)   // if the storage permission is granted
```

## How to add an addon to the catalog

Put the addon’s folder in the repository root and add an entry to `index.json`:

```json
{ "id": "my-addon", "name": "My addon", "version": "1.0.0", "description": "…", "locales": { "en": { "name": "My addon", "description": "…" } }, "icon": "🧩", "path": "my-addon/" }
```
