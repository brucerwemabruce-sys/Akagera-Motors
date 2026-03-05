/**
 * Akagera Motors Rwanda — Core Application JS
 * Handles: API calls, auth state, multilingual, theme, routing
 */

// ── Configuration ─────────────────────────────────────────────────────────────
const API_BASE = './php/api.php/api';
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID'; // Replace in production

// ── State ─────────────────────────────────────────────────────────────────────
const App = {
  token:    localStorage.getItem('am_token'),
  user:     JSON.parse(localStorage.getItem('am_user') || 'null'),
  lang:     localStorage.getItem('am_lang') || 'en',
  theme:    localStorage.getItem('am_theme') || 'light',
  cars:     [],
  brands:   [],
  cart:     JSON.parse(localStorage.getItem('am_cart') || 'null'),
};

// ── API Helper ────────────────────────────────────────────────────────────────
async function api(method, endpoint, body = null, isForm = false) {
  const opts = {
    method,
    headers: { ...(App.token ? { Authorization: `Bearer ${App.token}` } : {}) },
  };
  if (body && !isForm) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  } else if (isForm) {
    opts.body = body; // FormData
  }
  try {
    const res = await fetch(`${API_BASE}/${endpoint}`, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  } catch (e) {
    showToast(e.message, 'error');
    throw e;
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────────
function setAuth(token, userData) {
  App.token = token;
  App.user  = userData;
  localStorage.setItem('am_token', token);
  localStorage.setItem('am_user', JSON.stringify(userData));
  updateAuthUI();
}

function logout() {
  App.token = null;
  App.user  = null;
  localStorage.removeItem('am_token');
  localStorage.removeItem('am_user');
  updateAuthUI();
  showPage('home');
  showToast(t('loggedOut'), 'success');
}

function updateAuthUI() {
  const nav  = document.getElementById('nav-auth');
  const mNav = document.getElementById('mobile-nav-auth');
  if (!nav) return;
  if (App.user) {
    const links = `
      <span class="nav-user-name">${App.user.name}</span>
      ${App.user.is_admin ? `<a href="#" onclick="showPage('admin')" class="nav-link">${t('adminPanel')}</a>` : `<a href="#" onclick="showPage('orders')" class="nav-link">${t('myOrders')}</a>`}
      <a href="#" onclick="logout()" class="nav-link nav-link-logout">${t('logout')}</a>
    `;
    nav.innerHTML  = links;
    if (mNav) mNav.innerHTML = links;
  } else {
    const links = `<a href="#" onclick="showModal('auth')" class="nav-btn">${t('signIn')}</a>`;
    nav.innerHTML  = links;
    if (mNav) mNav.innerHTML = links;
  }
}

// ── Translations ──────────────────────────────────────────────────────────────
const i18n = {
  en: {
    home:'Home', about:'About Us', contact:'Contact', cars:'Cars',
    signIn:'Sign In', logout:'Log Out', myOrders:'My Orders',
    loggedOut:'You have been logged out.',
    adminPanel:'Admin Panel', addCar:'Add Car',
    brand:'Brand', name:'Name', price:'Price', delivery:'Delivery',
    days:'days', order:'Order Now', colors:'Available Colors',
    orderSuccess:'Order placed! We will contact you shortly.',
    deliveryAddress:'Delivery Address', phone:'Phone Number',
    selectColor:'Select a color', submit:'Submit',
    aboutTitle:'About Akagera Motors Rwanda',
    contactTitle:'Contact Us', sendMessage:'Send Message',
    yourName:'Your Name', yourEmail:'Your Email', yourMessage:'Your Message',
    electric:'Electric', allBrands:'All Brands',
    search:'Search cars…', noResults:'No cars found.',
    welcomeTitle:'Drive The Future', welcomeSubtitle:'Rwanda\'s premier destination for new cars — from trusted Japanese brands to cutting-edge electric vehicles.',
    exploreCars:'Explore Cars', learnMore:'Learn More',
    loading:'Loading…', error:'Something went wrong.',
    orders:'Orders', status:'Status', orderedAt:'Ordered',
    pending:'Pending', confirmed:'Confirmed', delivered:'Delivered', cancelled:'Cancelled',
    password:'Password', email:'Email', register:'Create Account',
    orContinueWith:'or continue with', loginGoogle:'Continue with Google',
    noAccount:'No account?', haveAccount:'Have an account?',
    useMyLocation:'Use My Location', locationDetected:'Location detected!',
    estimatedDelivery:'Estimated Delivery',
    filterElectric:'Electric Cars', filterAll:'All Cars',
    adminOrders:'All Orders', adminCars:'Manage Cars', adminUsers:'Users',
    updateStatus:'Update Status', imageUrl:'Image URL',
    description:'Description', isElectric:'Electric Vehicle',
    cancel:'Cancel', save:'Save', delete:'Remove',
    confirmDelete:'Remove this car?',
    messageSent:'Message sent! We\'ll be in touch soon.',
    rwf:'RWF',
  },
  fr: {
    home:'Accueil', about:'À Propos', contact:'Contact', cars:'Voitures',
    signIn:'Connexion', logout:'Déconnexion', myOrders:'Mes Commandes',
    loggedOut:'Vous avez été déconnecté.',
    adminPanel:'Tableau de Bord', addCar:'Ajouter Voiture',
    brand:'Marque', name:'Nom', price:'Prix', delivery:'Livraison',
    days:'jours', order:'Commander', colors:'Couleurs Disponibles',
    orderSuccess:'Commande passée! Nous vous contacterons bientôt.',
    deliveryAddress:'Adresse de livraison', phone:'Numéro de téléphone',
    selectColor:'Choisir une couleur', submit:'Soumettre',
    aboutTitle:'À propos d\'Akagera Motors Rwanda',
    contactTitle:'Contactez-Nous', sendMessage:'Envoyer',
    yourName:'Votre Nom', yourEmail:'Votre Email', yourMessage:'Votre Message',
    electric:'Électrique', allBrands:'Toutes Marques',
    search:'Rechercher…', noResults:'Aucune voiture trouvée.',
    welcomeTitle:'Conduisez l\'Avenir', welcomeSubtitle:'La première destination rwandaise pour les nouvelles voitures — des marques japonaises aux véhicules électriques.',
    exploreCars:'Explorer', learnMore:'En Savoir Plus',
    loading:'Chargement…', error:'Une erreur s\'est produite.',
    orders:'Commandes', status:'Statut', orderedAt:'Commandé le',
    pending:'En attente', confirmed:'Confirmé', delivered:'Livré', cancelled:'Annulé',
    password:'Mot de passe', email:'Email', register:'Créer un compte',
    orContinueWith:'ou continuer avec', loginGoogle:'Continuer avec Google',
    noAccount:'Pas de compte?', haveAccount:'Déjà un compte?',
    useMyLocation:'Ma Position', locationDetected:'Position détectée!',
    estimatedDelivery:'Livraison Estimée',
    filterElectric:'Voitures Électriques', filterAll:'Toutes Voitures',
    adminOrders:'Toutes les Commandes', adminCars:'Gérer les Voitures', adminUsers:'Utilisateurs',
    updateStatus:'Mettre à jour', imageUrl:'URL de l\'image',
    description:'Description', isElectric:'Véhicule Électrique',
    cancel:'Annuler', save:'Sauvegarder', delete:'Supprimer',
    confirmDelete:'Supprimer cette voiture?',
    messageSent:'Message envoyé! Nous vous répondrons bientôt.',
    rwf:'RWF',
  },
  rw: {
    home:'Ahabanza', about:'Abo Turibo', contact:'Twandikire', cars:'Imodoka',
    signIn:'Injira', logout:'Sohoka', myOrders:'Amaporosi Yange',
    loggedOut:'Wasohowe.',
    adminPanel:'Imbaho y\'Ubuyobozi', addCar:'Ongeraho Imodoka',
    brand:'Ikigo', name:'Izina', price:'Igiciro', delivery:'Gutumira',
    days:'iminsi', order:'Saba Imodoka', colors:'Amabara Ahari',
    orderSuccess:'Iporosho ryakiriwe! Tuzakunyura vuba.',
    deliveryAddress:'Aderesi y\'itumanaho', phone:'Nomero ya Telefoni',
    selectColor:'Hitamo ibara', submit:'Ohereza',
    aboutTitle:'Ibyerekeye Akagera Motors Rwanda',
    contactTitle:'Twandikire', sendMessage:'Ohereza Ubutumwa',
    yourName:'Izina Ryawe', yourEmail:'Imeyili Yawe', yourMessage:'Ubutumwa Bwawe',
    electric:'Amashanyarazi', allBrands:'Ibigo Byose',
    search:'Shakisha imodoka…', noResults:'Nta modoka yabonetse.',
    welcomeTitle:'Enga Ejo Hazaza', welcomeSubtitle:'Ahantu h\'ibanze mu Rwanda ho kugura imodoka nshya — kuva ku ma marke y\'Ubuyapani kugeza ku binyabiziga byangwa na amashanyarazi.',
    exploreCars:'Reba Imodoka', learnMore:'Menya Byinshi',
    loading:'Gutegereza…', error:'Hari ikibazo cyabayeho.',
    orders:'Amaporosi', status:'Imimerere', orderedAt:'Yarasabwe',
    pending:'Birategerezwa', confirmed:'Byemejwe', delivered:'Byatanzwe', cancelled:'Birahagaritswe',
    password:'Ijambo ry\'ibanga', email:'Imeyili', register:'Fungura Konti',
    orContinueWith:'cyangwa komeza na', loginGoogle:'Komeza na Google',
    noAccount:'Nta konti ufite?', haveAccount:'Usanzwe ufite konti?',
    useMyLocation:'Koresha Aho Ndi', locationDetected:'Aho uri barabimenye!',
    estimatedDelivery:'Igihe Cyo Gutumira',
    filterElectric:'Imodoka z\'Amashanyarazi', filterAll:'Imodoka Zose',
    adminOrders:'Amaporosi Yose', adminCars:'Gucunga Imodoka', adminUsers:'Abakoresha',
    updateStatus:'Vugurura', imageUrl:'URL ya Ifoto',
    description:'Ibisobanuro', isElectric:'Imodoka y\'Amashanyarazi',
    cancel:'Hagarika', save:'Bika', delete:'Gukuraho',
    confirmDelete:'Kuraho iyi modoka?',
    messageSent:'Ubutumwa bwoherejwe! Tuzasubiza vuba.',
    rwf:'RWF',
  },
  sw: {
    home:'Nyumbani', about:'Kuhusu Sisi', contact:'Wasiliana', cars:'Magari',
    signIn:'Ingia', logout:'Toka', myOrders:'Maagizo Yangu',
    loggedOut:'Umetoka kwenye akaunti.',
    adminPanel:'Dashibodi ya Msimamizi', addCar:'Ongeza Gari',
    brand:'Chapa', name:'Jina', price:'Bei', delivery:'Utoaji',
    days:'siku', order:'Agiza Sasa', colors:'Rangi Zinazopatikana',
    orderSuccess:'Agizo limewekwa! Tutawasiliana nawe hivi karibuni.',
    deliveryAddress:'Anwani ya Utoaji', phone:'Nambari ya Simu',
    selectColor:'Chagua rangi', submit:'Wasilisha',
    aboutTitle:'Kuhusu Akagera Motors Rwanda',
    contactTitle:'Wasiliana Nasi', sendMessage:'Tuma Ujumbe',
    yourName:'Jina Lako', yourEmail:'Barua Pepe Yako', yourMessage:'Ujumbe Wako',
    electric:'Umeme', allBrands:'Chapa Zote',
    search:'Tafuta magari…', noResults:'Hakuna magari yaliyopatikana.',
    welcomeTitle:'Endesha Mustakabali', welcomeSubtitle:'Mahali pa kwanza Rwanda pa kununua magari mapya — kutoka kwa chapa za Kijapani hadi magari ya umeme.',
    exploreCars:'Chunguza Magari', learnMore:'Jifunze Zaidi',
    loading:'Inapakia…', error:'Kuna hitilafu.',
    orders:'Maagizo', status:'Hali', orderedAt:'Iliagizwa',
    pending:'Inasubiriwa', confirmed:'Imethibitishwa', delivered:'Imetolewa', cancelled:'Imefutwa',
    password:'Nenosiri', email:'Barua Pepe', register:'Fungua Akaunti',
    orContinueWith:'au endelea na', loginGoogle:'Endelea na Google',
    noAccount:'Huna akaunti?', haveAccount:'Una akaunti?',
    useMyLocation:'Tumia Eneo Langu', locationDetected:'Eneo limegunduliwa!',
    estimatedDelivery:'Wakati wa Utoaji',
    filterElectric:'Magari ya Umeme', filterAll:'Magari Yote',
    adminOrders:'Maagizo Yote', adminCars:'Simamia Magari', adminUsers:'Watumiaji',
    updateStatus:'Sasisha Hali', imageUrl:'URL ya Picha',
    description:'Maelezo', isElectric:'Gari la Umeme',
    cancel:'Ghairi', save:'Hifadhi', delete:'Ondoa',
    confirmDelete:'Ondoa gari hili?',
    messageSent:'Ujumbe umetumwa! Tutajibu hivi karibuni.',
    rwf:'RWF',
  }
};

function t(key) {
  return (i18n[App.lang] || i18n.en)[key] || key;
}

function setLang(lang) {
  App.lang = lang;
  localStorage.setItem('am_lang', lang);
  document.querySelectorAll('[data-lang]').forEach(el => {
    const key = el.dataset.lang;
    el.textContent = t(key);
  });
  document.querySelectorAll('[data-lang-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.langPlaceholder);
  });
  // Re-render current page
  const activePage = document.querySelector('.page.active');
  if (activePage) {
    const pageId = activePage.id.replace('page-', '');
    if (pageId === 'home' || pageId === 'cars') renderCars();
  }
  // Update lang selector
  document.querySelectorAll('.lang-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.lang === lang);
  });
}

