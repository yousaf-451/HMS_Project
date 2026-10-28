/* =========================================================
   layout.js — Shared sidebar, header, toast messages, login guard
   Each page needs: <body data-page="dashboard">,
   <aside id="sidebar">, <header id="topbar">
   ========================================================= */

const HMSLayout = {
  // Core modules first, supporting pages after
  nav: [
    { label: "Main", items: [{ id: "dashboard", text: "Dashboard", icon: "🏠", href: "dashboard.html" }] },
    { label: "Core Modules", items: [
      { id: "patients", text: "Patients", icon: "🧑", href: "patients.html" },
      { id: "doctors", text: "Doctors", icon: "🩺", href: "doctors.html" },
      { id: "appointments", text: "Appointments", icon: "📅", href: "appointments.html" },
      { id: "medical-records", text: "Medical Records", icon: "📋", href: "medical-records.html" },
      { id: "billing", text: "Billing", icon: "💳", href: "billing.html" },
      { id: "pharmacy", text: "Pharmacy", icon: "💊", href: "pharmacy.html" }
    ] },
    { label: "Supporting", items: [
      { id: "reports", text: "Reports", icon: "📊", href: "reports.html" },
      { id: "notifications", text: "Notifications", icon: "🔔", href: "notifications.html" }
    ] }
  ],

  init() {
    // Login guard: prototype only, NOT real security
    if (sessionStorage.getItem("hms_user") === null) {
      window.location.href = "index.html";
      return;
    }
    this.renderSidebar();
    this.renderTopbar();
    const area = document.createElement("div");
    area.className = "toast-area";
    area.id = "toastArea";
    area.setAttribute("aria-live", "polite");
    document.body.appendChild(area);

    // Skip link for keyboard and screen-reader users
    const mainEl = document.querySelector("main");
    if (mainEl) {
      if (!mainEl.id) mainEl.id = "main-content";
      mainEl.setAttribute("tabindex", "-1");
      const skip = document.createElement("a");
      skip.className = "skip-link";
      skip.href = "#" + mainEl.id;
      skip.textContent = "Skip to main content";
      document.body.prepend(skip);
    }
  },

  renderSidebar() {
    const current = document.body.dataset.page;
    const links = this.nav.map((group) =>
      `<div class="nav-label">${group.label}</div>` +
      group.items.map((i) =>
        `<a class="nav-link ${i.id === current ? "active" : ""}" href="${i.href}"
            ${i.id === current ? 'aria-current="page"' : ""}>
           <span aria-hidden="true">${i.icon}</span> ${i.text}</a>`).join("")
    ).join("");
    document.getElementById("sidebar").outerHTML =
      `<aside class="sidebar" id="sidebar" aria-label="Main navigation">
         <div class="sidebar-brand">🏥 HMS<small>Hospital Management System</small></div>
         <nav>${links}</nav>
         <div class="sidebar-footer">Database: SQLite<br>Dummy data only</div>
       </aside>`;
  },

  renderTopbar() {
    const user = JSON.parse(sessionStorage.getItem("hms_user"));
    document.getElementById("topbar").innerHTML = `
      <button class="btn menu-toggle" id="menuToggle" aria-label="Open menu">☰</button>
      <form class="global-search" id="globalSearchForm" role="search">
        <label class="visually-hidden" for="globalSearch">Search hospital records</label>
        <input type="search" id="globalSearch" placeholder="Search patients, doctors, invoices, medicines...">
      </form>
      <div class="topbar-right">
        <a class="btn btn-sm" id="bellLink" href="notifications.html" aria-label="Notifications"></a>
        <button class="btn btn-sm" id="resetDemo" title="Restore original dummy data">Reset demo data</button>
        <span class="user-name">${HMSUtils.escapeHtml(user.name)}</span>
        <button class="btn btn-sm" id="logoutBtn">Logout</button>
      </div>`;

    this.refreshBell();   // shows the unread count on the bell

    document.getElementById("menuToggle").addEventListener("click", () =>
      document.getElementById("sidebar").classList.toggle("open"));

    // Mobile: close the menu by clicking outside it or pressing Escape
    document.addEventListener("click", (e) => {
      const sb = document.getElementById("sidebar");
      if (sb.classList.contains("open") && !sb.contains(e.target) && !e.target.closest("#menuToggle")) {
        sb.classList.remove("open");
      }
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") document.getElementById("sidebar").classList.remove("open");
    });

    document.getElementById("logoutBtn").addEventListener("click", () => {
      sessionStorage.removeItem("hms_user");
      sessionStorage.removeItem("hms_notif_sig");
      // tell the server to forget the login, then go back to the login page
      fetch("api/logout", { method: "POST" }).catch(() => {}).then(() => { window.location.href = "index.html"; });
    });

    document.getElementById("resetDemo").addEventListener("click", () => {
      if (confirm("Empty the database tables and reload the original dummy data?")) {
        HMSStore.resetAll();
        window.location.reload();
      }
    });

    // Global search: validates, then opens search.html?q=...
    const searchInput = document.getElementById("globalSearch");
    if (document.body.dataset.page === "search") {
      searchInput.value = new URLSearchParams(window.location.search).get("q") || "";
    }
    document.getElementById("globalSearchForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const q = searchInput.value.trim();
      if (q.length < 2) { this.toast("Type at least 2 characters to search.", "error"); return; }
      window.location.href = "search.html?q=" + encodeURIComponent(q);
    });
  },

  // Redraws the bell with the current unread notification count
  refreshBell() {
    const bell = document.getElementById("bellLink");
    if (!bell) return;
    const n = HMSData.unreadCount();
    bell.setAttribute("aria-label", `Notifications, ${n} unread`);
    bell.innerHTML = "🔔" + (n ? ` <span class="badge badge-danger">${n}</span>` : "");
  },

  // Show a temporary message. type: success | error | info
  toast(message, type = "success") {
    const el = document.createElement("div");
    el.className = "toast toast-" + type;
    el.textContent = message;
    document.getElementById("toastArea").appendChild(el);
    setTimeout(() => el.remove(), 3500);
  }
};

document.addEventListener("DOMContentLoaded", () => HMSLayout.init());
