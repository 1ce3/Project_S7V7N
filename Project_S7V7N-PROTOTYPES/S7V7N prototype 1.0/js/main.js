// js/main.js
import { productsCollection } from './config.js';
import { state } from './state.js';
import { showToast } from './ui.js';
import * as Auth from './auth.js';
import * as Shop from './shop.js';
import * as Admin from './admin.js';
import * as AI from './ai.js';

// 2. Data Loader
export async function loadProductsFromFirebase() {
    try {
        const snap = await productsCollection.get();
        state.allProducts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        console.log("Loaded products:", state.allProducts.length);
    } catch (e) {
        console.error(e);
        // The showToast function is not available here, so we just log the error.
    }
}

// 3. Initialization & "Window" assignments
// Since your HTML uses onclick="addToCart()", we must attach these to the window object.
document.addEventListener('DOMContentLoaded', async () => {
    // --- Global Function Assignments ---
    // Functions called by inline `onclick` attributes in the HTML must be attached to the window object.
    window.addToCart = Shop.addToCart;
    window.removeFromCart = Shop.removeFromCart;
    window.updateQuantity = Shop.updateQuantity;
    window.toggleCompare = Shop.toggleCompare;
    window.handleCheckout = Shop.handleCheckout;
    window.handleLogout = Auth.handleLogout;
    window.editProduct = Admin.editProduct;
    window.deleteProduct = Admin.deleteProduct;
    window.clearCompareList = () => {
        state.compareList = [];
        Shop.renderComparePage();
    };
    // --- End Global Assignments ---
    // --- Common Setup for All Pages ---
    // Load product data and update the navigation bar on every page.
    Auth.checkAuthState(); // Check for a logged-in user first!
    await loadProductsFromFirebase();
    Auth.updateNav();

    // --- Page-Specific Initializers ---
    // Check for a unique element on each page to determine which page-specific scripts to run.

    // Home Page
    if (document.getElementById('page-home')) {
        console.log("Initializing Home Page");
        Shop.loadHomePage();
        document.getElementById('ai-helper-btn').addEventListener('click', AI.handleAiBuildHelper);
    }

    // Category Page
    if (document.getElementById('page-category')) {
        console.log("Initializing Category Page");
        Shop.initCategoryPage();
        document.getElementById('price-filter').addEventListener('input', Shop.handlePriceFilter);
    }
    
    // Product Detail Page
    if (document.getElementById('page-product')) {
        console.log("Initializing Product Page");
        Shop.initProductPage();
    }

    // Admin Page
    if (document.getElementById('page-admin')) {
        console.log("Initializing Admin Page");
        Admin.renderAdminPage();
        document.getElementById('admin-product-form').addEventListener('submit', Admin.handleProductFormSubmit);
        document.getElementById('generate-desc-btn').addEventListener('click', AI.handleGenerateDescription);
    }
    
    // Login/Register Pages
    if (document.getElementById('login-form')) document.getElementById('login-form').addEventListener('submit', Auth.handleLogin);
    if (document.getElementById('register-form')) document.getElementById('register-form').addEventListener('submit', Auth.handleRegister);

    // Cart & Compare Pages
    if (document.getElementById('page-cart')) {
        Shop.renderCart();
        document.getElementById('checkout-btn').addEventListener('click', Shop.handleCheckout);
    }
    if (document.getElementById('page-compare')) {
        Shop.renderComparePage();
        document.getElementById('ai-compare-btn').addEventListener('click', AI.handleAiCompare);
    }
});