// ── Theme ─────────────────────────────────────────────────────────────────────
function setTheme(theme) {
  App.theme = theme;
  localStorage.setItem('am_theme', theme);
  document.documentElement.setAttribute('data-theme', theme);
  const icon = document.getElementById('theme-icon');
  if (icon) icon.textContent = theme === 'dark' ? '☀' : '☽';
}

function toggleTheme() {
  setTheme(App.theme === 'dark' ? 'light' : 'dark');
}

// ── Page Router ───────────────────────────────────────────────────────────────
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const page = document.getElementById(`page-${pageId}`);
  if (page) page.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  closeMobileMenu();

  // Page-specific init
  if (pageId === 'home' || pageId === 'cars') renderCars();
  if (pageId === 'admin') { if (App.user?.is_admin) initAdmin(); else showPage('home'); }
  if (pageId === 'orders') renderOrders();

  // Update active nav link
  document.querySelectorAll('.nav-link[data-page]').forEach(l => {
    l.classList.toggle('active', l.dataset.page === pageId);
  });
}

// ── Toast Notifications ───────────────────────────────────────────────────────
function showToast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3500);
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function showModal(id) {
  document.getElementById(`modal-${id}`)?.classList.add('active');
}
function closeModal(id) {
  document.getElementById(`modal-${id}`)?.classList.remove('active');
}

