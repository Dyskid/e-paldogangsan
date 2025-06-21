import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

async function testGwdMallPage() {
  console.log('🔍 Testing GWDMall page structure...');
  
  try {
    // Test homepage first
    console.log('Testing homepage...');
    const homepageResponse = await axios.get('https://gwdmall.kr', {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(homepageResponse.data);
    
    console.log('🔍 Looking for product links on homepage:');
    const productLinks: string[] = [];
    
    $('a[href*="/goods/view?no="]').each((_, element) => {
      const href = $(element).attr('href');
      if (href) {
        productLinks.push(href);
      }
    });
    
    console.log(`Found ${productLinks.length} product links on homepage`);
    
    if (productLinks.length > 0) {
      console.log('\nFirst 5 product links:');
      productLinks.slice(0, 5).forEach((link, i) => {
        console.log(`${i + 1}. ${link}`);
      });
      
      // Test first product page
      if (productLinks.length > 0) {
        const testProductUrl = productLinks[0].startsWith('http') ? 
                              productLinks[0] : 
                              `https://gwdmall.kr${productLinks[0]}`;
        
        console.log(`\n🧪 Testing product page: ${testProductUrl}`);
        
        try {
          const productResponse = await axios.get(testProductUrl, {
            timeout: 20000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
          });
          
          const product$ = cheerio.load(productResponse.data);
          
          // Save product page for analysis
          const outputDir = path.join(__dirname, 'output');
          fs.writeFileSync(path.join(outputDir, 'gwdmall-test-product.html'), productResponse.data);
          
          // Try to extract product info
          console.log('\n📦 Product information:');
          
          const titleSelectors = [
            '.item_detail_tit',
            '.goods_name',
            '.product_name',
            'h1',
            '.detail_info .tit',
            '.info_area .tit'
          ];
          
          for (const selector of titleSelectors) {
            const title = product$(selector).first().text().trim();
            if (title) {
              console.log(`   Title (${selector}): ${title}`);
              break;
            }
          }
          
          const priceSelectors = [
            '.item_price',
            '.goods_price',
            '.product_price',
            '.price'
          ];
          
          for (const selector of priceSelectors) {
            const price = product$(selector).first().text().trim();
            if (price) {
              console.log(`   Price (${selector}): ${price}`);
              break;
            }
          }
          
          const imageSelectors = [
            '.item_photo_big img',
            '.goods_image img',
            '.product_image img',
            '.main_image img'
          ];
          
          for (const selector of imageSelectors) {
            const imageSrc = product$(selector).first().attr('src');
            if (imageSrc) {
              console.log(`   Image (${selector}): ${imageSrc}`);
              break;
            }
          }
          
        } catch (error) {
          console.error('❌ Error testing product page:', error.message);
        }
      }
    }
    
    // Test a category page
    console.log('\n🗂️  Testing category page...');
    const categoryUrl = 'https://gwdmall.kr/goods/catalog?code=0001';
    
    try {
      const categoryResponse = await axios.get(categoryUrl, {
        timeout: 20000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      const category$ = cheerio.load(categoryResponse.data);
      
      // Save category page for analysis
      const outputDir = path.join(__dirname, 'output');
      fs.writeFileSync(path.join(outputDir, 'gwdmall-test-category.html'), categoryResponse.data);
      
      // Look for products in category
      const categoryProductLinks = category$('a[href*="/goods/view?no="]').length;
      console.log(`Found ${categoryProductLinks} product links on category page`);
      
      // Check page structure
      console.log('\n📄 Category page structure:');
      console.log(`- Title: ${category$('title').text()}`);
      console.log(`- Product items: ${category$('.item, .goods_item, .product_item').length}`);
      console.log(`- Links: ${category$('a').length}`);
      
    } catch (error) {
      console.error('❌ Error testing category page:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testGwdMallPage();