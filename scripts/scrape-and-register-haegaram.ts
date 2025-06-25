#!/usr/bin/env npx tsx
/**
 * Comprehensive Haegaram Mall Scraper and Product Registration Script
 * 
 * This script:
 * 1. Scrapes all products from haegaram.com (해가람)
 * 2. Extracts product details including titles, images, and prices
 * 3. Registers products with valid prices to the system
 * 4. Verifies the registration
 * 
 * Usage: npx tsx scripts/scrape-and-register-haegaram.ts
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import path from 'path';

interface Product {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  productUrl: string;
  category: string;
  mall: string;
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, maxRetries = 3): Promise<string> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Cache-Control': 'max-age=0'
        },
        timeout: 30000
      });
      return response.data;
    } catch (error) {
      console.error(`Attempt ${i + 1} failed for ${url}:`, error.message);
      if (i === maxRetries - 1) throw error;
      await delay(2000 * (i + 1));
    }
  }
  throw new Error('Max retries exceeded');
}

function extractPrice(priceText: string): number {
  const cleanedText = priceText.replace(/[^0-9,.-]/g, '');
  const priceStr = cleanedText.replace(/,/g, '');
  const price = parseInt(priceStr);
  return isNaN(price) ? 0 : price;
}

async function scrapeProductDetails(productUrl: string): Promise<Product | null> {
  try {
    const html = await fetchWithRetry(productUrl);
    const $ = cheerio.load(html);
    
    const urlMatch = productUrl.match(/\/product\/[^\/]+\/(\d+)\//);
    const productId = urlMatch ? urlMatch[1] : '';
    
    // Extract title from meta tag first
    let title = $('meta[property="og:title"]').attr('content') || '';
    
    if (!title) {
      title = $('.keyImg img, .bigImage img').first().attr('alt') || '';
    }
    
    // Extract price
    let price = 0;
    const priceElem = $('#span_product_price_text').first();
    if (priceElem.length > 0) {
      price = extractPrice(priceElem.text());
    }
    
    // Extract image
    let imageUrl = '';
    const imgElem = $('.keyImg img, .bigImage img').first();
    if (imgElem.length > 0) {
      imageUrl = imgElem.attr('src') || '';
      if (!imageUrl.startsWith('http')) {
        imageUrl = `https://haegaram.com${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
      }
    }
    
    // Extract category from URL
    let category = '';
    const categoryMatch = productUrl.match(/category\/(\d+)\//);
    if (categoryMatch) {
      const categoryId = categoryMatch[1];
      const categoryMap: { [key: string]: string } = {
        '23': '생선/어패',
        '56': '건어물',
        '64': '해조류',
        '57': '젓갈/액젓'
      };
      category = categoryMap[categoryId] || '기타';
    }
    
    if (!title || price === 0) {
      return null;
    }
    
    return {
      id: `haegaram_${productId}`,
      title,
      price,
      imageUrl,
      productUrl,
      category,
      mall: '해가람'
    };
  } catch (error) {
    console.error(`Error scraping ${productUrl}:`, error.message);
    return null;
  }
}

async function scrapeCategory(categoryUrl: string, categoryName: string): Promise<Product[]> {
  const products: Product[] = [];
  const productUrls = new Set<string>();
  
  try {
    let page = 1;
    let hasNextPage = true;
    
    while (hasNextPage && page <= 10) {
      const pageUrl = `${categoryUrl}${categoryUrl.includes('?') ? '&' : '?'}page=${page}`;
      console.log(`Fetching ${categoryName} page ${page}...`);
      
      try {
        const html = await fetchWithRetry(pageUrl);
        const $ = cheerio.load(html);
        
        let foundProducts = 0;
        $('.xans-product-normalpackage .prdList .item a.prdImg').each((_, elem) => {
          const href = $(elem).attr('href');
          if (href && href.includes('/product/') && !href.includes('##param##')) {
            const fullUrl = href.startsWith('http') ? href : `https://haegaram.com${href}`;
            productUrls.add(fullUrl);
            foundProducts++;
          }
        });
        
        console.log(`  Found ${foundProducts} products on page ${page}`);
        
        const nextPageExists = $('.xans-product-normalpaging a').filter((_, el) => {
          const text = $(el).text().trim();
          return text === String(page + 1) || text.includes('다음');
        }).length > 0;
        
        hasNextPage = nextPageExists && foundProducts > 0;
        page++;
        
        await delay(1000);
      } catch (error) {
        console.error(`Error fetching page ${page}:`, error.message);
        hasNextPage = false;
      }
    }
    
    console.log(`Total products found in ${categoryName}: ${productUrls.size}`);
    
    // Scrape each product
    let scraped = 0;
    for (const productUrl of productUrls) {
      const product = await scrapeProductDetails(productUrl);
      if (product) {
        product.category = categoryName;
        products.push(product);
        scraped++;
        
        if (scraped % 10 === 0) {
          console.log(`  Progress: ${scraped}/${productUrls.size} products scraped`);
        }
      }
      await delay(500);
    }
    
    console.log(`Completed ${categoryName}: ${products.length} products with valid prices`);
  } catch (error) {
    console.error(`Error scraping category ${categoryName}:`, error);
  }
  
  return products;
}

async function scrapeHaegaram(): Promise<Product[]> {
  console.log('Starting Haegaram scraper...\n');
  
  const categories = [
    { url: 'https://haegaram.com/product/list.html?cate_no=23', name: '생선/어패' },
    { url: 'https://haegaram.com/product/list.html?cate_no=56', name: '건어물' },
    { url: 'https://haegaram.com/product/list.html?cate_no=64', name: '해조류' },
    { url: 'https://haegaram.com/product/list.html?cate_no=57', name: '젓갈/액젓' }
  ];
  
  const allProducts: Product[] = [];
  
  for (const category of categories) {
    console.log(`\nScraping category: ${category.name}`);
    const products = await scrapeCategory(category.url, category.name);
    allProducts.push(...products);
  }
  
  console.log(`\nTotal products scraped: ${allProducts.length}`);
  
  return allProducts;
}

async function registerProducts(products: Product[]) {
  console.log('\nRegistering products...');
  
  const productsPath = path.join(process.cwd(), 'src/data/products.json');
  const existingData = await fs.readFile(productsPath, 'utf-8');
  let existingProducts = JSON.parse(existingData);
  
  // Remove existing Haegaram products
  existingProducts = existingProducts.filter(p => !p.id.startsWith('haegaram_'));
  
  // Transform and add new products
  const newProducts = products.map(product => ({
    id: product.id,
    name: product.title,
    price: product.price,
    category: mapCategory(product.category),
    image: product.imageUrl,
    link: product.productUrl,
    mall: {
      name: product.mall,
      logo: '/logos/mall_50_해가람.png'
    },
    tags: generateTags(product.title, product.category),
    isNew: true
  }));
  
  const allProducts = [...existingProducts, ...newProducts];
  
  // Create backup
  const timestamp = Date.now();
  const backupPath = `src/data/products-backup-${timestamp}.json`;
  await fs.writeFile(backupPath, existingData);
  console.log(`Created backup at: ${backupPath}`);
  
  // Save updated products
  await fs.writeFile(productsPath, JSON.stringify(allProducts, null, 2));
  
  console.log(`Registered ${newProducts.length} products`);
  console.log(`Total products now: ${allProducts.length}`);
}

function mapCategory(scrapedCategory: string): string {
  const categoryMap: { [key: string]: string } = {
    '생선/어패': '수산물',
    '건어물': '수산물',
    '해조류': '수산물',
    '젓갈/액젓': '수산물'
  };
  return categoryMap[scrapedCategory] || '기타';
}

function generateTags(title: string, category: string): string[] {
  const tags: string[] = [];
  
  if (category.includes('생선') || category.includes('어패')) {
    tags.push('신선식품', '수산물');
  }
  if (category.includes('건어물')) {
    tags.push('건어물', '수산가공품');
  }
  if (category.includes('해조류')) {
    tags.push('해조류');
  }
  if (category.includes('젓갈') || category.includes('액젓')) {
    tags.push('젓갈', '발효식품', '전통식품');
  }
  
  // Product-specific tags
  const keywords = ['고등어', '갈치', '장어', '오징어', '새우', '멸치', '김', '선물', '프리미엄'];
  keywords.forEach(keyword => {
    if (title.includes(keyword)) tags.push(keyword);
  });
  
  return [...new Set(tags)];
}

// Main execution
async function main() {
  try {
    console.log('='.repeat(50));
    console.log('HAEGARAM MALL SCRAPER');
    console.log('='.repeat(50));
    
    // Step 1: Scrape products
    const products = await scrapeHaegaram();
    
    // Save scraped products
    await fs.writeFile(
      'scripts/output/haegaram-products.json',
      JSON.stringify(products, null, 2)
    );
    
    // Step 2: Register products
    await registerProducts(products);
    
    console.log('\n' + '='.repeat(50));
    console.log('SCRAPING AND REGISTRATION COMPLETE!');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('Error in main process:', error);
    process.exit(1);
  }
}

// Run the script
main();