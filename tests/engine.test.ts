import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SmartShuffle, type Snapshot, type Track, type Ports } from '../plugins/SmartShuffle/src/engine';

const settle = () => new Promise(resolve => setImmediate(resolve));
function fixture() {
  let s: Snapshot = {
    source: 'playlist-a', eligible: true, playing: true, transition: 'u1:s1',
    currentId: '1', currentUid: 'u1', queueIds: ['1', '2', '3'],
    queueUids: ['u1', 'u2', 'u3'], sourceIds: ['1', '2', '3'],
  };
  const inserted: string[] = [], removed: string[] = [], messages: string[] = [], seeds: string[] = [];
  let radio: Ports['radio'] = async seed => { seeds.push(seed); return [{ id: 'new', playable: true }]; };
  const ports: Ports = {
    snapshot: () => s,
    radio: (seed, signal) => radio(seed, signal),
    collectionIds: async () => ['1', '2', '3', 'unloaded-playlist-song'],
    insert: trackId => {
      inserted.push(trackId);
      const uid = `own-${inserted.length}`;
      s.queueIds.push(trackId); s.queueUids.push(uid);
      return uid;
    },
    remove: uid => {
      removed.push(uid);
      const index = s.queueUids.indexOf(uid);
      s.queueUids.splice(index, 1); s.queueIds.splice(index, 1);
    },
    report: message => messages.push(message),
  };
  const engine = new SmartShuffle(ports);
  const start = (trackId: string, uid = `u${trackId}`) => {
    s.currentId = trackId; s.currentUid = uid; s.transition = `${uid}:s${trackId}`;
    engine.tick();
  };
  return { engine, start, s, inserted, removed, messages, seeds,
    radio: (fn: Ports['radio']) => { radio = fn; } };
}

