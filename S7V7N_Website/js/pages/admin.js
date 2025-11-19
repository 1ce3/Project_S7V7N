import { handleProductSave } from '../admin.js'; // Import logic
import { allProducts } from '../products.js';
import { formatCurrency } from '../utils.js';

export function getAdminHTML() {
    return `
    <div id="page-admin" class="page animate-fade-in">
        <h1 class="text-4xl font-bold mb-8">Admin Control Panel</h1>
        <div class="flex flex-col lg:flex-row gap-8">
            <div class="lg:w-1/3 bg-gray-800 p-6 rounded-lg shadow-lg">
                <form id="admin-product-form" class="space-y-4">
                    <input type="text" id="admin-product-name" placeholder="Product Name" class="w-full bg-gray-900 border border-gray-700 rounded p-2" required>
                    <input type="number" id="admin-product-price" placeholder="Price" class="w-full bg-gray-900 border border-gray-700 rounded p-2" required>
                    <input type="number" id="admin-product-stock" placeholder="Stock Qty" class="w-full bg-gray-900 border border-gray-700 rounded p-2" required>
                    <select id="admin-product-category" class="w-full bg-gray-900 border border-gray-700 rounded p-2">
                        <option>PC Case</option><option>Keyboard</option><option>Mice</option>
                    </select>
                    <input type="text" id="admin-product-image" placeholder="Image URL" class="w-full bg-gray-900 border border-gray-700 rounded p-2">
                    <textarea id="admin-product-description" rows="3" placeholder="Description" class="w-full bg-gray-900 border border-gray-700 rounded p-2"></textarea>
                    
                    <button type="submit" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded">Save Product</button>
                </form>
            </div>
            <div class="lg:w-2/3 bg-gray-800 rounded-lg p-4">
                <table class="w-full text-left text-gray-300">
                    <thead><tr><th class="p-2">Name</th><th class="p-2">Price</th><th class="p-2">Stock</th></tr></thead>
                    <tbody id="admin-product-list"></tbody>
                </table>
            </div>
        </div>
    </div>
    `;
}

export function initAdminLogic() {
    // 1. Attach Form Listener
    document.getElementById('admin-product-form').addEventListener('submit', handleProductSave);

    // 2. Render Table
    const tbody = document.getElementById('admin-product-list');
    tbody.innerHTML = allProducts.map(p => `
        <tr class="border-b border-gray-700">
            <td class="p-2">${p.name}</td>
            <td class="p-2">${formatCurrency(p.price)}</td>
            <td class="p-2">${p.stock}</td>
        </tr>
    `).join('');
}