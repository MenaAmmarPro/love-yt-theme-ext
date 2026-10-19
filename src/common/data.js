"use strict";

/*
 * love-yt-theme-ext — settings model + the CSS we inject.
 *
 * Everything here is a pure function (plus two tiny storage helpers) so the
 * Node harness can check the defaults and the match logic without a browser.
 */

(function (root) {
  var STORAGE_KEY = "loveTheme";

  /* ---------- the sites we can restyle ---------- */

  var YOUTUBE = ["https://www.youtube.com/*", "https://m.youtube.com/*"];
  var YT_MUSIC = ["https://music.youtube.com/*"];
  var REDDIT = ["https://www.reddit.com/*", "https://old.reddit.com/*"];
  var X = ["https://x.com/*", "https://twitter.com/*"];
  var ALL_PATTERNS = YOUTUBE.concat(YT_MUSIC, REDDIT, X);

  var SITES = {
    youtube: { key: "youtube", label: "YouTube", patterns: YOUTUBE },
    ytmusic: { key: "ytmusic", label: "YouTube Music", patterns: YT_MUSIC },
    reddit: { key: "reddit", label: "Reddit", patterns: REDDIT },
    x: { key: "x", label: "X (Twitter)", patterns: X },
    all: { key: "all", label: "All of these sites", patterns: ALL_PATTERNS }
  };

  var SITE_ORDER = ["youtube", "ytmusic", "reddit", "x", "all"];

  var DEFAULTS = { enabled: true, accent: "#ff3d8b", site: "youtube" };

  var PRESET_ACCENTS = ["#ff3d8b", "#ff72b8", "#e91e63", "#bba6ff", "#ffd76f", "#7ee8fa"];

  /* ---------- colour helpers ---------- */

  function isHex(value) {
    return typeof value === "string" && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim());
  }

  function normalizeAccent(value) {
    if (!isHex(value)) return DEFAULTS.accent;
    var hex = value.trim().toLowerCase();
    if (hex.length === 4) {
      hex = "#" + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
    }
    return hex;
  }

  function hexToRgb(value) {
    var hex = normalizeAccent(value).slice(1);
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16)
    };
  }

  function withAlpha(value, alpha) {
    var c = hexToRgb(value);
    var a = typeof alpha === "number" ? alpha : 1;
    return "rgba(" + c.r + ", " + c.g + ", " + c.b + ", " + a + ")";
  }

  function contrastText(value) {
    var c = hexToRgb(value);
    var luminance = (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255;
    return luminance > 0.6 ? "#111111" : "#ffffff";
  }

  function accentVars(value) {
    var a = normalizeAccent(value);
    return (
      "--mena-accent:" + a + ";" +
      "--mena-accent-soft:" + withAlpha(a, 0.18) + ";" +
      "--mena-accent-mid:" + withAlpha(a, 0.5) + ";" +
      "--mena-accent-dim:" + withAlpha(a, 0.35) + ";" +
      "--mena-on-accent:" + contrastText(a) + ";"
    );
  }

  /* ---------- options ---------- */

  function normalizeSite(value) {
    return SITES[value] ? value : DEFAULTS.site;
  }

  function normalizeOptions(raw) {
    var src = raw && typeof raw === "object" ? raw : {};
    return {
      enabled: src.enabled === undefined ? DEFAULTS.enabled : !!src.enabled,
      accent: normalizeAccent(src.accent === undefined ? DEFAULTS.accent : src.accent),
      site: normalizeSite(src.site === undefined ? DEFAULTS.site : src.site)
    };
  }

  /* ---------- matching ---------- */

  function globToRegExp(pattern) {
    var escaped = String(pattern).replace(/[.+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp("^" + escaped.replace(/\*/g, ".*") + "$");
  }

  function matchPattern(pattern, url) {
    if (!pattern || !url) return false;
    if (pattern === "<all_urls>" || pattern === "*") return true;
    return globToRegExp(pattern).test(String(url));
  }

  function siteMatches(key, url) {
    var site = SITES[key];
    if (!site) return false;
    return site.patterns.some(function (pattern) {
      return matchPattern(pattern, url);
    });
  }

  // True when the theme should be applied to `url` at all.
  function shouldInject(rawOptions, url) {
    var options = normalizeOptions(rawOptions);
    if (!options.enabled) return false;
    return siteMatches(options.site, url);
  }

  // Which site block to draw: null when the theme should not apply, otherwise
  // the concrete site key (so "all" resolves to the site you are actually on).
  function activeSiteKey(rawOptions, url) {
    var options = normalizeOptions(rawOptions);
    if (!options.enabled) return null;
    if (options.site === "all") {
      for (var i = 0; i < SITE_ORDER.length; i += 1) {
        var key = SITE_ORDER[i];
        if (key !== "all" && siteMatches(key, url)) return key;
      }
      return null;
    }
    return siteMatches(options.site, url) ? options.site : null;
  }

  /* ---------- the stylesheet ---------- */

  var BASE_CSS = [
    "::selection{background:var(--mena-accent-mid);color:var(--mena-on-accent);}",
    "::-webkit-scrollbar-thumb{background:var(--mena-accent)!important;border-radius:8px;}",
    "::-webkit-scrollbar-thumb:hover{background:var(--mena-accent-mid)!important;}",
    "a:focus-visible,button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:2px solid var(--mena-accent)!important;outline-offset:2px;}",
    "html::after{content:'\\2665';position:fixed;right:10px;bottom:12px;font-size:22px;line-height:1;color:var(--mena-accent);opacity:.6;pointer-events:none;z-index:2147483000;}"
  ].join("");

  var SITE_CSS = {
    youtube: [
      "#masthead-container{border-bottom:1px solid var(--mena-accent-soft)!important;}",
      ".ytp-play-progress,.ytp-swatch-background-color,.ytp-scrubber-button{background-color:var(--mena-accent)!important;}",
      "ytd-thumbnail-overlay-resume-playback-renderer #progress{background-color:var(--mena-accent)!important;}",
      "ytd-topbar-logo-renderer #logo-icon,ytd-logo #logo-icon{filter:drop-shadow(0 0 6px var(--mena-accent-mid));}",
      "a.yt-simple-endpoint:hover #video-title,yt-formatted-string#video-title:hover{color:var(--mena-accent)!important;}",
      "#subscribe-button .yt-spec-button-shape-next--filled{background:var(--mena-accent)!important;color:var(--mena-on-accent)!important;}"
    ].join(""),
    ytmusic: [
      "ytmusic-player-bar{border-top:1px solid var(--mena-accent-soft)!important;}",
      "#progress-bar,#sliderBar{background:var(--mena-accent-mid)!important;}",
      "tp-yt-paper-icon-button:hover,ytmusic-nav-bar a:hover{color:var(--mena-accent)!important;}"
    ].join(""),
    reddit: [
      "#header,.Header{box-shadow:0 1px 0 var(--mena-accent-soft)!important;}",
      "button[aria-label='upvote'],.upvote,button[aria-label='Upvote']{color:var(--mena-accent)!important;}",
      "a:hover{color:var(--mena-accent)!important;}"
    ].join(""),
    x: [
      "[data-testid='tweetButtonInline'],[data-testid='tweetButton']{background-color:var(--mena-accent)!important;color:var(--mena-on-accent)!important;}",
      "a[href^='/hashtag/'],a:hover{color:var(--mena-accent)!important;}"
    ].join(""),
    all: ["a:hover{color:var(--mena-accent)!important;}", "button{accent-color:var(--mena-accent);}"].join("")
  };

  function buildCss(rawOptions, siteKey) {
    var options = normalizeOptions(rawOptions);
    var key = SITES[siteKey] ? siteKey : options.site;
    var block = SITE_CSS[key] || SITE_CSS.all;
    return ":root{" + accentVars(options.accent) + "}" + BASE_CSS + block;
  }

  /* ---------- storage helpers (promise + callback friendly) ---------- */

  function storageGet(key) {
    return new Promise(function (resolve) {
      try {
        var result = api.storage.sync.get(key, function (data) {
          resolve(data || {});
        });
        if (result && typeof result.then === "function") result.then(function (data) { resolve(data || {}); });
      } catch (e) {
        resolve({});
      }
    });
  }

  function storageSet(obj) {
    return new Promise(function (resolve) {
      try {
        var result = api.storage.sync.set(obj, function () {
          resolve(obj);
        });
        if (result && typeof result.then === "function") result.then(function () { resolve(obj); });
      } catch (e) {
        resolve(obj);
      }
    });
  }

  function readOptions() {
    return storageGet(STORAGE_KEY).then(function (data) {
      return normalizeOptions(data ? data[STORAGE_KEY] : null);
    });
  }

  function writeOptions(raw) {
    var options = normalizeOptions(raw);
    var payload = {};
    payload[STORAGE_KEY] = options;
    return storageSet(payload);
  }

  function ensureDefaults() {
    return readOptions().then(function (options) {
      return writeOptions(options).then(function () {
        return options;
      });
    });
  }

  /* ---------- export ---------- */

  var ns = {
    STORAGE_KEY: STORAGE_KEY,
    DEFAULTS: DEFAULTS,
    SITES: SITES,
    SITE_ORDER: SITE_ORDER,
    PRESET_ACCENTS: PRESET_ACCENTS,
    ALL_PATTERNS: ALL_PATTERNS,
    isHex: isHex,
    normalizeAccent: normalizeAccent,
    normalizeSite: normalizeSite,
    normalizeOptions: normalizeOptions,
    hexToRgb: hexToRgb,
    withAlpha: withAlpha,
    contrastText: contrastText,
    accentVars: accentVars,
    globToRegExp: globToRegExp,
    matchPattern: matchPattern,
    siteMatches: siteMatches,
    shouldInject: shouldInject,
    activeSiteKey: activeSiteKey,
    buildCss: buildCss,
    readOptions: readOptions,
    writeOptions: writeOptions,
    ensureDefaults: ensureDefaults
  };

  root.MenaYTTheme = ns;
  if (typeof module !== "undefined" && module.exports) module.exports = ns;
})(typeof globalThis !== "undefined" ? globalThis : this);
