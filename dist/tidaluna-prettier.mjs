const styles = ".tlp-list { display: flex; flex-direction: column; gap: 12px; }\n.tlp-list > .tlp-card { margin: 0 !important; padding: 0 !important; overflow: hidden; border: 1px solid #ffffff18; border-radius: 16px; background: #151b24e8; box-shadow: 0 6px 24px #00000016; }\n.tlp-card > :not(.tlp-summary) { margin: 0 18px 16px !important; }\n.tlp-card > .MuiBox-root > .MuiStack-root > .MuiTypography-h6 > a { display: none; }\n.tlp-card.tlp-collapsed > :not(.tlp-summary) { display: none !important; }\n.tlp-summary { box-sizing: border-box; width: 100%; display: flex; align-items: center; flex-wrap: wrap; gap: 12px; padding: 18px; margin: 0 !important; border: 0; background: transparent; color: #eef3f8; text-align: left; font: inherit; cursor: pointer; }\n.tlp-summary:hover { background: #ffffff06; }\n.tlp-summary:focus-visible, .tlp-toolbar :focus-visible { outline: 2px solid #69ded5; outline-offset: -3px; }\n.tlp-name { font-size: 17px; font-weight: 650; letter-spacing: -.25px; }\n.tlp-author { display: inline-flex; align-items: center; gap: 7px; color: #aebbc9; font-size: 13px; }\n.tlp-avatar { display: inline-flex; align-items: center; justify-content: center; flex: 0 0 24px; width: 24px; height: 24px; border-radius: 50%; background: #304551; color: #b7ece5; font-size: 11px; overflow: hidden; }\n.tlp-avatar img { width: 100%; height: 100%; object-fit: cover; }\n.tlp-status { margin-left: auto; border-radius: 20px; padding: 4px 9px; font-size: 11px; background: #ffffff0a; color: #9daabb; }\n.tlp-status[data-state=\"active\"] { background: #54d5b714; color: #85e2c9; }\n.tlp-status[data-state=\"error\"] { background: #ff98751a; color: #ffb394; }\n.tlp-chevron { font-size: 18px; color: #9ba9b8; }\n.tlp-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; padding: 16px 0; margin-bottom: 8px; color: #c0ccd8; font: inherit; }\n.tlp-toolbar input, .tlp-toolbar select, .tlp-toolbar button { border: 1px solid #ffffff20; border-radius: 10px; padding: 10px 12px; color: #eaf1f6; background: #171e29; font: inherit; font-size: 13px; }\n.tlp-toolbar input { flex: 1 1 240px; min-width: 120px; }\n.tlp-toolbar button { cursor: pointer; }\n.tlp-toolbar button:hover { border-color: #69ded580; }\n.tlp-count { width: 100%; font-size: 12px; color: #98a8b9; }\n.tlp-empty { padding: 32px; text-align: center; color: #b2c0cf; }\n.tlp-filtered { display: none !important; }\n@media (max-width: 600px) { .tlp-summary { gap: 8px; padding: 14px; } .tlp-name { font-size: 15px; } .tlp-author { font-size: 12px; } }\n";
const storageKey = 'tidaluna-prettier:expanded:v1';

