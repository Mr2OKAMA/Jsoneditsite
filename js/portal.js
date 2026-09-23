(function () {
  var grid = document.getElementById("portal-grid");
  var sideList = document.getElementById("side-list");
  var title = document.getElementById("page-title");
  var breadcrumb = document.getElementById("breadcrumb-label");
  var lead = document.getElementById("page-lead");
  var count = document.getElementById("result-count");
  var empty = document.getElementById("empty-state");
  var sidebar = document.getElementById("sidebar");
  var heading = document.getElementById("shortcut-heading");
  var note = document.getElementById("page-note");
  var themeToggle = document.getElementById("theme-toggle");
  var root = document.documentElement;
  var themeStorageKey = "portal-theme";
  var currentTarget = "home";
  var cards = [];
  var links = [];
  var categories = [];

  function updateThemeToggle(theme) {
    if (!themeToggle) return;
    var isLight = theme === "light";
    themeToggle.textContent = isLight ? "ライト" : "ダーク";
    themeToggle.setAttribute("aria-checked", String(isLight));
    themeToggle.setAttribute("aria-label", isLight ? "ダークモードに切り替え" : "ライトモードに切り替え");
  }

  function applyTheme(theme) {
    root.dataset.theme = theme;
    updateThemeToggle(theme);
  }

  function resolveInitialTheme() {
    var savedTheme = "";
    try {
      savedTheme = localStorage.getItem(themeStorageKey);
    } catch (error) {}
    if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) {
      return "light";
    }
    return "dark";
  }

  function renderSidebar() {
    categories = (window.PORTAL_CATEGORIES && Array.isArray(window.PORTAL_CATEGORIES) && window.PORTAL_CATEGORIES.length)
      ? window.PORTAL_CATEGORIES
      : [{ id: "home", label: "ホーム", icon: "⌂" }];

    sideList.innerHTML = "";
    categories.forEach(function (category) {
      var li = document.createElement("li");
      var link = document.createElement("a");
      link.className = "side-link";
      link.href = "#" + category.id;
      link.dataset.target = category.id;
      link.innerHTML = '<span class="side-icon"></span>';
      link.querySelector(".side-icon").textContent = category.icon || "▪";
      link.appendChild(document.createTextNode(category.label || category.id));
      link.addEventListener("click", function () {
        select(category.id);
      });
      li.appendChild(link);
      sideList.appendChild(li);
    });
    links = Array.prototype.slice.call(sideList.querySelectorAll(".side-link"));
  }

  function labelFor(target) {
    var category = categories.filter(function (item) { return item.id === target; })[0];
    return category ? category.label : "Dashboard";
  }

  function createCard(data) {
    var card = document.createElement("a");
    var url = (data.url || "#").trim();
    card.className = "portal-card searchable";
    card.href = url || "#";
    card.dataset.id = data.id;
    card.dataset.category = data.category;
    card.dataset.search = data.title + " " + data.description;
    card.dataset.tone = data.tone || "blue";
    card.innerHTML = '<span class="card-top"><span class="card-icon"></span><span class="card-arrow">↗</span></span><span><strong></strong><small></small></span>';
    card.querySelector(".card-icon").textContent = data.icon || "▤";
    card.querySelector("strong").textContent = data.title;
    card.querySelector("small").textContent = data.description || "ショートカット";
    card.addEventListener("click", function (event) {
      if (!url || url === "#") {
        event.preventDefault();
        select(card.dataset.category);
      }
    });
    return card;
  }

  function select(target) {
    var label = labelFor(target);
    currentTarget = target;
    links.forEach(function (link) {
      link.classList.toggle("active", link.dataset.target === target);
    });
    title.textContent = target === "home" ? "Dashboard" : label;
    breadcrumb.textContent = target === "home" ? "Dashboard" : label;
    lead.textContent = target === "home"
      ? "事務所の業務情報と各種ツールへ、ここからアクセスできます。"
      : label + " のショートカットを表示しています。";
    heading.textContent = label + "のショートカット";
    cards.forEach(function (card) {
      card.hidden = card.dataset.category !== target;
    });
    var total = cards.filter(function (card) {
      return card.dataset.category === target;
    }).length;
    count.textContent = total + " links";
    empty.style.display = total ? "none" : "block";
  }

  function filter(value) {
    var query = value.trim().toLowerCase();
    var visible = 0;
    cards.forEach(function (item) {
      var text = (item.textContent + " " + (item.dataset.search || "")).toLowerCase();
      var matches = item.dataset.category === currentTarget && (!query || text.indexOf(query) !== -1);
      item.hidden = !matches;
      if (matches) visible += 1;
    });
    count.textContent = visible + " links";
    empty.style.display = visible ? "none" : "block";
  }

  function loadCards() {
    if (window.PORTAL_CARDS && Array.isArray(window.PORTAL_CARDS.cards)) {
      window.PORTAL_CARDS.cards.forEach(function (card) {
        grid.appendChild(createCard(card));
      });
      cards = Array.prototype.slice.call(grid.querySelectorAll(".portal-card"));
      return Promise.resolve();
    }
    return fetch("data/cards.json", { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) throw new Error("cards.json の読み込みに失敗しました (" + response.status + ")");
        return response.json();
      })
      .then(function (data) {
        if (!data || !Array.isArray(data.cards)) {
          throw new Error("cards.json の形式が正しくありません");
        }
        data.cards.forEach(function (card) {
          grid.appendChild(createCard(card));
        });
        cards = Array.prototype.slice.call(grid.querySelectorAll(".portal-card"));
      });
  }

  renderSidebar();

  document.getElementById("global-search").addEventListener("submit", function (event) {
    event.preventDefault();
    filter(document.getElementById("global-search-input").value);
  });
  document.getElementById("global-search-input").addEventListener("input", function () {
    filter(this.value);
  });
  document.getElementById("side-search").addEventListener("input", function () {
    var query = this.value.trim().toLowerCase();
    links.forEach(function (link) {
      link.parentElement.hidden = !!query && link.textContent.toLowerCase().indexOf(query) === -1;
    });
  });
  document.getElementById("menu-button").addEventListener("click", function () {
    sidebar.hidden = !sidebar.hidden;
  });
  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      var nextTheme = root.dataset.theme === "light" ? "dark" : "light";
      applyTheme(nextTheme);
      try {
        localStorage.setItem(themeStorageKey, nextTheme);
      } catch (error) {}
    });
  }
  applyTheme(resolveInitialTheme());

  loadCards().then(function () {
    var initialTarget = window.location.hash.slice(1);
    var validTarget = categories.some(function (item) { return item.id === initialTarget; });
    select(validTarget ? initialTarget : "home");
  }).catch(function (error) {
    if (note) {
      note.hidden = false;
      note.textContent = error.message + "。index.html と data/cards.json を同じサイト内に配置してください。";
    }
  });
}());
