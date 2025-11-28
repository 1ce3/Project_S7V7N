// js/admin.js
import { state } from './state.js';
import { productsCollection, outletProductsCollection, componentsCollection, usersCollection, ordersCollection } from './config.js';
import { showToast, formatCurrency } from './utils.js';
import { loadProductsFromFirebase, loadOutletProductsFromFirebase, loadComponentsFromFirebase } from './loader.js';
import { loadHomePage } from './shop.js';

// 1. Render the Admin Page
export async function renderAdminPage() {
    const viewMode = document.getElementById('admin-view-mode').value; // 'products', 'outlet', 'components'
    
    // Toggle Containers
    const productsTable = document.getElementById('admin-products-table-container');
    const componentsTable = document.getElementById('admin-components-table-container');
    const outletPicker = document.getElementById('admin-outlet-picker-container');
    
    if (viewMode === 'components') {
        productsTable.style.display = 'none';
        componentsTable.style.display = 'block';
        if(outletPicker) outletPicker.classList.add('hidden');
        renderComponentsList();
        document.getElementById('admin-product-count').textContent = state.components.length;
        document.getElementById('admin-form-title').textContent = 'Add New Component';
    } else {
        productsTable.style.display = 'block';
        componentsTable.style.display = 'none';
        
        if (viewMode === 'outlet') {
            if(outletPicker) outletPicker.classList.remove('hidden');
            populateOutletPicker();
        } else {
            if(outletPicker) outletPicker.classList.add('hidden');
        }

        renderProductList(viewMode === 'outlet');
        const count = viewMode === 'outlet' ? state.outletProducts.length : state.allProducts.length;
        document.getElementById('admin-product-count').textContent = count;
        document.getElementById('admin-form-title').textContent = 'Add New Product';
    }

    await renderCustomerList();
    await renderOrderList();
    
    populateComponentSelects();
    toggleSpecFields(); 
}

function populateOutletPicker() {
    const select = document.getElementById('admin-outlet-component-select');
    if (!select) return;
    
    let html = '<option value="">-- Choose a component --</option>';
    state.components.forEach(c => {
        html += `<option value="${c.id}">${c.type}: ${c.name}</option>`;
    });
    select.innerHTML = html;
}

