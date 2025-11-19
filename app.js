/*
  S7V7N E-Commerce App Logic (app.js)
  This file uses the Firebase v8 "COMPAT" SDK.
  It includes:
  - BUGFIX: Compare icon on category page.
  - NEW: Stock management system.
  - NEW: Transactional checkout logic.
*/

// === 1. FIREBASE V8 (COMPAT) SETUP ===
const firebaseConfig = {
  apiKey: "AIzaSyC1grBksJkPgnl8NPK_7e9RyfYcWNihC3k",
  authDomain: "s7v7n-website.firebaseapp.com",
  projectId: "s7v7n-website",
  storageBucket: "s7v7n-website.firebasestorage.app",
  messagingSenderId: "408540305652",
  appId: "1:408540305652:web:7774e79137e6dd5825e6a1",
  measurementId: "G-8G94DZVPXZ"
};

// Initialize Firebase (V8 compat syntax)
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore(); // Our database instance (V8 syntax)
const productsCollection = db.collection("products"); // V8 syntax for collection ref

// === 3. APPLICATION STATE ===
let allProducts = []; // This will be filled from Firebase
let cart = [];
let compareList = [];
let currentPage = 'page-home';
const allPages = [
    'page-home', 'page-category', 'page-product', 'page-cart', 
    'page-admin', 'page-login', 'page-register', 'page-compare',
    'page-policy', 'page-warranty', 'page-delivery', 'page-privacy'
];
let currentUser = null; // Auth simulation still
let currentEditId = null; // To track which product we are editing

// === 4. DOM ELEMENT REFERENCES ===
let cartCountBadge, compareCountBadge, homeFeaturedCases, homeFeaturedKeyboards, homeFeaturedMice,
    categoryProductGrid, categoryTitle, categoryBreadcrumb, productBreadcrumb, productImage,
    productName, productPrice, productDescription, productQuantityInput, addToCartBtn,
    addToCompareBtn, cartItemsList, cartSubtotal, cartTotal, toastElement, loginLink,
    adminLink, logoutButton, loginForm, registerForm, adminProductList, adminProductForm,
    adminFormTitle, adminProductCount, adminProductName, adminProductPrice,
    adminProductCategory, adminProductImage, adminProductDescription, adminSpecCpu,
    adminSpecGpu, adminSpecRam, adminSpecStorage, adminSpecMainboard, adminSpecPsu,
    adminSpecCooler, adminSpecCase, generateDescBtn, aiHelperBtn, aiHelperPrompt,
    aiHelperResults, aiCompareBtn, aiCompareResults, compareContainer, compareAiBenchmark,
    productStockLevel, adminProductStock, checkoutBtn; // Added new elements

// === 5. CORE FUNCTIONS ===

/**
 * Fetches all products from Firebase (V8 syntax)
 */
async function loadProductsFromFirebase() {
    try {
        const snapshot = await productsCollection.get(); // V8 get()
        allProducts = snapshot.docs.map(doc => ({
            id: doc.id, // The document ID is our product ID
            ...doc.data() // The rest of the product data
        }));
        console.log('Products loaded from Firebase:', allProducts);
    } catch (error) {
        console.error("Error loading products from Firebase:", error);
        showToast("Error: Could not load products from database.");
    }
}

/**
 * Formats a number as VND currency.
 */
function formatCurrency(amount) {
    const number = Number(amount);
    if (isNaN(number)) {
        return "Invalid Price";
    }
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(number);
}

/**
 * Shows a specific page and hides all others.
 * This is our "router".
 */
function showPage(pageId, context = null) {
    allPages.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.classList.remove('page-active');
        }
    });
    
    const pageToShow = document.getElementById(pageId);
    if (pageToShow) {
        pageToShow.classList.add('page-active');
    }
    
    currentPage = pageId;
    window.scrollTo(0, 0);
    
    if (pageId === 'page-category') {
        loadCategoryPage(context || 'All');
    } else if (pageId === 'page-cart') {
        renderCart();
    } else if (pageId === 'page-compare') {
        renderComparePage();
    } else if (pageId === 'page-admin') {
        if (currentUser && currentUser.isAdmin) {
            renderAdminPage();
        } else {
            showToast('Access Denied. Please log in as an Admin.');
            if (pageToShow) {
                pageToShow.classList.remove('page-active');
            }
            document.getElementById('page-login').classList.add('page-active');
            currentPage = 'page-login';
        }
    }
}

/**
 * Shows a toast notification.
 */
function showToast(message, isError = false) {
    toastElement.textContent = message;
    toastElement.style.backgroundColor = isError ? '#ef4444' : '#22c55e'; // red-500 or green-500
    toastElement.classList.add('toast-show');
    setTimeout(() => {
        toastElement.classList.remove('toast-show');
    }, 3000);
}

/**
 * Generates the HTML for a single product card.
 */
