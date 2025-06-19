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

async function fetchRealProductImage(productUrl: string): Promise<string | null> {
  try {
    console.log(`  📄 Fetching: ${productUrl}`);
    
    const response = await axios.get(productUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
      },
      timeout: 15000
    });
    
    const $ = cheerio.load(response.data);
    
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
      '.thumb-image img',
      '.goods-view img',
      '#product-image img',
      '.product-photo img'
    ];
    
    for (const selector of imageSelectors) {
      const $img = $(selector).first();
      if ($img.length > 0) {
        let imgSrc = $img.attr('src') || $img.attr('data-src') || '';
        
        if (imgSrc) {
          // Make URL absolute if needed
          if (imgSrc.startsWith('//')) {
            imgSrc = 'https:' + imgSrc;
          } else if (imgSrc.startsWith('/')) {
            imgSrc = 'https://mall.ejeju.net' + imgSrc;
          } else if (!imgSrc.startsWith('http')) {
            imgSrc = 'https://mall.ejeju.net/' + imgSrc;
          }
          
          console.log(`    🖼️ Found image with selector "${selector}": ${imgSrc}`);
          return imgSrc;
        }
      }
    }
    
    // Try to find any image that looks like a product image
    console.log('    🔍 Looking for any product-like images...');
    const allImages = $('img').toArray();
    
    for (const img of allImages) {
      const $img = $(img);
      let src = $img.attr('src') || $img.attr('data-src') || '';
      const alt = $img.attr('alt') || '';
      
      if (src && (
        src.includes('goods') || 
        src.includes('product') || 
        src.includes('item') ||
        src.includes('_main') ||
        src.includes('_big') ||
        alt.includes('상품') ||
        (parseInt($img.attr('width') || '0') > 300) ||
        (parseInt($img.attr('height') || '0') > 300)
      )) {
        // Make URL absolute
        if (src.startsWith('//')) {
          src = 'https:' + src;
        } else if (src.startsWith('/')) {
          src = 'https://mall.ejeju.net' + src;
        } else if (!src.startsWith('http')) {
          src = 'https://mall.ejeju.net/' + src;
        }
        
        // Filter out icons and banners
        if (!src.includes('icon') && !src.includes('logo') && 
            !src.includes('banner') && !src.includes('button')) {
          console.log(`    🖼️ Found product image: ${src}`);
          return src;
        }
      }
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
  
  // Check which products still need real images
  const productsNeedingImages = jejuProducts.filter(p => 
    p.imageUrl.includes('unsplash.com') || 
    !p.imageUrl.includes('mall.ejeju.net/common/getImageWithMediaType')
  );
  
  console.log(`📷 ${productsNeedingImages.length} products still need real images`);
  
  // Process each product (limit to avoid overwhelming)
  for (let i = 0; i < Math.min(productsNeedingImages.length, 20); i++) {
    const product = productsNeedingImages[i];
    console.log(`\n${i + 1}/${Math.min(jejuProducts.length, 20)}. ${product.name}`);
    
    const realImageUrl = await fetchRealProductImage(product.productUrl);
    
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
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Save updated products
  await fs.writeFile(productsPath, JSON.stringify(updatedProducts, null, 2));
  
  // Create summary
  const summary = {
    totalProcessed: Math.min(jejuProducts.length, 20),
    successfulUpdates: successCount,
    failedUpdates: failCount,
    remainingToProcess: Math.max(0, jejuProducts.length - 20),
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
  
  if (summary.remainingToProcess > 0) {
    console.log(`\n⚠️ Note: ${summary.remainingToProcess} more products need processing.`);
    console.log('Run this script again to continue.');
  }
}

// Run the real image fetcher
fetchRealJejuImages().catch(console.error);