// Render Products or Outlet
function renderProductList(isOutlet) {
    const list = document.getElementById('admin-product-list');
    list.innerHTML = '';
    const products = isOutlet ? state.outletProducts : state.allProducts;
    
    // Filter by Search Term
    const searchTerm = document.getElementById('admin-search-bar').value.toLowerCase();
    const filtered = products.filter(p => p.name.toLowerCase().includes(searchTerm));
    
    const sorted = [...filtered].sort((a,b) => a.name.localeCompare(b.name));

    if (sorted.length === 0) {
        list.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">No products found.</td></tr>';
        return;
    }

    sorted.forEach(p => {
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
}

// Render Components List
function renderComponentsList() {
    const list = document.getElementById('admin-component-list');
    list.innerHTML = '';
    
    // Filter by Search Term
    const searchTerm = document.getElementById('admin-search-bar').value.toLowerCase();
    const filtered = state.components.filter(c => c.name.toLowerCase().includes(searchTerm));
    
    const sorted = [...filtered].sort((a, b) => {
        if (a.type !== b.type) return a.type.localeCompare(b.type);
        return a.name.localeCompare(b.name);
    });

    if (sorted.length === 0) {
        list.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">No components found.</td></tr>';
        return;
    }

    sorted.forEach(c => {
        list.innerHTML += `
            <tr class="hover:bg-gray-700">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-semibold">${c.type || 'N/A'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-white">${c.name}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${formatCurrency(c.price || 0)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${c.stock || 0}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-indigo-400 font-bold">Lvl ${c.level || 1}</td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onclick="editComponent('${c.id}')" class="text-indigo-400 hover:text-indigo-300">Edit</button>
                    <button onclick="deleteComponent('${c.id}')" class="text-red-500 hover:text-red-400 ml-4">Delete</button>
                </td>
            </tr>
        `;
    });
}

// 2. Populate Component Dropdowns
function populateComponentSelects() {
    const map = {
        'admin-spec-cpu': 'CPU',
        'admin-spec-gpu': 'GPU',
        'admin-spec-ram': 'RAM',
        'admin-spec-storage': 'Storage',
        'admin-spec-mainboard': 'Mainboard',
        'admin-spec-psu': 'PSU',
        'admin-spec-cooler': 'Cooler',
        'admin-spec-case': 'Case'
    };

    for (const [id, type] of Object.entries(map)) {
        const select = document.getElementById(id);
        if (!select) continue;
        
        const currentVal = select.value;
        const items = state.components.filter(c => c.type && c.type.toLowerCase() === type.toLowerCase());
        
        let html = `<option value="">Select ${type}...</option>`;
        items.forEach(item => {
            html += `<option value="${item.name}" data-level="${item.level || 1}">${item.name} (Lvl ${item.level || 1})</option>`;
        });
        
        select.innerHTML = html;
        if (currentVal) select.value = currentVal;
    }
}

// 3. Handle Form Submit
export async function handleProductFormSubmit(e) {
    e.preventDefault();
    
    const viewMode = document.getElementById('admin-view-mode').value;
    const category = document.getElementById('admin-product-category').value;
    const name = document.getElementById('admin-product-name').value;
    const price = parseInt(document.getElementById('admin-product-price').value) || 0;
    const stock = parseInt(document.getElementById('admin-product-stock').value) || 0;
    const image = document.getElementById('admin-product-image').value;
    const description = document.getElementById('admin-product-description').value;

    try {
        if (viewMode === 'components') {
            const level = parseInt(document.getElementById('admin-component-level').value) || 1;
            const compData = {
                name,
                type: category,
                price,
                stock,
                level,
                image,
                description
            };
            
            if (state.currentEditId) {
                await componentsCollection.doc(state.currentEditId).update(compData);
                showToast('Component updated successfully!');
            } else {
                await componentsCollection.add(compData);
                showToast('Component added successfully!');
            }
            
            resetAdminForm();
            await loadComponentsFromFirebase();
            renderAdminPage();
            
        } else {
            const isOutlet = (viewMode === 'outlet');
            const collection = isOutlet ? outletProductsCollection : productsCollection;
            const loadFunction = isOutlet ? loadOutletProductsFromFirebase : loadProductsFromFirebase;

            let oldProduct = null;
            if (state.currentEditId && !isOutlet) {
                oldProduct = state.allProducts.find(p => p.id === state.currentEditId);
            }
            
            const data = {
                name, price, stock, category, image, description,
                manufacturer: document.getElementById('admin-product-manufacturer')?.value || null,
            };

            let specsObj = {};
            let levelsObj = null;

            if (data.category === 'PC Case') {
                const getVal = (id) => document.getElementById(id).value;
                const getLvl = (id) => {
                    const sel = document.getElementById(id);
                    const opt = sel.options[sel.selectedIndex];
                    return opt ? parseInt(opt.getAttribute('data-level') || 1) : 1;
                };

                specsObj = {
                    cpu: getVal('admin-spec-cpu'),
                    gpu: getVal('admin-spec-gpu'),
                    ram: getVal('admin-spec-ram'),
                    storage: getVal('admin-spec-storage'),
                    mainboard: getVal('admin-spec-mainboard'),
                    psu: getVal('admin-spec-psu'),
                    cooler: getVal('admin-spec-cooler'),
                    case: getVal('admin-spec-case'),
                };

                levelsObj = {
                    cpu: getLvl('admin-spec-cpu'),
                    gpu: getLvl('admin-spec-gpu'),
                    ram: getLvl('admin-spec-ram'),
                    storage: getLvl('admin-spec-storage'),
                };

                if (!isOutlet) {
                    await updateComponentStocks(oldProduct, data, specsObj);
                }
            } else {
                switch (data.category) {
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
            }

            const isSpecsEmpty = Object.values(specsObj).every(val => val === '' || val === false);
            data.specs = isSpecsEmpty ? null : specsObj;
            data.specLevels = levelsObj;

            if (state.currentEditId) {
                await collection.doc(state.currentEditId).update(data);
                showToast('Product updated successfully!');
            } else {
                await collection.add(data);
                showToast('Product added successfully!');
            }
            
            resetAdminForm();
            await loadFunction();
            await loadComponentsFromFirebase();
            renderAdminPage();
            loadHomePage(); 
        }
    } catch (err) {
        showToast(`Error: ${err.message}`, true);
        console.error(err);
    }
}

async function updateComponentStocks(oldProduct, newProduct, newSpecs) {
    const oldStock = oldProduct ? (oldProduct.stock || 0) : 0;
    const oldSpecs = oldProduct ? (oldProduct.specs || {}) : {};
    const newStock = newProduct.stock;

    const types = ['cpu', 'gpu', 'ram', 'storage', 'mainboard', 'psu', 'cooler', 'case'];
    
    for (const type of types) {
        const oldName = oldSpecs[type];
        const newName = newSpecs[type];
        
        if (oldName === newName && newName) {
            const diff = newStock - oldStock; 
            if (diff !== 0) {
                await adjustComponentStock(newName, -diff);
            }
        }
        else {
            if (oldName) {
                await adjustComponentStock(oldName, oldStock);
            }
            if (newName) {
                await adjustComponentStock(newName, -newStock);
            }
        }
    }
}

async function adjustComponentStock(componentName, amount) {
    const comp = state.components.find(c => c.name === componentName);
    if (!comp) return;

    const newStock = (comp.stock || 0) + amount;
    
    await componentsCollection.doc(comp.id).update({ stock: newStock });
    comp.stock = newStock;
}

export function editProduct(id) {
    const viewMode = document.getElementById('admin-view-mode').value;
    if (viewMode === 'components') {
        editComponent(id);
        return;
    }
    
    const products = (viewMode === 'outlet') ? state.outletProducts : state.allProducts;
    const p = products.find(x => x.id === id);
    if (!p) return;

    state.currentEditId = id;
    document.getElementById('admin-form-title').textContent = 'Edit Product';
    
    document.getElementById('admin-product-name').value = p.name;
    document.getElementById('admin-product-price').value = p.price;
    document.getElementById('admin-product-stock').value = p.stock || 0;
    document.getElementById('admin-product-category').value = p.category;
    document.getElementById('admin-product-image').value = p.image || '';
    document.getElementById('admin-product-description').value = p.description || '';
    document.getElementById('admin-product-manufacturer').value = p.manufacturer || '';

    const s = p.specs || {};
    
    if (p.category === 'PC Case') {
        populateComponentSelects();
        document.getElementById('admin-spec-cpu').value = s.cpu || '';
        document.getElementById('admin-spec-gpu').value = s.gpu || '';
        document.getElementById('admin-spec-ram').value = s.ram || '';
        document.getElementById('admin-spec-storage').value = s.storage || '';
        document.getElementById('admin-spec-mainboard').value = s.mainboard || '';
        document.getElementById('admin-spec-psu').value = s.psu || '';
        document.getElementById('admin-spec-cooler').value = s.cooler || '';
        document.getElementById('admin-spec-case').value = s.case || '';
    } else {
        switch (p.category) {
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
        }
    }

    toggleSpecFields();
    window.scrollTo(0, 0);
}

export function editComponent(id) {
    const c = state.components.find(x => x.id === id);
    if (!c) return;

    state.currentEditId = id;
    document.getElementById('admin-form-title').textContent = 'Edit Component';
    document.getElementById('admin-view-mode').value = 'components';
    
    document.getElementById('admin-product-name').value = c.name;
    document.getElementById('admin-product-price').value = c.price || 0;
    document.getElementById('admin-product-stock').value = c.stock || 0;
    document.getElementById('admin-product-category').value = c.type;
    document.getElementById('admin-product-image').value = c.image || '';
    document.getElementById('admin-product-description').value = c.description || '';
    document.getElementById('admin-component-level').value = c.level || 1;

    toggleSpecFields();
    window.scrollTo(0, 0);
}

export async function deleteProduct(id) {
    if(!confirm("Are you sure you want to delete this product?")) return;

    const viewMode = document.getElementById('admin-view-mode').value;
    const isOutlet = (viewMode === 'outlet');
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

export async function deleteComponent(id) {
    if(!confirm("Are you sure you want to delete this component?")) return;
    try {
        await componentsCollection.doc(id).delete();
        showToast("Component deleted.");
        await loadComponentsFromFirebase();
        renderAdminPage();
    } catch(e) {
        showToast("Error deleting: " + e.message, true);
    }
}

export function resetAdminForm() {
    document.getElementById('admin-product-form').reset();
    state.currentEditId = null;
    
    const viewMode = document.getElementById('admin-view-mode').value;
    document.getElementById('admin-form-title').textContent = (viewMode === 'components') ? 'Add New Component' : 'Add New Product';
    
    const picker = document.getElementById('admin-outlet-component-select');
    if(picker) picker.value = "";
    
    toggleSpecFields();
}

function toggleSpecFields() {
    const selectedCategory = document.getElementById('admin-product-category').value;
    const viewMode = document.getElementById('admin-view-mode').value;
    const isComponentMode = (viewMode === 'components');

    const specContainers = {
        'PC Case': document.getElementById('specs-pc-case'),
        'Mice': document.getElementById('specs-mice'),
        'Keyboard': document.getElementById('specs-keyboard'),
        'Storage': document.getElementById('specs-storage'),
        'RAM': document.getElementById('specs-ram'),
        'Graphics Card': document.getElementById('specs-graphics-card'),
    };
    const adminManufacturerField = document.getElementById('admin-manufacturer-field');
    const componentLevelField = document.getElementById('admin-component-details');

    Object.values(specContainers).forEach(container => {
        if (container) container.style.display = 'none';
    });

    const catSelect = document.getElementById('admin-product-category');
    
    if (isComponentMode) {
        if (componentLevelField) componentLevelField.style.display = 'block';
        if (adminManufacturerField) adminManufacturerField.style.display = 'none';
        
        const compTypes = ['CPU', 'GPU', 'RAM', 'Storage', 'Mainboard', 'PSU', 'Cooler', 'Case'];
        if (catSelect.options[0].value !== 'CPU') {
            catSelect.innerHTML = compTypes.map(t => `<option>${t}</option>`).join('');
        }
        
    } else {
        if (componentLevelField) componentLevelField.style.display = 'none';
        
        const prodCats = ['PC Case', 'Keyboard', 'Mice', 'Storage', 'RAM', 'Graphics Card', 'Other'];
        if (catSelect.options[0].value === 'CPU') {
             catSelect.innerHTML = prodCats.map(t => `<option>${t}</option>`).join('');
             catSelect.value = 'PC Case';
        }

        const currentCat = catSelect.value;
        if (specContainers[currentCat]) {
            specContainers[currentCat].style.display = 'block';
            if (currentCat === 'PC Case') populateComponentSelects();
        }
        
        if (adminManufacturerField) {
            adminManufacturerField.style.display = (currentCat === 'PC Case') ? 'none' : 'block';
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
            .filter(c => !c.isAdmin)
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
    if (!confirm("Are you sure you want to delete this customer?")) return;
    try {
        await usersCollection.doc(userId).delete();
        showToast("Customer deleted successfully.");
        await renderCustomerList();
    } catch (error) {
        console.error("Error deleting customer:", error);
        showToast("Error deleting customer: " + error.message, true);
    }
}

// View Toggle Listeners
document.addEventListener('DOMContentLoaded', () => {
    const catSelect = document.getElementById('admin-product-category');
    if (catSelect) catSelect.addEventListener('change', toggleSpecFields);
    
    const btnProducts = document.getElementById('admin-view-products');
    const btnOutlet = document.getElementById('admin-view-outlet');
    const btnComponents = document.getElementById('admin-view-components');
    const viewInput = document.getElementById('admin-view-mode');

    const updateTabs = (mode) => {
        viewInput.value = mode;
        
        [btnProducts, btnOutlet, btnComponents].forEach(btn => {
            if(btn) {
                btn.classList.remove('bg-indigo-600', 'text-white');
                btn.classList.add('text-gray-400');
            }
        });
        
        let activeBtn;
        if (mode === 'products') activeBtn = btnProducts;
        if (mode === 'outlet') activeBtn = btnOutlet;
        if (mode === 'components') activeBtn = btnComponents;
        
        if(activeBtn) {
            activeBtn.classList.remove('text-gray-400');
            activeBtn.classList.add('bg-indigo-600', 'text-white');
        }
        
        resetAdminForm();
        renderAdminPage();
    };

    if (btnProducts) btnProducts.addEventListener('click', () => updateTabs('products'));
    if (btnOutlet) btnOutlet.addEventListener('click', () => updateTabs('outlet'));
    if (btnComponents) btnComponents.addEventListener('click', () => updateTabs('components'));
    
    const outletPicker = document.getElementById('admin-outlet-component-select');
    if (outletPicker) {
        outletPicker.addEventListener('change', (e) => {
            const id = e.target.value;
            if (!id) return;
            const c = state.components.find(x => x.id === id);
            if (c) {
                document.getElementById('admin-product-name').value = c.name;
                if (c.price) document.getElementById('admin-product-price').value = c.price;
                if (c.image) document.getElementById('admin-product-image').value = c.image;
                
                const catMap = {
                    'GPU': 'Graphics Card',
                    'RAM': 'RAM',
                    'Storage': 'Storage',
                    'Keyboard': 'Keyboard',
                    'Mouse': 'Mice'
                };
                const mappedCat = catMap[c.type] || 'Other';
                document.getElementById('admin-product-category').value = mappedCat;
                toggleSpecFields();
            }
        });
    }
    
    window.deleteComponent = deleteComponent;
    window.editComponent = editComponent;

    toggleSpecFields();
});