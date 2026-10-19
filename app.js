'use strict';

(() => {
  const byId = (id) => document.getElementById(id);
  const state = { schemes: [], selectedId: null, device: 'desktop', loadingTimer: null,
    votes: { counts: {}, totalVotes: null, myVote: null, loaded: false }, voteReading: false, voteBusy: false, voteError: '', archived: readArchives(), archivePreview: null };
  const elements = {
    list: byId('scheme-list'), count: byId('scheme-count'), title: byId('preview-title'),
    description: byId('preview-description'), group: byId('preview-group'), version: byId('preview-version'),
    frame: byId('preview-frame'), placeholder: byId('preview-placeholder'), loading: byId('preview-loading'),
    stage: byId('preview-stage'), address: byId('preview-address'), open: byId('open-preview'),
    notice: byId('preview-notice'), noticeText: byId('preview-notice-text'), noticeOpen: byId('notice-open'),
    footnote: byId('preview-footnote'), globalError: byId('global-error'), toast: byId('toast'),
    archiveCount: byId('archive-count'), archiveState: byId('preview-archive-state'), archivesDialog: byId('archives-dialog'), archivesList: byId('archives-list'), inlineVoteCount: byId('inline-vote-count'), schemeVotes: byId('scheme-vote-count'), totalVotes: byId('total-vote-count'),
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

  const ARCHIVE_KEY = 'ah-public-archives';
  const groupId = (scheme) => scheme.group === 'history' ? 'history' : 'main';

  function readArchives() {
    try {
      const value = JSON.parse(localStorage.getItem('ah-public-archives') || '[]');
      return new Set(Array.isArray(value) ? value.filter((id) => typeof id === 'string') : []);
    } catch { return new Set(); }
  }

  function visibleSchemes() { return state.schemes.filter((scheme) => !state.archived.has(scheme.id)); }

  function rankedSchemes(group, { includeArchived = false } = {}) {
    return state.schemes.map((scheme, index) => ({ scheme, index }))
      .filter(({ scheme }) => (!group || groupId(scheme) === group) && (includeArchived || !state.archived.has(scheme.id)))
      .sort((a, b) => (groupId(a.scheme) === 'history') - (groupId(b.scheme) === 'history')
        || (voteCount(b.scheme.id) || 0) - (voteCount(a.scheme.id) || 0) || a.index - b.index)
      .map(({ scheme }) => scheme);
  }

  function actionIcon(kind) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('fill', 'none'); svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', { vote: 'm8 11 3 3 6-6M5 4h14v16H5z', preview: 'M14 4h6v6M20 4 10 14M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5', archive: 'M4 8h16v12H4zM3 4h18v4H3zM9 12h6' }[kind]);
    svg.append(path); return svg;
  }

  function saveArchives(next) {
    try { localStorage.setItem(ARCHIVE_KEY, JSON.stringify([...next])); }
    catch { notify('归档未保存，请允许浏览器保存本站数据后重试。'); return false; }
    state.archived = next; return true;
  }

  function updateArchiveCount() {
    elements.archiveCount.textContent = String(state.schemes.filter((scheme) => state.archived.has(scheme.id)).length);
  }

  function archiveScheme(id) {
    if (state.archived.has(id)) return;
    const before = rankedSchemes(); const index = before.findIndex((scheme) => scheme.id === id);
    if (!saveArchives(new Set([...state.archived, id]))) return;
    const next = before.slice(index + 1).concat(before.slice(0, index)).find((scheme) => !state.archived.has(scheme.id));
    if (state.archivePreview === id) state.archivePreview = null;
    renderCatalog();
    if (state.selectedId === id) { if (next) selectScheme(next.id); else clearPreview(); }
    updateArchiveCount(); if (elements.archivesDialog.open) renderArchives();
    notify('已归档到当前浏览器，可在「已归档」中恢复。其他人的列表不受影响。');
  }

  function restoreScheme(id) {
    const next = new Set(state.archived); next.delete(id);
    if (!saveArchives(next)) return;
    if (state.archivePreview === id) state.archivePreview = null;
    renderCatalog(); if (!state.selectedId || state.selectedId === id) selectScheme(id);
    updateArchiveCount(); renderArchives(); notify('已恢复到方案列表。');
  }

  function renderArchives() {
    const fragment = document.createDocumentFragment();
    const schemes = rankedSchemes(undefined, { includeArchived: true }).filter((scheme) => state.archived.has(scheme.id));
    for (const scheme of schemes) {
      const item = node('div', 'archives-item'); const copy = node('div', 'archives-item-copy');
      copy.append(node('strong', '', scheme.title), node('span', '', scheme.group === 'history' ? '历史版本' : '主方案'));
      const preview = node('button', 'button archive-preview', '预览'); preview.type = 'button';
      preview.setAttribute('aria-label', `预览已归档方案${scheme.title}`);
      preview.addEventListener('click', () => { elements.archivesDialog.close(); selectScheme(scheme.id, { allowArchived: true }); });
      const restore = node('button', 'button restore-button', '恢复'); restore.type = 'button';
      restore.setAttribute('aria-label', `恢复${scheme.title}到方案列表`); restore.addEventListener('click', () => restoreScheme(scheme.id));
      item.append(copy, preview, restore); fragment.append(item);
    }
    if (!schemes.length) fragment.append(node('p', 'catalog-empty', '还没有归档方案。'));
    elements.archivesList.replaceChildren(fragment);
  }

  function openArchives() { renderArchives(); if (!elements.archivesDialog.open) elements.archivesDialog.showModal(); }

  function catalogView() {
    const active = document.activeElement;
    return { top: elements.list.scrollTop, left: elements.list.scrollLeft,
      focusId: elements.list.contains(active) ? active.closest('.scheme-item')?.dataset.catalogScheme : null,
      focusAction: elements.list.contains(active) ? active.dataset.catalogAction : null };
  }

  function restoreCatalogView(view) {
    if (!view) return;
    if (view.focusId && view.focusAction) {
      const item = [...elements.list.querySelectorAll('.scheme-item')].find((entry) => entry.dataset.catalogScheme === view.focusId);
      const target = item?.querySelector(`[data-catalog-action="${view.focusAction}"]`);
      if (target && !target.disabled && document.activeElement !== target) target.focus({ preventScroll: true });
    }
    elements.list.scrollTop = view.top;
    elements.list.scrollLeft = view.left;
  }

  function paintCatalogVotes({ reorder = false, preserveView = true } = {}) {
    const view = preserveView ? catalogView() : null;
    const items = new Map([...elements.list.querySelectorAll('.scheme-item')].map((item) => [item.dataset.catalogScheme, item]));
    for (const group of ['main', 'history']) rankedSchemes(group).forEach((scheme, index) => {
      const item = items.get(scheme.id);
      if (!item) return;
      const count = voteCount(scheme.id);
      const voted = state.votes.loaded && state.votes.myVote === scheme.id;
      item.querySelector('.scheme-vote-count').textContent = count === null ? '—' : String(count);
      const button = item.querySelector('.scheme-vote-button');
      button.title = `${voted ? '已投票，点击撤回' : '投给这个方案'} · ${count === null ? '票数读取中' : count + ' 票'}`;
      button.classList.toggle('is-voted', voted);
      button.setAttribute('aria-pressed', String(voted));
      button.setAttribute('aria-label', voted ? `撤回投给${scheme.title}的一票` : `投票给${scheme.title}`);
      button.disabled = state.voteBusy || !state.votes.loaded;
      item.classList.toggle('has-vote', voted);
      if (reorder) elements.list.querySelector(`[data-scheme-group="${group}"] .scheme-group-items`)?.append(item);
    });
    restoreCatalogView(view);
  }

  function renderVotePanel() {
    const selected = state.schemes.find((scheme) => scheme.id === state.selectedId);
    const voted = Boolean(selected && state.votes.loaded && state.votes.myVote === selected.id);
    elements.voteButton.hidden = !selected;
    const count = selected ? voteCount(selected.id) : null;
    elements.schemeVotes.textContent = count === null ? '—' : String(count);
    elements.totalVotes.textContent = state.votes.loaded ? String(state.votes.totalVotes) : '—';
    elements.inlineVoteCount.textContent = count === null ? '—' : String(count);
    elements.voteButton.querySelector('.title-vote-label').textContent = state.voteBusy ? '保存中' : voted ? '已投' : '投票';
    const voteLabel = `${state.voteBusy ? '正在提交投票' : voted ? '已投票，点击撤回' : '投给这个方案'} · ${count === null ? '票数读取中' : count + ' 票'}`;
    elements.voteButton.title = voteLabel;
    elements.voteButton.setAttribute('aria-label', voteLabel);
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
      const selected = preferred.map((id) => state.schemes.find((scheme) => scheme.id === id && (!state.archived.has(id) || state.archivePreview === id))).find(Boolean) || rankedSchemes()[0];
      const selectionChanged = selected?.id !== state.selectedId;
      renderCatalog();
      updateArchiveCount();
      if (elements.archivesDialog.open) renderArchives();
      if (selected) selectScheme(selected.id, { force: initial || selectionChanged, allowArchived: state.archivePreview === selected.id });
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
    const view = catalogView(); const fragment = document.createDocumentFragment();
    for (const groupId of ['main', 'history']) {
      const schemes = rankedSchemes(groupId);
      const group = node('section', 'scheme-group'); group.dataset.schemeGroup = groupId;
      group.setAttribute('aria-label', groupId === 'history' ? '历史版本' : '主方案');
      const heading = node('div', 'group-heading');
      heading.append(node('span', '', groupId === 'history' ? '历史版本' : '主方案'), node('span', '', String(schemes.length)));
      const items = node('div', 'scheme-group-items');
      schemes.forEach((scheme, index) => {
        const item = node('div', 'scheme-item'); item.dataset.catalogScheme = scheme.id;
        const actions = node('div', 'scheme-card-actions');
        const previewLink = node('a', 'scheme-preview-link'); previewLink.append(actionIcon('preview'));
        const previewURL = safeURL(scheme.previewUrl); previewLink.target = '_blank'; previewLink.rel = 'noopener noreferrer';
        previewLink.dataset.catalogAction = 'preview'; previewLink.title = '在新标签中打开'; previewLink.setAttribute('aria-label', `在新标签页预览${scheme.title}`);
        if (previewURL) previewLink.href = previewURL; else { previewLink.setAttribute('aria-disabled', 'true'); previewLink.tabIndex = -1; }
        const voteButton = node('button', 'scheme-vote-button'); voteButton.type = 'button'; voteButton.dataset.catalogAction = 'vote';
        voteButton.append(actionIcon('vote'), node('span', 'scheme-vote-count', '—'));
        voteButton.addEventListener('click', () => submitVote(state.votes.myVote === scheme.id ? null : scheme.id));
        const archiveButton = node('button', 'scheme-archive-button'); archiveButton.type = 'button'; archiveButton.dataset.catalogAction = 'archive';
        archiveButton.title = '归档到当前浏览器'; archiveButton.setAttribute('aria-label', `将${scheme.title}归档到当前浏览器`);
        archiveButton.append(actionIcon('archive')); archiveButton.addEventListener('click', () => archiveScheme(scheme.id));
        actions.append(previewLink, voteButton, archiveButton);
        const button = node('button', 'scheme-button'); button.type = 'button'; button.dataset.schemeId = scheme.id; button.dataset.catalogAction = 'select';
        button.setAttribute('aria-label', `预览${scheme.title}${scheme.subtitle ? `，${scheme.subtitle}` : ''}`);
        const thumb = node('span', 'scheme-thumb'); const graphic = () => node('span', `scheme-graphic graphic-${index % 3}`);
        const thumbnailURL = scheme.thumbnailUrl && safeURL(scheme.thumbnailUrl);
        if (thumbnailURL) { const img = document.createElement('img'); img.src = thumbnailURL; img.alt = ''; img.loading = 'lazy'; img.addEventListener('error', () => thumb.replaceChildren(graphic()), { once: true }); thumb.append(img); } else thumb.append(graphic());
        const copy = node('span', 'scheme-copy'); copy.append(node('span', 'scheme-title', scheme.title));
        if (scheme.subtitle) copy.append(node('span', 'scheme-subtitle', scheme.subtitle));
        const meta = node('span', 'scheme-meta'); const date = formatDate(scheme.date); if (date) meta.append(node('span', '', date)); copy.append(meta);
        const mark = node('span', 'scheme-selected-mark'); mark.append(checkIcon()); mark.hidden = scheme.id !== state.selectedId;
        button.append(thumb, copy, mark); button.addEventListener('click', () => selectScheme(scheme.id)); button.classList.toggle('is-selected', scheme.id === state.selectedId);
        if (scheme.id === state.selectedId) button.setAttribute('aria-current', 'true');
        item.append(button, actions); items.append(item);
      });
      if (!schemes.length) items.append(node('p', 'group-empty', groupId === 'history' ? '暂无历史版本' : '暂无主方案'));
      group.append(heading, items); fragment.append(group);
    }
    if (!visibleSchemes().length) {
      const empty = node('div', 'catalog-empty'); empty.append(node('p', '', state.schemes.length ? '方案已全部归档到当前浏览器。' : '暂时还没有收录方案。'));
      if (state.schemes.length) { const open = node('button', 'button button-secondary', '查看已归档方案'); open.type = 'button'; open.addEventListener('click', openArchives); empty.append(open); }
      fragment.append(empty);
    }
    elements.list.replaceChildren(fragment); paintCatalogVotes({ preserveView: false }); restoreCatalogView(view);
  }

  function selectScheme(id, { updateHash = true, force = false, allowArchived = false } = {}) {
    const scheme = state.schemes.find((item) => item.id === id);
    if (!scheme || (state.archived.has(id) && !allowArchived)) return;
    state.archivePreview = state.archived.has(id) ? id : null;
    const changed = state.selectedId !== id;
    state.selectedId = id;
    document.title = `${scheme.title} · AH 方案预览`;
    elements.frame.title = `${scheme.title} · 设计方案预览`;
    elements.title.textContent = scheme.title;
    elements.archiveState.hidden = !state.archived.has(id);
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
    state.archivePreview = null;
    elements.archiveState.hidden = true;
    if (getHashId()) history.replaceState(null, '', location.pathname + location.search);
    try { localStorage.removeItem('ah-public-preview-selected'); } catch { /* Optional preference storage. */ }
    clearTimeout(state.loadingTimer);
    elements.frame.removeAttribute('src');
    elements.frame.hidden = true;
    elements.placeholder.hidden = false;
    elements.loading.hidden = true;
    elements.notice.hidden = true;
    elements.open.removeAttribute('href');
    elements.open.setAttribute('aria-disabled', 'true');
    elements.title.textContent = '选择一个设计方向';
    elements.description.textContent = state.schemes.length ? '方案已全部归档。打开页头「已归档」可继续预览或恢复。' : '暂时还没有收录方案。';
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

  byId('open-archives').addEventListener('click', openArchives);
  byId('close-archives').addEventListener('click', () => elements.archivesDialog.close());
  window.addEventListener('storage', (event) => {
    if (event.key !== ARCHIVE_KEY) return;
    state.archived = readArchives(); updateArchiveCount(); renderCatalog();
    if (state.selectedId && state.archived.has(state.selectedId) && state.archivePreview !== state.selectedId) {
      const next = rankedSchemes()[0]; if (next) selectScheme(next.id); else clearPreview();
    } else if (state.selectedId) selectScheme(state.selectedId, { allowArchived: true });
    if (elements.archivesDialog.open) renderArchives();
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
    if (state.schemes.some((scheme) => scheme.id === id)) selectScheme(id, { updateHash: false, allowArchived: state.archived.has(id) });
  });
  loadSchemes({ initial: true }).catch(() => {});
})();
