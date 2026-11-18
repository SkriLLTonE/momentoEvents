const WHATSAPP_NUMBER = '998900006580';

function initBooking() {
  const form = document.getElementById('bookingForm');
  if (!form) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const date = document.getElementById('date').value;
    const time = document.getElementById('time').value;
    const program = document.getElementById('selectedProgram').value;
    const duration = document.getElementById('selectedDuration').value;
    const extra = document.getElementById('selectedExtra').value;
    const address = document.getElementById('address').value.trim();
    const comment = document.getElementById('comment').value.trim();

    const message = `Здравствуйте! Хочу оставить заявку в MOMENTO.

Имя: ${name}
Телефон: ${phone}
Дата: ${date}
Время: ${time}
Программа: ${program}
Продолжительность: ${duration}
Дополнительные услуги: ${extra}
Адрес: ${address}
Комментарий: ${comment || 'Нет'}

Прошу связаться со мной для подтверждения.`;

    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,
      '_blank'
    );
  });
}
