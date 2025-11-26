// js/shop.js
import { state } from './state.js';
import { db, productsCollection, outletProductsCollection, ordersCollection } from './config.js';
import { formatCurrency, showToast } from './utils.js';
import { showPage, loadProductsFromFirebase, loadOutletProductsFromFirebase } from './main.js';

// === PRODUCT LOGIC ===
export function createProductCard(product, source = 'main') {
    const isComparing = state.compareList.includes(product.id);
    const isOutOfStock = !product.stock || product.stock <= 0;
    
    // Only show compare button for PC Cases
    const compareButtonHtml = product.category === 'PC Case' ? `
        <button onclick="toggleCompare('${product.id}', event)" class="absolute top-2 right-2 p-1.5 rounded-full z-10 transition-colors ${isComparing ? 'bg-indigo-900/50 text-indigo-500' : 'bg-gray-900/50 text-gray-300'} hover:bg-indigo-600 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
        </button>` : '';

    return `
        <div class="bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col relative">
            ${compareButtonHtml}
            <a href="#" onclick="showProductDetail('${product.id}', '${source}'); return false;" class="block">
                <img src="${product.image}" class="w-full h-56 object-cover ${isOutOfStock ? 'opacity-50 grayscale' : ''}" onerror="this.src='https://placehold.co/600x600?text=Error'">
            </a>
            <div class="p-4 flex flex-col flex-grow">
                <h3 class="text-lg font-semibold text-white truncate">${product.name}</h3>
                <p class="text-indigo-400 font-medium mt-1 mb-4">${formatCurrency(product.price)}</p>
                <div class="mt-auto">
                    <button onclick="addToCart('${product.id}', 1, '${source}')" class="w-full py-2 px-4 rounded-lg text-sm font-semibold transition-colors ${isOutOfStock ? 'bg-gray-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}" ${isOutOfStock ? 'disabled' : ''}>
                        ${isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                </div>
            </div>
        </div>
    `;
}

