(() => {
  const STORAGE_KEY = 'sharepoint-card-editor-state';
  const CATEGORY_STORAGE_KEY = 'sharepoint-category-editor-state';
  const DEFAULT_CATEGORIES = [
    { id: 'home', label: 'ホーム', icon: '⌂' },
    { id: 'central', label: '中央', icon: '⌘' },
    { id: 'water', label: '水処理', icon: '≋' },
    { id: 'maintenance', label: '保守', icon: '⚙' },
    { id: 'electrical', label: '電気', icon: 'ϟ' }
  ];
  const TONES = ['blue', 'green', 'purple', 'yellow', 'red'];

  const elements = {
    fileInput: document.getElementById('file-input'),
    importButton: document.getElementById('import-button'),
    exportButton: document.getElementById('export-button'),
    exportCategoriesButton: document.getElementById('export-categories-button'),
    addButton: document.getElementById('add-button'),
    resetButton: document.getElementById('reset-button'),
    categoryFilter: document.getElementById('category-filter'),
    searchInput: document.getElementById('search-input'),
    notification: document.getElementById('editor-notification'),
    form: document.getElementById('card-form'),
    id: document.getElementById('card-id'),
    category: document.getElementById('card-category'),
    title: document.getElementById('card-title'),
    description: document.getElementById('card-description'),
    url: document.getElementById('card-url'),
    icon: document.getElementById('card-icon'),
    tone: document.getElementById('card-tone'),
    cancelButton: document.getElementById('cancel-button'),
    deleteButton: document.getElementById('delete-button'),
    cardList: document.getElementById('card-list'),
    cardCount: document.getElementById('card-count'),
    preview: document.getElementById('json-preview'),
    addCategoryButton: document.getElementById('add-category-button'),
    categoryList: document.getElementById('category-list')
  };

  const state = {
    data: { version: 1, cards: [] },
    initialData: { version: 1, cards: [] },
    categories: [],
    initialCategories: [],
    selectedId: '',
    filterCategory: 'all',
    search: '',
    dragId: ''
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function categoryLabel(id) {
    const category = state.categories.find((item) => item.id === id);
    return category ? category.label : id;
  }

  function categoryMeta() {
    const meta = {};
    state.categories.forEach((category) => {
      meta[category.id] = category.label;
    });
    return meta;
  }

  function setNotification(message, type = 'success') {
    elements.notification.textContent = message;
    elements.notification.className = 'notification is-visible';
    elements.notification.classList.add(type === 'error' ? 'is-error' : 'is-success');
  }

  function clearNotification() {
    elements.notification.textContent = '';
    elements.notification.className = 'notification';
  }

  function populateSelect(select, options, includeAll = false) {
    select.replaceChildren();
    if (includeAll) {
      const option = document.createElement('option');
      option.value = 'all';
      option.textContent = 'すべて';
      select.appendChild(option);
    }
    Object.entries(options).forEach(([value, label]) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      select.appendChild(option);
    });
  }

  function populateToneSelect() {
    elements.tone.replaceChildren();
    TONES.forEach((tone) => {
      const option = document.createElement('option');
      option.value = tone;
      option.textContent = tone;
      elements.tone.appendChild(option);
    });
  }

  function normalizeCard(card) {
    return {
      id: String(card.id || '').trim(),
      category: String(card.category || '').trim(),
      title: String(card.title || '').trim(),
      description: String(card.description || '').trim(),
      url: String(card.url || '').trim() || '#',
      icon: String(card.icon || '').trim(),
      tone: String(card.tone || '').trim()
    };
  }

  function validateUrl(value) {
    if (!value || value === '#') {
      return true;
    }
    try {
      const url = new URL(value, window.location.href);
      return ['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol) || !value.includes(':');
    } catch (_error) {
      return false;
    }
  }

  function validatePayload(payload) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new Error('JSON全体はオブジェクト形式である必要があります。');
    }
    if (payload.version !== 1) {
      throw new Error('version は 1 である必要があります。');
    }
    if (!Array.isArray(payload.cards)) {
      throw new Error('cards は配列である必要があります。');
    }

    const ids = new Set();
    const cards = payload.cards.map((rawCard, index) => {
      if (!rawCard || typeof rawCard !== 'object' || Array.isArray(rawCard)) {
        throw new Error(`cards[${index}] はオブジェクトである必要があります。`);
      }

      const card = normalizeCard(rawCard);
      if (!card.id) {
        throw new Error(`cards[${index}] の id は必須です。`);
      }
      if (ids.has(card.id)) {
        throw new Error(`id '${card.id}' が重複しています。`);
      }
      ids.add(card.id);

      if (!categoryMeta()[card.category]) {
        throw new Error(`cards[${index}] の category が不正です。`);
      }
      if (!card.title) {
        throw new Error(`cards[${index}] の title は必須です。`);
      }
      if (!card.description) {
        throw new Error(`cards[${index}] の description は必須です。`);
      }
      if (!card.icon) {
        throw new Error(`cards[${index}] の icon は必須です。`);
      }
      if (!TONES.includes(card.tone)) {
        throw new Error(`cards[${index}] の tone が不正です。`);
      }
      if (!validateUrl(card.url)) {
        throw new Error(`cards[${index}] の url が不正です。`);
      }
      return card;
    });

    return { version: 1, cards };
  }

  function makePayload() {
    return validatePayload({ version: 1, cards: state.data.cards });
  }

  function saveDraft() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
  }

  function validateCategories(list) {
    if (!Array.isArray(list) || list.length === 0) {
      throw new Error('カテゴリは1件以上の配列である必要があります。');
    }
    const ids = new Set();
    return list.map((raw, index) => {
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        throw new Error(`categories[${index}] はオブジェクトである必要があります。`);
      }
      const category = {
        id: String(raw.id || '').trim(),
        label: String(raw.label || '').trim(),
        icon: String(raw.icon || '').trim() || '▪'
      };
      if (!category.id) {
        throw new Error(`categories[${index}] の id は必須です。`);
      }
      if (!category.label) {
        throw new Error(`categories[${index}] の label は必須です。`);
      }
      if (ids.has(category.id)) {
        throw new Error(`カテゴリ id '${category.id}' が重複しています。`);
      }
      ids.add(category.id);
      return category;
    });
  }

  function generateCategoryId(labelValue) {
    const base = (labelValue || 'category')
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/[\s_-]+/g, '-') || 'category';
    let candidate = base;
    let counter = 1;
    const ids = new Set(state.categories.map((category) => category.id));
    while (ids.has(candidate) || !candidate) {
      counter += 1;
      candidate = `${base}-${counter}`;
    }
    return candidate;
  }

  function saveCategoryDraft() {
    localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(state.categories));
  }

  function refreshCategorySelects() {
    const meta = categoryMeta();
    const previousFilter = elements.categoryFilter.value;
    const previousCategory = elements.category.value;
    populateSelect(elements.categoryFilter, meta, true);
    populateSelect(elements.category, meta);
    if (meta[previousFilter] || previousFilter === 'all') {
      elements.categoryFilter.value = previousFilter;
    }
    if (meta[previousCategory]) {
      elements.category.value = previousCategory;
    }
  }

  function renderCategoryList() {
    elements.categoryList.replaceChildren();
    state.categories.forEach((category, index) => {
      const item = document.createElement('li');
      item.className = 'category-item';

      const iconInput = document.createElement('input');
      iconInput.type = 'text';
      iconInput.maxLength = 4;
      iconInput.className = 'category-icon-input';
      iconInput.value = category.icon;
      iconInput.setAttribute('aria-label', `${category.label} のアイコン`);
      iconInput.addEventListener('change', () => {
        updateCategory(category.id, { icon: iconInput.value.trim() || '▪' });
      });

      const labelInput = document.createElement('input');
      labelInput.type = 'text';
      labelInput.className = 'category-label-input';
      labelInput.value = category.label;
      labelInput.setAttribute('aria-label', `${category.label} の表示名`);
      labelInput.addEventListener('change', () => {
        updateCategory(category.id, { label: labelInput.value.trim() || category.label });
      });

      const idBadge = document.createElement('span');
      idBadge.className = 'category-id-badge';
      idBadge.textContent = category.id;

      const controls = document.createElement('div');
      controls.className = 'category-item__controls';

      const upButton = document.createElement('button');
      upButton.type = 'button';
      upButton.textContent = '↑';
      upButton.disabled = index === 0;
      upButton.addEventListener('click', () => moveCategory(category.id, -1));

      const downButton = document.createElement('button');
      downButton.type = 'button';
      downButton.textContent = '↓';
      downButton.disabled = index === state.categories.length - 1;
      downButton.addEventListener('click', () => moveCategory(category.id, 1));

      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.className = 'danger';
      deleteButton.textContent = '削除';
      deleteButton.addEventListener('click', () => deleteCategory(category.id));

      controls.append(upButton, downButton, deleteButton);
      item.append(iconInput, labelInput, idBadge, controls);
      elements.categoryList.appendChild(item);
    });
  }

  function setCategories(list, notificationMessage, options = {}) {
    const { persist = true } = options;
    state.categories = validateCategories(clone(list));
    if (persist) {
      saveCategoryDraft();
    }
    refreshCategorySelects();
    renderCategoryList();
    renderList();
    updatePreview();
    if (notificationMessage) {
      setNotification(notificationMessage);
    }
  }

  function updateCategory(id, changes) {
    const categories = state.categories.map((category) => (
      category.id === id ? { ...category, ...changes } : category
    ));
    try {
      setCategories(categories, 'カテゴリを更新しました。');
    } catch (error) {
      setNotification(`更新に失敗しました: ${error.message}`, 'error');
      renderCategoryList();
    }
  }

  function moveCategory(id, direction) {
    const categories = [...state.categories];
    const index = categories.findIndex((category) => category.id === id);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= categories.length) {
      return;
    }
    [categories[index], categories[nextIndex]] = [categories[nextIndex], categories[index]];
    setCategories(categories, 'カテゴリの表示順を変更しました。');
  }

  function handleAddCategory() {
    clearNotification();
    const label = window.prompt('新しいカテゴリの表示名を入力してください（例: 環境管理）');
    if (label === null) {
      return;
    }
    const trimmedLabel = label.trim();
    if (!trimmedLabel) {
      setNotification('カテゴリ名を入力してください。', 'error');
      return;
    }
    const newCategory = {
      id: generateCategoryId(trimmedLabel),
      label: trimmedLabel,
      icon: '▪'
    };
    setCategories([...state.categories, newCategory], `カテゴリ「${trimmedLabel}」を追加しました。`);
  }

  function deleteCategory(id) {
    const category = state.categories.find((item) => item.id === id);
    if (!category) {
      return;
    }
    const usedByCards = state.data.cards.some((card) => card.category === id);
    if (usedByCards) {
      setNotification(`「${category.label}」を使用しているカードがあるため削除できません。先にカードのカテゴリを変更するか削除してください。`, 'error');
      return;
    }
    if (state.categories.length <= 1) {
      setNotification('カテゴリは最低1件必要です。', 'error');
      return;
    }
    if (!window.confirm(`カテゴリ「${category.label}」を削除しますか？`)) {
      return;
    }
    const categories = state.categories.filter((item) => item.id !== id);
    setCategories(categories, `カテゴリ「${category.label}」を削除しました。`);
  }

  function extractPortalCategoriesPayload(text) {
    const match = text.match(/window\.PORTAL_CATEGORIES\s*=\s*(\[[\s\S]*?\])\s*;?\s*$/);
    if (!match) {
      throw new Error('window.PORTAL_CATEGORIES = [...]; の形式が見つかりません。');
    }
    return JSON.parse(match[1]);
  }

  function handleExportCategories() {
    clearNotification();
    try {
      const categories = validateCategories(state.categories);
      const content = `window.PORTAL_CATEGORIES = ${JSON.stringify(categories, null, 2)};\n`;
      const blob = new Blob([content], {
        type: 'application/javascript;charset=utf-8'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'categories.js';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setNotification('categories.js をエクスポートしました。data/categories.js を置き換えてください。');
    } catch (error) {
      setNotification(`エクスポートできません: ${error.message}`, 'error');
    }
  }

  async function loadInitialCategories() {
    try {
      const source = (window.PORTAL_CATEGORIES && Array.isArray(window.PORTAL_CATEGORIES) && window.PORTAL_CATEGORIES.length)
        ? window.PORTAL_CATEGORIES
        : DEFAULT_CATEGORIES;
      const categories = validateCategories(clone(source));
      state.initialCategories = clone(categories);

      const draft = localStorage.getItem(CATEGORY_STORAGE_KEY);
      if (draft) {
        try {
          setCategories(JSON.parse(draft), '保存済みのカテゴリ設定を復元しました。');
          return;
        } catch (_error) {
          localStorage.removeItem(CATEGORY_STORAGE_KEY);
        }
      }
      setCategories(categories, '', { persist: false });
    } catch (error) {
      setNotification(`カテゴリの読み込みに失敗しました: ${error.message}`, 'error');
      setCategories(DEFAULT_CATEGORIES, '', { persist: false });
    }
  }

  function updatePreview() {
    try {
      const validPayload = makePayload();
      elements.preview.textContent = JSON.stringify(validPayload, null, 2);
    } catch (error) {
      elements.preview.textContent = `JSONエラー: ${error.message}`;
    }
  }

  function filteredCards() {
    const keyword = state.search.trim().toLowerCase();
    return state.data.cards.filter((card) => {
      if (state.filterCategory !== 'all' && card.category !== state.filterCategory) {
        return false;
      }
      if (!keyword) {
        return true;
      }
      return [card.title, card.description]
        .some((value) => value.toLowerCase().includes(keyword));
    });
  }

  function fillForm(card) {
    elements.id.value = card?.id || '';
    elements.category.value = card?.category || (state.categories[0] ? state.categories[0].id : '');
    elements.title.value = card?.title || '';
    elements.description.value = card?.description || '';
    elements.url.value = card?.url === '#' ? '' : (card?.url || '');
    elements.icon.value = card?.icon || '';
    elements.tone.value = card?.tone || 'blue';
    elements.deleteButton.disabled = !card;
  }

  function selectCard(id) {
    state.selectedId = id;
    const card = state.data.cards.find((item) => item.id === id);
    fillForm(card || null);
    renderList();
  }

  function generateId(titleValue) {
    const base = (titleValue || 'new-card')
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/[\s_-]+/g, '-') || 'card';
    let candidate = base;
    let counter = 1;
    const ids = new Set(state.data.cards.map((card) => card.id));
    while (ids.has(candidate)) {
      counter += 1;
      candidate = `${base}-${counter}`;
    }
    return candidate;
  }

  function reorderCards(sourceId, targetId) {
    if (!sourceId || !targetId || sourceId === targetId) {
      return;
    }
    const cards = [...state.data.cards];
    const sourceIndex = cards.findIndex((card) => card.id === sourceId);
    const targetIndex = cards.findIndex((card) => card.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0) {
      return;
    }
    const [moved] = cards.splice(sourceIndex, 1);
    const updatedTargetIndex = cards.findIndex((card) => card.id === targetId);
    cards.splice(updatedTargetIndex < 0 ? cards.length : updatedTargetIndex, 0, moved);
    state.data.cards = cards;
    saveDraft();
    updatePreview();
    renderList();
    setNotification('カードの表示順を変更しました。');
  }

  function moveCard(id, direction) {
    const cards = [...state.data.cards];
    const index = cards.findIndex((card) => card.id === id);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= cards.length) {
      return;
    }
    [cards[index], cards[nextIndex]] = [cards[nextIndex], cards[index]];
    state.data.cards = cards;
    saveDraft();
    updatePreview();
    renderList();
  }

  function renderList() {
    elements.cardList.replaceChildren();
    const visibleCards = filteredCards();
    elements.cardCount.textContent = `${visibleCards.length} / ${state.data.cards.length} 件`;

    if (visibleCards.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'empty-list';
      empty.textContent = '条件に一致するカードがありません。';
      elements.cardList.appendChild(empty);
      return;
    }

    visibleCards.forEach((card) => {
      const item = document.createElement('li');
      item.className = 'card-item';
      item.draggable = true;
      item.dataset.id = card.id;
      if (card.id === state.selectedId) {
        item.classList.add('is-selected');
      }

      item.addEventListener('dragstart', () => {
        state.dragId = card.id;
        item.classList.add('is-dragging');
      });
      item.addEventListener('dragend', () => {
        state.dragId = '';
        item.classList.remove('is-dragging');
      });
      item.addEventListener('dragover', (event) => {
        event.preventDefault();
      });
      item.addEventListener('drop', (event) => {
        event.preventDefault();
        reorderCards(state.dragId, card.id);
      });

      const summary = document.createElement('div');
      summary.className = 'card-item__summary';

      const titleWrap = document.createElement('div');
      const title = document.createElement('h3');
      title.className = 'card-item__title';
      title.textContent = card.title;
      const meta = document.createElement('p');
      meta.className = 'card-item__meta';
      meta.textContent = `${categoryLabel(card.category)} / ${card.tone} / ${card.id}`;
      const description = document.createElement('p');
      description.className = 'card-item__description';
      description.textContent = card.description;
      const hint = document.createElement('p');
      hint.className = 'drag-hint';
      hint.textContent = 'ドラッグして並べ替えできます';
      titleWrap.append(title, meta, description, hint);

      const controls = document.createElement('div');
      controls.className = 'card-item__controls';

      const editButton = document.createElement('button');
      editButton.type = 'button';
      editButton.textContent = '編集';
      editButton.addEventListener('click', () => {
        clearNotification();
        selectCard(card.id);
      });

      const upButton = document.createElement('button');
      upButton.type = 'button';
      upButton.textContent = '↑';
      upButton.addEventListener('click', () => {
        moveCard(card.id, -1);
      });

      const downButton = document.createElement('button');
      downButton.type = 'button';
      downButton.textContent = '↓';
      downButton.addEventListener('click', () => {
        moveCard(card.id, 1);
      });

      controls.append(editButton, upButton, downButton);
      summary.append(titleWrap, controls);
      item.append(summary);
      elements.cardList.appendChild(item);
    });
  }

  function refreshView() {
    updatePreview();
    renderList();
  }

  function setData(payload, notificationMessage, options = {}) {
    const { persist = true } = options;
    state.data = validatePayload(clone(payload));
    if (!state.data.cards.find((card) => card.id === state.selectedId)) {
      state.selectedId = state.data.cards[0]?.id || '';
    }
    if (persist) {
      saveDraft();
    }
    refreshView();
    fillForm(state.data.cards.find((card) => card.id === state.selectedId) || null);
    if (notificationMessage) {
      setNotification(notificationMessage);
    }
  }

  async function loadInitialData() {
    try {
      let payload;
      if (window.PORTAL_CARDS) {
        payload = validatePayload(clone(window.PORTAL_CARDS));
      } else {
        const response = await fetch('data/cards.json', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        payload = validatePayload(await response.json());
      }
      state.initialData = clone(payload);

      const draft = localStorage.getItem(STORAGE_KEY);
      if (draft) {
        try {
          setData(validatePayload(JSON.parse(draft)), '保存済みの編集中データを復元しました。');
        } catch (_error) {
          localStorage.removeItem(STORAGE_KEY);
          setData(payload, '保存済みデータが不正だったため破棄し、初期 cards.js を読み込みました。');
        }
      } else {
        setData(payload, '初期 cards.js を読み込みました。');
      }
    } catch (error) {
      setNotification(`初期データの読み込みに失敗しました: ${error.message}`, 'error');
      setData(state.initialData, '', { persist: false });
    }
  }

  function createCardFromForm() {
    const titleValue = elements.title.value.trim();
    const existingId = elements.id.value.trim();
    return normalizeCard({
      id: existingId || generateId(titleValue),
      category: elements.category.value,
      title: titleValue,
      description: elements.description.value,
      url: elements.url.value.trim() || '#',
      icon: elements.icon.value.trim(),
      tone: elements.tone.value
    });
  }

  function handleSave(event) {
    event.preventDefault();
    clearNotification();

    try {
      const card = createCardFromForm();
      const cards = [...state.data.cards];
      const editingId = state.selectedId && cards.some((item) => item.id === state.selectedId)
        ? state.selectedId
        : '';
      const index = editingId
        ? cards.findIndex((item) => item.id === editingId)
        : cards.findIndex((item) => item.id === card.id);

      if (index >= 0) {
        cards[index] = card;
      } else {
        cards.push(card);
      }

      setData({ version: 1, cards }, 'カードを保存しました。');
      state.selectedId = card.id;
      fillForm(card);
      renderList();
    } catch (error) {
      setNotification(`保存に失敗しました: ${error.message}`, 'error');
    }
  }

  function handleAdd() {
    clearNotification();
    state.selectedId = '';
    const defaultCategory = state.categories[0] ? state.categories[0].id : 'home';
    fillForm({ category: defaultCategory, tone: 'blue', icon: '•', url: '#' });
    elements.title.focus();
  }

  function handleDelete() {
    const id = elements.id.value.trim();
    if (!id) {
      setNotification('削除するカードを選択してください。', 'error');
      return;
    }
    const card = state.data.cards.find((item) => item.id === id);
    if (!card) {
      setNotification('削除対象のカードが見つかりません。', 'error');
      return;
    }
    if (!window.confirm(`「${card.title}」を削除しますか？`)) {
      return;
    }

    const cards = state.data.cards.filter((item) => item.id !== id);
    setData({ version: 1, cards }, 'カードを削除しました。');
  }

  function extractPortalCardsPayload(text) {
    const match = text.match(/window\.PORTAL_CARDS\s*=\s*({[\s\S]*?})\s*;?\s*$/);
    if (!match) {
      throw new Error('window.PORTAL_CARDS = {...}; の形式が見つかりません。');
    }
    return JSON.parse(match[1]);
  }

  async function handleImport(event) {
    const [file] = event.target.files || [];
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      if (text.includes('window.PORTAL_CATEGORIES') || /categories/i.test(file.name)) {
        const rawCategories = extractPortalCategoriesPayload(text);
        const categories = validateCategories(rawCategories);
        setCategories(categories, 'categories.js を読み込みました。');
        return;
      }
      const isJsFile = /\.js$/i.test(file.name) || text.includes('window.PORTAL_CARDS');
      const rawPayload = isJsFile ? extractPortalCardsPayload(text) : JSON.parse(text);
      const payload = validatePayload(rawPayload);
      setData(payload, isJsFile ? 'cards.js を読み込みました。' : 'cards.json を読み込みました。');
    } catch (error) {
      setNotification(`ファイルの読み込みに失敗しました: ${error.message}`, 'error');
    } finally {
      elements.fileInput.value = '';
    }
  }

  function handleExport() {
    clearNotification();
    try {
      const payload = makePayload();
      const content = `window.PORTAL_CARDS = ${JSON.stringify(payload, null, 2)};\n`;
      const blob = new Blob([content], {
        type: 'application/javascript;charset=utf-8'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'cards.js';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setNotification('cards.js をエクスポートしました。data/cards.js を置き換えてください。');
    } catch (error) {
      setNotification(`エクスポートできません: ${error.message}`, 'error');
    }
  }

  function handleReset() {
    if (!window.confirm('編集中の内容を破棄して初期状態に戻しますか？（カテゴリ設定も含みます）')) {
      return;
    }
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CATEGORY_STORAGE_KEY);
    setCategories(state.initialCategories, '', { persist: false });
    setData(state.initialData, '初期状態に戻しました。');
  }

  function handleCancel() {
    clearNotification();
    const card = state.data.cards.find((item) => item.id === state.selectedId);
    fillForm(card || null);
  }

  populateToneSelect();

  elements.form.addEventListener('submit', handleSave);
  elements.addButton.addEventListener('click', handleAdd);
  elements.cancelButton.addEventListener('click', handleCancel);
  elements.deleteButton.addEventListener('click', handleDelete);
  elements.exportButton.addEventListener('click', handleExport);
  elements.exportCategoriesButton.addEventListener('click', handleExportCategories);
  elements.resetButton.addEventListener('click', handleReset);
  elements.importButton.addEventListener('click', () => elements.fileInput.click());
  elements.fileInput.addEventListener('change', handleImport);
  elements.addCategoryButton.addEventListener('click', handleAddCategory);
  elements.categoryFilter.addEventListener('change', (event) => {
    state.filterCategory = event.target.value;
    renderList();
  });
  elements.searchInput.addEventListener('input', (event) => {
    state.search = event.target.value;
    renderList();
  });

  loadInitialCategories().then(loadInitialData);
})();
