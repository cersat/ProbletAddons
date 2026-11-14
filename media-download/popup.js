const $ = (id) => document.getElementById(id);
const L = (ru, en) => (problet.lang === 'en' ? en : ru);
$('h').textContent = L('Картинки и видео страницы', 'Images and videos of the page');
$('t-img').textContent = L('Картинки', 'Images');
$('t-vid').textContent = L('Видео', 'Videos');
$('all').textContent = L('Отметить все', 'Select all');
$('small-l').textContent = L('Показывать и мелкие (иконки, пиксели)', 'Also show small ones (icons, pixels)');
$('go').textContent = L('Скачать', 'Download');

const MAX_BYTES = 200 * 1024 * 1024;
let items = [];
let kind = 'image';
const picked = new Set();

// Выполняется на самой странице: собирает адреса картинок и видео
function collect() {
	const abs = (u) => { try { return new URL(u, location.href).href; } catch (e) { return ''; } };
	const out = new Map();
	const add = (url, type, w, h) => {
		if (!url || /^(blob:|javascript:|about:)/i.test(url)) { if (/^blob:/i.test(url)) out.set(url, { url, type, w, h, blob: true }); return; }
		const prev = out.get(url);
		if (!prev || (w || 0) * (h || 0) > (prev.w || 0) * (prev.h || 0)) out.set(url, { url, type, w: w || 0, h: h || 0 });
	};
	const biggest = (srcset) => {
		let best = '';
		let bw = -1;
		for (const part of String(srcset || '').split(',')) {
			const [u, d] = part.trim().split(/\s+/);
			if (!u) continue;
			const w = parseFloat(d) || 1;
			if (w > bw) { bw = w; best = u; }
		}
		return best;
	};
	for (const img of document.images) {
		const src = biggest(img.srcset) || img.currentSrc || img.src;
		add(abs(src), 'image', img.naturalWidth, img.naturalHeight);
	}
	for (const s of document.querySelectorAll('picture source[srcset]')) add(abs(biggest(s.srcset)), 'image', 0, 0);
	for (const v of document.querySelectorAll('video')) {
		if (v.poster) add(abs(v.poster), 'image', v.videoWidth, v.videoHeight);
		const src = v.currentSrc || v.src;
		if (src) add(abs(src), 'video', v.videoWidth, v.videoHeight);
		for (const s of v.querySelectorAll('source[src]')) add(abs(s.src), 'video', v.videoWidth, v.videoHeight);
	}
	for (const s of document.querySelectorAll('audio source[src], audio[src]')) add(abs(s.src || s.getAttribute('src')), 'video', 0, 0);
	for (const el of document.querySelectorAll('[style*="background"]')) {
		const m = /url\(["']?([^"')]+)["']?\)/.exec(el.style.backgroundImage || '');
		if (m) add(abs(m[1]), 'image', 0, 0);
	}
	for (const m of document.querySelectorAll('meta[property="og:image"], meta[property="og:video"], meta[name="twitter:image"]')) {
		add(abs(m.content), m.getAttribute('property') === 'og:video' ? 'video' : 'image', 0, 0);
	}
	return [...out.values()];
}

