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
    let start = 0;
    const productsPerPage = 12; // Based on pagination structure
    let hasMorePages = true;
    console.log(`\n📂 Scraping category: ${categoryName} (${categoryId})`);
    while (hasMorePages && start < 100) { // Limit total products per category
        try {
            const url = `${baseUrl}/product/product.html?category=${categoryId}&start=${start}`;
            console.log(`  📄 Products ${start + 1}-${start + productsPerPage}: ${url}`);
            const response = await axios_1.default.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
                    'Referer': baseUrl
                },
                timeout: 30000
            });
            const $ = cheerio.load(response.data);
            // Find product items using the data-shop-list attribute
            const productList = $('[data-shop-list="type1"] li, .area_shopList ul li').filter((_, el) => {
                return $(el).find('a.market').length > 0;
            });
            if (productList.length === 0) {
                console.log(`  ⚠️ No products found at start=${start}`);
                hasMorePages = false;
                break;
            }
            productList.each((index, element) => {
                try {
                    const $item = $(element);
                    const $link = $item.find('a.market');
                    // Extract product ID from onclick attribute
                    const onclickAttr = $link.attr('onclick') || '';
                    const idMatch = onclickAttr.match(/market_cnt\('([^']+)'\)/);
                    const productId = idMatch ? idMatch[1] : `${categoryId}-${start}-${index}`;
                    // Extract title
                    const title = $item.find('em').first().text().trim();
                    if (!title)
                        return;
                    // Extract description
                    const description = $item.find('i').not('[data-shop-icon]').first().text().trim() || title;
                    // Extract image URL
                    const imgSrc = $item.find('.img img').first().attr('src') || '';
                    const imageUrl = imgSrc.startsWith('http') ? imgSrc : `${baseUrl}${imgSrc}`;
                    // Extract prices
                    const $priceSpan = $item.find('.price');
                    const priceTexts = $priceSpan.find('i').map((_, el) => $(el).text().trim()).get();
                    let price = '0';
                    let originalPrice;
                    if (priceTexts.length > 0) {
                        price = priceTexts[0].replace(/[^0-9]/g, '');
                        if (priceTexts.length > 1) {
                            originalPrice = priceTexts[1].replace(/[^0-9]/g, '');
                        }
                    }
                    // Extract discount percentage
                    const discountText = $item.find('.percent').text().trim();
                    const discountMatch = discountText.match(/(\d+)%/);
                    const discountPercent = discountMatch ? discountMatch[1] : undefined;
                    // Check for badges
                    const isNew = $item.find('[data-shop-icon="new"]').length > 0;
                    const isBest = $item.find('[data-shop-icon="best"]').length > 0;
                    // Extract external URL
                    const externalUrl = $item.find('.view').attr('href') || '';
                    const product = {
                        id: `wemall-${productId}`,
                        title: title,
                        description: description,
                        price: price,
                        originalPrice: originalPrice,
                        discountPercent: discountPercent,
                        imageUrl: imageUrl,
                        externalUrl: externalUrl,
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
            console.log(`  ✅ Found ${productList.length} products`);
            // Check if there are more pages
            const currentPageLinks = $('.pagination span').text();
            const nextPageLink = $(`.pagination a[href*="start=${start + productsPerPage}"]`).length > 0;
            if (!nextPageLink || productList.length < productsPerPage) {
                hasMorePages = false;
            }
            else {
                start += productsPerPage;
                await delay(1000); // Be respectful with requests
            }
        }
        catch (error) {
            console.error(`  ❌ Error scraping at start=${start}: ${error}`);
            hasMorePages = false;
        }
    }
    return products;
}
async function scrapeWemallFoodFinal() {
    const result = {
        totalProducts: 0,
        products: [],
        categories: FOOD_CATEGORIES.map(c => c.name),
        timestamp: new Date().toISOString(),
        errors: []
    };
    try {
        console.log('🔍 Starting final food product scraping of 우리몰...');
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
            if (!uniqueProducts.has(product.id) || (product.price !== '0' && parseInt(product.price) > 0)) {
                uniqueProducts.set(product.id, product);
            }
        });
        result.products = Array.from(uniqueProducts.values());
        result.totalProducts = result.products.length;
        // Save results
        (0, fs_1.writeFileSync)('./scripts/output/wemall-food-products-final.json', JSON.stringify(result, null, 2));
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
            productsWithImages: result.products.filter(p => p.imageUrl && !p.imageUrl.includes('no_image')).length,
            productsWithDiscounts: result.products.filter(p => p.originalPrice).length,
            productsWithExternalUrls: result.products.filter(p => p.externalUrl).length,
            errors: result.errors,
            sampleProducts: result.products.slice(0, 10).map(p => ({
                id: p.id,
                title: p.title,
                price: p.price,
                originalPrice: p.originalPrice,
                category: p.category,
                hasImage: !!p.imageUrl && !p.imageUrl.includes('no_image'),
                hasExternalUrl: !!p.externalUrl
            }))
        };
        (0, fs_1.writeFileSync)('./scripts/output/wemall-food-scrape-final-summary.json', JSON.stringify(summary, null, 2));
        console.log('\n📊 Scraping Summary:');
        console.log(`✅ Total food products found: ${result.totalProducts}`);
        console.log(`💰 Products with prices: ${summary.productsWithPrices}`);
        console.log(`🖼️ Products with images: ${summary.productsWithImages}`);
        console.log(`🏷️ Products with discounts: ${summary.productsWithDiscounts}`);
        console.log(`🔗 Products with external URLs: ${summary.productsWithExternalUrls}`);
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
scrapeWemallFoodFinal().then(() => {
    console.log('\n✅ Food product scraping complete!');
}).catch(console.error);
