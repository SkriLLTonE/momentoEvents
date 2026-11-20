(function () {
  const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const MONTHS = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];
  const TIME_START = 9 * 60;
  const TIME_END = 22 * 60;
  const TIME_STEP = 30;

  let openPicker = null;

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function toISODate(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function parseISODate(value) {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const [y, m, d] = value.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
    return date;
  }

  function formatDisplayDate(iso) {
    const date = parseISODate(iso);
    if (!date) return '';
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function sameDay(a, b) {
    return a && b
      && a.getFullYear() === b.getFullYear()
      && a.getMonth() === b.getMonth()
      && a.getDate() === b.getDate();
  }

  function minutesToTime(mins) {
    return `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`;
  }

  function buildTimeOptions() {
    const options = [];
    for (let m = TIME_START; m <= TIME_END; m += TIME_STEP) {
      options.push(minutesToTime(m));
    }
    return options;
  }

  function placePopover(popover, trigger) {
    const field = trigger.closest('.field--picker') || trigger;
    const rect = field.getBoundingClientRect();
    const gap = 8;
    const margin = 12;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    popover.style.visibility = 'hidden';
    popover.hidden = false;
    popover.classList.add('is-open');
    popover.style.maxHeight = '';

    const timeList = popover.querySelector('.picker-time-list');
    if (timeList) timeList.style.maxHeight = '';

    // Match the full width of the date/time field; clamp only if it would leave the viewport.
    let width = Math.round(rect.width);
    let left = rect.left;
    const maxWidth = vw - margin * 2;

    if (width > maxWidth) width = maxWidth;
    if (left + width > vw - margin) left = vw - margin - width;
    if (left < margin) left = margin;

    popover.style.width = `${width}px`;
    popover.style.maxWidth = `${maxWidth}px`;

    // Keep the time grid scrollable within available viewport space.
    if (timeList) {
      const spaceBelow = vh - margin - (rect.bottom + gap);
      const spaceAbove = rect.top - gap - margin;
      const available = Math.max(120, Math.max(spaceBelow, spaceAbove) - 28);
      const cssCap = Math.round(Math.min(280, vh * 0.5));
      timeList.style.maxHeight = `${Math.min(cssCap, available)}px`;
    }

    const height = popover.offsetHeight;
    let top = rect.bottom + gap;
    const openUp = top + height > vh - margin && rect.top - gap - height > margin;

    if (openUp) {
      top = rect.top - gap - height;
      popover.classList.add('is-above');
    } else {
      popover.classList.remove('is-above');
      if (top + height > vh - margin) {
        top = Math.max(margin, vh - margin - height);
      }
    }

    popover.style.left = `${Math.round(left)}px`;
    popover.style.top = `${Math.round(top)}px`;
    popover.style.visibility = '';
  }

  function closeOpenPicker() {
    if (openPicker) openPicker.close();
  }

  function createPopover(id) {
    const el = document.createElement('div');
    el.className = 'picker-popover';
    el.id = id;
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'false');
    el.hidden = true;
    document.body.appendChild(el);
    return el;
  }

  function initDatePicker(field) {
    const trigger = field.querySelector('.picker-trigger');
    const valueEl = field.querySelector('.picker-trigger__value');
    const input = field.querySelector('input[data-picker-value="date"]');
    if (!trigger || !valueEl || !input) return null;

    const popover = createPopover('date-picker-popover');
    popover.setAttribute('aria-label', 'Выбор даты');

    let viewYear;
    let viewMonth;
    const today = startOfDay(new Date());

    function syncFromInput() {
      const selected = parseISODate(input.value) || today;
      viewYear = selected.getFullYear();
      viewMonth = selected.getMonth();
      valueEl.textContent = input.value
        ? formatDisplayDate(input.value)
        : valueEl.dataset.placeholder || 'Выберите дату';
      valueEl.classList.toggle('is-placeholder', !input.value);
      trigger.classList.toggle('has-value', Boolean(input.value));
    }

    function selectDay(date) {
      input.value = toISODate(date);
      input.dispatchEvent(new Event('change', { bubbles: true }));
      syncFromInput();
      close();
      trigger.focus();
    }

    function render() {
      const selected = parseISODate(input.value);
      const first = new Date(viewYear, viewMonth, 1);
      const startOffset = (first.getDay() + 6) % 7;
      const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
      const prevDays = new Date(viewYear, viewMonth, 0).getDate();

      let cells = '';
      for (let i = 0; i < 42; i += 1) {
        let dayNum;
        let cellDate;
        let outside = false;

        if (i < startOffset) {
          dayNum = prevDays - startOffset + i + 1;
          cellDate = new Date(viewYear, viewMonth - 1, dayNum);
          outside = true;
        } else if (i >= startOffset + daysInMonth) {
          dayNum = i - startOffset - daysInMonth + 1;
          cellDate = new Date(viewYear, viewMonth + 1, dayNum);
          outside = true;
        } else {
          dayNum = i - startOffset + 1;
          cellDate = new Date(viewYear, viewMonth, dayNum);
        }

        const iso = toISODate(cellDate);
        const isPast = cellDate < today;
        const isToday = sameDay(cellDate, today);
        const isSelected = selected && sameDay(cellDate, selected);
        const classes = [
          'picker-day',
          outside ? 'is-outside' : '',
          isPast ? 'is-disabled' : '',
          isToday ? 'is-today' : '',
          isSelected ? 'is-selected' : ''
        ].filter(Boolean).join(' ');

        cells += `<button type="button" class="${classes}" data-date="${iso}" ${isPast ? 'disabled' : ''} aria-label="${iso}" ${isSelected ? 'aria-pressed="true"' : 'aria-pressed="false"'}>${dayNum}</button>`;
      }

      popover.innerHTML = `
        <div class="picker-calendar">
          <div class="picker-cal-header">
            <button type="button" class="picker-nav" data-nav="-1" aria-label="Предыдущий месяц">‹</button>
            <div class="picker-cal-title">${MONTHS[viewMonth]} ${viewYear}</div>
            <button type="button" class="picker-nav" data-nav="1" aria-label="Следующий месяц">›</button>
          </div>
          <div class="picker-weekdays">${WEEKDAYS.map((d) => `<span>${d}</span>`).join('')}</div>
          <div class="picker-days">${cells}</div>
        </div>
      `;

      popover.querySelectorAll('[data-nav]').forEach((btn) => {
        btn.addEventListener('click', (event) => {
          event.stopPropagation();
          const delta = Number(btn.dataset.nav);
          const next = new Date(viewYear, viewMonth + delta, 1);
          viewYear = next.getFullYear();
          viewMonth = next.getMonth();
          render();
          placePopover(popover, trigger);
        });
      });

      popover.querySelectorAll('.picker-day:not(:disabled)').forEach((btn) => {
        btn.addEventListener('click', (event) => {
          event.stopPropagation();
          const date = parseISODate(btn.dataset.date);
          if (date) selectDay(date);
        });
      });
    }

    function open() {
      if (openPicker && openPicker !== api) openPicker.close();
      syncFromInput();
      render();
      placePopover(popover, trigger);
      trigger.setAttribute('aria-expanded', 'true');
      openPicker = api;
    }

    function close() {
      popover.hidden = true;
      popover.classList.remove('is-open', 'is-above');
      popover.style.visibility = '';
      trigger.setAttribute('aria-expanded', 'false');
      if (openPicker === api) openPicker = null;
    }

    function toggle() {
      if (openPicker === api) close();
      else open();
    }

    const api = { open, close, toggle, contains: (node) => field.contains(node) || popover.contains(node) };

    bindPickerOpen(field, trigger, toggle);

    syncFromInput();
    return api;
  }

  function initTimePicker(field) {
    const trigger = field.querySelector('.picker-trigger');
    const valueEl = field.querySelector('.picker-trigger__value');
    const input = field.querySelector('input[data-picker-value="time"]');
    if (!trigger || !valueEl || !input) return null;

    const popover = createPopover('time-picker-popover');
    popover.setAttribute('aria-label', 'Выбор времени');
    const times = buildTimeOptions();

    function syncFromInput() {
      valueEl.textContent = input.value || valueEl.dataset.placeholder || 'Выберите время';
      valueEl.classList.toggle('is-placeholder', !input.value);
      trigger.classList.toggle('has-value', Boolean(input.value));
    }

    function selectTime(value) {
      input.value = value;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      syncFromInput();
      close();
      trigger.focus();
    }

    function render() {
      const items = times.map((time) => {
        const selected = input.value === time;
        return `<button type="button" class="picker-time${selected ? ' is-selected' : ''}" data-time="${time}" ${selected ? 'aria-pressed="true"' : 'aria-pressed="false"'}>${time}</button>`;
      }).join('');

      popover.innerHTML = `
        <div class="picker-time-list" role="listbox" aria-label="Доступное время">
          ${items}
        </div>
      `;

      popover.querySelectorAll('.picker-time').forEach((btn) => {
        btn.addEventListener('click', (event) => {
          event.stopPropagation();
          selectTime(btn.dataset.time);
        });
      });
    }

    function scrollSelectedIntoView() {
      const list = popover.querySelector('.picker-time-list');
      const selectedBtn = popover.querySelector('.picker-time.is-selected');
      if (!list || !selectedBtn) return;

      // Scroll only the time grid — never the page (page scroll closes the picker).
      const listRect = list.getBoundingClientRect();
      const btnRect = selectedBtn.getBoundingClientRect();
      const delta =
        (btnRect.top + btnRect.bottom) / 2 - (listRect.top + listRect.bottom) / 2;
      list.scrollTop += delta;
    }

    function open() {
      if (openPicker && openPicker !== api) openPicker.close();
      syncFromInput();
      render();
      placePopover(popover, trigger);
      trigger.setAttribute('aria-expanded', 'true');
      openPicker = api;
      scrollSelectedIntoView();
    }

    function close() {
      const list = popover.querySelector('.picker-time-list');
      if (list) list.style.maxHeight = '';
      popover.hidden = true;
      popover.classList.remove('is-open', 'is-above');
      popover.style.visibility = '';
      popover.style.maxHeight = '';
      trigger.setAttribute('aria-expanded', 'false');
      if (openPicker === api) openPicker = null;
    }

    function toggle() {
      if (openPicker === api) close();
      else open();
    }

    const api = { open, close, toggle, contains: (node) => field.contains(node) || popover.contains(node) };

    bindPickerOpen(field, trigger, toggle);

    syncFromInput();
    return api;
  }

  function bindPickerOpen(field, trigger, toggle) {
    const label = field.querySelector('label');

    // Prevent label→button synthetic click from toggling twice.
    if (label) {
      label.addEventListener('click', (event) => {
        event.preventDefault();
        toggle();
      });
    }

    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggle();
    });

    field.addEventListener('click', (event) => {
      if (event.target === field) toggle();
    });

    trigger.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggle();
      }
    });
  }

  function initCustomPickers(form) {
    const pickers = [];

    form.querySelectorAll('.field--picker[data-picker="date"]').forEach((field) => {
      const api = initDatePicker(field);
      if (api) pickers.push(api);
    });

    form.querySelectorAll('.field--picker[data-picker="time"]').forEach((field) => {
      const api = initTimePicker(field);
      if (api) pickers.push(api);
    });

    document.addEventListener('click', (event) => {
      if (!openPicker) return;
      if (openPicker.contains(event.target)) return;
      closeOpenPicker();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeOpenPicker();
    });

    window.addEventListener('resize', closeOpenPicker);

    // Close on page scroll, but not when the user scrolls inside the picker
    // (e.g. the time grid). Capture phase sees element scrolls too.
    window.addEventListener('scroll', (event) => {
      if (!openPicker) return;
      const target = event.target;
      if (
        target &&
        target !== document &&
        target !== document.documentElement &&
        target !== document.body &&
        openPicker.contains(target)
      ) {
        return;
      }
      closeOpenPicker();
    }, true);

    return pickers;
  }

  window.initCustomPickers = initCustomPickers;
})();
