
// js/admin.js
import { state } from './state.js';
import { productsCollection, usersCollection, ordersCollection } from './config.js';
import { showToast, formatCurrency } from './utils.js';
import { loadProductsFromFirebase } from './main.js';
import { loadHomePage } from './shop.js';

// 1. Render the Admin Table
export async function renderAdminPage() {
    const list = document.getElementById('admin-product-list');
    list.innerHTML = '';
    document.getElementById('admin-product-count').textContent = state.allProducts.length;

    // Sort alphabetically
    const sorted = [...state.allProducts].sort((a,b) => a.name.localeCompare(b.name));

    sorted.forEach(p => {
        // Stock styling logic
        const stock = p.stock || 0;
        let stockClass = 'text-gray-300';
        if (stock <= 10 && stock > 0) stockClass = 'text-yellow-500 font-medium';
        if (stock === 0) stockClass = 'text-red-500 font-bold';

        list.innerHTML += `
            <tr class="hover:bg-gray-700">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <img class="h-10 w-10 rounded-full object-cover" src="${p.image || 'https://placehold.co/100x100?text=N/A'}" alt="">
                        <div class="ml-4">
                            <div class="text-sm font-medium text-white">${p.name}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${p.category}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${formatCurrency(p.price)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm ${stockClass}">${stock}</td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onclick="editProduct('${p.id}')" class="text-indigo-400 hover:text-indigo-300">Edit</button>
                    <button onclick="deleteProduct('${p.id}')" class="text-red-500 hover:text-red-400 ml-4">Delete</button>
                </td>
            </tr>
        `;
    });
    await renderCustomerList();
    await renderOrderList();
}

// ... (handleProductFormSubmit, editProduct, deleteProduct, resetAdminForm, renderCustomerList, deleteCustomer remain the same) ...

async function renderOrderList() {
    const list = document.getElementById('admin-order-list');
    list.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">Loading orders...</td></tr>';
    try {
        const snapshot = await ordersCollection.orderBy('createdAt', 'desc').get();
        const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const orderRows = orders.map(o => {
            const date = o.createdAt.toDate ? o.createdAt.toDate().toLocaleDateString() : 'N/A';
            return `
                <tr class="hover:bg-gray-700">
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-mono">${o.id}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-white">${o.customer.name}<br><span class="text-gray-400">${o.customer.email}</span></td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${date}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-indigo-400 font-semibold">${formatCurrency(o.total)}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-800 text-green-100">
                            ${o.status}
                        </span>
                    </td>
                </tr>
            `;
        }).join('');
        list.innerHTML = orderRows || '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">No orders found.</td></tr>';
    } catch (error) {
        console.error("Error fetching orders:", error);
        list.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-red-500">Error loading orders.</td></tr>';
        showToast("Could not load order data.", true);
    }
}


// 2. Handle Form Submit (Add OR Edit)
export async function handleProductFormSubmit(e) {
    e.preventDefault();
    
    const data = {
        name: document.getElementById('admin-product-name').value,
        price: parseInt(document.getElementById('admin-product-price').value) || 0,
        stock: parseInt(document.getElementById('admin-product-stock').value) || 0,
        category: document.getElementById('admin-product-category').value,
        image: document.getElementById('admin-product-image').value,
        description: document.getElementById('admin-product-description').value,
    };

    // Capture Specs Text
    const specsObj = {
        cpu: document.getElementById('admin-spec-cpu').value,
        gpu: document.getElementById('admin-spec-gpu').value,
        ram: document.getElementById('admin-spec-ram').value,
        storage: document.getElementById('admin-spec-storage').value,
        mainboard: document.getElementById('admin-spec-mainboard').value,
        psu: document.getElementById('admin-spec-psu').value,
        cooler: document.getElementById('admin-spec-cooler').value,
        case: document.getElementById('admin-spec-case').value,
    };

    // NEW: Capture Spec Levels (1-5)
    // We only capture levels for the "Big 4" components that effect performance most
    const levelsObj = {
        cpu: parseInt(document.getElementById('admin-level-cpu').value) || 1,
        gpu: parseInt(document.getElementById('admin-level-gpu').value) || 1,
        ram: parseInt(document.getElementById('admin-level-ram').value) || 1,
        storage: parseInt(document.getElementById('admin-level-storage').value) || 1,
    };

    const isSpecsEmpty = Object.values(specsObj).every(val => val === '');
    data.specs = isSpecsEmpty ? null : specsObj;
    data.specLevels = isSpecsEmpty ? null : levelsObj; // Save levels to DB

    try {
        if (state.currentEditId) {
            await productsCollection.doc(state.currentEditId).update(data);
            showToast('Product updated successfully!');
        } else {
            await productsCollection.add(data);
            showToast('Product added successfully!');
        }
        
        resetAdminForm();
        
        await loadProductsFromFirebase();
        renderAdminPage();
        loadHomePage(); 
    } catch (err) {
        showToast(`Error: ${err.message}`, true);
    }
}

