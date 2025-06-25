import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';

async function testBuanProduct() {
  const baseUrl = 'https://www.xn--9z2bv5bx25anyd.kr';
  const testProductId = '1741665845';
  const productUrl = `${baseUrl}/board/shop/item2.php?it_id=${testProductId}`;
  
  console.log(`Testing product URL: ${productUrl}`);
  
  try {
    const response = await axios.get(productUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000
    });
    
    // Save the HTML for analysis
    fs.writeFileSync('./scripts/output/buan-product-sample.html', response.data);
    
    const $ = cheerio.load(response.data);
    
    // Extract basic product information
    const title = $('h1').first().text().trim() || 
                  $('.item-title').text().trim() || 
                  $('.product-title').text().trim() ||
                  $('title').text().split(' < ')[0].trim();
    
    // Look for price patterns
    const priceSelectors = [
      '.price', '.item-price', '.product-price', '.cost', '.amount',
      '[class*="price"]', '[class*="cost"]', '[class*="won"]'
    ];
    
    let price = '';
    priceSelectors.forEach(selector => {
      if (!price) {
        const priceElement = $(selector).first();
        const priceText = priceElement.text().trim();
        if (priceText && (priceText.includes('원') || priceText.includes('₩') || /\d{1,3}(,\d{3})*/.test(priceText))) {
          price = priceText;
        }
      }
    });
    
    // Look for images
    const imageSelectors = [
      '.item-image img', '.product-image img', '.main-image img',
      'img[src*="item"]', 'img[src*="product"]', 'img[src*="data"]'
    ];
    
    let image = '';
    imageSelectors.forEach(selector => {
      if (!image) {
        const imgElement = $(selector).first();
        const src = imgElement.attr('src');
        if (src) {
          image = src;
        }
      }
    });
    
    console.log('Product Details:');
    console.log('Title:', title);
    console.log('Price:', price);
    console.log('Image:', image);
    console.log('Full URL:', productUrl);
    
    // Check page title for additional info
    const pageTitle = $('title').text().trim();
    console.log('Page Title:', pageTitle);
    
    // Look for description or details
    const description = $('.item-description').text().trim() || 
                       $('.product-description').text().trim() ||
                       $('.content').text().trim().slice(0, 100);
    console.log('Description preview:', description);
    
    // Try to find all text containing prices
    console.log('\n=== Price Analysis ===');
    $('*').each((_, element) => {
      const text = $(element).text().trim();
      if (text.includes('원') && text.length < 50) {
        console.log(`Price candidate: ${text}`);
      }
    });
    
    // Look for form data or hidden inputs that might contain product info
    console.log('\n=== Form Analysis ===');
    $('input[type="hidden"]').each((_, input) => {
      const name = $(input).attr('name');
      const value = $(input).attr('value');
      if (name && value) {
        console.log(`Hidden input: ${name} = ${value}`);
      }
    });
    
  } catch (error) {
    console.error('Error testing product:', error.message);
  }
}

testBuanProduct();