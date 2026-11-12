// Тёмная тема для сайта: инверсия цветов страницы, картинки и видео инвертируются обратно
(() => {
	const CSS = 'html{filter:invert(0.92) hue-rotate(180deg)!important;background:#fff!important}'
		+ 'img,video,picture,canvas,iframe,embed,object,svg image,[style*="background-image"]{filter:invert(1) hue-rotate(180deg)!important}';
	let el = null;
	const set = (on) => {
		if (on && !el) {
			el = document.createElement('style');
			el.dataset.problet = 'dark-sites';
			el.textContent = CSS;
			(document.head || document.documentElement).append(el);
		} else if (!on && el) {
			el.remove();
			el = null;
		}
	};
	problet.storage.get('sites').then((sites) => set(!!(sites && sites[location.hostname])));
	problet.onMessage((msg) => {
		if (msg && msg.type === 'dark') set(msg.on);
	});
})();
