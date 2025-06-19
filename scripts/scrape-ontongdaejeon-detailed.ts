import axios from 'axios';
import * as cheerio from 'cheerio';
import { writeFileSync } from 'fs';
import * as https from 'https';
import puppeteer from 'puppeteer';

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

async function scrapeWithPuppeteer(): Promise<Product[]> {
  const baseUrl = 'https://ontongdaejeon.ezwel.com';
  const mallInfo = {
    id: 'ontongdaejeon',
    name: '온통대전몰 대전사랑몰',
    region: '대전광역시',
    tags: ['대전특산품', '지역상품', '로컬푸드', '대전사랑몰', '온통대전']
  };

  const products: Product[] = [];
  
  console.log('🌐 Launching browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Set Korean user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    console.log('📋 Loading main page...');
    await page.goto(`${baseUrl}/onnuri/main`, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    // Wait for products to load
    await page.waitForSelector('.goods_list, .goods_4ea, [class*="goods"]', { timeout: 10000 });

    // Extract product data
    const extractedProducts = await page.evaluate(() => {
      const products: any[] = [];
      
      // Find all product containers
      const productElements = document.querySelectorAll('.goods_list li, .goods_4ea li, .goods_over');
      
      productElements.forEach((elem) => {
        try {
          // Extract product ID
          const onclickElem = elem.querySelector('[onclick*="fn_goGoodsDetail"]');
          let productId = '';
          if (onclickElem) {
            const onclick = onclickElem.getAttribute('onclick');
            const match = onclick?.match(/fn_goGoodsDetail\('(\d+)'/);
            if (match) {
              productId = match[1];
            }
          }
          
          if (!productId) return;
          
          // Extract title - look for multiple possible selectors
          let title = '';
          const titleSelectors = [
            '.goods_tit', '.goods_name', '.tit', '.title', 
            '.product_name', '.item_name', 'figcaption', 
            'a[onclick*="fn_goGoodsDetail"]'
          ];
          
          for (const selector of titleSelectors) {
            const titleElem = elem.querySelector(selector);
            if (titleElem && titleElem.textContent) {
              title = titleElem.textContent.trim();
              if (title && title !== 'updown') break;
            }
          }
          
          // Clean title
          title = title.replace(/\[.*?\]/g, '').trim();
          title = title.replace(/\s+/g, ' ');
          
          // Extract location/category
          let location = '';
          const locationElem = elem.querySelector('.location, .loc, .area');
          if (locationElem) {
            location = locationElem.textContent?.trim() || '';
          }
          
          // Extract price
          let price = '';
          let originalPrice = '';
          const priceElem = elem.querySelector('.price, .cost, [class*="price"]');
          if (priceElem) {
            const priceText = priceElem.textContent || '';
            // Look for discounted price pattern
            const discountMatch = priceText.match(/(\d{1,3}(?:,\d{3})*)원.*?→.*?(\d{1,3}(?:,\d{3})*)원/);
            if (discountMatch) {
              originalPrice = discountMatch[1] + '원';
              price = discountMatch[2] + '원';
            } else {
              const priceMatch = priceText.match(/(\d{1,3}(?:,\d{3})*)원/);
              if (priceMatch) {
                price = priceMatch[1] + '원';
              }
            }
          }
          
          // Extract image
          let imageUrl = '';
          const imgElem = elem.querySelector('img');
          if (imgElem) {
            imageUrl = imgElem.getAttribute('src') || '';
          }
          
          products.push({
            productId,
            title,
            location,
            price,
            originalPrice,
            imageUrl
          });
          
        } catch (error) {
          console.error('Error extracting product:', error);
        }
      });
      
      return products;
    });

    console.log(`📦 Extracted ${extractedProducts.length} products from page`);

    // Convert to final product format
    extractedProducts.forEach(item => {
      if (item.productId && item.title) {
        const product: Product = {
          id: `ontongdaejeon-${item.productId}`,
          title: item.title || `상품 ${item.productId}`,
          description: '',
          price: item.price,
          originalPrice: item.originalPrice || undefined,
          imageUrl: item.imageUrl.startsWith('http') ? item.imageUrl : 
                    item.imageUrl.startsWith('//') ? 'https:' + item.imageUrl : 
                    baseUrl + item.imageUrl,
          productUrl: `${baseUrl}/onnuri/mall/goodsDetail?goodsCd=${item.productId}`,
          category: item.location || '지역특산품',
          mallId: mallInfo.id,
          mallName: mallInfo.name,
          region: mallInfo.region,
          tags: [...mallInfo.tags, item.location || '지역특산품'].filter(Boolean)
        };
        
        products.push(product);
      }
    });

  } catch (error) {
    console.error('❌ Error during scraping:', error);
  } finally {
    await browser.close();
  }

  return products;
}

async function scrapeOntongDaejeonDetailed(): Promise<void> {
  console.log('🔍 Starting detailed scraping of 온통대전몰...');
  
  const products = await scrapeWithPuppeteer();
  
  // Save results
  writeFileSync('./scripts/output/ontongdaejeon-products.json', JSON.stringify(products, null, 2));
  writeFileSync('./scripts/output/ontongdaejeon-scrape-summary.json', JSON.stringify({
    totalProducts: products.length,
    timestamp: new Date().toISOString(),
    categories: [...new Set(products.map(p => p.category))],
    priceRange: {
      withPrices: products.filter(p => p.price).length,
      withOriginalPrices: products.filter(p => p.originalPrice).length
    }
  }, null, 2));

  console.log('\n📊 Scraping Summary:');
  console.log(`✅ Total products scraped: ${products.length}`);
  console.log(`💰 Products with prices: ${products.filter(p => p.price).length}`);
  console.log(`🏷️ Products with discounts: ${products.filter(p => p.originalPrice).length}`);
  console.log(`📂 Categories: ${[...new Set(products.map(p => p.category))].join(', ')}`);
  
  if (products.length > 0) {
    console.log('\n📦 Sample products:');
    products.slice(0, 5).forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.title} - ${product.price || '가격정보없음'}`);
    });
  }
}

// Run the detailed scraper
scrapeOntongDaejeonDetailed().then(() => {
  console.log('✅ 온통대전몰 detailed scraping completed!');
}).catch(console.error);