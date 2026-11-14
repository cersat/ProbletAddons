// Режим чтения: берём основной текст страницы и показываем его поверх, в закрытом shadow DOM
(() => {
	const L = (ru, en) => (problet.lang === 'en' ? en : ru);
	const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'NAV', 'FOOTER', 'ASIDE', 'FORM', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'SVG', 'IFRAME', 'TEMPLATE', 'DIALOG', 'CANVAS', 'VIDEO', 'AUDIO']);
	const KEEP = new Set(['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'UL', 'OL', 'LI', 'BLOCKQUOTE', 'PRE', 'CODE', 'EM', 'I', 'STRONG', 'B', 'U', 'SUB', 'SUP', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD', 'FIGURE', 'FIGCAPTION', 'BR', 'HR', 'A', 'IMG', 'DL', 'DT', 'DD']);
	const abs = (u) => { try { const x = new URL(u, location.href); return /^https?:$/.test(x.protocol) ? x.href : ''; } catch (e) { return ''; } };
	const hidden = (el) => { const s = getComputedStyle(el); return s.display === 'none' || s.visibility === 'hidden'; };

	// Ищем главный блок: article / main, иначе тот, где больше всего текста в абзацах
	function findRoot() {
		const direct = document.querySelector('article') || document.querySelector('[role=main]') || document.querySelector('main');
		if (direct && (direct.innerText || '').length > 400) return direct;
		let best = null;
		let bestScore = 0;
		for (const el of document.querySelectorAll('div, section, td')) {
			if (SKIP.has(el.tagName)) continue;
			let score = 0;
			for (const p of el.children) if (p.tagName === 'P') score += (p.textContent || '').trim().length;
			if (score > bestScore) { best = el; bestScore = score; }
		}
		return bestScore > 300 ? best : direct || document.body;
	}

	// Копия без лишнего: только разрешённые теги, без стилей и скриптов, ссылки и картинки с полными адресами
	function clean(src, out) {
		for (const n of src.childNodes) {
			if (n.nodeType === 3) { out.append(document.createTextNode(n.textContent)); continue; }
			if (n.nodeType !== 1 || SKIP.has(n.tagName.toUpperCase()) || hidden(n)) continue;
			const tag = n.tagName.toUpperCase();
			if (!KEEP.has(tag)) { clean(n, out); continue; } // div, span и прочее: берём только содержимое
			if (tag === 'IMG') {
				const u = abs(n.currentSrc || n.getAttribute('src') || '');
				if (!u || (n.naturalWidth && n.naturalWidth < 80)) continue;
				const img = document.createElement('img');
				img.src = u;
				img.alt = n.alt || '';
				out.append(img);
				continue;
			}
			const el = document.createElement(tag);
			if (tag === 'A') { const u = abs(n.getAttribute('href') || ''); if (u) { el.href = u; el.target = '_blank'; el.rel = 'noopener noreferrer'; } }
			if (tag !== 'BR' && tag !== 'HR') clean(n, el);
			if (tag === 'A' && !el.textContent.trim() && !el.querySelector('img')) continue;
			if (/^(P|LI|H[1-6])$/.test(tag) && !el.textContent.trim() && !el.querySelector('img')) continue;
			out.append(el);
		}
	}

	const THEMES = { dark: ['#16161c', '#d8d8e2', '#9aa7ff', '#23232d'], light: ['#fbfbf8', '#23232b', '#3b5bdb', '#ecece6'], sepia: ['#f3ead6', '#44382a', '#9a5b13', '#e6dbc0'] };
	let prefs = { size: 19, width: 720, theme: 'dark' };
	let host = null;

	function close() {
		if (host) host.remove();
		host = null;
		document.documentElement.style.overflow = document.documentElement.dataset.prevOverflow || '';
		document.removeEventListener('keydown', onKey, true);
	}
	function onKey(e) {
		if (e.key === 'Escape') { e.stopPropagation(); close(); }
	}

	async function open() {
		try { prefs = { ...prefs, ...((await problet.storage.get('prefs')) || {}) }; } catch (e) { /* без запоминания */ }
		const root = findRoot();
		const body = document.createElement('div');
		clean(root, body);
		const title = (document.querySelector('h1') && document.querySelector('h1').textContent.trim()) || document.title;
		const words = (body.textContent || '').trim().split(/\s+/).filter(Boolean).length;
		host = document.createElement('div');
		const sh = host.attachShadow({ mode: 'closed' });
		const style = document.createElement('style');
		style.textContent = '*{box-sizing:border-box}.wrap{position:fixed;inset:0;z-index:2147483647;overflow:auto;font-family:Georgia,"Times New Roman",serif}.bar{position:sticky;top:0;display:flex;gap:6px;align-items:center;justify-content:flex-end;padding:8px 14px;font:13px system-ui,sans-serif;backdrop-filter:blur(6px)}.bar button{padding:5px 10px;border:1px solid currentColor;border-radius:8px;background:transparent;color:inherit;font:inherit;cursor:pointer;opacity:.8}.bar button:hover{opacity:1}.bar .meta{margin-right:auto;opacity:.6}.art{margin:8px auto 80px;padding:0 20px}.art h1.t{line-height:1.25;margin:.4em 0 .2em}.art img{max-width:100%;height:auto;border-radius:6px}.art pre{overflow:auto;padding:12px;border-radius:8px;font:14px/1.5 ui-monospace,monospace}.art code{font-family:ui-monospace,monospace;font-size:.9em}.art blockquote{margin:1em 0;padding-left:16px;border-left:3px solid currentColor;opacity:.85}.art table{border-collapse:collapse;max-width:100%;display:block;overflow:auto}.art td,.art th{border:1px solid rgba(128,128,128,.4);padding:6px 10px}';
		const wrap = document.createElement('div');
		wrap.className = 'wrap';
		const bar = document.createElement('div');
		bar.className = 'bar';
		const meta = document.createElement('span');
		meta.className = 'meta';
		meta.textContent = '≈ ' + Math.max(1, Math.round(words / 200)) + L(' мин чтения', ' min read');
		const mk = (text, fn, titleText) => { const b = document.createElement('button'); b.textContent = text; b.title = titleText || ''; b.addEventListener('click', fn); return b; };
		const art = document.createElement('article');
		art.className = 'art';
		const h = document.createElement('h1');
		h.className = 't';
		h.textContent = title;
		const first = body.querySelector('h1');
		if (first && first.textContent.trim() === title) first.remove(); // заголовок уже показан сверху
		art.append(h, body);
		const apply = () => {
			const t = THEMES[prefs.theme] || THEMES.dark;
			wrap.style.cssText = 'background:' + t[0] + ';color:' + t[1];
			bar.style.background = t[3] + 'cc';
			art.style.cssText = 'max-width:' + prefs.width + 'px;font-size:' + prefs.size + 'px;line-height:1.7';
			for (const a of art.querySelectorAll('a')) a.style.color = t[2];
			for (const p of art.querySelectorAll('pre')) p.style.background = t[3];
		};
		const save = () => { apply(); problet.storage.set('prefs', prefs).catch(() => {}); };
		bar.append(meta,
			mk('A−', () => { prefs.size = Math.max(13, prefs.size - 1); save(); }, L('Меньше шрифт', 'Smaller font')),
			mk('A+', () => { prefs.size = Math.min(32, prefs.size + 1); save(); }, L('Больше шрифт', 'Larger font')),
			mk('↔−', () => { prefs.width = Math.max(480, prefs.width - 60); save(); }, L('Уже колонка', 'Narrower column')),
			mk('↔+', () => { prefs.width = Math.min(1200, prefs.width + 60); save(); }, L('Шире колонка', 'Wider column')),
			mk(L('Тема', 'Theme'), () => { const k = Object.keys(THEMES); prefs.theme = k[(k.indexOf(prefs.theme) + 1) % k.length]; save(); }, L('Сменить тему', 'Change theme')),
			mk('✕', close, L('Закрыть (Esc)', 'Close (Esc)')));
		wrap.append(bar, art);
		sh.append(style, wrap);
		apply();
		document.documentElement.dataset.prevOverflow = document.documentElement.style.overflow;
		document.documentElement.style.overflow = 'hidden';
		document.documentElement.append(host);
		document.addEventListener('keydown', onKey, true);
	}

	problet.onMessage((m) => {
		if (!m || m.type !== 'toggle') return;
		if (host) close();
		else open();
	});
})();