function createProductCard(product) {
    const isComparing = compareList.includes(product.id);
    const compareIconColor = isComparing ? 'text-indigo-500' : 'text-gray-300';
    const compareBgColor = isComparing ? 'bg-indigo-900/50' : 'bg-gray-900/50';

    // NEW: Check for out of stock
    const isOutOfStock = !product.stock || product.stock <= 0;
    const imageClasses = isOutOfStock ? 'opacity-50 grayscale' : '';
    const buttonDisabled = isOutOfStock ? 'disabled' : '';
    const buttonText = isOutOfStock ? 'Out of Stock' : 'Add to Cart';
    const buttonClasses = isOutOfStock 
        ? 'bg-gray-500 cursor-not-allowed' 
        : 'bg-indigo-600 hover:bg-indigo-500';

    return `
        <div class="bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col relative">
            ${product.specs ? `
            <button onclick="toggleCompare('${product.id}', event)" title="Add to Compare" 
                    class="absolute top-2 right-2 p-1.5 ${compareBgColor} rounded-full ${compareIconColor} hover:text-white hover:bg-indigo-600 z-10 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
            </button>
            ` : ''}
            <a href="#" onclick="showProductDetail('${product.id}'); return false;" class="block">
                <img src="${product.image || 'https://placehold.co/600x600/1f2937/ffffff?text=No+Image'}" alt="${product.name}" class="w-full h-56 object-cover ${imageClasses}" onerror="this.src='https://placehold.co/600x600/1f2937/ffffff?text=Image+Error'">
            </a>
            <div class="p-4 flex flex-col flex-grow">
                <h3 class="text-lg font-semibold text-white truncate">
                    <a href="#" onclick="showProductDetail('${product.id}'); return false;">${product.name}</a>
                </h3>
                <p class="text-indigo-400 font-medium mt-1 mb-4">${formatCurrency(product.price)}</p>
                <div class="mt-auto">
                    <button onclick="addToCart('${product.id}')" class="w-full ${buttonClasses} text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm" ${buttonDisabled}>
                        ${buttonText}
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Loads featured products onto the homepage.
 */
function loadHomePage() {
    const cases = allProducts.filter(p => p.category === 'PC Case').slice(0, 3);
    const keyboards = allProducts.filter(p => p.category === 'Keyboard').slice(0, 3);
    const mice = allProducts.filter(p => p.category === 'Mice').slice(0, 3);
    
    homeFeaturedCases.innerHTML = cases.length ? cases.map(createProductCard).join('') : '<p class="text-gray-400 col-span-3">No PC cases found.</p>';
    homeFeaturedKeyboards.innerHTML = keyboards.length ? keyboards.map(createProductCard).join('') : '<p class="text-gray-400 col-span-3">No keyboards found.</p>';
    homeFeaturedMice.innerHTML = mice.length ? mice.map(createProductCard).join('') : '<p class="text-gray-400 col-span-3">No mice found.</p>';
}

/**
 * Loads products into the category grid based on a filter.
 */
function loadCategoryPage(category) {
    let productsToShow;
    if (category === 'All') {
        productsToShow = allProducts;
        categoryTitle.textContent = 'All Products';
        categoryBreadcrumb.innerHTML = `<span class="text-gray-400"><a href="#" onclick="showPage('page-home'); return false;" class="hover:text-white">Home</a> &gt; </span><span class="text-white">All Products</span>`;
    } else {
        productsToShow = allProducts.filter(p => p.category === category);
        categoryTitle.textContent = category + 's';
        categoryBreadcrumb.innerHTML = `<span class="text-gray-400"><a href="#" onclick="showPage('page-home'); return false;" class="hover:text-white">Home</a> &gt; Products &gt; </span><span class="text-white">${category}s</span>`;
    }
    
    categoryProductGrid.innerHTML = productsToShow.length ? productsToShow.map(createProductCard).join('') : '<p class="text-gray-400 col-span-3">No products found in this category.</p>';
}

/**
 * Shows the detail page for a single product.
 */
function showProductDetail(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    productImage.src = product.image || 'https://placehold.co/600x600/1f2937/ffffff?text=No+Image';
    productImage.alt = product.name;
    productName.textContent = product.name;
    productPrice.textContent = formatCurrency(product.price);
    productDescription.textContent = product.description;

    // NEW: Stock Level Logic
    const stock = product.stock || 0;
    if (stock > 10) {
        productStockLevel.textContent = "In Stock";
        productStockLevel.className = "text-lg font-medium mb-6 text-green-500";
    } else if (stock > 0) {
        productStockLevel.textContent = `Only ${stock} left in stock!`;
        productStockLevel.className = "text-lg font-medium mb-6 text-yellow-500";
    } else {
        productStockLevel.textContent = "Out of Stock";
        productStockLevel.className = "text-lg font-medium mb-6 text-red-500";
    }

    // NEW: Disable/Enable Add to Cart button
    if (stock <= 0) {
        addToCartBtn.disabled = true;
        addToCartBtn.textContent = "Out of Stock";
    } else {
        addToCartBtn.disabled = false;
        addToCartBtn.textContent = "Add to Cart";
    }
    
    // Specs
    const specsContainer = document.getElementById('product-specs-container');
    const specsList = document.getElementById('product-specs-list');
    specsList.innerHTML = '';
    
    if (product.specs) {
        specsList.innerHTML = [
            {label: 'CPU', key: 'cpu'},
            {label: 'Graphics Card', key: 'gpu'},
            {label: 'RAM', key: 'ram'},
            {label: 'Storage', key: 'storage'},
            {label: 'Mainboard', key: 'mainboard'},
            {label: 'PSU', key: 'psu'},
            {label: 'Cooler', key: 'cooler'},
            {label: 'Case', key: 'case'}
        ]
        .map(spec => 
            `<li class="flex justify-between border-b border-gray-700 pb-2 pt-1">
                <span class="font-medium text-gray-400">${spec.label}</span>
                <span class="text-right">${product.specs[spec.key] || 'N/A'}</span>
            </li>`
        )
        .join('');
        specsContainer.style.display = 'block';
    } else {
        specsContainer.style.display = 'none';
    }
    
    // Compare Button
    if (product.specs) {
        addToCompareBtn.style.display = 'flex';
        updateCompareButton(productId);
    } else {
        addToCompareBtn.style.display = 'none';
    }
    
    productQuantityInput.value = 1;
    
    productBreadcrumb.innerHTML = `
        <span class="text-gray-400">
            <a href="#" onclick="showPage('page-home'); return false;" class="hover:text-white">Home</a> &gt; 
            <a href="#" onclick="showPage('page-category', '${product.category}'); return false;" class="hover:text-white">${product.category}s</a> &gt;
        </span>
        <span class="text-white">${product.name}</span>
    `;
    
    addToCartBtn.onclick = () => {
        const quantity = parseInt(productQuantityInput.value) || 1;
        addToCart(product.id, quantity);
    };
    
    showPage('page-product');
}

/**
 * Helper function for quantity inputs.
 */
function updateQuantity(inputId, change) {
    const input = document.getElementById(inputId);
    let newValue = parseInt(input.value) + change;
    if (newValue < 1) newValue = 1;
    input.value = newValue;
    
    if (inputId.startsWith('cart-qty-')) {
        const productId = inputId.split('-')[2];
        const productInCart = cart.find(item => item.id === productId);
        if (productInCart) {
            productInCart.quantity = newValue;
            renderCart();
        }
    }
}

// === 5. CART LOGIC ===

function addToCart(productId, quantity = 1) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    // NEW: Check stock
    const stock = product.stock || 0;
    if (stock <= 0) {
        showToast("Sorry, this item is out of stock.", true);
        return;
    }

    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        if (existingItem.quantity + quantity > stock) {
            showToast(`Error: Not enough stock. Only ${stock} available.`, true);
            return;
        }
        existingItem.quantity += quantity;
    } else {
        if (quantity > stock) {
            showToast(`Error: Not enough stock. Only ${stock} available.`, true);
            return;
        }
        cart.push({ ...product, quantity: quantity });
    }
    
    updateCartBadge();
    showToast(`${product.name} added to cart!`);
    renderCart(); // Re-render cart to update checkout button
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    renderCart(); // Re-render the cart
}

function updateCartBadge() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountBadge.textContent = totalItems;
}

function renderCart() {
    updateCartBadge();
    
    if (cart.length === 0) {
        cartItemsList.innerHTML = '<p id="cart-empty-message" class="text-gray-400">Your cart is currently empty.</p>';
        cartSubtotal.textContent = formatCurrency(0);
        cartTotal.textContent = formatCurrency(0);
        checkoutBtn.disabled = true; // Disable checkout if cart empty
        return;
    }
    
    let itemsHtml = '';
    let subtotalAmount = 0;
    let isAnyItemOutOfStock = false;

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotalAmount += itemTotal;

        // NEW: Check stock status for cart item
        const productFromDb = allProducts.find(p => p.id === item.id);
        const currentStock = productFromDb ? (productFromDb.stock || 0) : 0;
        let stockWarning = '';
        if (item.quantity > currentStock) {
            stockWarning = `<p class="text-xs text-red-500 mt-1">Not enough stock! Only ${currentStock} left.</p>`;
            isAnyItemOutOfStock = true;
        }

        itemsHtml += `
            <div class="flex items-start gap-4 p-4 border-b border-gray-700">
                <img src="${item.image}" alt="${item.name}" class="w-24 h-24 object-cover rounded-lg">
                <div class="flex-1">
                    <h3 class="text-lg font-semibold text-white">${item.name}</h3>
                    <p class="text-gray-400 text-sm">${formatCurrency(item.price)}</p>
                    <div class="flex items-center border border-gray-700 rounded-lg w-fit mt-2">
                        <button onclick="updateQuantity('cart-qty-${item.id}', -1)" class="px-3 py-1 text-gray-300 hover:bg-gray-700 rounded-l-lg">-</button>
                        <input id="cart-qty-${item.id}" type="number" value="${item.quantity}" min="1" class="w-12 text-center bg-gray-800 border-x border-gray-700 py-1 focus:outline-none">
                        <button onclick="updateQuantity('cart-qty-${item.id}', 1)" class="px-3 py-1 text-gray-300 hover:bg-gray-700 rounded-r-lg">+</button>
                    </div>
                    ${stockWarning}
                </div>
                <div class="text-right">
                    <p class="text-white font-semibold">${formatCurrency(itemTotal)}</p>
                    <button onclick="removeFromCart('${item.id}')" class="text-red-500 hover:text-red-400 text-sm mt-2">Remove</button>
                </div>
            </div>
        `;
    });
    
    cartItemsList.innerHTML = itemsHtml;
    cartSubtotal.textContent = formatCurrency(subtotalAmount);
    cartTotal.textContent = formatCurrency(subtotalAmount);

    // NEW: Disable checkout if any item has a stock issue
    if (isAnyItemOutOfStock) {
        checkoutBtn.disabled = true;
        showToast("Some items in your cart have stock issues.", true);
    } else {
        checkoutBtn.disabled = false;
    }
}

// === 6. COMPARE LOGIC ===

function updateCompareBadge() {
    compareCountBadge.textContent = compareList.length;
}

function toggleCompare(productId, event = null) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }

    const product = allProducts.find(p => p.id === productId);
    if (!product || !product.specs) {
        showToast('Only PC builds can be compared.');
        return;
    }
    
    const index = compareList.indexOf(productId);
    
    if (index > -1) {
        compareList.splice(index, 1);
        showToast(`${product.name} removed from comparison.`);
    } else {
        if (compareList.length >= 4) {
            showToast('You can only compare up to 4 items.');
            return;
        }
        compareList.push(productId);
        showToast(`${product.name} added to comparison.`);
    }
    
    updateCompareBadge();
    
    if (currentPage === 'page-product') {
        updateCompareButton(productId);
    }
    if (currentPage === 'page-compare') {
        renderComparePage();
    }
    if (currentPage === 'page-home') {
         loadHomePage();
    }
    // BUGFIX: Check category title to reload correctly
    if (currentPage === 'page-category') {
        const currentCategory = categoryTitle.textContent.replace('s', '');
        loadCategoryPage(currentCategory || 'All');
    }
}

function updateCompareButton(productId) {
    if (compareList.includes(productId)) {
        addToCompareBtn.textContent = 'Remove from Compare';
        addToCompareBtn.classList.remove('bg-gray-700', 'hover:bg-gray-600');
        addToCompareBtn.classList.add('bg-red-600', 'hover:bg-red-500');
        addToCompareBtn.onclick = () => toggleCompare(productId);
    } else {
        addToCompareBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Add to Compare
        `;
        addToCompareBtn.classList.add('bg-gray-700', 'hover:bg-gray-600');
        addToCompareBtn.classList.remove('bg-red-600', 'hover:bg-red-500');
        addToCompareBtn.onclick = () => toggleCompare(productId);
    }
}

