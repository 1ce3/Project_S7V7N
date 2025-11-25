// js/auth.js
import { state } from './state.js';
import { showToast } from './ui.js';

/**
 * Checks localStorage for a logged-in user on page load
 * and updates the state. This is crucial for a multi-page app.
 */
export function checkAuthState() {
    try {
        const userString = localStorage.getItem('s7v7n_user');
        if (userString) {
            state.currentUser = JSON.parse(userString);
        }
    } catch (e) {
        console.error("Failed to parse user from localStorage", e);
    }
}

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
    let user;
    
    if (email === 'admin@s7v7n.com') {
        user = { id: 1, email: 'admin@s7v7n.com', isAdmin: true };
        state.currentUser = user;
        showToast('Admin login successful!');
    } else {
        user = { id: Date.now(), email: email, isAdmin: false };
        state.currentUser = user;
        showToast('User login successful!');
    }

    // Save the user session to localStorage so it persists across pages
    localStorage.setItem('s7v7n_user', JSON.stringify(user));

    // Update the navigation immediately before redirecting
    updateNav();

    window.location.href = 'index.html'; // Redirect to home
}

export function handleRegister(event) {
    event.preventDefault();
    const user = { id: Date.now(), email: document.getElementById('register-email').value, isAdmin: false };
    state.currentUser = user;
    localStorage.setItem('s7v7n_user', JSON.stringify(user));
    showToast('Registration successful!');
    window.location.href = 'index.html'; // Redirect to home
}

export function handleLogout() {
    state.currentUser = null;
    localStorage.removeItem('s7v7n_user');
    showToast('Logged out.');
    updateNav();
    window.location.href = 'index.html'; // Redirect to home
}