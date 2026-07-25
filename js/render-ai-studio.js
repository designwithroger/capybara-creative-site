(function () {
  fetch('content/ai-studio.json').then(function (r) { return r.json(); }).then(function (a) {
    document.getElementById('page-title').textContent = a.metaTitle;
    document.getElementById('page-desc').setAttribute('content', a.metaDescription);

    document.getElementById('a-eyebrow').textContent = a.eyebrow;
    document.getElementById('a-title').textContent = a.heroTitle;
    document.getElementById('a-subtitle').textContent = a.heroSubtitle;
    document.getElementById('a-hero-cta').textContent = a.heroCta;

    document.getElementById('a-services-label').textContent = a.servicesLabel;
    document.getElementById('a-services-title').textContent = a.servicesTitle;
    document.getElementById('a-services-grid').innerHTML = a.services.map(function (s) {
      return '' +
        '<div class="ai-service-cell">' +
          '<span class="num mono">' + s.num + '</span>' +
          '<h3>' + s.name + '</h3>' +
          '<p>' + s.desc + '</p>' +
          '<span class="tags mono">' + s.tags + '</span>' +
        '</div>';
    }).join('');

    document.getElementById('a-process-title').textContent = a.processTitle;
    document.getElementById('a-process-label').textContent = a.processLabel;
    document.getElementById('a-steps-grid').innerHTML = a.steps.map(function (s) {
      return '' +
        '<div class="ai-step-cell">' +
          '<span class="num mono">' + s.num + '</span>' +
          '<h3>' + s.name + '</h3>' +
          '<p>' + s.desc + '</p>' +
        '</div>';
    }).join('');

    document.getElementById('a-results-label').textContent = a.resultsLabel;
    document.getElementById('a-results-title').textContent = a.resultsTitle;
    document.getElementById('a-cases-grid').innerHTML = a.cases.map(function (c) {
      return '' +
        '<div class="ai-case-cell">' +
          '<span class="stat">' + c.stat + '</span>' +
          '<p>' + c.desc + '</p>' +
          '<span class="client mono">' + c.client + '</span>' +
        '</div>';
    }).join('');

    document.getElementById('a-faq-label').textContent = a.faqLabel;
    document.getElementById('a-faq-title').textContent = a.faqTitle;
    var faqList = document.getElementById('a-faq-list');
    faqList.innerHTML = a.faqs.map(function (f, i) {
      return '' +
        '<div class="ai-faq-item" data-idx="' + i + '">' +
          '<button class="ai-faq-toggle" type="button" aria-expanded="false">' +
            '<span class="q">' + f.q + '</span>' +
            '<span class="sign mono">+</span>' +
          '</button>' +
          '<p class="ai-faq-answer">' + f.a + '</p>' +
        '</div>';
    }).join('');
    faqList.addEventListener('click', function (e) {
      var btn = e.target.closest('.ai-faq-toggle');
      if (!btn) return;
      var item = btn.closest('.ai-faq-item');
      var isOpen = item.classList.contains('open');
      faqList.querySelectorAll('.ai-faq-item.open').forEach(function (el) {
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

    document.getElementById('a-footer-label').textContent = a.footerLabel;
    var footerCta = document.getElementById('a-footer-cta');
    footerCta.textContent = a.footerCta;
    footerCta.href = 'mailto:' + a.contactEmail + '?subject=' + encodeURIComponent(a.contactSubject);
    document.getElementById('a-footer-subtext').textContent = a.footerSubtext;
    document.getElementById('a-footer-email').textContent = a.contactEmail.toUpperCase();

    document.dispatchEvent(new CustomEvent('content:rendered'));
  });
})();
