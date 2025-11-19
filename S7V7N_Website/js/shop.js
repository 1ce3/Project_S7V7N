import { allProducts } from './products.js';
import { showToast, formatCurrency } from './utils.js';

let cart = [];
let compareList = [];

export function addToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
    
    if (!product) {
        console.error("Product not found:", productId);
        return;
    }
    
    if (product.stock <= 0) {
        showToast("Out of Stock", true);
        return;
    }
    
    const item = cart.find(i => i.id === productId);
    if (item) {
        item.quantity++;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    
    showToast(`${product.name} added to cart`);
    updateCartUI();
}

function updateCartUI() {
    const badge = document.getElementById('cart-count-badge');
    if (badge) {
        badge.innerText = cart.reduce((sum, i) => sum + i.quantity, 0);
    }
}

export function toggleCompare(productId) {
    // Check if item is already in compare list
    const index = compareList.indexOf(productId);
    
    if (index > -1) {
        compareList.splice(index, 1);
        showToast("Removed from comparison");
    } else {
        if (compareList.length >= 4) {
            showToast("Comparison limit reached (4)", true);
            return;
        }
        compareList.push(productId);
        showToast("Added to comparison");
    }
    
    // Update badge if it exists
    const badge = document.getElementById('compare-count-badge');
    if(badge) badge.innerText = compareList.length;
}