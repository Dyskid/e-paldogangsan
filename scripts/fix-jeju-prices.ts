import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import path from 'path';

interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  originalPrice?: string;
  imageUrl: string;
  productUrl: string;
  mallId: string;
  mallName: string;
  category: string;
  tags: string[];
  inStock: boolean;
  lastUpdated: string;
  createdAt: string;
}

interface PriceInfo {
  price?: string;
  originalPrice?: string;
  inStock?: boolean;
}

async function fetchProductPrice(url: string): Promise<PriceInfo | null> {
  try {
    console.log(`  📄 Fetching: ${url}`);
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      timeout: 15000,
      maxRedirects: 3
    });
    
    const $ = cheerio.load(response.data);
    
    // Try multiple selectors for price
    let priceText = '';
    const priceSelectors = [
      '.price',
      '.sell-price', 
      '.product-price',
      '#sellPrice',
      '.goods_price',
      '.sale-price',
      '.final-price',
      '.current-price',
      '.price-now',
      '.selling-price',
      'span[class*="price"]:not([class*="original"]):not([class*="consumer"])',
      '.price-area .price',
      '.goods-price .price'
    ];
    
    for (const selector of priceSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        priceText = element.text().trim();
        if (priceText && priceText.match(/\d/)) {
          console.log(`    💰 Found price with selector "${selector}": ${priceText}`);
          break;
        }
      }
    }
    
    // Try original price selectors
    let originalPriceText = '';
    const originalPriceSelectors = [
      '.consumer-price',
      '.original-price',
      '.market-price',
      '.list-price',
      '.before-price',
      '.regular-price',
      'span[class*="original"]',
      'span[class*="consumer"]',
      '.line-through',
      '.price-before'
    ];
    
    for (const selector of originalPriceSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        originalPriceText = element.text().trim();
        if (originalPriceText && originalPriceText.match(/\d/)) {
          console.log(`    🏷️  Found original price: ${originalPriceText}`);
          break;
        }
      }
    }
    
    // Check stock status
    const stockSelectors = ['.stock-status', '.sold-out', '.out-of-stock', '.soldout'];
    let inStock = true;
    for (const selector of stockSelectors) {
      const stockElement = $(selector);
      if (stockElement.length > 0) {
        const stockText = stockElement.text().trim();
        if (stockText.includes('품절') || stockText.includes('sold') || stockText.includes('재고없음')) {
          inStock = false;
          break;
        }
      }
    }
    
    // Clean and format prices
    let cleanPrice: string | undefined;
    let cleanOriginalPrice: string | undefined;
    
    if (priceText) {
      const priceNumbers = priceText.replace(/[^0-9]/g, '');
      if (priceNumbers && parseInt(priceNumbers) > 0) {
        cleanPrice = `${parseInt(priceNumbers).toLocaleString('ko-KR')}`;
      }
    }
    
    if (originalPriceText) {
      const originalNumbers = originalPriceText.replace(/[^0-9]/g, '');
      if (originalNumbers && parseInt(originalNumbers) > 0) {
        cleanOriginalPrice = `${parseInt(originalNumbers).toLocaleString('ko-KR')}`;
      }
    }
    
    if (cleanPrice || cleanOriginalPrice) {
      return {
        price: cleanPrice,
        originalPrice: cleanOriginalPrice,
        inStock
      };
    }
    
    console.log(`    ❌ No price found`);
    return null;
    
  } catch (error) {
    console.error(`    ❌ Error fetching ${url}:`, error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

async function fixJejuPrices() {
  console.log('🚀 Starting Jeju mall price correction...');
  
  // Read current products
  const productsPath = path.join(__dirname, '../src/data/products.json');
  const productsData = await fs.readFile(productsPath, 'utf-8');
  const products: Product[] = JSON.parse(productsData);
  
  // Find Jeju mall products with incorrect prices
  const jejuProductsWithBadPrices = products.filter(p => 
    p.mallId === 'mall_100_이제주몰' && (p.price === '0' || p.price === '가격문의')
  );
  
  console.log(`📦 Found ${jejuProductsWithBadPrices.length} Jeju products with incorrect prices`);
  
  const updatedProducts = [...products];
  let successCount = 0;
  let failCount = 0;
  
  // Process each product (limit to avoid overwhelming the server)
  for (let i = 0; i < Math.min(jejuProductsWithBadPrices.length, 20); i++) {
    const product = jejuProductsWithBadPrices[i];
    console.log(`\n${i + 1}/${Math.min(jejuProductsWithBadPrices.length, 20)}. ${product.name}`);
    
    const priceInfo = await fetchProductPrice(product.productUrl);
    
    if (priceInfo && priceInfo.price) {
      // Find the product in the main array and update it
      const productIndex = updatedProducts.findIndex(p => p.id === product.id);
      if (productIndex !== -1) {
        updatedProducts[productIndex] = {
          ...updatedProducts[productIndex],
          price: priceInfo.price,
          originalPrice: priceInfo.originalPrice,
          inStock: priceInfo.inStock ?? true,
          lastUpdated: new Date().toISOString()
        };
        
        console.log(`    ✅ Updated: ${priceInfo.price}원${priceInfo.originalPrice ? ` (was ${priceInfo.originalPrice}원)` : ''}`);
        successCount++;
      }
    } else {
      console.log(`    ⚠️  Could not get price, keeping existing`);
      failCount++;
    }
    
    // Small delay to be respectful to the server
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Save updated products
  await fs.writeFile(productsPath, JSON.stringify(updatedProducts, null, 2));
  
  // Create summary
  const summary = {
    totalProcessed: Math.min(jejuProductsWithBadPrices.length, 20),
    successfulUpdates: successCount,
    failedUpdates: failCount,
    remainingBadPrices: jejuProductsWithBadPrices.length - Math.min(jejuProductsWithBadPrices.length, 20),
    updatedAt: new Date().toISOString(),
    sampleUpdatedProducts: updatedProducts
      .filter(p => p.mallId === 'mall_100_이제주몰' && p.price !== '0' && p.price !== '가격문의')
      .slice(0, 5)
      .map(p => ({ name: p.name, price: p.price, originalPrice: p.originalPrice, url: p.productUrl }))
  };
  
  const summaryPath = path.join(__dirname, 'output/jeju-price-fix-summary.json');
  await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
  
  console.log('\n✅ Price correction complete!');
  console.log(`📊 Successfully updated: ${successCount} products`);
  console.log(`❌ Failed to update: ${failCount} products`);
  console.log(`📁 Updated products.json`);
  console.log(`📋 Summary saved to: ${summaryPath}`);
  
  if (summary.remainingBadPrices > 0) {
    console.log(`\n⚠️  Note: ${summary.remainingBadPrices} products still need price updates.`);
    console.log('Run this script again to continue updating more products.');
  }
}

// Run the price fixer
fixJejuPrices().catch(console.error);