import axios from 'axios';
import * as cheerio from 'cheerio';
import { writeFileSync } from 'fs';
import { join } from 'path';
import * as iconv from 'iconv-lite';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  image: string;
  link: string;
  category: string;
  categoryCode: string;
  mallId: number;
  mallName: string;
}

interface Category {
  name: string;
  code: string;
  type: string;
}

const MALL_ID = 5;
const MALL_NAME = '착착착';
const BASE_URL = 'https://www.chack3.com';
const PRODUCTS_PER_PAGE = 40;

// Categories from analysis
const CATEGORIES: { regular: Category[], socialEconomy: Category[] } = {
  regular: [
    { name: "농산물", code: "001", type: "X" },
    { name: "수산물", code: "002", type: "X" },
    { name: "축산물", code: "003", type: "X" },
    { name: "가공식품", code: "004", type: "X" },
    { name: "반찬/김치", code: "005", type: "X" },
    { name: "떡/빵/과자", code: "006", type: "X" },
    { name: "음료/차류", code: "007", type: "X" },
    { name: "양념/소스", code: "008", type: "X" },
    { name: "선물세트", code: "009", type: "X" },
    { name: "공예/민예품", code: "012", type: "X" },
    { name: "관광/숙박/체험", code: "013", type: "X" },
    { name: "기타상품", code: "015", type: "X" }
  ],
  socialEconomy: [
    { name: "경기도 일자리재단", code: "022", type: "P" },
    { name: "중증장애생산품", code: "023", type: "P" },
    { name: "사회적경제기업 제품", code: "025", type: "P" },
    { name: "친환경인증", code: "026", type: "P" },
    { name: "로컬인증", code: "027", type: "P" },
    { name: "착한소비", code: "028", type: "P" }
  ]
};

async function fetchPage(url: string): Promise<string> {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      responseType: 'arraybuffer' // Get raw bytes to handle encoding
    });
    
    // Convert from EUC-KR to UTF-8
    const html = iconv.decode(response.data, 'EUC-KR');
    return html;
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    throw error;
  }
}

function extractProducts($: cheerio.CheerioAPI, categoryName: string, categoryCode: string): Product[] {
  const products: Product[] = [];
  
  $('.gallery_list li').each((index, element) => {
    const $element = $(element);
    
    // Extract product ID from URL
    const linkElement = $element.find('a').first();
    const href = linkElement.attr('href') || '';
    const idMatch = href.match(/branduid=([0-9]+)/);
    const id = idMatch ? idMatch[1] : `${MALL_ID}-${categoryCode}-${index}`;
    
    // Extract product name
    const name = $element.find('.name').text().trim();
    
    // Extract prices
    const consumerPriceText = $element.find('.price .consumer').text().trim();
    const currentPriceText = $element.find('.price').text().replace(consumerPriceText, '').trim();
    
    const originalPrice = parseInt(consumerPriceText.replace(/[^0-9]/g, '')) || 0;
    const price = parseInt(currentPriceText.replace(/[^0-9]/g, '')) || originalPrice;
    
    // Extract image
    const imageUrl = $element.find('.tb img').attr('src') || '';
    const image = imageUrl.startsWith('http') ? imageUrl : `${BASE_URL}${imageUrl}`;
    
    // Build product link
    const link = href.startsWith('http') ? href : `${BASE_URL}${href}`;
    
    if (name && price > 0) {
      products.push({
        id,
        name,
        price,
        originalPrice,
        image,
        link,
        category: categoryName,
        categoryCode,
        mallId: MALL_ID,
        mallName: MALL_NAME
      });
    }
  });
  
  return products;
}

