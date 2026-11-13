const $ = (id) => document.getElementById(id);
// Язык интерфейса браузера: problet.lang — 'ru' или 'en'
const L = (ru, en) => (problet.lang === 'en' ? en : ru);
$('cmd').placeholder = L('Команда, например: ls -la', 'Command, for example: ls -la');
$('go').textContent = L('Выполнить', 'Run');
$('meta').textContent = L('↑ ↓ — прошлые команды', '↑ ↓ — previous commands');
let history = [];
let pos = -1;
problet.storage.get('history').then((h) => { history = Array.isArray(h) ? h : []; });

$('f').addEventListener('submit', async (e) => {
	e.preventDefault();
	const cmd = $('cmd').value.trim();
	if (!cmd) return;
	history = [cmd, ...history.filter((x) => x !== cmd)].slice(0, 50);
	pos = -1;
	problet.storage.set('history', history).catch(() => {});
	$('go').disabled = true;
	$('out').textContent = '…';
	const start = Date.now();
	try {
		const r = await problet.exec(cmd, undefined, { timeout: 120000 });
		$('out').textContent = r.stdout;
		if (r.stderr) {
			const s = document.createElement('span');
			s.className = 'err';
			s.textContent = r.stderr;
			$('out').append(s);
		}
		if (!r.stdout && !r.stderr) $('out').textContent = L('(нет вывода)', '(no output)');
		$('meta').textContent = L('Код выхода ', 'Exit code ') + r.code + ' · ' + ((Date.now() - start) / 1000).toFixed(1) + L(' с', ' s');
	} catch (err) {
		$('out').innerHTML = '';
		const s = document.createElement('span');
		s.className = 'err';
		s.textContent = String(err.message || err).replace(/^Error invoking remote method '[^']*': (Error: )?/, '');
		$('out').append(s);
		$('meta').textContent = '';
	}
	$('go').disabled = false;
	$('cmd').focus();
});
$('cmd').addEventListener('keydown', (e) => {
	if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
	e.preventDefault();
	pos = Math.max(-1, Math.min(history.length - 1, pos + (e.key === 'ArrowUp' ? 1 : -1)));
	$('cmd').value = pos < 0 ? '' : history[pos];
});
