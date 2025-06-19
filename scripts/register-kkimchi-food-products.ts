import { readFileSync, writeFileSync } from 'fs';
import { Product } from '../src/types';

interface ScrapedProduct {
  id: string;
  title: string;
  description: string;
  price: string;
  imageUrl: string;
  productUrl: string;
  category: string;
  mallId: string;
  mallName: string;
  region: string;
  tags: string[];
}

function parseKimchiPrice(priceString: string): { price: number; originalPrice?: number } {
  if (!priceString) return { price: 0 };
  
  // Handle discount format like "10%18,600원→ 16,740원"
  const discountMatch = priceString.match(/(\d+)%([0-9,]+)원→\s*([0-9,]+)원/);
  if (discountMatch) {
    const originalPrice = parseInt(discountMatch[2].replace(/,/g, ''), 10);
    const price = parseInt(discountMatch[3].replace(/,/g, ''), 10);
    return { price, originalPrice };
  }
  
  // Handle simple price format like "15,000원"
  const simpleMatch = priceString.match(/([0-9,]+)원/);
  if (simpleMatch) {
    const price = parseInt(simpleMatch[1].replace(/,/g, ''), 10);
    return { price };
  }
  
  // Handle arrow format without percentage like "22,400원→ 15,680원"
  const arrowMatch = priceString.match(/([0-9,]+)원→\s*([0-9,]+)원/);
  if (arrowMatch) {
    const originalPrice = parseInt(arrowMatch[1].replace(/,/g, ''), 10);
    const price = parseInt(arrowMatch[2].replace(/,/g, ''), 10);
    return { price, originalPrice };
  }
  
  return { price: 0 };
}

function mapCategoryToStandard(category: string): string {
  // All K-Kimchi products are food products (kimchi and fermented foods)
  return '가공식품';
}

function registerKKimchiFoodProducts() {
  console.log('🔍 Registering 광주김치몰 food/agricultural products...');
  
  try {
    // Read existing products
    const existingProductsData = readFileSync('./src/data/products.json', 'utf-8');
    const existingProducts: Product[] = JSON.parse(existingProductsData);
    
    // Read scraped kkimchi products
    const scrapedData = readFileSync('./scripts/output/kkimchi-products.json', 'utf-8');
    const scrapedProducts: ScrapedProduct[] = JSON.parse(scrapedData);
    
    console.log(`📊 Total scraped products: ${scrapedProducts.length}`);
    
    // Remove all existing kkimchi products first
    const nonKKimchiProducts = existingProducts.filter(p => !p.id.startsWith('kkimchi-'));
    console.log(`📦 Non-kkimchi products in database: ${nonKKimchiProducts.length}`);
    console.log(`🗑️ Removing ${existingProducts.length - nonKKimchiProducts.length} existing kkimchi products`);
    
    // Process and add food products
    let addedCount = 0;
    let skippedCount = 0;
    let productsWithPrices = 0;
    let productsWithDiscounts = 0;
    let productsWithImages = 0;
    
    const mallInfo = {
      mallId: 'kkimchi',
      mallName: '광주김치몰',
      mallUrl: 'https://www.k-kimchi.kr',
      region: '광주광역시'
    };
    
    // Remove duplicates and filter valid products
    const uniqueProducts = new Map<string, ScrapedProduct>();
    scrapedProducts.forEach(product => {
      uniqueProducts.set(product.id, product);
    });
    
    Array.from(uniqueProducts.values()).forEach(scraped => {
      // Parse price
      const priceInfo = parseKimchiPrice(scraped.price);
      
      // Skip products without valid prices or titles
      if (priceInfo.price <= 0 || !scraped.title || scraped.title.trim() === '' || scraped.title === '(제목 없음)') {
        skippedCount++;
        console.log(`⏭️ Skipping ${scraped.id}: ${scraped.title || 'No title'} (no valid price or title)`);
        return;
      }
      
      if (priceInfo.price > 0) productsWithPrices++;
      if (priceInfo.originalPrice && priceInfo.originalPrice > priceInfo.price) productsWithDiscounts++;
      if (scraped.imageUrl && !scraped.imageUrl.includes('no_image')) productsWithImages++;
      
      // Create clean tags
      const tags = ['김치', '발효식품', '전통식품', '광주김치', scraped.category];
      
      const product: Product = {
        id: scraped.id,
        name: scraped.title,
        price: priceInfo.price,
        originalPrice: priceInfo.originalPrice,
        image: scraped.imageUrl,
        category: mapCategoryToStandard(scraped.category),
        region: '광주광역시',
        url: scraped.productUrl,
        description: scraped.title, // Use title as description
        tags: tags,
        isFeatured: false,
        isNew: false,
        mall: mallInfo
      };
      
      nonKKimchiProducts.push(product);
      addedCount++;
    });
    
    // Sort products by ID
    nonKKimchiProducts.sort((a, b) => a.id.localeCompare(b.id));
    
    // Write updated products back to file
    writeFileSync('./src/data/products.json', JSON.stringify(nonKKimchiProducts, null, 2));
    
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
        totalInDatabase: nonKKimchiProducts.length,
        kkimchiProductsOnly: nonKKimchiProducts.filter(p => p.id.startsWith('kkimchi-')).length
      },
      categories: {
        distribution: nonKKimchiProducts
          .filter(p => p.id.startsWith('kkimchi-'))
          .reduce((acc, p) => {
            acc[p.category] = (acc[p.category] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
      },
      dataQuality: {
        withPrices: productsWithPrices,
        withoutPrices: addedCount - productsWithPrices,
        withDiscounts: productsWithDiscounts,
        withImages: productsWithImages,
        averagePrice: addedCount > 0 
          ? Math.round(nonKKimchiProducts
              .filter(p => p.id.startsWith('kkimchi-'))
              .reduce((sum, p) => sum + p.price, 0) / addedCount)
          : 0
      },
      sampleProducts: nonKKimchiProducts
        .filter(p => p.id.startsWith('kkimchi-'))
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
    
    writeFileSync('./scripts/output/kkimchi-food-registration-summary.json', JSON.stringify(summary, null, 2));
    
    console.log('\n📊 Registration Summary:');
    console.log(`✅ Food products registered: ${addedCount}`);
    console.log(`⏭️ Products skipped (no price/title): ${skippedCount}`);
    console.log(`🔄 Duplicates removed: ${summary.scraping.duplicatesRemoved}`);
    console.log(`📦 Total products in database: ${nonKKimchiProducts.length}`);
    console.log(`🛒 광주김치몰 products in database: ${summary.products.kkimchiProductsOnly}`);
    console.log(`💰 Products with prices: ${productsWithPrices}`);
    console.log(`🏷️ Products with discounts: ${productsWithDiscounts}`);
    console.log(`🖼️ Products with images: ${productsWithImages}`);
    console.log(`💵 Average price: ₩${summary.dataQuality.averagePrice.toLocaleString()}`);
    
    console.log('\n📂 Category distribution:');
    Object.entries(summary.categories.distribution).forEach(([category, count]) => {
      console.log(`  ${category}: ${count} products`);
    });
    
  } catch (error) {
    console.error('❌ Error registering products:', error);
    
    // Save error for debugging
    const errorInfo = {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    };
    
    writeFileSync('./scripts/output/kkimchi-food-registration-error.json', JSON.stringify(errorInfo, null, 2));
  }
}

// Run the registration
registerKKimchiFoodProducts();