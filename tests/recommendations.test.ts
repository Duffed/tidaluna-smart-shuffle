import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SmartShuffle, defaults, selectSeeds, rankTracks, type Snapshot, type Ports, type Options, type Track } from '../plugins/SmartShuffle/src/engine';

const settle = () => new Promise(resolve => setImmediate(resolve));
const track = (id: string): Track => ({ id, playable: true });
function fixture(options: Partial<Options> = {}) {
  let time = 0;
  const s: Snapshot = {
    source: 'playlist', eligible: true, playing: true, transition: 'u0:s0',
    currentId: '0', currentUid: 'u0', currentIndex: 0,
    queueIds: Array.from({ length: 21 }, (_, i) => String(i)),
    queueUids: Array.from({ length: 21 }, (_, i) => `u${i}`), sourceIds: ['0'], allowExplicit: false,
  };
  const inserted: string[] = [], removed: string[] = [], seeds: string[] = [];
  let lookup: Ports['radio'] = async () => [track('new')];
  let collection: Ports['collectionIds'] = async () => ['0'];
  const ports: Ports = {
    snapshot: () => s, report: () => {},
    radio: (seed, signal) => { seeds.push(seed); return lookup(seed, signal); },
    collectionIds: (source, signal) => collection(source, signal),
    insert: id => {
      inserted.push(id);
      const uid = `own-${inserted.length}`;
      s.queueIds.splice(s.currentIndex + 1, 0, id);
      s.queueUids.splice(s.currentIndex + 1, 0, uid);
      return uid;
    },
    remove: uid => {
      removed.push(uid);
      const index = s.queueUids.indexOf(uid);
      s.queueIds.splice(index, 1); s.queueUids.splice(index, 1);
    },
  };
  const config = { ...defaults, ...options };
  const engine = new SmartShuffle(ports, () => time);
  engine.configure(config);
  const start = (id: string, session = id) => {
    s.currentIndex = s.queueIds.indexOf(id);
    s.currentId = id; s.currentUid = s.queueUids[s.currentIndex];
    s.transition = `${s.currentUid}:${session}`;
    engine.tick();
  };
  return { s, engine, inserted, removed, seeds, config, start,
    advance: (ms: number) => { time += ms; engine.tick(); },
    radio: (fn: Ports['radio']) => { lookup = fn; },
    collection: (fn: Ports['collectionIds']) => { collection = fn; },
  };
}

test('queue seeds span the remaining queue, rotate and exclude previous tracks, duplicates and owned entries', () => {
  const f = fixture();
  assert.deepEqual(selectSeeds(f.s, new Set(), 'queue', 0), ['0', '1', '6', '11', '16']);
  assert.deepEqual(selectSeeds(f.s, new Set(), 'queue', 1), ['0', '2', '7', '12', '17']);
  f.start('16');
  f.s.queueIds.push('17'); f.s.queueUids.push('duplicate');
  assert.deepEqual(selectSeeds(f.s, new Set(['u18']), 'queue', 0), ['16', '17', '19', '20']);
  assert.deepEqual(selectSeeds(f.s, new Set(), 'current', 0), ['16']);
  assert.deepEqual(selectSeeds(f.s, new Set(['u16']), 'current', 0), []);
  f.start('20');
  f.s.queueIds.pop(); f.s.queueUids.pop();
  assert.deepEqual(selectSeeds(f.s, new Set(), 'queue', 0), ['20']);
  f.s.currentId = ''; f.s.queueIds = []; f.s.queueUids = [];
  assert.deepEqual(selectSeeds(f.s, new Set(), 'queue', 0), []);
});

test('fusion prefers shared candidates and resolves ties by best rank then ID', () => {
  assert.equal(rankTracks([[track('solo'), track('shared')], [track('other'), track('shared')]])[0].id, 'shared');
  assert.deepEqual(rankTracks([[track('b')], [track('a')]]).map(t => t.id), ['a', 'b']);
  assert.deepEqual(rankTracks([[track('z'), track('z'), track('a')], [track('a')]]).map(t => t.id), ['a', 'z']);
  assert.equal(rankTracks([[{ id: 'bad', playable: false }, track('ok')]])[0].id, 'ok');
});

