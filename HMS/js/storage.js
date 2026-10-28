/* =========================================================
   storage.js — Data layer: talks to the HMS server (SQLite database)
   ---------------------------------------------------------
   Every page script calls HMSStore.load / HMSStore.save (through HMSData).
   Those calls now go to the server's JSON API (server.py), which stores the
   data in the relational database HMS_DB/hms.db and enforces its constraints.

   Why synchronous requests?  The page scripts were written to read data
   directly (no await). Synchronous requests to localhost are instant and keep
   the page code simple. A production app would use asynchronous fetch().
   ========================================================= */

// Thrown to stop the page script that triggered a failed save. It is expected, so it is not logged as a red error.
class HMSStopError extends Error {}
window.addEventListener("error", (e) => { if (e.error instanceof HMSStopError) e.preventDefault(); });

const HMSStore = {
  prefix: "hms_",

  // Collections that live in the database. Anything else stays in the browser.
  apiKeys: ["patients", "doctors", "appointments", "medicalRecords", "invoices",
            "medicines", "pharmacySales", "readNotifs"],

  seedHook: null,     // set by data.js: returns the starting (dummy) data for an empty database
  _cache: {},         // one copy per page load; cleared after every write
  _ready: false,

  // ----- low level -----
  _request(method, url, body) {
    const x = new XMLHttpRequest();
    x.open(method, url, false);                       // false = synchronous
    x.setRequestHeader("Content-Type", "application/json");
    try {
      x.send(body === undefined ? null : JSON.stringify(body));
    } catch (e) {
      this._serverDown();
    }
    if (x.status === 0) this._serverDown();
    if (x.status === 401) {                           // not logged in (or the server was restarted)
      sessionStorage.removeItem("hms_user");
      window.location.href = "index.html";
      throw new HMSStopError("Not logged in");
    }
    let data = null;
    try { data = JSON.parse(x.responseText); } catch (e) { /* not JSON */ }
    return { status: x.status, data };
  },

  _serverDown() {
    const box = document.createElement("div");
    box.style.cssText = "position:fixed;inset:0;z-index:999;background:#fff;padding:40px;font:16px Segoe UI,Arial,sans-serif";
    box.innerHTML = "<h1>Cannot reach the HMS server</h1>" +
      "<p>The app needs its database server. Start it in a terminal inside the project folder:</p>" +
      "<pre style=\"background:#f1f5f9;padding:12px\">python server.py</pre>" +
      "<p>(Windows: <code>py server.py</code> &nbsp; Mac/Linux: <code>python3 server.py</code>), " +
      "then open <b>http://localhost:8000</b></p>";
    document.body.appendChild(box);
    throw new HMSStopError("HMS server not reachable");
  },

  _isApi(key) { return this.apiKeys.indexOf(key) !== -1; },

  // First use on a page: check login, and fill an empty database with the starting data
  _ensureReady() {
    if (this._ready) return;
    const s = this._request("GET", "api/status");
    if (s.status !== 200 || !s.data) this._serverDown();
    if (!s.data.authenticated) {
      sessionStorage.removeItem("hms_user");
      window.location.href = "index.html";
      throw new HMSStopError("Not logged in");
    }
    if (!s.data.seeded && this.seedHook) {
      const r = this._request("POST", "api/seed", { collections: this.seedHook() });
      if (r.status !== 200) this._fail(r.data && r.data.error || "Could not create the starting data.");
    }
    this._ready = true;
  },

  _fail(message) {
    if (typeof HMSLayout !== "undefined" && document.getElementById("toastArea")) HMSLayout.toast(message, "error");
    else alert(message);
    setTimeout(() => window.location.reload(), 2500);     // reload so the screen shows what the database really holds
    throw new HMSStopError(message);
  },

  // ----- the same functions the page scripts always used -----
  load(key, fallback) {
    if (!this._isApi(key)) {                             // browser-only data (e.g. the self-test key)
      try {
        const raw = localStorage.getItem(this.prefix + key);
        return raw ? JSON.parse(raw) : fallback;
      } catch (e) { return fallback; }
    }
    this._ensureReady();
    if (!(key in this._cache)) {
      const r = this._request("GET", "api/data/" + key);
      if (r.status !== 200) this._fail(r.data && r.data.error || "Could not read " + key);
      this._cache[key] = JSON.stringify(r.data.value);
    }
    return JSON.parse(this._cache[key]);                 // a fresh copy each time, like localStorage did
  },

  save(key, value) {
    if (!this._isApi(key)) {
      try { localStorage.setItem(this.prefix + key, JSON.stringify(value)); return true; }
      catch (e) { return false; }
    }
    this._ensureReady();
    const r = this._request("PUT", "api/data/" + key, { value });
    if (r.status !== 200) this._fail(r.data && r.data.error || "The database refused the change.");
    this._cache = {};                                    // other collections may have changed too
    return true;
  },

  remove(key) {
    if (!this._isApi(key)) localStorage.removeItem(this.prefix + key);
  },

  // "Reset demo data": empty the database tables; they are refilled with the dummy data on the next load
  resetAll() {
    this._request("POST", "api/reset");
    this._cache = {};
    this._ready = false;
    sessionStorage.removeItem("hms_notif_sig");
    Object.keys(localStorage).filter((k) => k.startsWith(this.prefix)).forEach((k) => localStorage.removeItem(k));
  },

  // Store the alerts the browser computed (so the database knows what each "read" refers to)
  syncNotifications(list) {
    if (!this._ready) this._ensureReady();
    const items = list.map((n) => ({ key: n.id, category: n.category, level: n.level, message: n.text, href: n.href }));
    const sig = JSON.stringify(items);
    if (sessionStorage.getItem("hms_notif_sig") === sig) return;      // nothing changed since last time
    const r = this._request("POST", "api/notifications/sync", { items });
    if (r.status === 200) sessionStorage.setItem("hms_notif_sig", sig);
  }
};
