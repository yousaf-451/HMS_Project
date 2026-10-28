/* =========================================================
   notifications.js — Notification Center
   The list comes from HMSData.buildNotifications() (see data.js).
   Only the "which ones are read" list is stored, as ids.
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const esc = HMSUtils.escapeHtml;
  const $ = (id) => document.getElementById(id);
  const all = HMSData.buildNotifications();
  let read = HMSData.readNotifications();

  const isRead = (n) => read.includes(n.id);
  function save() {
    HMSStore.save("readNotifs", read);
    HMSLayout.refreshBell();
    render();
  }

  function render() {
    const rf = $("readFilter").value, cf = $("catFilter").value;
    const list = all.filter((n) =>
      (!cf || n.category === cf) && (!rf || (rf === "unread" ? !isRead(n) : isRead(n))));
    const unread = all.filter((n) => !isRead(n)).length;
    $("resultCount").textContent = `${unread} unread of ${all.length} notifications · showing ${list.length}`;

    $("notifList").innerHTML = list.length
      ? list.map((n) => `
          <li class="notif ${n.level} ${isRead(n) ? "read" : "unread"}">
            <span aria-hidden="true">${n.icon}</span>
            <div class="grow">
              <a href="${n.href}" data-nid="${esc(n.id)}">${esc(n.text)}</a>
              <small class="text-muted">${n.category}${n.level === "danger" ? " · Urgent" : ""}</small>
            </div>
            ${isRead(n) ? "" : '<span class="badge badge-info">New</span>'}
            <button class="btn btn-sm" type="button" data-toggle="${esc(n.id)}">${isRead(n) ? "Mark unread" : "Mark read"}</button>
          </li>`).join("")
      : '<li class="empty-state">No notifications match these filters.</li>';
  }

  $("notifList").addEventListener("click", (e) => {
    const t = e.target.closest("[data-toggle]");
    if (t) {
      const id = t.dataset.toggle;
      read = read.includes(id) ? read.filter((x) => x !== id) : [...read, id];
      save();
      const again = [...document.querySelectorAll("[data-toggle]")].find((b) => b.dataset.toggle === id);
      if (again) again.focus();
      return;
    }
    const link = e.target.closest("a[data-nid]");
    if (link && !read.includes(link.dataset.nid)) {
      read.push(link.dataset.nid);
      HMSStore.save("readNotifs", read);
    }
  });

  $("markAllRead").addEventListener("click", () => {
    read = [...new Set([...read, ...all.map((n) => n.id)])];
    save();
    HMSLayout.toast("All notifications marked as read.", "info");
  });
  $("markAllUnread").addEventListener("click", () => {
    read = read.filter((id) => !all.some((n) => n.id === id));
    save();
    HMSLayout.toast("All notifications marked as unread.", "info");
  });

  ["readFilter", "catFilter"].forEach((id) => $(id).addEventListener("change", render));
  render();
});
