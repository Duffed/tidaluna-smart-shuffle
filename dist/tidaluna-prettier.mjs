const styles = ".tlp-list { display: flex; flex-direction: column; gap: 12px; }\n.tlp-page { box-sizing: border-box; max-height: var(--tlp-available-height); overflow-y: auto !important; overflow-x: hidden; min-height: 0; margin-bottom: 0 !important; padding: 0 12px 48px !important; scrollbar-gutter: stable; scroll-padding-block: 20px 48px; color: #eef3f8; }\n.tlp-page > .MuiTabs-root { position: sticky; top: 0; z-index: 3; background: #111820f5; border-bottom: 1px solid #ffffff16; border-radius: 12px 12px 0 0; }\n.tlp-page .MuiTab-root { color: #aebbc9; min-width: 0; }\n.tlp-page .MuiTab-root.Mui-selected { color: #85e2c9; }\n.tlp-page .MuiTabs-indicator { background: #85e2c9; }\n.tlp-panel { margin: 20px 0 0 !important; padding: 0 !important; width: 100% !important; }\n.tlp-section-list { gap: 14px; }\n.tlp-section-list > .tlp-section { box-sizing: border-box; margin: 0 !important; padding: 18px !important; border: 1px solid #ffffff18; border-radius: 16px; background: #151b24e8; min-width: 0; }\n.tlp-generic { border: 1px solid #ffffff18 !important; border-radius: 16px !important; background: #151b24e8 !important; min-width: 0; }\n.tlp-generic > .tlp-summary { padding: 10px 0 16px; cursor: default; }\n.tlp-generic > button.tlp-summary { cursor: pointer; }\n.tlp-generic > button.tlp-summary > .tlp-chevron { margin-left: auto; }\n.tlp-generic > .tlp-original-header .MuiTypography-h6 > a { display: none; }\n.tlp-generic > .tlp-original-header > .MuiStack-root { flex-wrap: wrap; row-gap: 8px; }\n.tlp-generic > .tlp-original-header > .MuiStack-root > :last-child:not(.MuiTypography-h6) { max-width: 100%; }\n.tlp-group-closed > :not(.tlp-summary) { display: none !important; }\n.tlp-store-list .MuiGrid-container { align-items: stretch; }\n.tlp-store-list .MuiGrid-container > .MuiGrid-root { min-width: 0; }\n.tlp-store-list .MuiButtonBase-root.tlp-generic { display: flex; flex-direction: column; align-items: stretch; height: 100%; padding: 16px; box-shadow: none; }\n.tlp-store-list .MuiButtonBase-root.tlp-generic > .tlp-summary { pointer-events: none; padding: 0 0 12px; }\n.tlp-store-list .tlp-name, .tlp-section .tlp-name { overflow-wrap: anywhere; }\n.tlp-page .MuiOutlinedInput-root { border-radius: 10px; background: #171e29; }\n.tlp-page .MuiOutlinedInput-notchedOutline { border-color: #ffffff20; }\n.tlp-page .MuiButton-root { border-radius: 10px; text-transform: none; }\n.tlp-page .MuiAvatar-root { border: 1px solid #ffffff20; }\n@media (max-width: 700px) { .tlp-store-list .MuiGrid-container > .MuiGrid-root { width: 100%; } .tlp-store-list > .tlp-section:first-child { flex-wrap: wrap; gap: 12px; } }\n.tlp-list > .tlp-card { margin: 0 !important; padding: 0 !important; overflow: hidden; border: 1px solid #ffffff18; border-radius: 16px; background: #151b24e8; box-shadow: 0 6px 24px #00000016; }\n.tlp-card > :not(.tlp-summary) { margin: 0 18px 16px !important; }\n.tlp-card > .MuiBox-root > .MuiStack-root > .MuiTypography-h6 > a { display: none; }\n.tlp-card.tlp-collapsed > :not(.tlp-summary) { display: none !important; }\n.tlp-summary { box-sizing: border-box; width: 100%; display: flex; align-items: center; flex-wrap: wrap; gap: 12px; padding: 18px; margin: 0 !important; border: 0; background: transparent; color: #eef3f8; text-align: left; font: inherit; cursor: pointer; }\n.tlp-summary:hover { background: #ffffff06; }\n.tlp-summary:focus-visible, .tlp-toolbar :focus-visible { outline: 2px solid #69ded5; outline-offset: -3px; }\n.tlp-name { font-size: 17px; font-weight: 650; letter-spacing: -.25px; }\n.tlp-author { display: inline-flex; align-items: center; gap: 7px; color: #aebbc9; font-size: 13px; }\n.tlp-avatar { display: inline-flex; align-items: center; justify-content: center; flex: 0 0 24px; width: 24px; height: 24px; border-radius: 50%; background: #304551; color: #b7ece5; font-size: 11px; overflow: hidden; }\n.tlp-avatar img { width: 100%; height: 100%; object-fit: cover; }\n.tlp-status { margin-left: auto; border-radius: 20px; padding: 4px 9px; font-size: 11px; background: #ffffff0a; color: #9daabb; }\n.tlp-status[data-state=\"active\"] { background: #54d5b714; color: #85e2c9; }\n.tlp-status[data-state=\"error\"] { background: #ff98751a; color: #ffb394; }\n.tlp-chevron { font-size: 18px; color: #9ba9b8; }\n.tlp-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; padding: 16px 0; margin-bottom: 8px; color: #c0ccd8; font: inherit; }\n.tlp-toolbar input, .tlp-toolbar select, .tlp-toolbar button { border: 1px solid #ffffff20; border-radius: 10px; padding: 10px 12px; color: #eaf1f6; background: #171e29; font: inherit; font-size: 13px; }\n.tlp-toolbar input { flex: 1 1 240px; min-width: 120px; }\n.tlp-toolbar button { cursor: pointer; }\n.tlp-toolbar button:hover { border-color: #69ded580; }\n.tlp-count { width: 100%; font-size: 12px; color: #98a8b9; }\n.tlp-empty { padding: 32px; text-align: center; color: #b2c0cf; }\n.tlp-filtered { display: none !important; }\n.tlp-store-filtered, .tlp-native-search { display: none !important; }\n@media (max-width: 600px) { .tlp-summary { gap: 8px; padding: 14px; } .tlp-name { font-size: 15px; } .tlp-author { font-size: 12px; } }\n";
const storageKey = 'tidaluna-prettier:expanded:v1';