// ── Mobile Menu ───────────────────────────────────────────────────────────────
function toggleMobileMenu() {
  document.getElementById('mobile-menu')?.classList.toggle('open');
}
function closeMobileMenu() {
  document.getElementById('mobile-menu')?.classList.remove('open');
}

// ── Cars ──────────────────────────────────────────────────────────────────────
let activeFilter = 'all'; // 'all' | 'electric' | brand_id
let searchQuery  = '';

async function loadCars() {
  try {
    [App.cars, App.brands] = await Promise.all([
      api('GET', 'cars'),
      api('GET', 'brands')
    ]);
    renderCars();
    renderBrandFilters();
  } catch (e) {
    console.error('Failed to load cars', e);
  }
}

function renderBrandFilters() {
  const container = document.getElementById('brand-filters');
  if (!container) return;
  const brandsWithCars = App.brands.filter(b =>
    App.cars.some(c => c.brand_id == b.id)
  );
  container.innerHTML = `
    <button class="filter-btn active" onclick="setFilter('all')" data-filter="all">${t('filterAll')}</button>
    <button class="filter-btn" onclick="setFilter('electric')" data-filter="electric">⚡ ${t('filterElectric')}</button>
    ${brandsWithCars.map(b => `
      <button class="filter-btn" onclick="setFilter(${b.id})" data-filter="${b.id}">
        ${b.logo_url ? `<img src="${b.logo_url}" alt="${b.name}" class="filter-logo" onerror="this.style.display='none'">` : ''}
        ${b.name}
      </button>
    `).join('')}
  `;
}

