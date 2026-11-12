// Скорость и перемотка любого видео на странице
(() => {
	let speed = 1;
	let tip = null;
	let hideTimer = 0;
	const videos = () => [...document.querySelectorAll('video')];
	// видео, которое сейчас смотрят: играет, или самое большое на экране
	const current = () => {
		const list = videos();
		return list.find((v) => !v.paused) || list.sort((a, b) => b.clientWidth * b.clientHeight - a.clientWidth * a.clientHeight)[0];
	};
	const show = (text, v) => {
		if (!tip) {
			tip = document.createElement('div');
			tip.style.cssText = 'position:fixed;z-index:2147483647;padding:6px 12px;border-radius:8px;background:rgba(20,20,28,.85);color:#fff;font:600 15px system-ui,sans-serif;pointer-events:none;transition:opacity .2s';
			document.documentElement.append(tip);
		}
		const r = v.getBoundingClientRect();
		tip.style.left = Math.max(8, r.left + 12) + 'px';
		tip.style.top = Math.max(8, r.top + 12) + 'px';
		tip.textContent = text;
		tip.style.opacity = '1';
		clearTimeout(hideTimer);
		hideTimer = setTimeout(() => { tip.style.opacity = '0'; }, 900);
	};
	const apply = (v) => { if (v && Math.abs(v.playbackRate - speed) > 0.001) v.playbackRate = speed; };
	const setSpeed = (s) => {
		speed = Math.min(16, Math.max(0.1, Math.round(s * 100) / 100));
		videos().forEach(apply);
		problet.storage.set('speed', speed).catch(() => {});
		const v = current();
		if (v) show(speed.toFixed(2).replace(/\.?0+$/, '') + '×', v);
	};
	problet.storage.get('speed').then((s) => {
		if (typeof s === 'number' && s > 0) speed = s;
		videos().forEach(apply);
	}).catch(() => {});
	// новые видео и сайты, которые сами сбрасывают скорость
	document.addEventListener('play', (e) => { if (e.target instanceof HTMLVideoElement) apply(e.target); }, true);
	document.addEventListener('ratechange', (e) => {
		const v = e.target;
		if (v instanceof HTMLVideoElement && !v.paused && Math.abs(v.playbackRate - speed) > 0.001 && v.dataset.probletSpeed === '1') apply(v);
	}, true);
	document.addEventListener('keydown', (e) => {
		if (e.ctrlKey || e.metaKey || e.altKey) return;
		const t = e.target;
		if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
		const v = current();
		if (!v) return;
		v.dataset.probletSpeed = '1';
		let done = true;
		if (e.key === ']') setSpeed(speed + (speed >= 2 ? 0.25 : 0.1));
		else if (e.key === '[') setSpeed(speed - (speed > 2 ? 0.25 : 0.1));
		else if (e.key === '\\') setSpeed(1);
		else if (e.key === "'") { v.currentTime = Math.min(v.duration || Infinity, v.currentTime + 10); show('+10 с', v); }
		else if (e.key === ';') { v.currentTime = Math.max(0, v.currentTime - 10); show('−10 с', v); }
		else done = false;
		if (done) {
			e.preventDefault();
			e.stopPropagation();
		}
	}, true);
})();
