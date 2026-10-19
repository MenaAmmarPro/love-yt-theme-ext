"use strict";

/*
 * love-yt-theme-ext — content script.
 *
 * Injects (or refreshes) a single <style> tag with the pink/heart theme. It
 * runs on every supported site but only paints when the saved options say this
 * page should be themed.
 */

(function () {
  var STYLE_ID = "mena-yt-theme";

  function target() {
    return document.head || document.documentElement;
  }

  function applyStyle(css) {
    var el = document.getElementById(STYLE_ID);
    if (!css) {
      if (el) el.remove();
      return;
    }
    if (!el) {
      el = document.createElement("style");
      el.id = STYLE_ID;
      el.setAttribute("data-mena-theme", "1");
      var host = target();
      if (host) host.appendChild(el);
    }
    el.textContent = css;
  }

  function refresh(options) {
    var key = MenaYTTheme.activeSiteKey(options, location.href);
    applyStyle(key ? MenaYTTheme.buildCss(options, key) : "");
  }

  function reload() {
    MenaYTTheme.readOptions().then(refresh, function () {
      refresh(MenaYTTheme.DEFAULTS);
    });
  }

  reload();

  try {
    if (api && api.storage && api.storage.onChanged) {
      api.storage.onChanged.addListener(function (changes) {
        if (changes && changes[MenaYTTheme.STORAGE_KEY]) {
          refresh(changes[MenaYTTheme.STORAGE_KEY].newValue);
        }
      });
    }
  } catch (e) {
    /* live updates are a nicety, not a requirement */
  }

  // YouTube is a single-page app: re-check when the address changes.
  var lastHref = location.href;
  setInterval(function () {
    if (location.href !== lastHref) {
      lastHref = location.href;
      reload();
    }
  }, 1500);
})();
