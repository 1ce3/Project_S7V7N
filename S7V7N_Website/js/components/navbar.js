export function getNavbarHTML() {
    return `
    <header class="bg-gray-900 sticky top-0 z-40 border-b border-gray-800">
        <nav class="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-20">
            <a href="#" data-page="home" class="nav-link text-3xl font-bold tracking-tight text-white">S7V7N</a>
            
            <div class="hidden md:flex items-center space-x-6">
                <a href="#" data-page="category" data-ctx="All" class="nav-link text-gray-300 hover:text-white transition-colors">Products</a>
                <a href="#" data-page="category" data-ctx="PC Case" class="nav-link text-gray-300 hover:text-white transition-colors">PC Cases</a>
                <a href="#" data-page="category" data-ctx="Keyboard" class="nav-link text-gray-300 hover:text-white transition-colors">Keyboards</a>
                <a href="#" data-page="category" data-ctx="Mice" class="nav-link text-gray-300 hover:text-white transition-colors">Mice</a>
            </div>
            
            <div class="flex items-center space-x-4">
                <a href="#" id="login-link" data-page="login" class="nav-link text-gray-300 hover:text-white transition-colors">Log In</a>
                <a href="#" id="admin-link" data-page="admin" class="nav-link text-sm text-gray-400 hover:text-indigo-400 transition-colors" style="display: none;">Admin</a>
                <button id="logout-button" class="text-gray-300 hover:text-white transition-colors" style="display: none;">Log Out</button>
                
                <button data-page="compare" class="nav-link relative text-gray-300 hover:text-white transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    <span id="compare-count-badge" class="absolute -top-2 -right-2 bg-indigo-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">0</span>
                </button>
                
                <button data-page="cart" class="nav-link relative text-gray-300 hover:text-white transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    <span id="cart-count-badge" class="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">0</span>
                </button>
            </div>
        </nav>
    </header>
    `;
}