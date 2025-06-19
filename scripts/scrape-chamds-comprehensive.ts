import axios from 'axios';
import * as cheerio from 'cheerio';
import { writeFileSync } from 'fs';

interface Product {
  id: string;
  title: string;
  description: string;
  price: string;
  originalPrice?: string;
  imageUrl: string;
  productUrl: string;
  category: string;
  mallId: string;
  mallName: string;
  region: string;
  tags: string[];
}

interface Category {
  id: string;
  name: string;
  url: string;
}

async function scrapeChamdsComprehensive(): Promise<void> {
  const baseUrl = 'https://chamds.com';
  const mallInfo = {
    id: 'chamds',
    name: '참달성',
    region: '대구광역시',
    tags: ['농특산물', '영농조합법인', '달성군', '유기농', '차', '음료']
  };

  // Categories found from exploration
  const categories: Category[] = [
    { id: '23', name: '음료', url: '/product/list.html?cate_no=23' },
    { id: '24', name: '차', url: '/product/list.html?cate_no=24' },
    { id: '83', name: '분말가루', url: '/product/list.html?cate_no=83' },
    { id: '84', name: '가공식품', url: '/product/list.html?cate_no=84' }
  ];

  const allProducts: Product[] = [];
  let totalErrors = 0;

  console.log('🔍 Starting comprehensive scraping of 참달성...');
  console.log(`📂 Scraping ${categories.length} categories`);

  for (const category of categories) {
    try {
      console.log(`\n🔍 Scraping category: ${category.name}...`);
      
      const categoryUrl = `${baseUrl}${category.url}`;
      const response = await axios.get(categoryUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8'
        },
        timeout: 20000
      });

      if (response.status === 200) {
        const $ = cheerio.load(response.data);
        
        // Extract products using Cafe24 structure
        const products = await scrapeProductsFromPage($, category, mallInfo, baseUrl);
        
        allProducts.push(...products);
        console.log(`✅ Found ${products.length} products in ${category.name}`);
        
        if (products.length > 0) {
          console.log('📦 Sample products:');
          products.slice(0, 3).forEach((product, index) => {
            console.log(`  ${index + 1}. ${product.title.substring(0, 40)}...`);
          });
        }
      } else {
        console.log(`❌ HTTP ${response.status} for ${category.name}`);
        totalErrors++;
      }

      // Delay between categories
      await new Promise(resolve => setTimeout(resolve, 1500));

    } catch (error) {
      console.log(`❌ Error scraping ${category.name}: ${error}`);
      totalErrors++;
    }
  }

  // Remove duplicates based on product URL
  const uniqueProducts = allProducts.filter((product, index, self) => 
    index === self.findIndex(p => p.productUrl === product.productUrl)
  );

  // Save results
  writeFileSync('./scripts/output/chamds-products.json', JSON.stringify(uniqueProducts, null, 2));
  writeFileSync('./scripts/output/chamds-scrape-summary.json', JSON.stringify({
    totalProducts: uniqueProducts.length,
    totalCategories: categories.length,
    errors: totalErrors,
    categories: categories.map(cat => cat.name),
    timestamp: new Date().toISOString()
  }, null, 2));

  console.log('\n📊 Scraping Summary:');
  console.log(`✅ Total products scraped: ${uniqueProducts.length}`);
  console.log(`📂 Categories processed: ${categories.length}`);
  console.log(`❌ Errors encountered: ${totalErrors}`);
  console.log(`📋 Categories: ${categories.map(c => c.name).join(', ')}`);
}

async function scrapeProductsFromPage($: cheerio.CheerioAPI, category: Category, mallInfo: any, baseUrl: string): Promise<Product[]> {
  const products: Product[] = [];
  
  // Find product list - use the selector that worked in exploration
  const productElements = $('.prdList li');
  
  if (productElements.length === 0) {
    console.log('⚠️ No products found with .prdList li selector');
    return products;
  }

  productElements.each((index, element) => {
    try {
      const $product = $(element);
      
      // Extract product link
      const productLink = $product.find('a').first();
      const productUrlPath = productLink.attr('href');
      
      if (!productUrlPath) {
        console.log(`⚠️ No product URL found for item ${index}`);
        return;
      }

      const productUrl = productUrlPath.startsWith('http') ? productUrlPath : `${baseUrl}${productUrlPath}`;
      
      // Extract product ID from URL
      const productIdMatch = productUrlPath.match(/product_no=(\d+)/);
      const productId = productIdMatch ? productIdMatch[1] : `chamds-${category.id}-${index}`;

      // Extract product title
      let title = '';
      
      // Try different ways to get the title
      const titleSelectors = [
        '.name',
        '.title',
        '.prdName',
        'strong',
        '.description strong',
        'a[title]'
      ];
      
      for (const selector of titleSelectors) {
        const titleElement = $product.find(selector);
        if (titleElement.length > 0) {
          title = titleElement.text().trim();
          if (title) break;
        }
      }
      
      // If still no title, try to extract from the link title attribute
      if (!title) {
        title = productLink.attr('title') || '';
      }
      
      // Clean up title (remove redundant text)
      title = title.replace(/상품명\s*:\s*/g, '').replace(/판매가\s*:\s*/g, '').trim();
      
      // Extract image URL
      const imageElement = $product.find('img').first();
      let imageUrl = imageElement.attr('src') || '';
      if (imageUrl && !imageUrl.startsWith('http')) {
        imageUrl = imageUrl.startsWith('/') ? `${baseUrl}${imageUrl}` : `${baseUrl}/${imageUrl}`;
      }

      // Extract price
      const priceSelectors = ['.price', '.cost', '.won', '.money'];
      let price = '';
      
      for (const selector of priceSelectors) {
        const priceElement = $product.find(selector);
        if (priceElement.length > 0) {
          price = priceElement.text().trim();
          if (price) break;
        }
      }
      
      // Clean up price
      price = price.replace(/판매가\s*:\s*/g, '').trim();

      // Extract description (if available)
      const description = $product.find('.description, .summary, .brief').text().trim();

      // Skip if essential data is missing
      if (!title && !productId) {
        console.log(`⚠️ Skipping product ${index} due to missing essential data`);
        return;
      }

      const product: Product = {
        id: `chamds-${productId}`,
        title: title || `참달성 제품 ${productId}`,
        description: description,
        price: price,
        imageUrl: imageUrl,
        productUrl: productUrl,
        category: category.name,
        mallId: mallInfo.id,
        mallName: mallInfo.name,
        region: mallInfo.region,
        tags: [...mallInfo.tags, category.name]
      };

      products.push(product);
      
    } catch (error) {
      console.log(`⚠️ Error parsing product ${index}: ${error}`);
    }
  });

  return products;
}

// Run the comprehensive scraper
scrapeChamdsComprehensive().then(() => {
  console.log('✅ 참달성 comprehensive scraping completed!');
}).catch(console.error);