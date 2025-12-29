document.addEventListener('DOMContentLoaded', () => {
    
    // --- HUB LOGIC ---
    if(document.querySelector('.app-grid')) {
        const filters = document.querySelectorAll('.filter');
        const cards = document.querySelectorAll('.app-card');
        const searchInput = document.getElementById('searchInput');

        // Filter Click
        filters.forEach(btn => {
            btn.addEventListener('click', () => {
                filters.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const category = btn.getAttribute('data-filter');
                filterApps(category, searchInput.value);
            });
        });

        // Search Type
        searchInput.addEventListener('input', (e) => {
            const activeCategory = document.querySelector('.filter.active').getAttribute('data-filter');
            filterApps(activeCategory, e.target.value);
        });

        function filterApps(category, searchText) {
            const searchLower = searchText.toLowerCase();
            
            cards.forEach(card => {
                const cardCat = card.getAttribute('data-category');
                const cardName = card.getAttribute('data-name');
                
                const matchesCat = category === 'all' || cardCat === category;
                const matchesSearch = cardName.includes(searchLower);

                if (matchesCat && matchesSearch) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        }
    }

    // --- MOBILE MENU (INDEX) ---
    const mobileToggle = document.querySelector('.mobile-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if(mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
            if(navLinks.style.display === 'flex') {
                navLinks.style.flexDirection = 'column';
                navLinks.style.position = 'absolute';
                navLinks.style.top = '70px';
                navLinks.style.right = '0';
                navLinks.style.background = 'white';
                navLinks.style.width = '100%';
                navLinks.style.padding = '1rem';
                navLinks.style.boxShadow = '0 10px 20px rgba(0,0,0,0.05)';
            }
        });
    }
});

// --- HERO DYNAMIC TEXT ---
const words = [
    "Global Ecosystem",
    "Artificial Intelligence",
    "Quantum Computing",
    "Robotics",
    "Computer Vision",
    "Edge Computing"
];

let index = 0;
const textEl = document.getElementById("dynamic-text");

if (textEl) {
    setInterval(() => {
        textEl.style.opacity = 0;

        setTimeout(() => {
            index = (index + 1) % words.length;
            textEl.textContent = words[index];
            textEl.style.opacity = 1;
        }, 400);
    }, 2500);
}
