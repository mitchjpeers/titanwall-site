// Generates projects/<slug>.html from one shared template.
// Content sourced from the Titan Wall draft; markup/styling is our own theme.
// Run with:  node build-projects.js
const fs = require('fs');
const path = require('path');

const FEATURES = [
  'MGO sheathing bonded to a rigid EPS core',
  'Structure, insulation and air barrier in one panel',
  "CNC-machined to the project's shop drawings",
  'Openings, chases and connections cut before delivery',
  'Fire-tested to ASTM E119 and ASTM E84',
  'Flat-packed and sequenced for site assembly',
];

const PROJECTS = [
  {
    slug: 'cannabis-facility-build',
    title: 'Cannabis Facility Build',
    category: 'Commercial',
    blurb: 'A commercial cannabis production facility built with Titanwall MGO SIPs.',
    location: 'Alberta, Canada',
    year: '2023',
    client: 'Commercial grower',
    challenge: [
      'A production facility has to hold tight interior conditions while standing up to constant humidity, wash-downs and a fire code that treats the building as a processing plant. A stick-framed envelope would have meant several trades, a long path to lockup and an assembly the grower would have to keep maintaining.',
      'The envelope had to be structure, insulation and air barrier at once — and it had to be up fast enough to keep the fit-out on schedule.',
    ],
    solution: 'Titanwall supplied MGO SIPs machined to the approved shop drawings, with openings and service chases cut before the panels left High River. The crew set the envelope panel by panel, and the walls arrived already carrying their insulation and air barrier — no separate framing, sheathing, batt and wrap sequence to coordinate.',
    quote: 'One panel replaced four trades. The envelope went up straight, plumb and weather-tight, and the fit-out started earlier than a framed build would have allowed.',
    tags: ['Commercial', 'Envelope', 'Fire performance', 'Made to order'],
    results: [
      { k: 'Project duration', n: 34, suffix: ' Days' },
      { k: 'Panel area', n: 24600, suffix: ' sq ft' },
      { k: 'Energy savings', n: 38, suffix: '%' },
      { k: 'Warranty', n: 25, suffix: ' Years' },
    ],
    plate: `<rect x="4" y="26" width="112" height="46"/><path d="M4 26 60 6l56 20"/><rect x="20" y="42" width="16" height="16"/><rect x="52" y="42" width="16" height="16"/><rect x="84" y="42" width="16" height="16"/>`,
  },
  {
    slug: 'spring-bank',
    title: 'Spring Bank',
    category: 'Residential',
    blurb: 'A residential build in Spring Bank, Alberta using Titanwall MGO SIPs.',
    location: 'Spring Bank, AB',
    year: '2022',
    client: 'Private homeowner',
    challenge: [
      'An Alberta winter leaves a short window to get a house weather-tight, and the owners wanted a quiet, comfortable home without the thermal bridging and air leakage a conventional stud wall carries with it.',
      'The build had to reach lockup before the weather turned, without trading away the wall performance the owners were after.',
    ],
    solution: 'The wall envelope was manufactured as MGO SIPs and delivered flat-pack in the assembly sequence. Each panel arrived with its openings already cut, so the crew set walls instead of framing them — and the finished envelope carries continuous insulation and a continuous air barrier by construction rather than by detailing.',
    quote: 'The envelope went up in days rather than weeks, and the house is quieter and steadier through an Alberta winter than a framed wall of the same thickness.',
    tags: ['Residential', 'Cold climate', 'Air barrier', 'Flat-pack'],
    results: [
      { k: 'Project duration', n: 12, suffix: ' Days' },
      { k: 'Panel area', n: 4200, suffix: ' sq ft' },
      { k: 'Energy savings', n: 31, suffix: '%' },
      { k: 'Warranty', n: 25, suffix: ' Years' },
    ],
    plate: `<path d="M12 34 60 8l48 26v34H12z"/><rect x="50" y="48" width="20" height="20"/><rect x="26" y="42" width="14" height="12"/><rect x="80" y="42" width="14" height="12"/>`,
  },
  {
    slug: 'wreckhouse',
    title: 'Wreckhouse',
    category: 'Residential',
    blurb: "A full home delivered flat-pack to one of Canada's windiest regions.",
    location: 'Wreckhouse, NL',
    year: '2021',
    client: 'Private homeowner',
    challenge: [
      'Wreckhouse is known for some of the strongest winds in the country, and it sits a long way from the shop. The build needed an envelope that could take the exposure and could be shipped across the continent without a site crew waiting on materials.',
      'A whole house had to arrive on a truck, in order, and go together in a place where the weather sets the schedule.',
    ],
    solution: 'The entire home was machined in High River and shipped flat-pack — every panel numbered and sequenced for assembly. MGO skins over a rigid core give the walls their strength and their insulation in one element, so the envelope closed in quickly once the panels were on site.',
    quote: "A complete house on a flat-pack, delivered to one of Canada's windiest regions and stood up by a small crew.",
    tags: ['Residential', 'Harsh climate', 'Flat-pack', 'Shipped'],
    results: [
      { k: 'Project duration', n: 18, suffix: ' Days' },
      { k: 'Panel area', n: 3850, suffix: ' sq ft' },
      { k: 'Energy savings', n: 34, suffix: '%' },
      { k: 'Warranty', n: 25, suffix: ' Years' },
    ],
    plate: `<path d="M14 36 60 10l46 26v32H14z"/><path d="M4 22c8-6 14 6 22 0M4 58c8-6 14 6 22 0" opacity=".65"/><rect x="48" y="46" width="24" height="22"/>`,
  },
  {
    slug: 'affordable-housing-build',
    title: 'Affordable Housing Build',
    category: 'Affordable Housing',
    blurb: 'Repeatable panel runs that speed delivery and hold cost on multi-unit housing.',
    location: 'Alberta, Canada',
    year: '2024',
    client: 'Housing developer',
    challenge: [
      'Multi-unit housing lives or dies on repeatability. Every unit framed on site is a chance for the schedule to slip and for the cost per door to drift away from the pro forma.',
      'The same wall, built the same way, unit after unit — with a schedule that holds from the first door to the last.',
    ],
    solution: "One panel layout was engineered with the design team and then produced as a repeating run on the CNC line. Each unit's envelope arrived identical, machined to the same drawing, so site crews repeated one assembly rather than re-solving the wall on every floor.",
    quote: 'Repeatable panel runs turn the envelope into a known quantity — the same wall, the same sequence, on every unit.',
    tags: ['Affordable housing', 'Repeatable', 'Schedule', 'Made to order'],
    results: [
      { k: 'Project duration', n: 46, suffix: ' Days' },
      { k: 'Panel area', n: 31500, suffix: ' sq ft' },
      { k: 'Energy savings', n: 29, suffix: '%' },
      { k: 'Warranty', n: 25, suffix: ' Years' },
    ],
    plate: `<rect x="8" y="30" width="30" height="38"/><rect x="45" y="22" width="30" height="46"/><rect x="82" y="30" width="30" height="38"/><path d="M16 40h14M53 32h14M90 40h14M16 52h14M53 44h14M90 52h14" opacity=".7"/>`,
  },
  {
    slug: 'custom-home-build',
    title: 'Custom Home Build',
    category: 'Custom',
    blurb: "A one-off envelope, CNC-machined panel by panel to the builder's drawings.",
    location: 'Alberta, Canada',
    year: '2024',
    client: 'Custom builder',
    challenge: [
      "A one-off design leaves nothing standard about the envelope: unusual spans, tall walls and openings that don't repeat. The builder needed panels that followed the drawings exactly rather than a catalogue of stock sizes.",
      'Nothing about the wall repeated, so every panel had to be right the first time it came off the line.',
    ],
    solution: 'Titanwall coordinated the panel layout with the builder and their engineer, then machined every panel to that layout — openings, chases and connections cut before delivery. The envelope arrived as a kit of parts that only fit together one way.',
    quote: 'Fully customizable panels with hands-on design coordination — the envelope matched the drawings, panel for panel.',
    tags: ['Custom', 'Design coordination', 'CNC', 'Made to order'],
    results: [
      { k: 'Project duration', n: 21, suffix: ' Days' },
      { k: 'Panel area', n: 6750, suffix: ' sq ft' },
      { k: 'Energy savings', n: 33, suffix: '%' },
      { k: 'Warranty', n: 25, suffix: ' Years' },
    ],
    plate: `<path d="M10 68V38l26-20 26 20v30"/><path d="M62 68V30l24-16 24 16v38"/><rect x="24" y="46" width="14" height="22"/><rect x="76" y="42" width="18" height="26"/>`,
  },
];

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const FAVICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%230b0d10'/%3E%3Cpath d='M16 5l10 5.5v11L16 27 6 21.5v-11z' fill='none' stroke='%235b8dff' stroke-width='2'/%3E%3Cpath d='M16 5v22M6 10.5l10 5.5 10-5.5' fill='none' stroke='%235b8dff' stroke-width='1.5' opacity='.6'/%3E%3C/svg%3E";

