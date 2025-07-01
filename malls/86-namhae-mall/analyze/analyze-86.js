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
        mallId: 86,
        mallName: 'namhae-mall',
        url: 'https://enamhae.co.kr/',
        categories: [],
        productStructure: {
            urlPattern: 'https://enamhae.co.kr/shop/item.php?it_id={product_id}',
            categoryUrlPattern: 'https://enamhae.co.kr/shop/list.php?ca_id={category_id}',
            paginationMethod: 'page_parameter',
            dynamicLoading: false,
            productSelectors: {
                container: '.sct_li',
                name: '.sct_txt a',
                price: '.sct_cost',
                image: '.sct_img img',
                link: '.sct_txt a'
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
        // Extract categories from navigation menu
        const categoryElements = homeDoc.querySelectorAll('#gnb_1dul > li > a');
        categoryElements.forEach((elem) => {
            const name = elem.textContent?.trim() || '';
            const href = elem.getAttribute('href') || '';
            if (name && href.includes('ca_id=')) {
                const categoryId = href.match(/ca_id=(\w+)/)?.[1] || '';
                analysis.categories.push({
                    name,
                    link: `https://enamhae.co.kr${href.startsWith('/') ? href : '/' + href}`,
                    productCount: 0
                });
            }
        });
        // Also check for categories in the sidebar or other menu areas
        const sideCategories = homeDoc.querySelectorAll('.cate_list a, .category_menu a');
        sideCategories.forEach((elem) => {
            const name = elem.textContent?.trim() || '';
            const href = elem.getAttribute('href') || '';
            if (name && href.includes('ca_id=') && !analysis.categories.find(cat => cat.name === name)) {
                analysis.categories.push({
                    name,
                    link: `https://enamhae.co.kr${href.startsWith('/') ? href : '/' + href}`
                });
            }
        });
        // Read and analyze category page
        const categoryHtml = fs.readFileSync(path.join(__dirname, 'requirements', 'category_page.html'), 'utf-8');
        const categoryDom = new jsdom_1.JSDOM(categoryHtml);
        const categoryDoc = categoryDom.window.document;
        // Extract sample products from category page
        const productElements = categoryDoc.querySelectorAll('.sct_li');
        productElements.forEach((elem, index) => {
            if (index < 5) { // Get first 5 products as samples
                const nameElem = elem.querySelector('.sct_txt a');
                const priceElem = elem.querySelector('.sct_cost');
                const imageElem = elem.querySelector('.sct_img img');
                const linkElem = elem.querySelector('.sct_img a, .sct_txt a');
                const product = {
                    name: nameElem?.textContent?.trim() || '',
                    price: priceElem?.textContent?.trim() || '',
                    image: imageElem?.getAttribute('src') || '',
                    link: linkElem?.getAttribute('href') || ''
                };
                if (product.name) {
                    analysis.sampleProducts.push(product);
                }
            }
        });
        // Check for pagination
        const paginationElements = categoryDoc.querySelectorAll('.pg_wrap .pg a, .pagination a');
        if (paginationElements.length > 0) {
            analysis.notes.push('Pagination detected using page parameter in URL');
            analysis.productStructure.paginationMethod = 'page_parameter';
        }
        // Read and analyze product detail page
        const productHtml = fs.readFileSync(path.join(__dirname, 'requirements', 'product_page.html'), 'utf-8');
        const productDom = new jsdom_1.JSDOM(productHtml);
        const productDoc = productDom.window.document;
        // Verify product structure
        const productName = productDoc.querySelector('.sit_title, .item_name, h2');
        const productPrice = productDoc.querySelector('.sit_price, .price, .item_price');
        if (productName) {
            analysis.notes.push('Product detail page structure confirmed');
        }
        // Check for any JavaScript-based loading
        const scripts = productDoc.querySelectorAll('script');
        let hasAjax = false;
        scripts.forEach(script => {
            const content = script.textContent || '';
            if (content.includes('ajax') || content.includes('$.get') || content.includes('fetch')) {
                hasAjax = true;
            }
        });
        if (hasAjax) {
            analysis.notes.push('Site may use AJAX for some features, but main content appears to be server-rendered');
        }
        // Additional notes
        analysis.notes.push('Site uses YeongCart (영카트) e-commerce platform');
        analysis.notes.push('Product IDs are numeric timestamps');
        analysis.notes.push('Categories use alphanumeric IDs (e.g., ca_id=10, ca_id=20)');
    }
    catch (error) {
        analysis.errors.push(`Error analyzing mall: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    return analysis;
}
// Execute analysis
analyzeMall().then(analysis => {
    // Save analysis results
    const outputPath = path.join(__dirname, 'analysis-86.json');
    fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2), 'utf-8');
    console.log('Analysis completed and saved to:', outputPath);
}).catch(error => {
    console.error('Analysis failed:', error);
});
