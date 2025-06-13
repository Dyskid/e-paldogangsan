import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

interface Product {
  id: string;
  name: string;
  price: string;
  originalPrice?: string;
  discountRate?: string;
  imageUrl: string;
  productUrl: string;
  category: string;
  seller?: string;
  description?: string;
  tags: string[];
}

const JEJU_MALL_BASE_URL = 'https://mall.ejeju.net';
const OUTPUT_DIR = path.join(__dirname, 'output');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      timeout: 30000
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${url}:`, error instanceof Error ? error.message : error);
    return null;
  }
}

async function scrapeProducts(html: string, category: string = 'Unknown'): Promise<Product[]> {
  const $ = cheerio.load(html);
  const products: Product[] = [];
  
  // Common product selectors for Korean e-commerce sites
  const productSelectors = [
    '.product-item',
    '.goods-item',
    '.prd-item',
    '.item-box',
    '.product-box',
    'li[class*="product"]',
    'div[class*="product"]',
    'li[class*="goods"]',
    'div[class*="goods"]',
    '.list_goods li',
    '.goods_list li',
    '.prd_list li'
  ];
  
  for (const selector of productSelectors) {
    const items = $(selector);
    if (items.length > 0) {
      console.log(`Found ${items.length} items with selector: ${selector}`);
      
      items.each((index, element) => {
        const $item = $(element);
        
        // Try various name selectors
        const name = $item.find('.prd-name, .goods-name, .item-name, .product-name, [class*="name"], .tit, .title').first().text().trim() ||
                    $item.find('a').first().attr('title') ||
                    $item.find('img').first().attr('alt');
        
        // Try various price selectors
        const priceText = $item.find('.prd-price, .goods-price, .item-price, .product-price, [class*="price"], .cost').first().text().trim();
        const price = priceText.replace(/[^\d,]/g, '');
        
        // Get image URL
        const imgElement = $item.find('img').first();
        let imageUrl = imgElement.attr('src') || imgElement.attr('data-src') || imgElement.attr('data-original');
        if (imageUrl && !imageUrl.startsWith('http')) {
          imageUrl = JEJU_MALL_BASE_URL + imageUrl;
        }
        
        // Get product link
        const linkElement = $item.find('a').first();
        let productUrl = linkElement.attr('href');
        if (productUrl && !productUrl.startsWith('http')) {
          productUrl = JEJU_MALL_BASE_URL + productUrl;
        }
        
        if (name && price) {
          const product: Product = {
            id: `jeju_${Date.now()}_${index}`,
            name: name,
            price: price + '원',
            imageUrl: imageUrl || '',
            productUrl: productUrl || '',
            category: category,
            tags: ['제주', '제주도', 'jeju']
          };
          
          // Extract discount info if available
          const originalPriceText = $item.find('.original-price, .price-before, [class*="original"]').text().trim();
          if (originalPriceText) {
            product.originalPrice = originalPriceText.replace(/[^\d,]/g, '') + '원';
          }
          
          const discountText = $item.find('.discount-rate, .sale-rate, [class*="discount"]').text().trim();
          if (discountText) {
            product.discountRate = discountText;
          }
          
          products.push(product);
        }
      });
      
      if (products.length > 0) break;
    }
  }
  
  return products;
}

async function scrapeJejuMall() {
  console.log('Starting Jeju Mall scraper...');
  const allProducts: Product[] = [];
  
  try {
    // First, try to fetch the main page
    console.log('Fetching main page...');
    const mainPageHtml = await fetchPage(`${JEJU_MALL_BASE_URL}/main/index.do`);
    
    if (mainPageHtml) {
      const $ = cheerio.load(mainPageHtml);
      
      // Extract category links
      const categoryLinks: { name: string; url: string }[] = [];
      
      // Look for category navigation
      $('.gnb_menu a, .category-menu a, .lnb_menu a, nav a, .nav a').each((index, element) => {
        const $link = $(element);
        const href = $link.attr('href');
        const text = $link.text().trim();
        
        if (href && text && (href.includes('category') || href.includes('goods') || href.includes('product'))) {
          const fullUrl = href.startsWith('http') ? href : JEJU_MALL_BASE_URL + href;
          categoryLinks.push({ name: text, url: fullUrl });
        }
      });
      
      console.log(`Found ${categoryLinks.length} category links`);
      
      // Also try to extract products from the main page
      const mainPageProducts = await scrapeProducts(mainPageHtml, 'Main Page');
      console.log(`Found ${mainPageProducts.length} products on main page`);
      allProducts.push(...mainPageProducts);
      
      // Visit each category page
      for (const category of categoryLinks.slice(0, 10)) { // Limit to first 10 categories for testing
        console.log(`Fetching category: ${category.name}`);
        await delay(1000); // Be polite to the server
        
        const categoryHtml = await fetchPage(category.url);
        if (categoryHtml) {
          const categoryProducts = await scrapeProducts(categoryHtml, category.name);
          console.log(`Found ${categoryProducts.length} products in ${category.name}`);
          allProducts.push(...categoryProducts);
        }
      }
    }
    
    // Remove duplicates based on product name
    const uniqueProducts = Array.from(
      new Map(allProducts.map(product => [product.name, product])).values()
    );
    
    // Save results
    const outputPath = path.join(OUTPUT_DIR, 'jeju-mall-products.json');
    fs.writeFileSync(outputPath, JSON.stringify(uniqueProducts, null, 2));
    
    console.log(`\nScraping complete!`);
    console.log(`Total products found: ${uniqueProducts.length}`);
    console.log(`Results saved to: ${outputPath}`);
    
    // Save summary
    const summary = {
      totalProducts: uniqueProducts.length,
      categories: [...new Set(uniqueProducts.map(p => p.category))],
      scrapedAt: new Date().toISOString(),
      source: JEJU_MALL_BASE_URL
    };
    
    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'jeju-mall-summary.json'),
      JSON.stringify(summary, null, 2)
    );
    
  } catch (error) {
    console.error('Error during scraping:', error);
  }
}

// Run the scraper
scrapeJejuMall().catch(console.error);