// Сколько читать: считаем слова в основном тексте страницы
(() => {
	const root = document.querySelector('article') || document.querySelector('main') || document.querySelector('[role=main]') || document.body;
	if (!root) return;
	const text = (root.innerText || '').replace(/\s+/g, ' ').trim();
	const words = text ? text.split(' ').length : 0;
	if (words < 350) return; // короткие страницы не трогаем
	const min = Math.max(1, Math.round(words / 200));
	const box = document.createElement('div');
	const shadow = box.attachShadow({ mode: 'closed' });
	shadow.innerHTML = '<style>div{position:fixed;right:16px;bottom:16px;z-index:2147483647;padding:7px 12px;border-radius:10px;background:#1c1c25;color:#e8e8f0;font:600 13px system-ui,sans-serif;box-shadow:0 4px 16px rgba(0,0,0,.35);cursor:pointer;opacity:.92}div:hover{opacity:1}</style><div title="Нажми, чтобы спрятать">≈ ' + min + ' мин чтения · ' + words.toLocaleString('ru') + ' слов</div>';
	shadow.querySelector('div').addEventListener('click', () => box.remove());
	document.documentElement.append(box);
})();