// 3. Edit Product (Populate form)
export function editProduct(id) {
    const p = state.allProducts.find(x => x.id === id);
    if (!p) return;

    state.currentEditId = id;
    document.getElementById('admin-form-title').textContent = 'Edit Product';
    
    // Basic
    document.getElementById('admin-product-name').value = p.name;
    document.getElementById('admin-product-price').value = p.price;
    document.getElementById('admin-product-stock').value = p.stock || 0;
    document.getElementById('admin-product-category').value = p.category;
    document.getElementById('admin-product-image').value = p.image || '';
    document.getElementById('admin-product-description').value = p.description || '';

    // Specs Text
    const s = p.specs || {};
    document.getElementById('admin-spec-cpu').value = s.cpu || '';
    document.getElementById('admin-spec-gpu').value = s.gpu || '';
    document.getElementById('admin-spec-ram').value = s.ram || '';
    document.getElementById('admin-spec-storage').value = s.storage || '';
    document.getElementById('admin-spec-mainboard').value = s.mainboard || '';
    document.getElementById('admin-spec-psu').value = s.psu || '';
    document.getElementById('admin-spec-cooler').value = s.cooler || '';
    document.getElementById('admin-spec-case').value = s.case || '';

    // NEW: Specs Levels
    const l = p.specLevels || {};
    document.getElementById('admin-level-cpu').value = l.cpu || 1;
    document.getElementById('admin-level-gpu').value = l.gpu || 1;
    document.getElementById('admin-level-ram').value = l.ram || 1;
    document.getElementById('admin-level-storage').value = l.storage || 1;

    window.scrollTo(0, 0);
}

// 4. Delete Product
export async function deleteProduct(id) {
    if(!confirm("Are you sure you want to delete this product?")) return;
    try {
        await productsCollection.doc(id).delete();
        showToast("Product deleted.");
        await loadProductsFromFirebase();
        renderAdminPage();
        loadHomePage();
    } catch(e) {
        showToast("Error deleting: " + e.message, true);
    }
}

export function resetAdminForm() {
    document.getElementById('admin-product-form').reset();
    state.currentEditId = null;
    document.getElementById('admin-form-title').textContent = 'Add New Product';
}

async function renderCustomerList() {
    const list = document.getElementById('admin-customer-list');
    list.innerHTML = '<tr><td colspan="2" class="px-6 py-4 text-center text-gray-500">Loading customers...</td></tr>';
    try {
        const snapshot = await usersCollection.get();
        const customers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const customerRows = customers
            .filter(c => !c.isAdmin) // Exclude admins
            .map(c => `
                <tr class="hover:bg-gray-700">
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-white">${c.email}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onclick="deleteCustomer('${c.id}')" class="text-red-500 hover:text-red-400 ml-4">Delete</button>
                    </td>
                </tr>
            `).join('');
        list.innerHTML = customerRows || '<tr><td colspan="2" class="px-6 py-4 text-center text-gray-500">No customers found.</td></tr>';
    } catch (error) {
        console.error("Error fetching customers:", error);
        list.innerHTML = '<tr><td colspan="2" class="px-6 py-4 text-center text-red-500">Error loading customers.</td></tr>';
        showToast("Could not load customer data.", true);
    }
}

export async function deleteCustomer(userId) {
    if (!confirm("Are you sure you want to delete this customer? This only removes them from the database, not from the authentication system.")) return;
    try {
        await usersCollection.doc(userId).delete();
        showToast("Customer deleted successfully.");
        await renderCustomerList();
    } catch (error) {
        console.error("Error deleting customer:", error);
        showToast("Error deleting customer: " + error.message, true);
    }
}