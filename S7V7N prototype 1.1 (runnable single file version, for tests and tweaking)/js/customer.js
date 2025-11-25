// js/customer.js
import { db, customersCollection } from './config.js';
import { state } from './state.js';

async function deleteCustomer(id) {
    if (confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
        try {
            await customersCollection.doc(id).delete();
            console.log("Customer deleted:", id);
            fetchCustomers(); // Refresh the list
        } catch (error) {
            console.error("Error deleting customer:", error);
        }
    }
}

export async function fetchCustomers() {
    try {
        const snapshot = await customersCollection.get();
        state.customers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log("Customers fetched:", state.customers);
        renderCustomersAdminPage();
    } catch (error) {
        console.error("Error fetching customers:", error);
    }
}

export function renderCustomersAdminPage() {
    const customerList = document.getElementById('admin-customer-list');
    if (!customerList) return;

    customerList.innerHTML = state.customers.map(customer => `
        <tr class="hover:bg-gray-700">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">${customer.email}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${customer.uid}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${customer.registeredAt ? new Date(customer.registeredAt.seconds * 1000).toLocaleDateString() : 'N/A'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button data-id="${customer.id}" class="text-red-500 hover:text-red-700 delete-customer-btn">Delete</button>
            </td>
        </tr>
    `).join('');
}

export function initCustomerAdmin() {
    const productsTab = document.getElementById('admin-tab-products');
    const customersTab = document.getElementById('admin-tab-customers');
    const productsSection = document.getElementById('admin-products-section');
    const customersSection = document.getElementById('admin-customers-section');
    const customerList = document.getElementById('admin-customer-list');

    if (customerList) {
        customerList.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-customer-btn')) {
                const customerId = e.target.dataset.id;
                deleteCustomer(customerId);
            }
        });
    }

    if (productsTab && customersTab && productsSection && customersSection) {
        productsTab.addEventListener('click', (e) => {
            e.preventDefault();
            productsTab.classList.add('border-indigo-500', 'text-indigo-400');
            productsTab.classList.remove('border-transparent', 'text-gray-400', 'hover:text-gray-200', 'hover:border-gray-500');
            customersTab.classList.add('border-transparent', 'text-gray-400', 'hover:text-gray-200', 'hover:border-gray-500');
            customersTab.classList.remove('border-indigo-500', 'text-indigo-400');

            productsSection.style.display = 'block';
            customersSection.style.display = 'none';
        });

        customersTab.addEventListener('click', (e) => {
            e.preventDefault();
            customersTab.classList.add('border-indigo-500', 'text-indigo-400');
            customersTab.classList.remove('border-transparent', 'text-gray-400', 'hover:text-gray-200', 'hover:border-gray-500');
            productsTab.classList.add('border-transparent', 'text-gray-400', 'hover:text-gray-200', 'hover:border-gray-500');
            productsTab.classList.remove('border-indigo-500', 'text-indigo-400');

            productsSection.style.display = 'none';
            customersSection.style.display = 'block';
            fetchCustomers();
        });
    }
}

document.addEventListener('DOMContentLoaded', initCustomerAdmin);
