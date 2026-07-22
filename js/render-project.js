(function () {
  function frame(imagePath, tag) {
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

    var idx = Math.min(projects.length - 1, Math.max(0, (parseInt(new URLSearchParams(location.search).get('p'), 10) || 1) - 1));
    var p = projects[idx];
    var nextIdx = (idx + 1) % projects.length;
    var next = projects[nextIdx];

    document.title = 'Capybara Creative — ' + p.name;
    document.getElementById('p-name').textContent = p.name;
    document.getElementById('p-year').textContent = p.year;
    document.getElementById('p-sector').textContent = p.sector;
    document.getElementById('p-pkg').textContent = p.pkg + ' PACKAGE';
    document.getElementById('p-hero-frame').innerHTML = frame(p.heroImage, 'DROP HERO IMAGE — ' + p.name.toUpperCase());
    document.getElementById('p-about').textContent = p.about;
    document.getElementById('p-challenge').textContent = p.challenge;
    document.getElementById('p-solution').textContent = p.solution;

    document.getElementById('p-gallery-full-1').innerHTML = frame(p.galleryFull1, 'FULL-WIDTH SHOT — DESKTOP UI / BRAND IN USE');
    document.getElementById('p-gallery-detail-1').innerHTML = frame(p.galleryDetail1, 'DETAIL — MOBILE / COMPONENTS');
    document.getElementById('p-gallery-detail-2').innerHTML = frame(p.galleryDetail2, 'DETAIL — TYPOGRAPHY / LOGO');
    document.getElementById('p-gallery-full-2').innerHTML = frame(p.galleryFull2, 'FULL-WIDTH SHOT — FINAL SITE / LAUNCH');

    var delivWrap = document.getElementById('p-deliverables');
    delivWrap.innerHTML = p.deliverables.map(function (name, i) {
      return '<div class="deliverable-row"><span class="num mono">0' + (i + 1) + '</span><span class="name">' + name + '</span></div>';
    }).join('');

    document.getElementById('p-next-link').href = 'project.html?p=' + (nextIdx + 1);
    document.getElementById('p-next-name').textContent = next.name;
    document.getElementById('p-next-meta').textContent = next.sector + ' · ' + next.year;

    document.getElementById('p-footer-email-link').href = 'mailto:' + home.footerEmail;
    document.getElementById('p-footer-email').textContent = home.footerEmail.toUpperCase();
    document.getElementById('p-copyright').textContent = home.copyright;

    var igLink = document.getElementById('p-social-instagram');
    var liLink = document.getElementById('p-social-linkedin');
    var dbLink = document.getElementById('p-social-dribbble');
    if (home.socialInstagram) { igLink.href = home.socialInstagram; } else { igLink.style.display = 'none'; }
    if (home.socialLinkedin) { liLink.href = home.socialLinkedin; } else { liLink.style.display = 'none'; }
    if (home.socialDribbble) { dbLink.href = home.socialDribbble; } else { dbLink.style.display = 'none'; }

    document.dispatchEvent(new CustomEvent('content:rendered'));
  });
})();
