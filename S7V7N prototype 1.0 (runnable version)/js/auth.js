// js/auth.js
import { state } from './state.js';
import { showToast } from './utils.js';
import { showPage } from './main.js'; // Circular dependency handled by separating router if needed, but this works in modules usually if careful.

export function updateNav() {
    const loginLink = document.getElementById('login-link');
    const adminLink = document.getElementById('admin-link');
    const logoutButton = document.getElementById('logout-button');

    if (state.currentUser) {
        loginLink.style.display = 'none';
        logoutButton.style.display = 'block';
        adminLink.style.display = state.currentUser.isAdmin ? 'block' : 'none';
    } else {
        loginLink.style.display = 'block';
        logoutButton.style.display = 'none';
        adminLink.style.display = 'none';
    }
}

export function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('login-email').value;
    
    if (email === 'admin@s7v7n.com') {
        state.currentUser = { id: 1, email: 'admin@s7v7n.com', isAdmin: true };
        showToast('Admin login successful!');
    } else {
        state.currentUser = { id: 2, email: email, isAdmin: false };
        showToast('User login successful!');
    }
    updateNav();
    showPage('page-home');
}

export function handleRegister(event) {
    event.preventDefault();
    state.currentUser = { id: Math.floor(Math.random() * 1000), email: document.getElementById('register-email').value, isAdmin: false };
    showToast('Registration successful!');
    updateNav();
    showPage('page-home');
}

export function handleLogout() {
    state.currentUser = null;
    showToast('Logged out.');
    updateNav();
    showPage('page-home');
}