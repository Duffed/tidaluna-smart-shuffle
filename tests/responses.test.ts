import { test } from 'node:test';
import assert from 'node:assert/strict';
import { request, type ResponseBus } from '../plugins/SmartShuffle/src/responses';

function fixture() {
  const listeners = new Map<string, Set<(payload: unknown) => void>>();
  const emit = (type: string, payload: unknown) => [...listeners.get(type) ?? []].forEach(fn => fn(payload));
  const bus: ResponseBus = {
    listen(type, fn) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type)!.add(fn); return () => { listeners.get(type)!.delete(fn); };
    },
    dispatch() {},
  };
  return { bus, emit, count: () => [...listeners.values()].reduce((sum, set) => sum + set.size, 0) };
}
const options = (signal: AbortSignal) => ({
  action: 'load', payload: { id: 'seed' }, success: 'success', failure: 'failure', signal,
  matches: (p: unknown) => (p as { trackId: string }).trackId === 'seed',
});
test('ignores unrelated success/failure and disposes both listeners on matching success', async () => {
  const f = fixture(); const p = request(f.bus, options(new AbortController().signal));
  f.emit('failure', { trackId: 'other' }); f.emit('success', { trackId: 'other' });
  assert.equal(f.count(), 2);
  f.emit('success', { trackId: 'seed', mixId: 'mix' });
  assert.deepEqual(await p, { trackId: 'seed', mixId: 'mix' }); assert.equal(f.count(), 0);
});
test('registers before dispatch, including synchronous cached responses', async () => {
  const f = fixture(); f.bus.dispatch = () => f.emit('success', { trackId: 'seed' });
  await request(f.bus, options(new AbortController().signal)); assert.equal(f.count(), 0);
});
test('matching failure and timeout clean up listeners', async () => {
  const f = fixture(); const p = request(f.bus, options(new AbortController().signal));
  f.emit('failure', { trackId: 'seed' }); await assert.rejects(p, /failed/); assert.equal(f.count(), 0);
  await assert.rejects(request(f.bus, { ...options(new AbortController().signal), timeoutMs: 5 }), /Timed out/);
  assert.equal(f.count(), 0);
});
test('abort and synchronous dispatch error clean up listeners', async () => {
  const f = fixture(); const c = new AbortController(); const p = request(f.bus, options(c.signal));
  c.abort(); await assert.rejects(p, /Aborted/); assert.equal(f.count(), 0);
  f.bus.dispatch = () => { throw new Error('missing action'); };
  await assert.rejects(request(f.bus, options(new AbortController().signal)), /missing action/);
  assert.equal(f.count(), 0);
});
