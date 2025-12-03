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

// ---------------------------------------------------------
// NEW FEATURE: Upcoming Games Feed (RAWG API)
// ---------------------------------------------------------
async function loadUpcomingGames() {
    const container = document.getElementById('games-feed-container');
    if (!container) return;

    // --- CONFIGURATION ---
    // 1. Go to https://rawg.io/apidocs to get a FREE API Key.
    // 2. Replace the string below with your key.
    const apiKey = 'YOUR_RAWG_API_KEY_HERE'; 
    // ---------------------

    const today = new Date().toISOString().split('T')[0];
    const nextYear = new Date();
    nextYear.setMonth(nextYear.getMonth() + 6);
    const futureDate = nextYear.toISOString().split('T')[0];

    // If no key is provided (or it's the placeholder), we can use Mock Data for demonstration.
    const useMockData = apiKey === 'YOUR_RAWG_API_KEY_HERE';

    const url = `https://api.rawg.io/api/games?key=${apiKey}&dates=${today},${futureDate}&ordering=-added&page_size=10`;

    try {
        let games = [];

        if (useMockData) {
            console.warn("Using MOCK DATA for Release Calendar. Please update 'apiKey' in js/main.js with a real key from rawg.io.");
            // Mock data to show the UI works even without a key
            games = [
                { name: "GTA VI (Mock)", released: "2025-12-01", background_image: "https://placehold.co/300x400/3b0764/ffffff?text=GTA+VI" },
                { name: "Hollow Knight: Silksong", released: "2025-06-15", background_image: "https://placehold.co/300x400/1e293b/ffffff?text=Silksong" },
                { name: "Monster Hunter Wilds", released: "2025-02-28", background_image: "https://placehold.co/300x400/7f1d1d/ffffff?text=MH+Wilds" },
                { name: "Doom: The Dark Ages", released: "2025-05-10", background_image: "https://placehold.co/300x400/991b1b/ffffff?text=Doom" },
                { name: "Fable", released: "2025-11-20", background_image: "https://placehold.co/300x400/166534/ffffff?text=Fable" },
                { name: "Borderlands 4", released: "2025-08-05", background_image: "https://placehold.co/300x400/d97706/ffffff?text=Borderlands+4" },
                { name: "Metroid Prime 4", released: "2025-09-15", background_image: "https://placehold.co/300x400/0f172a/ffffff?text=Metroid+4" },
                { name: "Death Stranding 2", released: "2025-10-31", background_image: "https://placehold.co/300x400/4b5563/ffffff?text=DS2" },
                { name: "The Witcher 4", released: "2026-01-15", background_image: "https://placehold.co/300x400/b91c1c/ffffff?text=Witcher+4" },
                { name: "Star Wars Outlaws", released: "2024-12-25", background_image: "https://placehold.co/300x400/eab308/ffffff?text=Star+Wars" },
                { name: "Hades II", released: "2024-11-01", background_image: "https://placehold.co/300x400/10b981/ffffff?text=Hades+II" },
                { name: "Persona 6", released: "2025-07-07", background_image: "https://placehold.co/300x400/3b82f6/ffffff?text=Persona+6" },
            ];
            // Simulate network delay
            await new Promise(r => setTimeout(r, 800));
        } else {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
            const data = await response.json();
            games = data.results;
        }
        
        // Clear "Loading..." text
        container.innerHTML = '';

        // Enable horizontal scrolling via mouse wheel
        container.addEventListener('wheel', (evt) => {
            evt.preventDefault();
            container.scrollLeft += evt.deltaY;
        });

        games.forEach(game => {
            // Format date (e.g., "2024-11-15" -> "15 NOV")
            const dateObj = new Date(game.released);
            const day = dateObj.getDate() || '--';
            const month = dateObj.toLocaleString('default', { month: 'short' }).toUpperCase() || 'TBA';
            
            // Handle missing images
            const image = game.background_image || 'https://placehold.co/300x400?text=No+Image';

            // Link to game details (RAWG page or search)
            const gameLink = `https://rawg.io/games/${game.slug || ''}`;

            // Create HTML Card
            const card = `
                <a href="${gameLink}" target="_blank" class="flex-shrink-0 min-w-[160px] w-[160px] bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:scale-105 transition-transform duration-300 relative group snap-start cursor-pointer block">
                    <div class="h-48 overflow-hidden">
                        <img src="${image}" alt="${game.name}" class="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity">
                    </div>
                    
                    <div class="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm p-2 flex justify-center items-baseline gap-1 border-t border-gray-700">
                        <span class="text-xl font-bold text-white">${day}</span>
                        <span class="text-xs font-medium text-gray-400">${month}</span>
                    </div>

                    <div class="absolute inset-0 bg-black/60 flex items-center justify-center p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p class="text-center text-sm font-bold text-white">${game.name}</p>
                    </div>
                </a>
            `;
            container.innerHTML += card;
        });

    } catch (error) {
        console.error("Error fetching games:", error);
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center w-full p-4 text-gray-500">
                <p>Could not load game feed.</p>
                <p class="text-xs mt-1">Check console for details (API Key needed?).</p>
            </div>`;
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

    // NEW: Load the game feed
    loadUpcomingGames(); 
});