test('manual recommendation works while automatic mode is off and paused; repeated clicks cannot duplicate requests', async () => {
  const f = fixture(); f.s.playing = false;
  f.engine.requestNow(); f.engine.requestNow();
  assert.equal(f.engine.getState().loading, true);
  assert.equal(f.engine.getState().canSuggest, false);
  await settle();
  assert.deepEqual(f.inserted, ['new']);
  assert.equal(f.s.playing, false);
  assert.equal(f.engine.getState().pending, true);
  f.engine.requestNow(); await settle();
  assert.equal(f.inserted.length, 1);
  assert.equal(f.seeds.length, 5);
  f.engine.tick(); assert.equal(f.engine.getState().pending, true);
});

test('at most two radio calls run concurrently and partial failures still produce ranked results', async () => {
  const f = fixture(); let active = 0, maximum = 0;
  const releases: (() => void)[] = [];
  f.radio(async seed => {
    maximum = Math.max(maximum, ++active);
    await new Promise<void>(resolve => releases.push(resolve));
    active--;
    if (seed === '0') throw new Error('one radio unavailable');
    return [track(`solo-${seed}`), track('shared')];
  });
  f.engine.requestNow();
  while (f.engine.getState().loading) { releases.splice(0).forEach(resolve => resolve()); await settle(); }
  assert.equal(maximum, 2); assert.deepEqual(f.inserted, ['shared']);
});

test('automatic off removes automatic ownership but preserves a manually requested track', async () => {
  for (const manual of [false, true]) {
    const f = fixture({ enabled: true, interval: manual ? 3 : 1 });
    if (manual) f.engine.requestNow();
    await settle();
    f.engine.configure({ ...f.config, enabled: false });
    assert.deepEqual(f.removed, manual ? [] : ['own-1']);
  }
});

test('manual success resets progress while a failed manual request preserves it', async () => {
  const f = fixture({ enabled: true, interval: 3 });
  f.start('1'); assert.equal(f.engine.getState().count, 2);
  f.radio(async () => { throw new Error('offline'); });
  f.engine.requestNow(); await settle();
  assert.equal(f.engine.getState().count, 2);
  f.radio(async () => [track('new')]);
  f.engine.requestNow(); await settle();
  assert.equal(f.engine.getState().count, 0);
  f.start('new'); assert.equal(f.engine.getState().count, 0);
  f.start('2'); assert.equal(f.engine.getState().count, 1);
});

test('30-second mode excludes pause time and rapid skips, and counts each playback only once', async () => {
  const f = fixture({ enabled: true, interval: 2, countMode: '30-seconds' });
  f.advance(20000); assert.equal(f.engine.getState().count, 0);
  f.s.playing = false; f.engine.tick();
  assert.equal(f.engine.getState().timerNeeded, false);
  f.advance(60000); f.s.playing = true; f.engine.tick();
  f.advance(9999); assert.equal(f.engine.getState().count, 0);
  f.advance(1); assert.equal(f.engine.getState().count, 1);
  f.advance(60000); assert.equal(f.engine.getState().count, 1);
  f.start('1'); f.advance(29999); f.start('2');
  assert.equal(f.engine.getState().count, 1);
  // Seeking produces only a duplicate store update; position is never used as elapsed time.
  for (let i = 0; i < 20; i++) f.engine.tick();
  assert.equal(f.engine.getState().count, 1);
  f.advance(30000); await settle(); assert.deepEqual(f.inserted, ['new']);
  assert.equal(f.engine.getState().timerNeeded, false);
});

test('late replies cannot insert after queue edits, source/account changes, skips, suspension or unload', async () => {
  const edits = [
    (f: ReturnType<typeof fixture>) => { f.s.queueIds.push('manual'); f.s.queueUids.push('manual-uid'); },
    (f: ReturnType<typeof fixture>) => { f.s.source = 'other-account'; },
    (f: ReturnType<typeof fixture>) => { f.start('1'); },
    (f: ReturnType<typeof fixture>) => { f.s.eligible = false; },
    (f: ReturnType<typeof fixture>) => { f.engine.dispose(); },
    (f: ReturnType<typeof fixture>) => { f.s.allowExplicit = true; },
  ];
  for (const edit of edits) {
    const f = fixture({ recommendationSource: 'current' });
    let resolve!: (tracks: Track[]) => void;
    f.radio(() => new Promise(r => { resolve = r; }));
    f.engine.requestNow(); edit(f); f.engine.tick();
    resolve([track('late')]); await settle();
    assert.deepEqual(f.inserted, []);
  }
});

