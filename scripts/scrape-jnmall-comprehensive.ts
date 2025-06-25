import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import { existsSync } from 'fs';

interface Product {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  productUrl: string;
  category: string;
  mall: string;
  seller?: string;
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

function extractProductId(imageUrl: string): string {
  // Extract ID from image URL like: 11440_PRODUCT_02df4803-7a65-4ea4-80e1-bb49c2399a7f
  const match = imageUrl.match(/(\d+)_PRODUCT_/);
  return match ? match[1] : '';
}

async function scrapeProductsFromPage(html: string): Promise<Product[]> {
  const $ = cheerio.load(html);
  const products: Product[] = [];
  
  // Find product elements
  $('.prd_list .item, .product-item, .goods-item').each((_, elem) => {
    const $elem = $(elem);
    
    const title = $elem.find('.prd_title, .product-name, .goods-name').text().trim();
    const priceText = $elem.find('.price_sale, .price, .sales-price').text().trim();
    const price = extractPrice(priceText);
    const originalPriceText = $elem.find('.price_consumer, del').text().trim();
    const originalPrice = originalPriceText ? extractPrice(originalPriceText) : undefined;
    
    const imageUrl = $elem.find('img').attr('src') || '';
    const productId = extractProductId(imageUrl);
    
    const seller = $elem.find('.prd_place, .seller-name, .shop-name').text().trim();
    const category = $elem.find('.category, .cate').text().trim() || '기타';
    
    if (title && price > 0 && productId) {
      const product: Product = {
        id: `jnmall_${productId}`,
        title,
        price,
        imageUrl,
        productUrl: `https://www.jnmall.kr/product/${productId}/detail`,
        category,
        mall: '남도장터',
        seller
      };
      
      if (originalPrice && originalPrice > price) {
        product.originalPrice = originalPrice;
      }
      
      products.push(product);
    }
  });
  
  return products;
}

async function scrapeCategory(categoryUrl: string, categoryName: string): Promise<Product[]> {
  const products: Product[] = [];
  
  try {
    console.log(`\nScraping ${categoryName}: ${categoryUrl}`);
    
    const html = await fetchWithRetry(categoryUrl);
    const pageProducts = await scrapeProductsFromPage(html);
    
    // Override category with the actual category name
    pageProducts.forEach(p => p.category = categoryName);
    products.push(...pageProducts);
    
    console.log(`Found ${pageProducts.length} products in ${categoryName}`);
    
    // Check for pagination
    const $ = cheerio.load(html);
    const totalPages = $('.pagination a').length;
    
    if (totalPages > 1) {
      console.log(`Found ${totalPages} pages, scraping additional pages...`);
      
      // Scrape additional pages (limit to 5 pages per category)
      for (let page = 2; page <= Math.min(totalPages, 5); page++) {
        const pageUrl = `${categoryUrl}${categoryUrl.includes('?') ? '&' : '?'}page=${page}`;
        console.log(`  Scraping page ${page}...`);
        
        try {
          const pageHtml = await fetchWithRetry(pageUrl);
          const moreProducts = await scrapeProductsFromPage(pageHtml);
          moreProducts.forEach(p => p.category = categoryName);
          products.push(...moreProducts);
          
          await delay(1000); // Be polite
        } catch (error) {
          console.error(`Error scraping page ${page}:`, error.message);
        }
      }
    }
    
  } catch (error) {
    console.error(`Error scraping category ${categoryName}:`, error);
  }
  
  return products;
}

async function scrapeJnmall() {
  console.log('Starting 남도장터 (jnmall.kr) scraper...\n');
  
  const categories = [
    { url: 'https://www.jnmall.kr/category/recommend', name: '추천상품' },
    { url: 'https://www.jnmall.kr/category/local', name: '시군몰' },
    { url: 'https://www.jnmall.kr/category/new', name: '신상품' },
    { url: 'https://www.jnmall.kr/category/promotion/exhibition?&code=ViEWiPmW&name=전라남도%20소상공인%20로컬상품관&promotionSeq=33', name: '로컬상품관' }
  ];
  
  const allProducts: Product[] = [];
  const productIds = new Set<string>();
  
  // First, get products from homepage
  console.log('Scraping homepage...');
  try {
    const homeHtml = await fetchWithRetry('https://www.jnmall.kr/');
    const homeProducts = await scrapeProductsFromPage(homeHtml);
    
    homeProducts.forEach(product => {
      if (!productIds.has(product.id)) {
        productIds.add(product.id);
        allProducts.push(product);
      }
    });
    
    console.log(`Found ${homeProducts.length} products on homepage`);
  } catch (error) {
    console.error('Error scraping homepage:', error);
  }
  
  // Scrape each category
  for (const category of categories) {
    const products = await scrapeCategory(category.url, category.name);
    
    // Add unique products only
    products.forEach(product => {
      if (!productIds.has(product.id)) {
        productIds.add(product.id);
        allProducts.push(product);
      }
    });
    
    await delay(2000); // Be polite between categories
  }
  
  // Try to scrape additional categories through sitemap or API
  console.log('\nLooking for additional product pages...');
  
  // Save products
  await fs.writeFile(
    'scripts/output/jnmall-products.json',
    JSON.stringify(allProducts, null, 2)
  );
  
  // Create summary
  const summary = {
    mallName: '남도장터',
    url: 'https://www.jnmall.kr/',
    totalProducts: allProducts.length,
    categoryCounts: categories.map(cat => ({
      category: cat.name,
      count: allProducts.filter(p => p.category === cat.name).length
    })),
    priceRange: {
      min: Math.min(...allProducts.map(p => p.price)),
      max: Math.max(...allProducts.map(p => p.price)),
      average: Math.round(allProducts.reduce((sum, p) => sum + p.price, 0) / allProducts.length)
    },
    productsWithImages: allProducts.filter(p => p.imageUrl).length,
    productsWithOriginalPrice: allProducts.filter(p => p.originalPrice).length,
    scrapedAt: new Date().toISOString()
  };
  
  await fs.writeFile(
    'scripts/output/jnmall-scrape-summary.json',
    JSON.stringify(summary, null, 2)
  );
  
  console.log('\n' + '='.repeat(50));
  console.log('SCRAPING COMPLETE!');
  console.log('='.repeat(50));
  console.log(`Total unique products scraped: ${allProducts.length}`);
  console.log('\nCategory breakdown:');
  summary.categoryCounts.forEach(cat => {
    console.log(`  - ${cat.category}: ${cat.count} products`);
  });
  
  if (allProducts.length > 0) {
    console.log(`\nPrice range: ${summary.priceRange.min.toLocaleString()}원 - ${summary.priceRange.max.toLocaleString()}원`);
    console.log(`Average price: ${summary.priceRange.average.toLocaleString()}원`);
    console.log(`Products with images: ${summary.productsWithImages}`);
    console.log(`Products with discount: ${summary.productsWithOriginalPrice}`);
    
    console.log('\nSample products:');
    allProducts.slice(0, 3).forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.title} - ${p.price.toLocaleString()}원`);
    });
  }
  
  return allProducts;
}

// Run the scraper
scrapeJnmall().catch(console.error);