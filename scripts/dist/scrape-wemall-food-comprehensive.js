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
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
const fs_1 = require("fs");
// Food/Agricultural categories to scrape
const FOOD_CATEGORIES = [
    { id: '001', name: '식품/농산품' },
    { id: '001013', name: '쌀/농축산물' },
    { id: '001021', name: '차/음료/과자/가공식품' },
    { id: '001022', name: '건강식품/다이어트' }
];
async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
async function scrapeProductsFromCategory(categoryId, categoryName) {
    const products = [];
    const baseUrl = 'https://wemall.kr';
    let page = 1;
    let hasMorePages = true;
    console.log(`\n📂 Scraping category: ${categoryName} (${categoryId})`);
    while (hasMorePages && page <= 10) { // Limit to 10 pages per category
        try {
            const url = `${baseUrl}/product/product.html?category=${categoryId}&page=${page}`;
            console.log(`  📄 Page ${page}: ${url}`);
            const response = await axios_1.default.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
                    'Referer': baseUrl
                },
                timeout: 30000
            });
            const $ = cheerio.load(response.data);
            // Find product items
            const productItems = $('.product-item, .goods-item, .item, [class*="product"]').filter((_, el) => {
                const $el = $(el);
                return $el.find('a').length > 0 && ($el.find('img').length > 0 || $el.find('.price').length > 0);
            });
            if (productItems.length === 0) {
                console.log(`  ⚠️ No products found on page ${page}`);
                hasMorePages = false;
                break;
            }
            productItems.each((index, element) => {
                try {
                    const $item = $(element);
                    // Extract product URL
                    const linkElem = $item.find('a').first();
                    const productUrl = linkElem.attr('href');
                    if (!productUrl)
                        return;
                    // Extract product ID from URL
                    const idMatch = productUrl.match(/product_id=(\d+)|pid=(\d+)|id=(\d+)/);
                    const productId = idMatch ? (idMatch[1] || idMatch[2] || idMatch[3]) : `${categoryId}-${page}-${index}`;
                    // Extract title
                    const title = $item.find('.product-name, .name, .title, [class*="name"]').first().text().trim() ||
                        $item.find('a').attr('title') ||
                        $item.find('img').attr('alt') ||
                        '';
                    if (!title)
                        return;
                    // Extract image
                    const imageUrl = $item.find('img').first().attr('src') || '';
                    const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `${baseUrl}${imageUrl}`;
                    // Extract price
                    const priceText = $item.find('.price, .sale-price, [class*="price"]').first().text();
                    const price = priceText.replace(/[^0-9,]/g, '') || '0';
                    // Extract original price (for discounts)
                    const originalPriceText = $item.find('.original-price, .old-price, .list-price').first().text();
                    const originalPrice = originalPriceText ? originalPriceText.replace(/[^0-9,]/g, '') : undefined;
                    // Check for badges
                    const isNew = $item.find('.new, .badge-new, [class*="new"]').length > 0;
                    const isBest = $item.find('.best, .badge-best, [class*="best"]').length > 0;
                    const product = {
                        id: `wemall-${productId}`,
                        title: title,
                        description: title, // Use title as description if not available
                        price: price,
                        originalPrice: originalPrice,
                        discountPercent: originalPrice && price ?
                            Math.round((1 - parseInt(price.replace(/,/g, '')) / parseInt(originalPrice.replace(/,/g, ''))) * 100).toString() :
                            undefined,
                        imageUrl: fullImageUrl,
                        externalUrl: productUrl.startsWith('http') ? productUrl : `${baseUrl}${productUrl}`,
                        category: categoryName,
                        isNew: isNew,
                        isBest: isBest,
                        mallId: 'wemall',
                        mallName: '우리몰',
                        region: '대구광역시',
                        tags: ['지역특산품', categoryName]
                    };
                    products.push(product);
                }
                catch (err) {
                    console.error(`  ❌ Error parsing product: ${err}`);
                }
            });
            console.log(`  ✅ Found ${productItems.length} products on page ${page}`);
            // Check for next page
            const hasNextPage = $('.pagination .next, .paging .next, [class*="next"]').not('.disabled').length > 0 ||
                $(`.pagination a:contains("${page + 1}")`).length > 0;
            if (!hasNextPage || productItems.length < 10) {
                hasMorePages = false;
            }
            else {
                page++;
                await delay(1000); // Be respectful with requests
            }
        }
        catch (error) {
            console.error(`  ❌ Error scraping page ${page}: ${error}`);
            hasMorePages = false;
        }
    }
    return products;
}
async function scrapeWemallFoodComprehensive() {
    const result = {
        totalProducts: 0,
        products: [],
        categories: FOOD_CATEGORIES.map(c => c.name),
        timestamp: new Date().toISOString(),
        errors: []
    };
    try {
        console.log('🔍 Starting comprehensive food product scraping of 우리몰...');
        console.log(`📂 Categories to scrape: ${FOOD_CATEGORIES.length}`);
        // Scrape each food category
        for (const category of FOOD_CATEGORIES) {
            try {
                const categoryProducts = await scrapeProductsFromCategory(category.id, category.name);
                result.products.push(...categoryProducts);
                console.log(`  📦 Total products in ${category.name}: ${categoryProducts.length}`);
                await delay(2000); // Delay between categories
            }
            catch (error) {
                const errorMsg = `Failed to scrape category ${category.name}: ${error}`;
                console.error(`❌ ${errorMsg}`);
                result.errors.push(errorMsg);
            }
        }
        // Remove duplicates based on product ID
        const uniqueProducts = new Map();
        result.products.forEach(product => {
            if (!uniqueProducts.has(product.id) || product.price !== '0') {
                uniqueProducts.set(product.id, product);
            }
        });
        result.products = Array.from(uniqueProducts.values());
        result.totalProducts = result.products.length;
        // Save results
        (0, fs_1.writeFileSync)('./scripts/output/wemall-food-products-comprehensive.json', JSON.stringify(result, null, 2));
        // Generate summary
        const summary = {
            timestamp: result.timestamp,
            totalProducts: result.totalProducts,
            categoriesScraped: result.categories,
            productsByCategory: result.products.reduce((acc, p) => {
                acc[p.category] = (acc[p.category] || 0) + 1;
                return acc;
            }, {}),
            productsWithPrices: result.products.filter(p => p.price && p.price !== '0').length,
            productsWithImages: result.products.filter(p => p.imageUrl).length,
            productsWithDiscounts: result.products.filter(p => p.originalPrice).length,
            errors: result.errors,
            sampleProducts: result.products.slice(0, 5)
        };
        (0, fs_1.writeFileSync)('./scripts/output/wemall-food-scrape-summary.json', JSON.stringify(summary, null, 2));
        console.log('\n📊 Scraping Summary:');
        console.log(`✅ Total food products found: ${result.totalProducts}`);
        console.log(`💰 Products with prices: ${summary.productsWithPrices}`);
        console.log(`🖼️ Products with images: ${summary.productsWithImages}`);
        console.log(`🏷️ Products with discounts: ${summary.productsWithDiscounts}`);
        console.log('\n📂 Products by category:');
        Object.entries(summary.productsByCategory).forEach(([category, count]) => {
            console.log(`  ${category}: ${count} products`);
        });
        if (result.errors.length > 0) {
            console.log('\n⚠️ Errors encountered:');
            result.errors.forEach(error => console.log(`  - ${error}`));
        }
    }
    catch (error) {
        console.error('❌ Fatal error during scraping:', error);
    }
}
// Run the scraper
scrapeWemallFoodComprehensive().then(() => {
    console.log('\n✅ Food product scraping complete!');
}).catch(console.error);