function clearCompareList() {
    compareList = [];
    updateCompareBadge();
    renderComparePage();
    if (currentPage === 'page-home') loadHomePage();
    if (currentPage === 'page-category') {
        const currentCategory = categoryTitle.textContent.replace('s', '');
        loadCategoryPage(currentCategory);
    }
}

function renderComparePage() {
    updateCompareBadge();
    aiCompareResults.style.display = 'none';

    if (compareList.length === 0) {
        compareContainer.innerHTML = '<p id="compare-empty-message" class="text-gray-400">Your comparison list is empty. Add some PC builds to compare them.</p>';
        compareAiBenchmark.style.display = 'none';
        return;
    }
    
    const products = compareList.map(id => allProducts.find(p => p.id === id));
    
    let tableHtml = '<table class="min-w-full divide-y divide-gray-700">';
    
    tableHtml += '<thead class="bg-gray-800"><tr>';
    tableHtml += '<th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-1/5">Feature</th>';
    products.forEach(product => {
        tableHtml += `
            <th class="px-6 py-3 text-left text-sm font-medium text-white">
                <img src="${product.image}" alt="${product.name}" class="w-full h-32 object-cover rounded-md mb-2">
                ${product.name}
            </th>`;
    });
    tableHtml += '</tr></thead>';

    tableHtml += '<tbody class="bg-gray-800 divide-y divide-gray-700">';
    
    const specRows = [
        { key: 'price', label: 'Price' },
        { key: 'cpu', label: 'CPU' },
        { key: 'gpu', label: 'Graphics Card' },
        { key: 'ram', label: 'RAM' },
        { key: 'storage', label: 'Storage' },
        { key: 'mainboard', label: 'Mainboard' },
        { key: 'psu', label: 'PSU' },
        { key: 'cooler', label: 'Cooler' },
        { key: 'case', label: 'Case' },
    ];
    
    specRows.forEach(row => {
        tableHtml += '<tr class="hover:bg-gray-700">';
        tableHtml += `<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-300">${row.label}</td>`;
        products.forEach(product => {
            let value;
            if (row.key === 'price') {
                value = formatCurrency(product.price);
            } else {
                value = product.specs ? (product.specs[row.key] || 'N/A') : 'N/A';
            }
            tableHtml += `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${value}</td>`;
        });
        tableHtml += '</tr>';
    });

    tableHtml += '</tbody></table>';
    
    compareContainer.innerHTML = tableHtml;
    compareAiBenchmark.style.display = 'block';
}

