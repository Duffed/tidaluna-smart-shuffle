export interface Track {
  id: string;
  playable: boolean;
  title?: string;
  explicit?: boolean;
}
export interface Snapshot {
  source: string;
  eligible: boolean;
  reason?: string;
  playing: boolean;
  transition: string;
  currentId: string;
  currentUid: string;
  currentIndex: number;
  queueIds: string[];
  queueUids: string[];
  sourceIds: string[];
  allowExplicit?: boolean;
}
export interface Options {
  enabled: boolean;
  interval: number;
  recommendationSource: 'queue' | 'current';
  countMode: 'start' | '30-seconds';
}
export const defaults: Options = { enabled: false, interval: 3, recommendationSource: 'queue', countMode: 'start' };
export function normalizeOptions(value: Partial<Options>): Options {
  return {
    enabled: value.enabled === true,
    interval: Number.isFinite(value.interval) ? Math.max(1, Math.min(20, Math.trunc(value.interval!))) : 3,
    recommendationSource: value.recommendationSource === 'current' ? 'current' : 'queue',
    countMode: value.countMode === '30-seconds' ? '30-seconds' : 'start',
  };
}
export interface EngineState {
  loading: boolean;
  canSuggest: boolean;
  unavailableReason: string;
  pending: boolean;
  count: number;
  timerNeeded: boolean;
  message: string;
}
export interface Ports {
  snapshot(): Snapshot;
  radio(seed: string, signal: AbortSignal): Promise<Track[]>;
  collectionIds(source: string, signal: AbortSignal): Promise<string[]>;
  insert(id: string): string;
  remove(uid: string): void;
  report(message: string): void;
  publish?(state: EngineState): void;
}

/** Select distinct seeds across the loaded, remaining queue, rotating within strata. */
export function selectSeeds(s: Snapshot, ownedUids: Set<string>, mode: Options['recommendationSource'], attempt: number): string[] {
  const current = !ownedUids.has(s.currentUid) && s.currentId ? [s.currentId] : [];
  if (mode === 'current') return current;
  const remaining = [...new Set(s.queueIds.filter((id, index) =>
    index > s.currentIndex && id && !ownedUids.has(s.queueUids[index]) && id !== current[0]))];
  const slots = 5 - current.length;
  if (remaining.length <= slots) return [...current, ...remaining];
  for (let i = 0; i < slots; i++) {
    const from = Math.floor(i * remaining.length / slots);
    const to = Math.floor((i + 1) * remaining.length / slots);
    current.push(remaining[from + attempt % (to - from)]);
  }
  return current;
}

/** Reciprocal rank fusion; duplicate appearances within one radio count only once. */
export function rankTracks(radios: Track[][]): Track[] {
  const candidates = new Map<string, { track: Track; score: number; best: number }>();
  for (const radio of radios) {
    const seen = new Set<string>();
    radio.forEach((track, index) => {
      if (!track.id || seen.has(track.id) || !track.playable) return;
      seen.add(track.id);
      const rank = index + 1;
      const entry = candidates.get(track.id) ?? { track, score: 0, best: rank };
      entry.score += 1 / (60 + rank);
      entry.best = Math.min(entry.best, rank);
      // Retain an explicit flag from any response for the final safety check.
      entry.track = { ...entry.track, ...(track.explicit ? { explicit: true } : {}) };
      candidates.set(track.id, entry);
    });
  }
  return [...candidates.values()].sort((a, b) => b.score - a.score || a.best - b.best ||
    (a.track.id < b.track.id ? -1 : a.track.id > b.track.id ? 1 : 0)).map(entry => entry.track);
}

type Origin = 'automatic' | 'manual';
type Owned = { id: string; source: string; origin: Origin; title?: string };
type Job = { controller: AbortController; signature: string; origin: Origin };

/** Orchestration with an injected monotonic clock; no browser or Tidal dependency. */
export class SmartShuffle {
  private options = { ...defaults };
  private count = 0;
  private source = '';
  private transition = '';
  private recentTransition = '';
  private counted = false;
  private elapsed = 0;
  private lastTime: number;
  private wasPlaying = false;
  private eligible = false;
  private recent: string[] = [];
  private owned = new Map<string, Owned>();
  private job?: Job;
  private attempt = 0;
  private disposed = false;
  private message = 'Ready';
  private lastReport = '';

  constructor(private readonly ports: Ports, private readonly now = () => performance.now()) {
    this.lastTime = now();
  }

