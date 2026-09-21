(() => {
  const STORAGE_KEY = 'sharepoint-card-editor-state';
  const CATEGORY_META = {
    home: 'ホーム',
    central: '中央',
    water: '水処理',
    maintenance: '保守',
    electrical: '電気'
  };
  const TONES = ['blue', 'green', 'purple', 'yellow', 'red'];

  const elements = {
    fileInput: document.getElementById('file-input'),
    importButton: document.getElementById('import-button'),
    exportButton: document.getElementById('export-button'),
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
    preview: document.getElementById('json-preview')
  };

  const state = {
    data: { version: 1, cards: [] },
    initialData: { version: 1, cards: [] },
    selectedId: '',
    filterCategory: 'all',
    search: '',
    dragId: ''
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
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

      if (!CATEGORY_META[card.category]) {
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
    elements.category.value = card?.category || 'home';
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
    cards.splice(targetIndex, 0, moved);
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
      meta.textContent = `${CATEGORY_META[card.category]} / ${card.tone} / ${card.id}`;
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

  function setData(payload, notificationMessage) {
    state.data = validatePayload(clone(payload));
    if (!state.data.cards.find((card) => card.id === state.selectedId)) {
      state.selectedId = state.data.cards[0]?.id || '';
    }
    saveDraft();
    refreshView();
    fillForm(state.data.cards.find((card) => card.id === state.selectedId) || null);
    if (notificationMessage) {
      setNotification(notificationMessage);
    }
  }

  async function loadInitialData() {
    try {
      const response = await fetch('data/cards.json', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const payload = validatePayload(await response.json());
      state.initialData = clone(payload);

      const draft = localStorage.getItem(STORAGE_KEY);
      if (draft) {
        setData(validatePayload(JSON.parse(draft)), '保存済みの編集中データを復元しました。');
      } else {
        setData(payload, '初期 cards.json を読み込みました。');
      }
    } catch (error) {
      setNotification(`初期JSONの読み込みに失敗しました: ${error.message}`, 'error');
      setData(state.initialData, '');
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
      const index = cards.findIndex((item) => item.id === card.id);

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
    fillForm({ category: 'home', tone: 'blue', icon: '•', url: '#' });
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

  async function handleImport(event) {
    const [file] = event.target.files || [];
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const payload = validatePayload(JSON.parse(text));
      setData(payload, 'JSONを読み込みました。');
    } catch (error) {
      setNotification(`JSONの読み込みに失敗しました: ${error.message}`, 'error');
    } finally {
      elements.fileInput.value = '';
    }
  }

  function handleExport() {
    clearNotification();
    try {
      const payload = makePayload();
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json;charset=utf-8'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'cards.json';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setNotification('cards.json をエクスポートしました。');
    } catch (error) {
      setNotification(`エクスポートできません: ${error.message}`, 'error');
    }
  }

  function handleReset() {
    if (!window.confirm('編集中の内容を破棄して初期状態に戻しますか？')) {
      return;
    }
    localStorage.removeItem(STORAGE_KEY);
    setData(state.initialData, '初期状態に戻しました。');
  }

  function handleCancel() {
    clearNotification();
    const card = state.data.cards.find((item) => item.id === state.selectedId);
    fillForm(card || null);
  }

  populateSelect(elements.categoryFilter, CATEGORY_META, true);
  populateSelect(elements.category, CATEGORY_META);
  populateToneSelect();

  elements.form.addEventListener('submit', handleSave);
  elements.addButton.addEventListener('click', handleAdd);
  elements.cancelButton.addEventListener('click', handleCancel);
  elements.deleteButton.addEventListener('click', handleDelete);
  elements.exportButton.addEventListener('click', handleExport);
  elements.resetButton.addEventListener('click', handleReset);
  elements.importButton.addEventListener('click', () => elements.fileInput.click());
  elements.fileInput.addEventListener('change', handleImport);
  elements.categoryFilter.addEventListener('change', (event) => {
    state.filterCategory = event.target.value;
    renderList();
  });
  elements.searchInput.addEventListener('input', (event) => {
    state.search = event.target.value;
    renderList();
  });

  loadInitialData();
})();
