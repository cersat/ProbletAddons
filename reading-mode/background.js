// Нажатие на кнопку: просим скрипт на активной странице включить или выключить режим чтения
problet.on('buttonClick', async () => {
	const tab = await problet.tabs.active();
	if (!tab) return;
	try {
		await problet.tabs.send(tab.id, { type: 'toggle' });
	} catch (e) { /* на служебных страницах скрипта нет */ }
});
