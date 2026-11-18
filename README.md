**Русский** · [English](README.en.md)

# Аддоны Problet

Каталог аддонов для браузера [Problet](https://github.com/cersat/Problet). Каждый аддон — папка с файлом `addon.json` и файлами рядом с ним. Список аддонов, который показывает браузер, лежит в `index.json`.

## Как установить

«Настройки» → «Расширения» → «Добавить аддон Problet», дальше одно из трёх:

- выбрать аддон из списка (это каталог из этого репозитория);
- «Добавить по ссылке» — ссылка на `addon.json`, остальные файлы браузер скачает рядом с ним (подходит и обычная ссылка на файл на GitHub);
- «Загрузить архив» — `.zip`, где `addon.json` лежит в корне или в единственной папке.

Перед установкой браузер показывает, что аддон сможет делать. Установленные аддоны видны в том же списке, что и расширения Chrome, их кнопки ставятся на панели в «Настройки» → «Панели».

## Аддоны

| Аддон | Что делает | Разрешения |
| --- | --- | --- |
| 🌙 Тёмные сайты | Тёмная тема для выбранных сайтов, картинки и видео в своих цветах | storage, tabs |
| ⏱ Время чтения | Сколько минут читать длинную статью | — |
| 🗂 Наборы вкладок | Сохранить открытые вкладки набором и открыть снова | storage, tabs |
| 📝 Страница в Markdown | Сохранить страницу в файл .md | tabs, pages, files, notifications |
| ⏩ Скорость видео | Клавиши скорости и перемотки для любого видео | storage |
| >_ Быстрая команда | Выполнить команду в системе прямо с панели | exec, storage |
| 📖 Режим чтения | Чистый текст статьи без меню и рекламы, размер шрифта, ширина и тема | storage, tabs |
| ⬇ Скачать картинки и видео | Список картинок и видео страницы, сохранение выбранных в папку | tabs, pages, network, files |
| { } JSON | JSON-страницы деревом: сворачивание, поиск, копирование значения и пути | — |

## Формат addon.json

```json
{
	"id": "my-addon",
	"name": "Мой аддон",
	"version": "1.0.0",
	"description": "Что он делает",
	"locales": { "en": { "name": "My addon", "description": "What it does", "buttonTitle": "Button hint" } },
	"icon": "🧩",
	"permissions": ["storage", "tabs"],
	"content": [{ "matches": ["*://*.example.com/*"], "js": ["content.js"], "css": ["content.css"], "runAt": "end" }],
	"background": "background.js",
	"button": { "title": "Подсказка кнопки", "popup": "popup.html" },
	"options": "options.html",
	"files": ["картинка.png"]
}
```

- `id` — латинские буквы, цифры и дефис, до 40 символов. Совпадает с названием папки в каталоге.
- `locales` — по желанию: название, описание и подсказка кнопки на других языках (пока `en`). Если язык интерфейса Problet английский, браузер показывает их вместо основных. Свои надписи аддон переводит сам по `problet.lang`.
- `icon` — эмодзи или символ (до 4 знаков) либо путь к `.svg` или `.png`.
- `content` — скрипты и стили для страниц сайтов. `matches` — шаблоны как у расширений Chrome: `<all_urls>`, `*://*/*`, `https://*.site.ru/path*`. `runAt`: `start` (до скриптов страницы), `end` (DOM готов, по умолчанию), `idle` (страница загрузилась). Скрипты работают в отдельном мире: DOM общий со страницей, а переменные страницы не видны.
- `background` — фоновый скрипт, работает всё время, пока открыт браузер.
- `button` — кнопка на панели. С `popup` по нажатию открывается окошко, без него нажатие получает фон (`problet.on('buttonClick', …)`).
- `options` — страница настроек, открывается кнопкой «Настройки» в списке расширений.
- `files` — дополнительные файлы, которые надо скачать при установке по ссылке (то, что указано в других полях, скачивается само).

## Разрешения

Без вопросов (только то, что заявлено в `permissions`):

- `storage` — свои данные (до 5 МБ);
- `notifications` — уведомления;
- `tabs` — список вкладок, открыть, закрыть, переключить, перезагрузить, сообщения скриптам на страницах.

Спрашивают человека при первом использовании (ответ запоминается, сбросить можно в настройках):

- `pages` — выполнять код на любой открытой странице;
- `network` — запросы к любым сайтам без ограничений CORS;
- `bookmarks` — читать и добавлять закладки;
- `history` — читать историю;
- `clipboard` — буфер обмена.

Спрашивают при каждом действии, показывая что именно (можно ответить «Разрешать всегда»):

- `files` — читать и записывать файлы (файл, который человек сам выбрал через `files.pick`, не спрашивается);
- `exec` — запускать программы и команды.

## API

В фоне и на страницах аддона (окошко кнопки, настройки) есть объект `problet`. Все методы возвращают Promise.

```js
problet.lang                            // язык интерфейса браузера: 'ru' или 'en' (не метод, а строка)
problet.info()                          // { id, name, version, permissions, problet, platform }
problet.on(name, fn)                    // события: buttonClick, message, tabCreated, tabUpdated, tabActivated, tabClosed
problet.storage.get(key?) / set(key, value) / remove(key)
problet.notify(title, body)
problet.tabs.list() / active()          // [{ id, url, title, active }]
problet.tabs.open(url, { active }) / close(id) / activate(id) / navigate(id, url) / reload(id)
problet.tabs.eval(id, code)             // pages: результат кода на странице
problet.tabs.send(id, message)          // скриптам этого аддона на странице
problet.fetch(url, { method, headers, body, as: 'base64' })   // network: { status, ok, url, headers, text, base64 }
problet.bookmarks.list() / add({ title, url })
problet.history.list(limit)
problet.clipboard.read() / write(text)
problet.files.pick({ save, name, folder }) / read(path, 'base64'?) / write(path, data, 'base64'?) / list(dir) / reveal(path)
problet.exec(command)                   // через оболочку системы
problet.exec(file, [args], { cwd, timeout })   // без оболочки; { code, stdout, stderr }
problet.button.setTitle(text)
problet.openOptions()
```

Обработчик события `message` получает `{ message, tab }`, и то, что он вернёт, становится ответом для скрипта страницы.

В скриптах на страницах (`content`) свой объект `problet`:

```js
problet.id
problet.lang                // 'ru' или 'en'
problet.send(message)       // в фон аддона, ответ — то, что вернул обработчик message
problet.onMessage(fn)       // сообщения из фона (tabs.send)
problet.storage.get(key) / set(key, value)   // если есть разрешение storage
```

## Как добавить аддон в каталог

Положи папку аддона в корень репозитория и добавь запись в `index.json`:

```json
{ "id": "my-addon", "name": "Мой аддон", "version": "1.0.0", "description": "…", "locales": { "en": { "name": "My addon", "description": "…" } }, "icon": "icon.svg", "path": "my-addon/" }
```

`icon` — как в `addon.json`: эмодзи или путь к `.svg` или `.png` внутри папки аддона.
