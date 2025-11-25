// js/shop.js
import { state } from './state.js';
import { db, productsCollection } from './config.js';
import { formatCurrency, showToast } from './utils.js';
import { showPage, loadProductsFromFirebase } from './main.js';

// === PRODUCT LOGIC ===
export function createProductCard(product) {
    const isComparing = state.compareList.includes(product.id);
    const isOutOfStock = !product.stock || product.stock <= 0;
    
    return `
        <div class="bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col relative">
            ${product.specs ? `
            <button onclick="toggleCompare('${product.id}', event)" class="absolute top-2 right-2 p-1.5 rounded-full z-10 transition-colors ${isComparing ? 'bg-indigo-900/50 text-indigo-500' : 'bg-gray-900/50 text-gray-300'} hover:bg-indigo-600 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </button>` : ''}
            <a href="#" onclick="showProductDetail('${product.id}'); return false;" class="block">
                <img src="${product.image}" class="w-full h-56 object-cover ${isOutOfStock ? 'opacity-50 grayscale' : ''}" onerror="this.src='https://placehold.co/600x600?text=Error'">
            </a>
            <div class="p-4 flex flex-col flex-grow">
                <h3 class="text-lg font-semibold text-white truncate">${product.name}</h3>
                <p class="text-indigo-400 font-medium mt-1 mb-4">${formatCurrency(product.price)}</p>
                <div class="mt-auto">
                    <button onclick="addToCart('${product.id}')" class="w-full py-2 px-4 rounded-lg text-sm font-semibold transition-colors ${isOutOfStock ? 'bg-gray-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}" ${isOutOfStock ? 'disabled' : ''}>
                        ${isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                </div>
            </div>
        </div>
    `;
}

export function showProductDetail(productId) {
    const product = state.allProducts.find(p => p.id === productId);
    if (!product) return;

    document.getElementById('product-image').src = product.image;
    document.getElementById('product-name').textContent = product.name;
    document.getElementById('product-price').textContent = formatCurrency(product.price);
    document.getElementById('product-description').textContent = product.description;
    
    // Stock Level
    const stock = product.stock || 0;
    const stockLabel = document.getElementById('product-stock-level');
    const addBtn = document.getElementById('add-to-cart-btn');
    
    if (stock > 10) { stockLabel.textContent = "In Stock"; stockLabel.className = "text-lg font-medium mb-6 text-green-500"; }
    else if (stock > 0) { stockLabel.textContent = `Only ${stock} left!`; stockLabel.className = "text-lg font-medium mb-6 text-yellow-500"; }
    else { stockLabel.textContent = "Out of Stock"; stockLabel.className = "text-lg font-medium mb-6 text-red-500"; }

    addBtn.disabled = stock <= 0;
    addBtn.textContent = stock <= 0 ? "Out of Stock" : "Add to Cart";
    addBtn.onclick = () => addToCart(product.id, parseInt(document.getElementById('product-quantity-input').value) || 1);

    // Specs
    const specsList = document.getElementById('product-specs-list');
    const specsContainer = document.getElementById('product-specs-container');
    
    if (product.specs) {
        specsContainer.style.display = 'block';
        specsList.innerHTML = Object.entries(product.specs).map(([key, val]) => 
            `<li class="flex justify-between border-b border-gray-700 pb-2 pt-1"><span class="font-medium text-gray-400 capitalize">${key}</span><span class="text-right">${val || 'N/A'}</span></li>`
        ).join('');
        updateCompareButton(productId);
    } else {
        specsContainer.style.display = 'none';
        document.getElementById('add-to-compare-btn').style.display = 'none';
    }

    showPage('page-product');
}

// === CART LOGIC ===
export function addToCart(productId, quantity = 1) {
    const product = state.allProducts.find(p => p.id === productId);
    if (!product || (product.stock || 0) <= 0) return showToast("Out of stock!", true);

    const existing = state.cart.find(item => item.id === productId);
    if (existing) {
        if (existing.quantity + quantity > product.stock) return showToast("Not enough stock.", true);
        existing.quantity += quantity;
    } else {
        if (quantity > product.stock) return showToast("Not enough stock.", true);
        state.cart.push({ ...product, quantity });
    }
    
    showToast(`${product.name} added to cart!`);
    renderCart();
}

export function renderCart() {
    const list = document.getElementById('cart-items-list');
    const countBadge = document.getElementById('cart-count-badge');
    const checkoutBtn = document.getElementById('checkout-btn');
    
    countBadge.textContent = state.cart.reduce((sum, item) => sum + item.quantity, 0);

    if (state.cart.length === 0) {
        list.innerHTML = '<p class="text-gray-400">Cart is empty.</p>';
        document.getElementById('cart-subtotal').textContent = formatCurrency(0);
        document.getElementById('cart-total').textContent = formatCurrency(0);
        checkoutBtn.disabled = true;
        return;
    }

    let subtotal = 0;
    let hasIssue = false;
    
    list.innerHTML = state.cart.map(item => {
        subtotal += item.price * item.quantity;
        const stock = state.allProducts.find(p => p.id === item.id)?.stock || 0;
        if (item.quantity > stock) hasIssue = true;

        return `
            <div class="flex items-start gap-4 p-4 border-b border-gray-700">
                <img src="${item.image}" class="w-24 h-24 object-cover rounded-lg">
                <div class="flex-1">
                    <h3 class="text-white font-semibold">${item.name}</h3>
                    <p class="text-gray-400 text-sm">${formatCurrency(item.price)}</p>
                    <div class="flex items-center border border-gray-700 rounded-lg w-fit mt-2">
                        <button onclick="updateQuantity('cart-qty-${item.id}', -1)" class="px-3 py-1 text-gray-300">-</button>
                        <input disabled value="${item.quantity}" class="w-12 text-center bg-gray-800 border-x border-gray-700 py-1">
                        <button onclick="updateQuantity('cart-qty-${item.id}', 1)" class="px-3 py-1 text-gray-300">+</button>
                    </div>
                    ${item.quantity > stock ? `<p class="text-red-500 text-xs mt-1">Only ${stock} left!</p>` : ''}
                </div>
                <div>
                    <p class="text-white font-semibold">${formatCurrency(item.price * item.quantity)}</p>
                    <button onclick="removeFromCart('${item.id}')" class="text-red-500 text-sm mt-2">Remove</button>
                </div>
            </div>`;
    }).join('');

    document.getElementById('cart-subtotal').textContent = formatCurrency(subtotal);
    document.getElementById('cart-total').textContent = formatCurrency(subtotal);
    checkoutBtn.disabled = hasIssue;
}

export function updateQuantity(inputId, change) {
    const id = inputId.split('cart-qty-')[1];
    const item = state.cart.find(i => i.id === id);
    if (item) {
        item.quantity = Math.max(1, item.quantity + change);
        renderCart();
    } else if (inputId === 'product-quantity-input') {
        const input = document.getElementById(inputId);
        input.value = Math.max(1, parseInt(input.value) + change);
    }
}

export function removeFromCart(id) {
    state.cart = state.cart.filter(i => i.id !== id);
    renderCart();
}

export async function handleCheckout() {
    const btn = document.getElementById('checkout-btn');
    btn.disabled = true; btn.textContent = "Processing...";
    
    try {
        await db.runTransaction(async (t) => {
            const updates = [];
            for (const item of state.cart) {
                const ref = productsCollection.doc(item.id);
                const doc = await t.get(ref);
                const stock = doc.data().stock || 0;
                if (stock < item.quantity) throw new Error(`${item.name} is out of stock.`);
                updates.push({ ref, newStock: stock - item.quantity });
            }
            updates.forEach(u => t.update(u.ref, { stock: u.newStock }));
        });
        
        showToast("Order placed!");
        state.cart = [];
        await loadProductsFromFirebase(); // Reload data
        renderCart();
        showPage('page-home');
    } catch (e) {
        showToast(e.message, true);
        await loadProductsFromFirebase();
        renderCart();
    }
    btn.disabled = false; btn.textContent = "Proceed to Checkout";
}

// === COMPARE LOGIC ===
export function toggleCompare(productId, event) {
    if (event) { event.stopPropagation(); event.preventDefault(); }
    const idx = state.compareList.indexOf(productId);
    
    if (idx > -1) {
        state.compareList.splice(idx, 1);
        showToast("Removed from comparison");
    } else {
        if (state.compareList.length >= 4) return showToast("Max 4 items");
        state.compareList.push(productId);
        showToast("Added to comparison");
    }
    
    document.getElementById('compare-count-badge').textContent = state.compareList.length;
    if (state.currentPage === 'page-compare') renderComparePage();
    // Re-render current view to update button states
    if (state.currentPage === 'page-home') loadHomePage(); 
    if (state.currentPage === 'page-product') updateCompareButton(productId);
}

export function updateCompareButton(productId) {
    const btn = document.getElementById('add-to-compare-btn');
    if (state.compareList.includes(productId)) {
        btn.textContent = 'Remove from Compare';
        btn.classList.add('bg-red-600'); btn.classList.remove('bg-gray-700');
        btn.onclick = () => toggleCompare(productId);
    } else {
        btn.innerHTML = 'Add to Compare';
        btn.classList.add('bg-gray-700'); btn.classList.remove('bg-red-600');
        btn.onclick = () => toggleCompare(productId);
    }
}

export function renderComparePage() {
    const container = document.getElementById('compare-container');
    const benchmarkSection = document.getElementById('compare-ai-benchmark');

    if (state.compareList.length === 0) {
        container.innerHTML = '<p class="text-gray-400">Your comparison list is empty.</p>';
        benchmarkSection.style.display = 'none';
        return;
    }
    
    const products = state.compareList.map(id => state.allProducts.find(p => p.id === id));
    
    // 1. Calculate Total Scores
    // We map over products to calculate their "Power Score" (Sum of levels)
    const productScores = products.map(p => {
        const l = p.specLevels || { cpu: 1, gpu: 1, ram: 1, storage: 1 };
        return (l.cpu || 1) + (l.gpu || 1) + (l.ram || 1) + (l.storage || 1);
    });

    // Find the index of the winner (highest score)
    const maxScore = Math.max(...productScores);
    const winnerIndex = productScores.indexOf(maxScore);

    // 2. Build Table Header
    let html = '<table class="min-w-full divide-y divide-gray-700 rounded-lg overflow-hidden">';
    html += '<thead class="bg-gray-800"><tr><th class="px-6 py-4 text-left text-gray-400 w-1/5">Feature</th>';
    
    products.forEach((p, index) => {
        const isWinner = productScores[index] === maxScore;
        const borderClass = isWinner ? 'border-2 border-green-500' : 'border border-transparent';
        const badge = isWinner ? '<span class="bg-green-600 text-white text-xs px-2 py-1 rounded ml-2">WINNER</span>' : '';
        
        html += `
            <th class="px-6 py-4 text-left text-white relative">
                <div class="${borderClass} rounded-lg p-2">
                    <img src="${p.image}" class="w-full h-32 object-cover rounded mb-2">
                    <div class="flex items-center justify-between">
                        <span>${p.name}</span>
                        ${badge}
                    </div>
                    <div class="text-indigo-400 text-sm mt-1 font-mono">Score: ${productScores[index]}</div>
                </div>
            </th>`;
    });
    html += '</tr></thead>';

    // 3. Build Specs Rows
    const rows = [
        { label: 'Price', key: 'price', isCurrency: true },
        { label: 'CPU', key: 'cpu', useLevel: true },
        { label: 'GPU', key: 'gpu', useLevel: true },
        { label: 'RAM', key: 'ram', useLevel: true },
        { label: 'Storage', key: 'storage', useLevel: true },
        { label: 'Mainboard', key: 'mainboard' },
        { label: 'PSU', key: 'psu' },
        { label: 'Case', key: 'case' },
    ];

    html += '<tbody class="bg-gray-800 divide-y divide-gray-700">';
    
    rows.forEach(row => {
        html += `<tr><td class="px-6 py-4 font-medium text-gray-400">${row.label}</td>`;
        
        // Find max level for this specific row (to highlight the best component)
        let maxRowLevel = 0;
        if (row.useLevel) {
            maxRowLevel = Math.max(...products.map(p => (p.specLevels?.[row.key] || 1)));
        }

        products.forEach(p => {
            let val = 'N/A';
            let colorClass = 'text-gray-300'; // Default color
            
            // Handle Value Display
            if (row.key === 'price') {
                val = formatCurrency(p.price);
            } else {
                val = p.specs?.[row.key] || 'N/A';
            }

            // Handle Highlighting Logic
            if (row.useLevel) {
                const myLevel = p.specLevels?.[row.key] || 1;
                // Show level dots (e.g., "●●●○○")
                const dots = '●'.repeat(myLevel) + '○'.repeat(5 - myLevel);
                val += `<div class="text-xs mt-1 text-gray-500 tracking-widest">${dots}</div>`;
                
                if (myLevel === maxRowLevel && maxRowLevel > 0) {
                    colorClass = 'text-green-400 font-bold'; // Highlight best component
                }
            }

            html += `<td class="px-6 py-4 ${colorClass}">${val}</td>`;
        });
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    
    container.innerHTML = html;
    benchmarkSection.style.display = 'block';
}

// Export helper to load home/category
export function loadHomePage() {
    document.getElementById('home-featured-cases').innerHTML = state.allProducts.filter(p => p.category === 'PC Case').slice(0,3).map(createProductCard).join('');
    document.getElementById('home-featured-keyboards').innerHTML = state.allProducts.filter(p => p.category === 'Keyboard').slice(0,3).map(createProductCard).join('');
    document.getElementById('home-featured-mice').innerHTML = state.allProducts.filter(p => p.category === 'Mice').slice(0,3).map(createProductCard).join('');
}
// js/shop.js

// ... imports ...

// 1. Update loadCategoryPage to save the category to state
export function loadCategoryPage(category) {
    state.currentCategory = category; // Save state
    
    // Reset price slider to max when switching categories
    const slider = document.getElementById('price-filter');
    if (slider) {
        slider.value = 70000000;
        document.getElementById('price-value').textContent = formatCurrency(70000000);
    }

    filterAndRender(); // Use a shared helper function
}

// 2. New Helper: Filter by BOTH Category and Price
function filterAndRender() {
    const maxPrice = parseInt(document.getElementById('price-filter').value) || 70000000;
    const category = state.currentCategory;
    const title = document.getElementById('category-title');
    const grid = document.getElementById('category-product-grid');

    // Filter Logic
    let filtered = state.allProducts.filter(p => p.price <= maxPrice);
    
    if (category !== 'All') {
        filtered = filtered.filter(p => p.category === category);
        title.textContent = `${category}s (Under ${formatCurrency(maxPrice)})`;
    } else {
        title.textContent = `All Products (Under ${formatCurrency(maxPrice)})`;
    }

    // Render
    if (filtered.length === 0) {
        grid.innerHTML = '<p class="text-gray-400 col-span-3">No products found in this price range.</p>';
    } else {
        grid.innerHTML = filtered.map(createProductCard).join('');
    }
}

// 3. The Listener Function for the Slider
export function handlePriceFilter(event) {
    const value = event.target.value;
    document.getElementById('price-value').textContent = formatCurrency(value);
    filterAndRender();
}