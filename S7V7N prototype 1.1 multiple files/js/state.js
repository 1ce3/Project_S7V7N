// js/state.js

// Helper to load cart from localStorage
function loadCartFromStorage() {
    try { return JSON.parse(localStorage.getItem('s7v7n_cart')) || []; } 
    catch (e) { return []; }
}

export const state = {
    allProducts: [],
    cart: loadCartFromStorage(),
    compareList: [],
    currentUser: null,
    currentEditId: null,
    currentPage: 'page-home',
    currentCategory: 'All'
};