// === 7. ADMIN PAGE LOGIC (NOW WITH FIREBASE V8) ===

/**
 * Renders the product list on the admin page.
 */
function renderAdminPage() {
    adminProductList.innerHTML = ''; // Clear existing list
    adminProductCount.textContent = allProducts.length; // Show count
    
    const sortedProducts = [...allProducts].sort((a, b) => a.name.localeCompare(b.name));

    sortedProducts.forEach(product => {
        // NEW: Show stock and add color coding
        const stock = product.stock || 0;
        let stockClass = 'text-gray-300';
        if (stock <= 10 && stock > 0) stockClass = 'text-yellow-500 font-medium';
        if (stock === 0) stockClass = 'text-red-500 font-bold';

        adminProductList.innerHTML += `
            <tr class="hover:bg-gray-700">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <img class="h-10 w-10 rounded-full object-cover" src="${product.image || 'https://placehold.co/100x100/1f2937/ffffff?text=N/A'}" alt="">
                        <div class="ml-4">
                            <div class="text-sm font-medium text-white">${product.name}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${product.category}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${formatCurrency(product.price)}</td>
                <!-- NEW: Stock Column -->
                <td class="px-6 py-4 whitespace-nowrap text-sm ${stockClass}">${stock}</td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onclick="editProduct('${product.id}')" class="text-indigo-400 hover:text-indigo-300">Edit</button>
                    <button onclick="deleteProduct('${product.id}', '${product.name}')" class="text-red-500 hover:text-red-400 ml-4">Delete</button>
                </td>
            </tr>
        `;
    });
}

