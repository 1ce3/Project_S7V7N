// js/main.js
import { db, productsCollection } from './config.js';
import { state } from './state.js';
import { showToast } from './utils.js';
import * as Auth from './auth.js';
import * as Shop from './shop.js';
import * as Admin from './admin.js';
import * as AI from './ai.js';

// 1. Global Router
export function showPage(pageId, context = null) {
    document.querySelectorAll('.page').forEach(el => el.classList.remove('page-active'));
    const target = document.getElementById(pageId);
    if (target) target.classList.add('page-active');
    
    state.currentPage = pageId;
    window.scrollTo(0,0);

    if (pageId === 'page-category') {
        // ... logic to filter products ...
        const list = context === 'All' ? state.allProducts : state.allProducts.filter(p => p.category === context);
        document.getElementById('category-product-grid').innerHTML = list.map(Shop.createProductCard).join('');
    }
    if (pageId === 'page-cart') Shop.renderCart();
    if (pageId === 'page-admin') Admin.renderAdminPage();
    if (pageId === 'page-compare') Shop.renderComparePage();
}

// 2. Data Loader
export async function loadProductsFromFirebase() {
    try {
        const snap = await productsCollection.get();
        state.allProducts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        console.log("Loaded products:", state.allProducts.length);
    } catch (e) {
        console.error(e);
        showToast("DB Error", true);
    }
}

// 3. Initialization & "Window" assignments
// Since your HTML uses onclick="addToCart()", we must attach these to the window object.
document.addEventListener('DOMContentLoaded', async () => {
    // Make functions available to HTML
    window.showPage = showPage;
    window.addToCart = Shop.addToCart;
    window.removeFromCart = Shop.removeFromCart;
    window.updateQuantity = Shop.updateQuantity;
    window.toggleCompare = Shop.toggleCompare;
    window.showProductDetail = Shop.showProductDetail;
    window.handleLogout = Auth.handleLogout;
    window.editProduct = Admin.editProduct;
    window.deleteProduct = Admin.deleteProduct;
    window.deleteCustomer = Admin.deleteCustomer;
    window.resetAdminForm = Admin.resetAdminForm;
    window.handleReplySubmit = Shop.handleReplySubmit;
    window.clearCompareList = () => { state.compareList = []; Shop.renderComparePage(); };
    const priceSlider = document.getElementById('price-filter');
    if (priceSlider) {
        priceSlider.addEventListener('input', Shop.handlePriceFilter);
    }
    // ... existing window assignments ...
    window.handleAiBuildHelper = AI.handleAiBuildHelper;
    window.handleAiCompare = AI.handleAiCompare;
    window.handleGenerateDescription = AI.handleGenerateDescription;
    
    // Listeners
    document.getElementById('login-form').addEventListener('submit', Auth.handleLogin);
    document.getElementById('register-form').addEventListener('submit', Auth.handleRegister);
    document.getElementById('admin-product-form').addEventListener('submit', Admin.handleProductFormSubmit);
    document.getElementById('checkout-btn').addEventListener('click', Shop.handleCheckout);
    document.getElementById('checkout-form').addEventListener('submit', Shop.handlePlaceOrder);
    
    // Start
    Auth.initAuth();
    await loadProductsFromFirebase();
    Shop.loadHomePage();
    showPage('page-home');
});