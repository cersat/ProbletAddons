const $ = (id) => document.getElementById(id);
// Язык интерфейса браузера: problet.lang — 'ru' или 'en'
const L = (ru, en) => (problet.lang === 'en' ? en : ru);
document.querySelector('h1').textContent = L('Тёмная тема', 'Dark theme');
(async () => {
	const tab = await problet.tabs.active();
	let host = '';
	try {
		const u = new URL(tab.url);
		if (/^https?:$/.test(u.protocol)) host = u.hostname;
	} catch (e) { /* не сайт */ }
	const sites = (await problet.storage.get('sites')) || {};
	const show = () => {
		const on = !!sites[host];
		$('toggle').textContent = on ? L('Выключить для этого сайта', 'Turn off for this site') : L('Включить для этого сайта', 'Turn on for this site');
		$('toggle').className = on ? 'on' : '';
		const n = Object.keys(sites).length;
		$('count').textContent = n ? L('Тёмных сайтов: ', 'Dark sites: ') + n : '';
	};
	if (!host) {
		$('host').textContent = L('Это не сайт: здесь тема не включается', 'This is not a site: the theme cannot be turned on here');
		return;
	}
	$('host').textContent = host;
	$('toggle').disabled = false;
	show();
	$('toggle').addEventListener('click', async () => {
		if (sites[host]) delete sites[host];
		else sites[host] = true;
		await problet.storage.set('sites', sites);
		// всем открытым вкладкам этого сайта
		for (const t of await problet.tabs.list()) {
			try {
				if (new URL(t.url).hostname === host) await problet.tabs.send(t.id, { type: 'dark', on: !!sites[host] });
			} catch (e) { /* вкладка не сайт */ }
		}
		show();
	});
})();
