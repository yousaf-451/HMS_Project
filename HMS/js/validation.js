/* =========================================================
   validation.js — Reusable frontend validation rules
   Each rule returns "" (valid) or an error message string.
   Convention: a field with id="pFirst" sits inside
   <div class="form-group" id="g-pFirst"> and has an error
   <div class="field-error" id="e-pFirst">.
   ========================================================= */

const HMSValidate = {
  // Show or clear the error message for one field
  setError(fieldId, message) {
    const group = document.getElementById("g-" + fieldId);
    const box = document.getElementById("e-" + fieldId);
    const input = document.getElementById(fieldId);
    if (group) group.classList.toggle("has-error", !!message);
    if (box) box.textContent = message || "";
    if (input) {
      input.setAttribute("aria-invalid", message ? "true" : "false");
      input.setAttribute("aria-describedby", "e-" + fieldId);
    }
  },

  clearAll(form) {
    form.querySelectorAll(".form-group").forEach((g) => g.classList.remove("has-error"));
    form.querySelectorAll(".field-error").forEach((e) => (e.textContent = ""));
    form.querySelectorAll("[aria-invalid]").forEach((i) => i.removeAttribute("aria-invalid"));
  },

  required(value, label) {
    return String(value).trim() ? "" : `${label} is required.`;
  },

  // Letters, spaces, apostrophe, hyphen. 2 to 40 characters.
  personName(value, label, required = true) {
    const v = value.trim();
    if (!v) return required ? `${label} is required.` : "";
    if (v.length < 2 || v.length > 40) return `${label} must be 2 to 40 characters.`;
    if (!/^[A-Za-z][A-Za-z\s'.-]*$/.test(v)) return `${label} may contain letters, spaces, . ' - only.`;
    return "";
  },

  // Local mobile format: 03XX-XXXXXXX
  phone(value, label, required = true) {
    const v = value.trim();
    if (!v) return required ? `${label} is required.` : "";
    if (!/^03\d{2}-\d{7}$/.test(v)) return `${label} must look like 0300-1234567.`;
    return "";
  },

  // Optional email: if entered, must be valid and max 80 chars
  email(value, label = "Email", required = false) {
    const v = value.trim();
    if (!v) return required ? `${label} is required.` : "";
    if (v.length > 80) return `${label} must be 80 characters or fewer.`;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return `Enter a valid ${label.toLowerCase()} (e.g. name@example.com).`;
    return "";
  },

  // Date of birth: valid date, not in the future, age 120 or less
  dob(value) {
    if (!value) return "Date of birth is required.";
    const d = new Date(value + "T00:00:00");
    if (isNaN(d)) return "Enter a valid date.";
    if (value > HMSUtils.today()) return "Date of birth cannot be in the future.";
    if (HMSUtils.calcAge(value) > 120) return "Age cannot be more than 120 years.";
    return "";
  },

  maxLength(value, max, label) {
    return value.length > max ? `${label} must be ${max} characters or fewer.` : "";
  },

  // Number rule: required/optional, min..max range, optionally whole numbers only
  numberRange(value, min, max, label, integerOnly = false, required = true) {
    const v = String(value).trim();
    if (v === "") return required ? `${label} is required.` : "";
    const n = Number(v);
    if (isNaN(n)) return `${label} must be a number.`;
    if (integerOnly && !Number.isInteger(n)) return `${label} must be a whole number.`;
    if (n < min || n > max) return `${label} must be between ${min} and ${max}.`;
    return "";
  },

  // Validates a whole form from a { fieldId: validatorFunction } map.
  // Shows errors, focuses the first invalid field, returns true if all valid.
  runAll(validators) {
    let firstBad = null;
    Object.entries(validators).forEach(([id, fn]) => {
      const msg = fn(document.getElementById(id).value);
      this.setError(id, msg);
      if (msg && !firstBad) firstBad = id;
    });
    if (firstBad) document.getElementById(firstBad).focus();
    return !firstBad;
  }
};
