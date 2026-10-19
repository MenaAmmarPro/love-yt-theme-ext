"use strict";

// Loaded first as a plain (non-module) script so every other script can use api.*
const api = globalThis.browser || globalThis.chrome;