function setFilter(filter) {
  activeFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.filter == filter);
  });
  renderCars();
}

function handleSearch(e) {
  searchQuery = e.target.value.toLowerCase();
  renderCars();
}

function renderCars() {
  const grid = document.getElementById('cars-grid');
  if (!grid) return;

  let filtered = App.cars.filter(c => {
    const matchFilter = activeFilter === 'all'
      ? true
      : activeFilter === 'electric'
        ? c.is_electric == 1
        : c.brand_id == activeFilter;
    const matchSearch = !searchQuery
      || c.name.toLowerCase().includes(searchQuery)
      || c.brand_name.toLowerCase().includes(searchQuery);
    return matchFilter && matchSearch;
  });

  if (!filtered.length) {
    grid.innerHTML = `<p class="no-results">${t('noResults')}</p>`;
    return;
  }

  // Group by brand
  const byBrand = {};
  filtered.forEach(c => {
    if (!byBrand[c.brand_name]) byBrand[c.brand_name] = { logo: c.logo_url, cars: [] };
    byBrand[c.brand_name].cars.push(c);
  });

  grid.innerHTML = Object.entries(byBrand).map(([brand, data]) => `
    <div class="brand-section">
      <div class="brand-header">
        ${data.logo ? `<img src="${data.logo}" alt="${brand}" class="brand-logo-header" onerror="this.remove()">` : ''}
        <h2 class="brand-title">${brand}</h2>
      </div>
      <div class="car-row">
        ${data.cars.map(car => renderCarCard(car)).join('')}
      </div>
    </div>
  `).join('');
}