  configure(options: Options): void {
    const next = normalizeOptions(options);
    if (JSON.stringify(next) === JSON.stringify(this.options)) return;
    const disabling = this.options.enabled && !next.enabled;
    this.cancel();
    this.options = next;
    if (disabling) this.cleanup('automatic');
    this.resetProgress();
    this.tick();
  }

  private resetProgress(): void {
    this.count = 0;
    this.transition = '';
    this.counted = false;
    this.elapsed = 0;
    this.wasPlaying = false;
    this.lastTime = this.now();
  }

  private signature(s: Snapshot): string {
    return JSON.stringify([s.source, s.transition, s.currentId, s.currentUid, s.currentIndex,
      s.queueIds, s.queueUids, s.sourceIds, s.allowExplicit]);
  }

  private cancel(): void {
    this.job?.controller.abort();
    this.job = undefined;
  }

  private prune(s: Snapshot): void {
    for (const [uid, entry] of this.owned) {
      const index = s.queueUids.indexOf(uid);
      if (entry.source !== s.source || index < 0 || s.queueIds[index] !== entry.id) this.owned.delete(uid);
    }
  }

  private cleanup(origin?: Origin): void {
    const s = this.ports.snapshot();
    this.prune(s);
    for (const [uid, entry] of this.owned) {
      if (uid !== s.currentUid && s.queueUids.indexOf(uid) > s.currentIndex && (!origin || entry.origin === origin)) {
        this.ports.remove(uid);
        this.owned.delete(uid);
      }
    }
  }

  private pending(s: Snapshot): Owned | undefined {
    return [...this.owned.entries()].find(([uid]) => uid !== s.currentUid && s.queueUids.indexOf(uid) > s.currentIndex)?.[1];
  }

  getState(): EngineState {
    const s = this.ports.snapshot();
    const pending = this.pending(s);
    const reason = this.disposed ? 'Plugin is unloaded.'
      : !s.eligible ? s.reason ?? 'Unavailable for this playback context.'
      : !s.transition ? 'Waiting for the current track to load.'
      : this.job ? 'Loading recommendations…'
      : pending ? 'A recommendation is already waiting in the queue.'
      : !selectSeeds(s, new Set(this.owned.keys()), this.options.recommendationSource, this.attempt).length
        ? 'No regular tracks are available as a recommendation source.' : '';
    return {
      loading: !!this.job, canSuggest: !reason, unavailableReason: reason, pending: !!pending,
      count: this.count,
      timerNeeded: !this.disposed && this.options.enabled && this.options.countMode === '30-seconds' &&
        s.eligible && s.playing && !!s.transition && !this.counted && !this.owned.has(s.currentUid) && !pending && !this.job,
      message: this.job ? 'Loading recommendations…'
        : pending ? `Queued recommendation${pending.title ? `: ${pending.title}` : ''} · plays next unless moved.`
        : !s.eligible ? s.reason ?? 'Unavailable for this playback context.'
        : !s.playing ? `${this.message} · Playback paused.` : this.message,
    };
  }

  private publish(): void {
    const state = this.getState();
    if (state.message !== this.lastReport) {
      this.lastReport = state.message;
      this.ports.report(state.message);
    }
    this.ports.publish?.(state);
  }

  tick(suppressAutomatic = false): void {
    if (this.disposed) return;
    const s = this.ports.snapshot();
    const time = this.now();
    if (s.source !== this.source) {
      this.cancel();
      this.cleanup();
      this.source = s.source;
      this.attempt = 0;
      this.recentTransition = '';
      this.resetProgress();
    }
    this.prune(s);
    if (this.job && this.job.signature !== this.signature(s)) {
      this.cancel();
      this.message = 'Recommendation cancelled because playback or the queue changed.';
    }
    if (!s.eligible) {
      this.cancel();
      if (this.eligible) { this.cleanup(); this.resetProgress(); }
      this.eligible = false;
      this.wasPlaying = false;
      this.lastTime = time;
      this.publish();
      return;
    }
    this.eligible = true;
    // A transient mismatch between queue and playback context is not a new play.
    // Keep the last coherent transition so a seek/loading update cannot count twice.
    if (!s.transition) {
      this.wasPlaying = false;
      this.lastTime = time;
      this.publish();
      return;
    }
    if (s.transition !== this.transition) {
      this.transition = s.transition;
      this.counted = false;
      this.elapsed = 0;
      this.message = this.options.enabled ? 'Automatic recommendations are active.' : 'Automatic recommendations are off. You can still suggest a track.';
    } else if (this.wasPlaying) {
      this.elapsed += Math.max(0, time - this.lastTime);
    }
    this.lastTime = time;
    this.wasPlaying = s.playing && !!s.transition;
    if (s.playing && s.transition && s.transition !== this.recentTransition) {
      this.recentTransition = s.transition;
      this.recent = [...this.recent, s.currentId].slice(-50);
    }
    const blocked = this.owned.has(s.currentUid) || !!this.pending(s) || !!this.job;
    if ((this.owned.has(s.currentUid) || this.pending(s)) && s.playing) this.counted = true;
    if (!suppressAutomatic && this.options.enabled && s.playing && s.transition && !blocked && !this.counted &&
        (this.options.countMode === 'start' || this.elapsed >= 30000)) {
      this.counted = true;
      this.count++;
      this.message = `Active · ${this.count}/${this.options.interval} regular tracks toward the next recommendation.`;
      if (this.count >= this.options.interval) {
        this.count = 0;
        this.begin(s, 'automatic');
      }
    }
    if (this.owned.has(s.currentUid)) this.message = 'Playing a recommendation · your queue resumes next.';
    this.publish();
  }

