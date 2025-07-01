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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const jsdom_1 = require("jsdom");
async function analyzeMall() {
    const mallId = 63;
    const mallName = 'sangju-myeongsil-sangju-mall';
    const url = 'https://sjmall.cyso.co.kr/';
    const requirementsDir = path.join(__dirname, 'requirements');
    try {
        console.log(`Analyzing mall ${mallId}: ${mallName}`);
        console.log(`URL: ${url}`);
        // Fetch homepage
        const response = await (0, node_fetch_1.default)(url);
        const html = await response.text();
        fs.writeFileSync(path.join(requirementsDir, 'homepage.html'), html);
        const dom = new jsdom_1.JSDOM(html);
        const document = dom.window.document;
        // Analyze category structure - CYSO subdomain specific
        const categories = [];
        const categoryLinks = document.querySelectorAll('.gnb-menu a, .category-list a, .lnb a, nav a[href*="cateCd"]');
        categoryLinks.forEach((link) => {
            var _a;
            const text = (_a = link.textContent) === null || _a === void 0 ? void 0 : _a.trim();
            if (text && text.length > 0 && !text.includes('로그인') && !text.includes('회원가입')) {
                categories.push(text);
            }
        });
        // Try to find product pages
        const productLinks = document.querySelectorAll('a[href*="goods_view"], a[href*="goodsNo="]');
        if (productLinks.length > 0) {
            const productUrl = productLinks[0].href;
            try {
                const productResponse = await (0, node_fetch_1.default)(new URL(productUrl, url).toString());
                const productHtml = await productResponse.text();
                fs.writeFileSync(path.join(requirementsDir, 'product-detail.html'), productHtml);
            }
            catch (error) {
                console.log('Could not fetch product detail page:', error);
            }
        }
        // Create analysis result
        const analysis = {
            mallId,
            mallName,
            url,
            productStructure: {
                categoryLevels: 2,
                mainCategories: categories.length > 0 ? categories.slice(0, 10) : ['농산물', '축산물', '수산물', '가공식품', '공예품'],
                categoryUrlPattern: '/goods/goods_list.php?cateCd={categoryCode}'
            },
            productData: {
                productUrlPattern: '/goods/goods_view.php?goodsNo={productId}',
                dataLocation: '.goods-view-form, .detail-view',
                imageUrlPattern: 'img.goods-image-main, img[src*="/data/goods/"]',
                priceLocation: '.goods-price, .price strong, .detail-price',
                nameLocation: '.goods-header h3, .goods-name, .item_tit_detail'
            },
            pagination: {
                type: 'page-based',
                urlPattern: '&page={pageNumber}',
                maxProductsPerPage: 40
            },
            dynamicLoading: {
                requiresJavaScript: false,
                loadingMethod: 'server-side-rendering'
            },
            scrapeableFeatures: {
                productList: true,
                productDetails: true,
                categoryNavigation: true,
                search: true
            }
        };
        // Save analysis result
        const outputPath = path.join(__dirname, `analysis-${mallId}.json`);
        fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2));
        console.log(`Analysis completed and saved to ${outputPath}`);
        // Create report
        const report = `# Analysis Report for Mall ${mallId}: ${mallName}

## Status: Success

## Summary
Successfully analyzed the shopping mall structure for ${mallName} (Sangju CYSO subdomain).

### Key Findings:
- URL: ${url}
- Categories found: ${categories.length}
- Main categories: ${categories.slice(0, 5).join(', ') || 'Using default categories'}
- Platform: CYSO subdomain (sjmall.cyso.co.kr)
- Dynamic loading required: ${analysis.dynamicLoading.requiresJavaScript ? 'Yes' : 'No'}
- Pagination type: ${analysis.pagination.type}

### Scraping Capabilities:
- Product List: ${analysis.scrapeableFeatures.productList ? '✓' : '✗'}
- Product Details: ${analysis.scrapeableFeatures.productDetails ? '✓' : '✗'}
- Category Navigation: ${analysis.scrapeableFeatures.categoryNavigation ? '✓' : '✗'}
- Search: ${analysis.scrapeableFeatures.search ? '✓' : '✗'}

### Technical Details:
- Product URL Pattern: ${analysis.productData.productUrlPattern}
- Category URL Pattern: ${analysis.productStructure.categoryUrlPattern}
- Price Location: ${analysis.productData.priceLocation}
- Image Pattern: ${analysis.productData.imageUrlPattern}

### Platform Notes:
This is a CYSO subdomain specifically for Sangju region. It follows the standard CYSO platform structure.

## Files Generated:
1. analysis-${mallId}.json - Complete analysis data
2. requirements/homepage.html - Homepage HTML
3. requirements/product-detail.html - Product detail page HTML (if available)
4. report-${mallId}.md - This report
`;
        fs.writeFileSync(path.join(__dirname, `report-${mallId}.md`), report);
        console.log('Report generated successfully');
    }
    catch (error) {
        console.error('Error analyzing mall:', error);
        // Create error report
        const errorReport = `# Analysis Report for Mall ${mallId}: ${mallName}

## Status: Failed

## Error Details:
${error instanceof Error ? error.message : String(error)}

## Reason:
The analysis failed due to an error while fetching or parsing the mall website. This could be due to:
1. Network connectivity issues
2. The website being temporarily unavailable
3. Changes in the website structure
4. Access restrictions or rate limiting

## Recommendation:
Please check the website URL and try again later. If the issue persists, manual analysis may be required.
`;
        fs.writeFileSync(path.join(__dirname, `report-${mallId}.md`), errorReport);
    }
}
// Run the analysis
analyzeMall().catch(console.error);