/**
 * Fills the admin form to edit an existing product.
 */
function editProduct(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    
    currentEditId = productId; // Set the global edit ID
    
    adminFormTitle.textContent = 'Edit Product';
    adminProductName.value = product.name;
    adminProductPrice.value = product.price;
    adminProductStock.value = product.stock || 0; // NEW: Set stock
    adminProductCategory.value = product.category;
    adminProductImage.value = product.image || '';
    adminProductDescription.value = product.description || '';
    
    adminSpecCpu.value = product.specs?.cpu || '';
    adminSpecGpu.value = product.specs?.gpu || '';
    adminSpecRam.value = product.specs?.ram || '';
    adminSpecStorage.value = product.specs?.storage || '';
    adminSpecMainboard.value = product.specs?.mainboard || '';
    adminSpecPsu.value = product.specs?.psu || '';
    adminSpecCooler.value = product.specs?.cooler || '';
    adminSpecCase.value = product.specs?.case || '';
    
    window.scrollTo(0, 0);
}

/**
 * Deletes a product from the Firebase database. (V8 syntax)
 */
async function deleteProduct(productId, productName) {
    if (confirm(`Are you sure you want to delete "${productName}"? This action is permanent.`)) {
        try {
            const productDoc = productsCollection.doc(productId); // V8 doc ref
            await productDoc.delete(); // V8 delete
            showToast('Product deleted successfully!');
            
            // Refetch data and re-render
            await loadProductsFromFirebase();
            renderAdminPage();
            loadHomePage();
        } catch (error) {
            console.error("Error deleting product: ", error);
            showToast(`Error: Could not delete product. ${error.message}`, true);
        }
    }
}

/**
 * Resets the admin form.
 */
function resetAdminForm() {
    adminFormTitle.textContent = 'Add New Product';
    adminProductForm.reset();
    currentEditId = null; // Clear edit ID
}

/**
 * Handles the submission of the admin product form (add or edit). (V8 syntax)
 */
