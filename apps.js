// Working demos of the two Figma apps. window.AppDemo.mount(container, 'shop' | 'cafe') draws a phone that really works:
// 모아샵: home -> product -> options -> cart (quantities, select, delete, totals) -> paid.
// 오늘의 카페: menu tabs -> drink options (temperature, size, shots, note) -> bag -> order number.
(function () {
  'use strict';
  const IMG = 'images/apps/';
  const won = (n) => n.toLocaleString('ko-KR') + '원';
  const h = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const chrome = (dark) => `<div class="island"></div><div class="status" style="color:${dark ? '#fff' : '#1b1d24'}"><span>9:41</span><i></i></div><div class="homebar"></div>`;

  function toast(app, text) {
    let t = app.querySelector('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; app.append(t); }
    t.textContent = text; t.hidden = false;
    clearTimeout(t._h); t._h = setTimeout(() => (t.hidden = true), 1800);
  }

  /* ---------------- 모아샵 ---------------- */
  const PRODUCTS = {
    cream: { name: '아쿠아베 수분크림', full: '히알루론 수분크림', brand: 'AQUAVÉE 아쿠아베', img: 'cream.jpg', page: 'aquavee-full.jpg', rate: '4.9', reviews: '1,284', cat: '뷰티',
      opts: [{ label: '50ml', price: 24900, orig: 31000 }, { label: '100ml', price: 41900, orig: 52000 }] },
    juice: { name: '돌담 감귤주스 6병', full: '제주 감귤주스', brand: 'DOLDAM 돌담', img: 'juice.jpg', page: 'doldam-full.jpg', rate: '4.8', reviews: '862', cat: '식품',
      opts: [{ label: '6병', price: 18000, orig: 20000 }, { label: '12병', price: 34000, orig: 40000 }] },
    knit: { name: '솜씨 울 블렌드 니트', full: '울 블렌드 니트', brand: 'SOMSI 솜씨', img: 'knit.jpg', page: 'somsi-full.jpg', rate: '4.7', reviews: '415', cat: '패션',
      opts: [{ label: '크림 / M', price: 39000, orig: 39000 }, { label: '크림 / L', price: 39000, orig: 39000 }] },
  };
  const pct = (o) => Math.round((1 - o.price / o.orig) * 100);

  function shop(app) {
    const s = { screen: 'home', tab: 0, cat: null, pid: 'cream', opt: 0, likes: {}, cart: [{ pid: 'knit', opt: 0, qty: 1, on: true }] };
    const go = (screen) => { s.screen = screen; draw(); app.querySelector('.scr').scrollTop = 0; };

    function home() {
      if (s.tab === 2) {
        const liked = Object.keys(s.likes).filter((k) => s.likes[k]);
        return `<div class="scr home"><div class="head"><h3>찜</h3></div>${liked.length ? `<div class="prods">${liked.map(card).join('')}</div>` : '<p class="empty">하트를 누른 상품이 여기에 모여요</p>'}</div>`;
      }
      const list = Object.keys(PRODUCTS).filter((k) => !s.cat || PRODUCTS[k].cat === s.cat);
      const count = s.cart.reduce((a, c) => a + c.qty, 0);
      return `<div class="scr home">
        <div class="head"><h3>모아샵</h3><button class="round" data-act="cart" aria-label="장바구니">🛍${count ? `<b>${count}</b>` : ''}</button></div>
        <div class="banner"><img src="${IMG}cream.jpg" alt=""><p><b>이번 주 뷰티 특가</b>최대 30% 할인</p><span>1/4</span></div>
        <div class="cats">${[['뷰티', 'cat-beauty'], ['식품', 'cat-food'], ['패션', 'cat-fashion'], ['리빙', 'cat-living']].map(([n, i]) =>
          `<button data-act="cat" data-v="${n}" class="${s.cat === n ? 'on' : ''}"><img src="${IMG}${i}.jpg" alt="">${n}</button>`).join('')}</div>
        <div class="row-h"><h4>${s.cat ? s.cat + ' 상품' : '지금 많이 찾는 상품'}</h4><small>${s.cat ? '<button data-act="cat" data-v="">전체보기</button>' : '전체보기'}</small></div>
        ${list.length ? `<div class="prods">${list.map(card).join('')}</div>` : '<p class="empty">리빙 상품은 준비 중이에요</p>'}
      </div>`;
    }
    function card(k) {
      const p = PRODUCTS[k], o = p.opts[0], d = pct(o);
      return `<div class="prod"><button data-act="open" data-v="${k}" style="display:block;width:100%;text-align:left"><img src="${IMG}${p.img}" alt=""><p>${p.name}</p><strong>${d ? `<em>${d}%</em>` : ''}${won(o.price)}</strong></button>
        <button class="heart ${s.likes[k] ? 'on' : ''}" data-act="like" data-v="${k}" aria-label="찜">${s.likes[k] ? '♥' : '♡'}</button></div>`;
    }
    function detail() {
      const p = PRODUCTS[s.pid], o = p.opts[s.opt], d = pct(o);
      return `<div class="scr detail"><img src="${IMG}${p.img}" alt="">
        <div class="body"><p class="brand">${p.brand}</p><h3>${p.full} ${p.opts[s.opt].label.includes('/') ? '' : o.label}</h3>
        <p class="rate"><b>★ ${p.rate}</b>리뷰 ${p.reviews}</p>
        <p class="price">${d ? `<em>${d}%</em>` : ''}${won(o.price)}${d ? `<s>${won(o.orig)}</s>` : ''}</p>
        <div class="opt-h">옵션</div><div class="opts">${p.opts.map((x, i) => `<button data-act="opt" data-v="${i}" class="${i === s.opt ? 'on' : ''}">${x.label}</button>`).join('')}</div>
        <div class="ship">오늘 주문하면 내일 도착 · 무료배송</div></div>
        <div class="ptabs"><span class="on">상품정보</span><span>리뷰 ${p.reviews}</span><span>문의</span></div>
        <div class="longpage ${s.open ? 'is-open' : ''}"><img src="images/works/${p.page}" alt="${p.full} 상세페이지" loading="lazy">
          ${s.open ? '' : '<button class="more" data-act="more">상품정보 더보기 ⌄</button>'}</div>
        ${s.open ? '<button class="totop" data-act="top">맨 위로 ↑</button>' : ''}</div>
        <button class="back back--glass" data-act="home" aria-label="뒤로">‹</button>
        <div class="footbar"><button class="like ${s.likes[s.pid] ? 'on' : ''}" data-act="like" data-v="${s.pid}" aria-label="찜">${s.likes[s.pid] ? '♥' : '♡'}</button><button class="cta" data-act="buy">구매하기</button></div>`;
    }
    function totals() {
      let orig = 0, price = 0;
      s.cart.filter((c) => c.on).forEach((c) => { const o = PRODUCTS[c.pid].opts[c.opt]; orig += o.orig * c.qty; price += o.price * c.qty; });
      return { orig, price, disc: orig - price };
    }
    function cart() {
      const t = totals(), all = s.cart.length && s.cart.every((c) => c.on), n = s.cart.filter((c) => c.on).length;
      return `<div class="scr cart"><div class="cart-h"><button class="back" data-act="home" aria-label="뒤로">‹</button>장바구니</div>
        ${s.cart.length ? `<div class="selbar"><button class="chk ${all ? 'on' : ''}" data-act="all">전체 선택 (${n}/${s.cart.length})</button><button data-act="del">선택 삭제</button></div>
        ${s.cart.map((c, i) => { const p = PRODUCTS[c.pid], o = p.opts[c.opt]; return `<div class="item"><button class="chk ${c.on ? 'on' : ''}" data-act="pick" data-v="${i}" aria-label="선택"></button><img src="${IMG}${p.img}" alt="">
          <div><p>${p.brand.split(' ')[1] || ''} ${p.full}</p><small>${o.label}</small><div class="bot"><strong>${won(o.price * c.qty)}</strong>
          <span class="qty"><button data-act="minus" data-v="${i}" aria-label="빼기">−</button><span>${c.qty}</span><button data-act="plus" data-v="${i}" aria-label="더하기">+</button></span></div></div></div>`; }).join('')}
        <div class="sum"><div>상품 금액<b>${won(t.orig)}</b></div><div>할인 금액<b class="red">${t.disc ? '−' + won(t.disc) : '0원'}</b></div><div>배송비<b>무료</b></div><div class="total">결제 예정 금액<b>${won(t.price)}</b></div></div>`
        : '<p class="empty">장바구니가 비어 있어요</p>'}
      </div><div class="footbar"><button class="cta" data-act="pay" ${t.price ? '' : 'disabled'}>${t.price ? won(t.price) + ' 결제하기' : '상품을 담아 주세요'}</button></div>`;
    }
    function paid() {
      return `<div class="scr"><div class="done"><div class="ok">✓</div><h3>결제가 완료됐어요</h3><p>포트폴리오용 데모라 실제 결제는 되지 않아요</p></div></div>
        <div class="footbar"><button class="cta" data-act="restart">처음으로</button></div>`;
    }
    function draw() {
      const body = s.screen === 'detail' ? detail() : s.screen === 'cart' ? cart() : s.screen === 'paid' ? paid() : home();
      const tabs = s.screen === 'home' ? `<nav class="tabbar">${['홈', '카테고리', '찜', '마이'].map((n, i) => `<button data-act="tab" data-v="${i}" class="${s.tab === i ? 'on' : ''}">${n}</button>`).join('')}</nav>` : '';
      app.innerHTML = body + tabs + chrome(s.screen === 'detail');
    }
    app.addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      const v = b.dataset.v, a = b.dataset.act;
      if (a === 'open') { s.pid = v; s.opt = 0; s.open = false; go('detail'); }
      else if (a === 'more') { const sc = app.querySelector('.scr'), y = sc.scrollTop; s.open = true; draw(); app.querySelector('.scr').scrollTop = y; }
      else if (a === 'top') { app.querySelector('.scr').scrollTo({ top: 0, behavior: 'smooth' }); }
      else if (a === 'home') go('home');
      else if (a === 'cart') go('cart');
      else if (a === 'cat') { s.cat = v && s.cat !== v ? v : null; draw(); }
      else if (a === 'tab') { const i = +v; if (i === 1) { s.tab = 0; s.cat = s.cat ? null : '뷰티'; } else if (i === 3) { toast(app, '마이 페이지는 데모에서 비워 뒀어요'); return; } else s.tab = i; draw(); }
      else if (a === 'like') { s.likes[v] = !s.likes[v]; toast(app, s.likes[v] ? '찜했어요' : '찜을 취소했어요'); draw(); }
      else if (a === 'opt') { s.opt = +v; draw(); }
      else if (a === 'buy') {
        const f = s.cart.find((c) => c.pid === s.pid && c.opt === s.opt);
        if (f) { f.qty++; f.on = true; } else s.cart.unshift({ pid: s.pid, opt: s.opt, qty: 1, on: true });
        go('cart');
      }
      else if (a === 'plus') { s.cart[+v].qty = Math.min(9, s.cart[+v].qty + 1); draw(); }
      else if (a === 'minus') { s.cart[+v].qty = Math.max(1, s.cart[+v].qty - 1); draw(); }
      else if (a === 'pick') { s.cart[+v].on = !s.cart[+v].on; draw(); }
      else if (a === 'all') { const on = !s.cart.every((c) => c.on); s.cart.forEach((c) => (c.on = on)); draw(); }
      else if (a === 'del') { const n = s.cart.filter((c) => c.on).length; if (!n) { toast(app, '삭제할 상품을 골라 주세요'); return; } s.cart = s.cart.filter((c) => !c.on); draw(); }
      else if (a === 'pay') go('paid');
      else if (a === 'restart') { s.cart = [{ pid: 'knit', opt: 0, qty: 1, on: true }]; s.tab = 0; s.cat = null; go('home'); }
    });
    draw();
  }

  /* ---------------- 오늘의 카페 ---------------- */
  const MENU = [
    { id: 'americano', name: '아메리카노', desc: '진하고 깔끔한 기본', price: 4500, img: 'americano.jpg', cats: ['커피'], drink: true },
    { id: 'latte', name: '카페라떼', desc: '부드러운 우유 거품', price: 5000, img: 'latte.jpg', cats: ['커피', '라떼'], drink: true },
    { id: 'vanilla', name: '바닐라 라떼', desc: '달콤한 바닐라 시럽', long: '달콤한 바닐라 시럽과 고소한 에스프레소', price: 5300, img: 'vanilla.jpg', cats: ['커피', '라떼'], drink: true },
    { id: 'cheesecake', name: '뉴욕 치즈케이크', desc: '꾸덕한 크림치즈', long: '꾸덕한 크림치즈로 만든 한 조각', price: 6500, img: 'cheesecake.jpg', cats: ['커피', '디저트'], drink: false },
  ];
  const SIZES = [['톨', -500], ['그란데', 0], ['벤티', 500]];
  let orderNo = 27;

  function cafe(app) {
    const s = { screen: 'menu', cat: '커피', tab: 0, item: null, temp: 1, size: 1, shot: 0, qty: 1, note: '', bag: [], last: null };
    const go = (screen) => { s.screen = screen; draw(); const sc = app.querySelector('.scr'); if (sc) sc.scrollTop = 0; };
    const unit = () => s.item.price + (s.item.drink ? SIZES[s.size][1] + s.shot * 500 : 0);
    const bagCount = () => s.bag.reduce((a, b) => a + b.qty, 0);

    function menu() {
      if (s.tab === 1) {
        return `<div class="scr menu"><div class="head"><div><h3>주문내역</h3><small>성수점 · 픽업</small></div></div>${s.last ? `<div class="bline" style="margin-top:24px"><img src="${IMG}${s.last.items[0].img}" alt=""><div><p>주문 번호 ${s.last.no}</p><small>${h(s.last.items.map((i) => i.name).join(', '))}</small><strong>${won(s.last.total)}</strong></div><span></span></div>` : '<p class="empty">아직 주문한 내역이 없어요</p>'}</div>`;
      }
      const list = MENU.filter((m) => m.cats.includes(s.cat));
      return `<div class="scr menu">
        <div class="head"><div><h3>오늘의 카페</h3><small>성수점 · 픽업</small></div><button class="bag" data-act="bag" aria-label="담은 메뉴">${bagCount()}</button></div>
        <div class="chips">${['커피', '라떼', '티', '디저트'].map((c) => `<button data-act="cat" data-v="${c}" class="${s.cat === c ? 'on' : ''}">${c}</button>`).join('')}</div>
        ${list.length ? list.map((m) => `<button class="mitem" data-act="open" data-v="${m.id}"><img src="${IMG}${m.img}" alt=""><span><p>${m.name}</p><small>${m.desc}</small><strong>${won(m.price)}</strong></span><span class="plus">+</span></button>`).join('')
          : '<p class="empty">티 메뉴는 준비 중이에요</p>'}
      </div>`;
    }
    function pick() {
      const m = s.item;
      const seg = (title, opts, cur, act) => `<div class="og"><h4>${title}</h4><div class="seg">${opts.map((o, i) => `<button data-act="${act}" data-v="${i}" class="${i === cur ? 'on' : ''}">${o}</button>`).join('')}</div></div>`;
      return `<div class="scr pick"><img src="${IMG}${m.img}" alt="">
        <div class="sheet"><div class="t"><h3>${m.name}</h3><b>${won(m.price)}</b></div><p class="d">${m.long || m.desc}</p>
        ${m.drink ? seg('온도', ['HOT', 'ICE'], s.temp, 'temp') + seg('사이즈', SIZES.map(([n, p]) => `${n}${p ? `<small>${p > 0 ? '+' : '−'}${Math.abs(p)}</small>` : ''}`), s.size, 'size')
          + `<div class="shot"><h4>샷 추가 (+500원)</h4><span class="qty"><button data-act="shot-" aria-label="샷 빼기">−</button><span>${s.shot}</span><button data-act="shot+" aria-label="샷 추가">+</button></span></div>` : ''}
        <div class="shot"><h4>수량</h4><span class="qty"><button data-act="qty-" aria-label="수량 빼기">−</button><span>${s.qty}</span><button data-act="qty+" aria-label="수량 더하기">+</button></span></div>
        <div class="og"><h4>요청사항</h4><input class="req" maxlength="40" placeholder="${m.drink ? '얼음 적게 주세요' : '포크 2개 주세요'}" value="${h(s.note)}"></div></div></div>
        <button class="back back--glass" data-act="menu" aria-label="뒤로">‹</button>
        <div class="footbar"><button class="cta" data-act="add">담기 · ${won(unit() * s.qty)}</button></div>`;
    }
    function bag() {
      const total = s.bag.reduce((a, b) => a + b.unit * b.qty, 0);
      return `<div class="scr bagscr"><div class="bag-h"><button class="back" data-act="menu" aria-label="뒤로">‹</button>담은 메뉴</div>
        ${s.bag.length ? s.bag.map((b, i) => `<div class="bline"><img src="${IMG}${b.img}" alt=""><div><p>${b.name}${b.qty > 1 ? ' × ' + b.qty : ''}</p><small>${h(b.opts)}</small><strong>${won(b.unit * b.qty)}</strong></div><button class="x" data-act="rm" data-v="${i}" aria-label="빼기">×</button></div>`).join('')
          + `<div class="btotal"><span>합계</span><span>${won(total)}</span></div>` : '<p class="empty">담은 메뉴가 없어요</p>'}
      </div><div class="footbar"><button class="cta" data-act="order" ${s.bag.length ? '' : 'disabled'}>${s.bag.length ? won(total) + ' 주문하기' : '메뉴를 담아 주세요'}</button></div>`;
    }
    function done() {
      const o = s.last, hasCake = o.items.some((i) => i.id === 'cheesecake');
      return `<div class="scr done"><div class="ok"><svg width="52" height="40" viewBox="0 0 52 40"><path d="M4 20l15 15L48 4" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
        <h3>주문이 들어갔어요</h3><p>음료가 준비되면 알림을 보내 드릴게요</p>
        <div class="ticket"><small>주문 번호</small><b>${o.no}</b><div class="r"><span>픽업 예상</span><b>약 ${Math.min(15, 5 + o.items.length * 3)}분 후</b></div><p>${h(o.items.map((i) => i.name + (i.opts ? ' ' + i.opts : '')).join(' / '))}</p></div>
        ${hasCake ? '' : `<button class="reco" data-act="reco"><img src="${IMG}cheesecake.jpg" alt=""><span><p>치즈케이크도 함께 어때요?</p><small>지금 추가하면 500원 할인</small></span></button>`}
      </div><div class="footbar"><button class="cta" data-act="history">주문 내역 보기</button></div>`;
    }
    function draw() {
      const body = s.screen === 'pick' ? pick() : s.screen === 'bag' ? bag() : s.screen === 'done' ? done() : menu();
      const tabs = s.screen === 'menu' ? `<nav class="tabbar">${['메뉴', '주문내역', '스탬프', '마이'].map((n, i) => `<button data-act="tab" data-v="${i}" class="${s.tab === i ? 'on' : ''}">${n}</button>`).join('')}</nav>` : '';
      app.innerHTML = body + tabs + chrome(s.screen === 'pick');
      const req = app.querySelector('.req'); if (req) req.addEventListener('input', () => (s.note = req.value));
    }
    function openItem(id) { s.item = MENU.find((m) => m.id === id); s.temp = 1; s.size = 1; s.shot = 0; s.qty = 1; s.note = ''; go('pick'); }
    app.addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      const a = b.dataset.act, v = b.dataset.v;
      if (a === 'open') openItem(v);
      else if (a === 'menu') go('menu');
      else if (a === 'cat') { s.cat = v; draw(); }
      else if (a === 'tab') { const i = +v; if (i >= 2) { toast(app, i === 2 ? '스탬프 3개 모였어요' : '마이 페이지는 데모에서 비워 뒀어요'); return; } s.tab = i; draw(); }
      else if (a === 'temp') { s.temp = +v; draw(); }
      else if (a === 'size') { s.size = +v; draw(); }
      else if (a === 'shot+') { s.shot = Math.min(3, s.shot + 1); draw(); }
      else if (a === 'shot-') { s.shot = Math.max(0, s.shot - 1); draw(); }
      else if (a === 'qty+') { s.qty = Math.min(9, s.qty + 1); draw(); }
      else if (a === 'qty-') { s.qty = Math.max(1, s.qty - 1); draw(); }
      else if (a === 'add') {
        const m = s.item;
        const opts = m.drink ? [['HOT', 'ICE'][s.temp], SIZES[s.size][0], s.shot ? '샷 ' + s.shot : ''].filter(Boolean).join(' · ') + (s.note ? ' · ' + s.note : '') : s.note;
        s.bag.push({ id: m.id, name: m.name, img: m.img, unit: unit(), qty: s.qty, opts });
        s.tab = 0; go('menu'); toast(app, `${m.name}을(를) 담았어요`);
      }
      else if (a === 'bag') go('bag');
      else if (a === 'rm') { s.bag.splice(+v, 1); draw(); }
      else if (a === 'order') { s.last = { no: 'A-' + orderNo++, items: s.bag.slice(), total: s.bag.reduce((x, y) => x + y.unit * y.qty, 0) }; s.bag = []; go('done'); }
      else if (a === 'reco') { s.last.items.push({ id: 'cheesecake', name: '뉴욕 치즈케이크', img: 'cheesecake.jpg', unit: 6000, qty: 1, opts: '' }); s.last.total += 6000; draw(); toast(app, '치즈케이크를 추가했어요 (500원 할인)'); }
      else if (a === 'history') { s.tab = 1; go('menu'); }
    });
    draw();
  }

  /* ---------------- mount ---------------- */
  const FLOW = {
    shop: [['shop-1', '홈'], ['shop-2', '상품 상세'], ['shop-3', '장바구니']],
    cafe: [['cafe-1', '메뉴'], ['cafe-2', '메뉴 선택'], ['cafe-3', '주문 완료']],
  };
  function fit(wrap) {
    const vh = window.innerHeight;
    const s = Math.min(1, (vh - 190) / 868, (wrap.parentElement.clientWidth - 8) / 414);
    wrap.style.setProperty('--ps', Math.max(0.55, s).toFixed(3));
  }
  window.AppDemo = {
    mount(box, kind) {
      box.innerHTML = `<div class="app-demo"><p class="app-demo__hint">직접 눌러 보세요. 피그마 디자인 그대로 동작하는 데모예요.</p>
        <div class="phone-wrap"><div class="phone"><div class="app ${kind}"></div></div></div></div>
        <div class="flow"><h4>피그마 화면 흐름</h4><div class="flow__row">${FLOW[kind].map(([f, n], i) =>
          `${i ? '<span class="flow__arrow" aria-hidden="true">→</span>' : ''}<figure><img src="${IMG}${f}.jpg" alt="${n} 화면" loading="lazy"><figcaption>${i + 1}. ${n}</figcaption></figure>`).join('')}</div></div>`;
      const wrap = box.querySelector('.phone-wrap');
      fit(wrap);
      const onResize = () => fit(wrap);
      window.addEventListener('resize', onResize);
      (kind === 'shop' ? shop : cafe)(box.querySelector('.app'));
      return () => window.removeEventListener('resize', onResize);
    },
  };
})();
