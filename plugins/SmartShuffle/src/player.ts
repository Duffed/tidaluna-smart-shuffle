import { getPreferences, getStatus, getEngineState, subscribe, updatePreferences } from './preferences';
import { suggestNow } from './commands';

export function mountPlayerSwitch(): () => void {
  const style = document.createElement('style');
  style.textContent = `
    #footerPlayer #playbackControlBar,
    #footerPlayer [class*="_playbackControls_"] { position: relative; }
    #footerPlayer [data-smart-shuffle] {
      position: absolute; left: -36px; top: 50%; transform: translateY(-50%);
      display: inline-flex; align-items: center; justify-content: center;
      width: 28px; height: 28px; padding: 5px; margin: 0; flex: 0 0 auto;
      border: 0; border-radius: 50%; background: transparent; color: #a6a6a6;
      cursor: pointer; line-height: 1;
    }
    #footerPlayer [data-smart-shuffle="toggle"][data-active="true"] { color: #44e4ce; }
    #footerPlayer [data-smart-shuffle="suggest"] { left: -68px; font-size: 22px; }
    #footerPlayer [data-smart-shuffle]:hover { background: rgba(255,255,255,.1); }
    #footerPlayer [data-smart-shuffle]:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
    #footerPlayer [data-smart-shuffle]:disabled { opacity: .4; cursor: default; }
    #footerPlayer [data-smart-shuffle] svg { width: 18px; height: 18px; pointer-events: none; }
  `;
  document.head.append(style);
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.smartShuffle = 'toggle';
  const suggest = document.createElement('button');
  suggest.type = 'button';
  suggest.dataset.smartShuffle = 'suggest';
  suggest.textContent = '+';
  suggest.setAttribute('aria-label', 'Suggest now');
  suggest.addEventListener('click', suggestNow);
  button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="m10 3 2.5 6.5L19 12l-6.5 2.5L10 21l-2.5-6.5L1 12l6.5-2.5Z"/><path d="m20 2 1 2.5L23.5 5.5 21 6.5 20 9l-1-2.5-2.5-1L19 4.5Z"/></svg>';
  const refresh = () => {
    const { enabled, interval, recommendationSource, countMode } = getPreferences();
    const state = getEngineState();
    button.dataset.active = String(enabled);
    button.setAttribute('aria-pressed', String(enabled));
    button.setAttribute('aria-label', `${enabled ? 'Disable' : 'Enable'} automatic recommendations`);
    button.title = `Automatic recommendations: ${enabled ? 'on' : 'off'} · ${state.count}/${interval} regular tracks · Source: ${recommendationSource === 'queue' ? 'Queue' : 'Current track'} · Count: ${countMode === 'start' ? 'On playback start' : 'After 30 seconds of playback'}\n${getStatus()}`;
    suggest.disabled = !state.canSuggest;
    suggest.setAttribute('aria-busy', String(state.loading));
    suggest.title = state.unavailableReason || 'Suggest now · Add one recommendation to play next';
  };
  const attach = () => {
    // Keep the native controls centered: place the icon just outside their left edge,
    // immediately beside Shuffle, without adding width to the native flex row.
    const controls = document.querySelector('#footerPlayer #playbackControlBar')
      ?? document.querySelector('#footerPlayer [class*="_playbackControls_"]');
    if (controls && button.parentElement !== controls) controls.prepend(button);
    if (controls && suggest.parentElement !== controls) controls.prepend(suggest);
    if (!controls && button.isConnected) button.remove();
    if (!controls && suggest.isConnected) suggest.remove();
    refresh();
  };
  const click = () => updatePreferences({ enabled: !getPreferences().enabled });
  button.addEventListener('click', click);
  const unsubscribe = subscribe(refresh);
  // Only observe child lists. Attribute/text updates on our own button must not loop.
  let scheduled = false;
  let disposed = false;
  const observer = new MutationObserver(mutations => {
    if (scheduled || mutations.every(m => m.target === button || button.contains(m.target) || m.target === suggest || suggest.contains(m.target))) return;
    scheduled = true;
    queueMicrotask(() => { scheduled = false; if (!disposed) attach(); });
  });
  observer.observe(document.body, { subtree: true, childList: true });
  attach();
  return () => {
    disposed = true;
    observer.disconnect();
    unsubscribe();
    button.removeEventListener('click', click);
    button.remove();
    suggest.removeEventListener('click', suggestNow);
    suggest.remove();
    style.remove();
  };
}