export async function showProductDetail(productId, source = 'main') {
    const products = source === 'outlet' ? state.outletProducts : state.allProducts;
    const product = products.find(p => p.id === productId);
    if (!product) return;

    state.currentProductId = productId;

    document.getElementById('product-image').src = product.image;
    document.getElementById('product-name').textContent = product.name;
    document.getElementById('product-price').textContent = formatCurrency(product.price);
    document.getElementById('product-description').textContent = product.description;
    
    // Display Manufacturer if exists
    let manufacturerHtml = '';
    if (product.manufacturer) {
        manufacturerHtml = `<p class="text-gray-300 mb-4"><strong>Manufacturer:</strong> ${product.manufacturer}</p>`;
    }
    document.getElementById('product-description').insertAdjacentHTML('afterend', manufacturerHtml); // Insert after description

    // Stock Level
    const stock = product.stock || 0;
    const stockLabel = document.getElementById('product-stock-level');
    const addBtn = document.getElementById('add-to-cart-btn');
    
    if (stock > 10) { stockLabel.textContent = "In Stock"; stockLabel.className = "text-lg font-medium mb-6 text-green-500"; }
    else if (stock > 0) { stockLabel.textContent = `Only ${stock} left!`; stockLabel.className = "text-lg font-medium mb-6 text-yellow-500"; }
    else { stockLabel.textContent = "Out of Stock"; stockLabel.className = "text-lg font-medium mb-6 text-red-500"; }

    addBtn.disabled = stock <= 0;
    addBtn.textContent = stock <= 0 ? "Out of Stock" : "Add to Cart";
    addBtn.onclick = () => addToCart(product.id, parseInt(document.getElementById('product-quantity-input').value) || 1, source);

    // Specs
    const specsList = document.getElementById('product-specs-list');
    const specsContainer = document.getElementById('product-specs-container');
    specsList.innerHTML = ''; // Clear previous specs
    
    if (product.specs) {
        specsContainer.style.display = 'block';
        let specsHtml = '';

        switch (product.category) {
            case 'PC Case':
                specsHtml += `
                    <li class="flex justify-between border-b border-gray-700 pb-2 pt-1"><span class="font-medium text-gray-400">CPU:</span><span class="text-right">${product.specs.cpu || 'N/A'}</span></li>
                    <li class="flex justify-between border-b border-gray-700 pb-2 pt-1"><span class="font-medium text-gray-400">GPU:</span><span class="text-right">${product.specs.gpu || 'N/A'}</span></li>
                    <li class="flex justify-between border-b border-gray-700 pb-2 pt-1"><span class="font-medium text-gray-400">RAM:</span><span class="text-right">${product.specs.ram || 'N/A'}</span></li>
                    <li class="flex justify-between border-b border-gray-700 pb-2 pt-1"><span class="font-medium text-gray-400">Storage:</span><span class="text-right">${product.specs.storage || 'N/A'}</span></li>
                    <li class="flex justify-between border-b border-gray-700 pb-2 pt-1"><span class="font-medium text-gray-400">Mainboard:</span><span class="text-right">${product.specs.mainboard || 'N/A'}</span></li>
                    <li class="flex justify-between border-b border-gray-700 pb-2 pt-1"><span class="font-medium text-gray-400">PSU:</span><span class="text-right">${product.specs.psu || 'N/A'}</span></li>
                    <li class="flex justify-between border-b border-gray-700 pb-2 pt-1"><span class="font-medium text-gray-400">Cooler:</span><span class="text-right">${product.specs.cooler || 'N/A'}</span></li>
                    <li class="flex justify-between border-b border-gray-700 pb-2 pt-1"><span class="font-medium text-gray-400">Case:</span><span class="text-right">${product.specs.case || 'N/A'}</span></li>
                `;
                break;
            case 'Mice':
                specsHtml += `
                    <li class="flex justify-between border-b border-gray-700 pb-2 pt-1"><span class="font-medium text-gray-400">DPI:</span><span class="text-right">${product.specs.dpi || 'N/A'}</span></li>
                    <li class="flex justify-between border-b border-gray-700 pb-2 pt-1"><span class="font-medium text-gray-400">Lights:</span><span class="text-right">${product.specs.lights || 'N/A'}</span></li>
                    <li class="flex justify-between border-b border-gray-700 pb-2 pt-1"><span class="font-medium text-gray-400">Bluetooth:</span><span class="text-right">${product.specs.bluetooth ? 'Yes' : 'No'}</span></li>
                `;
                break;
            case 'Keyboard':
                specsHtml += `
                    <li class="flex justify-between border-b border-gray-700 pb-2 pt-1"><span class="font-medium text-gray-400">Switch Type:</span><span class="text-right">${product.specs.switch || 'N/A'}</span></li>
                    <li class="flex justify-between border-b border-gray-700 pb-2 pt-1"><span class="font-medium text-gray-400">Backlight:</span><span class="text-right">${product.specs.backlight ? 'Yes' : 'No'}</span></li>
                `;
                break;
            case 'Storage':
                specsHtml += `
                    <li class="flex justify-between border-b border-gray-700 pb-2 pt-1"><span class="font-medium text-gray-400">Storage Space:</span><span class="text-right">${product.specs.storagespace || 'N/A'}</span></li>
                `;
                break;
            case 'RAM':
                specsHtml += `
                    <li class="flex justify-between border-b border-gray-700 pb-2 pt-1"><span class="font-medium text-gray-400">RAM Size:</span><span class="text-right">${product.specs.ramsize || 'N/A'}</span></li>
                    <li class="flex justify-between border-b border-gray-700 pb-2 pt-1"><span class="font-medium text-gray-400">Technology:</span><span class="text-right">${product.specs.ramtech || 'N/A'}</span></li>
                `;
                break;
            case 'Graphics Card':
                specsHtml += `
                    <li class="flex justify-between border-b border-gray-700 pb-2 pt-1"><span class="font-medium text-gray-400">VRAM:</span><span class="text-right">${product.specs.vram || 'N/A'}</span></li>
                    <li class="flex justify-between border-b border-gray-700 pb-2 pt-1"><span class="font-medium text-gray-400">Interface:</span><span class="text-right">${product.specs.interface || 'N/A'}</span></li>
                    <li class="flex justify-between border-b border-gray-700 pb-2 pt-1"><span class="font-medium text-gray-400">Clock Speed:</span><span class="text-right">${product.specs.clockspeed || 'N/A'}</span></li>
                `;
                break;
            default:
                // Fallback for 'Other' or if specs object has unexpected keys
                specsHtml = Object.entries(product.specs).map(([key, val]) => 
                    `<li class="flex justify-between border-b border-gray-700 pb-2 pt-1"><span class="font-medium text-gray-400 capitalize">${key}:</span><span class="text-right">${val || 'N/A'}</span></li>`
                ).join('');
                break;
        }
        specsList.innerHTML = specsHtml;
    } else {
        specsContainer.style.display = 'none';
    }
    updateCompareButton(productId);
    document.getElementById('add-to-compare-btn').style.display = 'block';

    // Comments and Ratings
    renderComments(productId);
    renderRating(productId);

    if (state.currentUser) {
        document.getElementById('comment-form-container').style.display = 'block';
        document.getElementById('submit-comment-btn').onclick = () => handleCommentSubmit(productId);

        checkIfUserPurchased(productId).then(hasPurchased => {
            if (hasPurchased) {
                document.getElementById('rating-form-container').style.display = 'block';
                document.getElementById('submit-rating-btn').onclick = () => handleRatingSubmit(productId);
            } else {
                document.getElementById('rating-form-container').style.display = 'none';
            }
        });
    } else {
        document.getElementById('comment-form-container').style.display = 'none';
        document.getElementById('rating-form-container').style.display = 'none';
    }

    showPage('page-product');
}

