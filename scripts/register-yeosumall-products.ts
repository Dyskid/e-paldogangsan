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

async function registerYeosuMallProducts() {
  try {
    console.log('🚀 Starting Yeosu Mall product registration...');

    const outputDir = path.join(process.cwd(), 'scripts', 'output');
    const scrapedProductsPath = path.join(outputDir, 'yeosumall-products.json');
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

    // Remove any existing Yeosu Mall products first (in case of re-registration)
    const nonYeosuProducts = existingProducts.filter(p => p.mall !== '여수몰');
    const removedCount = existingProducts.length - nonYeosuProducts.length;
    
    if (removedCount > 0) {
      console.log(`🗑️  Removed ${removedCount} existing Yeosu Mall products for re-registration`);
    }

    const existingUrls = new Set(nonYeosuProducts.map(p => p.url));
    const newProducts: Product[] = [];
    let duplicateCount = 0;
    let errorCount = 0;

    for (const scraped of scrapedProducts) {
      try {
        if (existingUrls.has(scraped.url)) {
          duplicateCount++;
          continue;
        }

        const cleanPrice = scraped.price.replace(/[^\d]/g, '');
        if (!cleanPrice || parseInt(cleanPrice) === 0) {
          console.log(`⚠️  Skipping product with invalid price: ${scraped.title}`);
          errorCount++;
          continue;
        }

        const product: Product = {
          id: scraped.id,
          title: scraped.title,
          price: parseInt(cleanPrice),
          image: scraped.image,
          mall: '여수몰',
          url: scraped.url,
          category: scraped.category || '농산물',
          tags: scraped.tags || ['농산물', '전남', '여수'],
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

    const updatedProducts = [...nonYeosuProducts, ...newProducts];
    
    const backupPath = path.join(process.cwd(), 'src', 'data', `products-backup-${Date.now()}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(existingProducts, null, 2));
    console.log(`💾 Created backup: ${path.basename(backupPath)}`);

    fs.writeFileSync(productsPath, JSON.stringify(updatedProducts, null, 2));
    console.log(`✅ Updated products.json with ${newProducts.length} new products`);

    const summary = {
      timestamp: new Date().toISOString(),
      mall: '여수몰',
      scraped: scrapedProducts.length,
      new: newProducts.length,
      duplicates: duplicateCount,
      errors: errorCount,
      removed: removedCount,
      totalProducts: updatedProducts.length,
      isTemplateData: true,
      note: 'Template/mock products registered due to site accessibility issues',
      sampleProducts: newProducts.slice(0, 5).map(p => ({
        title: p.title,
        price: p.price,
        category: p.category
      }))
    };

    const summaryPath = path.join(outputDir, 'yeosumall-registration-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log(`📋 Registration summary saved to ${path.basename(summaryPath)}`);

    console.log(`🎉 Successfully registered ${newProducts.length} products from Yeosu Mall!`);
    
    if (summary.isTemplateData) {
      console.log('');
      console.log('📝 Note: These are template/mock products created due to site accessibility issues.');
      console.log('   Update with real products when the site becomes accessible.');
    }

  } catch (error) {
    console.error('❌ Registration failed:', error);
    process.exit(1);
  }
}

registerYeosuMallProducts();