(function () {
  var grid = document.getElementById("portal-grid");
  var links = Array.prototype.slice.call(document.querySelectorAll(".side-link"));
  var title = document.getElementById("page-title");
  var breadcrumb = document.getElementById("breadcrumb-label");
  var lead = document.getElementById("page-lead");
  var count = document.getElementById("result-count");
  var empty = document.getElementById("empty-state");
  var sidebar = document.getElementById("sidebar");
  var shortcutOnly = Array.prototype.slice.call(document.querySelectorAll(".shortcut-only"));
  var heading = document.getElementById("shortcut-heading");
  var note = document.getElementById("page-note");
  var currentTarget = "home";
  var cards = [];

  function labelFor(target) {
    var link = document.querySelector('.side-link[data-target="' + target + '"]');
    return link ? link.lastChild.textContent.trim() : "Dashboard";
  }

  function createCard(data) {
    var card = document.createElement("a");
    card.className = "portal-card searchable";
    card.href = data.url || "#";
    card.dataset.id = data.id;
    card.dataset.category = data.category;
    card.dataset.search = data.title + " " + data.description;
    card.dataset.tone = data.tone || "blue";
    card.innerHTML = '<span class="card-top"><span class="card-icon"></span><span class="card-arrow">↗</span></span><span><strong></strong><small></small></span>';
    card.querySelector(".card-icon").textContent = data.icon || "▤";
    card.querySelector("strong").textContent = data.title;
    card.querySelector("small").textContent = data.description || "ショートカット";
    card.addEventListener("click", function (event) {
      event.preventDefault();
      select(card.dataset.category);
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
    shortcutOnly.forEach(function (item) {
      item.hidden = target !== "home" && target !== "central" && target !== "water";
    });
    heading.textContent = label + "のショートカット";
    cards.forEach(function (card) {
      card.hidden = card.dataset.category !== target;
    });
    note.hidden = target === "home" || target === "central" || target === "water";
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

  links.forEach(function (link) {
    link.addEventListener("click", function () {
      select(link.dataset.target);
    });
  });

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

  loadCards().then(function () {
    var initialTarget = window.location.hash.slice(1);
    select(initialTarget && document.querySelector('.side-link[data-target="' + initialTarget + '"]') ? initialTarget : "home");
  }).catch(function (error) {
    note.hidden = false;
    note.textContent = error.message + "。index.html と data/cards.json を同じサイト内に配置してください。";
  });
}());
