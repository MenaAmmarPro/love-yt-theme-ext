"use strict";

/*
 * love-yt-theme-ext — background script.
 *
 * Seeding the defaults on install/startup is all we need: the content script
 * reads storage itself and reacts to changes, so there is no messaging.
 */

if (typeof MenaYTTheme === "undefined" && typeof importScripts === "function") {
  importScripts("../common/api.js", "../common/data.js");
}

function seedDefaults() {
  if (typeof MenaYTTheme === "undefined") return;
  try {
    api.storage.sync.get(MenaYTTheme.STORAGE_KEY, function (data) {
      var current = data ? data[MenaYTTheme.STORAGE_KEY] : null;
      if (!current) MenaYTTheme.writeOptions(MenaYTTheme.DEFAULTS);
    });
  } catch (e) {
    /* storage may be unavailable in exotic contexts */
  }
}

try {
  if (api && api.runtime) {
    if (api.runtime.onInstalled) api.runtime.onInstalled.addListener(seedDefaults);
    if (api.runtime.onStartup) api.runtime.onStartup.addListener(seedDefaults);
  }
} catch (e) {
  /* ignore */
}
