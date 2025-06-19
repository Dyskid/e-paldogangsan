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

async function testImageURL(url: string): Promise<boolean> {
  try {
    const response = await axios.head(url, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

async function fetchImageFromProductPage(productUrl: string): Promise<string | null> {
  try {
    console.log(`  📄 Fetching product page: ${productUrl}`);
    
    const response = await axios.get(productUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
      },
      timeout: 10000
    });
    
    const $ = cheerio.load(response.data);
    
    // Try multiple selectors for product images
    const imageSelectors = [
      '.product-image img',
      '.goods-image img',
      '.main-image img',
      '.product-photo img',
      '#productImage',
      '.goods-photo img',
      'img[src*="main.jpg"]',
      'img[src*="_main"]',
      '.detail-image img',
      '.thumb img'
    ];
    
    for (const selector of imageSelectors) {
      const imgElement = $(selector).first();
      if (imgElement.length > 0) {
        let imgSrc = imgElement.attr('src') || imgElement.attr('data-src');
        if (imgSrc) {
          // Make sure URL is absolute
          if (imgSrc.startsWith('/')) {
            imgSrc = `https://mall.ejeju.net${imgSrc}`;
          } else if (!imgSrc.startsWith('http')) {
            imgSrc = `https://mall.ejeju.net/${imgSrc}`;
          }
          
          console.log(`    🖼️ Found image with "${selector}": ${imgSrc}`);
          
          // Test if the image is accessible
          const isAccessible = await testImageURL(imgSrc);
          if (isAccessible) {
            console.log(`    ✅ Image is accessible`);
            return imgSrc;
          } else {
            console.log(`    ❌ Image not accessible`);
          }
        }
      }
    }
    
    console.log(`    ❌ No valid image found`);
    return null;
    
  } catch (error) {
    console.error(`    ❌ Error fetching product page:`, error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

async function fixJejuImages() {
  console.log('🖼️ Starting Jeju mall image URL correction...');
  
  // Read current products
  const productsPath = path.join(__dirname, '../src/data/products.json');
  const productsData = await fs.readFile(productsPath, 'utf-8');
  const products: Product[] = JSON.parse(productsData);
  
  // Find Jeju mall products
  const jejuProducts = products.filter(p => p.mallId === 'mall_100_이제주몰');
  
  console.log(`📦 Found ${jejuProducts.length} Jeju products to check`);
  
  const updatedProducts = [...products];
  let successCount = 0;
  let failCount = 0;
  
  // Test and fix image URLs for each product
  for (let i = 0; i < Math.min(jejuProducts.length, 10); i++) {
    const product = jejuProducts[i];
    console.log(`\n${i + 1}/${Math.min(jejuProducts.length, 10)}. ${product.name}`);
    console.log(`  Current image: ${product.imageUrl}`);
    
    // First, test if current image URL works
    const currentImageWorks = await testImageURL(product.imageUrl);
    
    if (currentImageWorks) {
      console.log(`  ✅ Current image URL works fine`);
      successCount++;
      continue;
    }
    
    console.log(`  ❌ Current image URL not accessible`);
    
    // Try to get the correct image URL from the product page
    const newImageUrl = await fetchImageFromProductPage(product.productUrl);
    
    if (newImageUrl) {
      // Update the product in the main array
      const productIndex = updatedProducts.findIndex(p => p.id === product.id);
      if (productIndex !== -1) {
        updatedProducts[productIndex] = {
          ...updatedProducts[productIndex],
          imageUrl: newImageUrl,
          lastUpdated: new Date().toISOString()
        };
        
        console.log(`    ✅ Updated image URL: ${newImageUrl}`);
        successCount++;
      }
    } else {
      console.log(`    ⚠️ Could not find working image, keeping original`);
      failCount++;
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Save updated products
  await fs.writeFile(productsPath, JSON.stringify(updatedProducts, null, 2));
  
  // Create summary
  const summary = {
    totalProcessed: Math.min(jejuProducts.length, 10),
    successfulFixes: successCount,
    failedFixes: failCount,
    updatedAt: new Date().toISOString(),
    sampleWorkingImages: updatedProducts
      .filter(p => p.mallId === 'mall_100_이제주몰')
      .slice(0, 5)
      .map(p => ({ name: p.name, imageUrl: p.imageUrl, productUrl: p.productUrl }))
  };
  
  const summaryPath = path.join(__dirname, 'output/jeju-image-fix-summary.json');
  await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
  
  console.log('\n✅ Image correction complete!');
  console.log(`📊 Successfully verified/updated: ${successCount} images`);
  console.log(`❌ Failed to fix: ${failCount} images`);
  console.log(`📁 Updated products.json`);
  console.log(`📋 Summary saved to: ${summaryPath}`);
  
  if (jejuProducts.length > 10) {
    console.log(`\n⚠️ Note: ${jejuProducts.length - 10} more products need image verification.`);
    console.log('Run this script again to continue checking more products.');
  }
}

// Run the image fixer
fixJejuImages().catch(console.error);