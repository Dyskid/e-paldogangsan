import puppeteer from 'puppeteer';
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

async function fetchRealProductImage(page: any, productUrl: string): Promise<string | null> {
  try {
    console.log(`  📄 Navigating to: ${productUrl}`);
    await page.goto(productUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Wait for images to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Try multiple selectors for product images
    const imageSelectors = [
      '.xans-product-image img.BigImage',
      '#prdDetail img',
      '.detail_image img',
      '.goods_photo img',
      '.product-detail-image img',
      '.item_photo_big img',
      '.detail-image img',
      '.goods-image img',
      'img.ProductImage0',
      '.prd-img img',
      '#goods_view img',
      '.product_image img',
      '.thumb-image img'
    ];
    
    for (const selector of imageSelectors) {
      try {
        const imageUrl = await page.$eval(selector, (img: HTMLImageElement) => {
          return img.src || img.getAttribute('data-src') || '';
        });
        
        if (imageUrl && imageUrl.includes('http')) {
          console.log(`    🖼️ Found image with selector "${selector}"`);
          return imageUrl;
        }
      } catch (e) {
        // Selector not found, try next
      }
    }
    
    // If no image found with specific selectors, try to find the largest image
    console.log('    🔍 Trying to find largest image on page...');
    const largestImage = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      let maxSize = 0;
      let largestSrc = '';
      
      images.forEach(img => {
        const width = img.naturalWidth || img.width || 0;
        const height = img.naturalHeight || img.height || 0;
        const size = width * height;
        
        // Filter out tiny images and icons
        if (size > maxSize && width > 200 && height > 200 && 
            img.src && !img.src.includes('icon') && !img.src.includes('logo') &&
            !img.src.includes('banner') && !img.src.includes('button')) {
          maxSize = size;
          largestSrc = img.src;
        }
      });
      
      return largestSrc;
    });
    
    if (largestImage) {
      console.log(`    🖼️ Found largest image: ${largestImage}`);
      return largestImage;
    }
    
    console.log(`    ❌ No suitable image found`);
    return null;
    
  } catch (error) {
    console.error(`    ❌ Error fetching product page:`, error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

async function fetchRealJejuImages() {
  console.log('🚀 Starting to fetch REAL images from Jeju mall...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Set user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Read current products
    const productsPath = path.join(__dirname, '../src/data/products.json');
    const productsData = await fs.readFile(productsPath, 'utf-8');
    const products: Product[] = JSON.parse(productsData);
    
    // Find Jeju mall products
    const jejuProducts = products.filter(p => p.mallId === 'mall_100_이제주몰');
    
    console.log(`📦 Found ${jejuProducts.length} Jeju products to update`);
    
    const updatedProducts = [...products];
    let successCount = 0;
    let failCount = 0;
    const imageUpdates: { [key: string]: string } = {};
    
    // Process each product
    for (let i = 0; i < jejuProducts.length; i++) {
      const product = jejuProducts[i];
      console.log(`\n${i + 1}/${jejuProducts.length}. ${product.name}`);
      
      const realImageUrl = await fetchRealProductImage(page, product.productUrl);
      
      if (realImageUrl) {
        // Update the product in the main array
        const productIndex = updatedProducts.findIndex(p => p.id === product.id);
        if (productIndex !== -1) {
          updatedProducts[productIndex] = {
            ...updatedProducts[productIndex],
            imageUrl: realImageUrl,
            lastUpdated: new Date().toISOString()
          };
          
          imageUpdates[product.id] = realImageUrl;
          console.log(`    ✅ Updated with real image`);
          successCount++;
        }
      } else {
        console.log(`    ⚠️ Could not fetch real image`);
        failCount++;
      }
      
      // Small delay between requests to be respectful
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // Save updated products
    await fs.writeFile(productsPath, JSON.stringify(updatedProducts, null, 2));
    
    // Create summary
    const summary = {
      totalProcessed: jejuProducts.length,
      successfulUpdates: successCount,
      failedUpdates: failCount,
      updatedAt: new Date().toISOString(),
      imageUpdates,
      sampleUpdatedProducts: Object.entries(imageUpdates).slice(0, 5).map(([id, imageUrl]) => {
        const product = updatedProducts.find(p => p.id === id);
        return {
          id,
          name: product?.name,
          imageUrl,
          productUrl: product?.productUrl
        };
      })
    };
    
    const summaryPath = path.join(__dirname, 'output/jeju-real-images-summary.json');
    await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
    
    console.log('\n✅ Image fetching complete!');
    console.log(`📊 Successfully updated: ${successCount} product images`);
    console.log(`❌ Failed to update: ${failCount} images`);
    console.log(`📁 Updated products.json`);
    console.log(`📋 Summary saved to: ${summaryPath}`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await browser.close();
  }
}

// Run the real image fetcher
fetchRealJejuImages().catch(console.error);