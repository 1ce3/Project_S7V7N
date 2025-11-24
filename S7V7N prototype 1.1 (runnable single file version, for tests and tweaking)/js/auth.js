// js/auth.js
import { auth, db, usersCollection } from './config.js';
import { state } from './state.js';
import { showToast } from './utils.js';
import { showPage } from './main.js';

/**
 * Initializes the authentication listener.
 */
export function initAuth() {
    auth.onAuthStateChanged(async user => {
        if (user) {
            // User is signed in.
            const userDoc = await usersCollection.doc(user.uid).get();
            if (userDoc.exists) {
                state.currentUser = {
                    uid: user.uid,
                    email: user.email,
                    ...userDoc.data()
                };
            } else {
                // This case might happen if a user is created in Auth but not in Firestore.
                // We can create it here.
                const newUser = {
                    email: user.email,
                    isAdmin: false,
                };
                await usersCollection.doc(user.uid).set(newUser);
                state.currentUser = { uid: user.uid, ...newUser };
            }
        } else {
            // User is signed out.
            state.currentUser = null;
        }
        updateNav();
        // If the user is on the admin page and they are not an admin, redirect them.
        if (state.currentPage === 'page-admin' && (!state.currentUser || !state.currentUser.isAdmin)) {
            showPage('page-home');
        }
    });
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

export async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    try {
        await auth.signInWithEmailAndPassword(email, password);
        showToast('Login successful!');
        showPage('page-home');
    } catch (error) {
        showToast(`Error: ${error.message}`, true);
        console.error('Login failed:', error);
    }
}

export async function handleRegister(event) {
    event.preventDefault();
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const newUser = {
            email: email,
            isAdmin: false
        };
        await usersCollection.doc(userCredential.user.uid).set(newUser);
        showToast('Registration successful!');
        showPage('page-home');
    } catch (error) {
        showToast(`Error: ${error.message}`, true);
        console.error('Registration failed:', error);
    }
}

export function handleLogout() {
    auth.signOut();
    showToast('Logged out.');
    showPage('page-home');
}