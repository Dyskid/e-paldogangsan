"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
function fixChamdsImagesWithFallback() {
    console.log('🔧 Fixing 참달성 product images with fallback...');
    try {
        // Read current products
        const productsData = (0, fs_1.readFileSync)('./src/data/products.json', 'utf-8');
        const allProducts = JSON.parse(productsData);
        // Filter chamds products
        const chamdsProducts = allProducts.filter(p => p.id.startsWith('chamds-'));
        console.log(`📊 Found ${chamdsProducts.length} 참달성 products`);
        let fixedCount = 0;
        // Generate fallback image URLs or use placeholder
        chamdsProducts.forEach(product => {
            const oldImage = product.image;
            // Check if image URL is problematic
            if (product.image && product.image.includes('0jJurf5+JqL2mXn6P+LWO9n3RehRei8HzUfVrvYrRYTek0NwmceiTX1J9Nu1oWzY10ep+nrGOcU69gswAuU7AA==')) {
                console.log(`🔧 Fixing ${product.id}: ${product.name}`);
                // Create a more reliable fallback based on product categories
                let fallbackImage = '';
                // Category-based fallback images
                if (product.name.includes('생강진액')) {
                    fallbackImage = 'https://via.placeholder.com/300x300/8B4513/FFFFFF?text=%EC%83%9D%EA%B0%95%EC%A7%84%EC%95%A1';
                }
                else if (product.name.includes('수국차') || product.name.includes('녹차')) {
                    fallbackImage = 'https://via.placeholder.com/300x300/228B22/FFFFFF?text=%EC%88%98%EA%B5%AD%EC%B0%A8';
                }
                else if (product.name.includes('어성초')) {
                    fallbackImage = 'https://via.placeholder.com/300x300/556B2F/FFFFFF?text=%EC%96%B4%EC%84%B1%EC%B4%88';
                }
                else if (product.name.includes('우엉차')) {
                    fallbackImage = 'https://via.placeholder.com/300x300/8FBC8F/FFFFFF?text=%EC%9A%B0%EC%97%89%EC%B0%A8';
                }
                else if (product.name.includes('여주티백')) {
                    fallbackImage = 'https://via.placeholder.com/300x300/9ACD32/FFFFFF?text=%EC%97%AC%EC%A3%BC%EC%B0%A8';
                }
                else if (product.name.includes('청국장')) {
                    fallbackImage = 'https://via.placeholder.com/300x300/DAA520/FFFFFF?text=%EC%B2%AD%EA%B5%AD%EC%9E%A5';
                }
                else if (product.name.includes('된장')) {
                    fallbackImage = 'https://via.placeholder.com/300x300/B8860B/FFFFFF?text=%EB%90%9C%EC%9E%A5';
                }
                else if (product.name.includes('들기름')) {
                    fallbackImage = 'https://via.placeholder.com/300x300/FFD700/FFFFFF?text=%EB%93%A4%EA%B8%B0%EB%A6%84';
                }
                else if (product.name.includes('등겨장')) {
                    fallbackImage = 'https://via.placeholder.com/300x300/CD853F/FFFFFF?text=%EB%93%B1%EA%B2%A8%EC%9E%A5';
                }
                else if (product.name.includes('누룽지')) {
                    fallbackImage = 'https://via.placeholder.com/300x300/DEB887/FFFFFF?text=%EB%88%84%EB%A3%BD%EC%A7%80';
                }
                else if (product.name.includes('돼지감자')) {
                    fallbackImage = 'https://via.placeholder.com/300x300/8A2BE2/FFFFFF?text=%EB%8F%BC%EC%A7%80%EA%B0%90%EC%9E%90';
                }
                else {
                    // Generic food/agricultural product placeholder
                    fallbackImage = 'https://via.placeholder.com/300x300/32CD32/FFFFFF?text=%EC%B0%B8%EB%8B%AC%EC%84%B1+%EB%86%8D%ED%8A%B9%EC%82%B0%EB%AC%BC';
                }
                product.image = fallbackImage;
                fixedCount++;
                console.log(`  ✅ Old: ${oldImage.substring(0, 80)}...`);
                console.log(`  ✅ New: ${fallbackImage}`);
            }
            else {
                console.log(`  ✅ Image OK for ${product.id}`);
            }
        });
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
            imagesFixed: fixedCount,
            fixType: 'fallback_placeholders',
            note: 'Used category-specific placeholder images due to complex encrypted URLs'
        };
        (0, fs_1.writeFileSync)('./scripts/output/chamds-image-fallback-summary.json', JSON.stringify(summary, null, 2));
        console.log('\n📊 Fallback Image Fix Summary:');
        console.log(`✅ Images fixed with placeholders: ${fixedCount}`);
        console.log(`📦 Total 참달성 products: ${chamdsProducts.length}`);
        console.log('🎨 Used category-specific placeholder images');
    }
    catch (error) {
        console.error('❌ Error fixing images:', error);
    }
}
// Run the fallback image fix
fixChamdsImagesWithFallback();
console.log('\n✅ Fallback image fixing complete!');
