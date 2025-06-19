"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
function parsePrice(priceStr) {
    if (!priceStr)
        return 0;
    // Remove all non-numeric characters
    const cleanPrice = priceStr.replace(/[^0-9]/g, '');
    // Convert to number
    return parseInt(cleanPrice, 10) || 0;
}
function mapCategoryToStandard(category) {
    // Map wemall categories to standard categories
    const categoryMap = {
        '식품/농산품': '가공식품',
        '쌀/농축산물': '농축수산물',
        '차/음료/과자/가공식품': '가공식품',
        '건강식품/다이어트': '가공식품'
    };
    return categoryMap[category] || '가공식품';
}
function registerWemallFoodProducts() {
    console.log('🔍 Registering 우리몰 food/agricultural products...');
    try {
        // Read existing products
        const existingProductsData = (0, fs_1.readFileSync)('./src/data/products.json', 'utf-8');
        const existingProducts = JSON.parse(existingProductsData);
        // Read scraped wemall food products
        const scrapedData = (0, fs_1.readFileSync)('./scripts/output/wemall-food-products-final.json', 'utf-8');
        const scrapedResult = JSON.parse(scrapedData);
        console.log(`📊 Total scraped food products: ${scrapedResult.totalProducts}`);
        // Remove all existing wemall products first
        const nonWemallProducts = existingProducts.filter(p => !p.id.startsWith('wemall-'));
        console.log(`📦 Non-wemall products in database: ${nonWemallProducts.length}`);
        console.log(`🗑️ Removing ${existingProducts.length - nonWemallProducts.length} existing wemall products`);
        // Process and add food products
        let addedCount = 0;
        let skippedCount = 0;
        let productsWithPrices = 0;
        let productsWithDiscounts = 0;
        let productsWithImages = 0;
        const mallInfo = {
            mallId: 'wemall',
            mallName: '우리몰',
            mallUrl: 'https://wemall.kr',
            region: '대구광역시'
        };
        scrapedResult.products.forEach(scraped => {
            const price = parsePrice(scraped.price);
            const originalPrice = scraped.originalPrice ? parsePrice(scraped.originalPrice) : undefined;
            // Skip products without valid prices or titles
            if (price <= 0 || !scraped.title || scraped.title.trim() === '') {
                skippedCount++;
                return;
            }
            if (price > 0)
                productsWithPrices++;
            if (originalPrice && originalPrice > price)
                productsWithDiscounts++;
            if (scraped.imageUrl && !scraped.imageUrl.includes('no_image'))
                productsWithImages++;
            const product = {
                id: scraped.id,
                name: scraped.title,
                price: price,
                originalPrice: originalPrice,
                image: scraped.imageUrl,
                category: mapCategoryToStandard(scraped.category),
                region: scraped.region,
                url: scraped.externalUrl || `https://wemall.kr/product/product.html?id=${scraped.id.replace('wemall-', '')}`,
                description: scraped.description || scraped.title,
                tags: [...scraped.tags, '지역특산품', '대구'],
                isFeatured: scraped.isBest || false,
                isNew: scraped.isNew || false,
                mall: mallInfo
            };
            nonWemallProducts.push(product);
            addedCount++;
        });
        // Sort products by ID
        nonWemallProducts.sort((a, b) => a.id.localeCompare(b.id));
        // Write updated products back to file
        (0, fs_1.writeFileSync)('./src/data/products.json', JSON.stringify(nonWemallProducts, null, 2));
        // Generate summary
        const summary = {
            timestamp: new Date().toISOString(),
            mall: mallInfo,
            scraping: {
                totalScraped: scrapedResult.totalProducts,
                skipped: skippedCount,
                registered: addedCount
            },
            products: {
                added: addedCount,
                totalInDatabase: nonWemallProducts.length,
                wemallProductsOnly: nonWemallProducts.filter(p => p.id.startsWith('wemall-')).length
            },
            categories: {
                distribution: nonWemallProducts
                    .filter(p => p.id.startsWith('wemall-'))
                    .reduce((acc, p) => {
                    acc[p.category] = (acc[p.category] || 0) + 1;
                    return acc;
                }, {})
            },
            dataQuality: {
                withPrices: productsWithPrices,
                withoutPrices: scrapedResult.totalProducts - productsWithPrices,
                withDiscounts: productsWithDiscounts,
                withImages: productsWithImages,
                averagePrice: productsWithPrices > 0
                    ? Math.round(nonWemallProducts
                        .filter(p => p.id.startsWith('wemall-'))
                        .reduce((sum, p) => sum + p.price, 0) / addedCount)
                    : 0
            },
            sampleProducts: nonWemallProducts
                .filter(p => p.id.startsWith('wemall-'))
                .slice(0, 10)
                .map(p => ({
                id: p.id,
                name: p.name,
                price: p.price,
                originalPrice: p.originalPrice,
                category: p.category,
                hasImage: !!p.image && !p.image.includes('no_image'),
                hasUrl: !!p.url
            }))
        };
        (0, fs_1.writeFileSync)('./scripts/output/wemall-food-registration-summary.json', JSON.stringify(summary, null, 2));
        console.log('\n📊 Registration Summary:');
        console.log(`✅ Food products registered: ${addedCount}`);
        console.log(`⏭️ Products skipped (no price/title): ${skippedCount}`);
        console.log(`📦 Total products in database: ${nonWemallProducts.length}`);
        console.log(`🛒 우리몰 products in database: ${summary.products.wemallProductsOnly}`);
        console.log(`💰 Products with prices: ${productsWithPrices}`);
        console.log(`🏷️ Products with discounts: ${productsWithDiscounts}`);
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
        (0, fs_1.writeFileSync)('./scripts/output/wemall-food-registration-error.json', JSON.stringify(errorInfo, null, 2));
    }
}
// Run the registration
registerWemallFoodProducts();
