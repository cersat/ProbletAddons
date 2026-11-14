// JSON деревом. Chromium показывает JSON как один <pre> с текстом: если там целиком валидный JSON, заменяем его на дерево
(() => {
	const L = (ru, en) => (problet.lang === 'en' ? en : ru);
	const type = document.contentType || '';
	const kids = [...document.body.children].filter((e) => !e.classList.contains('json-formatter-container')); // свой контейнер Chromium лишний
	if (kids.length !== 1 || kids[0].tagName !== 'PRE') return;
	if (!/json|text\/plain|javascript/.test(type) && !/\.json(\?|#|$)/i.test(location.href)) return;
	const raw = kids[0].textContent;
	if (!raw || raw.length > 20000000) return;
	let data;
	try { data = JSON.parse(raw); } catch (e) { return; }
	if (data === null || typeof data !== 'object') return; // голое число или строка — не JSON-документ

	const pre = kids[0];
	const host = document.createElement('div');
	const sh = host.attachShadow({ mode: 'closed' });
	sh.innerHTML = '<style>:host{all:initial}.page{position:fixed;inset:0;overflow:auto;background:#16161c;color:#d8d8e2;font:13px/1.55 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}.bar{position:sticky;top:0;z-index:1;display:flex;gap:8px;align-items:center;padding:8px 14px;background:#1f1f29;border-bottom:1px solid #2e2e3e;font:13px system-ui,sans-serif}.bar input{flex:1;min-width:120px;max-width:340px;padding:5px 9px;border:1px solid #3a3a50;border-radius:8px;background:#16161c;color:inherit;font:inherit}.bar button{padding:5px 10px;border:1px solid #3a3a50;border-radius:8px;background:#2a2a38;color:inherit;font:inherit;cursor:pointer}.bar button:hover{background:#34344a}.bar .info{margin-left:auto;color:#9a9ab0}.tree{padding:12px 16px 60px}.row{white-space:pre-wrap;word-break:break-word}.kids{margin-left:18px;border-left:1px solid #2a2a38;padding-left:10px}.tg{display:inline-block;width:14px;cursor:pointer;color:#9a9ab0;user-select:none}.k{color:#9aa7ff}.s{color:#a6e3a1}.n{color:#fab387}.b{color:#f38ba8}.z{color:#9a9ab0}.cnt{color:#7a7a90;font-style:italic}.hit{background:#5b4b00;border-radius:3px}.row .cp{visibility:hidden;margin-left:8px;color:#7a7a90;cursor:pointer;font:11px system-ui,sans-serif}.row:hover>.cp{visibility:visible}.coll>.kids{display:none}.coll>.dots{display:inline}.dots{display:none;color:#9a9ab0}a{color:#89b4fa}.raw{white-space:pre-wrap;word-break:break-all;padding:12px 16px}</style><div class="page"><div class="bar"><button id="ex"></button><button id="co"></button><input id="q"><button id="cp"></button><button id="rw"></button><span class="info"></span></div><div class="tree" id="tree"></div><div class="raw" id="raw" hidden></div></div>';
	const $ = (id) => sh.getElementById(id);
	$('ex').textContent = L('Развернуть всё', 'Expand all');
	$('co').textContent = L('Свернуть всё', 'Collapse all');
	$('q').placeholder = L('Поиск по ключам и значениям', 'Search keys and values');
	$('cp').textContent = L('Копировать JSON', 'Copy JSON');
	$('rw').textContent = L('Исходный текст', 'Raw text');
	const copy = (text) => navigator.clipboard.writeText(text).catch(() => problet.clipboard && problet.clipboard.write(text).catch(() => {}));

	let count = 0;
	const idKey = (k) => (/^[A-Za-z_$][\w$]*$/.test(k) ? '.' + k : '[' + JSON.stringify(k) + ']');
	function node(key, val, path, last) {
		const row = document.createElement('div');
		const line = document.createElement('div');
		line.className = 'row';
		count++;
		if (key !== null) {
			const k = document.createElement('span');
			k.className = 'k';
			k.textContent = typeof key === 'number' ? key : JSON.stringify(key);
			line.append(k, ': ');
			k.dataset.t = String(key);
		}
		const cp = document.createElement('span');
		cp.className = 'cp';
		cp.textContent = L('путь', 'path');
		cp.title = L('Копировать путь', 'Copy the path');
		cp.addEventListener('click', (e) => { e.stopPropagation(); copy('$' + path); });
		const cv = document.createElement('span');
		cv.className = 'cp';
		cv.textContent = L('значение', 'value');
		cv.title = L('Копировать значение', 'Copy the value');
		cv.addEventListener('click', (e) => { e.stopPropagation(); copy(typeof val === 'string' ? val : JSON.stringify(val, null, 2)); });
		const comma = last ? '' : ',';
		if (val !== null && typeof val === 'object') {
			const isArr = Array.isArray(val);
			const entries = isArr ? val.map((v, i) => [i, v]) : Object.entries(val);
			const [o, c] = isArr ? ['[', ']'] : ['{', '}'];
			if (!entries.length) {
				line.append(o + c + comma, cp, cv);
				row.append(line);
				return row;
			}
			const tg = document.createElement('span');
			tg.className = 'tg';
			tg.textContent = '▾';
			line.prepend(tg);
			const sum = document.createElement('span');
			sum.className = 'cnt';
			sum.textContent = ' ' + entries.length + (isArr ? L(' элем.', ' items') : L(' полей', ' keys'));
			const dots = document.createElement('span');
			dots.className = 'dots';
			dots.textContent = ' … ' + c + comma;
			line.append(o, dots, sum, cp, cv);
			row.append(line);
			const kids = document.createElement('div');
			kids.className = 'kids';
			entries.forEach(([k, v], i) => kids.append(node(k, v, path + (isArr ? '[' + k + ']' : idKey(k)), i === entries.length - 1)));
			row.append(kids);
			const end = document.createElement('div');
			end.className = 'row';
			end.textContent = c + comma;
			row.append(end);
			const toggle = () => { const on = row.classList.toggle('coll'); tg.textContent = on ? '▸' : '▾'; end.style.display = on ? 'none' : ''; };
			tg.addEventListener('click', toggle);
			line.addEventListener('dblclick', toggle);
			if (entries.length > 200 && path !== '') { row.classList.add('coll'); tg.textContent = '▸'; end.style.display = 'none'; }
			return row;
		}
		const v = document.createElement('span');
		if (typeof val === 'string') {
			v.className = 's';
			if (/^https?:\/\/\S+$/.test(val)) {
				const a = document.createElement('a');
				a.href = val;
				a.target = '_blank';
				a.rel = 'noopener noreferrer';
				a.textContent = JSON.stringify(val);
				v.append(a);
			} else v.textContent = JSON.stringify(val);
		} else if (typeof val === 'number') { v.className = 'n'; v.textContent = String(val); }
		else if (typeof val === 'boolean') { v.className = 'b'; v.textContent = String(val); }
		else { v.className = 'z'; v.textContent = 'null'; }
		line.append(v, comma, cp, cv);
		row.append(line);
		return row;
	}

	const tree = $('tree');
	tree.append(node(null, data, '', true));
	const size = raw.length < 1024 ? raw.length + ' B' : raw.length < 1048576 ? (raw.length / 1024).toFixed(1) + ' KB' : (raw.length / 1048576).toFixed(1) + ' MB';
	sh.querySelector('.info').textContent = count + L(' значений · ', ' values · ') + size;
	const setAll = (collapsed) => {
		for (const r of tree.querySelectorAll('.row')) {
			const p = r.parentElement;
			if (!p || !p.querySelector(':scope > .kids')) continue;
			p.classList.toggle('coll', collapsed);
			const tg = r.querySelector(':scope > .tg');
			if (tg) tg.textContent = collapsed ? '▸' : '▾';
			const end = p.querySelector(':scope > .row:last-child');
			if (end && end !== r) end.style.display = collapsed ? 'none' : '';
		}
	};
	$('ex').addEventListener('click', () => setAll(false));
	$('co').addEventListener('click', () => { setAll(true); const top = tree.firstElementChild; top.classList.remove('coll'); });
	$('cp').addEventListener('click', () => copy(JSON.stringify(data, null, 2)));
	let rawMode = false;
	$('rw').addEventListener('click', () => {
		rawMode = !rawMode;
		const r = $('raw');
		if (rawMode && !r.textContent) r.textContent = raw;
		r.hidden = !rawMode;
		tree.hidden = rawMode;
		$('rw').textContent = rawMode ? L('Дерево', 'Tree') : L('Исходный текст', 'Raw text');
	});
	let timer = 0;
	$('q').addEventListener('input', () => {
		clearTimeout(timer);
		timer = setTimeout(() => {
			const q = $('q').value.trim().toLowerCase();
			for (const h of tree.querySelectorAll('.hit')) h.classList.remove('hit');
			if (!q) return;
			setAll(false);
			let first = null;
			for (const el of tree.querySelectorAll('.k, .s, .n, .b, .z')) {
				if (el.textContent.toLowerCase().includes(q)) { el.classList.add('hit'); if (!first) first = el; }
			}
			if (first) first.scrollIntoView({ block: 'center' });
		}, 200);
	});

	document.documentElement.append(host);
	pre.style.display = 'none';
	for (const e of document.querySelectorAll('.json-formatter-container')) e.style.display = 'none';
})();
