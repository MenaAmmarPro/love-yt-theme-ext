"use strict";

/* love-yt-theme-ext — options page wiring */

(function () {
  var T = MenaYTTheme;
  var els = {
    enabled: document.getElementById("enabled"),
    accent: document.getElementById("accent"),
    site: document.getElementById("site"),
    swatches: document.getElementById("swatches"),
    preview: document.getElementById("preview"),
    siteList: document.getElementById("site-list"),
    note: document.getElementById("note"),
    reset: document.getElementById("reset")
  };
  var options = T.normalizeOptions(null);

  function note(message) {
    if (els.note) els.note.textContent = message;
  }

  function paintPreview() {
    var root = document.documentElement;
    if (root && root.style) {
      root.style.setProperty("--accent", options.accent);
      root.style.setProperty("--on-accent", T.contrastText(options.accent));
    }
  }

  function render() {
    if (els.enabled) els.enabled.checked = options.enabled;
    if (els.accent) els.accent.value = options.accent;
    if (els.site) els.site.value = options.site;
    paintPreview();
    if (els.swatches) {
      Array.prototype.forEach.call(els.swatches.children, function (button) {
        button.style.background = button.dataset.accent;
        button.setAttribute("aria-pressed", button.dataset.accent === options.accent ? "true" : "false");
      });
    }
  }

  function persist(message) {
    options = T.normalizeOptions(options);
    T.writeOptions(options);
    render();
    if (message) note(message);
  }

  function buildSwatches() {
    if (!els.swatches) return;
    T.PRESET_ACCENTS.forEach(function (hex) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "lx-swatch";
      button.dataset.accent = hex;
      button.title = hex;
      button.setAttribute("aria-label", "Use " + hex);
      button.addEventListener("click", function () {
        options.accent = hex;
        persist("Accent set to " + hex);
      });
      els.swatches.appendChild(button);
    });
  }

  function buildSites() {
    if (els.site) {
      T.SITE_ORDER.forEach(function (key) {
        var option = document.createElement("option");
        option.value = key;
        option.textContent = T.SITES[key].label;
        els.site.appendChild(option);
      });
    }
    if (!els.siteList) return;
    T.SITE_ORDER.forEach(function (key) {
      var site = T.SITES[key];
      var li = document.createElement("li");
      var strong = document.createElement("strong");
      strong.textContent = site.label;
      li.appendChild(strong);
      li.appendChild(document.createTextNode(" \u2014 " + site.patterns.length + " page" + (site.patterns.length === 1 ? "" : "s")));
      els.siteList.appendChild(li);
    });
  }

  function wire() {
    if (els.enabled) {
      els.enabled.addEventListener("change", function () {
        options.enabled = els.enabled.checked;
        persist(options.enabled ? "Theme on \u2665" : "Theme off \u2014 back to normal.");
      });
    }
    if (els.accent) {
      els.accent.addEventListener("input", function () {
        options.accent = els.accent.value;
        paintPreview();
      });
      els.accent.addEventListener("change", function () {
        options.accent = els.accent.value;
        persist("Accent set to " + options.accent);
      });
    }
    if (els.site) {
      els.site.addEventListener("change", function () {
        options.site = els.site.value;
        persist("Now styling " + T.SITES[options.site].label + ".");
      });
    }
    if (els.reset) {
      els.reset.addEventListener("click", function () {
        options = T.normalizeOptions(T.DEFAULTS);
        persist("Reset to the defaults \u2665");
      });
    }
    var link = document.getElementById("preview-link");
    if (link) {
      link.addEventListener("click", function (event) {
        if (event && event.preventDefault) event.preventDefault();
      });
    }
  }

  buildSwatches();
  buildSites();
  wire();
  render();

  T.readOptions().then(function (saved) {
    options = saved;
    render();
  });
})();
