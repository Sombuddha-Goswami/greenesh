// ===== GREENESH MAIN PAGE LOGIC (FIREBASE) =====

// --- Product Rendering from Firestore ---
async function renderProducts() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    try {
        const snapshot = await db.collection('products').orderBy('createdAt', 'desc').get();

        if (snapshot.empty) {
            grid.innerHTML = `
        <div class="no-products">
          <div class="no-products-icon">📦</div>
          <h3>No products yet</h3>
          <p>Check back soon — exciting products are on the way!</p>
        </div>`;
            return;
        }

        const products = [];
        snapshot.forEach(doc => products.push({ id: doc.id, ...doc.data() }));

        grid.innerHTML = products.map(product => `
      <div class="product-card">
        <div class="product-image">
          ${product.image
                ? `<img src="${product.image}" alt="${escapeHtml(product.name)}" loading="lazy">`
                : `<span class="placeholder-icon">📦</span>`}
          <span class="product-category">${escapeHtml(product.category || 'General')}</span>
        </div>
        <div class="product-info">
          <h3 class="product-name">${escapeHtml(product.name)}</h3>
          <p class="product-description">${escapeHtml(product.description)}</p>
          <div class="product-footer">
            <span class="product-price">${escapeHtml(product.price || '')}</span>
            <a href="${product.link || '#'}" class="product-link" target="_blank" rel="noopener">View Product →</a>
          </div>
        </div>
      </div>`).join('');

    } catch (error) {
        console.error('Error loading products:', error);
        grid.innerHTML = `
      <div class="no-products">
        <div class="no-products-icon">⚠️</div>
        <h3>Unable to load products</h3>
        <p>Please check back later or contact us.</p>
      </div>`;
    }
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// --- Navbar ---
function initNavbar() {
    const navbar = document.getElementById('navbar');
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');

    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
    });

    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            navLinks.classList.toggle('open');
        });

        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navToggle.classList.remove('active');
                navLinks.classList.remove('open');
            });
        });
    }
}

// --- Scroll Reveal ---
function initReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('visible');
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.reveal, .stagger-children').forEach(el => observer.observe(el));
}

// --- Smooth Scroll ---
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) target.scrollIntoView({ behavior: 'smooth' });
        });
    });
}

// --- Feedback Form (saves to Firestore) ---
function initFeedbackForm() {
    const form = document.getElementById('feedbackForm');
    const status = document.getElementById('formStatus');
    const submitBtn = document.getElementById('submitBtn');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;

        const feedback = {
            name: document.getElementById('name').value.trim(),
            email: document.getElementById('email').value.trim(),
            message: document.getElementById('message').value.trim(),
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            read: false
        };

        try {
            await db.collection('feedback').add(feedback);
            status.textContent = '✅ Thank you! Your feedback has been received.';
            status.className = 'form-status success';
            form.reset();
        } catch (err) {
            console.error('Feedback error:', err);
            status.textContent = '⚠️ Something went wrong. Please try again later.';
            status.className = 'form-status error';
        } finally {
            submitBtn.textContent = 'Send Feedback →';
            submitBtn.disabled = false;
        }
    });
}

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
    renderProducts();
    initNavbar();
    initReveal();
    initSmoothScroll();
    initFeedbackForm();
});
