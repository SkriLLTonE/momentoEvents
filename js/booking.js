const UZ_COUNTRY = "998";
const PHONE_PREFIX = "+998";
const PHONE_FORMAT_ERROR = "Укажите телефон в формате +998 99 999 99 99";

/** On-screen program names stay as written. website-callback accepts only these four labels. */
const CALLBACK_PROGRAM_BY_CHOICE = {
  "Домашняя программа": "Домашняя программа",
  "Детский сад": "Садик",
  "Школьная программа": "Школа",
  "Корпоратив": "Корпоратив",
};

function callbackProgram(choice) {
  const label = String(choice ?? "").trim();
  return CALLBACK_PROGRAM_BY_CHOICE[label] ?? label;
}

function phoneDigits(value) {
  return String(value ?? "").replace(/\D/g, "");
}

/** Up to 9 national digits. A leading 998 is the country code, except a bare 9-digit number. */
function nationalPhoneDigits(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  const plusAt = raw.indexOf(PHONE_PREFIX);
  if (plusAt !== -1) {
    const before = phoneDigits(raw.slice(0, plusAt));
    const after = phoneDigits(raw.slice(plusAt + PHONE_PREFIX.length));
    if (before.startsWith(UZ_COUNTRY) && before.length >= 12) return before.slice(3, 12);
    return (before + after).slice(0, 9);
  }

  const digits = phoneDigits(raw);
  if (digits.startsWith(UZ_COUNTRY) && digits.length !== 9) return digits.slice(3, 12);
  return digits.slice(0, 9);
}

/**
 * Digits from a keystroke or paste. `previous` is the current field value so deleting
 * the visible +998 prefix does not treat the country code as part of the number.
 */
function nationalDigitsFromInput(raw, previous) {
  const prior = nationalPhoneDigits(previous ?? "");
  const digits = phoneDigits(raw);
  if (!String(raw).includes("+") && prior && digits.startsWith(UZ_COUNTRY)) {
    const rest = digits.slice(UZ_COUNTRY.length, UZ_COUNTRY.length + 9);
    if (rest === prior || prior.startsWith(rest) || rest === prior.slice(0, -1)) return rest;
  }
  return nationalPhoneDigits(raw);
}

function formatPhoneMask(national) {
  const digits = phoneDigits(national).slice(0, 9);
  let out = PHONE_PREFIX;
  if (!digits) return out;
  out += ` ${digits.slice(0, 2)}`;
  if (digits.length > 2) out += ` ${digits.slice(2, 5)}`;
  if (digits.length > 5) out += ` ${digits.slice(5, 7)}`;
  if (digits.length > 7) out += ` ${digits.slice(7, 9)}`;
  return out;
}

/** Nine national digits when the value is a complete Uzbekistan number. */
function completeNationalDigits(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  if (raw.includes("+") && !raw.includes(PHONE_PREFIX)) return null;
  const national = nationalPhoneDigits(raw);
  if (national.length !== 9) return null;
  const digits = phoneDigits(raw);
  if (raw.includes(PHONE_PREFIX) || (digits.startsWith(UZ_COUNTRY) && digits.length >= 12)) {
    return national;
  }
  if (digits.length === 9) return national;
  return null;
}

function normalizeStoredPhone(value) {
  const national = completeNationalDigits(value);
  if (!national) return null;
  return `${PHONE_PREFIX}${national}`;
}

function caretForNationalCount(formatted, count) {
  if (count <= 0) return Math.min(PHONE_PREFIX.length, formatted.length);
  let seen = 0;
  for (let index = PHONE_PREFIX.length; index < formatted.length; index += 1) {
    if (/\d/.test(formatted[index] ?? "")) {
      seen += 1;
      if (seen === count) return index + 1;
    }
  }
  return formatted.length;
}

function nationalCountBeforeCaret(raw, caret) {
  const plusAt = raw.indexOf(PHONE_PREFIX);
  if (plusAt !== -1 && caret <= plusAt + PHONE_PREFIX.length) return 0;
  if (plusAt !== -1) {
    const before = raw.slice(0, plusAt).replace(/\D/g, "");
    const after = raw.slice(plusAt + PHONE_PREFIX.length, caret).replace(/\D/g, "");
    return before.length + after.length;
  }
  const headDigits = raw.slice(0, caret).replace(/\D/g, "");
  const allDigits = raw.replace(/\D/g, "");
  if (allDigits.startsWith("998") && allDigits.length !== 9) {
    return Math.max(0, headDigits.length - 3);
  }
  return headDigits.length;
}