async function handleProductFormSubmit(event) {
    event.preventDefault();
    
    const productData = {
        name: adminProductName.value,
        price: parseInt(adminProductPrice.value),
        stock: parseInt(adminProductStock.value) || 0, // NEW: Add stock
        category: adminProductCategory.value,
        image: adminProductImage.value || `https://placehold.co/600x600/1f2937/ffffff?text=${adminProductName.value.replace(' ', '+')}`,
        description: adminProductDescription.value,
        specs: {
            cpu: adminSpecCpu.value || null,
            gpu: adminSpecGpu.value || null,
            ram: adminSpecRam.value || null,
            storage: adminSpecStorage.value || null,
            mainboard: adminSpecMainboard.value || null,
            psu: adminSpecPsu.value || null,
            cooler: adminSpecCooler.value || null,
            case: adminSpecCase.value || null,
        }
    };

    if (Object.values(productData.specs).every(v => v === null || v === '')) {
        productData.specs = null;
    }

    try {
        if (currentEditId) {
            // This is an EDIT (V8 syntax)
            const productDoc = productsCollection.doc(currentEditId); // V8 doc ref
            await productDoc.set(productData, { merge: true }); // V8 set
            showToast('Product updated successfully!');
        } else {
            // This is an ADD (V8 syntax)
            await productsCollection.add(productData); // V8 add
            showToast('Product added successfully!');
        }
        
        resetAdminForm();
        
        // Refetch all data from Firebase and re-render the pages
        await loadProductsFromFirebase();
        renderAdminPage();
        loadHomePage();
        
    } catch (error) {
        console.error("Error saving product: ", error);
        showToast(`Error: Could not save product. ${error.message}`, true);
    }
}

// === 8. AUTH LOGIC (SIMULATION) ===

function updateNav() {
    if (currentUser) {
        loginLink.style.display = 'none';
        logoutButton.style.display = 'block';
        if (currentUser.isAdmin) {
            adminLink.style.display = 'block';
        } else {
            adminLink.style.display = 'none';
        }
    } else {
        loginLink.style.display = 'block';
        logoutButton.style.display = 'none';
        adminLink.style.display = 'none';
    }
}

function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('login-email').value;
    
    if (email === 'admin@s7v7n.com') {
        currentUser = {
            id: 1, email: 'admin@s7v7n.com', isAdmin: true,
            token: 'simulated-admin-jwt-token'
        };
        showToast('Admin login successful!');
    } else {
        currentUser = {
            id: 2, email: email, isAdmin: false,
            token: 'simulated-user-jwt-token'
        };
        showToast('User login successful!');
    }
    
    updateNav();
    showPage('page-home');
}

function handleRegister(event) {
    event.preventDefault();
    const email = document.getElementById('register-email').value;
    
    currentUser = {
        id: Math.floor(Math.random() * 1000) + 10,
        email: email, isAdmin: false,
        token: 'simulated-new-user-jwt-token'
    };
    
    showToast('Registration successful! You are now logged in.');
    updateNav();
    showPage('page-home');
}

function handleLogout() {
    currentUser = null;
    showToast('You have been logged out.');
    updateNav();
    showPage('page-home');
}

// === 9. GEMINI API FUNCTIONS ===

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function callGeminiAPI(systemPrompt, userQuery, retries = 3, delay = 1000) {
    const apiKey = ""; // Handled by environment
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: {
            parts: [{ text: systemPrompt }]
        },
    };

    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
                return result.candidates[0].content.parts[0].text;
            } else {
                throw new Error('Invalid API response structure');
            }
        } catch (error) {
            if (i === retries - 1) {
                console.error('Gemini API call failed after all retries:', error);
                return `Error: Could not get a response. ${error.message}`;
            }
            await sleep(delay * Math.pow(2, i));
        }
    }
}

async function handleGenerateDescription() {
    const productName = adminProductName.value;
    const productCategory = adminProductCategory.value;

    if (!productName) {
        showToast('Please enter a product name first.');
        return;
    }

    generateDescBtn.textContent = 'Generating...';
    generateDescBtn.disabled = true;

    const systemPrompt = "You are an expert e-commerce copywriter for 'S7V7N', a high-end gaming hardware store. Write a concise, exciting, and professional product description (2-3 sentences) for the following product. Focus on appealing to gamers, creators, and tech enthusiasts.";
    const userQuery = `Product Name: ${productName}\nCategory: ${productCategory}`;

    const description = await callGeminiAPI(systemPrompt, userQuery);

    adminProductDescription.value = description;
    
    generateDescBtn.textContent = '✨ Generate';
    generateDescBtn.disabled = false;
}

