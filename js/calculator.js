const PHOTO_PRICE = 500000;

let selectedName = 'Домашняя программа';
let selectedPrice = 1500000;
let selectedMinutes = 60;

function formatPrice(value) {
  return `${new Intl.NumberFormat('ru-RU').format(value)} сум`;
}

function updateTotalSelection() {
  const totalSelection = document.getElementById('totalSelection');
  if (!totalSelection) return;
  totalSelection.textContent = `${selectedName} · ${selectedMinutes} мин`;
}

function calculate() {
  const photoSwitch = document.getElementById('photoSwitch');
  const totalPrice = document.getElementById('totalPrice');
  if (!photoSwitch || !totalPrice) return 0;

  const multiplier = 1 + ((selectedMinutes - 60) / 30) * 0.25;
  const photo = photoSwitch.checked ? PHOTO_PRICE : 0;
  const total = Math.round(selectedPrice * multiplier + photo);
  totalPrice.textContent = formatPrice(total);
  updateTotalSelection();
  return total;
}

function chooseCalcProgram(button) {
  document.querySelectorAll('.option').forEach((el) => el.classList.remove('active'));
  button.classList.add('active');
  selectedName = button.dataset.name;
  selectedPrice = Number(button.dataset.price);
  calculate();
}

function chooseDuration(button) {
  document.querySelectorAll('.duration').forEach((el) => el.classList.remove('active'));
  button.classList.add('active');
  selectedMinutes = Number(button.dataset.duration);
  calculate();
}

function selectProgram(name, price) {
  selectedName = name;
  selectedPrice = price;
  selectedMinutes = 60;

  document.querySelectorAll('.option').forEach((el) => {
    el.classList.toggle('active', el.dataset.name === name);
  });
  document.querySelectorAll('.duration').forEach((el) => {
    el.classList.toggle('active', el.dataset.duration === '60');
  });

  const photoSwitch = document.getElementById('photoSwitch');
  if (photoSwitch) photoSwitch.checked = false;

  calculate();
  document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' });
}

function applyCalculatorToBooking() {
  document.getElementById('selectedProgram').value = selectedName;
  document.getElementById('selectedDuration').value = `${selectedMinutes} минут`;
  document.getElementById('selectedExtra').value = document.getElementById('photoSwitch').checked
    ? 'Фотограф (+500 000 сум)'
    : 'Без дополнительных услуг';
}

function bookCalculated() {
  applyCalculatorToBooking();
  document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
}

window.applyCalculatorToBooking = applyCalculatorToBooking;

function initCalculator() {
  document.querySelectorAll('.option').forEach((button) => {
    button.addEventListener('click', () => chooseCalcProgram(button));
  });

  document.querySelectorAll('.duration').forEach((button) => {
    button.addEventListener('click', () => chooseDuration(button));
  });

  document.getElementById('photoSwitch')?.addEventListener('change', calculate);
  document.querySelector('.calc-cta')?.addEventListener('click', bookCalculated);

  document.querySelectorAll('.program-card button').forEach((button) => {
    button.addEventListener('click', () => {
      selectProgram(button.dataset.name, Number(button.dataset.price));
    });
  });

  calculate();
}
