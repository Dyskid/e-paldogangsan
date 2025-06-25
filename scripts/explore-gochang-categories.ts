import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

interface CategoryInfo {
  name: string;
  url: string;
  productCount?: number;
  products?: Array<{
    title: string;
    url: string;
    price?: string;
    image?: string;
  }>;
}

async function exploreGochangCategories() {
  console.log('🔍 Exploring 고창마켓 categories...');

  const baseUrl = 'https://noblegochang.com';
  
  // Main categories to test
  const categoriesToTest = [
    { name: '전체상품', url: 'https://noblegochang.com/category/전체상품/175/' },
    { name: '과일·채소', url: 'https://noblegochang.com/category/과일·채소/139/' },
    { name: '과일', url: 'https://noblegochang.com/category/과일/142/' },
    { name: '채소', url: 'https://noblegochang.com/category/채소/144/' },
    { name: '쌀·잡곡·견과', url: 'https://noblegochang.com/category/쌀·잡곡·견과/140/' },
    { name: '해산·수산·육류', url: 'https://noblegochang.com/category/해산·수산·육류/141/' },
    { name: '차·음료', url: 'https://noblegochang.com/category/차·음료/143/' },
    { name: '가공식품', url: 'https://noblegochang.com/category/가공식품/145/' },
    { name: '건강식품', url: 'https://noblegochang.com/category/건강식품/146/' }
  ];

  const results: CategoryInfo[] = [];
  
  for (const category of categoriesToTest) {
    try {
      console.log(`\n📂 Testing category: ${category.name}`);
      
      const response = await axios.get(category.url, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      
      // Find product listings
      const products: Array<{title: string, url: string, price?: string, image?: string}> = [];
      
      // Common selectors for product listings
      const productSelectors = [
        '.item', '.product', '.goods', '.prdItem', '.list-item',
        '.product-item', '.goods-item', '.item-inner', '.prd-item'
      ];
      
      let foundProducts = false;
      
      for (const selector of productSelectors) {
        const items = $(selector);
        if (items.length > 0) {
          console.log(`✅ Found ${items.length} products with selector: ${selector}`);
          
          items.slice(0, 5).each((_, element) => {
            const $el = $(element);
            
            // Extract title
            const titleSelectors = ['h3', 'h4', '.title', '.name', '.prd-name', 'a'];
            let title = '';
            for (const titleSel of titleSelectors) {
              const titleText = $el.find(titleSel).first().text().trim();
              if (titleText && titleText.length > 2) {
                title = titleText;
                break;
              }
            }
            
            // Extract URL
            const linkEl = $el.find('a').first();
            let url = linkEl.attr('href') || '';
            if (url && url.startsWith('/')) {
              url = baseUrl + url;
            }
            
            // Extract price
            const priceSelectors = ['.price', '.cost', '.amount', '.won', '.원'];
            let price = '';
            for (const priceSel of priceSelectors) {
              const priceText = $el.find(priceSel).text().trim();
              if (priceText && priceText.includes('원')) {
                price = priceText;
                break;
              }
            }
            
            // Extract image
            const imgEl = $el.find('img').first();
            let image = imgEl.attr('src') || imgEl.attr('data-src') || '';
            if (image && image.startsWith('/')) {
              image = baseUrl + image;
            }
            
            if (title && url) {
              products.push({ title, url, price, image });
            }
          });
          
          foundProducts = true;
          break;
        }
      }
      
      if (!foundProducts) {
        // Try to find products in a different way
        const allLinks = $('a[href*="/product/"]');
        console.log(`🔍 Found ${allLinks.length} product links`);
        
        allLinks.slice(0, 5).each((_, element) => {
          const $el = $(element);
          const title = $el.text().trim() || $el.find('img').attr('alt') || '';
          let url = $el.attr('href') || '';
          if (url && url.startsWith('/')) {
            url = baseUrl + url;
          }
          
          if (title && url && title.length > 2) {
            products.push({ title, url });
          }
        });
      }
      
      const categoryInfo: CategoryInfo = {
        name: category.name,
        url: category.url,
        productCount: products.length,
        products: products.slice(0, 3) // Keep only first 3 for display
      };
      
      results.push(categoryInfo);
      
      console.log(`   📊 Found ${products.length} products`);
      if (products.length > 0) {
        console.log(`   🔍 Sample: ${products[0].title}`);
      }
      
      // Small delay to be respectful
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ Error testing category ${category.name}:`, error.message);
      results.push({
        name: category.name,
        url: category.url,
        productCount: 0
      });
    }
  }
  
  // Test individual product page
  if (results.length > 0 && results[0].products && results[0].products.length > 0) {
    const testProduct = results[0].products[0];
    console.log(`\n🔍 Testing individual product page: ${testProduct.title}`);
    
    try {
      const response = await axios.get(testProduct.url, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      
      // Save sample product page
      const outputPath = path.join(__dirname, 'output');
      fs.writeFileSync(path.join(outputPath, 'gochang-product-sample.html'), response.data);
      
      console.log('✅ Product page loaded successfully');
    } catch (error) {
      console.error('❌ Error loading product page:', error.message);
    }
  }
  
  // Save results
  const outputPath = path.join(__dirname, 'output');
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }
  
  fs.writeFileSync(
    path.join(outputPath, 'gochang-categories-analysis.json'),
    JSON.stringify(results, null, 2)
  );
  
  console.log('\n📊 Category Analysis Summary:');
  results.forEach(result => {
    console.log(`   ${result.name}: ${result.productCount || 0} products`);
  });
  
  const totalProducts = results.reduce((sum, cat) => sum + (cat.productCount || 0), 0);
  console.log(`\n📈 Total products found: ${totalProducts}`);
  console.log(`📁 Analysis saved to: ${path.join(outputPath, 'gochang-categories-analysis.json')}`);
}

exploreGochangCategories().catch(console.error);