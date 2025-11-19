import { allProducts } from './products.js';
// Paste the callGeminiAPI function from previous app.js here
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function callGeminiAPI(systemPrompt, userQuery, retries = 3, delay = 1000) {
    const apiKey = ""; // Handled by environment
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: {
            parts: [{ text: systemPrompt }]
        },
    };

    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
                return result.candidates[0].content.parts[0].text;
            } else {
                throw new Error('Invalid API response structure');
            }
        } catch (error) {
            if (i === retries - 1) {
                console.error('Gemini API call failed after all retries:', error);
                return `Error: Could not get a response. ${error.message}`;
            }
            await sleep(delay * Math.pow(2, i));
        }
    }
}

async function handleGenerateDescription() {
    const productName = adminProductName.value;
    const productCategory = adminProductCategory.value;

    if (!productName) {
        showToast('Please enter a product name first.');
        return;
    }

    generateDescBtn.textContent = 'Generating...';
    generateDescBtn.disabled = true;

    const systemPrompt = "You are an expert e-commerce copywriter for 'S7V7N', a high-end gaming hardware store. Write a concise, exciting, and professional product description (2-3 sentences) for the following product. Focus on appealing to gamers, creators, and tech enthusiasts.";
    const userQuery = `Product Name: ${productName}\nCategory: ${productCategory}`;

    const description = await callGeminiAPI(systemPrompt, userQuery);

    adminProductDescription.value = description;
    
    generateDescBtn.textContent = '✨ Generate';
    generateDescBtn.disabled = false;
}

async function handleAiBuildHelper() {
    const userPrompt = aiHelperPrompt.value;
    if (!userPrompt) {
        showToast('Please describe your needs first.');
        return;
    }

    aiHelperBtn.textContent = 'Thinking...';
    aiHelperBtn.disabled = true;
    aiHelperResults.style.display = 'block';
    aiHelperResults.textContent = 'Asking our AI expert...';

    const productCatalog = allProducts.map(p => ({
        id: p.id, name: p.name, category: p.category, price: p.price
    }));

    const systemPrompt = `You are the 'S7V7N AI Build Assistant'. A user will describe their needs, and you must recommend one PC Case, one Keyboard, and one Mouse from the provided product catalog.

Rules:
1.  ONLY recommend products from the JSON 'Product Catalog' provided.
2.  Format your response clearly (e.g., using bold titles for each product).
3.  For each recommendation, briefly explain *why* it fits the user's needs.
4.  If the catalog is missing a category, state that.
5.  Be friendly, helpful, and concise.`;
    
    const userQuery = `User's Needs: "${userPrompt}"\n\nProduct Catalog:\n${JSON.stringify(productCatalog, null, 2)}`;

    const recommendations = await callGeminiAPI(systemPrompt, userQuery);

    aiHelperResults.textContent = recommendations;
    
    aiHelperBtn.textContent = 'Get Recs';
    aiHelperBtn.disabled = false;
}

async function handleAiCompare() {
    if (compareList.length === 0) {
        showToast('Please add some PCs to compare first.');
        return;
    }

    aiCompareBtn.textContent = 'Analyzing...';
    aiCompareBtn.disabled = true;
    aiCompareResults.style.display = 'block';
    aiCompareResults.textContent = 'Asking our AI expert to analyze the builds...';
    
    const productsToCompare = compareList.map(id => {
        const p = allProducts.find(prod => prod.id === id);
        return { name: p.name, price: formatCurrency(p.price), specs: p.specs };
    });

    const systemPrompt = `You are a PC hardware expert and benchmark analyst for 'S7V7N'. A user is comparing several pre-built PCs. Analyze their specifications and provide a concise, expert comparison.

Rules:
1.  Start with a high-level summary.
2.  Break down the comparison by key components (CPU, GPU, RAM).
3.  Explain the *real-world performance differences* for gaming and productivity (e.g., "PC 1 will be significantly better for 1440p gaming due to the RTX 4070, while PC 2 is a great budget 1080p machine.").
4.  Conclude with a "Best For" recommendation for each PC (e.g., Best for Competitive FPS, Best for Streaming & 1440p Gaming, Best for 4K Video Editing).
5.  Use a helpful, comparative tone. Be objective. Format your response with paragraphs and bold headings for readability.`;
    
    const userQuery = `Please analyze and compare these PCs:\n${JSON.stringify(productsToCompare, null, 2)}`;

    const analysis = await callGeminiAPI(systemPrompt, userQuery);

    aiCompareResults.textContent = analysis;
    
    aiCompareBtn.textContent = 'Generate AI Performance Comparison';
    aiCompareBtn.disabled = false;
}
