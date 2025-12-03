// js/ai.js
import { state } from './state.js';
import { showToast, formatCurrency } from './utils.js';
import { GEMINI_API_KEY } from './config.js';

// Helper: Sleep function for retries
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 1. The Core API Call
export async function callGeminiAPI(systemPrompt, userQuery, retries = 3, delay = 1000) {
    if (GEMINI_API_KEY === "AIzaSyA1jX3HuweqrfUAD59_UQOB6mT8xCvUml4") {
        const errorMsg = "AI Feature Error: Please replace 'YOUR_GEMINI_API_KEY' in js/config.js with your actual Google AI Studio API key.";
        console.error(errorMsg);
        showToast(errorMsg, true);
        return `Error: Invalid API Key. Please configure it in js/config.js.`;
    }
    
    const apiKey = GEMINI_API_KEY;
    const apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: {
            // Optional: configure temperature, etc.
            temperature: 0.7,
        }
    };

    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const result = await response.json();
            if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
                return result.candidates[0].content.parts[0].text;
            } else {
                throw new Error('Invalid API response structure');
            }
        } catch (error) {
            if (i === retries - 1) return `Error: ${error.message}`;
            await sleep(delay * Math.pow(2, i));
        }
    }
}

// 2. Build Helper Logic
export async function handleAiBuildHelper() {
    const promptInput = document.getElementById('ai-helper-prompt');
    const btn = document.getElementById('ai-helper-btn');
    const results = document.getElementById('ai-helper-results');

    const userPrompt = promptInput.value;
    if (!userPrompt) return showToast('Please describe your needs first.');

    btn.textContent = 'Thinking...';
    btn.disabled = true;
    results.style.display = 'block';
    results.textContent = 'Asking our AI expert...';

    const productCatalog = state.allProducts.map(p => ({
        id: p.id, name: p.name, category: p.category, price: p.price
    }));

    const systemPrompt = `You are the 'S7V7N AI Build Assistant'. Recommend one PC Case, one Keyboard, and one Mouse from the catalog based on user needs.`;
    const userQuery = `User's Needs: "${userPrompt}"\n\nCatalog:\n${JSON.stringify(productCatalog)}`;

    const recommendations = await callGeminiAPI(systemPrompt, userQuery);

    results.textContent = recommendations;
    btn.textContent = 'Get Recs';
    btn.disabled = false;
}

// 3. Compare Logic
export async function handleAiCompare() {
    const btn = document.getElementById('ai-compare-btn');
    const results = document.getElementById('ai-compare-results');

    if (state.compareList.length === 0) return showToast('Add PCs to compare first.');

    btn.textContent = 'Analyzing...';
    btn.disabled = true;
    results.style.display = 'block';
    results.textContent = 'Asking our AI expert...';
    
    const productsToCompare = state.compareList.map(id => {
        const p = state.allProducts.find(prod => prod.id === id);
        return { name: p.name, price: formatCurrency(p.price), specs: p.specs };
    });

    const systemPrompt = `You are a PC hardware expert. Compare these pre-built PCs and explain real-world performance differences.`;
    const userQuery = `Analyze these PCs:\n${JSON.stringify(productsToCompare)}`;

    const analysis = await callGeminiAPI(systemPrompt, userQuery);

    results.textContent = analysis;
    btn.textContent = 'Generate AI Performance Comparison';
    btn.disabled = false;
}

// 4. Description Generator (Admin)
export async function handleGenerateDescription() {
    const name = document.getElementById('admin-product-name').value;
    const category = document.getElementById('admin-product-category').value;
    const btn = document.getElementById('generate-desc-btn');
    const descBox = document.getElementById('admin-product-description');

    if (!name) return showToast('Enter product name first.');

    btn.textContent = 'Generating...';
    btn.disabled = true;

    const systemPrompt = "Write a concise, exciting product description (2-3 sentences) for a gaming hardware store.";
    const userQuery = `Product: ${name}\nCategory: ${category}`;

    const description = await callGeminiAPI(systemPrompt, userQuery);

    descBox.value = description;
    btn.textContent = '✨ Generate';
    btn.disabled = false;
}