test('final validation catches queue edits even without a store tick and refreshes collection exclusions', async () => {
  const f = fixture({ recommendationSource: 'current' });
  let resolve!: (tracks: Track[]) => void;
  f.radio(() => new Promise(r => { resolve = r; }));
  f.engine.requestNow();
  f.s.queueIds.push('manual'); f.s.queueUids.push('manual');
  resolve([track('late')]); await settle(); assert.deepEqual(f.inserted, []);
  let reads = 0;
  f.collection(async () => ++reads === 1 ? [] : ['new-favorite']);
  f.radio(async () => [track('new-favorite'), { ...track('explicit'), explicit: true }, track('safe')]);
  f.engine.requestNow(); await settle(); assert.deepEqual(f.inserted, ['safe']);
});

test('blocked contexts and incoherent playback never request recommendations', async () => {
  const f = fixture();
  f.s.eligible = false; f.engine.requestNow();
  f.s.eligible = true; f.s.transition = ''; f.engine.requestNow();
  await settle(); assert.equal(f.seeds.length, 0);
});

test('failed complete collection lookup never inserts a recommendation', async () => {
  const f = fixture();
  f.collection(async () => { throw new Error('collection unavailable'); });
  f.engine.requestNow(); await settle();
  assert.deepEqual(f.inserted, []);
  assert.match(f.engine.getState().message, /collection unavailable/);
  assert.equal(f.engine.getState().loading, false);
});

test('a temporary incoherent playback snapshot does not recount the same track', () => {
  const f = fixture({ enabled: true, interval: 3 });
  assert.equal(f.engine.getState().count, 1);
  f.s.transition = ''; f.engine.tick();
  f.s.transition = 'u0:s0'; f.engine.tick();
  assert.equal(f.engine.getState().count, 1);
});

test('a played recommendation retained in queue history does not block future suggestions', async () => {
  const f = fixture();
  f.engine.requestNow(); await settle(); f.start('new'); f.start('1');
  assert.equal(f.engine.getState().pending, false);
  assert.equal(f.engine.getState().canSuggest, true);
  f.radio(async () => [track('second')]);
  f.engine.requestNow(); await settle();
  assert.deepEqual(f.inserted, ['new', 'second']);
  f.engine.dispose();
  assert.deepEqual(f.removed, ['own-2']);
  assert.ok(f.s.queueUids.includes('own-1'));
});

function removePending(f: ReturnType<typeof fixture>) {
  const index = f.s.queueUids.findIndex(uid => uid.startsWith('own-'));
  assert.ok(index >= 0);
  f.s.queueIds.splice(index, 1); f.s.queueUids.splice(index, 1);
}

test('session history excludes removed unheard suggestions across source and option changes', async () => {
  const f = fixture({ recommendationSource: 'current' });
  f.radio(async () => [track('first'), track('second')]);
  f.engine.requestNow(); await settle(); removePending(f);
  f.s.source = 'another-playlist';
  f.engine.configure({ ...f.config, enabled: true, interval: 20 });
  f.engine.requestNow(); await settle();
  assert.deepEqual(f.inserted, ['first', 'second']);
  removePending(f);
  f.engine.requestNow(); await settle();
  assert.deepEqual(f.inserted, ['first', 'second']);
});

test('automatic and manual recommendations share session history', async () => {
  const f = fixture({ enabled: true, interval: 1, recommendationSource: 'current' });
  await settle(); removePending(f);
  f.radio(async () => [track('new'), track('fresh')]);
  f.engine.configure({ ...f.config, enabled: false });
  f.engine.requestNow(); await settle();
  assert.deepEqual(f.inserted, ['new', 'fresh']);
});

test('a fresh engine session may suggest the same track again', async () => {
  const first = fixture(); first.engine.requestNow(); await settle(); first.engine.dispose();
  const second = fixture(); second.engine.requestNow(); await settle();
  assert.deepEqual(first.inserted, ['new']);
  assert.deepEqual(second.inserted, ['new']);
});
