(function () {
  function thumb(imagePath, tag) {
    if (imagePath) {
      return '<img src="' + imagePath + '" alt="" style="width:100%;height:100%;object-fit:cover">';
    }
    return '<span class="tag mono">' + tag + '</span>';
  }

  Promise.all([
    fetch('content/home.json').then(function (r) { return r.json(); }),
    fetch('content/projects.json').then(function (r) { return r.json(); })
  ]).then(function (results) {
    var home = results[0];
    var projects = results[1].projects;

    document.getElementById('h-eyebrow').textContent = home.eyebrow;
    document.getElementById('h-title').textContent = home.heroTitle;
    document.getElementById('h-subtitle').textContent = home.heroSubtitle;
    document.getElementById('h-work-label').textContent = home.workLabel;
    document.getElementById('h-process-label').textContent = home.processLabel;
    document.getElementById('h-quote-label').textContent = home.quoteLabel;
    document.getElementById('h-quote').textContent = '“' + home.quote + '”';
    document.getElementById('h-quote-attr').textContent = home.quoteAttr;
    document.getElementById('h-footer-email-link').href = 'mailto:' + home.footerEmail;
    document.getElementById('h-footer-email').textContent = home.footerEmail.toUpperCase();
    document.getElementById('h-copyright').textContent = home.copyright;

    var igLink = document.getElementById('h-social-instagram');
    var liLink = document.getElementById('h-social-linkedin');
    var dbLink = document.getElementById('h-social-dribbble');
    if (home.socialInstagram) { igLink.href = home.socialInstagram; } else { igLink.style.display = 'none'; }
    if (home.socialLinkedin) { liLink.href = home.socialLinkedin; } else { liLink.style.display = 'none'; }
    if (home.socialDribbble) { dbLink.href = home.socialDribbble; } else { dbLink.style.display = 'none'; }

    var marqueeWrap = document.getElementById('h-marquee');
    var marqueeHtml = home.marquee.map(function (m) { return '<span>' + m + '</span>'; }).join('');
    marqueeWrap.innerHTML = marqueeHtml + marqueeHtml;

    var workGrid = document.getElementById('h-work-grid');
    workGrid.innerHTML = projects.map(function (p, i) {
      return '' +
        '<a href="project.html?p=' + (i + 1) + '" data-reveal class="work-card">' +
          '<div class="work-thumb">' +
            thumb(p.thumbImage, 'DROP PROJECT IMAGE — 4:3') +
            '<span class="idx mono">0' + (i + 1) + '</span>' +
          '</div>' +
          '<div class="work-title-row">' +
            '<span class="name">' + p.name + '</span>' +
            '<span class="sector mono">' + p.sector + '</span>' +
          '</div>' +
          '<div class="work-meta-row">' +
            '<span class="scope">' + p.scope + '</span>' +
            '<span class="stat mono">' + p.stat + '</span>' +
          '</div>' +
        '</a>';
    }).join('');

    var servicesWrap = document.getElementById('h-services');
    servicesWrap.innerHTML = home.services.map(function (s) {
      return '' +
        '<div class="service-row" data-reveal>' +
          '<span class="num mono">' + s.num + '</span>' +
          '<span class="name">' + s.name + '</span>' +
          '<span class="desc">' + s.desc + '</span>' +
        '</div>';
    }).join('');

    var stepsWrap = document.getElementById('h-steps');
    stepsWrap.innerHTML = home.steps.map(function (s) {
      return '' +
        '<div class="process-cell" data-reveal>' +
          '<span class="num mono">' + s.num + '</span>' +
          '<span class="name">' + s.name + '</span>' +
          '<span class="desc">' + s.desc + '</span>' +
        '</div>';
    }).join('');

    document.dispatchEvent(new CustomEvent('content:rendered'));
  });
})();
