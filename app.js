'use strict';

(() => {
  const byId = (id) => document.getElementById(id);
  const state = { schemes: [], selectedId: null, device: 'desktop', loadingTimer: null };
  const elements = {
    list: byId('scheme-list'), count: byId('scheme-count'), title: byId('preview-title'),
    description: byId('preview-description'), group: byId('preview-group'), version: byId('preview-version'),
    frame: byId('preview-frame'), placeholder: byId('preview-placeholder'), loading: byId('preview-loading'),
    stage: byId('preview-stage'), address: byId('preview-address'), open: byId('open-preview'),
    notice: byId('preview-notice'), noticeText: byId('preview-notice-text'), noticeOpen: byId('notice-open'),
    footnote: byId('preview-footnote'), globalError: byId('global-error'), toast: byId('toast')
  };
  let toastTimer;
  let loadRequest = 0;

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
    const fragment = document.createDocumentFragment();
    for (const [group, label] of [['current', '主方案'], ['history', '历史版本']]) {
      const schemes = state.schemes.filter((scheme) => (scheme.group === 'history' ? 'history' : 'current') === group);
      if (!schemes.length) continue;
      const section = node('div', 'scheme-group');
      const heading = node('div', 'group-heading');
      heading.append(node('span', '', label), node('span', '', String(schemes.length).padStart(2, '0')));
      section.append(heading);
      schemes.forEach((scheme, index) => {
        const item = node('div', 'scheme-item');
        const button = node('button', 'scheme-button');
        button.type = 'button';
        button.dataset.schemeId = scheme.id;
        button.setAttribute('aria-label', `预览${scheme.title}${scheme.subtitle ? `，${scheme.subtitle}` : ''}`);
        const thumb = node('span', 'scheme-thumb');
        const graphic = () => node('span', `scheme-graphic graphic-${index % 3}`);
        const thumbnailURL = safeURL(scheme.thumbnailUrl);
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
        const date = formatDate(scheme.date);
        if (date) copy.append(node('span', 'scheme-meta', date));
        const mark = node('span', 'scheme-selected-mark');
        mark.append(checkIcon());
        mark.hidden = scheme.id !== state.selectedId;
        button.append(thumb, copy, mark);
        button.addEventListener('click', () => selectScheme(scheme.id));
        button.classList.toggle('is-selected', scheme.id === state.selectedId);
        if (scheme.id === state.selectedId) button.setAttribute('aria-current', 'true');
        item.append(button);
        section.append(item);
      });
      fragment.append(section);
    }
    if (!state.schemes.length) fragment.append(node('p', 'catalog-empty', '暂时还没有收录方案。'));
    elements.list.replaceChildren(fragment);
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
