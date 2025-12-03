import { state } from './state.js';
import { productsCollection, outletProductsCollection, componentsCollection } from './config.js';
import { showToast } from './utils.js';

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

export async function loadComponentsFromFirebase() {
    try {
        const snap = await componentsCollection.get();
        state.components = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        console.log("Loaded components:", state.components.length);
    } catch (e) {
        console.error(e);
        showToast("Error loading components", true);
    }
}

export async function loadOutletProductsFromFirebase() {
    try {
        const snap = await outletProductsCollection.get();
        state.outletProducts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        console.log("Loaded outlet products:", state.outletProducts.length);
    } catch (e) {
        console.error(e);
        showToast("DB Error", true);
    }
}