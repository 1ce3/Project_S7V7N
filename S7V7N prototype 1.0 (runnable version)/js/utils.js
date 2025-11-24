// js/utils.js
export function formatCurrency(amount) {
    const number = Number(amount);
    if (isNaN(number)) return "Invalid Price";
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(number);
}

export function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.backgroundColor = isError ? '#ef4444' : '#22c55e';
    toast.classList.add('toast-show');
    setTimeout(() => toast.classList.remove('toast-show'), 3000);
}

export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}