// Automated "square box behind a rounded element" check (web).
// Rules (per route, per viewport, default + hover of every pressable):
//  R1 backdrop-filter element with 0 own radius inside a rounded overflow:hidden ancestor (blur leaks as a square)
//  R2 focusable/pressable with 0 radius whose same-size descendant is rounded (square focus ring / hover bg / press)
//  R3 element with box-shadow and 0 radius whose same-size child is rounded (square shadow)
//  R4 near-white surface: background luminance > 0.97 (not text-on-teal), wider than 24px and >=4px tall (bars/tracks too)
//  R5 focusable with 0 radius whose only child is a smaller rounded pill/tile → focus ring / hover box wider & square
//  R6 near-white SVG stroke/fill (ring tracks): luminance > 0.97, opacity >= 0.7, shape >= 24px
// הרצה: npx expo export -p web --output-dir dist-web && npx serve -s dist-web -l 8800
//        npx -y -p playwright-core node scripts/qa/check-round.cjs http://localhost:8800
// (משתמש ב-Chrome המותקן; אפשר לקבוע CHROME_PATH). יוצא עם קוד 1 אם נמצאה בעיה.
const { chromium } = require('playwright-core');
(async () => {
  const B = process.argv[2];
  const sizes = (process.argv[3] || '390x844,820x1180,1440x900').split(',').map((s) => s.split('x').map(Number));
  const routes = (process.argv[4] || '/,/path,/reading,/more,/settings,/family,/story?kind=parasha,/story?kind=haftara,/parashot,/calendar,/legal,/completion').split(',');
  const b = await chromium.launch({ ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' }), args: ['--no-sandbox'] });
  const all = [];
  for (const [W, H] of sizes) {
    const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, isMobile: W < 768, hasTouch: W < 768, locale: 'he-IL', timezoneId: 'Asia/Jerusalem' });
    const p = await ctx.newPage();
    await p.goto(B + '/calendar?onboarding=1', { waitUntil: 'networkidle' }); await p.waitForTimeout(2000);
    const c = p.getByText('המשך', { exact: true }).first(); await (W < 768 ? c.tap() : c.click()).catch(() => {}); await p.waitForTimeout(2500);
    for (const r of routes) {
      await p.goto(B + r, { waitUntil: 'networkidle' }); await p.waitForTimeout(2200);
      const found = await p.evaluate(() => {
        const out = [];
        const rad = (e) => parseFloat(getComputedStyle(e).borderTopLeftRadius) || 0;
        const same = (a, b) => { const x = a.getBoundingClientRect(), y = b.getBoundingClientRect(); return Math.abs(x.width - y.width) < 3 && Math.abs(x.height - y.height) < 3 && Math.abs(x.x - y.x) < 3 && Math.abs(x.y - y.y) < 3; };
        const roundedDesc = (e) => [...e.querySelectorAll('div')].some((d) => same(d, e) && rad(d) >= 8);
        const name = (e) => (e.getAttribute('aria-label') || e.innerText || e.className || '').toString().replace(/\s+/g, ' ').slice(0, 40);
        const vis = (e) => { const q = e.getBoundingClientRect(); return q.width >= 16 && q.height >= 16 && getComputedStyle(e).visibility !== 'hidden' && getComputedStyle(e).display !== 'none'; };
        for (const e of document.querySelectorAll('body *')) {
          if (!vis(e)) continue;
          const cs = getComputedStyle(e);
          const bf = cs.backdropFilter || cs.webkitBackdropFilter;
          if (bf && bf !== 'none' && rad(e) === 0 && !cs.clipPath.startsWith('path')) {
            let a = e.parentElement; let hit = null;
            while (a && a !== document.body) { const s = getComputedStyle(a); if (s.overflow === 'hidden' && rad(a) > 0) { hit = a; break; } a = a.parentElement; }
            if (hit) out.push({ rule: 'R1-blur-unclipped', el: name(hit) });
          }
          const focusable = e.matches('[role=button],[role=tab],[role=link],[role=checkbox],[role=radio],[role=switch],a,button,[tabindex="0"]');
          if (focusable && rad(e) === 0 && roundedDesc(e)) out.push({ rule: 'R2-square-pressable', el: name(e) });
          if (focusable && rad(e) === 0 && e.children.length === 1) {
            const k = e.children[0]; const ks = getComputedStyle(k);
            const painted = !/rgba\(0, 0, 0, 0\)|transparent/.test(ks.backgroundColor) || parseFloat(ks.borderTopWidth) > 0;
            if (rad(k) >= 8 && painted && !same(k, e)) out.push({ rule: 'R5-focus-wider-than-pill', el: name(e) });
          }
          if (cs.boxShadow !== 'none' && rad(e) === 0 && roundedDesc(e)) out.push({ rule: 'R3-square-shadow', el: name(e) });
          const m = cs.backgroundColor.match(/rgba?\(([\d.]+), ([\d.]+), ([\d.]+)(?:, ([\d.]+))?\)/);
          if (m) {
            const [r, g, bb, a = 1] = m.slice(1).map(Number);
            const q = e.getBoundingClientRect();
            const lum = (0.2126 * r + 0.7152 * g + 0.0722 * bb) / 255;
            if (a >= 0.7 && lum > 0.97 && q.width > 24 && q.height >= 4) out.push({ rule: 'R4-near-white', el: name(e), bg: cs.backgroundColor });
          }
        }
        for (const c of document.querySelectorAll('svg circle, svg path, svg rect')) {
          const q = c.getBoundingClientRect(); if (q.width < 24 || q.height < 24) continue;
          const cs = getComputedStyle(c);
          for (const [prop, op] of [['stroke', 'strokeOpacity'], ['fill', 'fillOpacity']]) {
            const m = (cs[prop] || '').match(/rgba?\(([\d.]+), ([\d.]+), ([\d.]+)(?:, ([\d.]+))?\)/); if (!m) continue;
            const [r, g, bb, a = 1] = m.slice(1).map(Number);
            const alpha = a * parseFloat(cs[op] || '1') * parseFloat(cs.opacity || '1');
            const lum = (0.2126 * r + 0.7152 * g + 0.0722 * bb) / 255;
            if (alpha >= 0.7 && lum > 0.97 && !(prop === 'stroke' && parseFloat(cs.strokeWidth) < 2.5)) out.push({ rule: 'R6-near-white-svg', el: (c.closest('[aria-label]')?.getAttribute('aria-label') || c.tagName).slice(0, 40), c: cs[prop] });
          }
        }
        return out;
      });
      // hover pass (pointer devices only): hovering must not create R1/R2 problems
      for (const f of found) all.push({ size: `${W}`, route: r, ...f });
    }
    await ctx.close();
  }
  const key = (x) => `${x.rule} | ${x.el}`;
  const agg = {};
  for (const x of all) { const k = key(x); agg[k] = agg[k] || new Set(); agg[k].add(`${x.size}${x.route}`); }
  const lines = Object.entries(agg).map(([k, v]) => `${k}  @ ${[...v].slice(0, 4).join(', ')}${v.size > 4 ? ` (+${v.size - 4})` : ''}`).sort();
  console.log(lines.join('\n'));
  console.log(`TOTAL_ISSUES=${lines.length}`);
  await b.close();
  process.exit(lines.length ? 1 : 0);
})();
