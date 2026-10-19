'use strict';

(() => {
  const byId = (id) => document.getElementById(id);
  const state = { schemes: [], selectedId: null, device: 'desktop', loadingTimer: null,
    votes: { counts: {}, totalVotes: null, myVote: null, loaded: false }, voteReading: false, voteBusy: false, voteError: '' };
  const elements = {
    list: byId('scheme-list'), count: byId('scheme-count'), title: byId('preview-title'),
    description: byId('preview-description'), group: byId('preview-group'), version: byId('preview-version'),
    frame: byId('preview-frame'), placeholder: byId('preview-placeholder'), loading: byId('preview-loading'),
    stage: byId('preview-stage'), address: byId('preview-address'), open: byId('open-preview'),
    notice: byId('preview-notice'), noticeText: byId('preview-notice-text'), noticeOpen: byId('notice-open'),
    footnote: byId('preview-footnote'), globalError: byId('global-error'), toast: byId('toast'),
    voting: byId('scheme-voting'), schemeVotes: byId('scheme-vote-count'), totalVotes: byId('total-vote-count'),
    voteButton: byId('vote-current'), voteStatus: byId('vote-status'), voteError: byId('vote-error'), voteErrorText: byId('vote-error-text'), voteRetry: byId('vote-retry')
  };
  let toastTimer;
  let loadRequest = 0;
  let voteRequest = 0;
  let voterIdentity;

  function node(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function checkIcon() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'm5 12 4 4L19 6');
    svg.append(path);
    return svg;
  }

  function safeURL(value) {
    if (typeof value !== 'string' || !value) return null;
    try {
      const url = new URL(value, document.baseURI);
      return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
    } catch { return null; }
  }

  function formatDate(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(date).replaceAll('/', '.');
  }

  function notify(message) {
    clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.hidden = false;
    toastTimer = setTimeout(() => { elements.toast.hidden = true; }, 3500);
  }

  function getHashId() {
    try { return decodeURIComponent(window.location.hash.slice(1)); } catch { return ''; }
  }

  function rememberedId() {
    try { return localStorage.getItem('ah-public-preview-selected'); } catch { return null; }
  }

  const VOTE_ENDPOINT = 'https://ah-design-options-1016.gmail-heiji.chatgpt.site/api/votes';
  function anonymousIdentity() {
    if (voterIdentity) return voterIdentity;
    try {
      const stored = localStorage.getItem('ah-public-voter');
      const valid = typeof stored === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(stored);
      const id = valid ? stored : crypto.randomUUID();
      if (!valid) localStorage.setItem('ah-public-voter', id);
      voterIdentity = id;
      return id;
    } catch { throw new Error('无法保存匿名投票标识，请允许浏览器保存本站数据后重试。'); }
  }

  async function requestVotes(options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(VOTE_ENDPOINT, { ...options, cache: 'no-store', credentials: 'omit', signal: controller.signal,
        headers: { ...options.headers, Authorization: 'Bearer ' + anonymousIdentity() } });
      let data;
      try { data = await response.json(); } catch { throw new Error('投票服务暂不可用（' + response.status + '），请稍后重试。'); }
      if (!response.ok) throw new Error(data.error || '投票请求未完成（' + response.status + '）。');
      return data;
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('投票服务连接超时，请重试。');
      throw error;
    } finally { clearTimeout(timeout); }
  }

  function voteCount(id) {
    return state.votes.loaded ? (state.votes.counts[id] || 0) : null;
  }

  function rankedSchemes() {
    return state.schemes.map((scheme, index) => ({ scheme, index }))
      .sort((a, b) => (voteCount(b.scheme.id) || 0) - (voteCount(a.scheme.id) || 0) || a.index - b.index)
      .map(({ scheme }) => scheme);
  }

  function catalogView() {
    const active = document.activeElement;
    return { top: elements.list.scrollTop, left: elements.list.scrollLeft,
      focusId: elements.list.contains(active) ? active.closest('.scheme-item')?.dataset.catalogScheme : null,
      focusAction: elements.list.contains(active) ? active.dataset.catalogAction : null };
  }

  function restoreCatalogView(view) {
    if (!view) return;
    if (view.focusId && view.focusAction) {
      const item = [...elements.list.children].find((entry) => entry.dataset.catalogScheme === view.focusId);
      const target = item?.querySelector(`[data-catalog-action="${view.focusAction}"]`);
      if (target && !target.disabled && document.activeElement !== target) target.focus({ preventScroll: true });
    }
    elements.list.scrollTop = view.top;
    elements.list.scrollLeft = view.left;
  }

  function paintCatalogVotes({ reorder = false, preserveView = true } = {}) {
    const view = preserveView ? catalogView() : null;
    const items = new Map([...elements.list.children].map((item) => [item.dataset.catalogScheme, item]));
    rankedSchemes().forEach((scheme, index) => {
      const item = items.get(scheme.id);
      if (!item) return;
      const count = voteCount(scheme.id);
      const voted = state.votes.loaded && state.votes.myVote === scheme.id;
      item.querySelector('.scheme-rank').textContent = `#${String(index + 1).padStart(2, '0')}`;
      item.querySelector('.scheme-rank').setAttribute('aria-label', `第 ${index + 1} 名`);
      item.querySelector('.scheme-vote-count').textContent = count === null ? '— 票' : `${count} 票`;
      const button = item.querySelector('.scheme-vote-button');
      button.textContent = voted ? '已投 · 撤回' : '投一票';
      button.classList.toggle('is-voted', voted);
      button.setAttribute('aria-pressed', String(voted));
      button.setAttribute('aria-label', voted ? `撤回投给${scheme.title}的一票` : `投票给${scheme.title}`);
      button.disabled = state.voteBusy || !state.votes.loaded;
      item.classList.toggle('has-vote', voted);
      if (reorder) elements.list.append(item);
    });
    restoreCatalogView(view);
  }

  function renderVotePanel() {
    const selected = state.schemes.find((scheme) => scheme.id === state.selectedId);
    const voted = Boolean(selected && state.votes.loaded && state.votes.myVote === selected.id);
    elements.voting.hidden = !selected;
    const count = selected ? voteCount(selected.id) : null;
    elements.schemeVotes.textContent = count === null ? '—' : String(count);
    elements.totalVotes.textContent = state.votes.loaded ? String(state.votes.totalVotes) : '—';
    elements.voteButton.textContent = state.voteBusy ? '正在提交…' : voted ? '已投票，撤回' : '投给这个方案';
    elements.voteButton.classList.toggle('is-voted', voted);
    elements.voteButton.setAttribute('aria-pressed', String(voted));
    elements.voteButton.disabled = !selected || !state.votes.loaded || state.voteBusy;
    let status;
    if (state.voteBusy) status = '正在保存你的选择…';
    else if (!state.votes.loaded) status = state.voteReading ? '正在读取票数…' : '票数暂不可用，请重试。';
    else if (state.votes.myVote) {
      const chosen = state.schemes.find((scheme) => scheme.id === state.votes.myVote);
      status = voted ? '你已选择当前方案。' : chosen ? `你已投给「${chosen.title}」，可改投当前方案。` : '你已投给暂未显示的方案，可以改投。';
    } else status = '还没有投票，选一个喜欢的方向。';
    if (elements.voteStatus.textContent !== status) elements.voteStatus.textContent = status;
    elements.voteError.hidden = !state.voteError;
    if (elements.voteErrorText.textContent !== state.voteError) elements.voteErrorText.textContent = state.voteError;
    elements.voteRetry.disabled = state.voteReading || state.voteBusy;
  }

  function readVoteData(data) {
    if (!data || typeof data.counts !== 'object' || data.counts === null || Array.isArray(data.counts)
      || Object.values(data.counts).some((count) => !Number.isSafeInteger(count) || count < 0)
      || !Number.isSafeInteger(data.totalVotes) || data.totalVotes < 0
      || (data.myVote !== null && typeof data.myVote !== 'string')) {
      throw new Error('投票服务返回的票数格式不正确。');
    }
    return { counts: { ...data.counts }, totalVotes: data.totalVotes, myVote: data.myVote, loaded: true };
  }

  function applyVotes(data) {
    const next = readVoteData(data);
    const changed = !state.votes.loaded || state.votes.totalVotes !== next.totalVotes || state.votes.myVote !== next.myVote
      || Object.keys({ ...state.votes.counts, ...next.counts }).some((id) => state.votes.counts[id] !== next.counts[id]);
    const firstLoad = !state.votes.loaded;
    state.votes = next;
    state.voteError = '';
    paintCatalogVotes({ reorder: changed, preserveView: !firstLoad });
    renderVotePanel();
  }

  async function loadVotes() {
    if (document.hidden || state.voteBusy || state.voteReading) return;
    const requestId = ++voteRequest;
    state.voteReading = true;
    renderVotePanel();
    try {
      const data = await requestVotes();
      if (requestId !== voteRequest) return;
      applyVotes(data);
    } catch (error) {
      if (requestId !== voteRequest) return;
      state.voteError = `${state.votes.loaded ? '票数更新失败，显示上次确认的结果。' : '暂时无法读取票数。'}${error.message || '请重试。'}`;
    } finally {
      if (requestId === voteRequest) {
        state.voteReading = false;
        renderVotePanel();
      }
    }
  }

  async function submitVote(schemeId) {
    if (state.voteBusy || !state.votes.loaded || (schemeId !== null && !state.schemes.some((scheme) => scheme.id === schemeId))) return;
    const focus = document.activeElement;
    const view = catalogView();
    const requestId = ++voteRequest;
    state.voteReading = false;
    state.voteBusy = true;
    state.voteError = '';
    paintCatalogVotes();
    renderVotePanel();
    try {
      const data = await requestVotes({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ schemeId }) });
      if (requestId !== voteRequest) return;
      applyVotes(data);
      notify(schemeId === null ? '已撤回投票。' : '投票已记录，可以随时改投。');
    } catch (error) {
      if (requestId !== voteRequest) return;
      state.voteError = `投票未确认：${error.message || '请重试读取票数后再操作。'}`;
    } finally {
      if (requestId === voteRequest) {
        state.voteBusy = false;
        paintCatalogVotes();
        renderVotePanel();
        if (!document.hidden && (document.activeElement === document.body || document.activeElement === focus)) {
          if (view.focusId) restoreCatalogView(view);
          else if (focus === elements.voteButton) elements.voteButton.focus({ preventScroll: true });
        }
      }
    }
  }

  async function loadSchemes({ initial = false } = {}) {
    const requestId = ++loadRequest;
    const refreshButton = byId('refresh-list');
    refreshButton.classList.add('is-refreshing');
    refreshButton.disabled = true;
    try {
      const response = await fetch('./schemes.json', { cache: 'no-store' });
      if (!response.ok) throw new Error('暂时无法读取方案列表，请重新载入。');
      const data = await response.json();
      if (requestId !== loadRequest) return;
      if (!Array.isArray(data.schemes)) throw new Error('方案列表格式不正确，请重新载入。');
      state.schemes = data.schemes;
      elements.globalError.hidden = true;
      elements.count.textContent = String(state.schemes.length);
      const preferred = initial ? [getHashId(), rememberedId(), 'open-field'] : [state.selectedId, getHashId(), 'open-field'];
      const selected = preferred.map((id) => state.schemes.find((scheme) => scheme.id === id)).find(Boolean) || state.schemes[0];
      const selectionChanged = selected?.id !== state.selectedId;
      renderCatalog();
      if (selected) selectScheme(selected.id, { force: initial || selectionChanged });
      else clearPreview();
      loadVotes();
    } catch (error) {
      if (requestId !== loadRequest) return;
      byId('global-error-text').textContent = error.message || '暂时无法读取方案列表，请重新载入。';
      elements.globalError.hidden = false;
      if (!state.schemes.length) elements.list.replaceChildren(node('p', 'catalog-empty', '无法读取方案列表。请重新载入页面。'));
      throw error;
    } finally {
      if (requestId === loadRequest) {
        refreshButton.classList.remove('is-refreshing');
        refreshButton.disabled = false;
      }
    }
  }

  function renderCatalog() {
    const view = catalogView();
    const fragment = document.createDocumentFragment();
    rankedSchemes().forEach((scheme, index) => {
        const item = node('div', 'scheme-item');
        item.dataset.catalogScheme = scheme.id;
        const ranking = node('div', 'scheme-ranking');
        ranking.append(node('span', 'scheme-rank', `#${String(index + 1).padStart(2, '0')}`),
          node('span', `scheme-group-label${scheme.group === 'history' ? ' is-history' : ''}`, scheme.group === 'history' ? '历史' : '主方案'),
          node('span', 'scheme-vote-count', '— 票'));
        const button = node('button', 'scheme-button');
        button.type = 'button';
        button.dataset.schemeId = scheme.id;
        button.dataset.catalogAction = 'select';
        button.setAttribute('aria-label', `预览${scheme.title}${scheme.subtitle ? `，${scheme.subtitle}` : ''}`);
        const thumb = node('span', 'scheme-thumb');
        const graphic = () => node('span', `scheme-graphic graphic-${index % 3}`);
        const thumbnailURL = scheme.thumbnailUrl && safeURL(scheme.thumbnailUrl);
        if (thumbnailURL) {
          const img = document.createElement('img');
          img.src = thumbnailURL;
          img.alt = '';
          img.loading = 'lazy';
          img.addEventListener('error', () => thumb.replaceChildren(graphic()), { once: true });
          thumb.append(img);
        } else thumb.append(graphic());
        const copy = node('span', 'scheme-copy');
        copy.append(node('span', 'scheme-title', scheme.title));
        if (scheme.subtitle) copy.append(node('span', 'scheme-subtitle', scheme.subtitle));
        const meta = node('span', 'scheme-meta');
        const date = formatDate(scheme.date);
        if (date) meta.append(node('span', '', date));
        copy.append(meta);
        const mark = node('span', 'scheme-selected-mark');
        mark.append(checkIcon());
        mark.hidden = scheme.id !== state.selectedId;
        button.append(thumb, copy, mark);
        button.addEventListener('click', () => selectScheme(scheme.id));
        button.classList.toggle('is-selected', scheme.id === state.selectedId);
        if (scheme.id === state.selectedId) button.setAttribute('aria-current', 'true');
        item.append(ranking, button);
        const previewLink = node('a', 'scheme-preview-link', '新标签页预览 ↗');
        const previewURL = safeURL(scheme.previewUrl);
        previewLink.target = '_blank';
        previewLink.rel = 'noopener noreferrer';
        previewLink.dataset.catalogAction = 'preview';
        previewLink.setAttribute('aria-label', `在新标签页预览${scheme.title}`);
        if (previewURL) previewLink.href = previewURL;
        else {
          previewLink.setAttribute('aria-disabled', 'true');
          previewLink.tabIndex = -1;
        }
        item.append(previewLink);
        const voteButton = node('button', 'scheme-vote-button', '投一票');
        voteButton.type = 'button';
        voteButton.dataset.catalogAction = 'vote';
        voteButton.addEventListener('click', () => submitVote(state.votes.myVote === scheme.id ? null : scheme.id));
        item.append(voteButton);
        fragment.append(item);
    });
    if (!state.schemes.length) fragment.append(node('p', 'catalog-empty', '暂时还没有收录方案。'));
    elements.list.replaceChildren(fragment);
    paintCatalogVotes({ preserveView: false });
    restoreCatalogView(view);
  }

  function selectScheme(id, { updateHash = true, force = false } = {}) {
    const scheme = state.schemes.find((item) => item.id === id);
    if (!scheme) return;
    const changed = state.selectedId !== id;
    state.selectedId = id;
    document.title = `${scheme.title} · AH 方案预览`;
    elements.frame.title = `${scheme.title} · 设计方案预览`;
    elements.title.textContent = scheme.title;
    elements.description.textContent = scheme.description || scheme.subtitle || '打开真实页面，体验这个设计方向。';
    elements.group.textContent = scheme.group === 'history' ? '历史版本' : '主方案';
    elements.version.textContent = scheme.version || 'DESIGN EXPLORATION';
    elements.footnote.textContent = `设计探索${scheme.date ? ` · ${formatDate(scheme.date)}` : ''}`;
    const previewURL = safeURL(scheme.previewUrl);
    if (previewURL) {
      elements.open.href = previewURL;
      elements.noticeOpen.href = previewURL;
      elements.open.setAttribute('aria-disabled', 'false');
      const parsed = new URL(previewURL);
      elements.address.textContent = parsed.pathname;
    } else {
      elements.open.removeAttribute('href');
      elements.open.setAttribute('aria-disabled', 'true');
      elements.address.textContent = '预览暂未提供';
    }
    for (const button of elements.list.querySelectorAll('[data-scheme-id]')) {
      const selected = button.dataset.schemeId === id;
      button.classList.toggle('is-selected', selected);
      button.querySelector('.scheme-selected-mark').hidden = !selected;
      if (selected) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    }
    if (updateHash && getHashId() !== id) history.replaceState(null, '', `#${encodeURIComponent(id)}`);
    try { localStorage.setItem('ah-public-preview-selected', id); } catch { /* Optional preference storage. */ }
    renderVotePanel();
    if (changed || force) loadPreview(previewURL);
  }

  function showPreviewNotice(message) {
    elements.noticeText.textContent = message;
    elements.notice.hidden = false;
  }

  function loadPreview(url) {
    clearTimeout(state.loadingTimer);
    elements.notice.hidden = true;
    elements.loading.hidden = false;
    elements.placeholder.hidden = true;
    elements.frame.hidden = false;
    if (!url) {
      elements.loading.hidden = true;
      elements.frame.hidden = true;
      elements.placeholder.hidden = false;
      showPreviewNotice('此方案还没有可用的预览地址。');
      elements.noticeOpen.hidden = true;
      return;
    }
    elements.noticeOpen.hidden = false;
    elements.frame.onload = () => {
      clearTimeout(state.loadingTimer);
      elements.loading.hidden = true;
      elements.notice.hidden = true;
    };
    elements.frame.onerror = () => {
      clearTimeout(state.loadingTimer);
      elements.loading.hidden = true;
      showPreviewNotice('预览加载失败。可以重新载入，或在新标签中打开页面。');
    };
    elements.frame.src = url;
    state.loadingTimer = setTimeout(() => {
      elements.loading.hidden = true;
      showPreviewNotice('页面加载时间较长；如果下方未显示内容，请尝试独立预览。');
    }, 15000);
  }

  function clearPreview() {
    state.selectedId = null;
    clearTimeout(state.loadingTimer);
    elements.frame.removeAttribute('src');
    elements.frame.hidden = true;
    elements.placeholder.hidden = false;
    elements.loading.hidden = true;
    elements.notice.hidden = true;
    elements.open.removeAttribute('href');
    elements.open.setAttribute('aria-disabled', 'true');
    elements.title.textContent = '选择一个设计方向';
    elements.description.textContent = '暂时还没有收录方案。';
    elements.group.textContent = '方案预览';
    elements.version.textContent = 'DESIGN EXPLORATION';
    elements.address.textContent = '选择方案以开始预览';
    elements.footnote.textContent = '设计探索 · 切换方案，发现不同方向';
    document.title = 'AH · 方案预览';
    renderCatalog();
    renderVotePanel();
  }

  function setDevice(device) {
    state.device = device;
    elements.stage.classList.toggle('is-mobile', device === 'mobile');
    for (const value of ['desktop', 'mobile']) {
      const button = byId(`device-${value}`);
      button.classList.toggle('is-active', value === device);
      button.setAttribute('aria-pressed', String(value === device));
    }
  }

  byId('vote-entry').addEventListener('click', (event) => {
    event.preventDefault();
    if (elements.voting.hidden) { notify('请先选择一个方案。'); return; }
    elements.voting.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
    elements.voting.focus({ preventScroll: true });
  });
  elements.voteButton.addEventListener('click', () => {
    if (state.selectedId) submitVote(state.votes.myVote === state.selectedId ? null : state.selectedId);
  });
  elements.voteRetry.addEventListener('click', loadVotes);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) loadVotes(); });
  const votePoll = setInterval(() => { if (!document.hidden) loadVotes(); }, 15000);
  window.addEventListener('pagehide', (event) => { if (!event.persisted) clearInterval(votePoll); });
  byId('device-desktop').addEventListener('click', () => setDevice('desktop'));
  byId('device-mobile').addEventListener('click', () => setDevice('mobile'));
  byId('reload-preview').addEventListener('click', () => {
    const scheme = state.schemes.find((item) => item.id === state.selectedId);
    const previewURL = scheme && safeURL(scheme.previewUrl);
    if (previewURL) {
      const url = new URL(previewURL);
      url.searchParams.set('_previewReload', String(Date.now()));
      loadPreview(url.href);
    }
  });
  byId('refresh-list').addEventListener('click', () => { loadSchemes().then(() => notify('方案列表已更新。')).catch(() => {}); });
  byId('retry-load').addEventListener('click', () => { loadSchemes({ initial: !state.selectedId }).catch(() => {}); });
  window.addEventListener('hashchange', () => {
    const id = getHashId();
    if (state.schemes.some((scheme) => scheme.id === id)) selectScheme(id, { updateHash: false });
  });
  loadSchemes({ initial: true }).catch(() => {});
})();