function renderCarCard(car) {
  const colors = Array.isArray(car.colors) ? car.colors : [];
  const imgSrc = car.image1 || `https://via.placeholder.com/400x260/1c1c1e/ffffff?text=${encodeURIComponent(car.name)}`;
  return `
    <div class="car-card" onclick="openCarDetail(${car.id})">
      <div class="car-card-img-wrap">
        ${car.is_electric ? '<span class="badge-electric">⚡ EV</span>' : ''}
        <img src="${imgSrc}" alt="${car.name}" class="car-card-img" loading="lazy" onerror="this.src='https://via.placeholder.com/400x260/1c1c1e/ffffff?text=No+Image'">
      </div>
      <div class="car-card-body">
        <p class="car-card-brand">${car.brand_name}</p>
        <h3 class="car-card-name">${car.name}</h3>
        <div class="car-card-colors">
          ${colors.slice(0, 6).map(c => `<span class="color-dot" style="background:${c}" title="${c}"></span>`).join('')}
        </div>
        <div class="car-card-footer">
          <span class="car-price">${formatPrice(car.price_rwf)} <small>${t('rwf')}</small></span>
          <span class="car-delivery">${car.delivery_days} ${t('days')}</span>
        </div>
      </div>
    </div>
  `;
}

function formatPrice(n) {
  return Number(n).toLocaleString();
}