async function handleAiBuildHelper() {
    const userPrompt = aiHelperPrompt.value;
    if (!userPrompt) {
        showToast('Please describe your needs first.');
        return;
    }

    aiHelperBtn.textContent = 'Thinking...';
    aiHelperBtn.disabled = true;
    aiHelperResults.style.display = 'block';
    aiHelperResults.textContent = 'Asking our AI expert...';

    const productCatalog = allProducts.map(p => ({
        id: p.id, name: p.name, category: p.category, price: p.price
    }));

    const systemPrompt = `You are the 'S7V7N AI Build Assistant'. A user will describe their needs, and you must recommend one PC Case, one Keyboard, and one Mouse from the provided product catalog.

Rules:
1.  ONLY recommend products from the JSON 'Product Catalog' provided.
2.  Format your response clearly (e.g., using bold titles for each product).
3.  For each recommendation, briefly explain *why* it fits the user's needs.
4.  If the catalog is missing a category, state that.
5.  Be friendly, helpful, and concise.`;
    
    const userQuery = `User's Needs: "${userPrompt}"\n\nProduct Catalog:\n${JSON.stringify(productCatalog, null, 2)}`;

    const recommendations = await callGeminiAPI(systemPrompt, userQuery);

    aiHelperResults.textContent = recommendations;
    
    aiHelperBtn.textContent = 'Get Recs';
    aiHelperBtn.disabled = false;
}

async function handleAiCompare() {
    if (compareList.length === 0) {
        showToast('Please add some PCs to compare first.');
        return;
    }

    aiCompareBtn.textContent = 'Analyzing...';
    aiCompareBtn.disabled = true;
    aiCompareResults.style.display = 'block';
    aiCompareResults.textContent = 'Asking our AI expert to analyze the builds...';
    
    const productsToCompare = compareList.map(id => {
        const p = allProducts.find(prod => prod.id === id);
        return { name: p.name, price: formatCurrency(p.price), specs: p.specs };
    });

    const systemPrompt = `You are a PC hardware expert and benchmark analyst for 'S7V7N'. A user is comparing several pre-built PCs. Analyze their specifications and provide a concise, expert comparison.

Rules:
1.  Start with a high-level summary.
2.  Break down the comparison by key components (CPU, GPU, RAM).
3.  Explain the *real-world performance differences* for gaming and productivity (e.g., "PC 1 will be significantly better for 1440p gaming due to the RTX 4070, while PC 2 is a great budget 1080p machine.").
4.  Conclude with a "Best For" recommendation for each PC (e.g., Best for Competitive FPS, Best for Streaming & 1440p Gaming, Best for 4K Video Editing).
5.  Use a helpful, comparative tone. Be objective. Format your response with paragraphs and bold headings for readability.`;
    
    const userQuery = `Please analyze and compare these PCs:\n${JSON.stringify(productsToCompare, null, 2)}`;

    const analysis = await callGeminiAPI(systemPrompt, userQuery);

    aiCompareResults.textContent = analysis;
    
    aiCompareBtn.textContent = 'Generate AI Performance Comparison';
    aiCompareBtn.disabled = false;
}

// === 10. NEW: CHECKOUT TRANSACTION ===

async function handleCheckout() {
    if (cart.length === 0) {
        showToast("Your cart is empty.", true);
        return;
    }

    checkoutBtn.disabled = true;
    checkoutBtn.textContent = "Processing...";

    try {
        // This is a Firestore Transaction
        // It's like a C mutex: it locks the database to prevent race conditions.
        await db.runTransaction(async (transaction) => {
            const productsToUpdate = [];
            const outOfStockItems = [];

            // 1. "Lock" and read all items in the cart from the DB
            for (const cartItem of cart) {
                const productRef = productsCollection.doc(cartItem.id);
                const doc = await transaction.get(productRef);
                
                if (!doc.exists) {
                    throw new Error(`Product ${cartItem.name} not found in database.`);
                }
                
                const currentStock = doc.data().stock || 0;
                
                if (currentStock < cartItem.quantity) {
                    outOfStockItems.push({ name: cartItem.name, remaining: currentStock });
                }
                
                const newStock = currentStock - cartItem.quantity;
                // Add the update to our "to-do" list
                productsToUpdate.push({ ref: productRef, newStock: newStock });
            }

            // 2. Check if any items failed the stock check
            if (outOfStockItems.length > 0) {
                // Abort the transaction
                const itemNames = outOfStockItems.map(item => `${item.name} (only ${item.remaining} left)`);
                throw new Error(`Checkout failed. These items are out of stock: ${itemNames.join(', ')}`);
            }

            // 3. "Commit" the changes: All items are in stock, so update the database
            productsToUpdate.forEach(item => {
                transaction.update(item.ref, { stock: item.newStock });
            });
        });

        // If the transaction succeeded:
        showToast("Checkout successful! Order placed.");
        cart = []; // Empty the local cart
        renderCart(); // Re-render the empty cart
        await loadProductsFromFirebase(); // Reload data to show new stock levels
        loadHomePage(); // Refresh homepage
        if (currentPage === 'page-category') {
             const currentCategory = categoryTitle.textContent.replace('s', '');
             loadCategoryPage(currentCategory || 'All');
        }

    } catch (error) {
        // If the transaction failed:
        console.error("Checkout transaction failed: ", error);
        showToast(error.message, true); // Show the specific error (e.g., "Out of stock")
        // Reload data to ensure cart is accurate
        await loadProductsFromFirebase();
        renderCart();
    }

    checkoutBtn.disabled = false;
    checkoutBtn.textContent = "Proceed to Checkout";
}