function syncBookingFromCalculator() {
  if (typeof window.applyCalculatorToBooking === "function") {
    window.applyCalculatorToBooking();
  }
}

function showBookingStatus(el, text, kind) {
  if (!el) return;
  el.textContent = text;
  el.hidden = !text;
  el.dataset.kind = kind || "";
}

/** Clear typed fields. Date and time pickers mirror hidden inputs, so their labels reset too. */
function resetBookingForm(form) {
  form.reset();

  const phoneEl = document.getElementById("phone");
  if (phoneEl) phoneEl.value = "";

  form.querySelectorAll(".field--picker").forEach((field) => {
    const input = field.querySelector("input[data-picker-value]");
    const valueEl = field.querySelector(".picker-trigger__value");
    const trigger = field.querySelector(".picker-trigger");
    if (input) input.value = "";
    if (valueEl) {
      valueEl.textContent = valueEl.dataset.placeholder || "";
      valueEl.classList.add("is-placeholder");
    }
    if (trigger) trigger.classList.remove("has-value");
  });

  syncBookingFromCalculator();
}

function clampMessage(value, max, emptyMessage) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed && emptyMessage) return emptyMessage;
  if (trimmed.length > max) return `Не длиннее ${max} символов`;
  return "";
}

function initPhoneField(input) {
  if (!input) return;

  const initial = input.value.trim();
  if (initial) {
    const national = nationalDigitsFromInput(initial, initial).slice(0, 9);
    input.value = national ? formatPhoneMask(national) : "";
  } else {
    input.value = "";
  }

  function commit(raw, caret) {
    const previous = input.value;
    const nextNational = nationalDigitsFromInput(raw, previous).slice(0, 9);
    const caretDigits = Math.min(nationalCountBeforeCaret(raw, caret), nextNational.length);
    // While editing, mirror CRM: empty national still shows the +998 prefix.
    const display = formatPhoneMask(nextNational);
    input.value = display;
    const pos = caretForNationalCount(display, caretDigits);
    requestAnimationFrame(() => {
      input.setSelectionRange(pos, pos);
    });
  }

  input.addEventListener("focus", () => {
    if (!input.value.trim()) {
      input.value = formatPhoneMask("");
    }
    const start = input.selectionStart ?? 0;
    if (start <= PHONE_PREFIX.length) {
      const end = input.value.length;
      requestAnimationFrame(() => input.setSelectionRange(end, end));
    }
  });

  input.addEventListener("blur", () => {
    const national = nationalDigitsFromInput(input.value, input.value).slice(0, 9);
    // Clear bare "+998" so the placeholder stays visible when untouched.
    input.value = national ? formatPhoneMask(national) : "";
  });

  input.addEventListener("keydown", (event) => {
    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? start;
    if (event.key !== "Backspace" && event.key !== "Delete") return;
    if (start === end && start <= PHONE_PREFIX.length && event.key === "Backspace") {
      event.preventDefault();
    }
    if (start === end && start < PHONE_PREFIX.length && event.key === "Delete") {
      event.preventDefault();
    }
  });

  input.addEventListener("input", () => {
    const caret = input.selectionStart ?? input.value.length;
    commit(input.value, caret);
  });

  input.addEventListener("paste", (event) => {
    event.preventDefault();
    const shown = input.value || formatPhoneMask("");
    const start = input.selectionStart ?? shown.length;
    const end = input.selectionEnd ?? start;
    const pasted = event.clipboardData.getData("text");
    const raw = `${shown.slice(0, start)}${pasted}${shown.slice(end)}`;
    commit(raw, start + pasted.length);
  });
}

