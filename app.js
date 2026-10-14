/* =========================================================
   SPM GO! — app logic
   Author: heyziq05 (https://github.com/heyziq05)
   Schedule lives in js/data.js
   ========================================================= */
(() => {
  'use strict';

  const C = window.SPM_CONFIG;
  const MODULES = window.SPM_MODULES;
  const $ = (s, r = document) => r.querySelector(s);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const STORE_KEY = 'spmgo:module';

  /* ---------- Clock (supports ?now=2026-11-20T09:00 for previewing) ---------- */
  let clockOffset = 0;
  const nowParam = new URLSearchParams(location.search).get('now');
  if (nowParam) {
    let s = nowParam.trim();
    if (!s.includes('T')) s += 'T00:00';
    if (/T\d\d:\d\d$/.test(s)) s += ':00';
    if (!/(Z|[+-]\d\d:?\d\d)$/i.test(s)) s += C.utcOffset;
    const d = Date.parse(s);
    if (!Number.isNaN(d)) clockOffset = d - Date.now();
  }
  const now = () => Date.now() + clockOffset;

  /* ---------- Exams ---------- */
  const ts = (md, hm) => Date.parse(`${C.year}-${md}T${hm}:00${C.utcOffset}`);
  const EXAMS = window.SPM_EXAMS.map((e, i) => {
    const startTs = ts(e.date, e.start || C.defaultStart);
    const endTs = ts(e.date, e.end || C.defaultEnd);
    if (Number.isNaN(startTs) || Number.isNaN(endTs)) console.warn('[SPM GO] Invalid date/time for', e);
    return { ...e, id: i, startTs, endTs: Math.max(endTs, startTs) };
  }).sort((a, b) => a.startTs - b.startTs);
  const LAST_END = Math.max(...EXAMS.map(e => e.endTs));
  const moduleById = Object.fromEntries(MODULES.map(m => [m.id, m]));

  const statusOf = (e, t) => (t < e.startTs ? 'upcoming' : t < e.endTs ? 'live' : 'done');
  const nextExam = t => EXAMS.find(e => e.startTs > t) || null;

  /* ---------- Formatting ---------- */
  const tz = C.timeZone;
  const partsOf = (ms, opts) =>
    Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: tz, ...opts }).formatToParts(ms).map(p => [p.type, p.value]));
  const fmtLong = ms => {
    const p = partsOf(ms, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    return `${p.weekday}, ${p.day} ${p.month} ${p.year}`;
  };
  const fmtShort = ms => {
    const p = partsOf(ms, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    return { day: `${p.weekday}, ${p.day} ${p.month}`, year: p.year };
  };
  const fmtTime = ms => new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit' }).format(ms);
  const pad = n => String(n).padStart(2, '0');
  const split = ms => {
    const s = Math.max(0, Math.floor(ms / 1000));
    return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
  };
  const esc = str => String(str ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- Icons ---------- */
  const ICONS = {
    pen: '<path d="M4 20l4.5-1L19 8.5a2.1 2.1 0 0 0-3-3L5.5 16 4 20z"/><path d="M14 7.5l2.5 2.5"/>',
    flask: '<path d="M9 3h6M10 3v6l-5.4 9.4A1.7 1.7 0 0 0 6.1 21h11.8a1.7 1.7 0 0 0 1.5-2.6L14 9V3"/><path d="M7.4 15h9.2"/>',
    headphones: '<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4.5" height="6.5" rx="1.6"/><rect x="16.5" y="14" width="4.5" height="6.5" rx="1.6"/>',
    speech: '<path d="M20 11.5a7.5 7.5 0 0 1-11 6.6L4 19.5l1.4-4.4A7.5 7.5 0 1 1 20 11.5z"/><path d="M9 10h6M9 13.2h3.5"/>',
    calPlus: '<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4M12 13v4.5M9.75 15.25h4.5"/>',
  };
  const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ''}</svg>`;

  /* ---------- Flip calendar ---------- */
  class FlipDigit {
    constructor(v) {
      this.v = v;
      this.el = document.createElement('div');
      this.el.className = 'digit';
      this.el.innerHTML =
        `<div class="half top"><span>${v}</span></div><div class="half bottom"><span>${v}</span></div>` +
        `<div class="leaf leaf-top"><span>${v}</span></div><div class="leaf leaf-bottom"><span>${v}</span></div>`;
      [this.top, this.bottom, this.lTop, this.lBottom] = this.el.querySelectorAll('span');
    }
    set(v, animate, delay = 0) {
      if (v === this.v) return;
      const prev = this.v;
      this.v = v;
      clearTimeout(this.timer);
      if (!animate || reduceMotion.matches) {
        this.top.textContent = this.bottom.textContent = this.lTop.textContent = this.lBottom.textContent = v;
        this.el.classList.remove('flipping');
        return;
      }
      this.top.textContent = v;
      this.lTop.textContent = prev;
      this.lBottom.textContent = v;
      this.bottom.textContent = prev;
      this.el.style.setProperty('--delay', `${delay}ms`);
      this.el.classList.remove('flipping');
      void this.el.offsetWidth; // restart animation
      this.el.classList.add('flipping');
      this.timer = setTimeout(() => {
        this.bottom.textContent = v;
        this.el.classList.remove('flipping');
      }, 680 + delay);
    }
  }

  class FlipBoard {
    constructor(el, calendarEl, ringsEl) { this.el = el; this.cal = calendarEl; this.rings = ringsEl; this.digits = []; }
    build(n, initial) {
      this.el.innerHTML = '';
      this.digits = Array.from({ length: n }, (_, i) => {
        const d = new FlipDigit(initial ? initial[i] : '0');
        this.el.append(d.el);
        return d;
      });
      this.cal.style.setProperty('--n', n);
      this.rings.innerHTML = '<span class="ring"></span>'.repeat(n * 2);
    }
    set(num, animate = true) {
      const s = String(num).padStart(C.minDayDigits || 3, '0');
      if (s.length !== this.digits.length) this.build(s.length, animate ? null : s);
      [...s].forEach((ch, i) => this.digits[i].set(ch, animate, i * 90));
    }
  }

  /* ---------- DOM refs ---------- */
  const el = {
    yearTag: $('#year-tag'),
    heroCount: $('#hero-count'), heroDone: $('#hero-done'), heroLabel: $('#hero-label-text'),
    h: $('#t-h'), m: $('#t-m'), s: $('#t-s'),
    date: $('#hero-date'), time: $('#hero-time'), subject: $('#hero-subject'), meta: $('#hero-meta'), sr: $('#hero-sr'),
    progDone: $('#prog-done'), progTotal: $('#prog-total'), progFill: $('#prog-fill'),
    doneSub: $('#done-sub'), confetti: $('#confetti'),
    modules: $('#module-grid'), papers: $('#papers'),
    calendar: $('#calendar'), board: $('#flip-board'), rings: $('#rings'),
    install: $('#install-btn'), iosHint: $('#ios-hint'), iosClose: $('#ios-hint-close'),
    ghLink: $('#gh-link'), ghHandle: $('#gh-handle'),
  };
  const board = new FlipBoard(el.board, el.calendar, el.rings);

  el.yearTag.textContent = `SPM ${C.year}`;
  el.progTotal.textContent = EXAMS.length;
  if (C.githubUrl) el.ghLink.href = C.githubUrl;
  if (C.githubHandle) { el.ghHandle.textContent = C.githubHandle; el.ghLink.setAttribute('aria-label', `${C.githubHandle} on GitHub`); }

  /* ---------- State ---------- */
  const storage = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* ignore */ } },
  };
  const defaultModule = () => {
    const t = now();
    const target = EXAMS.find(e => statusOf(e, t) !== 'done') || EXAMS[0];
    // prefer the module listed in the table order for that paper (e.g. Mendengar before Bertulis on BM day)
    return (target && target.modules[target.modules.length - 1]) || MODULES[0].id;
  };
  let selected = storage.get(STORE_KEY);
  if (!moduleById[selected]) selected = defaultModule();

  /* ---------- Hero ---------- */
  let heroTargetId = null;
  let heroMode = null;
  let firstHero = true;

  function renderHero(t) {
    const done = EXAMS.filter(e => statusOf(e, t) === 'done').length;
    el.progDone.textContent = done;
    el.progFill.style.width = `${(done / EXAMS.length) * 100}%`;

    if (t >= LAST_END) {
      if (heroMode !== 'done') {
        heroMode = 'done';
        el.heroCount.hidden = true;
        el.heroDone.hidden = false;
        el.doneSub.textContent = `All ${EXAMS.length} papers, done. Be proud of the work you put in. Rest well.`;
        launchConfetti();
      }
      return;
    }
    if (heroMode !== 'count') { heroMode = 'count'; el.heroCount.hidden = false; el.heroDone.hidden = true; }

    const next = nextExam(t);
    const target = next || EXAMS.filter(e => statusOf(e, t) === 'live').pop();
    const diff = next ? next.startTs - t : 0;
    const { d, h, m, s } = split(diff);

    board.set(d, !firstHero || !reduceMotion.matches);
    el.h.textContent = pad(h);
    el.m.textContent = pad(m);
    el.s.textContent = pad(s);

    if (target.id !== heroTargetId) {
      heroTargetId = target.id;
      el.heroLabel.textContent = next ? (d === 1 ? 'Day left' : 'Days left') : 'Final paper in progress';
      el.date.textContent = fmtLong(target.startTs);
      el.time.textContent = fmtTime(target.startTs);
      el.subject.textContent = target.subject;
      const chips = target.modules.map(id => `<span class="chip accent">${icon(moduleById[id].icon)}${esc(moduleById[id].name)}</span>`);
      if (target.paper && !target.modules.some(id => moduleById[id].name === target.paper)) chips.unshift(`<span class="chip">${esc(target.paper)}</span>`);
      el.meta.innerHTML = chips.join('');
    } else if (next) {
      el.heroLabel.textContent = d === 1 ? 'Day left' : 'Days left';
    }
    if (s === 0 || firstHero) {
      el.sr.textContent = next
        ? `${d} days, ${h} hours and ${m} minutes until ${target.subject} on ${fmtLong(target.startTs)}.`
        : `${target.subject} is in progress.`;
    }
    firstHero = false;
  }

  function launchConfetti() {
    if (reduceMotion.matches) return;
    const colors = ['#f6c945', '#86bcff', '#f5f0e3', '#62d6a2'];
    el.confetti.innerHTML = Array.from({ length: 36 }, () => {
      const x = Math.random() * 100;
      return `<i style="left:${x}%;background:${colors[Math.floor(Math.random() * colors.length)]};` +
        `--d:${(Math.random() * 0.8).toFixed(2)}s;--dur:${(2.4 + Math.random() * 1.6).toFixed(2)}s;` +
        `--x:${Math.round((Math.random() - 0.5) * 120)}px;--r:${Math.round(180 + Math.random() * 540)}deg"></i>`;
    }).join('');
  }

  /* ---------- Modules ---------- */
  function renderModules(t) {
    el.modules.innerHTML = MODULES.map(mod => {
      const list = EXAMS.filter(e => e.modules.includes(mod.id));
      const done = list.filter(e => statusOf(e, t) === 'done').length;
      const sel = mod.id === selected;
      return `<button class="module" role="tab" type="button" id="tab-${mod.id}" data-id="${mod.id}"
        aria-selected="${sel}" aria-controls="papers" tabindex="${sel ? 0 : -1}">
        <span class="m-icon">${icon(mod.icon)}</span>
        <span class="m-text"><span class="m-name">${esc(mod.name)}</span><span class="m-label">${esc(mod.label)}</span></span>
        <span class="m-foot"><span class="m-count">${done}/${list.length} done</span><span class="m-bar"><i style="width:${list.length ? (done / list.length) * 100 : 0}%"></i></span></span>
      </button>`;
    }).join('');
  }

  function selectModule(id, focus) {
    if (!moduleById[id]) return;
    selected = id;
    storage.set(STORE_KEY, id);
    const t = now();
    renderModules(t);
    renderPapers(t, true);
    if (focus) $(`#tab-${id}`)?.focus();
  }

  el.modules.addEventListener('click', e => {
    const btn = e.target.closest('.module');
    if (btn) selectModule(btn.dataset.id);
  });
  el.modules.addEventListener('keydown', e => {
    const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    const i = MODULES.findIndex(m => m.id === selected);
    let n = i;
    if (e.key === 'Home') n = 0;
    else if (e.key === 'End') n = MODULES.length - 1;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (i - 1 + MODULES.length) % MODULES.length;
    else n = (i + 1) % MODULES.length;
    selectModule(MODULES[n].id, true);
  });

  /* ---------- Paper cards ---------- */
  function countdownHTML(e, t, nextId) {
    const st = statusOf(e, t);
    if (st === 'live') return '<span class="cd state">In progress</span>';
    if (st === 'done') return '<span class="cd state">Completed</span>';
    const { d, h, m, s } = split(e.startTs - t);
    return `<span class="cd"><b>${d}</b><i>d</i><b>${pad(h)}</b><i>h</i><b>${pad(m)}</b><i>m</i><b>${pad(s)}</b><i>s</i></span>`;
  }

  function renderPapers(t, animate) {
    const mod = moduleById[selected];
    const list = EXAMS.filter(e => e.modules.includes(mod.id));
    const nextId = nextExam(t)?.id;
    el.papers.setAttribute('aria-labelledby', `tab-${mod.id}`);
    el.papers.innerHTML = `
      <div class="section-head"><h2>${esc(mod.name)}</h2><p>${list.length} paper${list.length === 1 ? '' : 's'}</p></div>
      <ol class="card-list">${list.map((e, i) => {
        const st = statusOf(e, t);
        const shown = st === 'upcoming' && e.id === nextId ? 'next' : st;
        const tag = { next: 'Next up', live: 'Today', done: 'Done' }[shown];
        const date = fmtShort(e.startTs);
        const paper = e.paper && e.paper !== mod.name ? `<p class="pc-paper">${esc(e.paper)}</p>` : '';
        return `<li class="paper-card" data-status="${shown}" data-id="${e.id}" style="--i:${animate ? i : 0};${animate ? '' : 'animation:none'}">
          <div class="pc-main">
            <div class="pc-top"><span class="pc-index">${pad(i + 1)}</span>${tag ? `<span class="status ${shown}">${tag}</span>` : ''}</div>
            <h3 class="pc-subject">${esc(e.subject)}</h3>
            ${paper}
            <div class="pc-actions">
              <span class="chip">${icon(mod.icon)}${esc(mod.name)} · ${esc(mod.label)}</span>
              ${st === 'upcoming' ? `<button class="cal-btn" type="button" data-ics="${e.id}" aria-label="Add ${esc(e.subject)} to calendar">${icon('calPlus')}Add to calendar</button>` : ''}
            </div>
          </div>
          <div class="pc-time">
            <div><span class="lbl">${st === 'upcoming' ? 'Time left' : 'Status'}</span><span data-left="${e.id}">${countdownHTML(e, t, nextId)}</span></div>
            <div class="pc-date">${esc(date.day)} ${esc(date.year)}<span>${esc(fmtTime(e.startTs))} MYT</span></div>
          </div>
        </li>`;
      }).join('')}</ol>`;
  }

  function updateCardTimers(t) {
    el.papers.querySelectorAll('[data-left]').forEach(node => {
      const e = EXAMS.find(x => x.id === Number(node.dataset.left));
      if (e && statusOf(e, t) === 'upcoming') node.innerHTML = countdownHTML(e, t);
    });
  }

  /* ---------- Add to calendar (.ics) ---------- */
  const icsStamp = ms => new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  el.papers.addEventListener('click', ev => {
    const btn = ev.target.closest('[data-ics]');
    if (!btn) return;
    const e = EXAMS.find(x => x.id === Number(btn.dataset.ics));
    const title = `SPM ${C.year}: ${e.subject}${e.paper ? ` (${e.paper})` : ''}`;
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//SPM GO//EN', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT',
      `UID:spmgo-${C.year}-${e.date}-${e.id}@spmgo`, `DTSTAMP:${icsStamp(Date.now())}`,
      `DTSTART:${icsStamp(e.startTs)}`, `DTEND:${icsStamp(e.endTs)}`,
      `SUMMARY:${title}`, `DESCRIPTION:${e.modules.map(id => moduleById[id].name).join(' / ')}`,
      'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY', `DESCRIPTION:Tomorrow: ${title}`, 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR',
    ].join('\r\n');
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: `SPM-${e.subject.replace(/\s+/g, '-')}-${e.date}.ics` });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  });

  /* ---------- 3D tilt (desktop pointer only) ---------- */
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const stage = $('.calendar-stage');
    stage.addEventListener('pointermove', e => {
      if (reduceMotion.matches) return;
      const r = el.calendar.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.calendar.style.setProperty('--ry', `${(x * 12).toFixed(2)}deg`);
      el.calendar.style.setProperty('--rx', `${(9 - y * 10).toFixed(2)}deg`);
    });
    stage.addEventListener('pointerleave', () => {
      el.calendar.style.removeProperty('--ry');
      el.calendar.style.removeProperty('--rx');
    });
  }

  /* ---------- Main loop ---------- */
  let statusSig = '';
  function tick() {
    const t = now();
    const sig = EXAMS.map(e => statusOf(e, t)[0]).join('') + (nextExam(t)?.id ?? '-');
    if (sig !== statusSig) {
      const first = statusSig === '';
      statusSig = sig;
      renderModules(t);
      renderPapers(t, first);
    } else {
      updateCardTimers(t);
    }
    renderHero(t);
  }
  let timer;
  function loop() {
    tick();
    clearTimeout(timer);
    timer = setTimeout(loop, 1000 - (now() % 1000) + 10);
  }

  // Initial paint: show zeros, then flip to the real value
  board.build(String(split(Math.max(0, (nextExam(now())?.startTs ?? now()) - now())).d).padStart(C.minDayDigits || 3, '0').length);
  setTimeout(loop, reduceMotion.matches ? 0 : 250);
  // Render static parts immediately so there's no empty flash
  { const t = now(); statusSig = EXAMS.map(e => statusOf(e, t)[0]).join('') + (nextExam(t)?.id ?? '-'); renderModules(t); renderPapers(t, true); }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) loop(); });

  /* ---------- PWA: service worker + install ---------- */
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }

  const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  let deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    el.install.hidden = false;
  });
  window.addEventListener('appinstalled', () => { el.install.hidden = true; deferredPrompt = null; });
  if (isIOS && !standalone) el.install.hidden = false;

  el.install.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice.catch(() => {});
      deferredPrompt = null;
      el.install.hidden = true;
    } else if (isIOS) {
      el.iosHint.hidden = false;
    }
  });
  el.iosClose.addEventListener('click', () => { el.iosHint.hidden = true; });
})();
