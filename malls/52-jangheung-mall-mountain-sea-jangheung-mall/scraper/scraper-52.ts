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

const MALL_ID = 52;
const MALL_NAME = '장흥몰 (산들해랑장흥몰)';
const BASE_URL = 'https://okjmall.com/';

// Categories from analysis
const CATEGORIES: Category[] = [
  {
    "id": "cat1",
    "name": "로그인",
    "url": "https://okjmall.com/member/login.php"
  },
  {
    "id": "cat2",
    "name": "회원가입",
    "url": "https://okjmall.com/member/join_method.php"
  },
  {
    "id": "cat3",
    "name": "상품문의",
    "url": "https://okjmall.com/board/list.php?bdId=goodsqa"
  },
  {
    "id": "cat4",
    "name": "상품후기",
    "url": "https://okjmall.com/board/list.php?bdId=goodsreview"
  },
  {
    "id": "cat6",
    "name": "에버가닉 함초소금 250g",
    "url": "https://okjmall.com/goods/goods_view.php?goodsNo=1000000155"
  },
  {
    "id": "cat7",
    "name": "농산물",
    "url": "https://okjmall.com/goods/goods_list.php?cateCd=015"
  },
  {
    "id": "cat8",
    "name": "쌀",
    "url": "https://okjmall.com/goods/goods_list.php?cateCd=015001"
  },
  {
    "id": "cat9",
    "name": "백미",
    "url": "https://okjmall.com/goods/goods_list.php?cateCd=015001001"
  },
  {
    "id": "cat10",
    "name": "현미",
    "url": "https://okjmall.com/goods/goods_list.php?cateCd=015001003"
  },
  {
    "id": "cat11",
    "name": "잡곡/혼합곡",
    "url": "https://okjmall.com/goods/goods_list.php?cateCd=015001002"
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
    
    // Try common product selectors
    const productSelectors = [
      '.xans-product-normalpackage .item',
      '.product-item',
      '.goods-item',
      'li.xans-record-',
      '.prd-item',
      '.product',
      '.item'
    ];
    
    let foundProducts = false;
    for (const selector of productSelectors) {
      const items = $(selector);
      if (items.length > 0) {
        items.each((index, element) => {
          try {
            const $item = $(element);
            
            // Extract product name
            const nameEl = $item.find('h3, h4, h5, .name, .prd-name, .item-name').first();
            const name = nameEl.text().trim();
            
            // Extract price
            const priceEl = $item.find('.price, .cost, span:contains("원"), .prd-price').first();
            const priceText = priceEl.text();
            const price = parseInt(priceText.replace(/[^0-9]/g, '')) || 0;
            
            // Extract image
            const imageEl = $item.find('img').first();
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
              foundProducts = true;
            }
          } catch (err) {
            console.error('Error parsing product:', err);
          }
        });
        
        if (foundProducts) break;
      }
    }
    
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
