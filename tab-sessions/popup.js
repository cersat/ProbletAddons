const $ = (id) => document.getElementById(id);
const pad = (n) => String(n).padStart(2, '0');
const stamp = (t) => { const d = new Date(t); return pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + d.getFullYear() + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); };

let sets = [];
async function render() {
	const ul = $('list');
	ul.textContent = '';
	if (!sets.length) {
		const li = document.createElement('li');
		li.className = 'empty';
		li.textContent = 'Сохранённых наборов пока нет';
		ul.append(li);
		return;
	}
	for (const s of sets) {
		const li = document.createElement('li');
		const what = document.createElement('div');
		what.className = 'what';
		const b = document.createElement('b');
		b.textContent = s.name;
		const small = document.createElement('small');
		small.textContent = s.urls.length + ' вкл. · ' + stamp(s.time);
		what.append(b, small);
		const open = document.createElement('button');
		open.textContent = 'Открыть';
		open.addEventListener('click', async () => {
			for (const url of s.urls) await problet.tabs.open(url, { active: false });
			window.close();
		});
		const del = document.createElement('button');
		del.className = 'del';
		del.textContent = '✕';
		del.title = 'Удалить набор';
		del.addEventListener('click', async () => {
			sets = sets.filter((x) => x !== s);
			await problet.storage.set('sets', sets);
			render();
		});
		li.append(what, open, del);
		ul.append(li);
	}
}

$('save').addEventListener('click', async () => {
	const urls = (await problet.tabs.list()).map((t) => t.url).filter((u) => /^(https?|file):/.test(u));
	if (!urls.length) return;
	const name = $('name').value.trim() || 'Набор от ' + stamp(Date.now());
	sets.unshift({ name, urls, time: Date.now() });
	await problet.storage.set('sets', sets);
	$('name').value = '';
	render();
});
$('name').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('save').click(); });

problet.storage.get('sets').then((v) => {
	sets = Array.isArray(v) ? v : [];
	render();
});
