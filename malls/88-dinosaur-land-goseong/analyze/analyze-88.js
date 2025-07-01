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
        mallId: 88,
        mallName: 'dinosaur-land-goseong',
        url: 'https://www.edinomall.com/shop/smain/index.php',
        categories: [],
        productStructure: {
            urlPattern: 'https://www.edinomall.com/shop/smain/shopdetail.php?branduid={product_id}',
            categoryUrlPattern: 'https://www.edinomall.com/shop/smain/shop.php?shopcode={category_code}',
            paginationMethod: 'page_parameter',
            dynamicLoading: false,
            productSelectors: {
                container: '.productListing_ul li, .item',
                name: '.productListing_title, .prd_name',
                price: '.productListing_price, .prd_price',
                image: '.productListing_img img, .prd_img img',
                link: 'a[href*="shopdetail.php"]'
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
        const categoryElements = homeDoc.querySelectorAll('.cate_menu a, .category a[href*="shopcode"], #left_menu a');
        categoryElements.forEach((elem) => {
            const name = elem.textContent?.trim() || '';
            const href = elem.getAttribute('href') || '';
            if (name && href.includes('shopcode=')) {
                const shopCode = href.match(/shopcode=(\d+)/)?.[1] || '';
                if (shopCode && !analysis.categories.find(cat => cat.link.includes(shopCode))) {
                    analysis.categories.push({
                        name,
                        link: `https://www.edinomall.com/shop/smain/${href.startsWith('/') ? href.substring(1) : href}`
                    });
                }
            }
        });
        // Read and analyze category page
        const categoryHtml = fs.readFileSync(path.join(__dirname, 'requirements', 'category_page.html'), 'utf-8');
        const categoryDom = new jsdom_1.JSDOM(categoryHtml);
        const categoryDoc = categoryDom.window.document;
        // Extract sample products - common patterns for Korean shopping malls
        const productSelectors = [
            '.productListing_ul li',
            '.item_list li',
            '.prd_list li',
            'table.product_list tr',
            '.goods_list_item'
        ];
        let productElements = null;
        for (const selector of productSelectors) {
            productElements = categoryDoc.querySelectorAll(selector);
            if (productElements.length > 0)
                break;
        }
        if (productElements) {
            productElements.forEach((elem, index) => {
                if (index < 5) {
                    const linkElem = elem.querySelector('a[href*="branduid"]');
                    const nameElem = elem.querySelector('.productListing_title, .prd_name, .name, a[href*="branduid"]');
                    const priceElem = elem.querySelector('.productListing_price, .prd_price, .price, .sellprice');
                    const imageElem = elem.querySelector('img');
                    const href = linkElem?.getAttribute('href') || '';
                    const branduid = href.match(/branduid=(\d+)/)?.[1] || '';
                    const product = {
                        name: nameElem?.textContent?.trim() || '',
                        price: priceElem?.textContent?.trim() || '',
                        image: imageElem?.getAttribute('src') || '',
                        link: branduid ? `https://www.edinomall.com/shop/smain/shopdetail.php?branduid=${branduid}` : ''
                    };
                    if (product.name && product.link) {
                        analysis.sampleProducts.push(product);
                    }
                }
            });
        }
        // Check for pagination
        const paginationElements = categoryDoc.querySelectorAll('.paging a, .pagination a, a[href*="page="]');
        if (paginationElements.length > 0) {
            analysis.notes.push('Pagination detected using page parameter');
        }
        // Read and analyze product detail page
        const productHtml = fs.readFileSync(path.join(__dirname, 'requirements', 'product_page.html'), 'utf-8');
        const productDom = new jsdom_1.JSDOM(productHtml);
        const productDoc = productDom.window.document;
        // Verify product structure
        const productName = productDoc.querySelector('.product_name, .prd_detail_name, h1, h2');
        const productPrice = productDoc.querySelector('.product_price, .prd_detail_price, .price');
        if (productName) {
            analysis.notes.push('Product detail page structure confirmed');
        }
        // Additional notes
        analysis.notes.push('Site uses traditional Korean e-commerce platform structure');
        analysis.notes.push('Product IDs use "branduid" parameter');
        analysis.notes.push('Categories use numeric shopcode (e.g., 003001000000)');
        analysis.notes.push('Multi-level category hierarchy with numeric codes');
    }
    catch (error) {
        analysis.errors.push(`Error analyzing mall: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    return analysis;
}
// Execute analysis
analyzeMall().then(analysis => {
    // Save analysis results
    const outputPath = path.join(__dirname, 'analysis-88.json');
    fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2), 'utf-8');
    console.log('Analysis completed and saved to:', outputPath);
}).catch(error => {
    console.error('Analysis failed:', error);
});
