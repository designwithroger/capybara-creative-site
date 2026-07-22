(function () {
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  function observeAll() {
    document.querySelectorAll('[data-reveal]:not(.in-view)').forEach(function (el) { io.observe(el); });
  }

  observeAll();
  document.addEventListener('content:rendered', observeAll);
})();
