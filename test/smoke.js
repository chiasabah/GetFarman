'use strict';
/* A smoke test of the whole engine. It runs in a temporary home, so it never touches
   your real log or your real Claude Code settings. Node built-ins only. */
const assert = require('assert');
const cp = require('child_process');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');

const BIN = path.resolve(__dirname, '..', 'bin', 'farman.js');
const box = fs.mkdtempSync(path.join(os.tmpdir(), 'farman-test-'));
const home = path.join(box, '.farman');
const claude = path.join(box, '.claude');
// FARMAN_NO_PATH keeps setup and remove away from your real PATH.
const env = Object.assign({}, process.env, { FARMAN_HOME: home, CLAUDE_CONFIG_DIR: claude, USERPROFILE: box, HOME: box, FARMAN_NO_PATH: '1' });
delete env.FARMAN_REVIEWER;
const PORT = 4791;

const run = (args, input) => cp.spawnSync(process.execPath, [BIN].concat(args), { env, input, encoding: 'utf8', timeout: 20000 });
const hook = ev => run(['hook'], JSON.stringify(ev));
const get = (url, headers) => new Promise((resolve, reject) => {
  http.get('http://127.0.0.1:' + PORT + url, { headers: headers || {} }, res => {
    let text = '';
    res.setEncoding('utf8');
    res.on('data', d => { text += d; });
    res.on('end', () => resolve({ status: res.statusCode, text, headers: res.headers }));
  }).on('error', reject);
});
const post = (url, headers, body) => new Promise((resolve, reject) => {
  const data = JSON.stringify(body);
  const req = http.request('http://127.0.0.1:' + PORT + url, { method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }, headers) }, res => {
    let text = '';
    res.setEncoding('utf8');
    res.on('data', d => { text += d; });
    res.on('end', () => resolve({ status: res.statusCode, text }));
  });
  req.on('error', reject);
  req.end(data);
});
const sleep = ms => new Promise(r => setTimeout(r, ms));
let step = 0;
const ok = name => console.log('  ok   ' + (++step) + '. ' + name);

