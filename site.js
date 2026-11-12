// 1) Work popup: a card with data-gallery opens its pictures (the long detail page first) in a window over the page.
// 2) Admin page (link + #admin, owner only, on the Claude link): change pictures, upload films, add pictures to a work's popup.
//    Files are saved into the page itself (media/...) and listed in data/slots.json, so everyone who opens the link sees them.
//    The normal page never shows any upload button, not even to the owner.
(function () {
  'use strict';
  const MAX = 15 * 1024 * 1024; // the largest file the page can keep
  let state = { slots: {}, galleries: {}, texts: {} };
  let artifact = null, owner = false, ready = false;
  const local = {}; // files uploaded in this visit: path -> blob url (relative paths still serve the old version)
  const kinds = {}; // path -> 'video' | 'image'
  const url = (p) => local[p] || p;
  const isVideo = (p) => kinds[p] === 'video' || /\.(mp4|webm|mov|m4v)$/i.test(p);

  /* ---------- the popup ---------- */
  const dlg = document.createElement('dialog');
  dlg.className = 'viewer';
  dlg.innerHTML = '<div class="viewer__bar"><h2 class="viewer__title"></h2><a class="viewer__open" target="_blank" rel="noopener" hidden>새 창으로 보기</a><button type="button" class="viewer__close">닫기</button></div><div class="viewer__body"></div>';
  document.body.append(dlg);
  const vbody = dlg.querySelector('.viewer__body');
  let unmount = null;
  function media(src, path) {
    if (isVideo(path || src)) { const v = document.createElement('video'); v.src = src; v.controls = true; v.playsInline = true; v.preload = 'metadata'; return v; }
    const i = document.createElement('img'); i.alt = ''; i.className = 'is-loading';
    i.onload = () => { i.classList.remove('is-loading'); if (i.naturalHeight > i.naturalWidth * 2) i.classList.add('is-long'); };
    i.onerror = () => i.classList.remove('is-loading');
    i.src = src; return i;
  }
  const vopen = dlg.querySelector('.viewer__open');
  function openPage(card) { // a whole portfolio page (the AI film) inside the popup
    if (unmount) { unmount(); unmount = null; }
    dlg.querySelector('.viewer__title').textContent = card.dataset.title;
    vbody.textContent = ''; vbody.classList.add('is-page'); dlg.classList.add('is-page');
    vopen.href = card.dataset.page; vopen.hidden = false;
    const f = document.createElement('iframe');
    f.className = 'viewer__frame'; f.src = card.dataset.page; f.title = card.dataset.title;
    vbody.append(f);
    if (!dlg.open) dlg.showModal();
  }
  function openViewer(card) {
    vbody.classList.remove('is-page'); dlg.classList.remove('is-page'); vopen.hidden = true;
    if (card.dataset.page) return openPage(card);
    const key = card.dataset.key;
    let list = card.dataset.gallery.split('|').map((p) => [p, p]);
    const slotImg = card.querySelector('img[data-slot]');
    if (slotImg && state.slots[slotImg.dataset.slot]) { const p = state.slots[slotImg.dataset.slot]; list.unshift([url(p), p]); }
    list = list.concat((state.galleries[key] || []).map((p) => [url(p), p]));
    dlg.querySelector('.viewer__title').textContent = card.dataset.title;
    if (unmount) { unmount(); unmount = null; }
    vbody.textContent = '';
    if (card.dataset.app && window.AppDemo) {
      const box = document.createElement('div'); box.className = 'viewer__app'; vbody.append(box);
      dlg.showModal();
      unmount = window.AppDemo.mount(box, card.dataset.app);
      list = list.slice(1); // the Figma board is shown as the screen flow under the phone
    }
    list.forEach(([src, p]) => vbody.append(media(src, p)));
    if (dlg.open) { vbody.scrollTop = 0; return; }
    dlg.showModal();
    vbody.scrollTop = 0;
  }
  document.addEventListener('click', (e) => {
    if (document.documentElement.classList.contains('is-admin')) return;
    const link = e.target.closest('[data-open]'); // menu links that open a work directly
    if (link) { const t = document.getElementById(link.dataset.open); if (t) { e.preventDefault(); openViewer(t); return; } }
    const card = e.target.closest('[data-gallery],[data-page]');
    if (!card) return;
    e.preventDefault();
    openViewer(card);
  });
  dlg.querySelector('.viewer__close').addEventListener('click', () => dlg.close());
  dlg.addEventListener('close', () => { if (dlg.classList.contains('is-page')) vbody.textContent = ''; });
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });

  /* ---------- show saved uploads on the page ---------- */
  function applyAll() { for (const [key, path] of Object.entries(state.slots)) applySlot(key, path); applyTexts(); }
  function applyTexts() {
    document.querySelectorAll('[data-text]').forEach((n) => {
      if (n.dataset.orig == null) n.dataset.orig = n.textContent;
      const t = state.texts && state.texts[n.dataset.text];
      n.textContent = t != null && t !== '' ? t : n.dataset.orig;
    });
  }
  function original(el) { if (!el.dataset.orig) el.dataset.orig = el.getAttribute(el.tagName === 'VIDEO' ? 'poster' : 'src') || ''; return el.dataset.orig; }
  function applySlot(key, path) {
    if (key === 'showreel') return applyShowreel(path);
    const el = document.querySelector(`[data-slot="${key}"]`);
    if (!el) return;
    original(el);
    if (el.tagName === 'VIDEO') {
      if (path) { el.src = url(path); el.controls = true; el.preload = 'metadata'; }
      else { el.removeAttribute('src'); el.controls = false; el.load(); }
    } else {
      el.removeAttribute('srcset'); el.src = path ? url(path) : el.dataset.orig;
    }
  }
  function applyShowreel(path) {
    const b = document.querySelector('[data-slot-video="showreel"]');
    if (!b) return;
    b.hidden = !path;
    b.onclick = path ? () => {
      const box = b.closest('.hero__media');
      const v = document.createElement('video');
      Object.assign(v, { src: url(path), controls: true, autoplay: true, playsInline: true });
      v.className = 'showreel-video';
      box.append(v); v.focus();
    } : null;
  }

  /* ---------- saving ---------- */
  const picker = document.createElement('input');
  picker.type = 'file'; picker.hidden = true; document.body.append(picker);
  let pending = null;
  function choose(accept, done) { pending = done; picker.accept = accept; picker.value = ''; picker.click(); }
  picker.addEventListener('change', () => { const f = picker.files[0]; if (f && pending) pending(f); });
  function toast(text) {
    let t = document.querySelector('.save-toast');
    if (!t) { t = document.createElement('p'); t.className = 'save-toast'; t.setAttribute('role', 'status'); document.body.append(t); }
    t.textContent = text; t.hidden = false;
    clearTimeout(t._h); t._h = setTimeout(() => (t.hidden = true), 4500);
  }
  function why(err) {
    const c = err && err.code;
    if (c === 'capability_disabled') return '공개 공유 중인 링크에서는 저장할 수 없어요. 공유를 잠시 끄고 다시 해 주세요.';
    if (c === 'too_large') return '파일이 너무 커요. 15MB 이하로 올려 주세요.';
    if (c === 'not_writer' || c === 'not_granted') return '저장할 권한이 없어요.';
    if (c === 'rate_limited') return '너무 자주 저장했어요. 잠시 후 다시 해 주세요.';
    if (c === 'conflict') return '다른 곳에서 먼저 바뀌어서 새로 불러올게요. 다시 해 주세요.';
    return '저장하지 못했어요. 다시 해 주세요.';
  }
  async function save(change, file) {
    if (file && file.size > MAX) { toast('파일이 너무 커요. 15MB 이하로 올려 주세요.'); return null; }
    const next = JSON.parse(JSON.stringify(state));
    const files = {};
    let path = null;
    if (file) {
      const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
      path = `media/${Date.now()}.${ext}`;
      files[path] = file;
    }
    const removed = change(next, path) || [];
    removed.forEach((p) => { if (p && p.startsWith('media/')) files[p] = null; });
    files['data/slots.json'] = { content: JSON.stringify(next), contentType: 'application/json' };
    toast(file ? '올리는 중이에요…' : '저장하는 중이에요…');
    try {
      await artifact.publish(files);
      if (file) { local[path] = URL.createObjectURL(file); kinds[path] = file.type.startsWith('video/') ? 'video' : 'image'; }
      state = next;
      applyAll();
      toast('저장했어요. 링크를 여는 모든 사람에게 보여요.');
      return path || true;
    } catch (err) { toast(why(err)); return null; }
  }

  /* ---------- the admin page ---------- */
  const NAMES = {
    'hero-photo': '첫 화면 배경 사진', 'services-photo': '하는 일 옆 사진',
    'work-odea': 'ODÉA 카드 사진', 'work-moa': 'MAISON MOA 카드 사진', 'work-elune': 'ELUNE 카드 사진',
    'work-aquavee': 'AQUAVÉE 카드 사진', 'work-doldam': '돌담 카드 사진', 'work-somsi': '솜씨 카드 사진',
    'app-shop': '모아샵 앱 사진', 'app-cafe': '오늘의 카페 앱 사진',
    'step-1': '작업 순서 1 사진', 'step-2': '작업 순서 2 사진', 'step-3': '작업 순서 3 사진',
    'poster-field': '포스터 1 사진', 'poster-stitched': '포스터 2 사진', 'poster-street': '거리 목업 사진',
    'close-photo': '맨 아래 연락 사진', 'film-lg-cover': '마지막 손님 카드 사진',
  };
  const VIDEOS = [['showreel', '첫 화면 쇼릴 영상 (재생 버튼)'], ['lg-trailer', '마지막 손님 예고편'], ['lg-film', '마지막 손님 본편']];
  const admin = document.createElement('section');
  admin.className = 'admin'; admin.hidden = true;
  document.body.append(admin);

  function el(tag, cls, text) { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function btn(text, fn, primary) { const b = el('button', 'admin__btn' + (primary ? ' admin__btn--primary' : ''), text); b.type = 'button'; b.onclick = fn; return b; }
  function thumb(src, video) {
    const box = el('div', 'admin__thumb');
    if (!src) { box.append(el('span', 'admin__empty', '비어 있음')); return box; }
    if (video) { const v = document.createElement('video'); v.src = src; v.muted = true; v.preload = 'metadata'; box.append(v); }
    else { const i = document.createElement('img'); i.src = src; i.alt = ''; box.append(i); }
    return box;
  }
  function renderAdmin() {
    admin.textContent = '';
    const head = el('div', 'admin__head');
    const back = el('a', 'admin__btn', '사이트 보기'); back.href = '#';
    head.append(el('h1', null, '관리자 페이지'), back);
    admin.append(head);
    admin.append(el('p', 'admin__note', '여기서 바꾼 글, 사진, 영상은 바로 저장되고, 링크를 여는 모든 사람에게 보여요. 이 페이지는 편집 권한이 있는 사람(은주 씨)만 쓸 수 있어요. 파일은 15MB까지, 링크를 공개 공유 중일 때는 저장이 막혀요.'));
    if (!owner) { admin.textContent = ''; admin.append(lockedBox()); return; }

    admin.append(el('h2', null, '글'));
    admin.append(el('p', 'admin__note', '칸을 고치고 저장하면 사이트 글이 바뀌어요. 비워 두고 저장하면 원래 글로 돌아가요.'));
    const tgrid = el('div', 'admin__texts');
    document.querySelectorAll('main [data-text]').forEach((n) => {
      const key = n.dataset.text;
      if (n.dataset.orig == null) n.dataset.orig = n.textContent;
      const box = el('div', 'admin__text');
      const ta = document.createElement('textarea');
      ta.value = (state.texts && state.texts[key]) || n.dataset.orig;
      const row = el('div', 'admin__row');
      row.append(btn('저장', () => save((nx) => { nx.texts = nx.texts || {}; const v = ta.value.trim(); if (!v || v === n.dataset.orig) delete nx.texts[key]; else nx.texts[key] = v; }).then(renderAdmin), true));
      if (state.texts && state.texts[key]) row.append(btn('원래대로', () => save((nx) => { delete (nx.texts || {})[key]; }).then(renderAdmin)));
      box.append(el('p', 'admin__name', n.dataset.textName || key), ta, row);
      tgrid.append(box);
    });
    admin.append(tgrid);

    admin.append(el('h2', null, '영상'));
    const vgrid = el('div', 'admin__grid');
    VIDEOS.forEach(([key, name]) => {
      const p = state.slots[key];
      const card = el('div', 'admin__card');
      card.append(thumb(p ? url(p) : '', true), el('p', 'admin__name', name));
      const row = el('div', 'admin__row');
      row.append(btn(p ? '영상 바꾸기' : '영상 올리기', () => choose('video/*', (f) => save((n, path) => { const old = n.slots[key]; n.slots[key] = path; return [old]; }, f).then(renderAdmin)), true));
      if (p) row.append(btn('지우기', () => save((n) => { const old = n.slots[key]; delete n.slots[key]; return [old]; }).then(renderAdmin)));
      card.append(row); vgrid.append(card);
    });
    admin.append(vgrid);

    admin.append(el('h2', null, '페이지 사진'));
    const pgrid = el('div', 'admin__grid');
    document.querySelectorAll('img[data-slot]').forEach((img) => {
      const key = img.dataset.slot;
      const p = state.slots[key];
      const card = el('div', 'admin__card');
      card.append(thumb(p ? url(p) : original(img)), el('p', 'admin__name', NAMES[key] || key));
      const row = el('div', 'admin__row');
      row.append(btn('사진 바꾸기', () => choose('image/*', (f) => save((n, path) => { const old = n.slots[key]; n.slots[key] = path; return [old]; }, f).then(renderAdmin)), true));
      if (p) row.append(btn('원래대로', () => save((n) => { const old = n.slots[key]; delete n.slots[key]; return [old]; }).then(renderAdmin)));
      card.append(row); pgrid.append(card);
    });
    admin.append(pgrid);

    admin.append(el('h2', null, '작업 팝업에 추가한 사진·영상'));
    admin.append(el('p', 'admin__note', '작업 카드를 누르면 뜨는 창 맨 아래에 순서대로 붙어요.'));
    document.querySelectorAll('[data-gallery]').forEach((card) => {
      const key = card.dataset.key;
      const box = el('div', 'admin__work');
      const top = el('div', 'admin__row');
      top.append(el('h3', null, card.dataset.title), btn('사진·영상 추가', () => choose('image/*,video/*', (f) => save((n, path) => { (n.galleries[key] = n.galleries[key] || []).push(path); }, f).then(renderAdmin)), true));
      box.append(top);
      const list = state.galleries[key] || [];
      if (!list.length) box.append(el('p', 'admin__note', '추가한 것 없음'));
      const g = el('div', 'admin__grid admin__grid--small');
      list.forEach((p, i) => {
        const c = el('div', 'admin__card');
        c.append(thumb(url(p), isVideo(p)));
        c.append(btn('지우기', () => save((n) => { const arr = n.galleries[key] || []; const [old] = arr.splice(i, 1); if (!arr.length) delete n.galleries[key]; return [old]; }).then(renderAdmin)));
        g.append(c);
      });
      box.append(g);
      admin.append(box);
    });
  }
  // owner-only "login": the viewer's Claude account decides. Nobody can sign up here; anyone who is not the owner sees no login at all.
  function lockedBox() {
    const box = el('div', 'login-box');
    const back = el('a', 'admin__btn', '사이트로 돌아가기'); back.href = '#';
    if (!ready) { box.append(el('h1', null, '확인하는 중이에요…')); return box; }
    box.append(el('h1', null, '관리자 전용'), el('p', null, '이 페이지는 사이트 주인만 들어올 수 있어요. 가입이나 다른 계정 로그인은 받지 않아요.'));
    const r = el('div', 'admin__row'); r.append(back); box.append(r);
    return box;
  }
  function renderLogin() {
    admin.textContent = '';
    if (!owner) { admin.append(lockedBox()); return; }
    const box = el('div', 'login-box');
    box.append(el('h1', null, '관리자로 로그인됨'), el('p', null, '클로드 계정으로 확인했어요. 글, 사진, 영상을 바꾸고 올릴 수 있어요.'));
    const r = el('div', 'admin__row');
    const go = el('a', 'admin__btn admin__btn--primary', '관리자 페이지로'); go.href = '#admin';
    const back = el('a', 'admin__btn', '사이트 보기'); back.href = '#';
    r.append(go, back); box.append(r); admin.append(box);
  }
  function showOwnerUi() {
    const chip = document.querySelector('.nav__login');
    if (chip) chip.hidden = !owner;
    let bar = document.querySelector('.owner-bar');
    if (owner && !bar) { bar = el('div', 'owner-bar'); bar.append(el('span', null, '관리자 모드')); const a = el('a', null, '편집하기'); a.href = '#admin'; bar.append(a); document.body.append(bar); }
    if (bar) bar.hidden = !owner || document.documentElement.classList.contains('is-admin');
  }
  function route() {
    const on = location.hash === '#admin' || location.hash === '#login';
    document.documentElement.classList.toggle('is-admin', on);
    admin.hidden = !on;
    if (on) { if (dlg.open) dlg.close(); (location.hash === '#login' ? renderLogin : renderAdmin)(); window.scrollTo(0, 0); }
    showOwnerUi();
  }
  window.addEventListener('hashchange', route);

  /* ---------- start ---------- */
  fetch('data/slots.json', { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : {}))
    .then((d) => { state = { slots: d.slots || {}, galleries: d.galleries || {}, texts: d.texts || {} }; applyAll(); if (location.hash === '#admin' || location.hash === '#login') route(); })
    .catch(() => {});
  route();
  function boot(tries) {
    if (!(window.claude && typeof window.claude.use === 'function')) {
      if (tries < 20) setTimeout(() => boot(tries + 1), 250); // only the Claude link has window.claude
      else { ready = true; route(); }
      return;
    }
    Promise.all([window.claude.use('artifact'), window.claude.use('user')]).then(async ([a, u]) => {
      artifact = a;
      try { owner = !!(a && u && (await u.canEdit())); } catch (e) { owner = false; }
      ready = true;
      route();
    }).catch(() => { ready = true; route(); });
  }
  boot(0);
})();
