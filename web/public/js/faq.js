(function () {
  var list = document.getElementById('a-faq-list');
  if (!list) return;
  list.addEventListener('click', function (e) {
    var btn = e.target.closest('.ai-faq-toggle');
    if (!btn) return;
    var item = btn.closest('.ai-faq-item');
    var isOpen = item.classList.contains('open');
    list.querySelectorAll('.ai-faq-item.open').forEach(function (el) {
      el.classList.remove('open');
      el.querySelector('.ai-faq-toggle').setAttribute('aria-expanded', 'false');
      el.querySelector('.sign').textContent = '+';
    });
    if (!isOpen) {
      item.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
      item.querySelector('.sign').textContent = '−';
    }
  });
})();
