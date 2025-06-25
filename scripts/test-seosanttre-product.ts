import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';

async function testProduct() {
  const baseUrl = 'https://seosanttre.com';
  const testProductId = '3580778';
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
    fs.writeFileSync('./scripts/output/seosanttre-product-sample.html', response.data);
    
    const $ = cheerio.load(response.data);
    
    // Extract basic product information - MakeShop specific patterns
    const title = $('.board-title').text().trim() || 
                  $('.prd-title').text().trim() || 
                  $('.prd_title').text().trim() ||
                  $('h1').first().text().trim() ||
                  $('title').text().split(' - ')[0].trim();
    
    // MakeShop price selectors
    const price = $('.sale_price').text().trim() ||
                  $('.prd-price').text().trim() ||
                  $('.price').text().trim() ||
                  $('[class*="price"]').first().text().trim();
    
    // MakeShop image selectors
    const image = $('.prd-thumb img').first().attr('src') ||
                  $('.board-thumb img').first().attr('src') ||
                  $('img[src*="shopimages"]').first().attr('src') ||
                  $('.prd_img img').first().attr('src');
    
    console.log('Product Details:');
    console.log('Title:', title);
    console.log('Price:', price);
    console.log('Image:', image);
    console.log('Full URL:', productUrl);
    
    // Look for category information
    const breadcrumb = $('.location').text().trim() || 
                       $('.path').text().trim() || 
                       $('.board-category').text().trim();
    console.log('Breadcrumb:', breadcrumb);
    
    // Check page title for additional info
    const pageTitle = $('title').text().trim();
    console.log('Page Title:', pageTitle);
    
    // Try to find price in scripts
    const scriptContent = response.data;
    const priceMatch = scriptContent.match(/product_price\s*=\s*['"](\d+)['"]/);
    if (priceMatch) {
      console.log('Script Price:', priceMatch[1]);
    }
    
    // Check for product name in script
    const nameMatch = scriptContent.match(/product_name\s*=\s*['"]([^'"]+)['"]/);
    if (nameMatch) {
      console.log('Script Name:', nameMatch[1]);
    }
    
  } catch (error) {
    console.error('Error testing product:', error.message);
  }
}

testProduct();