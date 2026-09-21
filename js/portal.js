(() => {
  const CATEGORY_META = {
    home: 'ホーム',
    central: '中央',
    water: '水処理',
    maintenance: '保守',
    electrical: '電気'
  };

  const elements = {
    nav: document.getElementById('category-nav'),
    title: document.getElementById('current-category-title'),
    search: document.getElementById('portal-search'),
    grid: document.getElementById('cards-grid'),
    message: document.getElementById('portal-message')
  };

  let state = {
    category: 'home',
    search: '',
    cards: []
  };

  function setMessage(text, type) {
    elements.message.textContent = text;
    elements.message.className = 'message is-visible';
    elements.message.classList.add(type === 'error' ? 'is-error' : 'is-info');
  }

  function clearMessage() {
    elements.message.textContent = '';
    elements.message.className = 'message';
  }

  function isRenderableCard(card) {
    return card && typeof card === 'object' && CATEGORY_META[card.category];
  }

  function isSafeUrl(value) {
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

  function filterCards() {
    const keyword = state.search.trim().toLowerCase();
    return state.cards.filter((card) => {
      if (!isRenderableCard(card) || card.category !== state.category) {
        return false;
      }
      if (!keyword) {
        return true;
      }
      return [card.title, card.description]
        .filter((value) => typeof value === 'string')
        .some((value) => value.toLowerCase().includes(keyword));
    });
  }

  function createCardElement(card) {
    const article = document.createElement('article');
    article.className = 'card';
    article.tabIndex = 0;

    const icon = document.createElement('div');
    icon.className = `card__icon tone-${card.tone || 'blue'}`;
    icon.textContent = card.icon || '•';

    const title = document.createElement('h3');
    title.className = 'card__title';
    title.textContent = card.title || '無題';

    const description = document.createElement('p');
    description.className = 'card__description';
    description.textContent = card.description || '';

    const url = document.createElement('p');
    url.className = 'card__url';
    url.textContent = card.url || '#';

    const open = () => {
      const target = typeof card.url === 'string' && card.url.trim() ? card.url.trim() : '#';
      if (!isSafeUrl(target)) {
        setMessage(`カード「${card.title || '無題'}」のURLが不正なため開けません。`, 'error');
        return;
      }
      if (target !== '#') {
        clearMessage();
      }
      window.location.href = target;
    };

    article.addEventListener('click', open);
    article.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        open();
      }
    });

    article.append(icon, title, description, url);
    return article;
  }

  function renderCards() {
    elements.grid.replaceChildren();
    elements.title.textContent = CATEGORY_META[state.category] || 'カード';

    const filtered = filterCards();
    if (filtered.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = state.search
        ? '条件に一致するカードが見つかりませんでした。'
        : 'このカテゴリにはカードがありません。';
      elements.grid.appendChild(empty);
      return;
    }

    filtered.forEach((card) => {
      elements.grid.appendChild(createCardElement(card));
    });
  }

  function renderNav() {
    elements.nav.replaceChildren();

    Object.entries(CATEGORY_META).forEach(([key, label]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'sidebar__button';
      if (key === state.category) {
        button.classList.add('is-active');
      }
      button.textContent = label;
      button.addEventListener('click', () => {
        state.category = key;
        renderNav();
        renderCards();
      });
      elements.nav.appendChild(button);
    });
  }

  async function loadCards() {
    try {
      const response = await fetch('data/cards.json', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const payload = await response.json();
      if (!payload || !Array.isArray(payload.cards)) {
        throw new Error('cards.json の形式が不正です。');
      }
      state.cards = payload.cards;
      clearMessage();
      renderNav();
      renderCards();
    } catch (error) {
      state.cards = [];
      renderNav();
      renderCards();
      setMessage(`cards.json の読み込みに失敗しました: ${error.message}`, 'error');
    }
  }

  elements.search.addEventListener('input', (event) => {
    state.search = event.target.value;
    renderCards();
  });

  renderNav();
  renderCards();
  loadCards();
})();
