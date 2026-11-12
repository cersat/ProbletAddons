const $ = (id) => document.getElementById(id);
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
		$('toggle').textContent = on ? 'Выключить для этого сайта' : 'Включить для этого сайта';
		$('toggle').className = on ? 'on' : '';
		const n = Object.keys(sites).length;
		$('count').textContent = n ? 'Тёмных сайтов: ' + n : '';
	};
	if (!host) {
		$('host').textContent = 'Это не сайт: здесь тема не включается';
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
