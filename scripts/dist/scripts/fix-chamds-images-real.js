"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const axios_1 = __importDefault(require("axios"));
async function testImageUrl(url) {
    try {
        const response = await axios_1.default.head(url, { timeout: 5000 });
        return response.status === 200;
    }
    catch {
        return false;
    }
}
async function fixChamdsImagesReal() {
    console.log('🔧 Fixing 참달성 product images with real URLs...');
    try {
        // Read current products
        const productsData = (0, fs_1.readFileSync)('./src/data/products.json', 'utf-8');
        const allProducts = JSON.parse(productsData);
        // Filter chamds products
        const chamdsProducts = allProducts.filter(p => p.id.startsWith('chamds-'));
        console.log(`📊 Found ${chamdsProducts.length} 참달성 products`);
        let fixedCount = 0;
        let successCount = 0;
        // Read the original scraped data to get the real image URLs
        const scrapedData = (0, fs_1.readFileSync)('./scripts/output/chamds-products.json', 'utf-8');
        const scrapedProducts = JSON.parse(scrapedData);
        for (const product of chamdsProducts) {
            console.log(`\n🔍 Checking ${product.id}: ${product.name}`);
            // Find the corresponding scraped product
            const scrapedProduct = scrapedProducts.find((sp) => sp.id === product.id);
            if (scrapedProduct && scrapedProduct.imageUrl) {
                let originalUrl = scrapedProduct.imageUrl;
                console.log(`  📷 Original URL: ${originalUrl.substring(0, 80)}...`);
                // Fix the URL format
                let fixedUrl = originalUrl;
                // If URL starts with //cafe24.poxo.com, add https:
                if (originalUrl.startsWith('//cafe24.poxo.com')) {
                    fixedUrl = 'https:' + originalUrl;
                }
                // If URL starts with https://chamds.com//cafe24.poxo.com, remove the double //
                else if (originalUrl.includes('//cafe24.poxo.com')) {
                    fixedUrl = originalUrl.replace('https://chamds.com//cafe24.poxo.com', 'https://cafe24.poxo.com');
                }
                console.log(`  🔧 Fixed URL: ${fixedUrl.substring(0, 80)}...`);
                // Test if the fixed URL works
                const urlWorks = await testImageUrl(fixedUrl);
                if (urlWorks) {
                    product.image = fixedUrl;
                    fixedCount++;
                    successCount++;
                    console.log(`  ✅ URL works! Image updated.`);
                }
                else {
                    console.log(`  ❌ URL still doesn't work, testing alternative...`);
                    // Try alternative URL formats
                    const alternatives = [
                        originalUrl.replace('//cafe24.poxo.com', '//echosting.cafe24.com'),
                        originalUrl.replace('big/', 'medium/'),
                        originalUrl.replace('big/', 'small/'),
                        `https://chamds.com/web/product/big/${originalUrl.split('/').pop()}`
                    ];
                    let found = false;
                    for (const altUrl of alternatives) {
                        console.log(`  🔄 Testing: ${altUrl.substring(0, 60)}...`);
                        const altWorks = await testImageUrl(altUrl);
                        if (altWorks) {
                            product.image = altUrl;
                            fixedCount++;
                            successCount++;
                            console.log(`  ✅ Alternative URL works!`);
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        console.log(`  ⚠️ No working URL found, keeping placeholder`);
                        fixedCount++;
                    }
                }
                // Small delay to be respectful
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
        // Update the products array
        const chamdsProductIds = new Set(chamdsProducts.map(p => p.id));
        const updatedProducts = allProducts.map(p => chamdsProductIds.has(p.id)
            ? chamdsProducts.find(cp => cp.id === p.id) || p
            : p);
        // Write updated products back to file
        (0, fs_1.writeFileSync)('./src/data/products.json', JSON.stringify(updatedProducts, null, 2));
        // Save summary
        const summary = {
            timestamp: new Date().toISOString(),
            totalChamdsProducts: chamdsProducts.length,
            imagesProcessed: fixedCount,
            successfulImageUrls: successCount,
            fixType: 'real_image_urls',
            note: 'Attempted to fix actual image URLs from chamds.com'
        };
        (0, fs_1.writeFileSync)('./scripts/output/chamds-image-real-fix-summary.json', JSON.stringify(summary, null, 2));
        console.log('\n📊 Real Image Fix Summary:');
        console.log(`✅ Images processed: ${fixedCount}`);
        console.log(`🎯 Successful real URLs: ${successCount}`);
        console.log(`📦 Total 참달성 products: ${chamdsProducts.length}`);
    }
    catch (error) {
        console.error('❌ Error fixing images:', error);
    }
}
// Run the real image fix
fixChamdsImagesReal().then(() => {
    console.log('\n✅ Real image fixing complete!');
}).catch(console.error);
