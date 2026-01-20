/**
 * Jaiho Hub Core Logic v3.0 (Production)
 * Handles state, data fetching, carousel automation, and DOM manipulation.
 */

// =========================================
// 1. STATE MANAGEMENT
// =========================================
const state = {
    data: null,
    filter: 'all',
    type: 'product', // 'product' or 'resource'
    searchQuery: '',
    sort: 'newest',
    carouselIndex: 0,
    carouselInterval: null
};

// =========================================
// 2. DOM CACHE
// =========================================
const DOM = {
    grid: document.getElementById('appGrid'),
    featuredTrack: document.getElementById('featuredTrack'),
    resultCount: document.getElementById('resultCount'),
    sectionTitle: document.getElementById('sectionTitle'),
    modal: document.getElementById('productModal'),
    searchInput: document.getElementById('searchInput'),
    navLinks: document.querySelectorAll('.nav-item'),
    tabs: document.querySelectorAll('.tab-btn'),

    // Carousel
    dotsContainer: document.getElementById('carouselDots'),
    prevBtn: document.getElementById('prevSlide'),
    nextBtn: document.getElementById('nextSlide'),

    // Mobile
    sidebar: document.getElementById('sidebar'),
    overlay: document.getElementById('sidebarOverlay'),
    menuToggle: document.getElementById('menuToggle'),
    closeSidebar: document.getElementById('closeSidebar')
};

