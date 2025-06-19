import axios from 'axios';
import * as cheerio from 'cheerio';
import { writeFileSync } from 'fs';
import * as https from 'https';

async function exploreOntongDaejeonCategories(): Promise<void> {
  const baseUrl = 'https://ontongdaejeon.ezwel.com';
  
  // Create HTTPS agent
  const httpsAgent = new https.Agent({
    rejectUnauthorized: false
  });

  // Common URLs for ezwel platform
  const categoryUrls = [
    '/onnuri/mall/goodsList?gnbCatCd=G0010001', // Food/농산물
    '/onnuri/mall/goodsList?gnbCatCd=G0010002', // Processed food/가공식품
    '/onnuri/mall/goodsList?gnbCatCd=G0010003', // Health food/건강식품
    '/onnuri/mall/goodsList?gnbCatCd=G0010004', // Beverages/음료
    '/onnuri/mall/goodsList?gnbCatCd=G0010005', // Traditional/전통식품
    '/onnuri/mall/goodsList', // All products
    '/cuser/goods/goodsList.ez', // Alternative URL structure
    '/onnuri/mall/categoryList', // Category listing
  ];

  console.log('🔍 Exploring 온통대전몰 categories...\n');

  for (const categoryPath of categoryUrls) {
    try {
      const fullUrl = `${baseUrl}${categoryPath}`;
      console.log(`📂 Checking: ${fullUrl}`);
      
      const response = await axios.get(fullUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
          'Referer': 'https://ontongdaejeon.ezwel.com/onnuri/main'
        },
        httpsAgent,
        timeout: 15000,
        maxRedirects: 5
      });

      if (response.status === 200) {
        const $ = cheerio.load(response.data);
        const title = $('title').text().trim();
        
        // Look for products
        const productSelectors = [
          '.goods_list li', '.product-item', '.item', 
          '[class*="goods"]', '[class*="product"]',
          '.ezwel-product', '.onnuri-product'
        ];
        
        let productCount = 0;
        for (const selector of productSelectors) {
          const count = $(selector).length;
          if (count > 0) {
            productCount = Math.max(productCount, count);
          }
        }

        console.log(`✅ Success! Title: ${title}, Products found: ${productCount}`);
        
        if (productCount > 0) {
          // Save the page for analysis
          const filename = categoryPath.replace(/[^a-zA-Z0-9]/g, '_');
          writeFileSync(`./scripts/output/ontongdaejeon${filename}.html`, response.data);
          console.log(`💾 Saved page as ontongdaejeon${filename}.html`);
        }
      } else {
        console.log(`❌ HTTP ${response.status}`);
      }
      
    } catch (error: any) {
      console.log(`❌ Error: ${error.message || error}`);
    }
    
    // Delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Try to find actual product detail URLs from the main page
  console.log('\n🔍 Looking for product detail URLs from main page...');
  
  try {
    const mainResponse = await axios.get(`${baseUrl}/onnuri/main`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      httpsAgent,
      timeout: 15000
    });

    const $ = cheerio.load(mainResponse.data);
    
    // Extract product IDs from onclick attributes
    const productIds: string[] = [];
    $('[onclick*="fn_goGoodsDetail"]').each((i, elem) => {
      const onclick = $(elem).attr('onclick');
      if (onclick) {
        const match = onclick.match(/fn_goGoodsDetail\('(\d+)'/);
        if (match) {
          productIds.push(match[1]);
        }
      }
    });

    console.log(`\n📦 Found ${productIds.length} product IDs`);
    if (productIds.length > 0) {
      console.log('Sample product IDs:', productIds.slice(0, 5));
      
      // Save product IDs for later use
      writeFileSync('./scripts/output/ontongdaejeon-product-ids.json', JSON.stringify(productIds, null, 2));
    }

  } catch (error) {
    console.error('Error extracting product IDs:', error);
  }
}

// Run exploration
exploreOntongDaejeonCategories().then(() => {
  console.log('\n✅ Exploration complete!');
}).catch(console.error);