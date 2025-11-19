import { getNavbarHTML } from './components/navbar.js';
import { getHomeHTML, initHomeLogic } from './pages/home.js';
import { getAdminHTML, initAdminLogic } from './pages/admin.js';
import { loadProducts } from './products.js';
import { addToCart, toggleCompare } from './shop.js';
import { handleLogin } from './auth.js';

// 1. Expose functions to global window scope
window.triggerAddToCart = addToCart;
window.triggerCompare = toggleCompare;
window.resetAdminForm = () => {
    const form = document.getElementById('admin-product-form');
    if(form) form.reset();
};

// 2. The Routing Function
function navigateTo(pageName, context = null) {
    console.log("Navigating to:", pageName);
    const mainContainer = document.getElementById('app-main');
    
    if (!mainContainer) {
        console.error("CRITICAL ERROR: 'app-main' container not found!");
        return;
    }

    // Clear current content
    mainContainer.innerHTML = '';
    
    try {
        if (pageName === 'home') {
            mainContainer.innerHTML = getHomeHTML();
            initHomeLogic(); 
        } 
        else if (pageName === 'admin') {
            mainContainer.innerHTML = getAdminHTML();
            initAdminLogic();
        }
        // Add placeholders for other pages to prevent errors
        else if (pageName === 'category') {
            mainContainer.innerHTML = `<h1 class="text-3xl text-white">Category: ${context}</h1><p class="text-gray-400">Category page coming soon...</p>`;
        }
        else if (pageName === 'cart') {
            mainContainer.innerHTML = `<h1 class="text-3xl text-white">Your Cart</h1><p class="text-gray-400">Cart page coming soon...</p>`;
        }
    } catch (err) {
        console.error("Error rendering page:", err);
        mainContainer.innerHTML = `<p class="text-red-500">Error loading page: ${err.message}</p>`;
    }
    
    window.scrollTo(0, 0);
}

// 3. Global Event Listener for Links
document.addEventListener('click', (e) => {
    const link = e.target.closest('.nav-link');
    if (link) {
        e.preventDefault();
        const page = link.dataset.page; 
        const ctx = link.dataset.ctx;   
        navigateTo(page, ctx);
    }
});

// 4. MAIN INITIALIZATION FUNCTION
async function initApp() {
    console.log("App Initializing...");

    // Render Header immediately
    const headerEl = document.getElementById('app-header');
    if (headerEl) {
        headerEl.innerHTML = getNavbarHTML();
    } else {
        console.error("Header container not found!");
    }
    
    try {
        console.log("Loading products...");
        await loadProducts(); 
        console.log("Products loaded, showing home...");
        navigateTo('home'); 
    } catch (error) {
        console.error("Critical Init Error:", error);
        const main = document.getElementById('app-main');
        if (main) {
            main.innerHTML = `
                <div class="text-center text-red-500 mt-10">
                    <h2 class="text-2xl font-bold">Failed to load</h2>
                    <p>${error.message}</p>
                    <p class="text-sm mt-4">Check the console (F12) for details.</p>
                </div>
            `;
        }
    }
}

// 5. Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}