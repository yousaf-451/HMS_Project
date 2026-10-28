/* =========================================================
   ui.js — Shared modal helpers (accessible)
   Usage:  HMSUI.open("modalId")   HMSUI.close("modalId")
           HMSUI.confirm("Are you sure?", () => {...})
   Any element with the attribute data-close closes its modal.
   ========================================================= */

const HMSUI = {
  _lastFocus: null,   // remembers which button opened the modal

  open(id) {
    const modal = document.getElementById(id);
    this._lastFocus = document.activeElement;
    modal.classList.remove("hidden");
    // Move keyboard focus into the modal (first editable field, else first button)
    const first = modal.querySelector("input:not([readonly]):not([type=hidden]), select, textarea") ||
                  modal.querySelector("button");
    if (first) first.focus();
  },

  close(id) {
    document.getElementById(id).classList.add("hidden");
    // Give focus back to the button that opened the modal
    if (this._lastFocus && document.body.contains(this._lastFocus)) this._lastFocus.focus();
  },

  // Confirmation dialog (replaces the ugly browser confirm())
  confirm(message, onYes, yesText = "Yes, delete") {
    let modal = document.getElementById("confirmModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "confirmModal";
      modal.className = "modal-backdrop hidden";
      modal.innerHTML = `
        <div class="modal modal-sm" role="alertdialog" aria-modal="true" aria-labelledby="confirmTitle" aria-describedby="confirmText">
          <div class="modal-header"><h2 id="confirmTitle">Please confirm</h2></div>
          <div class="modal-body"><p id="confirmText"></p></div>
          <div class="modal-footer">
            <button class="btn" type="button" data-close>Cancel</button>
            <button class="btn btn-danger" type="button" id="confirmYes"></button>
          </div>
        </div>`;
      document.body.appendChild(modal);
    }
    document.getElementById("confirmText").textContent = message;
    const yes = document.getElementById("confirmYes");
    yes.textContent = yesText;
    // Replace the button to remove old click handlers
    const fresh = yes.cloneNode(true);
    yes.replaceWith(fresh);
    fresh.addEventListener("click", () => { HMSUI.close("confirmModal"); onYes(); });
    this.open("confirmModal");
  }
};

// Escape key closes any open modal
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    document.querySelectorAll(".modal-backdrop:not(.hidden)").forEach((m) => HMSUI.close(m.id));
  }
});

// Click on dark backdrop, or on any [data-close] element, closes the modal
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("modal-backdrop")) HMSUI.close(e.target.id);
  const closer = e.target.closest("[data-close]");
  if (closer) HMSUI.close(closer.closest(".modal-backdrop").id);
});

// Focus trap: Tab and Shift+Tab stay inside the open modal
document.addEventListener("keydown", (e) => {
  if (e.key !== "Tab") return;
  const open = [...document.querySelectorAll(".modal-backdrop:not(.hidden)")].pop();   // topmost modal
  if (!open) return;
  const items = [...open.querySelectorAll(
    "a[href], button:not([disabled]), input:not([disabled]):not([type=hidden]), select:not([disabled]), textarea:not([disabled])"
  )].filter((el) => el.offsetParent !== null);
  if (!items.length) return;
  const first = items[0], last = items[items.length - 1];
  if (!open.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
  else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
});