// =========================================
// 3. INITIALIZATION
// =========================================
async function init() {
    try {
        const response = await fetch('data.json');
        if (!response.ok) throw new Error("Failed to load ecosystem data.");

        state.data = await response.json();

        // Initialize Components
        initCarousel();
        applyFilters(); // Initial render
        setupEventListeners();

        console.log(`[Jaiho Hub] System Online. Loaded ${state.data.meta.totalProducts} entities.`);
    } catch (error) {
        console.error("Critical Error:", error);
        DOM.grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 4rem; color: #EF4444;">
                <i class="fas fa-server fa-3x" style="margin-bottom: 1rem;"></i>
                <h3>Connection to Neural Core Failed</h3>
                <p>Please verify 'data.json' exists and is valid JSON.</p>
            </div>`;
    }
}

// =========================================
// 4. CAROUSEL ENGINE
// =========================================
function initCarousel() {
    const featuredIds = state.data.featured || [];
    const products = state.data.products;

    // Filter full objects for featured items
    const featuredItems = featuredIds.map(id => products.find(p => p.id === id)).filter(Boolean);

    if (featuredItems.length === 0) return;

    // 1. Render Slides
    DOM.featuredTrack.innerHTML = featuredItems.map(item => `
        <div class="carousel-slide" style="background: ${item.bannerGradient || 'linear-gradient(135deg, #1e293b, #0f172a)'}">
            <div class="slide-content">
                <span class="slide-badge"><i class="fas fa-star"></i> Featured Innovation</span>
                <h1 class="slide-title">${item.name}</h1>
                <p class="slide-desc">${item.tagline || item.description}</p>
                <button class="action-btn" style="width: auto; padding: 12px 24px; background: white; color: black;" onclick="openModal('${item.id}')">
                    Explore Platform
                </button>
            </div>
            <i class="fas ${item.icon} slide-bg-icon"></i>
        </div>
    `).join('');

    // 2. Render Dots
    DOM.dotsContainer.innerHTML = featuredItems.map((_, idx) =>
        `<div class="dot ${idx === 0 ? 'active' : ''}" data-index="${idx}"></div>`
    ).join('');

    // 3. Logic
    const updateSlide = () => {
        const slideWidth = DOM.featuredTrack.clientWidth; // Get width dynamically
        DOM.featuredTrack.style.transform = `translateX(-${state.carouselIndex * 100}%)`;

        // Update Dots
        document.querySelectorAll('.dot').forEach((d, idx) => {
            d.classList.toggle('active', idx === state.carouselIndex);
        });
    };

    const nextSlide = () => {
        state.carouselIndex = (state.carouselIndex + 1) % featuredItems.length;
        updateSlide();
    };

    const prevSlide = () => {
        state.carouselIndex = (state.carouselIndex - 1 + featuredItems.length) % featuredItems.length;
        updateSlide();
    };

    // Auto Scroll (5 seconds)
    state.carouselInterval = setInterval(nextSlide, 4000);

    // Controls
    DOM.nextBtn.addEventListener('click', () => {
        clearInterval(state.carouselInterval);
        nextSlide();
    });

    DOM.prevBtn.addEventListener('click', () => {
        clearInterval(state.carouselInterval);
        prevSlide();
    });

    // Dot Clicks
    document.querySelectorAll('.dot').forEach(dot => {
        dot.addEventListener('click', (e) => {
            clearInterval(state.carouselInterval);
            state.carouselIndex = parseInt(e.target.dataset.index);
            updateSlide();
        });
    });
}

// =========================================
// 5. CORE RENDERING ENGINE
// =========================================
function applyFilters() {
    // 1. Select Source (Products vs Resources)
    let items = state.type === 'product' ? [...state.data.products] : [...state.data.resources];

    // 2. Filter by Category
    if (state.filter !== 'all') {
        items = items.filter(item => item.category === state.filter);
    }

    // 3. Filter by Search Query
    if (state.searchQuery) {
        const q = state.searchQuery.toLowerCase();
        items = items.filter(item =>
            item.name.toLowerCase().includes(q) ||
            item.description.toLowerCase().includes(q) ||
            (item.tagline && item.tagline.toLowerCase().includes(q))
        );
    }

    // 4. Sort
    if (state.sort === 'alpha') {
        items.sort((a, b) => a.name.localeCompare(b.name));
    } else if (state.sort === 'popular') {
        // Mock popularity: Featured items first
        items.sort((a, b) => {
            const isAFeatured = state.data.featured.includes(a.id);
            const isBFeatured = state.data.featured.includes(b.id);
            return isBFeatured - isAFeatured;
        });
    }
    // 'newest' uses default JSON order (assuming JSON is appended recently)

    // Update UI Counters
    DOM.resultCount.textContent = `${items.length} Result${items.length !== 1 ? 's' : ''}`;

    renderGrid(items);
}

function renderGrid(items) {
    if (items.length === 0) {
        DOM.grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);">
                <i class="fas fa-search fa-2x" style="margin-bottom: 1rem; opacity: 0.5;"></i>
                <p>No results found for current filters.</p>
            </div>`;
        return;
    }

    DOM.grid.innerHTML = items.map(item => {
        const isResource = state.type === 'resource';
        const cardClass = isResource ? 'resource-card' : 'app-card';

        // CSS Utility Classes
        const iconColorClass = `icon-${item.category}`; // e.g. icon-ai
        const statusClass = item.status ? `stat-${item.status.toLowerCase().replace(/ /g, '-')}` : '';
        const devClass = item.developedBy ? `dev-${item.developedBy.toLowerCase().replace(/ /g, '-')}` : '';

        return `
        <div class="${cardClass}" onclick="openModal('${item.id}')">
            <div class="card-top">
                <div class="icon-box ${isResource ? 'resource-icon' : iconColorClass}">
                    <i class="fas ${item.icon}"></i>
                </div>
                ${!isResource && item.status ? `<span class="status-pill ${statusClass}">${item.status}</span>` : ''}
            </div>
            
            <div class="meta">
                <h3>${item.name}</h3>
                <p>${item.tagline || item.description}</p>
                ${item.developedBy ? `<span class="dev-badge ${devClass}">${item.developedBy}</span>` : ''}
            </div>

            <button class="launch-btn">
                ${isResource ? 'Read Document' : 'View Details'}
            </button>
        </div>
        `;
    }).join('');
}

