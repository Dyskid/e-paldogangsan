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
}

const MALL_ID = 59;
const MALL_NAME = '초록믿음(강진)';
const BASE_URL = 'https://greengj.com/';

// Categories from analysis
const CATEGORIES: Category[] = [
  {
    "id": "cat1",
    "name": "회원가입",
    "url": "https://greengj.com/member/agreement.html"
  },
  {
    "id": "cat2",
    "name": "로그인",
    "url": "https://greengj.com/member/login.html"
  },
  {
    "id": "cat3",
    "name": "주문조회",
    "url": "https://greengj.com/myshop/order/list.html"
  },
  {
    "id": "cat4",
    "name": "최근본상품",
    "url": "https://greengj.com/product/recent_view_product.html"
  },
  {
    "id": "cat5",
    "name": "전체상품",
    "url": "https://greengj.com/category/%EC%A0%84%EC%B2%B4%EC%83%81%ED%92%88/24/"
  },
  {
    "id": "cat6",
    "name": "발효식품",
    "url": "https://greengj.com/category/%EB%B0%9C%ED%9A%A8%EC%8B%9D%ED%92%88/25/"
  },
  {
    "id": "cat7",
    "name": "곡류",
    "url": "https://greengj.com/category/%EA%B3%A1%EB%A5%98/41/"
  },
  {
    "id": "cat8",
    "name": "건강식품",
    "url": "https://greengj.com/category/%EA%B1%B4%EA%B0%95%EC%8B%9D%ED%92%88/31/"
  },
  {
    "id": "cat9",
    "name": "버섯류",
    "url": "https://greengj.com/category/%EB%B2%84%EC%84%AF%EB%A5%98/39/"
  },
  {
    "id": "cat10",
    "name": "가공식품",
    "url": "https://greengj.com/category/%EA%B0%80%EA%B3%B5%EC%8B%9D%ED%92%88/28/"
  }
];

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrapeProducts(categoryUrl: string, categoryName: string, categoryId: string): Promise<Product[]> {
  const products: Product[] = [];
  
  try {
    console.log(`Scraping category: ${categoryName} from ${categoryUrl}`);
    
    const response = await axios.get(categoryUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8'
      }
    });
    
    const $ = cheerio.load(response.data);
    
    // Find products using selectors from analysis
    $('li.xans-record-').each((index, element) => {
      try {
        const $item = $(element);
        
        // Extract product name
        const name = $item.find('').text().trim();
        
        // Extract price
        const priceText = $item.find('').text();
        const price = parseInt(priceText.replace(/[^0-9]/g, '')) || 0;
        
        // Extract image
        const imageEl = $item.find('').first();
        let image = imageEl.attr('src') || imageEl.attr('data-src') || '';
        if (image && !image.startsWith('http')) {
          image = new URL(image, BASE_URL).toString();
        }
        
        // Extract link
        const linkEl = $item.find('a').first();
        let link = linkEl.attr('href') || '';
        if (link && !link.startsWith('http')) {
          link = new URL(link, BASE_URL).toString();
        }
        
        // Generate product ID
        const id = link.match(/[?&](?:no|id|prod|product)[_=]([^&]+)/i)?.[1] || 
                  'prod_' + Date.now() + '_' + index;
        
        if (name && price > 0) {
          products.push({
            id,
            name,
            price,
            image,
            link,
            seller: MALL_NAME,
            category: categoryName,
            categoryId,
            mallId: MALL_ID,
            mallName: MALL_NAME
          });
        }
      } catch (err) {
        console.error('Error parsing product:', err);
      }
    });
    
    console.log(`Found ${products.length} products in ${categoryName}`);
    
  } catch (error) {
    console.error(`Error scraping category ${categoryName}:`, error);
  }
  
  return products;
}

async function main() {
  console.log(`Starting scraper for ${MALL_NAME} (ID: ${MALL_ID})`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Total categories: ${CATEGORIES.length}`);
  
  const allProducts: Product[] = [];
  
  // Scrape each category
  for (const category of CATEGORIES) {
    const products = await scrapeProducts(category.url, category.name, category.id);
    allProducts.push(...products);
    
    // Delay between requests
    await delay(2000);
  }
  
  // Save results
  const outputPath = join(__dirname, 'data');
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = join(outputPath, `products_${MALL_ID}_${timestamp}.json`);
  
  writeFileSync(filename, JSON.stringify({
    mallId: MALL_ID,
    mallName: MALL_NAME,
    scrapedAt: new Date().toISOString(),
    totalProducts: allProducts.length,
    products: allProducts
  }, null, 2));
  
  console.log(`\nScraping completed!`);
  console.log(`Total products: ${allProducts.length}`);
  console.log(`Results saved to: ${filename}`);
}

// Run the scraper
main().catch(console.error);