// === CART LOGIC ===
export function addToCart(productId, quantity = 1, source = 'main') {
    const products = source === 'outlet' ? state.outletProducts : state.allProducts;
    const product = products.find(p => p.id === productId);
    if (!product || (product.stock || 0) <= 0) return showToast("Out of stock!", true);

    const existing = state.cart.find(item => item.id === productId && item.source === source);
    if (existing) {
        if (existing.quantity + quantity > product.stock) return showToast("Not enough stock.", true);
        existing.quantity += quantity;
    } else {
        if (quantity > product.stock) return showToast("Not enough stock.", true);
        state.cart.push({ ...product, quantity, source });
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
        const products = item.source === 'outlet' ? state.outletProducts : state.allProducts;
        const stock = products.find(p => p.id === item.id)?.stock || 0;
        if (item.quantity > stock) hasIssue = true;

        return `
            <div class="flex items-start gap-4 p-4 border-b border-gray-700">
                <img src="${item.image}" class="w-24 h-24 object-cover rounded-lg">
                <div class="flex-1">
                    <h3 class="text-white font-semibold">${item.name}</h3>
                    <p class="text-gray-400 text-sm">${formatCurrency(item.price)}</p>
                    <div class="flex items-center border border-gray-700 rounded-lg w-fit mt-2">
                        <button onclick="updateQuantity('cart-qty-${item.id}', -1, '${item.source}')" class="px-3 py-1 text-gray-300">-</button>
                        <input disabled value="${item.quantity}" class="w-12 text-center bg-gray-800 border-x border-gray-700 py-1">
                        <button onclick="updateQuantity('cart-qty-${item.id}', 1, '${item.source}')" class="px-3 py-1 text-gray-300">+</button>
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

export function updateQuantity(inputId, change, source) {
    const id = inputId.split('cart-qty-')[1];
    const item = state.cart.find(i => i.id === id && i.source === source);
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

export function updateCheckoutSummary() {
    const subtotal = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const isPickup = document.getElementById('delivery-pickup').checked;
    const deliveryFee = isPickup ? 0 : 50000;
    const vat = subtotal * 0.10;
    const total = subtotal + deliveryFee + vat;
    const totalWithInterest = (subtotal + vat) * 1.12; // Interest on subtotal + VAT
    const monthlyPayment = totalWithInterest / 12;

    // Populate upfront summary
    document.getElementById('checkout-subtotal').textContent = formatCurrency(subtotal);
    document.getElementById('checkout-delivery-fee').textContent = formatCurrency(deliveryFee);
    document.getElementById('checkout-vat').textContent = formatCurrency(vat);
    document.getElementById('checkout-total').textContent = formatCurrency(total);

    // Populate installments summary
    document.getElementById('checkout-monthly-payment').textContent = formatCurrency(monthlyPayment);
    document.getElementById('checkout-onetime-shipping').textContent = formatCurrency(deliveryFee);

    updateSummaryView();
}

export function handleCheckout() {
    if (!state.currentUser) {
        showToast("Please log in to proceed to checkout.", true);
        showPage('page-login');
        return;
    }
    updateCheckoutSummary();
    showPage('page-checkout');
}

export async function handlePlaceOrder(event) {
    event.preventDefault();
    const btn = event.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = "Placing Order...";

    try {
        const subtotal = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const isPickup = document.getElementById('delivery-pickup').checked;
        const deliveryFee = isPickup ? 0 : 50000;
        const vat = subtotal * 0.10;
        const total = subtotal + deliveryFee + vat;
        const paymentMethod = document.querySelector('input[name="payment-method"]:checked').value;
        
        const order = {
            customer: {
                uid: state.currentUser.uid,
                email: state.currentUser.email,
                name: document.getElementById('checkout-name').value,
                phone: document.getElementById('checkout-phone').value,
                address: document.getElementById('checkout-address').value,
            },
            payment: {
                method: paymentMethod,
                type: document.querySelector('input[name="upfront-type"]:checked')?.value || null,
            },
            delivery: document.querySelector('input[name="delivery-method"]:checked').value,
            items: state.cart,
            total: total,
            createdAt: new Date(),
            status: 'new',
        };

        if (paymentMethod === 'installments') {
            const totalWithInterest = (subtotal + vat) * 1.12;
            const monthlyPayment = totalWithInterest / 12;
            order.payment.monthlyPayment = monthlyPayment;
            order.payment.totalWithInterest = totalWithInterest;
        }

        await ordersCollection.add(order);

        await db.runTransaction(async (t) => {
            const updates = [];
            for (const item of state.cart) {
                const collection = item.source === 'outlet' ? outletProductsCollection : productsCollection;
                const ref = collection.doc(item.id);
                const doc = await t.get(ref);
                const stock = doc.data().stock || 0;
                if (stock < item.quantity) throw new Error(`${item.name} is out of stock.`);
                updates.push({ ref, newStock: stock - item.quantity });
            }
            updates.forEach(u => t.update(u.ref, { stock: u.newStock }));
        });

        showToast("Order placed successfully!");
        state.cart = [];
        await loadProductsFromFirebase();
        await loadOutletProductsFromFirebase(); // Reload outlet products as well
        renderCart();
        showPage('page-home');

    } catch (e) {
        showToast(`Error: ${e.message}`, true);
        console.error("Order placement failed:", e);
    } finally {
        btn.disabled = false;
        btn.textContent = "Place Order";
    }
}

export function updateSummaryView() {
    const isInstallments = document.getElementById('payment-installments').checked;
    document.getElementById('summary-upfront').style.display = isInstallments ? 'none' : 'block';
    document.getElementById('summary-installments').style.display = isInstallments ? 'block' : 'none';
    document.getElementById('installments-details').style.display = isInstallments ? 'block' : 'none';
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
    if (state.currentPage === 'page-category') filterAndRender(); // Re-render category grid
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
                const dots = '●'.repeat(myLevel) + '○'.repeat(10 - myLevel);
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
    document.getElementById('home-featured-cases').innerHTML = state.allProducts.filter(p => p.category === 'PC Case').slice(0,3).map(p => createProductCard(p, 'main')).join('');
    document.getElementById('home-featured-keyboards').innerHTML = state.allProducts.filter(p => p.category === 'Keyboard').slice(0,3).map(p => createProductCard(p, 'main')).join('');
    document.getElementById('home-featured-mice').innerHTML = state.allProducts.filter(p => p.category === 'Mice').slice(0,3).map(p => createProductCard(p, 'main')).join('');
}

export function loadCategoryPage(category) {
    state.currentCategory = category; // Save state
    
    // Reset price inputs when switching categories
    document.getElementById('min-price').value = '';
    document.getElementById('max-price').value = '';

    filterAndRender(); // Use a shared helper function
}

export function filterAndRender() {
    // Helper to safely parse price, whether it's a string like "1.500.000" or a number
    const parsePrice = (price) => {
        if (typeof price === 'string') {
            // Remove dots used as thousand separators, then parse
            return parseFloat(price.replace(/\./g, ''));
        }
        return price; // It's already a number
    };

    const minPrice = parseInt(document.getElementById('min-price').value) || 0;
    const maxPrice = parseInt(document.getElementById('max-price').value) || Infinity;
    const sortBy = document.getElementById('sort-by').value;
    const category = state.currentCategory;
    const title = document.getElementById('category-title');
    const grid = document.getElementById('category-product-grid');

    // Filter Logic
    let filtered = state.allProducts.filter(p => {
        const price = parsePrice(p.price);
        return price >= minPrice && price <= maxPrice;
    });
    
    if (category !== 'All') {
        filtered = filtered.filter(p => p.category === category);
        title.textContent = `${category}s`;
    } else {
        title.textContent = `All Products`;
    }

    // Sort Logic
    if (sortBy === 'price-asc') {
        filtered.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
    } else if (sortBy === 'price-desc') {
        filtered.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
    }

    // Render
    if (filtered.length === 0) {
        grid.innerHTML = '<p class="text-gray-400 col-span-3">No products found in this price range.</p>';
    } else {
        grid.innerHTML = filtered.map(p => createProductCard(p, 'main')).join('');
    }
}

export function loadOutletPage(category) {
    state.currentCategory = category; // Save state
    
    // Reset price inputs when switching categories
    document.getElementById('outlet-min-price').value = '';
    document.getElementById('outlet-max-price').value = '';

    filterAndRenderOutlet(); // Use a shared helper function
}

export function filterAndRenderOutlet() {
    // Helper to safely parse price, whether it's a string like "1.500.000" or a number
    const parsePrice = (price) => {
        if (typeof price === 'string') {
            // Remove dots used as thousand separators, then parse
            return parseFloat(price.replace(/\./g, ''));
        }
        return price; // It's already a number
    };

    const minPrice = parseInt(document.getElementById('outlet-min-price').value) || 0;
    const maxPrice = parseInt(document.getElementById('outlet-max-price').value) || Infinity;
    const sortBy = document.getElementById('outlet-sort-by').value;
    const category = state.currentCategory;
    const title = document.getElementById('outlet-title');
    const grid = document.getElementById('outlet-product-grid');

    // Filter Logic
    let filtered = state.outletProducts.filter(p => {
        const price = parsePrice(p.price);
        return price >= minPrice && price <= maxPrice;
    });
    
    if (category !== 'All') {
        filtered = filtered.filter(p => p.category === category);
        title.textContent = `${category}`;
    } else {
        title.textContent = `Outlet Store`;
    }

    // Sort Logic
    if (sortBy === 'price-asc') {
        filtered.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
    } else if (sortBy === 'price-desc') {
        filtered.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
    }

    // Render
    if (filtered.length === 0) {
        grid.innerHTML = '<p class="text-gray-400 col-span-3">No products found in this price range.</p>';
    } else {
        grid.innerHTML = filtered.map(p => createProductCard(p, 'outlet')).join('');
    }
}


const paymentUpfront = document.getElementById('payment-upfront');
const paymentInstallments = document.getElementById('payment-installments');
const installmentsDetails = document.getElementById('installments-details');
const monthlyPaymentSpan = document.getElementById('monthly-payment');

if (paymentUpfront && paymentInstallments && installmentsDetails && monthlyPaymentSpan) {
    paymentUpfront.addEventListener('change', () => {
        installmentsDetails.style.display = 'none';
    });

    paymentInstallments.addEventListener('change', () => {
        const subtotal = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const deliveryFee = 50000;
        const vat = subtotal * 0.10;
        const total = subtotal + deliveryFee + vat;
        const totalWithInterest = total * 1.12;
        const monthlyPayment = totalWithInterest / 12;

        monthlyPaymentSpan.textContent = formatCurrency(monthlyPayment);
        installmentsDetails.style.display = 'block';
    });
}

// === COMMENTS & RATINGS ===
async function renderComments(productId) {
    const commentsList = document.getElementById('comments-list');
    commentsList.innerHTML = '<p class="text-gray-500">Loading comments...</p>';
    try {
        const snapshot = await productsCollection.doc(productId).collection('comments').orderBy('createdAt', 'desc').get();
        const comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (comments.length === 0) {
            commentsList.innerHTML = '<p class="text-gray-500">No comments yet.</p>';
            return;
        }
        const commentRows = comments.map(c => `
            <div class="border-t border-gray-700 pt-4">
                <p class="text-white">${c.text}</p>
                <p class="text-xs text-gray-400 mt-1">By ${c.userEmail} on ${c.createdAt.toDate().toLocaleDateString()}</p>
                ${c.reply ? `<div class="mt-2 ml-4 p-2 bg-gray-700 rounded-lg"><p class="text-sm text-indigo-400">Admin Reply:</p><p class="text-sm text-gray-300">${c.reply}</p></div>` : ''}
                ${state.currentUser && state.currentUser.isAdmin && !c.reply ? `
                    <form class="mt-2 ml-4" onsubmit="handleReplySubmit(event, '${productId}', '${c.id}')">
                        <textarea class="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" rows="2" placeholder="Reply to this comment..."></textarea>
                        <button type="submit" class="mt-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-1 px-3 rounded-lg text-sm transition-colors">Submit Reply</button>
                    </form>
                ` : ''}
            </div>
        `).join('');
        commentsList.innerHTML = commentRows;
    } catch (error) {
        console.error("Error fetching comments:", error);
        commentsList.innerHTML = '<p class="text-red-500">Error loading comments.</p>';
    }
}

async function renderRating(productId) {
    const avgRatingContainer = document.getElementById('product-avg-rating');
    const ratingCountContainer = document.getElementById('product-rating-count');
    const ratingStarsContainer = document.getElementById('rating-stars');

    // Render average rating
    const product = state.allProducts.find(p => p.id === productId);
    const avgRating = product.avgRating || 0;
    const ratingCount = product.ratingCount || 0;

    let avgStars = '';
    for (let i = 1; i <= 5; i++) {
        avgStars += `<svg class="w-5 h-5 ${i <= avgRating ? 'text-yellow-400' : 'text-gray-500'}" fill="currentColor" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/></svg>`;
    }
    avgRatingContainer.innerHTML = avgStars;
    ratingCountContainer.textContent = `(${ratingCount} ratings)`;

    // Render user rating input
    let userStars = '';
    for (let i = 1; i <= 5; i++) {
        userStars += `<svg data-value="${i}" class="w-8 h-8 text-gray-500 cursor-pointer hover:text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/></svg>`;
    }
    ratingStarsContainer.innerHTML = userStars;

    const starElements = ratingStarsContainer.querySelectorAll('svg');
    starElements.forEach(star => {
        star.addEventListener('click', () => {
            const rating = star.dataset.value;
            state.currentUserRating = rating;
            starElements.forEach(s => {
                s.classList.toggle('text-yellow-400', s.dataset.value <= rating);
                s.classList.toggle('text-gray-500', s.dataset.value > rating);
            });
        });
    });
}