function initBooking() {
  const form = document.getElementById("bookingForm");
  if (!form) return;

  if (typeof window.initCustomPickers === "function") {
    window.initCustomPickers(form);
  }

  const statusEl = document.getElementById("bookingStatus");
  const submitBtn = form.querySelector('button[type="submit"]');
  const phoneEl = document.getElementById("phone");
  initPhoneField(phoneEl);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    showBookingStatus(statusEl, "", "");

    syncBookingFromCalculator();

    const nameEl = document.getElementById("name");
    const dateEl = document.getElementById("date");
    const timeEl = document.getElementById("time");
    const addressEl = document.getElementById("address");
    const programEl = document.getElementById("selectedProgram");
    const durationEl = document.getElementById("selectedDuration");
    const extraEl = document.getElementById("selectedExtra");
    const commentEl = document.getElementById("comment");
    const websiteEl = document.getElementById("website");

    const name = nameEl.value.trim();
    const phone = phoneEl.value.trim();
    const date = dateEl.value.trim();
    const time = timeEl.value.trim();
    const address = addressEl.value.trim();
    const programChoice = programEl.value.trim();
    const program = callbackProgram(programChoice);
    const duration = durationEl.value.trim();
    const extra = extraEl.value.trim();
    const comment = commentEl.value.trim();
    const website = websiteEl ? websiteEl.value : "";

    const nameError = clampMessage(name, 120, "Укажите имя");
    if (nameError) {
      showBookingStatus(statusEl, nameError, "error");
      nameEl.focus();
      return;
    }

    const phoneLengthError = clampMessage(phone, 40, "Укажите телефон");
    if (phoneLengthError) {
      showBookingStatus(statusEl, phoneLengthError, "error");
      phoneEl.focus();
      return;
    }

    if (!normalizeStoredPhone(phone)) {
      showBookingStatus(statusEl, PHONE_FORMAT_ERROR, "error");
      phoneEl.focus();
      return;
    }

    if (!date || !time) {
      const missing = !date
        ? document.getElementById("date-trigger")
        : document.getElementById("time-trigger");
      if (missing) missing.focus();
      return;
    }

    const addressError = clampMessage(address, 300, "Укажите адрес");
    if (addressError) {
      showBookingStatus(statusEl, addressError, "error");
      addressEl.focus();
      return;
    }

    const programError = clampMessage(programChoice, 200);
    if (programError) {
      showBookingStatus(statusEl, programError, "error");
      return;
    }

    const durationError = clampMessage(duration, 80);
    if (durationError) {
      showBookingStatus(statusEl, durationError, "error");
      return;
    }

    const extraError = clampMessage(extra, 300);
    if (extraError) {
      showBookingStatus(statusEl, extraError, "error");
      return;
    }

    const commentError = clampMessage(comment, 1000);
    if (commentError) {
      showBookingStatus(statusEl, commentError, "error");
      commentEl.focus();
      return;
    }

    // file:// sends Origin: null. The CRM answers that preflight with 403 and no
    // Access-Control-Allow-Origin, so the POST never leaves the browser.
    if (window.location.protocol === "file:") {
      showBookingStatus(
        statusEl,
        "Заявка не ушла: страница открыта как файл. Откройте сайт по адресу http или https.",
        "error",
      );
      return;
    }

    const payload = {
      name,
      phone,
      date,
      time,
      address,
      program,
      duration,
      extra,
      comment,
      website,
    };

    if (submitBtn) submitBtn.disabled = true;

    try {
      // Same-origin. The CRM allowlist rejects this site's Origin (and answers
      // OPTIONS without CORS headers), so the page posts here and the host
      // forwards the JSON. See api/public/website-callback.js and dev-server.py.
      const response = await fetch("/api/public/website-callback", {
        method: "POST",
        credentials: "omit",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let data = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (response.status === 200 && data && data.ok === true) {
        resetBookingForm(form);
        showBookingStatus(
          statusEl,
          "Заявка отправлена. Менеджер свяжется с вами.",
          "success",
        );
        statusEl?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        return;
      }

      if (
        (response.status === 400 || response.status === 403 || response.status === 500) &&
        data &&
        typeof data.error === "string" &&
        data.error.trim()
      ) {
        showBookingStatus(statusEl, data.error.trim(), "error");
        return;
      }

      showBookingStatus(
        statusEl,
        "Не удалось отправить заявку. Попробуйте ещё раз.",
        "error",
      );
    } catch {
      showBookingStatus(
        statusEl,
        "Не удалось отправить заявку. Попробуйте ещё раз.",
        "error",
      );
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}
