import { productsCollection, getDocs } from './firebase.js';
import { formatCurrency, showToast } from './utils.js';

export let allProducts = [];

export async function loadProducts() {
    try {
        const snap = await getDocs(productsCollection);
        allProducts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        console.log("Products Loaded:", allProducts.length);
    } catch (e) {
        console.error(e);
        showToast("Failed to load products", true);
    }
}

export function renderProductCard(product) {
    const stockStatus = product.stock > 0 ? '' : 'grayscale opacity-75 pointer-events-none';
    const btnDisabled = product.stock > 0 ? '' : 'disabled';
    const btnText = product.stock > 0 ? 'Add to Cart' : 'Out of Stock';
    
    // Note: We use window.triggerAddToCart and window.triggerCompare.
    // These will be defined in main.js.
    return `
        <div class="bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col relative ${stockStatus}">
            ${product.specs ? `<button onclick="window.triggerCompare('${product.id}')" class="absolute top-2 right-2 p-1.5 bg-gray-900 rounded-full text-white z-10">⚖️</button>` : ''}
            <img src="${product.image}" class="w-full h-56 object-cover">
            <div class="p-4 flex flex-col flex-grow">
                <h3 class="text-lg font-bold text-white">${product.name}</h3>
                <p class="text-indigo-400 mb-4">${formatCurrency(product.price)}</p>
                <button onclick="window.triggerAddToCart('${product.id}')" ${btnDisabled} class="mt-auto w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded">${btnText}</button>
            </div>
        </div>
    `;
}