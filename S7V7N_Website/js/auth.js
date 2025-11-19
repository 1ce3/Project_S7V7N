import { showToast } from './utils.js';

export let currentUser = null;

export function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    // Simulating auth for now
    if (email === 'admin@s7v7n.com') {
        currentUser = { email, isAdmin: true };
        showToast('Admin Logged In');
    } else {
        currentUser = { email, isAdmin: false };
        showToast('User Logged In');
    }
    document.dispatchEvent(new CustomEvent('auth-changed')); // Notify other modules
}

export function handleLogout() {
    currentUser = null;
    showToast('Logged Out');
    document.dispatchEvent(new CustomEvent('auth-changed'));
}