(async () => {
  // 1. setup keeps other hooks and adds ours
  fs.mkdirSync(claude, { recursive: true });
  const settings = path.join(claude, 'settings.json');
  fs.writeFileSync(settings, JSON.stringify({ model: 'x', hooks: { Stop: [{ hooks: [{ type: 'command', command: 'echo other' }] }] } }, null, 2));
  let r = run(['setup', '--no-history']);
  assert.strictEqual(r.status, 0, r.stdout + r.stderr);
  let s = JSON.parse(fs.readFileSync(settings, 'utf8'));
  assert.strictEqual(s.model, 'x');
  assert.strictEqual(s.hooks.Stop.length, 2);
  assert.ok(s.hooks.UserPromptSubmit[0].hooks[0].command.endsWith(' hook'));
  assert.ok(fs.existsSync(path.join(home, 'app', 'bin', 'farman.js')));
  assert.ok(fs.existsSync(path.join(claude, 'skills', 'farman', 'SKILL.md')));
  assert.ok(fs.readdirSync(claude).some(f => f.startsWith('settings.json.farman-backup-')));
  ok('setup copies the app, adds three hooks and keeps the other hook');

  r = run(['setup', '--no-history']);
  assert.ok(r.stdout.includes('already in place'), r.stdout);
  assert.strictEqual(JSON.parse(fs.readFileSync(settings, 'utf8')).hooks.Stop.length, 2);
  ok('a second setup changes nothing');

  assert.strictEqual(run(['mode', 'hand']).status, 0);

  // 2. the three hooks log a prompt, a file and a reply, and print nothing
  const cwd = path.join(box, 'code', 'shop');
  r = hook({ hook_event_name: 'UserPromptSubmit', session_id: 's1', prompt_id: 'p1', cwd, prompt: 'make the little line on the left blue' });
  assert.strictEqual(r.status, 0);
  assert.strictEqual(r.stdout + r.stderr, '');
  hook({ hook_event_name: 'PostToolUse', session_id: 's1', prompt_id: 'p1', cwd, tool_input: { file_path: path.join(cwd, 'src', 'a.css') } });
  hook({ hook_event_name: 'Stop', session_id: 's1', prompt_id: 'p1', cwd, last_assistant_message: 'Added border-left.' });
  hook({ hook_event_name: 'UserPromptSubmit', session_id: 's1', prompt_id: 'p1', cwd, prompt: 'make the little line on the left blue' });
  hook({ hook_event_name: 'UserPromptSubmit', session_id: 's1', prompt_id: 'p2', cwd, prompt: '<system-reminder>note</system-reminder>\nrun the tests' });
  r = run(['status']);
  assert.ok(r.stdout.includes('2 prompts logged, 2 not reviewed yet'), r.stdout);
  ok('hooks log prompts once each and stay silent');

  r = hook({ hook_event_name: 'UserPromptSubmit', session_id: 's1', prompt: '/farman status' });
  assert.strictEqual(r.status, 2);
  assert.ok(r.stderr.startsWith('Farman: by hand.'), r.stderr);
  assert.strictEqual(r.stdout, '');
  ok('/farman is answered by the hook and blocked');

  // 3. history import reads a transcript and does not repeat a prompt that the hook logged
  const proj = path.join(claude, 'projects', 'demo');
  fs.mkdirSync(proj, { recursive: true });
  const line = o => JSON.stringify(o) + '\n';
  fs.writeFileSync(path.join(proj, 's2.jsonl'),
    line({ type: 'user', uuid: 'u1', timestamp: '2026-01-02T10:00:00Z', cwd, message: { content: 'only get a screenful at a time' } }) +
    line({ type: 'assistant', timestamp: '2026-01-02T10:00:20Z', message: { content: [{ type: 'text', text: 'Paginated.' },
      { type: 'tool_use', name: 'Edit', input: { file_path: path.join(cwd, 'api', 'search.ts') } }] } }) +
    line({ type: 'user', uuid: 'u2', timestamp: '2026-01-02T10:01:00Z', message: { content: [{ type: 'tool_result', content: 'x' }] } }) +
    line({ type: 'user', uuid: 'u3', timestamp: '2026-01-02T10:02:00Z', message: { content: '/clear' } }) +
    line({ type: 'ai-title', aiTitle: 'Search paging' }));
  r = run(['import']);
  assert.ok(r.stdout.includes('1 prompts added from 1 sessions'), r.stdout + r.stderr);
  r = run(['import']);
  assert.ok(r.stdout.includes('Read 0 of 1'), r.stdout);
  ok('import adds only real prompts and skips unchanged files');

  // 4. a review result is stored, and the glossary follows
  process.env.FARMAN_HOME = home;
  const F = require(BIN);
  const con = F.connect();
  const t = con.get("SELECT id, n, said FROM turns WHERE session_id='s1' AND n=1");
  const rid = Number(con.run("INSERT INTO reviews(session_id,n,by,model,status,started_at) VALUES('s1',1,'hand','haiku','done',1)").lastInsertRowid);
  const [done, better] = F.applyReview(con, rid, 's1', [t], { title: 'Blue border', turns: [{ id: 1, verdict: 'better',
    better: 'Give the box a blue border-left.', why: 'The reply added border-left.',
    pairs: [{ said: 'the little line on the left', term: 'border-left', gloss: 'The line on the left edge' }] }] });
  assert.deepStrictEqual([done, better], [1, 1]);
  assert.strictEqual(con.val("SELECT title FROM sessions WHERE id='s1'"), 'Blue border');
  assert.strictEqual(con.val("SELECT said_words FROM turns WHERE session_id='s1' AND n=2"), 3);
  con.close();
  r = run(['glossary']);
  assert.ok(r.stdout.startsWith('border-left'), r.stdout);
  ok('a review stores the better prompt, the pair and the title');

  // 5. the server: page, key, API
  const server = cp.spawn(process.execPath, [BIN, 'serve', '--port', String(PORT)], { env, stdio: 'ignore' });
  let up = false;
  for (let i = 0; i < 40 && !up; i++) {
    await sleep(150);
    up = await get('/api/ping').then(x => x.status === 200 && JSON.parse(x.text).farman, () => false);
  }
  assert.ok(up, 'the server did not start');
  const pageRes = await get('/');
  assert.strictEqual(pageRes.status, 200);
  assert.ok(pageRes.headers['content-security-policy']);
  const token = fs.readFileSync(path.join(home, 'token'), 'utf8').trim();
  assert.ok(pageRes.text.includes(token) && !pageRes.text.includes('__FARMAN_TOKEN__'));
  assert.strictEqual((await get('/api/overview')).status, 403);
  assert.strictEqual((await get('/api/overview', { 'X-Farman-Token': token, Origin: 'http://evil.example' })).status, 403);
  const H = { 'X-Farman-Token': token };
  const ov = JSON.parse((await get('/api/overview?group=project', H)).text);
  assert.strictEqual(ov.all.n, 3);
  assert.strictEqual(ov.all.sessions, 2);
  assert.deepStrictEqual(ov.counts, { better: 1, precise: 0, pending: 2 });
  assert.strictEqual(ov.projects[0].name, 'shop');
  assert.strictEqual(ov.home_short, '~' + path.sep + '.farman');
  const turns = JSON.parse((await get('/api/turns?scope=s1&desc=1', H)).text);
  assert.strictEqual(turns.total, 2);
  assert.strictEqual(turns.items[1].pairs[0].term, 'border-left');
  assert.strictEqual(turns.items[1].pairs[0].used, true);
  assert.deepStrictEqual(turns.items[1].files, [path.join('src', 'a.css')]);
  assert.strictEqual(turns.items[0].lead[0].kind, 'system-reminder');
  assert.strictEqual(turns.items[0].said, 'run the tests');
  const found = JSON.parse((await get('/api/turns?q=screenful', H)).text);
  assert.strictEqual(found.total, 1);
  assert.deepStrictEqual(found.items[0].files, [path.join('api', 'search.ts')]);
  const cards = JSON.parse((await get('/api/cards?sort=term', H)).text);
  assert.strictEqual(cards.items[0].term, 'border-left');
  assert.strictEqual(JSON.parse((await get('/api/ids?states=pending', H)).text).ids.length, 2);
  const cfg = JSON.parse((await post('/api/config', H, { every: 99, model: 'sonnet' })).text);
  assert.deepStrictEqual([cfg.every, cfg.model], [50, 'sonnet']);
  assert.strictEqual((await post('/api/config', {}, { every: 5 })).status, 403);
  ok('the server gives the page and the API only to a caller with the key');

  assert.strictEqual(JSON.parse((await post('/api/shutdown', H, {})).text).stopped, true);
  await sleep(700);
  assert.ok(!fs.existsSync(path.join(home, 'server.json')));
  server.kill();
  ok('the server stops when the page asks');

  // 6. remove takes our hooks out and keeps the log and the other hook
  r = run(['remove']);
  assert.strictEqual(r.status, 0, r.stdout + r.stderr);
  s = JSON.parse(fs.readFileSync(settings, 'utf8'));
  assert.deepStrictEqual(Object.keys(s.hooks), ['Stop']);
  assert.strictEqual(s.hooks.Stop[0].hooks[0].command, 'echo other');
  assert.ok(fs.existsSync(path.join(home, 'farman.db')) && !fs.existsSync(path.join(home, 'app')));
  ok('remove takes the hooks out and keeps the log');

  // 7. the farman command on the PATH: a shell's start-up file
  const rc = path.join(box, '.zshrc');
  fs.writeFileSync(rc, 'alias ll="ls -l"\n');
  assert.strictEqual(F.profileLine('/home/sam/.farman/bin', true, rc), 'added');
  assert.strictEqual(F.profileLine('/home/sam/.farman/bin', true, rc), 'present');
  assert.ok(fs.readFileSync(rc, 'utf8').endsWith('\n# Added by Farman\nexport PATH="/home/sam/.farman/bin:$PATH"\n'));
  assert.strictEqual(F.profileLine('/home/sam/.farman/bin', false, rc), 'removed');
  assert.strictEqual(fs.readFileSync(rc, 'utf8'), 'alias ll="ls -l"\n');
  assert.strictEqual(F.profileLine('/home/sam/.farman/bin', false, rc), 'absent');
  ok('a shell start-up file gains two lines and loses them again');

  // 8. the same on Windows, against a scratch registry key and never the real PATH
  if (process.platform === 'win32') {
    const key = 'Software\\FarmanSmokeTest';
    const first = '%USERPROFILE%\\one;C:\\Two\\';
    const mine = 'C:\\Farman Test\\bin';
    try {
      cp.spawnSync('reg', ['add', 'HKCU\\' + key, '/v', 'Path', '/t', 'REG_EXPAND_SZ', '/d', first, '/f']);
      assert.strictEqual(F.winUserPath('add', mine, key), 'added');
      assert.strictEqual(F.winUserPath('add', mine, key), 'present');
      assert.strictEqual(F.winUserPath('add', 'c:\\two', key), 'present');
      assert.strictEqual(F.winUserPath('read', mine, key), 'value=' + first + ';' + mine);
      assert.strictEqual(F.winUserPath('remove', mine, key), 'removed');
      assert.strictEqual(F.winUserPath('read', mine, key), 'value=' + first.replace(/;$/, ''));
      assert.strictEqual(F.winUserPath('remove', mine, key), 'absent');
      const kind = cp.spawnSync('reg', ['query', 'HKCU\\' + key, '/v', 'Path'], { encoding: 'utf8' }).stdout;
      assert.ok(kind.includes('REG_EXPAND_SZ'), kind);
    } finally {
      cp.spawnSync('reg', ['delete', 'HKCU\\' + key, '/f']);
    }
    ok('a Windows PATH value gains one folder and loses it, with the rest kept as it was');
  }

  fs.rmSync(box, { recursive: true, force: true });
  console.log('all ' + step + ' checks passed');
})().catch(e => {
  console.error('  FAIL ' + (e && e.stack || e));
  process.exitCode = 1;
});
