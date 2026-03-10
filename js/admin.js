// ===== GREENESH ADMIN PANEL — FIREBASE EDITION =====

let products = [];
let deleteTargetId = null;

// --- Helpers ---
function showToast(message, type = '') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast show' + (type ? ' ' + type : '');
    setTimeout(() => { toast.className = 'toast'; }, 3000);
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ===== AUTH (Firebase) =====
function initAuth() {
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    const loginScreen = document.getElementById('loginScreen');
    const dashboard = document.getElementById('adminDashboard');
    const logoutBtn = document.getElementById('logoutBtn');
    const loginBtn = document.getElementById('loginBtn');

    // Listen for auth state
    auth.onAuthStateChanged((user) => {
        if (user) {
            loginScreen.style.display = 'none';
            dashboard.style.display = 'block';
            loadProducts();
            loadFeedback();
        } else {
            loginScreen.style.display = 'flex';
            dashboard.style.display = 'none';
        }
    });

    // Login form
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        loginBtn.textContent = 'Signing in...';
        loginBtn.disabled = true;

        try {
            await auth.signInWithEmailAndPassword(email, password);
        } catch (error) {
            loginError.textContent = getAuthError(error.code);
            loginError.classList.add('show');
            setTimeout(() => loginError.classList.remove('show'), 4000);
        } finally {
            loginBtn.textContent = 'Sign In →';
            loginBtn.disabled = false;
        }
    });

    // Logout
    logoutBtn.addEventListener('click', () => {
        auth.signOut();
    });
}

function getAuthError(code) {
    const errors = {
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/too-many-requests': 'Too many attempts. Please try again later.',
        'auth/invalid-credential': 'Invalid email or password.',
    };
    return errors[code] || 'Login failed. Please try again.';
}

// ===== FIRESTORE CRUD =====

// Load products from Firestore (real-time listener)
function loadProducts() {
    db.collection('products').orderBy('createdAt', 'desc').onSnapshot((snapshot) => {
        products = [];
        snapshot.forEach(doc => {
            products.push({ id: doc.id, ...doc.data() });
        });
        renderTable();
        updateStats();
    }, (error) => {
        console.error('Error listening to products:', error);
        showToast('Error loading products from database', '');
    });
}

// Add product to Firestore
async function addProduct(data) {
    try {
        data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        await db.collection('products').add(data);
        showToast('Product added successfully!', 'success');
    } catch (error) {
        console.error('Error adding product:', error);
        showToast('Failed to add product. Check console for details.', '');
    }
}

// Update product in Firestore
async function updateProduct(id, data) {
    try {
        data.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
        await db.collection('products').doc(id).update(data);
        showToast('Product updated!', 'success');
    } catch (error) {
        console.error('Error updating product:', error);
        showToast('Failed to update product.', '');
    }
}

// Delete product from Firestore
async function deleteProduct(id) {
    try {
        await db.collection('products').doc(id).delete();
        showToast('Product deleted.', '');
    } catch (error) {
        console.error('Error deleting product:', error);
        showToast('Failed to delete product.', '');
    }
}

// ===== STATS =====
function updateStats() {
    document.getElementById('totalProducts').textContent = products.length;
    const categories = new Set(products.map(p => p.category).filter(Boolean));
    document.getElementById('totalCategories').textContent = categories.size;
}