const isVideoUrl = (u) => /\.(mp4|webm|mkv|mov|m4v|ogv|ogg|mp3|m4a|wav|flac|aac|opus)(\?|#|$)/i.test(u);
const isStream = (u) => /\.(m3u8|mpd)(\?|#|$)/i.test(u);

function shown() {
	const small = $('small').checked;
	return items.filter((i) => i.type === kind && (kind === 'video' || small || !i.w || Math.min(i.w, i.h) >= 100) && !(i.type === 'image' && /^data:image\/gif;base64,R0lGOD/.test(i.url) && !small));
}

function nameOf(i, n) {
	let base = '';
	if (/^data:/.test(i.url)) base = 'data-' + n;
	else {
		try { base = decodeURIComponent(new URL(i.url).pathname.split('/').filter(Boolean).pop() || ''); } catch (e) { base = ''; }
	}
	base = base.replace(/[\\/:*?"<>|\x00-\x1f]/g, '_').slice(0, 120) || (i.type === 'video' ? 'video-' : 'image-') + n;
	return base;
}
const extOf = (ct) => ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp', 'image/svg+xml': 'svg', 'image/avif': 'avif', 'image/bmp': 'bmp', 'video/mp4': 'mp4', 'video/webm': 'webm', 'video/ogg': 'ogv', 'audio/mpeg': 'mp3', 'audio/mp4': 'm4a', 'audio/ogg': 'ogg', 'audio/wav': 'wav' }[String(ct || '').split(';')[0].trim().toLowerCase()] || '');

function render() {
	$('t-img').classList.toggle('on', kind === 'image');
	$('t-vid').classList.toggle('on', kind === 'video');
	const list = shown();
	const ul = $('list');
	ul.textContent = '';
	if (!list.length) {
		const li = document.createElement('li');
		li.className = 'empty';
		li.textContent = kind === 'image' ? L('Картинок не нашлось', 'No images found') : L('Видео не нашлось', 'No videos found');
		ul.append(li);
	}
	for (const i of list) {
		const li = document.createElement('li');
		const cb = document.createElement('input');
		cb.type = 'checkbox';
		cb.checked = picked.has(i.url);
		cb.disabled = !!i.blob || isStream(i.url);
		cb.addEventListener('change', () => { cb.checked ? picked.add(i.url) : picked.delete(i.url); count(); });
		const th = document.createElement('div');
		th.className = 'th';
		if (i.type === 'image') {
			const img = document.createElement('img');
			img.src = i.url;
			img.loading = 'lazy';
			img.addEventListener('error', () => { img.remove(); th.textContent = '🖼'; });
			th.append(img);
		} else th.textContent = '🎞';
		const what = document.createElement('div');
		what.className = 'what';
		const b = document.createElement('b');
		b.textContent = nameOf(i, 0);
		b.title = i.url;
		const sm = document.createElement('small');
		sm.textContent = (i.w ? i.w + '×' + i.h + ' · ' : '') + (i.blob ? L('blob: скачать нельзя', 'blob: cannot be downloaded') : isStream(i.url) ? L('поток: скачать нельзя', 'stream: cannot be downloaded') : (() => { try { return new URL(i.url).hostname; } catch (e) { return 'data'; } })());
		what.append(b, sm);
		li.append(cb, th, what);
		ul.append(li);
	}
	count();
}
function count() {
	const n = shown().filter((i) => picked.has(i.url)).length;
	$('go').disabled = !picked.size;
	$('st').textContent = picked.size ? L('Выбрано: ', 'Selected: ') + picked.size : '';
}

$('t-img').addEventListener('click', () => { kind = 'image'; render(); });
$('t-vid').addEventListener('click', () => { kind = 'video'; render(); });
$('small').addEventListener('change', render);
$('all').addEventListener('click', () => {
	const list = shown().filter((i) => !i.blob && !isStream(i.url));
	const all = list.every((i) => picked.has(i.url));
	for (const i of list) all ? picked.delete(i.url) : picked.add(i.url);
	$('all').textContent = all ? L('Отметить все', 'Select all') : L('Снять отметки', 'Clear marks');
	render();
});

$('go').addEventListener('click', async () => {
	$('go').disabled = true;
	try {
		const folder = await problet.files.pick({ folder: true });
		if (!folder) return;
		const sep = (await problet.info()).platform === 'win32' ? '\\' : '/';
		const chosen = items.filter((i) => picked.has(i.url));
		const used = new Set();
		let ok = 0;
		const failed = [];
		let n = 0;
		for (const i of chosen) {
			n++;
			$('st').textContent = L('Скачиваю ', 'Downloading ') + n + ' / ' + chosen.length;
			try {
				if (!/^data:/.test(i.url)) {
					const head = await problet.fetch(i.url, { method: 'HEAD' }).catch(() => null);
					const len = head && Number(head.headers && (head.headers['content-length'] || head.headers['Content-Length']));
					if (len > MAX_BYTES) throw new Error(L('больше 200 МБ', 'larger than 200 MB'));
				}
				let r;
				const dm = /^data:([^;,]*)(;base64)?,(.*)$/s.exec(i.url);
				if (dm) r = { ok: true, headers: { 'content-type': dm[1] }, base64: dm[2] ? dm[3] : btoa(unescape(dm[3])) };
				else r = await problet.fetch(i.url, { as: 'base64' });
				if (!r.ok) throw new Error('HTTP ' + r.status);
				let name = nameOf(i, n);
				const ct = (r.headers && (r.headers['content-type'] || r.headers['Content-Type'])) || '';
				if (!/\.[A-Za-z0-9]{2,5}$/.test(name)) name += '.' + (extOf(ct) || (i.type === 'video' ? 'mp4' : 'jpg'));
				let finalName = name;
				for (let k = 2; used.has(finalName.toLowerCase()); k++) finalName = name.replace(/(\.[^.]*)?$/, '-' + k + '$1');
				used.add(finalName.toLowerCase());
				await problet.files.write(folder + sep + finalName, r.base64, 'base64');
				ok++;
			} catch (e) {
				failed.push(nameOf(i, n) + ': ' + String(e.message || e).replace(/^Error invoking remote method '[^']*': (Error: )?/, ''));
			}
		}
		await problet.notify(L('Скачано: ', 'Downloaded: ') + ok + (failed.length ? L(', ошибок: ', ', errors: ') + failed.length : ''), failed.length ? failed.slice(0, 3).join('\n') : folder);
		$('st').textContent = L('Готово: ', 'Done: ') + ok + (failed.length ? L(', ошибок: ', ', errors: ') + failed.length : '');
	} catch (e) {
		$('st').textContent = String(e.message || e).replace(/^Error invoking remote method '[^']*': (Error: )?/, '');
	} finally {
		$('go').disabled = !picked.size;
	}
});

(async () => {
	try {
		const tab = await problet.tabs.active();
		const res = await problet.tabs.eval(tab.id, '(' + collect.toString() + ')()');
		items = (res || []).map((i) => (i.type === 'image' && isVideoUrl(i.url) ? { ...i, type: 'video' } : i));
		if (!items.some((i) => i.type === 'image') && items.some((i) => i.type === 'video')) kind = 'video';
	} catch (e) {
		$('list').textContent = L('На этой странице скрипты недоступны', 'Scripts are not available on this page');
		return;
	}
	render();
})();
