import fs from 'fs';
import path from 'path';
import { Product } from '../src/types';

interface ScrapedProduct {
  id: string;
  title: string;
  price: string;
  image: string;
  url: string;
  category: string;
  mall: string;
  mallId: string;
}

async function registerYjmarketProducts() {
  const timestamp = Date.now();
  console.log('Starting 영주장날 product registration...');
  
  try {
    // Load scraped products
    const scrapedPath = path.join(process.cwd(), 'scripts/output/yjmarket-products.json');
    const scrapedProducts: ScrapedProduct[] = JSON.parse(fs.readFileSync(scrapedPath, 'utf-8'));
    
    console.log(`Found ${scrapedProducts.length} scraped products`);
    
    // Load existing products database
    const productsPath = path.join(process.cwd(), 'src/data/products.json');
    let existingProducts: Product[] = [];
    
    if (fs.existsSync(productsPath)) {
      existingProducts = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
      console.log(`Found ${existingProducts.length} existing products in database`);
    }
    
    // Create backup
    const backupPath = path.join(process.cwd(), `src/data/products-backup-${timestamp}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(existingProducts, null, 2));
    console.log(`Created backup at: ${backupPath}`);
    
    // Convert scraped products to the main product format
    const newProducts: Product[] = [];
    
    for (const scraped of scrapedProducts) {
      // Parse price to number (remove 원 and commas)
      let priceValue = 0;
      if (scraped.price) {
        const priceMatch = scraped.price.match(/[\d,]+/);
        if (priceMatch) {
          priceValue = parseInt(priceMatch[0].replace(/,/g, ''));
        }
      }
      
      // Only add products with valid prices
      if (priceValue > 0) {
        const product: Product = {
          id: scraped.id,
          title: scraped.title,
          price: scraped.price,
          image: scraped.image,
          url: scraped.url,
          category: scraped.category,
          mall: scraped.mall,
          mallId: scraped.mallId
        };
        
        newProducts.push(product);
      }
    }
    
    console.log(`${newProducts.length} products have valid prices`);
    
    // Remove existing products from the same mall
    const filteredExisting = existingProducts.filter(p => p.mallId !== 'yjmarket');
    console.log(`Removed ${existingProducts.length - filteredExisting.length} existing 영주장날 products`);
    
    // Combine products
    const allProducts = [...filteredExisting, ...newProducts];
    
    // Save updated products
    fs.writeFileSync(productsPath, JSON.stringify(allProducts, null, 2));
    console.log(`Total products after registration: ${allProducts.length}`);
    
    // Generate summary report
    const summary = {
      timestamp,
      mall: '영주장날',
      mallId: 'yjmarket',
      totalScraped: scrapedProducts.length,
      validProducts: newProducts.length,
      registered: newProducts.length,
      previousTotal: existingProducts.length,
      newTotal: allProducts.length,
      backup: backupPath,
      categoryCounts: newProducts.reduce((acc, p) => {
        acc[p.category] = (acc[p.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      sampleRegistered: newProducts.slice(0, 3).map(p => ({
        id: p.id,
        title: p.title,
        price: p.price,
        category: p.category
      }))
    };
    
    // Save summary
    const summaryPath = path.join(process.cwd(), 'scripts/output/yjmarket-registration-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    
    console.log('\n=== REGISTRATION SUMMARY ===');
    console.log(`Mall: ${summary.mall}`);
    console.log(`Products scraped: ${summary.totalScraped}`);
    console.log(`Products with valid prices: ${summary.validProducts}`);
    console.log(`Products registered: ${summary.registered}`);
    console.log(`Database size: ${summary.previousTotal} → ${summary.newTotal}`);
    console.log(`Backup created: ${summary.backup}`);
    
    console.log('\nCategory breakdown:');
    Object.entries(summary.categoryCounts).forEach(([category, count]) => {
      console.log(`  ${category}: ${count} products`);
    });
    
    console.log(`\nSummary saved: ${summaryPath}`);
    
  } catch (error) {
    console.error('Error during registration:', error);
    throw error;
  }
}

// Run the registration
registerYjmarketProducts().catch(console.error);