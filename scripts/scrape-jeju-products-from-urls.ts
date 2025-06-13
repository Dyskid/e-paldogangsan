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
  specifications?: Record<string, string>;
}

const OUTPUT_DIR = path.join(__dirname, 'output');
const JEJU_MALL_BASE_URL = 'https://mall.ejeju.net';

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchProductDetails(url: string): Promise<Product | null> {
  try {
    console.log(`Fetching: ${url}`);
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3',
      },
      timeout: 30000
    });
    
    const $ = cheerio.load(response.data);
    
    // Extract product ID from URL
    const gnoMatch = url.match(/gno=(\d+)/);
    const cateMatch = url.match(/cate=(\d+)/);
    const productId = gnoMatch ? gnoMatch[1] : '';
    const categoryId = cateMatch ? cateMatch[1] : '';
    
    // Product name
    const name = $('.goods_name').text().trim() ||
                 $('.product_name').text().trim() ||
                 $('h1').text().trim() ||
                 $('[class*="title"]').first().text().trim();
    
    // Price information
    const priceText = $('.price_area .price').text().trim() ||
                     $('.goods_price').text().trim() ||
                     $('[class*="price"]').first().text().trim();
    const price = priceText.replace(/[^\d,]/g, '');
    
    // Original price (if discounted)
    const originalPriceText = $('.price_area .original').text().trim() ||
                             $('.price_before').text().trim() ||
                             $('[class*="original"]').text().trim();
    const originalPrice = originalPriceText ? originalPriceText.replace(/[^\d,]/g, '') : undefined;
    
    // Discount rate
    const discountText = $('.discount_rate').text().trim() ||
                        $('.sale_rate').text().trim() ||
                        $('[class*="discount"]').text().trim();
    const discountRate = discountText ? discountText.replace(/[^\d]/g, '') : undefined;
    
    // Product image
    let imageUrl = $('.goods_image img').attr('src') ||
                   $('.product_image img').attr('src') ||
                   $('#mainImage').attr('src') ||
                   $('.main_image img').attr('src') ||
                   $('[class*="main"] img').first().attr('src');
    
    if (imageUrl && !imageUrl.startsWith('http')) {
      imageUrl = JEJU_MALL_BASE_URL + imageUrl;
    }
    
    // Seller information
    const seller = $('.seller_name').text().trim() ||
                  $('.shop_name').text().trim() ||
                  $('[class*="seller"]').text().trim() ||
                  '제주몰';
    
    // Category
    const breadcrumb = $('.breadcrumb').text() || $('.location').text();
    const category = breadcrumb ? breadcrumb.split('>').pop()?.trim() || getCategoryName(categoryId) : getCategoryName(categoryId);
    
    // Description
    const description = $('.goods_description').text().trim() ||
                       $('.product_detail').text().trim() ||
                       $('[class*="description"]').first().text().trim();
    
    // Specifications
    const specifications: Record<string, string> = {};
    $('.spec_table tr, .info_table tr, table.product_info tr').each((i, el) => {
      const $row = $(el);
      const key = $row.find('th').text().trim();
      const value = $row.find('td').text().trim();
      if (key && value) {
        specifications[key] = value;
      }
    });
    
    if (name && price) {
      return {
        id: `jeju_${productId}`,
        name,
        price: price + '원',
        originalPrice: originalPrice ? originalPrice + '원' : undefined,
        discountRate: discountRate ? discountRate + '%' : undefined,
        imageUrl: imageUrl || '',
        productUrl: url,
        category,
        seller,
        description: description || '',
        tags: ['제주', '제주도', 'jeju', category],
        specifications: Object.keys(specifications).length > 0 ? specifications : undefined
      };
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching ${url}:`, error instanceof Error ? error.message : error);
    return null;
  }
}

function getCategoryName(categoryId: string): string {
  const categoryMap: Record<string, string> = {
    '1': '농산품',
    '2': '수산품',
    '31': '수산품',
    '1671': '축산품',
    '4': '가공식품',
    '45': '가공식품',
    '6': '화장품',
    '31069': '공예품',
    '1854': '생활용품',
    '31115': '반려동물용품',
    '31154': '제주-경기 상생관',
    '31004': '농산품',
    '31017': '축산품',
    '31040': '가공식품',
    '31042': '가공식품',
    '31043': '가공식품',
    '1672': '축산품',
    '1789': '농산품'
  };
  
  return categoryMap[categoryId] || '기타';
}

async function scrapeAllProducts() {
  console.log('Starting to scrape Jeju Mall products...');
  
  // Read URLs from file
  const urlsFile = path.join(path.dirname(__dirname), 'jeju-mall-product-urls.txt');
  const urlsContent = fs.readFileSync(urlsFile, 'utf-8');
  
  // Extract all product URLs
  const productUrls = urlsContent
    .split('\n')
    .filter(line => line.includes('https://mall.ejeju.net/goods/detail.do'))
    .map(line => line.trim());
  
  console.log(`Found ${productUrls.length} product URLs to scrape`);
  
  const products: Product[] = [];
  const errors: string[] = [];
  
  // Scrape each product
  for (let i = 0; i < productUrls.length; i++) {
    const url = productUrls[i];
    console.log(`Progress: ${i + 1}/${productUrls.length}`);
    
    const product = await fetchProductDetails(url);
    if (product) {
      products.push(product);
      console.log(`✓ Scraped: ${product.name}`);
    } else {
      errors.push(url);
      console.log(`✗ Failed to scrape: ${url}`);
    }
    
    // Be polite to the server
    await delay(1000 + Math.random() * 1000);
  }
  
  // Save results
  const outputPath = path.join(OUTPUT_DIR, 'jeju-mall-products.json');
  fs.writeFileSync(outputPath, JSON.stringify(products, null, 2));
  
  // Save errors if any
  if (errors.length > 0) {
    const errorsPath = path.join(OUTPUT_DIR, 'jeju-mall-scrape-errors.txt');
    fs.writeFileSync(errorsPath, errors.join('\n'));
  }
  
  // Create summary
  const summary = {
    totalUrls: productUrls.length,
    successfulScrapes: products.length,
    failedScrapes: errors.length,
    categories: [...new Set(products.map(p => p.category))],
    sellers: [...new Set(products.map(p => p.seller))],
    priceRange: {
      min: Math.min(...products.map(p => parseInt(p.price.replace(/[^\d]/g, '')))),
      max: Math.max(...products.map(p => parseInt(p.price.replace(/[^\d]/g, ''))))
    },
    scrapedAt: new Date().toISOString()
  };
  
  const summaryPath = path.join(OUTPUT_DIR, 'jeju-mall-scrape-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  
  console.log('\n=== Scraping Complete ===');
  console.log(`Total products scraped: ${products.length}`);
  console.log(`Failed: ${errors.length}`);
  console.log(`Results saved to: ${outputPath}`);
  console.log(`Summary saved to: ${summaryPath}`);
}

// Run the scraper
scrapeAllProducts().catch(console.error);