test('disabled by default; enabling counts current song and inserts after third start', async () => {
  const f = fixture(); f.engine.tick(); await settle(); assert.deepEqual(f.inserted, []);
  f.engine.configure(true, 3); f.start('2'); f.start('3'); await settle();
  assert.deepEqual(f.seeds, ['3']); assert.deepEqual(f.inserted, ['new']);
});
test('duplicate updates, pause/resume, and seeking do not count as new songs', async () => {
  const f = fixture(); f.engine.configure(true, 3);
  for (let i = 0; i < 20; i++) f.engine.tick();
  f.s.playing = false; f.engine.tick(); f.s.playing = true; f.engine.tick();
  f.start('2'); await settle(); assert.equal(f.inserted.length, 0);
  f.start('3'); await settle(); assert.equal(f.inserted.length, 1);
});
test('recommendation does not count; another three regular songs produce next recommendation', async () => {
  const f = fixture(); f.engine.configure(true, 3); f.start('2'); f.start('3'); await settle();
  f.start('new', 'own-1');
  f.s.queueIds.pop(); f.s.queueUids.pop();
  f.radio(async () => [{ id: 'next-new', playable: true }]);
  f.start('4'); f.start('5'); await settle(); assert.equal(f.inserted.length, 1);
  f.start('6'); await settle(); assert.deepEqual(f.inserted, ['new', 'next-new']);
});
test('filters seed, recent, full playlist, queued songs and unavailable tracks', async () => {
  const f = fixture();
  f.radio(async () => ['3', '1', 'unloaded-playlist-song', 'queued', 'bad', 'ok'].map(id => ({ id, playable: id !== 'bad' })));
  f.s.queueIds.push('queued'); f.s.queueUids.push('manual');
  f.engine.configure(true, 3); f.start('2'); f.start('3'); await settle();
  assert.deepEqual(f.inserted, ['ok']); assert.ok(f.s.queueUids.includes('manual'));
});
test('late radio response after skip cannot insert into the new song', async () => {
  const f = fixture(); let resolve!: (tracks: Track[]) => void;
  f.radio(() => new Promise(r => { resolve = r; }));
  f.engine.configure(true, 3); f.start('2'); f.start('3'); f.start('4');
  resolve([{ id: 'late', playable: true }]); await settle(); assert.equal(f.inserted.length, 0);
});
test('playlist switch cancels request and restarts count at one', async () => {
  const f = fixture(); let resolve!: (tracks: Track[]) => void;
  f.radio(() => new Promise(r => { resolve = r; }));
  f.engine.configure(true, 3); f.start('2'); f.start('3');
  f.s.source = 'playlist-b'; f.start('10'); resolve([{ id: 'late', playable: true }]); await settle();
  f.radio(async () => [{ id: 'fresh', playable: true }]);
  f.start('11'); await settle(); assert.equal(f.inserted.length, 0);
  f.start('12'); await settle(); assert.deepEqual(f.inserted, ['fresh']);
});
test('disable cancels request and removes only pending owned UID, even for equal IDs', async () => {
  const f = fixture(); f.engine.configure(true, 1); await settle();
  f.s.queueIds.push('new'); f.s.queueUids.push('manual');
  f.engine.configure(false, 1);
  assert.deepEqual(f.removed, ['own-1']); assert.ok(f.s.queueUids.includes('manual'));
});
test('disable leaves currently playing recommendation alone', async () => {
  const f = fixture(); f.engine.configure(true, 1); await settle();
  f.start('new', 'own-1'); f.engine.configure(false, 1);
  assert.deepEqual(f.removed, []);
});
test('deactivation/dispose reject pending results even if transport ignores abort', async () => {
  for (const dispose of [false, true]) {
    const f = fixture(); let resolve!: (tracks: Track[]) => void;
    f.radio(() => new Promise(r => { resolve = r; }));
    f.engine.configure(true, 1);
    if (dispose) f.engine.dispose(); else f.engine.configure(false, 1);
    resolve([{ id: 'late', playable: true }]); await settle(); assert.equal(f.inserted.length, 0);
  }
});
test('ineligible playback pauses insertion, cleans pending item, and starts fresh on return', async () => {
  const f = fixture(); f.engine.configure(true, 1); await settle();
  f.s.eligible = false; f.engine.tick(); assert.deepEqual(f.removed, ['own-1']);
  f.start('2'); await settle(); assert.equal(f.inserted.length, 1);
  f.radio(async () => [{ id: 'fresh', playable: true }]);
  f.s.eligible = true; f.engine.tick(); await settle(); assert.equal(f.inserted.length, 2);
});
test('failed radio or full-playlist lookup skips one slot and retries next interval', async () => {
  const f = fixture(); f.radio(async () => { throw new Error('offline'); });
  f.engine.configure(true, 3); f.start('2'); f.start('3'); await settle();
  assert.ok(f.messages.some(message => message.includes('offline'))); assert.equal(f.inserted.length, 0);
  f.radio(async () => [{ id: 'ok', playable: true }]);
  f.start('4'); f.start('5'); await settle(); assert.equal(f.inserted.length, 0);
  f.start('6'); await settle(); assert.deepEqual(f.inserted, ['ok']);
});
test('no eligible candidate leaves the queue unchanged', async () => {
  const f = fixture(); f.radio(async () => [{ id: '1', playable: true }]);
  f.engine.configure(true, 1); await settle(); assert.equal(f.inserted.length, 0);
});
test('a moved pending recommendation cannot cause a second outstanding insertion', async () => {
  const f = fixture(); f.engine.configure(true, 1); await settle();
  f.start('2'); f.start('3'); await settle(); assert.equal(f.inserted.length, 1);
});
test('a new playlist reusing an old queue UID must never lose its regular song', async () => {
  const f = fixture(); f.engine.configure(true, 1); await settle();
  f.s.source = 'playlist-b';
  f.s.queueIds = ['10', 'new']; f.s.queueUids = ['u10', 'own-1'];
  f.radio(async () => []);
  f.start('10'); await settle(); assert.deepEqual(f.removed, []);
  assert.ok(f.s.queueUids.includes('own-1'));
});