async function handleCommentSubmit(productId) {
    const commentText = document.getElementById('comment-text').value;
    if (!commentText.trim()) return;

    try {
        await productsCollection.doc(productId).collection('comments').add({
            text: commentText,
            userEmail: state.currentUser.email,
            userId: state.currentUser.uid,
            createdAt: new Date(),
            reply: null,
        });
        document.getElementById('comment-text').value = '';
        showToast("Comment submitted!");
        await renderComments(productId);
    } catch (error) {
        showToast("Error submitting comment.", true);
        console.error("Error submitting comment:", error);
    }
}

async function handleRatingSubmit(productId) {
    const rating = state.currentUserRating;
    if (!rating) return;

    try {
        const ratingRef = productsCollection.doc(productId).collection('ratings').doc(state.currentUser.uid);
        await ratingRef.set({ rating: parseInt(rating) });

        // Update average rating on product
        const productRef = productsCollection.doc(productId);
        const ratingsSnapshot = productRef.collection('ratings').get();
        const ratings = (await ratingsSnapshot).docs.map(doc => doc.data().rating);
        const avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
        const ratingCount = ratings.length;

        await productRef.update({ avgRating: avgRating, ratingCount: ratingCount });

        showToast("Rating submitted!");
        await loadProductsFromFirebase(); // to update the local product data
        await renderRating(productId);
        document.getElementById('rating-form-container').style.display = 'none';

    } catch (error) {
        showToast("Error submitting rating.", true);
        console.error("Error submitting rating:", error);
    }
}

export async function handleReplySubmit(event, productId, commentId) {
    event.preventDefault();
    const replyText = event.target.querySelector('textarea').value;
    if (!replyText.trim()) return;

    try {
        await productsCollection.doc(productId).collection('comments').doc(commentId).update({
            reply: replyText,
        });
        showToast("Reply submitted!");
        await renderComments(productId);
    } catch (error) {
        showToast("Error submitting reply.", true);
        console.error("Error submitting reply:", error);
    }
}


async function checkIfUserPurchased(productId) {
    if (!state.currentUser) return false;
    try {
        const snapshot = await ordersCollection.where('customer.uid', '==', state.currentUser.uid).get();
        if (snapshot.empty) return false;
        for (const doc of snapshot.docs) {
            const order = doc.data();
            if (order.items.some(item => item.id === productId)) {
                return true;
            }
        }
        return false;
    } catch (error) {
        console.error("Error checking purchase history:", error);
        return false;
    }
}