export function isDuffedDownload(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return false;
    const path = url.pathname.toLowerCase();
    return (url.hostname === 'github.com' && /^\/duffed\/tidaluna-smart-shuffle\/releases\/(download\/latest|latest\/download)\/(store\.json|(?:tidaluna-prettier|local\.smart-shuffle)\.(json|mjs))$/.test(path)) ||
      (url.hostname === 'raw.githubusercontent.com' && /^\/duffed\/(tidaluna-smart-shuffle|tidaluna-prettier)\/main\/dist\/(store\.json|(?:tidaluna-prettier|local\.smart-shuffle)\.(json|mjs))$/.test(path));
  } catch { return false; }
}

// Only the user's mutable distribution URLs bypass caching. No unrelated requests are changed.
export function installUpdateTransport(target) {
  const original = target.fetch;
  if (typeof original !== 'function') return () => {};
  let sequence = 0;
  function freshFetch(input, init) {
    const request = typeof input === 'object' && input !== null && 'url' in input;
    const url = request ? input.url : String(input);
    const method = init?.method || (request ? input.method : 'GET');
    if (!isDuffedDownload(url) || method.toUpperCase() !== 'GET') return original.call(target, input, init);
    // GitHub Raw can retain old branch content at its CDN even with a query string.
    // Resolve those legacy download locations internally to the same rolling store assets.
    // The persisted installation/store URL is intentionally unchanged.
    const fresh = new URL(url);
    if (fresh.hostname === 'raw.githubusercontent.com') {
      fresh.hostname = 'github.com';
      fresh.pathname = `/Duffed/tidaluna-smart-shuffle/releases/download/latest/${fresh.pathname.split('/').pop()}`;
    }
    fresh.searchParams.set('tlp_update', `${Date.now()}-${++sequence}`);
    const options = { ...init, cache: 'no-store' };
    return original.call(target, request ? new target.Request(fresh.href, input) : fresh.href, options);
  }
  target.fetch = freshFetch;
  return () => { if (target.fetch === freshFetch) target.fetch = original; };
}

