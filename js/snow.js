function initSnow() {
  const canvas = document.getElementById('snow');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let flakes = [];

  function resizeSnow() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    flakes = Array.from({ length: 85 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2 + 0.5,
      s: Math.random() * 0.8 + 0.3,
      d: Math.random() * 0.5 - 0.25,
      a: Math.random() * 0.28 + 0.12,
    }));
  }

  function drawSnow() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    flakes.forEach((flake) => {
      ctx.beginPath();
      ctx.arc(flake.x, flake.y, flake.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,245,225,${flake.a})`;
      ctx.fill();
      flake.y += flake.s;
      flake.x += flake.d;
      if (flake.y > canvas.height) {
        flake.y = -5;
        flake.x = Math.random() * canvas.width;
      }
      if (flake.x > canvas.width) flake.x = 0;
      if (flake.x < 0) flake.x = canvas.width;
    });
    requestAnimationFrame(drawSnow);
  }

  window.addEventListener('resize', resizeSnow);
  resizeSnow();
  drawSnow();
}
