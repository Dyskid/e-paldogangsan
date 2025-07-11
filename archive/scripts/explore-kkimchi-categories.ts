import axios from 'axios';
import * as cheerio from 'cheerio';
import { writeFileSync } from 'fs';
import * as https from 'https';

async function exploreKkimchiCategories(): Promise<void> {
  const baseUrl = 'https://www.k-kimchi.kr';
  
  // Create HTTPS agent
  const httpsAgent = new https.Agent({
    rejectUnauthorized: false
  });
  
  // Category URLs based on the analysis
  const categoryUrls = [
    '/index.php?cate=005', // Main product category likely
    '/index.php?cate=005001', // Sub-category
    '/index.php?cate=005002',
    '/index.php?cate=005003',
    '/index.php?cate=005004',
    '/index.php?cate=005005',
    '/index.php?cate=004', // Maybe another product category
    '/index.php?cate=004001',
    '/index.php?cate=006', // Maybe another product category
    '/index.php?cate=006001'
  ];

  console.log('🔍 Exploring 광주김치몰 categories...');

  const foundCategories: { url: string; name: string; productCount: number }[] = [];

  for (const testPath of categoryUrls) {
    try {
      const testUrl = `${baseUrl}${testPath}`;
      console.log(`\n🧪 Testing: ${testUrl}`);
      
      const response = await axios.get(testUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8'
        },
        httpsAgent,
        timeout: 15000,
        validateStatus: function (status) {
          return status < 500;
        }
      });

      if (response.status === 200) {
        const $ = cheerio.load(response.data);
        const title = $('title').text().trim();
        console.log(`📋 Title: ${title}`);
        
        // Look for product listings
        const productLinks = $('a[href*="type=view"], a[href*="goods_detail"], a[href*="product_detail"]');
        const productCount = productLinks.length;
        
        if (productCount > 0) {
          console.log(`🎯 Found ${productCount} product links!`);
          
          // Extract category name
          const categoryName = $('.page_title, .category_title, h2, .title').first().text().trim() || 
                             $('nav .active, .breadcrumb .active').last().text().trim() || 
                             'Unknown Category';
          
          foundCategories.push({
            url: testPath,
            name: categoryName,
            productCount: productCount
          });
          
          // Save the page for analysis
          writeFileSync(`./scripts/output/kkimchi-category-${testPath.replace(/[\/\\?=]/g, '_')}.html`, response.data);
          
          // Show sample products
          console.log('📦 Sample products:');
          productLinks.slice(0, 5).each((i, elem) => {
            const $elem = $(elem);
            const href = $elem.attr('href');
            const text = $elem.text().trim() || $elem.find('img').attr('alt') || 'No text';
            console.log(`  ${i + 1}. ${text.substring(0, 40)}...`);
            if (href) {
              console.log(`     → ${href}`);
            }
          });
          
          // Look for pagination
          const paginationLinks = $('a[href*="page="], .pagination a, .paging a');
          if (paginationLinks.length > 0) {
            console.log(`📄 Found pagination (${paginationLinks.length} links)`);
          }
        } else {
          console.log('⚠️ No products found on this page');
          
          // Look for sub-category links
          const subCategoryLinks = $('a[href*="cate=005"], a[href*="cate=004"], a[href*="cate=006"]');
          if (subCategoryLinks.length > 0) {
            console.log(`📂 Found ${subCategoryLinks.length} sub-category links`);
            subCategoryLinks.slice(0, 5).each((i, elem) => {
              const href = $(elem).attr('href');
              const text = $(elem).text().trim();
              if (href && text) {
                console.log(`  - ${text}: ${href}`);
              }
            });
          }
        }
      } else {
        console.log(`❌ HTTP ${response.status}`);
      }
      
      // Delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.log(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  console.log('\n📊 Summary of found categories:');
  if (foundCategories.length > 0) {
    console.log('✅ Categories with products:');
    foundCategories.forEach(cat => {
      console.log(`  - ${cat.name} (${cat.url}): ${cat.productCount} products`);
    });
  } else {
    console.log('⚠️ No categories with products found');
  }
  
  console.log('\n✅ Category exploration complete!');
}

// Run exploration
exploreKkimchiCategories().then(() => {
  console.log('Done!');
}).catch(console.error);