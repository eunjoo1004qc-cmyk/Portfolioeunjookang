// Hero typing loop: the four lines fill white one by one, fade out, then the name types letter by letter; repeats.
// Text and times come from .hero-stage in index.html (data-name, data-step, data-type, data-hold).
(function () {
  const stage = document.querySelector('.hero-stage');
  if (!stage) return;
  const NAME = stage.dataset.name.split('/').map((t) => t.trim()).join('\n');
  const STEP = +stage.dataset.step || 900, TYPE = +stage.dataset.type || 90, HOLD = +stage.dataset.hold || 2500;
  const lines = stage.querySelectorAll('.line');
  const heroLines = stage.querySelector('.hero-lines');
  const typed = document.getElementById('typed');
  const nameBox = typed.parentNode;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const fill = (i) => lines.forEach((l, k) => l.classList.toggle('is-fill', k === i));
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    heroLines.classList.add('is-gone'); nameBox.classList.add('is-on'); typed.textContent = NAME; return;
  }
  (async function loop() {
    await wait(1200);
    for (;;) {
      for (let i = 0; i < lines.length; i++) { fill(i); await wait(STEP); }
      heroLines.classList.add('is-gone'); await wait(600); fill(-1);
      nameBox.classList.add('is-on');
      for (let n = 1; n <= NAME.length; n++) { typed.textContent = NAME.slice(0, n); await wait(TYPE); }
      await wait(HOLD);
      nameBox.classList.remove('is-on'); typed.textContent = '';
      heroLines.classList.remove('is-gone'); await wait(700);
    }
  })();
})();