// =========================================
// 6. MODAL SYSTEM
// =========================================
window.openModal = function (id) {
    // Search in both arrays to find the ID
    const item = [...state.data.products, ...state.data.resources].find(i => i.id === id);
    if (!item) return;

    // 1. Header
    document.getElementById('modalTitle').innerText = item.name;
    document.getElementById('modalTagline').innerText = item.tagline || item.category.toUpperCase();

    // 2. Badges
    const devEl = document.getElementById('modalDev');
    devEl.innerText = item.developedBy || 'Jaiho Ecosystem';
    devEl.className = `modal-dev dev-${(item.developedBy || '').toLowerCase().replace(/ /g, '-')}`; // Re-use dev badge color logic

    const statusEl = document.getElementById('modalStatus');
    statusEl.innerText = item.status || 'Active';
    statusEl.className = `modal-status stat-${(item.status || '').toLowerCase().replace(/ /g, '-')}`;

    // 3. Icon
    const iconEl = document.getElementById('modalIcon');
    iconEl.innerHTML = `<i class="fas ${item.icon}"></i>`;
    // Use category color for icon background if needed, currently white in CSS

    // 4. Description
    document.getElementById('modalDesc').innerText = item.fullDescription || item.description;

    // 5. Features List
    const featContainer = document.getElementById('modalFeatures');
    const points = item.features || item.topics || [];
    featContainer.innerHTML = points.length > 0
        ? points.map(f => `<li>${f}</li>`).join('')
        : `<li>No specific features listed.</li>`;

    // 6. Sidebar Meta
    document.getElementById('modalVersion').innerText = item.version || 'v1.0';

    // Tech Stack Tags
    const stackContainer = document.getElementById('modalStack');
    if (item.techStack && item.techStack.length > 0) {
        stackContainer.innerHTML = item.techStack.map(t =>
            `<span class="tech-tag">${t}</span>`
        ).join('');
    } else {
        stackContainer.innerHTML = `<span class="tech-tag">Standard</span>`;
    }

    // 7. Action Button
    const linkBtn = document.getElementById('modalLink');
    if (item.link && item.link !== "#") {
        linkBtn.href = item.link;
        linkBtn.innerHTML = state.type === 'resource'
            ? `Open Resource <i class="fas fa-external-link-alt"></i>`
            : `Launch Application <i class="fas fa-external-link-alt"></i>`;
        linkBtn.style.display = 'block';
    } else {
        linkBtn.style.display = 'none';
    }

    // Show Modal
    DOM.modal.classList.add('active');
};

// Modal Close Handlers
document.getElementById('closeModal').onclick = () => DOM.modal.classList.remove('active');
DOM.modal.onclick = (e) => { if (e.target === DOM.modal) DOM.modal.classList.remove('active'); };

// =========================================
// 7. EVENT LISTENERS
// =========================================
function setupEventListeners() {

    // 1. Sidebar Navigation
    DOM.navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const btn = e.currentTarget;
            if (!btn.dataset.filter) return; // Skip if not a filter button

            // UI Updates
            DOM.navLinks.forEach(l => l.classList.remove('active'));
            btn.classList.add('active');
            DOM.sectionTitle.textContent = btn.innerText.trim();

            // State Updates
            state.filter = btn.dataset.filter;
            state.type = btn.dataset.type; // 'product' or 'resource'

            // Scroll to top
            document.querySelector('.content-body').scrollTop = 0;

            // Trigger Render
            applyFilters();

            // Mobile: Close Sidebar on selection
            if (window.innerWidth <= 1024) toggleSidebar(false);
        });
    });

    // 2. Search Input
    DOM.searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.trim();
        applyFilters();
    });

    // 3. Tab Sorting
    DOM.tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            DOM.tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            state.sort = tab.dataset.sort;
            applyFilters();
        });
    });

    // 4. Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            DOM.searchInput.focus();
        }
        if (e.key === 'Escape') {
            DOM.modal.classList.remove('active');
        }
    });

    // 5. Mobile Menu Toggles
    DOM.menuToggle.onclick = () => toggleSidebar(true);
    DOM.closeSidebar.onclick = () => toggleSidebar(false);
    DOM.overlay.onclick = () => toggleSidebar(false);
}

function toggleSidebar(show) {
    if (show) {
        DOM.sidebar.classList.add('active');
        DOM.overlay.classList.add('active');
    } else {
        DOM.sidebar.classList.remove('active');
        DOM.overlay.classList.remove('active');
    }
}

// Start the System
init();