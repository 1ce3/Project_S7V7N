// js/admin.js
import { state } from './state.js';
import { productsCollection } from './config.js';
import { showToast } from './ui.js';

let editingProductId = null;

/**
 * Renders the list of products in the admin panel table.
 */
function renderAdminProductList() {
    const productListBody = document.getElementById('admin-product-list');
    const productCountEl = document.getElementById('admin-product-count');

    if (!productListBody || !productCountEl) return;

    productListBody.innerHTML = ''; // Clear existing list
    productCountEl.textContent = state.allProducts.length;

    if (state.allProducts.length === 0) {
        productListBody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-gray-500">No products found.</td></tr>`;
        return;
    }

    state.allProducts.forEach(product => {
        const tr = document.createElement('tr');

        // --- SAFE DATA HANDLING ---
        // Provide default values to prevent crashes if data is missing.
        const name = product.name || 'Unnamed Product';
        const category = product.category || 'Uncategorized';
        const stock = (typeof product.stock === 'number') ? product.stock : 0;
        const price = (typeof product.price === 'number') ? product.price.toLocaleString() + ' VND' : 'N/A';

        tr.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-white">${name}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${category}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${price}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${stock}</td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onclick="editProduct('${product.id}')" class="text-indigo-400 hover:text-indigo-300">Edit</button>
                <button onclick="deleteProduct('${product.id}')" class="text-red-500 hover:text-red-400 ml-4">Delete</button>
            </td>
        `;
        productListBody.appendChild(tr);
    });
}

/**
 * Handles the entire rendering of the admin page.
 */
export function renderAdminPage() {
    renderAdminProductList();
}

/**
 * Deletes a product from Firebase and updates the UI.
 * @param {string} productId The ID of the product to delete.
 */
export async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product? This cannot be undone.')) {
        return;
    }

    try {
        // 1. Delete from Firebase
        await productsCollection.doc(productId).delete();

        // 2. Update local state
        state.allProducts = state.allProducts.filter(p => p.id !== productId);

        // 3. Re-render the admin page to show the change
        renderAdminPage();

        showToast('Product deleted successfully!');
    } catch (error) {
        console.error("Error deleting product: ", error);
        showToast('Error deleting product.', true);
    }
}

/**
 * Populates the form with data from the product to be edited.
 * @param {string} productId The ID of the product to edit.
 */
export function editProduct(productId) {
    const product = state.allProducts.find(p => p.id === productId);
    if (!product) return;

    editingProductId = productId;

    document.getElementById('admin-form-title').textContent = 'Edit Product';
    document.getElementById('admin-product-name').value = product.name || '';
    document.getElementById('admin-product-price').value = product.price || 0;
    document.getElementById('admin-product-stock').value = product.stock || 0;
    document.getElementById('admin-product-category').value = product.category || 'Other';
    document.getElementById('admin-product-image').value = product.image || '';
    document.getElementById('admin-product-description').value = product.description || '';

    // Safely populate specs, providing defaults if they don't exist.
    document.getElementById('admin-spec-cpu').value = product.specs?.cpu || '';
    document.getElementById('admin-level-cpu').value = product.specs?.powerLevels?.cpu || '1';
    document.getElementById('admin-spec-gpu').value = product.specs?.gpu || '';
    document.getElementById('admin-level-gpu').value = product.specs?.powerLevels?.gpu || '1';
    document.getElementById('admin-spec-ram').value = product.specs?.ram || '';
    document.getElementById('admin-level-ram').value = product.specs?.powerLevels?.ram || '1';
    document.getElementById('admin-spec-storage').value = product.specs?.storage || '';
    document.getElementById('admin-level-storage').value = product.specs?.powerLevels?.storage || '1';
    document.getElementById('admin-spec-mainboard').value = product.specs?.mainboard || '';
    document.getElementById('admin-spec-psu').value = product.specs?.psu || '';
    document.getElementById('admin-spec-cooler').value = product.specs?.cooler || '';
    document.getElementById('admin-spec-case').value = product.specs?.case || '';

    window.scrollTo(0, 0); // Scroll to top to see the form
}

/**
 * Gathers all data from the admin form into a structured object.
 * @returns {object} The product data from the form.
 */
function getProductDataFromForm() {
    const name = document.getElementById('admin-product-name').value;
    const price = parseFloat(document.getElementById('admin-product-price').value);
    const stock = parseInt(document.getElementById('admin-product-stock').value, 10);
    const category = document.getElementById('admin-product-category').value;
    const image = document.getElementById('admin-product-image').value;
    const description = document.getElementById('admin-product-description').value;

    return {
        name,
        price: isNaN(price) ? 0 : price,
        stock: isNaN(stock) ? 0 : stock,
        category,
        image,
        description,
        specs: {
            cpu: document.getElementById('admin-spec-cpu').value,
            gpu: document.getElementById('admin-spec-gpu').value,
            ram: document.getElementById('admin-spec-ram').value,
            storage: document.getElementById('admin-spec-storage').value,
            mainboard: document.getElementById('admin-spec-mainboard').value,
            psu: document.getElementById('admin-spec-psu').value,
            cooler: document.getElementById('admin-spec-cooler').value,
            case: document.getElementById('admin-spec-case').value,
            powerLevels: {
                cpu: document.getElementById('admin-level-cpu').value,
                gpu: document.getElementById('admin-level-gpu').value,
                ram: document.getElementById('admin-level-ram').value,
                storage: document.getElementById('admin-level-storage').value,
            }
        }
    };
}

/**
 * Handles the submission of the add/edit product form,
 * creating or updating the product in Firebase.
 */
export async function handleProductFormSubmit(event) {
    event.preventDefault();
    const productData = getProductDataFromForm();

    if (editingProductId) {
        // --- UPDATE EXISTING PRODUCT ---
        try {
            await productsCollection.doc(editingProductId).update(productData);
            showToast('Product updated successfully!');
            // Update local state to match
            const index = state.allProducts.findIndex(p => p.id === editingProductId);
            if (index !== -1) {
                state.allProducts[index] = { id: editingProductId, ...productData };
            }
        } catch (error) {
            console.error("Error updating product: ", error);
            showToast('Error updating product.', true);
        }
    } else {
        // --- CREATE NEW PRODUCT ---
        try {
            const docRef = await productsCollection.add(productData);
            showToast('Product added successfully!');
            // Add new product to local state
            state.allProducts.push({ id: docRef.id, ...productData });
        } catch (error) {
            console.error("Error adding product: ", error);
            showToast('Error adding product.', true);
        }
    }

    // After submission, reset the form
    event.target.reset();
    document.getElementById('admin-form-title').textContent = 'Add New Product';
    editingProductId = null;
    renderAdminPage(); // Re-render the list with the new/updated data
}