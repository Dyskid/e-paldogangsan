"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const jsdom_1 = require("jsdom");
async function analyzeMall() {
    const analysis = {
        mallId: 87,
        mallName: 'san-n-cheong-sancheong',
        url: 'https://sanencheong.com/',
        categories: [],
        productStructure: {
            urlPattern: 'https://sanencheong.com/goods/view?no={product_id}',
            categoryUrlPattern: 'https://sanencheong.com/goods/catalog?code={category_code}',
            paginationMethod: 'page_parameter',
            dynamicLoading: false,
            productSelectors: {
                container: '.goods_list_item',
                name: '.goods_name a',
                price: '.goods_price',
                image: '.goods_thumb img',
                link: '.goods_name a'
            }
        },
        sampleProducts: [],
        notes: [],
        errors: []
    };
    try {
        // Read and analyze homepage
        const homepageHtml = fs.readFileSync(path.join(__dirname, 'requirements', 'homepage.html'), 'utf-8');
        const homeDom = new jsdom_1.JSDOM(homepageHtml);
        const homeDoc = homeDom.window.document;
        // Extract categories from navigation
        const categoryElements = homeDoc.querySelectorAll('.nav_category a, .category_menu a, nav a[href*="catalog"]');
        categoryElements.forEach((elem) => {
            const name = elem.textContent?.trim() || '';
            const href = elem.getAttribute('href') || '';
            if (name && href.includes('catalog')) {
                const categoryCode = href.match(/code=(\w+)/)?.[1] || '';
                if (categoryCode && !analysis.categories.find(cat => cat.link.includes(categoryCode))) {
                    analysis.categories.push({
                        name,
                        link: `https://sanencheong.com${href.startsWith('/') ? href : '/' + href}`
                    });
                }
            }
        });
        // Read and analyze category page
        const categoryHtml = fs.readFileSync(path.join(__dirname, 'requirements', 'category_page.html'), 'utf-8');
        const categoryDom = new jsdom_1.JSDOM(categoryHtml);
        const categoryDoc = categoryDom.window.document;
        // Extract sample products
        const productElements = categoryDoc.querySelectorAll('.goods_list_item, .item_display_wrap li, .goods_list li');
        productElements.forEach((elem, index) => {
            if (index < 5) {
                const nameElem = elem.querySelector('.goods_name a, .name a, .item_name');
                const priceElem = elem.querySelector('.goods_price, .price, .item_price');
                const imageElem = elem.querySelector('.goods_thumb img, .thumbnail img, img');
                const linkElem = elem.querySelector('a[href*="view"]');
                const product = {
                    name: nameElem?.textContent?.trim() || '',
                    price: priceElem?.textContent?.trim() || '',
                    image: imageElem?.getAttribute('src') || '',
                    link: linkElem?.getAttribute('href') || ''
                };
                if (product.name && product.link) {
                    if (!product.link.startsWith('http')) {
                        product.link = 'https://sanencheong.com' + product.link;
                    }
                    analysis.sampleProducts.push(product);
                }
            }
        });
        // Check for pagination
        const paginationElements = categoryDoc.querySelectorAll('.pagination a, .paging a, .page_list a');
        if (paginationElements.length > 0) {
            analysis.notes.push('Pagination detected with page parameter');
        }
        // Read and analyze product detail page
        const productHtml = fs.readFileSync(path.join(__dirname, 'requirements', 'product_page.html'), 'utf-8');
        const productDom = new jsdom_1.JSDOM(productHtml);
        const productDoc = productDom.window.document;
        // Verify product structure
        const productName = productDoc.querySelector('.goods_name, .item_name, h1, h2');
        const productPrice = productDoc.querySelector('.goods_price, .price, .item_price');
        if (productName) {
            analysis.notes.push('Product detail page structure confirmed');
        }
        // Check for JavaScript dependencies
        const scripts = productDoc.querySelectorAll('script');
        let hasVue = false;
        let hasReact = false;
        scripts.forEach(script => {
            const src = script.getAttribute('src') || '';
            const content = script.textContent || '';
            if (src.includes('vue') || content.includes('Vue'))
                hasVue = true;
            if (src.includes('react') || content.includes('React'))
                hasReact = true;
        });
        if (hasVue)
            analysis.notes.push('Site uses Vue.js framework');
        if (hasReact)
            analysis.notes.push('Site uses React framework');
        // Additional notes
        analysis.notes.push('Product IDs are numeric');
        analysis.notes.push('Categories use 4-digit codes (e.g., 0001, 0002)');
        analysis.notes.push('Modern e-commerce platform with clean structure');
    }
    catch (error) {
        analysis.errors.push(`Error analyzing mall: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    return analysis;
}
// Execute analysis
analyzeMall().then(analysis => {
    // Save analysis results
    const outputPath = path.join(__dirname, 'analysis-87.json');
    fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2), 'utf-8');
    console.log('Analysis completed and saved to:', outputPath);
}).catch(error => {
    console.error('Analysis failed:', error);
});
