// Язык интерфейса браузера: problet.lang — 'ru' или 'en'
const L = (ru, en) => (problet.lang === 'en' ? en : ru);
// Нажатие на кнопку: забираем со страницы Markdown, спрашиваем, куда сохранить, и пишем файл

// Эта функция выполняется на самой странице (через tabs.eval), поэтому всё нужное лежит внутри неё
function toMarkdown() {
	const root = document.querySelector('article') || document.querySelector('main') || document.querySelector('[role=main]') || document.body;
	const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'NAV', 'FOOTER', 'ASIDE', 'FORM', 'BUTTON', 'SVG', 'IFRAME', 'TEMPLATE']);
	const abs = (u) => { try { return new URL(u, location.href).href; } catch (e) { return u; } };
	const esc = (t) => t.replace(/([\\`*_[\]])/g, '\\$1');
	function inline(node) {
		let out = '';
		for (const n of node.childNodes) {
			if (n.nodeType === 3) { out += esc(n.textContent.replace(/\s+/g, ' ')); continue; }
			if (n.nodeType !== 1 || SKIP.has(n.tagName)) continue;
			const st = getComputedStyle(n);
			if (st.display === 'none' || st.visibility === 'hidden') continue;
			const t = n.tagName;
			if (t === 'BR') out += '  \n';
			else if (t === 'A' && n.getAttribute('href')) { const text = inline(n).trim(); if (text) out += '[' + text + '](' + abs(n.getAttribute('href')) + ')'; }
			else if (t === 'IMG' && n.getAttribute('src')) out += '![' + esc(n.alt || '') + '](' + abs(n.getAttribute('src')) + ')';
			else if (t === 'CODE') out += '`' + n.textContent.replace(/`/g, '\\`') + '`';
			else if (t === 'STRONG' || t === 'B') { const x = inline(n).trim(); if (x) out += '**' + x + '**'; }
			else if (t === 'EM' || t === 'I') { const x = inline(n).trim(); if (x) out += '*' + x + '*'; }
			else if (/^(P|DIV|SECTION|H[1-6]|UL|OL|PRE|TABLE|BLOCKQUOTE|HR|LI)$/.test(t)) out += '\n' + block(n, 0) + '\n';
			else out += inline(n);
		}
		return out;
	}
	function table(t) {
		const rows = [...t.querySelectorAll('tr')].map((r) => [...r.children].map((c) => inline(c).replace(/\|/g, '\\|').replace(/\n+/g, ' ').trim()));
		if (!rows.length) return '';
		const w = Math.max(...rows.map((r) => r.length));
		const line = (r) => '| ' + Array.from({ length: w }, (_x, i) => r[i] || '').join(' | ') + ' |';
		return [line(rows[0]), '|' + ' --- |'.repeat(w), ...rows.slice(1).map(line)].join('\n');
	}
	function list(el, depth) {
		let i = 1;
		const out = [];
		for (const li of el.children) {
			if (li.tagName !== 'LI') continue;
			const mark = el.tagName === 'OL' ? (i++) + '. ' : '- ';
			const nested = [...li.children].filter((c) => c.tagName === 'UL' || c.tagName === 'OL');
			const clone = li.cloneNode(true);
			clone.querySelectorAll(':scope > ul, :scope > ol').forEach((x) => x.remove());
			out.push('  '.repeat(depth) + mark + inline(clone).replace(/\s*\n\s*/g, ' ').trim());
			for (const n of nested) out.push(list(n, depth + 1));
		}
		return out.join('\n');
	}
	function block(el, depth) {
		if (SKIP.has(el.tagName)) return '';
		const t = el.tagName;
		if (/^H[1-6]$/.test(t)) return '#'.repeat(Number(t[1])) + ' ' + inline(el).replace(/\s+/g, ' ').trim();
		if (t === 'PRE') return '```\n' + el.innerText.replace(/\n$/, '') + '\n```';
		if (t === 'UL' || t === 'OL') return list(el, depth);
		if (t === 'TABLE') return table(el);
		if (t === 'HR') return '---';
		if (t === 'BLOCKQUOTE') return inline(el).trim().split('\n').map((l) => '> ' + l).join('\n');
		return inline(el);
	}
	const body = block(root, 0).replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
	return '# ' + document.title + '\n\n' + location.href + '\n\n' + body + '\n';
}

problet.on('buttonClick', async () => {
	const tab = await problet.tabs.active();
	if (!tab || !/^(https?|file):/.test(tab.url)) {
		await problet.notify(L('Страница в Markdown', 'Page as Markdown'), L('Открой обычную страницу сайта', 'Open a regular web page'));
		return;
	}
	try {
		const md = await problet.tabs.eval(tab.id, '(' + toMarkdown.toString() + ')()');
		const name = (tab.title || L('страница', 'page')).replace(/[\\/:*?"<>|]+/g, ' ').trim().slice(0, 80) + '.md';
		const file = await problet.files.pick({ save: true, name });
		if (!file) return;
		await problet.files.write(file, md);
		await problet.notify(L('Страница сохранена', 'Page saved'), file);
	} catch (e) {
		await problet.notify(L('Не получилось сохранить', 'Could not save'), String(e.message || e).replace(/^Error invoking remote method '[^']*': (Error: )?/, ''));
	}
});