// ===== TABLE RENDERING =====
function renderTable() {
    const tbody = document.getElementById('productTableBody');
    const emptyState = document.getElementById('emptyState');
    const table = document.getElementById('productTable');

    if (products.length === 0) {
        table.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    table.style.display = 'table';
    emptyState.style.display = 'none';

    tbody.innerHTML = products.map(p => `
    <tr>
      <td>
        <div class="product-table-name">
          <div class="product-table-thumb">
            ${p.image ? `<img src="${p.image}" alt="${escapeHtml(p.name)}">` : '📦'}
          </div>
          <div>
            <div class="product-table-title">${escapeHtml(p.name)}</div>
            <div class="product-table-desc">${escapeHtml(p.description)}</div>
          </div>
        </div>
      </td>
      <td><span class="product-table-category">${escapeHtml(p.category || 'Uncategorized')}</span></td>
      <td><span class="product-table-price">${escapeHtml(p.price || '—')}</span></td>
      <td>
        <div class="product-table-actions">
          <button class="action-btn edit" onclick="editProduct('${p.id}')" title="Edit">✏️</button>
          <button class="action-btn delete" onclick="confirmDeleteProduct('${p.id}')" title="Delete">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ===== MODAL =====
function openModal(title = 'Add Product') {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('productModal').classList.add('open');
}

function closeModal() {
    document.getElementById('productModal').classList.remove('open');
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
}

// ===== EDIT / DELETE HANDLERS =====
window.editProduct = function (id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    document.getElementById('productId').value = product.id;
    document.getElementById('productName').value = product.name || '';
    document.getElementById('productDescription').value = product.description || '';
    document.getElementById('productPrice').value = product.price || '';
    document.getElementById('productCategory').value = product.category || '';
    document.getElementById('productImage').value = product.image || '';
    document.getElementById('productLink').value = product.link || '';

    openModal('Edit Product');
};

window.confirmDeleteProduct = function (id) {
    deleteTargetId = id;
    document.getElementById('confirmDialog').classList.add('open');
};

// ===== SEED PRODUCTS =====
async function seedProducts() {
    if (typeof PRODUCTS === 'undefined' || !PRODUCTS.length) {
        showToast('No seed data found in products.js', '');
        return;
    }

    const existing = await db.collection('products').limit(1).get();
    if (!existing.empty) {
        if (!confirm('Products already exist in the database. Seed anyway? (This will add duplicates)')) {
            return;
        }
    }

    try {
        const batch = db.batch();
        PRODUCTS.forEach(product => {
            const ref = db.collection('products').doc();
            batch.set(ref, {
                name: product.name,
                description: product.description,
                price: product.price,
                image: product.image || '',
                category: product.category || '',
                link: product.link || '#',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        });
        await batch.commit();
        showToast(`${PRODUCTS.length} products seeded to Firestore!`, 'success');
    } catch (error) {
        console.error('Error seeding:', error);
        showToast('Failed to seed products.', '');
    }
}

// ===== FEEDBACK =====
let feedbackItems = [];

function loadFeedback() {
    db.collection('feedback').orderBy('createdAt', 'desc').onSnapshot((snapshot) => {
        feedbackItems = [];
        snapshot.forEach(doc => {
            feedbackItems.push({ id: doc.id, ...doc.data() });
        });
        renderFeedback();
        document.getElementById('totalFeedback').textContent = feedbackItems.length;
    }, (error) => {
        console.error('Error loading feedback:', error);
    });
}

function renderFeedback() {
    const list = document.getElementById('feedbackList');
    const empty = document.getElementById('feedbackEmpty');

    if (feedbackItems.length === 0) {
        list.innerHTML = '';
        list.appendChild(empty);
        empty.style.display = 'block';
        return;
    }

    empty.style.display = 'none';
    list.innerHTML = feedbackItems.map(f => {
        const date = f.createdAt ? new Date(f.createdAt.seconds * 1000).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
        }) : 'Just now';

        return `
        <div class="feedback-card">
            <div class="feedback-card-header">
                <div class="feedback-card-author">
                    <div class="feedback-avatar">${escapeHtml(f.name?.charAt(0) || '?')}</div>
                    <div>
                        <div class="feedback-card-name">${escapeHtml(f.name)}</div>
                        <div class="feedback-card-email">${escapeHtml(f.email)}</div>
                    </div>
                </div>
                <div class="feedback-card-meta">
                    <span class="feedback-card-date">${date}</span>
                    <button class="action-btn delete" onclick="deleteFeedback('${f.id}')" title="Delete">🗑️</button>
                </div>
            </div>
            <p class="feedback-card-message">${escapeHtml(f.message)}</p>
        </div>`;
    }).join('');
}

window.deleteFeedback = async function (id) {
    try {
        await db.collection('feedback').doc(id).delete();
        showToast('Feedback deleted.', '');
    } catch (error) {
        console.error('Error deleting feedback:', error);
    }
};

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    initAuth();

    // Add Product
    document.getElementById('addProductBtn').addEventListener('click', () => {
        openModal('Add Product');
    });

    // Modal close
    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('productModal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) closeModal();
    });

    // Product form submit
    document.getElementById('productForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const saveBtn = document.getElementById('saveProductBtn');
        const id = document.getElementById('productId').value;

        const data = {
            name: document.getElementById('productName').value.trim(),
            description: document.getElementById('productDescription').value.trim(),
            price: document.getElementById('productPrice').value.trim(),
            category: document.getElementById('productCategory').value.trim(),
            image: document.getElementById('productImage').value.trim(),
            link: document.getElementById('productLink').value.trim() || '#',
        };

        saveBtn.textContent = 'Saving...';
        saveBtn.disabled = true;

        if (id) {
            await updateProduct(id, data);
        } else {
            await addProduct(data);
        }

        saveBtn.textContent = 'Save Product';
        saveBtn.disabled = false;
        closeModal();
    });

    // Confirm delete
    document.getElementById('confirmDelete').addEventListener('click', async () => {
        if (deleteTargetId) {
            await deleteProduct(deleteTargetId);
            deleteTargetId = null;
        }
        document.getElementById('confirmDialog').classList.remove('open');
    });

    document.getElementById('confirmCancel').addEventListener('click', () => {
        deleteTargetId = null;
        document.getElementById('confirmDialog').classList.remove('open');
    });

    // Seed products
    document.getElementById('seedBtn').addEventListener('click', seedProducts);
});
