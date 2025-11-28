// js/main.js
import { db, productsCollection, componentsCollection, outletProductsCollection } from './config.js';
import { state } from './state.js';
import { showToast } from './utils.js';
import { loadProductsFromFirebase, loadOutletProductsFromFirebase, loadComponentsFromFirebase } from './loader.js';
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
        Shop.loadCategoryPage(context);
    }
    if (pageId === 'page-outlet') {
        Shop.loadOutletPage(context);
    }
    if (pageId === 'page-cart') Shop.renderCart();
    if (pageId === 'page-admin') Admin.renderAdminPage();
    if (pageId === 'page-compare') Shop.renderComparePage();
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
    window.clearCompareList = () => {
        state.compareList = [];
        document.getElementById('compare-count-badge').textContent = '0';
        Shop.renderComparePage();
        Shop.loadHomePage(); // Always re-render home page featured items
        if (state.currentCategory) {
            Shop.filterAndRender(); // Re-render category if one was active
        }
    };
    // ... existing window assignments ...
    window.handleAiBuildHelper = AI.handleAiBuildHelper;
    window.handleAiCompare = AI.handleAiCompare;
    window.handleGenerateDescription = AI.handleGenerateDescription;
    window.changeLanguage = (lang) => {
        const d = new Date();
        d.setTime(d.getTime() + (24*60*60*1000));
        let expires = "expires="+d.toUTCString();
        document.cookie = `googtrans=/en/${lang}; ${expires}; path=/`;
        window.location.reload();
    };
    
    // Listeners
    document.getElementById('login-form').addEventListener('submit', Auth.handleLogin);
    document.getElementById('register-form').addEventListener('submit', Auth.handleRegister);
    document.getElementById('admin-product-form').addEventListener('submit', Admin.handleProductFormSubmit);
    document.getElementById('checkout-btn').addEventListener('click', Shop.handleCheckout);
    document.getElementById('checkout-form').addEventListener('submit', Shop.handlePlaceOrder);
    
    // Payment method listeners
    const paymentUpfront = document.getElementById('payment-upfront');
    const paymentInstallments = document.getElementById('payment-installments');
    const paymentCash = document.getElementById('payment-cash');
    const paymentCard = document.getElementById('payment-card');
    const cardDetailsForm = document.getElementById('card-details-form');

    if (paymentUpfront && paymentInstallments) {
        paymentUpfront.addEventListener('change', Shop.updateSummaryView);
        paymentInstallments.addEventListener('change', Shop.updateSummaryView);
    }

    if (paymentCash && paymentCard && cardDetailsForm) {
        paymentCash.addEventListener('change', () => {
            cardDetailsForm.style.display = 'none';
        });

        paymentCard.addEventListener('change', () => {
            cardDetailsForm.style.display = 'block';
        });
    }

    const deliveryShip = document.getElementById('delivery-ship');
    const deliveryPickup = document.getElementById('delivery-pickup');

    if (deliveryShip && deliveryPickup) {
        deliveryShip.addEventListener('change', Shop.updateCheckoutSummary);
        deliveryPickup.addEventListener('change', Shop.updateCheckoutSummary);
    }

    const sortBy = document.getElementById('sort-by');
    if (sortBy) {
        sortBy.addEventListener('change', Shop.filterAndRender);
    }

    const outletSortBy = document.getElementById('outlet-sort-by');
    if (outletSortBy) {
        outletSortBy.addEventListener('change', Shop.filterAndRenderOutlet);
    }

    document.getElementById('outlet-min-price').addEventListener('input', Shop.filterAndRenderOutlet);
    document.getElementById('outlet-max-price').addEventListener('input', Shop.filterAndRenderOutlet);
    
    // Search Bar Listeners
    const shopSearch = document.getElementById('shop-search-bar');
    if (shopSearch) {
        shopSearch.addEventListener('input', () => {
            state.currentCategory = 'All'; // Reset category context or keep it? Let's keep current context but allowing search usually implies filtering current view.
            // Actually, filterAndRender respects state.currentCategory.
            Shop.filterAndRender();
        });
    }

    const outletSearch = document.getElementById('outlet-search-bar');
    if (outletSearch) {
        outletSearch.addEventListener('input', Shop.filterAndRenderOutlet);
    }

    const adminSearch = document.getElementById('admin-search-bar');
    if (adminSearch) {
        adminSearch.addEventListener('input', Admin.renderAdminPage);
    }

    const outletToggle = document.getElementById('outlet-toggle');
    if(outletToggle) {
        outletToggle.addEventListener('change', Admin.renderAdminPage);
    }

    const checkoutAddress = document.getElementById('checkout-address');
    const etaDisplay = document.getElementById('eta-display');

    function debounce(func, delay) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), delay);
        };
    }

    if (checkoutAddress && etaDisplay) {
        const updateEta = debounce(() => {
            const address = checkoutAddress.value;
            if (address.length > 0) {
                const days = Math.max(1, Math.ceil(address.length / 5));
                etaDisplay.textContent = `Estimated delivery in ${days} - ${days + 2} days.`;
            } else {
                etaDisplay.textContent = '';
            }
        }, 1000);

        checkoutAddress.addEventListener('input', updateEta);
    }

    // AI Listeners
    const aiHelperBtn = document.getElementById('ai-helper-btn');
    if (aiHelperBtn) aiHelperBtn.addEventListener('click', AI.handleAiBuildHelper);

    const aiCompareBtn = document.getElementById('ai-compare-btn');
    if (aiCompareBtn) aiCompareBtn.addEventListener('click', AI.handleAiCompare);

    const generateDescBtn = document.getElementById('generate-desc-btn');
    if (generateDescBtn) generateDescBtn.addEventListener('click', AI.handleGenerateDescription);

    // Start
    Auth.initAuth();
    await loadProductsFromFirebase();
    await loadComponentsFromFirebase();
    await loadOutletProductsFromFirebase();
    Shop.loadHomePage();
    showPage('page-home');
});