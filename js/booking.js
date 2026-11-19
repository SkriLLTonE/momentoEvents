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

function clampMessage(value, max, emptyMessage) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed && emptyMessage) return emptyMessage;
  if (trimmed.length > max) return `Не длиннее ${max} символов`;
  return "";
}

function initBooking() {
  const form = document.getElementById("bookingForm");
  if (!form) return;

  if (typeof window.initCustomPickers === "function") {
    window.initCustomPickers(form);
  }

  const statusEl = document.getElementById("bookingStatus");
  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    showBookingStatus(statusEl, "", "");

    syncBookingFromCalculator();

    const nameEl = document.getElementById("name");
    const phoneEl = document.getElementById("phone");
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
    const program = programEl.value.trim();
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

    const phoneError = clampMessage(phone, 40, "Укажите телефон");
    if (phoneError) {
      showBookingStatus(statusEl, phoneError, "error");
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

    const programError = clampMessage(program, 200);
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

    const crmOrigin = String(window.MOMENTO_CRM_ORIGIN || "").replace(/\/$/, "");
    if (!crmOrigin) {
      showBookingStatus(
        statusEl,
        "Адрес CRM не задан. Укажите window.MOMENTO_CRM_ORIGIN в js/config.js",
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
      const response = await fetch(`${crmOrigin}/api/public/website-callback`, {
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
        showBookingStatus(
          statusEl,
          "Заявка отправлена, менеджер свяжется с вами",
          "success",
        );
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
