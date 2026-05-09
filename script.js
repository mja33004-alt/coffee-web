// =========================================================
// Isles of Scilly Coffee Roaster — Cart & UI (localStorage, multi-page)
// =========================================================

const CART_KEY = 'roy-cart';

// ── Load / Save ──
function loadCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || {}; }
  catch { return {}; }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

let cart = loadCart();

// ── Price update (size dropdown) ──
function updatePrice(selectEl) {
  const card = selectEl.closest('[data-prices]');
  if (!card) return;
  try {
    const prices = JSON.parse(card.dataset.prices);
    const price = prices[selectEl.value];
    if (price !== undefined) {
      const priceEl = card.querySelector('.card-price, .price-big');
      if (priceEl) priceEl.textContent = '£' + price.toFixed(2);
    }
  } catch {}
}

// ── Add to cart (card with selectors) ──
function addToCart(btn) {
  const card = btn.closest('[data-prices]');
  if (!card) return;
  const name = card.querySelector('.card-title').textContent.trim();
  const priceText = (card.querySelector('.card-price') || card.querySelector('.price-big')).textContent;
  const price = parseFloat(priceText.replace('£', ''));
  const sizeSel  = card.querySelector('.size-sel');
  const grindSel = card.querySelector('.grind-sel');
  const size  = sizeSel  ? sizeSel.value  : '';
  const grind = grindSel ? grindSel.value : '';
  const key = name + (size ? ' · ' + size : '') + (grind ? ' · ' + grind : '');
  pushItem(key, price);
}

// ── Add to cart (fixed price) ──
function addToCartFixed(btn, name, price) {
  pushItem(name, price);
}

// ── Add to cart from product detail page (with optional Pu-erh addon) ──
function addToCartDetail() {
  const form = document.getElementById('productPurchaseForm');
  if (!form) return;
  const name    = form.dataset.productName;
  const sizeSel = form.querySelector('.size-sel');
  const grindSel = form.querySelector('.grind-sel');
  const size    = sizeSel  ? sizeSel.value  : '';
  const grind   = grindSel ? grindSel.value : '';
  const priceText = document.querySelector('.price-big').textContent;
  const price   = parseFloat(priceText.replace('£', ''));
  const key = name + (size ? ' · ' + size : '') + (grind ? ' · ' + grind : '');
  pushItem(key, price);

  // Pu-erh addon
  const addon = document.getElementById('puerhAddon');
  if (addon && addon.checked) {
    pushItem('Sticky Rice Pu-erh Tea · 1 piece', 1.00);
  }
  openCart();
}

function pushItem(key, price) {
  cart = loadCart();
  if (cart[key]) {
    cart[key].qty += 1;
  } else {
    cart[key] = { price, qty: 1 };
  }
  saveCart(cart);
  renderCart();
  updateHeaderCount();
  showToast('Added to basket');
}

function changeQty(key, delta) {
  cart = loadCart();
  if (!cart[key]) return;
  cart[key].qty += delta;
  if (cart[key].qty <= 0) delete cart[key];
  saveCart(cart);
  renderCart();
  updateHeaderCount();
}

// ── Render cart drawer ──
function renderCart() {
  const body  = document.getElementById('cartBody');
  const foot  = document.getElementById('cartFoot');
  if (!body) return;
  const entries = Object.entries(cart);
  let totalQty = 0, totalPrice = 0;

  if (entries.length === 0) {
    body.innerHTML = '<p class="cart-empty">Your basket is empty.</p>';
    if (foot) foot.style.display = 'none';
    updateHeaderCount();
    return;
  }

  body.innerHTML = entries.map(([key, { price, qty }]) => {
    totalQty  += qty;
    totalPrice += price * qty;
    const safe = key.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
    const parts = key.split(' · ');
    const title = parts[0];
    const sub   = parts.slice(1).join(' · ');
    return `<div class="cart-item">
      <div class="cart-item-info">
        <div class="cart-item-name">${title}</div>
        ${sub ? `<div class="cart-item-sub">${sub}</div>` : ''}
        <div class="cart-item-controls">
          <button class="qty-btn" onclick="changeQty('${safe}',-1)">−</button>
          <span class="cart-item-qty">${qty}</span>
          <button class="qty-btn" onclick="changeQty('${safe}',1)">+</button>
        </div>
      </div>
      <div class="cart-item-price">£${(price*qty).toFixed(2)}</div>
    </div>`;
  }).join('');

  if (foot) {
    foot.style.display = 'block';
    const totalEl = document.getElementById('cartTotal');
    if (totalEl) totalEl.textContent = '£' + totalPrice.toFixed(2);
  }
  updateHeaderCount();
}

function updateHeaderCount() {
  const el = document.getElementById('cartCount');
  if (!el) return;
  const total = Object.values(loadCart()).reduce((s,i) => s + i.qty, 0);
  el.textContent = total;
}

// ── Cart open / close ──
const cartBtn = document.getElementById('cartBtn');
if (cartBtn) cartBtn.addEventListener('click', openCart);

function openCart() {
  cart = loadCart();
  renderCart();
  const d = document.getElementById('cartDrawer');
  const o = document.getElementById('cartOverlay');
  if (d) d.classList.add('open');
  if (o) o.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  const d = document.getElementById('cartDrawer');
  const o = document.getElementById('cartOverlay');
  if (d) d.classList.remove('open');
  if (o) o.classList.remove('open');
  document.body.style.overflow = '';
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeCart(); });

// ── Toast ──
let _toastTimer;
function showToast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

// ── Sticky header shadow ──
const hdr = document.getElementById('header');
if (hdr) {
  window.addEventListener('scroll', () => {
    hdr.style.boxShadow = window.scrollY > 8 ? '0 2px 16px rgba(40,20,5,.10)' : '';
  }, { passive: true });
}

// ── Init on load ──
document.addEventListener('DOMContentLoaded', () => {
  updateHeaderCount();
});
