import { addDoc, productsCollection, doc, setDoc, deleteDoc } from './firebase.js';
import { showToast } from './utils.js';
import { loadProducts, allProducts } from './products.js';

let currentEditId = null;

export async function handleProductSave(e) {
    e.preventDefault();
    const name = document.getElementById('admin-product-name').value;
    const price = Number(document.getElementById('admin-product-price').value);
    const stock = Number(document.getElementById('admin-product-stock').value);
    const category = document.getElementById('admin-product-category').value;
    const image = document.getElementById('admin-product-image').value;
    const description = document.getElementById('admin-product-description').value;
    
    const data = { name, price, stock, category, image, description, specs: {} }; // Add specs logic here

    try {
        if (currentEditId) {
            await setDoc(doc(productsCollection, currentEditId), data, { merge: true });
        } else {
            await addDoc(productsCollection, data);
        }
        showToast("Product Saved!");
        e.target.reset();
        currentEditId = null;
        await loadProducts(); // Reload to see changes
    } catch (err) {
        showToast(err.message, true);
    }
}