async function getLastPage($: cheerio.CheerioAPI): Promise<number> {
  // Look for pagination links
  const pageLinks = $('.paging a');
  let maxPage = 1;
  
  pageLinks.each((index, element) => {
    const pageText = $(element).text().trim();
    const pageNum = parseInt(pageText);
    if (!isNaN(pageNum) && pageNum > maxPage) {
      maxPage = pageNum;
    }
  });
  
  // Also check for "Last" button
  const lastPageLink = $('.paging a[href*="page="]:last');
  if (lastPageLink.length > 0) {
    const href = lastPageLink.attr('href') || '';
    const pageMatch = href.match(/page=(\d+)/);
    if (pageMatch) {
      const lastPage = parseInt(pageMatch[1]);
      if (lastPage > maxPage) {
        maxPage = lastPage;
      }
    }
  }
  
  return maxPage;
}

async function scrapeCategory(category: Category): Promise<Product[]> {
  const allProducts: Product[] = [];
  
  console.log(`Scraping category: ${category.name} (${category.type}${category.code})`);
  
  // First, get the first page to determine total pages
  const firstPageUrl = `${BASE_URL}/shop/shopbrand.html?type=${category.type}&xcode=${category.code}&sort=order&page=1`;
  
  try {
    const html = await fetchPage(firstPageUrl);
    const $ = cheerio.load(html);
    const lastPage = await getLastPage($);
    
    console.log(`  Total pages: ${lastPage}`);
    
    // Scrape all pages
    for (let page = 1; page <= lastPage; page++) {
      const url = `${BASE_URL}/shop/shopbrand.html?type=${category.type}&xcode=${category.code}&sort=order&page=${page}`;
      console.log(`  Fetching page ${page}...`);
      
      try {
        const pageHtml = await fetchPage(url);
        const $page = cheerio.load(pageHtml);
        
        const products = extractProducts($page, category.name, category.code);
        allProducts.push(...products);
        
        console.log(`  Found ${products.length} products (total: ${allProducts.length})`);
        
        // Add delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`  Error scraping page ${page}:`, error);
      }
    }
  } catch (error) {
    console.error(`  Error scraping category ${category.name}:`, error);
  }
  
  return allProducts;
}

async function main() {
  console.log(`Starting scraper for ${MALL_NAME} (ID: ${MALL_ID})`);
  console.log(`Mall URL: ${BASE_URL}`);
  console.log('Note: Site uses EUC-KR encoding');
  
  const allProducts: Product[] = [];
  
  // Scrape regular categories
  console.log('\nScraping regular categories...');
  for (const category of CATEGORIES.regular) {
    const categoryProducts = await scrapeCategory(category);
    allProducts.push(...categoryProducts);
  }
  
  // Scrape social economy categories
  console.log('\nScraping social economy categories...');
  for (const category of CATEGORIES.socialEconomy) {
    const categoryProducts = await scrapeCategory(category);
    allProducts.push(...categoryProducts);
  }
  
  // Remove duplicates based on product ID
  const uniqueProducts = Array.from(
    new Map(allProducts.map(p => [p.id, p])).values()
  );
  
  console.log(`\nTotal products scraped: ${uniqueProducts.length}`);
  
  // Save results
  const outputPath = join(__dirname, `products-${MALL_ID}.json`);
  writeFileSync(outputPath, JSON.stringify(uniqueProducts, null, 2));
  console.log(`Results saved to: ${outputPath}`);
  
  // Save summary
  const summary = {
    mallId: MALL_ID,
    mallName: MALL_NAME,
    totalProducts: uniqueProducts.length,
    scrapedAt: new Date().toISOString(),
    regularCategories: CATEGORIES.regular.map(c => ({
      name: c.name,
      code: c.code,
      productCount: uniqueProducts.filter(p => p.categoryCode === c.code).length
    })),
    socialEconomyCategories: CATEGORIES.socialEconomy.map(c => ({
      name: c.name,
      code: c.code,
      productCount: uniqueProducts.filter(p => p.categoryCode === c.code).length
    }))
  };
  
  const summaryPath = join(__dirname, `summary-${MALL_ID}.json`);
  writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  console.log(`Summary saved to: ${summaryPath}`);
}

// Run the scraper
main().catch(error => {
  console.error('Scraper failed:', error);
  process.exit(1);
});