export async function updateStorePlugins(registry, report, cancelled = () => false) {
  const plugins = Object.values(registry.plugins).filter(p => p.installed && isDuffedDownload(`${p.url}.json`));
  // Reloading ourselves removes the current toolbar; do that last.
  plugins.sort((a, b) => Number(a.name === '@Duffed/tidaluna-prettier') - Number(b.name === '@Duffed/tidaluna-prettier'));
  let updated = 0, skipped = 0, failed = 0;
  for (const plugin of plugins) {
    if (cancelled()) break;
    if (!plugin.enabled) { skipped++; continue; }
    try {
      report(`${pluginLabel(plugin.store.package).title}: Version prüfen …`);
      const latest = await registry.fetchPackage(plugin.url);
      if (cancelled()) break;
      if (!latest.hash || latest.name !== plugin.name) throw new Error('Ungültige Plugin-Metadaten');
      if (latest.hash === plugin.store.package.hash) continue;
      await plugin.reload();
      if (plugin.loadError?._ || plugin.store.package.hash !== latest.hash) throw new Error('Neue Version wurde nicht geladen');
      updated++;
    } catch (error) { failed++; report(`${plugin.name}: ${error.message}`); }
  }
  const summary = `${updated} aktualisiert · ${skipped} deaktiviert übersprungen · ${failed} fehlgeschlagen`;
  report(summary);
  return { updated, skipped, failed };
}

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
  const decorated = new Map();
  let storeToolbar, storeCount, storeEmpty, storeList;
  let storeQuery = '', storeFilter = 'all';
  let updating = false, updateMessage = '';
  const storeHidden = new Set();
  function clearStoreSearch() {
    storeToolbar?.remove(); storeEmpty?.remove(); storeToolbar = storeList = undefined;
    for (const node of storeHidden) node.classList.remove('tlp-store-filtered');
    storeHidden.clear();
  }
  function filterStore(list) {
    if (!list) { clearStoreSearch(); return; }
    if (storeList !== list) {
      clearStoreSearch(); storeList = list;
      storeToolbar = el('div', 'tlp-toolbar tlp-store-toolbar');
      const search = el('input', ''); search.type = 'search'; search.value = storeQuery;
      search.placeholder = 'Plugins, Entwickler oder Beschreibung suchen …';
      search.setAttribute('aria-label', 'Plugin Store durchsuchen');
      search.addEventListener('input', () => { storeQuery = search.value; refresh(); });
      const select = el('select', ''); select.setAttribute('aria-label', 'Installationsstatus filtern');
      for (const [value, label] of [['all', 'Alle Plugins'], ['installed', 'Installiert'], ['available', 'Nicht installiert']]) {
        const option = el('option', '', label); option.value = value; select.append(option);
      }
      select.value = storeFilter;
      select.addEventListener('change', () => { storeFilter = select.value; refresh(); });
      const reset = el('button', '', 'Zurücksetzen'); reset.type = 'button';
      reset.addEventListener('click', () => { search.value = storeQuery = ''; select.value = storeFilter = 'all'; refresh(); });
      storeCount = el('span', 'tlp-count'); storeCount.setAttribute('role', 'status');
      const update = el('button', '', 'Duffed-Plugins aktualisieren'); update.type = 'button'; update.disabled = updating;
      const updateStatus = el('span', 'tlp-count', updateMessage); updateStatus.setAttribute('role', 'status');
      update.addEventListener('click', async () => {
        if (updating) return;
        updating = true; update.disabled = true;
        try { await updateStorePlugins(registry, message => { updateMessage = message; updateStatus.textContent = message; }, () => stopped); }
        finally { updating = false; update.disabled = false; if (!stopped) refresh(); }
      });
      storeToolbar.append(search, select, reset, update, storeCount, updateStatus); list.before(storeToolbar);
      storeEmpty = el('div', 'tlp-empty', 'Keine passenden Plugins in den geladenen Stores gefunden.'); list.after(storeEmpty);
    }
    // Upstream's filename-only search must not unmount developer/description matches.
    for (const input of list.querySelectorAll('input[placeholder="Search plugins..."]')) {
      if (input.value) {
        Object.getOwnPropertyDescriptor(view.HTMLInputElement.prototype, 'value').set.call(input, '');
        input.dispatchEvent(new view.Event('input', { bubbles: true }));
        input.dispatchEvent(new view.Event('change', { bubbles: true }));
      }
      mark(input.closest('.MuiFormControl-root') || input, 'tlp-native-search');
    }
    for (const node of storeHidden) node.classList.remove('tlp-store-filtered');
    storeHidden.clear();
    const hide = node => { node.classList.add('tlp-store-filtered'); storeHidden.add(node); };
    const words = storeQuery.trim().toLocaleLowerCase().split(/\s+/);
    const filtering = !!storeQuery.trim() || storeFilter !== 'all';
    let total = 0, visible = 0;
    for (const group of list.children) {
      const products = [...group.querySelectorAll('.MuiButtonBase-root.tlp-generic')];
      if (!products.length) continue;
      let groupVisible = 0;
      for (const card of products) {
        total++;
        const raw = card.querySelector('.MuiTypography-h6 a')?.textContent;
        const candidates = Object.values(registry.plugins).filter(p => p.store.package.name === raw);
        const installed = candidates.some(p => p.installed);
        const text = `${card.textContent} ${candidates.map(p => {
          const pkg = p.store.package, label = pluginLabel(pkg);
          return `${label.raw} ${label.title} ${label.developer} ${typeof pkg.description === 'string' ? pkg.description : ''}`;
        }).join(' ')}`.toLocaleLowerCase();
        const match = words.every(word => text.includes(word)) && (storeFilter === 'all' || (storeFilter === 'installed' ? installed : !installed));
        if (match) { visible++; groupVisible++; } else hide(card.closest('.MuiGrid-root') || card);
      }
      if (filtering && !groupVisible) hide(group);
      const record = decorated.get(group);
      if (record) {
        const link = group.querySelector('.MuiTypography-h6 a');
        const key = `store:${link?.getAttribute('href') || link?.textContent}`;
        const open = filtering && groupVisible > 0 || expanded[key] !== false;
        group.classList.toggle('tlp-group-closed', !open);
        record.summary.setAttribute('aria-expanded', String(open));
        const chevron = record.summary.querySelector('.tlp-chevron'); if (chevron) chevron.textContent = open ? '⌃' : '⌄';
      }
    }
    storeCount.textContent = `${visible} von ${total} geladenen Plugins`;
    storeEmpty.hidden = visible !== 0 || !filtering;
  }
  let styledPage, styledTab, pageStyle, pageClasses = new Map();
  const view = document.defaultView;
  function mark(node, className) {
    if (!node || node.classList.contains(className)) return;
    node.classList.add(className);
    if (!pageClasses.has(node)) pageClasses.set(node, new Set());
    pageClasses.get(node).add(className);
  }
  function clearPage() {
    clearStoreSearch();
    for (const [node, record] of decorated) { record.summary.remove(); node.classList.remove('tlp-generic', 'tlp-group-closed'); }
    decorated.clear();
    for (const [node, classes] of pageClasses) for (const name of classes) node.classList.remove(name);
    pageClasses.clear();
    if (styledPage) {
      if (pageStyle === null) styledPage.removeAttribute('style'); else styledPage.setAttribute('style', pageStyle);
    }
    styledPage = undefined; styledTab = undefined;
  }
  function decoratePage(page, panel, tabName) {
    if (styledPage !== page || styledTab !== tabName) { clearPage(); styledPage = page; styledTab = tabName; pageStyle = page.getAttribute('style'); }
    mark(page, 'tlp-page'); mark(panel, 'tlp-panel');
    // Own the scroll area: the host's bottom margin can fall behind TIDAL's fixed player.
    // Reserve the player area even when its DOM is changed by another theme/plugin.
    const top = Math.max(0, page.getBoundingClientRect().top);
    const height = Math.max(120, (view?.innerHeight || 800) - top - 150);
    page.style.setProperty('--tlp-available-height', `${height}px`);
    const list = panel?.querySelector(':scope > .MuiStack-root');
    if (tabName === 'Plugins') return;
    mark(list, 'tlp-section-list');
    if (tabName === 'Plugin Store') mark(list, 'tlp-store-list');
    for (const child of list?.children || []) {
      if (child.matches('.MuiStack-root, .MuiBox-root')) mark(child, 'tlp-section');
    }
    const alive = new Set();
    for (const heading of panel?.querySelectorAll('.MuiTypography-h6') || []) {
      const header = heading.closest('.MuiBox-root');
      const card = header?.parentElement;
      const link = heading.querySelector('a');
      if (!card || !link || !card.matches('.MuiStack-root, .MuiButtonBase-root')) continue;
      alive.add(card);
      const raw = link.textContent;
      const plugin = Object.values(registry.plugins).find(p => p.store.package.name === raw);
      const authorNode = heading.parentElement?.lastElementChild;
      const authorName = authorNode !== heading ? authorNode?.textContent?.replace(/^by\s+/i, '').trim() : '';
      const label = pluginLabel(plugin?.store.package || { name: raw, author: authorName || undefined });
      // A theme without a manifest uses its URL as its title.
      if (/^https?:\/\//.test(raw)) {
        try { label.title = decodeURIComponent(new URL(raw).pathname.split('/').pop()).replace(/\.css$/i, '').replace(/[-_]/g, ' ') || 'Theme'; } catch {}
      }
      const signature = JSON.stringify(label);
      let record = decorated.get(card);
      if (record?.signature === signature) continue;
      if (record) record.summary.remove();
      const isGroup = tabName === 'Plugin Store' && !card.matches('.MuiButtonBase-root');
      const summary = el(isGroup ? 'button' : 'div', 'tlp-summary');
      if (isGroup) summary.type = 'button';
      const name = el('span', 'tlp-name', label.title), by = el('span', 'tlp-author');
      const avatar = el('span', 'tlp-avatar', label.developer.slice(0, 2).toUpperCase());
      avatar.setAttribute('aria-hidden', 'true');
      if (label.avatar) {
        const img = el('img', ''); img.alt = ''; img.referrerPolicy = 'no-referrer'; img.src = label.avatar;
        img.addEventListener('error', () => { avatar.textContent = label.developer.slice(0, 2).toUpperCase(); }, { once: true });
        avatar.replaceChildren(img);
      }
      by.append(avatar, el('span', '', label.developer)); summary.append(name, by); summary.title = raw;
      if (isGroup) {
        const key = `store:${link.getAttribute('href') || raw}`;
        const open = expanded[key] !== false;
        card.classList.toggle('tlp-group-closed', !open);
        summary.setAttribute('aria-expanded', String(open));
        summary.append(el('span', 'tlp-chevron', open ? '⌃' : '⌄'));
        summary.addEventListener('click', () => { expanded[key] = expanded[key] === false; save(); decorated.get(card).signature = ''; refresh(); });
      }
      card.prepend(summary); mark(card, 'tlp-generic'); mark(header, 'tlp-original-header');
      decorated.set(card, { summary, signature });
    }
    for (const [node, record] of decorated) if (!alive.has(node)) {
      record.summary.remove(); node.classList.remove('tlp-generic', 'tlp-group-closed'); decorated.delete(node);
    }
  }
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
      // Scope via the Luna route and its selected tab; never style TIDAL's own settings.
      const tab = location.search === '?LunaSettings'
        ? [...document.querySelectorAll('[role="tab"][aria-selected="true"]')].find(n => ['Plugins', 'Plugin Store', 'Themes', 'Settings', 'Supporters'].includes(n.textContent.trim())) : undefined;
      const page = tab?.closest('.MuiContainer-root');
      const panel = page?.querySelector(':scope > .MuiContainer-root');
      if (!page) { clear(); clearPage(); return; }
      decoratePage(page, panel, tab.textContent.trim());
      if (tab.textContent.trim() === 'Plugin Store') filterStore(panel?.querySelector(':scope > .MuiStack-root'));
      if (tab.textContent.trim() !== 'Plugins') { clear(); return; }
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
  view?.addEventListener('resize', schedule);
  view?.addEventListener('popstate', schedule);
  refresh();
  return () => { stopped = true; observer.disconnect(); view?.removeEventListener('resize', schedule); view?.removeEventListener('popstate', schedule); clear(); clearPage(); style.remove(); };
}

export const unloads = new Set();
if (typeof window !== 'undefined' && window.luna?.core?.LunaPlugin) {
  unloads.add(installUpdateTransport(window));
  let storage;
  try { storage = window.localStorage; } catch {}
  unloads.add(start({ document: window.document, registry: window.luna.core.LunaPlugin, storage,
    MutationObserver: window.MutationObserver, location: window.location }));
}
