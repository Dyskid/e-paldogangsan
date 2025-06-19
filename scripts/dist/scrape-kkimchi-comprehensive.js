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
const https = __importStar(require("https"));
async function scrapeKkimchiComprehensive() {
    const baseUrl = 'https://www.k-kimchi.kr';
    const mallInfo = {
        id: 'kkimchi',
        name: '광주김치몰',
        region: '광주광역시',
        tags: ['김치', '전통식품', '전라도', '광주김치', '발효식품']
    };
    // Categories found from exploration
    const categories = [
        { id: '003', name: '포기김치', url: '/index.php?cate=003' },
        { id: '005', name: '30%할인전', url: '/index.php?cate=005' },
        { id: '005001', name: '포기김치(할인)', url: '/index.php?cate=005001' },
        { id: '005002', name: '묵은지(할인)', url: '/index.php?cate=005002' },
        { id: '005003', name: '별미김치(할인)', url: '/index.php?cate=005003' },
        { id: '004', name: '별미김치', url: '/index.php?cate=004' },
        { id: '004001', name: '깍두기', url: '/index.php?cate=004001' },
        { id: '006', name: '명인명품김치', url: '/index.php?cate=006' }
    ];
    const allProducts = [];
    const seenProductIds = new Set();
    let totalErrors = 0;
    // Create HTTPS agent
    const httpsAgent = new https.Agent({
        rejectUnauthorized: false
    });
    console.log('🔍 Starting comprehensive scraping of 광주김치몰...');
    console.log(`📂 Scraping ${categories.length} categories`);
    for (const category of categories) {
        try {
            console.log(`\n🔍 Scraping category: ${category.name}...`);
            const categoryUrl = `${baseUrl}${category.url}`;
            const response = await axios_1.default.get(categoryUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8'
                },
                httpsAgent,
                timeout: 20000
            });
            if (response.status === 200) {
                const $ = cheerio.load(response.data);
                // Extract products
                const products = await scrapeProductsFromPage($, category, mallInfo, baseUrl);
                // Filter out duplicates
                const newProducts = products.filter(product => {
                    if (seenProductIds.has(product.id)) {
                        return false;
                    }
                    seenProductIds.add(product.id);
                    return true;
                });
                allProducts.push(...newProducts);
                console.log(`✅ Found ${newProducts.length} unique products in ${category.name}`);
                if (newProducts.length > 0) {
                    console.log('📦 Sample products:');
                    newProducts.slice(0, 3).forEach((product, index) => {
                        console.log(`  ${index + 1}. ${product.title.substring(0, 40)}...`);
                    });
                }
            }
            else {
                console.log(`❌ HTTP ${response.status} for ${category.name}`);
                totalErrors++;
            }
            // Delay between categories
            await new Promise(resolve => setTimeout(resolve, 1500));
        }
        catch (error) {
            console.log(`❌ Error scraping ${category.name}: ${error}`);
            totalErrors++;
        }
    }
    // Save results
    (0, fs_1.writeFileSync)('./scripts/output/kkimchi-products.json', JSON.stringify(allProducts, null, 2));
    (0, fs_1.writeFileSync)('./scripts/output/kkimchi-scrape-summary.json', JSON.stringify({
        totalProducts: allProducts.length,
        totalCategories: categories.length,
        errors: totalErrors,
        categories: categories.map(cat => cat.name),
        timestamp: new Date().toISOString()
    }, null, 2));
    console.log('\n📊 Scraping Summary:');
    console.log(`✅ Total unique products scraped: ${allProducts.length}`);
    console.log(`📂 Categories processed: ${categories.length}`);
    console.log(`❌ Errors encountered: ${totalErrors}`);
    console.log(`📋 Categories: ${categories.map(c => c.name).join(', ')}`);
}
async function scrapeProductsFromPage($, category, mallInfo, baseUrl) {
    const products = [];
    // Find product links
    const productLinks = $('a[href*="type=view"]');
    if (productLinks.length === 0) {
        console.log('⚠️ No product links found');
        return products;
    }
    // Group links by product number to avoid duplicates on same page
    const productMap = new Map();
    productLinks.each((index, element) => {
        try {
            const $link = $(element);
            const href = $link.attr('href');
            if (!href || !href.includes('num=')) {
                return;
            }
            // Extract product number
            const numMatch = href.match(/num=(\d+)/);
            if (!numMatch) {
                return;
            }
            const productNum = numMatch[1];
            const productUrl = href.startsWith('http') ? href : `${baseUrl}${href.startsWith('/') ? '' : '/'}${href}`;
            // If we've already seen this product on this page, skip
            if (productMap.has(productNum)) {
                return;
            }
            // Get the parent container
            const $container = $link.closest('.product_item, .item, .goods_item, .pd_item, [class*="product"]');
            // Extract title
            let title = $link.text().trim();
            if (!title) {
                title = $link.find('img').attr('alt') || '';
            }
            // Extract image
            let imageUrl = '';
            const $img = $container.find('img').first();
            if ($img.length > 0) {
                imageUrl = $img.attr('src') || '';
                if (imageUrl && !imageUrl.startsWith('http')) {
                    imageUrl = imageUrl.startsWith('/') ? `${baseUrl}${imageUrl}` : `${baseUrl}/${imageUrl}`;
                }
            }
            // Extract price
            let price = '';
            const priceElements = $container.find('.price, .cost, .won, .money, [class*="price"]');
            if (priceElements.length > 0) {
                price = priceElements.first().text().trim();
            }
            // Extract description
            const description = $container.find('.desc, .description, .summary').text().trim();
            productMap.set(productNum, {
                id: `kkimchi-${productNum}`,
                title: title,
                description: description,
                price: price,
                imageUrl: imageUrl,
                productUrl: productUrl,
                category: category.name,
                mallId: mallInfo.id,
                mallName: mallInfo.name,
                region: mallInfo.region,
                tags: [...mallInfo.tags, category.name]
            });
        }
        catch (error) {
            console.log(`⚠️ Error parsing product ${index}: ${error}`);
        }
    });
    // Convert map to array
    products.push(...productMap.values());
    return products;
}
// Run the comprehensive scraper
scrapeKkimchiComprehensive().then(() => {
    console.log('✅ 광주김치몰 comprehensive scraping completed!');
}).catch(console.error);