// ── Car Detail Modal ───────────────────────────────────────────────────────────
function openCarDetail(carId) {
  const car = App.cars.find(c => c.id == carId);
  if (!car) return;

  const colors = Array.isArray(car.colors) ? car.colors : [];
  const images = [car.image1, car.image2, car.image3].filter(Boolean);
  let selectedColor = colors[0] || '#000000';
  let currentImg = 0;

  const modal = document.getElementById('modal-car');
  modal.innerHTML = `
    <div class="modal-overlay" onclick="closeCarDetail()"></div>
    <div class="modal-car-content">
      <button class="modal-close" onclick="closeCarDetail()">✕</button>

      <!-- Image Gallery -->
      <div class="car-gallery">
        <div class="gallery-main">
          <img id="gallery-main-img" src="${images[0] || 'https://via.placeholder.com/700x450/1c1c1e/ffffff?text=' + encodeURIComponent(car.name)}" alt="${car.name}">
        </div>
        ${images.length > 1 ? `
        <div class="gallery-thumbs">
          ${images.map((img, i) => `
            <img src="${img}" class="gallery-thumb ${i===0?'active':''}" onclick="switchGallery(${i}, this, '${img}')" alt="View ${i+1}">
          `).join('')}
        </div>` : ''}
      </div>

      <!-- Car Info -->
      <div class="car-detail-info">
        <div class="car-detail-brand">
          ${car.logo_url ? `<img src="${car.logo_url}" alt="${car.brand_name}" class="detail-brand-logo" onerror="this.remove()">` : ''}
          <span>${car.brand_name}</span>
          ${car.is_electric ? '<span class="badge-electric">⚡ Electric</span>' : ''}
        </div>
        <h1 class="car-detail-name">${car.name}</h1>
        ${car.description ? `<p class="car-detail-desc">${car.description}</p>` : ''}

        <div class="car-detail-price">
          <span class="detail-price-num">${formatPrice(car.price_rwf)}</span>
          <span class="detail-price-cur">RWF</span>
        </div>

        <div class="car-detail-meta">
          <div class="meta-item">
            <span class="meta-label">${t('estimatedDelivery')}</span>
            <span class="meta-val">${car.delivery_days} ${t('days')}</span>
          </div>
        </div>

        <!-- Color Picker -->
        <div class="color-section">
          <p class="color-label">${t('colors')} — <span id="color-name-display" style="color:${selectedColor}">${selectedColor}</span></p>
          <div class="color-picker" id="color-picker">
            ${colors.map((c, i) => `
              <button class="color-swatch ${i===0?'selected':''}"
                style="background:${c}; box-shadow: ${i===0?`0 0 0 2px var(--bg), 0 0 0 4px ${c}`:''}"
                onclick="selectColor('${c}', this)"
                title="${c}">
              </button>
            `).join('')}
          </div>
        </div>

        <button class="btn-order" onclick="startOrder(${car.id}, '${car.name}')">
          ${t('order')} →
        </button>
      </div>
    </div>
  `;
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function switchGallery(idx, el, src) {
  document.getElementById('gallery-main-img').src = src;
  document.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
}

function selectColor(hex, el) {
  document.querySelectorAll('.color-swatch').forEach(s => {
    s.style.boxShadow = '';
    s.classList.remove('selected');
  });
  el.classList.add('selected');
  el.style.boxShadow = `0 0 0 2px var(--bg), 0 0 0 4px ${hex}`;
  document.getElementById('color-name-display').textContent = hex;
  document.getElementById('color-name-display').style.color = hex;
  window._selectedColor = hex;
}

function closeCarDetail() {
  document.getElementById('modal-car').classList.remove('active');
  document.getElementById('modal-car').innerHTML = '';
  document.body.style.overflow = '';
}

// ── Order Flow ────────────────────────────────────────────────────────────────
function startOrder(carId, carName) {
  if (!App.user) { closeCarDetail(); showModal('auth'); return; }

  const color = window._selectedColor
    || document.querySelector('.color-swatch.selected')?.style.background
    || '#000000';

  App.cart = { carId, carName, color };
  localStorage.setItem('am_cart', JSON.stringify(App.cart));

  // Show order modal
  const modal = document.getElementById('modal-order');
  document.getElementById('order-car-name').textContent = carName;
  document.getElementById('order-color-preview').style.background = color;
  modal.classList.add('active');
}

async function submitOrder() {
  const address = document.getElementById('order-address').value.trim();
  const phone   = document.getElementById('order-phone').value.trim();
  if (!address || !phone) { showToast('Please fill all fields', 'error'); return; }

  const payload = {
    car_id: App.cart.carId,
    selected_color: App.cart.color,
    delivery_address: address,
    phone,
    lat: window._userLat || null,
    lng: window._userLng || null,
  };

  try {
    await api('POST', 'orders', payload);
    closeModal('order');
    closeCarDetail();
    showToast(t('orderSuccess'), 'success');
    App.cart = null;
    localStorage.removeItem('am_cart');
  } catch (e) { /* toast shown by api() */ }
}

function detectLocation() {
  if (!navigator.geolocation) { showToast('Geolocation not supported', 'error'); return; }
  navigator.geolocation.getCurrentPosition(pos => {
    window._userLat = pos.coords.latitude;
    window._userLng = pos.coords.longitude;
    showToast(t('locationDetected'), 'success');
    document.getElementById('btn-location').textContent = '✓ ' + t('locationDetected');
  }, () => showToast('Could not detect location', 'error'));
}

// ── My Orders ─────────────────────────────────────────────────────────────────
async function renderOrders() {
  const container = document.getElementById('orders-list');
  if (!container) return;
  container.innerHTML = `<p class="loading">${t('loading')}</p>`;
  try {
    const orders = await api('GET', 'orders');
    if (!orders.length) { container.innerHTML = '<p class="no-results">No orders yet.</p>'; return; }
    container.innerHTML = orders.map(o => `
      <div class="order-card">
        <img src="${o.image1 || ''}" alt="${o.car_name}" class="order-car-img" onerror="this.style.display='none'">
        <div class="order-info">
          <h3>${o.brand_name} ${o.car_name}</h3>
          <p><span class="color-dot" style="background:${o.selected_color}"></span> ${o.selected_color}</p>
          <p>📍 ${o.delivery_address}</p>
          <p>📞 ${o.phone}</p>
          <p class="order-date">${new Date(o.ordered_at).toLocaleDateString()}</p>
        </div>
        <span class="order-status status-${o.status}">${t(o.status)}</span>
      </div>
    `).join('');
  } catch (e) { container.innerHTML = `<p class="error">${t('error')}</p>`; }
}

// ── Auth Modal ────────────────────────────────────────────────────────────────
let authMode = 'login'; // 'login' | 'register'

function switchAuthMode(mode) {
  authMode = mode;
  document.getElementById('auth-login-form').style.display  = mode === 'login'    ? '' : 'none';
  document.getElementById('auth-register-form').style.display = mode === 'register' ? '' : 'none';
  document.getElementById('auth-switch-text').innerHTML = mode === 'login'
    ? `${t('noAccount')} <a href="#" onclick="switchAuthMode('register')">${t('register')}</a>`
    : `${t('haveAccount')} <a href="#" onclick="switchAuthMode('login')">${t('signIn')}</a>`;
}

async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-pass').value;
  try {
    const res = await api('POST', 'login', { email, password: pass });
    setAuth(res.token, { name: res.name, is_admin: res.is_admin, email });
    closeModal('auth');
    showToast(`Welcome back, ${res.name}!`, 'success');
    if (res.is_admin) showPage('admin');
  } catch (e) {}
}