function render(p, all) {
  const others = all.filter(o => o.slug !== p.slug).slice(0, 3);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="dark">
<title>${esc(p.title)} — ${esc(p.category)} | Titanwall MGO</title>
<meta name="description" content="${esc(p.blurb)}">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(p.title)} — ${esc(p.category)} | Titanwall MGO">
<meta property="og:description" content="${esc(p.blurb)}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${FAVICON}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../css/site.css">
</head>
<body>

<a class="skip-link" href="#top">Skip to content</a>

<header>
  <nav>
    <a href="../index.html" class="logo">
      <svg class="cube" viewBox="0 0 32 32" fill="none" aria-hidden="true" style="height:34px;width:34px;">
        <path d="M16 4l11 6v12l-11 6-11-6V10z" stroke="#5b8dff" stroke-width="1.8"/>
        <path d="M16 4v24M5 10l11 6 11-6" stroke="#5b8dff" stroke-width="1.4" opacity=".6"/>
      </svg>
      <div><strong>TITAN</strong><span>WALLMGO</span></div>
    </a>
    <ul class="nav-links" id="navLinks">
      <li><a href="../index.html#panels">Panels</a></li>
      <li><a href="../index.html#process">Process</a></li>
      <li><a href="../index.html#tested">Testing</a></li>
      <li><a href="../index.html#projects">Projects</a></li>
      <li><a href="../index.html#contact">Contact</a></li>
      <li><a href="../index.html#contact" class="nav-quote">Get a Quote</a></li>
    </ul>
    <div class="nav-cta">
      <a href="../index.html#contact" class="btn btn-primary">Get a Quote</a>
      <button class="nav-toggle" id="navToggle" aria-label="Toggle menu" aria-expanded="false">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      </button>
    </div>
  </nav>
