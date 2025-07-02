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

const MALL_ID = 55;
const MALL_NAME = '완도군이숍';
const BASE_URL = 'https://wandofood.go.kr/';

// Categories from analysis
const CATEGORIES: Category[] = [
  {
    "id": "cat1",
    "name": "완도전복",
    "url": "https://wandofood.go.kr/category/%EC%99%84%EB%8F%84%EC%A0%84%EB%B3%B5/744/"
  },
  {
    "id": "cat2",
    "name": "해조류",
    "url": "https://wandofood.go.kr/category/%ED%95%B4%EC%A1%B0%EB%A5%98/745/"
  },
  {
    "id": "cat3",
    "name": "수산물",
    "url": "https://wandofood.go.kr/category/%EC%88%98%EC%82%B0%EB%AC%BC/746/"
  },
  {
    "id": "cat4",
    "name": "농산물",
    "url": "https://wandofood.go.kr/category/%EB%86%8D%EC%82%B0%EB%AC%BC/747/"
  },
  {
    "id": "cat5",
    "name": "간편식품",
    "url": "https://wandofood.go.kr/category/%EA%B0%84%ED%8E%B8%EC%8B%9D%ED%92%88/801/"
  },
  {
    "id": "cat6",
    "name": "소상공인 선물꾸러미",
    "url": "https://wandofood.go.kr/category/%EC%86%8C%EC%83%81%EA%B3%B5%EC%9D%B8-%EC%84%A0%EB%AC%BC%EA%BE%B8%EB%9F%AC%EB%AF%B8/806/"
  },
  {
    "id": "cat14",
    "name": "알뜰장보기",
    "url": "https://wandofood.go.kr/product/project.html?cate_no=743"
  },
  {
    "id": "cat15",
    "name": "도착보장",
    "url": "https://wandofood.go.kr/product/project.html?cate_no=742"
  },
  {
    "id": "cat16",
    "name": "간편식품",
    "url": "https://wandofood.go.kr/product/list.html?cate_no=801"
  },
  {
    "id": "cat17",
    "name": "소상공인 선물꾸러미",
    "url": "https://wandofood.go.kr/product/list.html?cate_no=806"
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
