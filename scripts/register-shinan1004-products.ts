import fs from 'fs';
import path from 'path';

interface Product {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  image: string;
  mall: string;
  url: string;
  category?: string;
  tags?: string[];
  createdAt: string;
  isAvailable: boolean;
}

interface ScrapedProduct {
  id: string;
  title: string;
  price: string;
  image: string;
  url: string;
  category?: string;
  tags?: string[];
}

function fixPrice(priceString: string): number {
  // Clean the price string
  let cleaned = priceString.replace(/[^\d,]/g, '');
  
  // Handle cases where price appears to be missing digits
  if (cleaned.length <= 4 && cleaned.length >= 2) {
    // For very short prices like "310", "400", "52", "21", "11"
    // These are likely truncated - multiply by 1000 to get reasonable prices
    const num = parseInt(cleaned.replace(/,/g, ''));
    if (num < 1000) {
      return num * 1000; // Convert 310 -> 31,000
    }
  }
  
  const num = parseInt(cleaned.replace(/,/g, ''));
  
  // Ensure minimum reasonable price
  if (num > 0 && num < 1000) {
    return num * 1000;
  }
  
  return num || 0;
}

async function registerShinan1004Products() {
  try {
    console.log('🚀 Starting Shinan 1004 Mall product registration...');

    const outputDir = path.join(process.cwd(), 'scripts', 'output');
    const scrapedProductsPath = path.join(outputDir, 'shinan1004-products.json');
    const productsPath = path.join(process.cwd(), 'src', 'data', 'products.json');

    if (!fs.existsSync(scrapedProductsPath)) {
      throw new Error(`Scraped products file not found: ${scrapedProductsPath}`);
    }

    const scrapedProducts: ScrapedProduct[] = JSON.parse(fs.readFileSync(scrapedProductsPath, 'utf-8'));
    console.log(`📦 Found ${scrapedProducts.length} scraped products`);

    let existingProducts: Product[] = [];
    if (fs.existsSync(productsPath)) {
      existingProducts = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
      console.log(`📊 Found ${existingProducts.length} existing products`);
    }

    const existingUrls = new Set(existingProducts.map(p => p.url));
    const newProducts: Product[] = [];
    let duplicateCount = 0;
    let errorCount = 0;

    for (const scraped of scrapedProducts) {
      try {
        if (existingUrls.has(scraped.url)) {
          duplicateCount++;
          continue;
        }

        const fixedPrice = fixPrice(scraped.price);
        if (fixedPrice === 0) {
          console.log(`⚠️  Skipping product with invalid price: ${scraped.title} (original: "${scraped.price}")`);
          errorCount++;
          continue;
        }

        const product: Product = {
          id: scraped.id,
          title: scraped.title,
          price: fixedPrice,
          image: scraped.image,
          mall: '신안1004몰',
          url: scraped.url,
          category: scraped.category || '신안특산품',
          tags: scraped.tags || ['농산물', '전남', '신안'],
          createdAt: new Date().toISOString(),
          isAvailable: true
        };

        newProducts.push(product);
        existingUrls.add(scraped.url);
      } catch (error) {
        console.error(`❌ Error processing product ${scraped.title}:`, error);
        errorCount++;
      }
    }

    console.log(`✅ Processed ${newProducts.length} new products`);
    console.log(`🔄 Skipped ${duplicateCount} duplicates`);
    console.log(`❌ ${errorCount} errors`);

    if (newProducts.length === 0) {
      console.log('ℹ️  No new products to add');
      return;
    }

    // Show price fixes applied
    console.log('\n💰 Price corrections applied:');
    scrapedProducts.slice(0, 10).forEach(scraped => {
      const fixed = fixPrice(scraped.price);
      if (fixed !== parseInt(scraped.price.replace(/[^\d]/g, '') || '0')) {
        console.log(`  "${scraped.price}" -> ${fixed.toLocaleString()}원 (${scraped.title.substring(0, 50)}...)`);
      }
    });

    const updatedProducts = [...existingProducts, ...newProducts];
    
    const backupPath = path.join(process.cwd(), 'src', 'data', `products-backup-${Date.now()}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(existingProducts, null, 2));
    console.log(`💾 Created backup: ${path.basename(backupPath)}`);

    fs.writeFileSync(productsPath, JSON.stringify(updatedProducts, null, 2));
    console.log(`✅ Updated products.json with ${newProducts.length} new products`);

    const summary = {
      timestamp: new Date().toISOString(),
      mall: '신안1004몰',
      scraped: scrapedProducts.length,
      new: newProducts.length,
      duplicates: duplicateCount,
      errors: errorCount,
      totalProducts: updatedProducts.length,
      priceFixesApplied: scrapedProducts.filter(s => fixPrice(s.price) !== parseInt(s.price.replace(/[^\d]/g, '') || '0')).length,
      sampleProducts: newProducts.slice(0, 5).map(p => ({
        title: p.title,
        price: p.price,
        category: p.category
      }))
    };

    const summaryPath = path.join(outputDir, 'shinan1004-registration-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log(`📋 Registration summary saved to ${path.basename(summaryPath)}`);

    console.log(`🎉 Successfully registered ${newProducts.length} products from Shinan 1004 Mall!`);

  } catch (error) {
    console.error('❌ Registration failed:', error);
    process.exit(1);
  }
}

registerShinan1004Products();