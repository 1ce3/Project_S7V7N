import { allProducts, renderProductCard } from '../products.js';

export function getHomeHTML() {
    return `
    <div id="page-home" class="page animate-fade-in">
        <section class="text-center mb-20">
            <h1 class="text-5xl md:text-7xl font-bold tracking-tighter mb-4">S7V7N</h1>
            <p class="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">We deliver the best quality gaming equipment.</p>
        </section>
        
        <section class="mb-20 bg-gray-800 rounded-lg p-8 shadow-xl">
            <h2 class="text-3xl font-bold tracking-tight text-center mb-4">✨ Need Help Choosing?</h2>
            <div class="flex max-w-xl mx-auto">
                <input type="text" id="ai-helper-prompt" class="w-full bg-gray-900 border border-gray-700 rounded-l-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g., 'I play fast FPS games...'">
                <button id="ai-helper-btn" class="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-5 rounded-r-lg transition-colors">Get Recs</button>
            </div>
            <div id="ai-helper-results" class="mt-6 text-gray-300 bg-gray-900 p-6 rounded-lg hidden whitespace-pre-wrap leading-relaxed"></div>
        </section>
        
        <div id="home-featured-container" class="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <!-- Logic will inject items here -->
        </div>
    </div>
    `;
}

export function initHomeLogic() {
    const container = document.getElementById('home-featured-container');
    // Logic to inject products
    if (allProducts.length > 0) {
        container.innerHTML = allProducts.slice(0, 6).map(p => renderProductCard(p)).join('');
    } else {
        container.innerHTML = '<p class="text-gray-400">Loading products...</p>';
    }

    // Logic for AI button
    document.getElementById('ai-helper-btn').addEventListener('click', () => {
        // ... call your AI function from js/ai.js
        alert("AI Feature would run here (connect to js/ai.js)");
    });
}