async function doRegister() {
  const name  = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const pass  = document.getElementById('reg-pass').value;
  try {
    const res = await api('POST', 'register', { name, email, password: pass });
    setAuth(res.token, { name, is_admin: false, email });
    closeModal('auth');
    showToast(`Welcome, ${name}!`, 'success');
  } catch (e) {}
}

// ── Contact Form ──────────────────────────────────────────────────────────────
function submitContact(e) {
  e.preventDefault();
  // In production, connect to email service or backend
  showToast(t('messageSent'), 'success');
  e.target.reset();
}

// ── Admin Panel ───────────────────────────────────────────────────────────────
let adminTab = 'orders';

async function initAdmin() {
  switchAdminTab('orders');
}

function switchAdminTab(tab) {
  adminTab = tab;
  document.querySelectorAll('.admin-tab-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tab);
  });
  document.querySelectorAll('.admin-tab-panel').forEach(p => {
    p.style.display = p.dataset.panel === tab ? '' : 'none';
  });
  if (tab === 'orders') loadAdminOrders();
  if (tab === 'cars')   loadAdminCars();
  if (tab === 'users')  loadAdminUsers();
}

async function loadAdminOrders() {
  const container = document.getElementById('admin-orders-list');
  if (!container) return;
  container.innerHTML = `<p class="loading">${t('loading')}</p>`;
  const orders = await api('GET', 'admin-orders');
  container.innerHTML = `
    <table class="admin-table">
      <thead><tr>
        <th>Order</th><th>Customer</th><th>Car</th>
        <th>Color</th><th>Address</th><th>Phone</th><th>Date</th><th>Status</th>
      </tr></thead>
      <tbody>
        ${orders.map(o => `
          <tr>
            <td>#${o.id}</td>
            <td>${o.user_name}<br><small>${o.user_email}</small></td>
            <td>${o.brand_name} ${o.car_name}</td>
            <td><span class="color-dot" style="background:${o.selected_color}"></span></td>
            <td>${o.delivery_address}</td>
            <td>${o.phone}</td>
            <td>${new Date(o.ordered_at).toLocaleDateString()}</td>
            <td>
              <select class="status-select" onchange="updateStatus(${o.id}, this.value)">
                ${['pending','confirmed','delivered','cancelled'].map(s =>
                  `<option value="${s}" ${s===o.status?'selected':''}>${t(s)}</option>`
                ).join('')}
              </select>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

async function updateStatus(orderId, status) {
  await api('PUT', `order-status/${orderId}`, { status });
  showToast('Status updated', 'success');
}

async function loadAdminCars() {
  const container = document.getElementById('admin-cars-list');
  if (!container) return;
  container.innerHTML = `<p class="loading">${t('loading')}</p>`;
  const cars = await api('GET', 'cars');
  container.innerHTML = `
    <button class="btn-primary" onclick="showAddCarForm()" style="margin-bottom:1.5rem">+ ${t('addCar')}</button>
    <div id="add-car-form-container"></div>
    <table class="admin-table">
      <thead><tr><th>ID</th><th>Brand</th><th>Name</th><th>Price (RWF)</th><th>Delivery</th><th>EV</th><th>Actions</th></tr></thead>
      <tbody>
        ${cars.map(c => `
          <tr id="car-row-${c.id}">
            <td>${c.id}</td>
            <td>${c.brand_name}</td>
            <td>${c.name}</td>
            <td>${formatPrice(c.price_rwf)}</td>
            <td>${c.delivery_days}d</td>
            <td>${c.is_electric ? '⚡' : '—'}</td>
            <td>
              <button class="btn-sm" onclick="editCarInline(${c.id})">Edit</button>
              <button class="btn-sm btn-danger" onclick="deleteCar(${c.id})">Remove</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function showAddCarForm() {
  const brands = App.brands;
  document.getElementById('add-car-form-container').innerHTML = `
    <div class="admin-form-card">
      <h3>${t('addCar')}</h3>
      <div class="form-grid">
        <select id="af-brand"><option value="">Select Brand</option>${brands.map(b=>`<option value="${b.id}">${b.name}</option>`).join('')}</select>
        <input id="af-name" placeholder="${t('name')}" />
        <input id="af-price" type="number" placeholder="${t('price')} (RWF)" />
        <input id="af-days"  type="number" placeholder="${t('delivery')} (days)" />
        <input id="af-img1"  placeholder="Image 1 URL" />
        <input id="af-img2"  placeholder="Image 2 URL (optional)" />
        <input id="af-img3"  placeholder="Image 3 URL (optional)" />
        <input id="af-colors" placeholder='Colors: #000000,#FFFFFF' />
        <label><input type="checkbox" id="af-electric"> ${t('isElectric')}</label>
        <textarea id="af-desc" placeholder="${t('description')}"></textarea>
      </div>
      <div class="form-actions">
        <button class="btn-primary" onclick="submitAddCar()">${t('save')}</button>
        <button class="btn-secondary" onclick="document.getElementById('add-car-form-container').innerHTML=''">${t('cancel')}</button>
      </div>
    </div>
  `;
}

async function submitAddCar() {
  const colors = document.getElementById('af-colors').value.split(',').map(c=>c.trim()).filter(Boolean);
  const payload = {
    brand_id: document.getElementById('af-brand').value,
    name: document.getElementById('af-name').value,
    price_rwf: document.getElementById('af-price').value,
    delivery_days: document.getElementById('af-days').value,
    image1: document.getElementById('af-img1').value,
    image2: document.getElementById('af-img2').value,
    image3: document.getElementById('af-img3').value,
    colors,
    is_electric: document.getElementById('af-electric').checked ? 1 : 0,
    description: document.getElementById('af-desc').value,
  };
  await api('POST', 'cars', payload);
  showToast('Car added!', 'success');
  await loadCars();
  loadAdminCars();
}

async function deleteCar(id) {
  if (!confirm(t('confirmDelete'))) return;
  await api('DELETE', `cars/${id}`);
  showToast('Car removed', 'success');
  await loadCars();
  loadAdminCars();
}

async function loadAdminUsers() {
  const container = document.getElementById('admin-users-list');
  if (!container) return;
  const users = await api('GET', 'admin-users');
  container.innerHTML = `
    <table class="admin-table">
      <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Admin</th><th>Joined</th></tr></thead>
      <tbody>
        ${users.map(u => `
          <tr>
            <td>${u.id}</td>
            <td>${u.name}</td>
            <td>${u.email}</td>
            <td>${u.is_admin ? '✓ Admin' : '—'}</td>
            <td>${new Date(u.created_at).toLocaleDateString()}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  setTheme(App.theme);
  setLang(App.lang);
  updateAuthUI();
  loadCars();
  showPage('home');

  // Close modals on overlay click
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeCarDetail();
      closeModal('auth');
      closeModal('order');
    }
  });
});
