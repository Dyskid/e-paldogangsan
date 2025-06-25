import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';

async function testProduct() {
  const baseUrl = 'https://ehongseong.com';
  const testProductId = '11269264';
  const productUrl = `${baseUrl}/shop/shopdetail.html?branduid=${testProductId}`;
  
  console.log(`Testing product URL: ${productUrl}`);
  
  try {
    const response = await axios.get(productUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });
    
    // Save the HTML for analysis
    fs.writeFileSync('./scripts/output/ehongseong-product-sample.html', response.data);
    
    const $ = cheerio.load(response.data);
    
    // Extract basic product information
    const title = $('h2').first().text().trim() || 
                  $('.prd_name').text().trim() || 
                  $('.product_name').text().trim() ||
                  $('title').text().split(' - ')[0];
    
    const price = $('.price_sale').text().trim() ||
                  $('.price').text().trim() ||
                  $('.sale_price').text().trim() ||
                  $('.prd-price').text().trim();
    
    const image = $('img[src*="shopimages"]').first().attr('src') ||
                  $('.product_img img').first().attr('src') ||
                  $('.prd_img img').first().attr('src');
    
    console.log('Product Details:');
    console.log('Title:', title);
    console.log('Price:', price);
    console.log('Image:', image);
    console.log('Full URL:', productUrl);
    
    // Look for category information
    const breadcrumb = $('.location').text().trim() || $('.breadcrumb').text().trim();
    console.log('Breadcrumb:', breadcrumb);
    
    // Check page title for additional info
    const pageTitle = $('title').text().trim();
    console.log('Page Title:', pageTitle);
    
  } catch (error) {
    console.error('Error testing product:', error.message);
  }
}

testProduct();