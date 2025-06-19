import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import path from 'path';

interface JejuProduct {
  id: string;
  name: string;
  price: string;
  imageUrl: string;
  productUrl: string;
  category: string;
  seller: string;
  description: string;
  tags: string[];
  originalPrice?: string;
  discountRate?: string;
}

// Category mappings based on Jeju mall's category codes
const categoryMap: Record<string, string> = {
  '22': '농산품',
  '23': '수산품', 
  '24': '축산품',
  '25': '가공식품',
  '26': '건강식품',
  '27': '전통식품',
  '28': '공예품',
  '29': '화장품',
  '30': '생활용품',
  '31': '반려동물용품'
};

async function scrapeAllJejuProducts() {
  const allProducts: JejuProduct[] = [];
  const errors: string[] = [];
  
  console.log('🚀 Starting comprehensive Jeju mall product scrape...');
  
  try {
    // Try multiple approaches to get products
    
    // 1. Scrape from category pages
    for (const [categoryCode, categoryName] of Object.entries(categoryMap)) {
      console.log(`\n📂 Scraping category: ${categoryName} (code: ${categoryCode})`);
      
      try {
        // Try multiple page numbers
        for (let page = 1; page <= 5; page++) {
          const url = `https://mall.ejeju.net/goods/list.do?cate=${categoryCode}&page=${page}`;
          console.log(`  📄 Page ${page}: ${url}`);
          
          const response = await axios.get(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 10000
          });
          
          const $ = cheerio.load(response.data);
          let productsFound = 0;
          
          // Look for product items
          $('.goods-list li, .product-item, .item').each((_, element) => {
            try {
              const $item = $(element);
              
              // Extract product URL and ID
              const productLink = $item.find('a').first().attr('href');
              if (!productLink) return;
              
              const gnoMatch = productLink.match(/gno=(\d+)/);
              if (!gnoMatch) return;
              
              const productId = gnoMatch[1];
              const productUrl = `https://mall.ejeju.net/goods/detail.do?gno=${productId}`;
              
              // Extract product details
              const name = $item.find('.name, .goods-name, .title').text().trim() || 
                         $item.find('a').attr('title')?.trim() || '';
              
              if (!name) return;
              
              // Extract price
              const priceText = $item.find('.price, .sell-price').text().trim();
              const price = priceText.replace(/[^0-9]/g, '') + '원';
              
              // Extract original price if discounted
              const originalPriceText = $item.find('.consumer-price, .original-price').text().trim();
              const originalPrice = originalPriceText ? 
                originalPriceText.replace(/[^0-9]/g, '') + '원' : undefined;
              
              // Extract image
              const imageUrl = $item.find('img').first().attr('src') || '';
              const fullImageUrl = imageUrl.startsWith('http') ? 
                imageUrl : `https://mall.ejeju.net${imageUrl}`;
              
              // Calculate discount if applicable
              let discountRate: string | undefined;
              if (originalPrice && price) {
                const priceNum = parseInt(price.replace(/[^0-9]/g, ''));
                const originalNum = parseInt(originalPrice.replace(/[^0-9]/g, ''));
                if (originalNum > priceNum) {
                  discountRate = Math.round((1 - priceNum / originalNum) * 100) + '%';
                }
              }
              
              const product: JejuProduct = {
                id: `jeju_${productId}`,
                name,
                price,
                imageUrl: fullImageUrl,
                productUrl,
                category: categoryName,
                seller: '제주몰',
                description: `${categoryName} - ${name}`,
                tags: ['제주', '제주도', 'jeju', categoryName],
                originalPrice,
                discountRate
              };
              
              // Add specific tags based on product name
              if (name.includes('한라봉')) product.tags.push('한라봉');
              if (name.includes('감귤')) product.tags.push('감귤');
              if (name.includes('흑돼지')) product.tags.push('흑돼지');
              if (name.includes('선물')) product.tags.push('선물세트');
              
              allProducts.push(product);
              productsFound++;
            } catch (err) {
              console.error('    ❌ Error parsing product:', err);
            }
          });
          
          console.log(`    ✅ Found ${productsFound} products`);
          
          // If no products found, stop pagination
          if (productsFound === 0) break;
          
          // Small delay between requests
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (err) {
        console.error(`  ❌ Error scraping category ${categoryName}:`, err);
        errors.push(`Category ${categoryName}: ${err}`);
      }
    }
    
    // 2. Try scraping from main product listing page
    console.log('\n📋 Trying main product listing...');
    try {
      const mainUrl = 'https://mall.ejeju.net/goods/list.do';
      const response = await axios.get(mainUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      $('.goods-list li').each((_, element) => {
        // Similar parsing logic as above
        // ... (omitted for brevity, same as category parsing)
      });
    } catch (err) {
      console.error('❌ Error scraping main listing:', err);
    }
    
    // Remove duplicates
    const uniqueProducts = Array.from(
      new Map(allProducts.map(p => [p.id, p])).values()
    );
    
    // Save results
    const outputDir = path.join(__dirname, 'output');
    await fs.mkdir(outputDir, { recursive: true });
    
    await fs.writeFile(
      path.join(outputDir, 'jeju-mall-all-products.json'),
      JSON.stringify(uniqueProducts, null, 2)
    );
    
    // Save summary
    const summary = {
      totalProducts: uniqueProducts.length,
      byCategory: Object.entries(
        uniqueProducts.reduce((acc, p) => {
          acc[p.category] = (acc[p.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      ),
      scrapedAt: new Date().toISOString(),
      errors: errors.length > 0 ? errors : undefined
    };
    
    await fs.writeFile(
      path.join(outputDir, 'jeju-mall-scrape-summary-full.json'),
      JSON.stringify(summary, null, 2)
    );
    
    console.log('\n✅ Scraping complete!');
    console.log(`📊 Total unique products: ${uniqueProducts.length}`);
    console.log('\n📈 Products by category:');
    summary.byCategory.forEach(([cat, count]) => {
      console.log(`  - ${cat}: ${count}`);
    });
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

// Run the scraper
scrapeAllJejuProducts();