export function pluginLabel(pkg) {
  const raw = String(pkg.name || 'Plugin');
  const match = raw.match(/^@([^/]+)\/(.+)$/);
  const title = (match?.[2] || raw).replace(/[-_]+/g, ' ').replace(/\b\p{L}/gu, c => c.toUpperCase());
  const author = typeof pkg.author === 'object' && pkg.author ? pkg.author : {};
  const developer = author.name || (typeof pkg.author === 'string' ? pkg.author.replace(/\s*[<(].*$/, '') : '') || match?.[1] || 'Unbekannt';
  // Only use explicit avatar metadata, never assume an npm scope is a GitHub account.
  let avatar;
  try { const url = new URL(author.avatarUrl); if (url.protocol === 'https:') avatar = url.href; } catch {}
  return { raw, title, developer, avatar };
}

export function matchesPlugin(plugin, query, filter) {
  const pkg = plugin.store.package;
  const label = pluginLabel(pkg);
  const haystack = `${label.raw} ${label.title} ${label.developer} ${typeof pkg.description === 'string' ? pkg.description : ''}`.toLocaleLowerCase();
  return query.trim().toLocaleLowerCase().split(/\s+/).every(word => haystack.includes(word)) &&
    (filter === 'all' || (filter === 'active' && plugin.enabled) || (filter === 'inactive' && !plugin.enabled) || (filter === 'error' && !!plugin.loadError?._));
}

export function start({ document, registry, storage, MutationObserver, location }) {
  let expanded = {};
  try { const value = JSON.parse(storage.getItem(storageKey)); if (value && typeof value === 'object' && !Array.isArray(value)) expanded = value; } catch {}
  let query = '', filter = 'all', stopped = false, queued = false;
  let toolbar, count, empty, activeList;
  const records = new Map();
  const el = (tag, className, text) => {
    const node = document.createElement(tag); node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const style = el('style', 'tlp-styles', styles);
  document.head.append(style);
  function save() { try { storage.setItem(storageKey, JSON.stringify(expanded)); } catch {} }
  function dispose(record) {
    for (const unsubscribe of record.subscriptions || []) unsubscribe();
    record.summary.remove();
    record.card.classList.remove('tlp-card', 'tlp-collapsed', 'tlp-filtered');
  }
  function clear() {
    for (const record of records.values()) dispose(record);
    records.clear(); toolbar?.remove(); empty?.remove();
    activeList?.classList.remove('tlp-list'); activeList = undefined;
  }
  function makeToolbar(list) {
    toolbar = el('div', 'tlp-toolbar');
    const search = el('input', ''); search.type = 'search'; search.placeholder = 'Plugins oder Entwickler suchen …';
    search.setAttribute('aria-label', 'Plugins durchsuchen'); search.value = query;
    search.addEventListener('input', () => { query = search.value; refresh(); });
    const select = el('select', ''); select.setAttribute('aria-label', 'Plugin-Status filtern');
    for (const [value, label] of [['all', 'Alle Plugins'], ['active', 'Aktiv'], ['inactive', 'Deaktiviert'], ['error', 'Mit Fehlern']]) {
      const option = el('option', '', label); option.value = value; select.append(option);
    }
    select.value = filter; select.addEventListener('change', () => { filter = select.value; refresh(); });
    toolbar.append(search, select);
    for (const [label, open] of [['Alle einklappen', false], ['Alle ausklappen', true]]) {
      const button = el('button', '', label); button.type = 'button';
      button.addEventListener('click', () => {
        for (const { plugin } of records.values()) if (matchesPlugin(plugin, query, filter)) expanded[plugin.url] = open;
        save(); refresh();
      }); toolbar.append(button);
    }
    count = el('span', 'tlp-count'); count.setAttribute('role', 'status'); toolbar.append(count);
    empty = el('div', 'tlp-empty', 'Keine passenden Plugins gefunden.');
    list.before(toolbar); list.after(empty);
  }
  function update(record) {
    const { card, plugin, summary, name, author, avatar, status, chevron } = record;
    const label = pluginLabel(plugin.store.package);
    name.textContent = label.title; summary.title = label.raw;
    author.textContent = label.developer;
    const avatarKey = `${label.avatar || ''}|${label.developer}`;
    if (record.avatarKey !== avatarKey) {
      record.avatarKey = avatarKey; avatar.textContent = label.developer.slice(0, 2).toUpperCase();
      if (label.avatar) {
        const img = el('img', ''); img.alt = ''; img.referrerPolicy = 'no-referrer';
        img.addEventListener('error', () => { avatar.textContent = label.developer.slice(0, 2).toUpperCase(); }, { once: true });
        img.src = label.avatar; avatar.replaceChildren(img);
      }
    }
    const open = expanded[plugin.url] === true;
    summary.setAttribute('aria-expanded', String(open));
    summary.setAttribute('aria-label', `${label.title} – ${open ? 'einklappen' : 'ausklappen'}`);
    card.classList.toggle('tlp-collapsed', !open);
    card.classList.toggle('tlp-filtered', !matchesPlugin(plugin, query, filter));
    chevron.textContent = open ? '⌃' : '⌄';
    const state = plugin.loadError?._ ? 'error' : plugin.loading?._ ? 'loading' : plugin.enabled ? 'active' : 'inactive';
    status.dataset.state = state;
    status.textContent = { error: 'Fehler', loading: 'Lädt …', active: 'Aktiv', inactive: 'Aus' }[state];
  }
  function refresh() {
    if (stopped) return;
    observer.disconnect();
    try {
      // Upstream Page currently does not assign rootId to its DOM node.
      // Scope via its route, selected Plugins tab, and direct list structure.
      const tab = location.search === '?LunaSettings'
        ? [...document.querySelectorAll('[role="tab"][aria-selected="true"]')].find(n => n.textContent.trim() === 'Plugins') : undefined;
      const page = tab?.closest('.MuiContainer-root');
      const panel = page?.querySelector(':scope > .MuiContainer-root');
      const list = panel?.querySelector(':scope > .MuiStack-root');
      if (!list) { clear(); return; }
      if (list !== activeList) { clear(); activeList = list; list.classList.add('tlp-list'); makeToolbar(list); }
      const plugins = Object.values(registry.plugins).filter(p => p.installed && !registry.corePlugins.has(p.name));
      const used = new Set();
      for (const card of [...list.children]) {
        let record = records.get(card);
        const heading = card.querySelector(':scope > .MuiBox-root .MuiTypography-h6');
        if (!heading) continue;
        const raw = heading.querySelector('a')?.textContent || heading.firstChild?.textContent;
        const plugin = plugins.find(p => !used.has(p) && p.store.package.name === raw);
        if (!plugin) continue;
        used.add(plugin);
        if (record && record.plugin !== plugin) { dispose(record); records.delete(card); record = undefined; }
        if (!record) {
          const summary = el('button', 'tlp-summary'); summary.type = 'button';
          const name = el('span', 'tlp-name'), by = el('span', 'tlp-author');
          const avatar = el('span', 'tlp-avatar'); avatar.setAttribute('aria-hidden', 'true');
          const author = el('span', ''), status = el('span', 'tlp-status'), chevron = el('span', 'tlp-chevron');
          chevron.setAttribute('aria-hidden', 'true'); by.append(avatar, author); summary.append(name, by, status, chevron);
          summary.addEventListener('click', () => { expanded[plugin.url] = expanded[plugin.url] !== true; save(); refresh(); });
          card.prepend(summary); card.classList.add('tlp-card');
          const subscriptions = [plugin.onSetEnabled?.(schedule), plugin.loading?.onValue?.(schedule), plugin.loadError?.onValue?.(schedule)].filter(Boolean);
          record = { card, plugin, summary, name, author, avatar, status, chevron, subscriptions }; records.set(card, record);
        }
        update(record);
      }
      for (const [card, record] of records) if (card.parentElement !== list || !used.has(record.plugin)) { dispose(record); records.delete(card); }
      const visible = [...records.values()].filter(r => matchesPlugin(r.plugin, query, filter)).length;
      count.textContent = `${visible} von ${records.size} Plugins`;
      empty.hidden = visible !== 0;
    } finally { if (!stopped) observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['aria-selected', 'checked'] }); }
  }
  function schedule() {
    if (queued || stopped) return;
    queued = true; queueMicrotask(() => { queued = false; refresh(); });
  }
  const observer = new MutationObserver(schedule);
  refresh();
  return () => { stopped = true; observer.disconnect(); clear(); style.remove(); };
}

export const unloads = new Set();
if (typeof window !== 'undefined' && window.luna?.core?.LunaPlugin) {
  let storage;
  try { storage = window.localStorage; } catch {}
  unloads.add(start({ document: window.document, registry: window.luna.core.LunaPlugin, storage,
    MutationObserver: window.MutationObserver, location: window.location }));
}