  requestNow(): void {
    if (this.disposed) return;
    this.tick(true);
    if (!this.getState().canSuggest) return;
    this.begin(this.ports.snapshot(), 'manual');
    this.publish();
  }

  private begin(start: Snapshot, origin: Origin): void {
    const seeds = selectSeeds(start, new Set(this.owned.keys()), this.options.recommendationSource, this.attempt++);
    if (!seeds.length) { this.message = 'No regular tracks are available as a recommendation source.'; return; }
    const job: Job = { controller: new AbortController(), signature: this.signature(start), origin };
    this.job = job;
    void this.recommend(start, seeds, job);
  }

  private async radios(seeds: string[], signal: AbortSignal): Promise<Track[][]> {
    const results: (Track[] | undefined)[] = new Array(seeds.length);
    const failures: unknown[] = [];
    let index = 0;
    const worker = async () => {
      while (index < seeds.length && !signal.aborted) {
        const slot = index++;
        const seed = seeds[slot];
        try { results[slot] = await this.ports.radio(seed, signal); }
        catch (error) { failures.push(error); }
      }
    };
    await Promise.all([worker(), worker()]);
    signal.throwIfAborted();
    const successful = results.filter((tracks): tracks is Track[] => tracks !== undefined);
    if (!successful.length) throw failures[0] ?? new Error('No radio results available');
    return successful;
  }

  private async recommend(start: Snapshot, seeds: string[], job: Job): Promise<void> {
    const { controller } = job;
    try {
      const [radios, collection] = await Promise.all([
        this.radios(seeds, controller.signal), this.ports.collectionIds(start.source, controller.signal),
      ]);
      // Read collection exclusions again: favorites can change during radio loading.
      const freshCollection = await this.ports.collectionIds(start.source, controller.signal);
      const now = this.ports.snapshot();
      if (controller.signal.aborted || this.disposed || this.job !== job || !now.eligible ||
          (job.origin === 'automatic' && !this.options.enabled) || this.signature(now) !== job.signature) return;
      this.prune(now);
      if (this.pending(now)) return;
      const excluded = new Set([...collection, ...freshCollection, ...now.sourceIds, ...now.queueIds, ...this.recent, ...seeds]);
      const candidate = rankTracks(radios).find(track => track.playable &&
        !(now.allowExplicit === false && track.explicit) && !excluded.has(track.id));
      if (!candidate) { this.message = 'No new recommendation: all radio results are unavailable or already in your collection, queue, or recent history.'; return; }
      const uid = this.ports.insert(candidate.id);
      this.owned.set(uid, { id: candidate.id, source: start.source, origin: job.origin, title: candidate.title });
      this.count = 0;
      this.counted = true;
      this.elapsed = 0;
      this.message = candidate.title ? `Queued recommendation: ${candidate.title}.` : 'Recommendation queued to play next.';
    } catch (error) {
      if (!controller.signal.aborted) this.message = `Recommendation skipped: ${String(error)}`;
    } finally {
      // Stop remaining workers if a collection request failed.
      controller.abort();
      if (this.job === job) {
        this.job = undefined;
        this.publish();
      }
    }
  }

  dispose(): void {
    this.disposed = true;
    this.cancel();
    this.cleanup();
    this.publish();
  }
}