</header>

<main id="top">

  <section class="proj-hero">
    <div class="blueprint-grid" aria-hidden="true"></div>
    <div class="container">
      <a class="back-link" href="../index.html#projects">&#8592; Back to projects</a>
      <div class="eyebrow">${esc(p.category)}</div>
      <h1>${esc(p.title)}</h1>
      <p class="proj-lede">${esc(p.blurb)}</p>
      <dl class="proj-meta">
        <div><dt>Location</dt><dd>${esc(p.location)}</dd></div>
        <div><dt>Year</dt><dd>${esc(p.year)}</dd></div>
        <div><dt>Client</dt><dd>${esc(p.client)}</dd></div>
      </dl>
    </div>
  </section>

  <section class="proj-body">
    <div class="container proj-cols">
      <div class="proj-main">
        <div class="reveal">
          <h2>The challenge</h2>
          ${p.challenge.map(c => `<p>${esc(c)}</p>`).join('\n          ')}
        </div>
        <div class="reveal">
          <h2>Our solution</h2>
          <p>${esc(p.solution)}</p>
        </div>
        <blockquote class="proj-quote reveal">
          <p>${esc(p.quote)}</p>
        </blockquote>
        <div class="proj-tags reveal">
          ${p.tags.map(t => `<span class="proj-tag">${esc(t)}</span>`).join('\n          ')}
        </div>
      </div>

      <aside class="proj-side">
        <div class="proj-plate-lg reveal">
          <svg viewBox="0 0 120 76" fill="none" stroke="#5b8dff" stroke-width="1.4" aria-hidden="true">${p.plate}</svg>
        </div>
        <div class="proj-feats reveal">
          <h3>Project features</h3>
          <ul>
            ${FEATURES.map(f => `<li>${esc(f)}</li>`).join('\n            ')}
          </ul>
        </div>
      </aside>
    </div>
  </section>

  <section class="proj-results" aria-labelledby="results-h">
    <div class="container">
      <h2 id="results-h" class="reveal">Project results</h2>
      <div class="results-grid">
        ${p.results.map(r => `<div class="result reveal">
          <div class="r-k">${esc(r.k)}</div>
          <div class="r-v" data-count-to="${r.n}" data-suffix="${esc(r.suffix)}">0${esc(r.suffix)}</div>
        </div>`).join('\n        ')}
      </div>
    </div>
  </section>

  <section class="proj-more">
    <div class="container">
      <div class="section-head reveal">
        <div class="eyebrow">More work</div>
        <h2>Other projects</h2>
      </div>
      <div class="projects-grid">
        ${others.map(o => `<a class="project-card reveal" href="${o.slug}.html">
          <div class="project-plate">
            <span class="project-cat">${esc(o.category)}</span>
            <svg viewBox="0 0 120 76" fill="none" stroke="#5b8dff" stroke-width="1.4" aria-hidden="true">${o.plate}</svg>
          </div>
          <div class="project-body">
            <h3>${esc(o.title)}</h3>
            <p>${esc(o.blurb)}</p>
            <span class="project-link">View project &#8594;</span>
          </div>
        </a>`).join('\n        ')}
      </div>
    </div>
  </section>

  <section class="contact" aria-labelledby="cta-h">
    <div class="container proj-cta">
      <div class="reveal">
        <div class="eyebrow">Get in touch</div>
        <h2 id="cta-h">Ready to build smarter?</h2>
        <p>Tell us about your project and we'll put together a quote on the right MGO SIP solution — free, and no obligation.</p>
      </div>
      <div class="proj-cta-actions reveal">
        <a href="../index.html#contact" class="btn btn-primary">Get a Quote</a>
        <a href="tel:+14036060855" class="btn btn-outline">Call 403 606-0855</a>
      </div>
    </div>
  </section>

</main>

<footer>
  <div class="footer-inner">
    <span>&copy; 2026 Titanwall MGO Insulated Panels</span>
    <div class="footer-social">
      <a href="https://www.instagram.com/titanwalltechnologies/" target="_blank" rel="noopener">Instagram<span class="sr-only"> (opens in a new tab)</span></a>
      <a href="../index.html">Home</a>
      <a href="#top">Back to top</a>
    </div>
  </div>
</footer>

<script src="../js/site.js"></script>
</body>
</html>
`;
}

fs.mkdirSync(path.join(__dirname, 'projects'), { recursive: true });
PROJECTS.forEach(p => {
  const out = path.join(__dirname, 'projects', p.slug + '.html');
  fs.writeFileSync(out, render(p, PROJECTS));
  console.log('wrote', 'projects/' + p.slug + '.html');
});
