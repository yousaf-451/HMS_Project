/* =========================================================
   utils.js — Shared helper functions used across all modules
   ========================================================= */

const HMSUtils = {
  // Converts a Date object to "YYYY-MM-DD" using the LOCAL time zone
  toISO(d) {
    return d.getFullYear() + "-" +
      String(d.getMonth() + 1).padStart(2, "0") + "-" +
      String(d.getDate()).padStart(2, "0");
  },

  // Today's date as "YYYY-MM-DD" (format used by <input type="date">)
  today() {
    return this.toISO(new Date());
  },

  // "2026-09-30" → "30 Sep 2026"
  formatDate(isoDate) {
    if (!isoDate) return "—";
    const d = new Date(isoDate + "T00:00:00");
    if (isNaN(d)) return "—";
    return d.toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric"
    });
  },

  // Age in years from a date of birth
  calcAge(dob) {
    const birth = new Date(dob + "T00:00:00");
    if (isNaN(birth)) return "";
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const hadBirthday =
      now.getMonth() > birth.getMonth() ||
      (now.getMonth() === birth.getMonth() && now.getDate() >= birth.getDate());
    if (!hadBirthday) age--;
    return age;
  },

  // Next ID such as PAT-0011 from a list and a prefix
  nextId(prefix, list, field) {
    const numbers = list.map((item) => parseInt(item[field].split("-")[1], 10) || 0);
    const next = (numbers.length ? Math.max(...numbers) : 0) + 1;
    return prefix + "-" + String(next).padStart(4, "0");
  },

  // Format money: 1234.5 → "$1,234.50"
  money(amount) {
    return "$" + Number(amount || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2, maximumFractionDigits: 2
    });
  },

  // Prevents HTML injection when inserting user text into the page.
  // Escapes quotes too, so it is also safe inside attributes like value="..."
  escapeHtml(text) {
    return String(text == null ? "" : text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  },

  // Waits until the user stops typing (used for live search)
  debounce(fn, delay = 250) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }
};
