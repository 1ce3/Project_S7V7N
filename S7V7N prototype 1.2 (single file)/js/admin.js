
// js/admin.js
import { state } from './state.js';
import { productsCollection, outletProductsCollection, usersCollection, ordersCollection } from './config.js';
import { showToast, formatCurrency } from './utils.js';
import { loadProductsFromFirebase, loadOutletProductsFromFirebase } from './main.js';
import { loadHomePage } from './shop.js';

// 1. Render the Admin Table
export async function renderAdminPage() {
    const list = document.getElementById('admin-product-list');
    list.innerHTML = '';
    
    const isOutlet = document.getElementById('outlet-toggle').checked;
    const products = isOutlet ? state.outletProducts : state.allProducts;

    document.getElementById('admin-product-count').textContent = products.length;

    // Sort alphabetically
    const sorted = [...products].sort((a,b) => a.name.localeCompare(b.name));

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
    list.innerHTML = '<tr><td colspan="8" class="px-6 py-4 text-center text-gray-500">Loading orders...</td></tr>';
    try {
        const snapshot = await ordersCollection.orderBy('createdAt', 'desc').get();
        const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const orderRows = orders.map(o => {
            const date = o.createdAt.toDate ? o.createdAt.toDate().toLocaleDateString() : 'N/A';
            const paymentType = o.payment.method === 'installments' ? 'Installments' : o.payment.type;
            const deliveryMethod = o.delivery === 'ship' ? 'Ship to Home' : 'Pick Up In Store';
            const address = o.delivery === 'ship' ? o.customer.address : 'N/A';

            return `
                <tr class="hover:bg-gray-700">
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-mono">${o.id}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-white">${o.customer.name}<br><span class="text-gray-400">${o.customer.email}</span></td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${date}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-indigo-400 font-semibold">${formatCurrency(o.total)}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${paymentType}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${deliveryMethod}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${address}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-800 text-green-100">
                            ${o.status}
                        </span>
                    </td>
                </tr>
            `;
        }).join('');
        list.innerHTML = orderRows || '<tr><td colspan="8" class="px-6 py-4 text-center text-gray-500">No orders found.</td></tr>';
    } catch (error) {
        console.error("Error fetching orders:", error);
        list.innerHTML = '<tr><td colspan="8" class="px-6 py-4 text-center text-red-500">Error loading orders.</td></tr>';
        showToast("Could not load order data.", true);
    }
}


// 2. Handle Form Submit (Add OR Edit)
export async function handleProductFormSubmit(e) {
    e.preventDefault();
    
    const isOutlet = document.getElementById('outlet-toggle').checked;
    const collection = isOutlet ? outletProductsCollection : productsCollection;
    const loadFunction = isOutlet ? loadOutletProductsFromFirebase : loadProductsFromFirebase;

    const data = {
        name: document.getElementById('admin-product-name').value,
        price: parseInt(document.getElementById('admin-product-price').value) || 0,
        stock: parseInt(document.getElementById('admin-product-stock').value) || 0,
        category: document.getElementById('admin-product-category').value,
        image: document.getElementById('admin-product-image').value,
        description: document.getElementById('admin-product-description').value,
        manufacturer: document.getElementById('admin-product-manufacturer')?.value || null, // Capture manufacturer if exists
    };

    let specsObj = {};
    let levelsObj = null;

    // Capture Specs based on category
    switch (data.category) {
        case 'PC Case':
            specsObj = {
                cpu: document.getElementById('admin-spec-cpu').value,
                gpu: document.getElementById('admin-spec-gpu').value,
                ram: document.getElementById('admin-spec-ram').value,
                storage: document.getElementById('admin-spec-storage').value,
                mainboard: document.getElementById('admin-spec-mainboard').value,
                psu: document.getElementById('admin-spec-psu').value,
                cooler: document.getElementById('admin-spec-cooler').value,
                case: document.getElementById('admin-spec-case').value,
            };
            levelsObj = { // Only PC Cases have specLevels
                cpu: parseInt(document.getElementById('admin-level-cpu').value) || 1,
                gpu: parseInt(document.getElementById('admin-level-gpu').value) || 1,
                ram: parseInt(document.getElementById('admin-level-ram').value) || 1,
                storage: parseInt(document.getElementById('admin-level-storage').value) || 1,
            };
            break;
        case 'Mice':
            specsObj = {
                dpi: document.getElementById('admin-spec-dpi').value,
                lights: document.getElementById('admin-spec-lights').value,
                bluetooth: document.getElementById('admin-spec-bluetooth').checked,
            };
            break;
        case 'Keyboard':
            specsObj = {
                switch: document.getElementById('admin-spec-switch').value,
                backlight: document.getElementById('admin-spec-backlight').checked,
            };
            break;
        case 'Storage':
            specsObj = {
                storagespace: document.getElementById('admin-spec-storagespace').value,
            };
            break;
        case 'RAM':
            specsObj = {
                ramsize: document.getElementById('admin-spec-ramsize').value,
                ramtech: document.getElementById('admin-spec-ramtech').value,
            };
            break;
        case 'Graphics Card':
            specsObj = {
                vram: document.getElementById('admin-spec-vram').value,
                interface: document.getElementById('admin-spec-interface').value,
                clockspeed: document.getElementById('admin-spec-clockspeed').value,
            };
            break;
        default:
            specsObj = {};
            break;
    }

    const isSpecsEmpty = Object.values(specsObj).every(val => val === '' || val === false); // Include false for checkboxes
    data.specs = isSpecsEmpty ? null : specsObj;
    data.specLevels = levelsObj; // Assign specLevels (null for non-PC-Case)

    try {
        if (state.currentEditId) {
            await collection.doc(state.currentEditId).update(data);
            showToast('Product updated successfully!');
        } else {
            await collection.add(data);
            showToast('Product added successfully!');
        }
        
        resetAdminForm();
        
        await loadFunction();
        renderAdminPage();
        loadHomePage(); 
    } catch (err) {
        showToast(`Error: ${err.message}`, true);
    }
}