// === 11. INITIALIZATION ===

document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. Assign all DOM elements to our variables
    cartCountBadge = document.getElementById('cart-count-badge');
    compareCountBadge = document.getElementById('compare-count-badge');
    homeFeaturedCases = document.getElementById('home-featured-cases');
    homeFeaturedKeyboards = document.getElementById('home-featured-keyboards');
    homeFeaturedMice = document.getElementById('home-featured-mice');
    categoryProductGrid = document.getElementById('category-product-grid');
    categoryTitle = document.getElementById('category-title');
    categoryBreadcrumb = document.getElementById('category-breadcrumb');
    productBreadcrumb = document.getElementById('product-breadcrumb');
    productImage = document.getElementById('product-image');
    productName = document.getElementById('product-name');
    productPrice = document.getElementById('product-price');
    productDescription = document.getElementById('product-description');
    productQuantityInput = document.getElementById('product-quantity-input');
    addToCartBtn = document.getElementById('add-to-cart-btn');
    addToCompareBtn = document.getElementById('add-to-compare-btn');
    cartItemsList = document.getElementById('cart-items-list');
    cartSubtotal = document.getElementById('cart-subtotal');
    cartTotal = document.getElementById('cart-total');
    toastElement = document.getElementById('toast');
    loginLink = document.getElementById('login-link');
    adminLink = document.getElementById('admin-link');
    logoutButton = document.getElementById('logout-button');
    loginForm = document.getElementById('login-form');
    registerForm = document.getElementById('register-form');
    adminProductList = document.getElementById('admin-product-list');
    adminProductForm = document.getElementById('admin-product-form');
    adminFormTitle = document.getElementById('admin-form-title');
    adminProductCount = document.getElementById('admin-product-count');
    adminProductName = document.getElementById('admin-product-name');
    adminProductPrice = document.getElementById('admin-product-price');
    adminProductStock = document.getElementById('admin-product-stock'); // NEW
    adminProductCategory = document.getElementById('admin-product-category');
    adminProductImage = document.getElementById('admin-product-image');
    adminProductDescription = document.getElementById('admin-product-description');
    adminSpecCpu = document.getElementById('admin-spec-cpu');
    adminSpecGpu = document.getElementById('admin-spec-gpu');
    adminSpecRam = document.getElementById('admin-spec-ram');
    adminSpecStorage = document.getElementById('admin-spec-storage');
    adminSpecMainboard = document.getElementById('admin-spec-mainboard');
    adminSpecPsu = document.getElementById('admin-spec-psu');
    adminSpecCooler = document.getElementById('admin-spec-cooler');
    adminSpecCase = document.getElementById('admin-spec-case');
    generateDescBtn = document.getElementById('generate-desc-btn');
    aiHelperBtn = document.getElementById('ai-helper-btn');
    aiHelperPrompt = document.getElementById('ai-helper-prompt');
    aiHelperResults = document.getElementById('ai-helper-results');
    aiCompareBtn = document.getElementById('ai-compare-btn');
    aiCompareResults = document.getElementById('ai-compare-results');
    compareContainer = document.getElementById('compare-container');
    compareAiBenchmark = document.getElementById('compare-ai-benchmark');
    productStockLevel = document.getElementById('product-stock-level'); // NEW
    checkoutBtn = document.getElementById('checkout-btn'); // NEW

    // 2. Attach event listeners for auth forms
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    
    // 3. Attach event listener for the admin form
    adminProductForm.addEventListener('submit', handleProductFormSubmit);
    
    // 4. Attach event listeners for Gemini features
    generateDescBtn.addEventListener('click', handleGenerateDescription);
    aiHelperBtn.addEventListener('click', handleAiBuildHelper);
    aiCompareBtn.addEventListener('click', handleAiCompare);

    // 5. NEW: Attach checkout listener
    checkoutBtn.addEventListener('click', handleCheckout);

    // 6. Set initial loading state
    homeFeaturedCases.innerHTML = '<p class="text-gray-400 col-span-3">Connecting to database...</p>';
    
    // 7. Load data from Firebase
    await loadProductsFromFirebase();
    
    // 8. Once data is loaded, populate the page
    loadHomePage();
    
    // 9. Set initial nav state (logged out)
    updateNav();
    updateCompareBadge();
    
    // 10. Show the homepage
    showPage('page-home');
});