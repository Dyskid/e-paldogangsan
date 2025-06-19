"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
function extractPriceFromDescription(description) {
    // Extract price from description like "판매가 : 30,000원"
    const priceMatch = description.match(/판매가\s*:\s*([0-9,]+)원/);
    if (priceMatch) {
        const priceStr = priceMatch[1].replace(/,/g, '');
        return parseInt(priceStr, 10) || 0;
    }
    return 0;
}
function mapCategoryToStandard(category) {
    // Map chamds categories to standard categories
    const categoryMap = {
        '음료': '가공식품',
        '차': '가공식품',
        '분말가루': '가공식품',
        '가공식품': '가공식품'
    };
    return categoryMap[category] || '가공식품';
}
function registerChamdsFoodProducts() {
    console.log('🔍 Registering 참달성 food/agricultural products...');
    try {
        // Read existing products
        const existingProductsData = (0, fs_1.readFileSync)('./src/data/products.json', 'utf-8');
        const existingProducts = JSON.parse(existingProductsData);
        // Read scraped chamds products
        const scrapedData = (0, fs_1.readFileSync)('./scripts/output/chamds-products.json', 'utf-8');
        const scrapedProducts = JSON.parse(scrapedData);
        console.log(`📊 Total scraped products: ${scrapedProducts.length}`);
        // Remove all existing chamds products first
        const nonChamdsProducts = existingProducts.filter(p => !p.id.startsWith('chamds-'));
        console.log(`📦 Non-chamds products in database: ${nonChamdsProducts.length}`);
        console.log(`🗑️ Removing ${existingProducts.length - nonChamdsProducts.length} existing chamds products`);
        // Process and add food products
        let addedCount = 0;
        let skippedCount = 0;
        let productsWithPrices = 0;
        let productsWithImages = 0;
        const mallInfo = {
            mallId: 'chamds',
            mallName: '참달성',
            mallUrl: 'https://chamds.com',
            region: '경상북도'
        };
        // Remove duplicates first (by ID)
        const uniqueProducts = new Map();
        scrapedProducts.forEach(product => {
            uniqueProducts.set(product.id, product);
        });
        Array.from(uniqueProducts.values()).forEach(scraped => {
            // Extract price from description
            const price = extractPriceFromDescription(scraped.description);
            // Skip products without valid prices or titles
            if (price <= 0 || !scraped.title || scraped.title.trim() === '') {
                skippedCount++;
                console.log(`⏭️ Skipping ${scraped.id}: ${scraped.title} (no valid price)`);
                return;
            }
            if (price > 0)
                productsWithPrices++;
            if (scraped.imageUrl && !scraped.imageUrl.includes('no_image'))
                productsWithImages++;
            const product = {
                id: scraped.id,
                name: scraped.title,
                price: price,
                originalPrice: undefined, // No original prices found
                image: scraped.imageUrl,
                category: mapCategoryToStandard(scraped.category),
                region: '경상북도',
                url: scraped.productUrl,
                description: scraped.title, // Clean description
                tags: ['농특산물', '참달성', '달성군', scraped.category],
                isFeatured: false,
                isNew: false,
                mall: mallInfo
            };
            nonChamdsProducts.push(product);
            addedCount++;
        });
        // Sort products by ID
        nonChamdsProducts.sort((a, b) => a.id.localeCompare(b.id));
        // Write updated products back to file
        (0, fs_1.writeFileSync)('./src/data/products.json', JSON.stringify(nonChamdsProducts, null, 2));
        // Generate summary
        const summary = {
            timestamp: new Date().toISOString(),
            mall: mallInfo,
            scraping: {
                totalScraped: scrapedProducts.length,
                uniqueProducts: uniqueProducts.size,
                duplicatesRemoved: scrapedProducts.length - uniqueProducts.size,
                skipped: skippedCount,
                registered: addedCount
            },
            products: {
                added: addedCount,
                totalInDatabase: nonChamdsProducts.length,
                chamdsProductsOnly: nonChamdsProducts.filter(p => p.id.startsWith('chamds-')).length
            },
            categories: {
                distribution: nonChamdsProducts
                    .filter(p => p.id.startsWith('chamds-'))
                    .reduce((acc, p) => {
                    acc[p.category] = (acc[p.category] || 0) + 1;
                    return acc;
                }, {})
            },
            dataQuality: {
                withPrices: productsWithPrices,
                withoutPrices: addedCount - productsWithPrices,
                withImages: productsWithImages,
                averagePrice: addedCount > 0
                    ? Math.round(nonChamdsProducts
                        .filter(p => p.id.startsWith('chamds-'))
                        .reduce((sum, p) => sum + p.price, 0) / addedCount)
                    : 0
            },
            sampleProducts: nonChamdsProducts
                .filter(p => p.id.startsWith('chamds-'))
                .slice(0, 10)
                .map(p => ({
                id: p.id,
                name: p.name,
                price: p.price,
                category: p.category,
                hasImage: !!p.image && !p.image.includes('no_image'),
                hasUrl: !!p.url
            }))
        };
        (0, fs_1.writeFileSync)('./scripts/output/chamds-food-registration-summary.json', JSON.stringify(summary, null, 2));
        console.log('\n📊 Registration Summary:');
        console.log(`✅ Food products registered: ${addedCount}`);
        console.log(`⏭️ Products skipped (no price/title): ${skippedCount}`);
        console.log(`🔄 Duplicates removed: ${summary.scraping.duplicatesRemoved}`);
        console.log(`📦 Total products in database: ${nonChamdsProducts.length}`);
        console.log(`🛒 참달성 products in database: ${summary.products.chamdsProductsOnly}`);
        console.log(`💰 Products with prices: ${productsWithPrices}`);
        console.log(`🖼️ Products with images: ${productsWithImages}`);
        console.log(`💵 Average price: ₩${summary.dataQuality.averagePrice.toLocaleString()}`);
        console.log('\n📂 Category distribution:');
        Object.entries(summary.categories.distribution).forEach(([category, count]) => {
            console.log(`  ${category}: ${count} products`);
        });
    }
    catch (error) {
        console.error('❌ Error registering products:', error);
        // Save error for debugging
        const errorInfo = {
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
        };
        (0, fs_1.writeFileSync)('./scripts/output/chamds-food-registration-error.json', JSON.stringify(errorInfo, null, 2));
    }
}
// Run the registration
registerChamdsFoodProducts();