// 3. Edit Product (Populate form)
export function editProduct(id) {
    const isOutlet = document.getElementById('outlet-toggle').checked;
    const products = isOutlet ? state.outletProducts : state.allProducts;
    const p = products.find(x => x.id === id);
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
    document.getElementById('admin-product-manufacturer').value = p.manufacturer || '';

    // Populate Specs based on category
    const s = p.specs || {};
    switch (p.category) {
        case 'PC Case':
            document.getElementById('admin-spec-cpu').value = s.cpu || '';
            document.getElementById('admin-spec-gpu').value = s.gpu || '';
            document.getElementById('admin-spec-ram').value = s.ram || '';
            document.getElementById('admin-spec-storage').value = s.storage || '';
            document.getElementById('admin-spec-mainboard').value = s.mainboard || '';
            document.getElementById('admin-spec-psu').value = s.psu || '';
            document.getElementById('admin-spec-cooler').value = s.cooler || '';
            document.getElementById('admin-spec-case').value = s.case || '';
            
            // Populate Spec Levels for PC Case
            const l = p.specLevels || {};
            document.getElementById('admin-level-cpu').value = l.cpu || 1;
            document.getElementById('admin-level-gpu').value = l.gpu || 1;
            document.getElementById('admin-level-ram').value = l.ram || 1;
            document.getElementById('admin-level-storage').value = l.storage || 1;
            break;
        case 'Mice':
            document.getElementById('admin-spec-dpi').value = s.dpi || '';
            document.getElementById('admin-spec-lights').value = s.lights || 'None';
            document.getElementById('admin-spec-bluetooth').checked = s.bluetooth || false;
            break;
        case 'Keyboard':
            document.getElementById('admin-spec-switch').value = s.switch || 'Mechanical';
            document.getElementById('admin-spec-backlight').checked = s.backlight || false;
            break;
        case 'Storage':
            document.getElementById('admin-spec-storagespace').value = s.storagespace || '';
            break;
        case 'RAM':
            document.getElementById('admin-spec-ramsize').value = s.ramsize || '';
            document.getElementById('admin-spec-ramtech').value = s.ramtech || 'DDR4';
            break;
        case 'Graphics Card':
            document.getElementById('admin-spec-vram').value = s.vram || '';
            document.getElementById('admin-spec-interface').value = s.interface || '';
            document.getElementById('admin-spec-clockspeed').value = s.clockspeed || '';
            break;
        default:
            // No specific specs for 'Other' or new categories initially
            break;
    }

    toggleSpecFields(); // Show/hide appropriate fields

    window.scrollTo(0, 0);
}

// 4. Delete Product
export async function deleteProduct(id) {
    if(!confirm("Are you sure you want to delete this product?")) return;

    const isOutlet = document.getElementById('outlet-toggle').checked;
    const collection = isOutlet ? outletProductsCollection : productsCollection;
    const loadFunction = isOutlet ? loadOutletProductsFromFirebase : loadProductsFromFirebase;

    try {
        await collection.doc(id).delete();
        showToast("Product deleted.");
        await loadFunction();
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
    toggleSpecFields(); // Hide all spec fields on reset
}

document.addEventListener('DOMContentLoaded', () => {
    const productCategorySelect = document.getElementById('admin-product-category');
    if (productCategorySelect) {
        productCategorySelect.addEventListener('change', toggleSpecFields);
    }
    toggleSpecFields(); // Initial call to set correct visibility
});

function toggleSpecFields() {
    const selectedCategory = document.getElementById('admin-product-category').value;
    const specContainers = {
        'PC Case': document.getElementById('specs-pc-case'),
        'Mice': document.getElementById('specs-mice'),
        'Keyboard': document.getElementById('specs-keyboard'),
        'Storage': document.getElementById('specs-storage'),
        'RAM': document.getElementById('specs-ram'),
        'Graphics Card': document.getElementById('specs-graphics-card'),
    };
    const adminManufacturerField = document.getElementById('admin-manufacturer-field');

    // Hide all spec fields initially
    Object.values(specContainers).forEach(container => {
        if (container) container.style.display = 'none';
    });

    // Show relevant spec fields based on category
    if (specContainers[selectedCategory]) {
        specContainers[selectedCategory].style.display = 'block';
    }

    // Toggle Manufacturer field visibility
    if (adminManufacturerField) {
        if (selectedCategory === 'PC Case') {
            adminManufacturerField.style.display = 'none';
        } else {
            adminManufacturerField.style.display = 'block';
        }
    }
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