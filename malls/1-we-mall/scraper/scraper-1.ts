import axios from 'axios';
import * as cheerio from 'cheerio';
import { writeFileSync } from 'fs';
import { join } from 'path';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  link: string;
  seller: string;
  category: string;
  categoryId: string;
  mallId: number;
  mallName: string;
}

interface Category {
  id: string;
  name: string;
  url: string;
  subcategories?: Category[];
}

const MALL_ID = 1;
const MALL_NAME = '우리몰';
const BASE_URL = 'https://wemall.kr';
const ITEMS_PER_PAGE = 12;

// Categories from analysis
const CATEGORIES: Category[] = [
  {
    id: "001",
    name: "식품/농산품",
    url: "https://wemall.kr/product/product.html?category=001",
    subcategories: [
      { id: "001013", name: "쌀/농축산물", url: "https://wemall.kr/product/product.html?category=001013" },
      { id: "001021", name: "차/음료/과자/가공식품", url: "https://wemall.kr/product/product.html?category=001021" },
      { id: "001022", name: "건강식품/다이어트", url: "https://wemall.kr/product/product.html?category=001022" }
    ]
  },
  {
    id: "002",
    name: "생활용품",
    url: "https://wemall.kr/product/product.html?category=002",
    subcategories: [
      { id: "002014", name: "가구/인테리어", url: "https://wemall.kr/product/product.html?category=002014" },
      { id: "002023", name: "침구/커튼/소품", url: "https://wemall.kr/product/product.html?category=002023" },
      { id: "002024", name: "주방/생활/수납용품", url: "https://wemall.kr/product/product.html?category=002024" },
      { id: "002025", name: "원예/선물", url: "https://wemall.kr/product/product.html?category=002025" },
      { id: "002049", name: "건강/미용", url: "https://wemall.kr/product/product.html?category=002049" }
    ]
  }
  // Add more categories as needed
];

async function fetchPage(url: string): Promise<string> {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    throw error;
  }
}

function extractProducts($: cheerio.CheerioAPI, categoryName: string, categoryId: string): Product[] {
  const products: Product[] = [];
  
  $('.shop .list > li').each((index, element) => {
    const $element = $(element);
    
    // Extract product details
    const name = $element.find('.description h3 em').text().trim();
    const priceText = $element.find('.description .price strong').text().trim();
    const price = parseInt(priceText.replace(/[^0-9]/g, '')) || 0;
    const imageUrl = $element.find('.tumb img').attr('src') || '';
    const image = imageUrl.startsWith('http') ? imageUrl : `${BASE_URL}${imageUrl}`;
    const linkUrl = $element.find('.btn a.view').attr('href') || '';
    const link = linkUrl.startsWith('http') ? linkUrl : `${BASE_URL}${linkUrl}`;
    const seller = $element.find('.description .point span').text().trim();
    
    // Extract product ID from link
    const idMatch = linkUrl.match(/id=([^&]+)/);
    const id = idMatch ? idMatch[1] : `${MALL_ID}-${Date.now()}-${index}`;
    
    if (name && price > 0) {
      products.push({
        id,
        name,
        price,
        image,
        link,
        seller,
        category: categoryName,
        categoryId,
        mallId: MALL_ID,
        mallName: MALL_NAME
      });
    }
  });
  
  return products;
}

async function scrapeCategory(category: Category, parentName: string = ''): Promise<Product[]> {
  const allProducts: Product[] = [];
  const categoryName = parentName ? `${parentName} > ${category.name}` : category.name;
  
  console.log(`Scraping category: ${categoryName}`);
  
  // Scrape subcategories first if they exist
  if (category.subcategories && category.subcategories.length > 0) {
    for (const subcategory of category.subcategories) {
      const subcategoryProducts = await scrapeCategory(subcategory, category.name);
      allProducts.push(...subcategoryProducts);
    }
  } else {
    // Scrape products from this category
    let start = 0;
    let hasMorePages = true;
    
    while (hasMorePages) {
      const url = `${category.url}&start=${start}`;
      console.log(`  Fetching page: ${url}`);
      
      try {
        const html = await fetchPage(url);
        const $ = cheerio.load(html);
        
        const products = extractProducts($, categoryName, category.id);
        
        if (products.length === 0) {
          hasMorePages = false;
        } else {
          allProducts.push(...products);
          console.log(`  Found ${products.length} products (total: ${allProducts.length})`);
          
          // Check if there's a next page
          const nextPageExists = $('.pagination a.next').length > 0;
          if (!nextPageExists || products.length < ITEMS_PER_PAGE) {
            hasMorePages = false;
          } else {
            start += ITEMS_PER_PAGE;
          }
        }
        
        // Add delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`  Error scraping category ${categoryName}:`, error);
        hasMorePages = false;
      }
    }
  }
  
  return allProducts;
}

async function main() {
  console.log(`Starting scraper for ${MALL_NAME} (ID: ${MALL_ID})`);
  
  const allProducts: Product[] = [];
  
  // Scrape all categories
  for (const category of CATEGORIES) {
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
    categories: CATEGORIES.map(c => ({
      name: c.name,
      productCount: uniqueProducts.filter(p => p.categoryId.startsWith(c.id)).length
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