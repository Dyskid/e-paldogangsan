import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

interface MallInfo {
  id: string;
  name: string;
  url: string;
  originalUrl?: string;
  region: string;
  status: 'pending' | 'scraping' | 'completed' | 'failed';
  productCount?: number;
  error?: string;
}

interface ScrapedProduct {
  id: string;
  url: string;
  title: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  category?: string;
  categoryId?: string;
  isAvailable: boolean;
  brand?: string;
  description?: string;
  mallName: string;
  mallUrl: string;
  scrapedAt: string;
}

// Updated URLs from mergedmalls.txt file
const failedMalls: MallInfo[] = [
  // DNS failures - no @ marks in mergedmalls.txt, keeping original URLs
  { id: 'on-seoul', name: '온서울마켓', url: 'https://on.seoul.go.kr', region: '서울특별시', status: 'pending' },
  { id: 'busan-brand', name: '부산브랜드몰', url: 'https://busanbrand.kr', region: '부산광역시', status: 'pending' },
  { id: 'incheon-emall', name: '인천e몰', url: 'https://www.incheone-mall.kr', region: '인천광역시', status: 'pending' },
  { id: 'ulsan-mall', name: '울산몰', url: 'https://www.ulsanmall.kr', region: '울산광역시', status: 'pending' },
  
  // Rate limiting (Naver smartstore) - marked with @@ in mergedmalls.txt
  { id: 'market-gyeonggi', name: '마켓경기', url: 'https://smartstore.naver.com/marketgyeonggi', region: '경기도', status: 'pending' },
  { id: 'sunchang-local', name: '순창로컬푸드', url: 'https://smartstore.naver.com/schfarm', region: '전라북도', status: 'pending' },
  { id: 'happy-goodfarm', name: '해피굿팜', url: 'https://smartstore.naver.com/hgoodfarm', region: '전라남도', status: 'pending' },
  
  // SSL certificate issues - URLs updated in mergedmalls.txt
  { id: 'jecheon-local', name: '제천로컬푸드', url: 'https://www.jclocal.co.kr/index.local', region: '충청북도', status: 'pending' },
  { id: 'jps-mall', name: '지평선몰', url: 'https://www.jpsmall.com/', originalUrl: 'https://jpsmall.com/', region: '전라북도', status: 'pending' },
  { id: 'jinan-gowon', name: '진안고원몰', url: 'https://xn--299az5xoii3qb66f.com/', originalUrl: 'https://jinangowonmall.com/', region: '전라북도', status: 'pending' },
  { id: 'imsil-mall', name: '임실몰', url: 'https://www.imsilin.kr/home', region: '전라북도', status: 'pending' },
  { id: 'andong-jang', name: '안동장터', url: 'https://andongjang.andong.go.kr/', region: '경상북도', status: 'pending' },
  { id: 'gimcheon-nodaji', name: '김천노다지장터', url: 'https://www.gcnodaji.com/', originalUrl: 'http://gcnodaji.com/', region: '경상북도', status: 'pending' },
  
  // 404 error - URL updated in mergedmalls.txt
  { id: 'haenam-miso', name: '해남미소', url: 'https://www.hnmiso.com/kwa-home', originalUrl: 'https://www.hnmiso.com/ACC_index.asp', region: '전라남도', status: 'pending' },
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Create axios instance with custom HTTPS agent to handle certificate issues
const createAxiosInstance = () => {
  const httpsAgent = new https.Agent({
    rejectUnauthorized: false // Accept self-signed certificates
  });
  
  return axios.create({
    httpsAgent,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    },
    timeout: 30000,
    maxRedirects: 5
  });
};

// Special handler for Naver smartstore
async function scrapeNaverSmartstore(mall: MallInfo): Promise<ScrapedProduct[]> {
  console.log(`Attempting Naver Smartstore scrape for ${mall.name}`);
  const products: ScrapedProduct[] = [];
  
  // Naver smartstore requires special handling
  // For now, we'll skip these as they require browser automation
  console.log(`Skipping ${mall.name} - Naver smartstore requires browser automation`);
  
  return products;
}

// Enhanced generic scraper with better error handling
async function scrapeEnhancedMall(mall: MallInfo): Promise<ScrapedProduct[]> {
  console.log(`\nStarting enhanced scrape for ${mall.name} (${mall.url})`);
  const products: ScrapedProduct[] = [];
  const axiosInstance = createAxiosInstance();
  
  try {
    // Try the updated URL first, then fall back to original if needed
    let response;
    let actualUrl = mall.url;
    
    try {
      response = await axiosInstance.get(mall.url);
    } catch (error) {
      if (mall.originalUrl) {
        console.log(`Failed with updated URL, trying original: ${mall.originalUrl}`);
        actualUrl = mall.originalUrl;
        response = await axiosInstance.get(mall.originalUrl);
      } else {
        throw error;
      }
    }
    
    const $ = cheerio.load(response.data);
    
    // Extended list of product selectors
    const productSelectors = [
      '.product-item', '.item', '.goods-item', '.product', 
      '.prd-item', '.prd_item', '.product-list li', '.goods_list li',
      '.item-list li', '.product_list li', 'ul.products li',
      '.product-grid .item', '.goods-list .item', '.goods_wrap .goods',
      '.product_list .product', '.shop-item', '.prd-list li',
      // Specific selectors for Korean mall platforms
      '.xans-product-listitem', '.prd_list li', '.goods-list-item',
      '.ec-base-product li', '.item_list .item', '.product_item'
    ];
    
    let foundProducts = false;
    
    for (const selector of productSelectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        console.log(`Found ${elements.length} products with selector: ${selector}`);
        
        elements.each((index, element) => {
          try {
            const $elem = $(element);
            
            // Enhanced URL extraction
            let productUrl = '';
            const linkSelectors = ['a', 'a.link', 'a.product-link', '.product-name a', '.name a', '.thumb a'];
            for (const linkSel of linkSelectors) {
              const link = $elem.find(linkSel).first();
              if (link.length > 0) {
                productUrl = link.attr('href') || '';
                if (productUrl) break;
              }
            }
            
            if (!productUrl) return;
            
            // Make URL absolute
            if (!productUrl.startsWith('http')) {
              productUrl = new URL(productUrl, actualUrl).href;
            }
            
            // Enhanced title extraction
            let title = '';
            const titleSelectors = [
              '.product-name', '.item-name', '.goods-name', '.title', '.name', 
              '.prd-name', '.prd_name', '.product_name', '.goods_name', '.item_title'
            ];
            for (const titleSel of titleSelectors) {
              const titleElem = $elem.find(titleSel).first();
              if (titleElem.length > 0) {
                title = titleElem.text().trim();
                if (title) break;
              }
            }
            
            if (!title) return;
            
            // Enhanced price extraction
            let price = 0;
            const priceSelectors = [
              '.price', '.product-price', '.item-price', '.goods-price', '.cost',
              '.prd-price', '.sell_price', '.product_price', '.item_price'
            ];
            for (const priceSel of priceSelectors) {
              const priceElem = $elem.find(priceSel).first();
              if (priceElem.length > 0) {
                const priceText = priceElem.text();
                const priceMatch = priceText.match(/[\d,]+/);
                if (priceMatch) {
                  price = parseInt(priceMatch[0].replace(/,/g, ''));
                  if (price > 0) break;
                }
              }
            }
            
            // Enhanced image extraction
            let imageUrl = '';
            const imgSelectors = ['img', '.thumb img', '.product-image img', '.prd-img img'];
            for (const imgSel of imgSelectors) {
              const imgElem = $elem.find(imgSel).first();
              if (imgElem.length > 0) {
                imageUrl = imgElem.attr('src') || imgElem.attr('data-src') || imgElem.attr('data-original') || '';
                if (imageUrl) {
                  if (!imageUrl.startsWith('http')) {
                    imageUrl = new URL(imageUrl, actualUrl).href;
                  }
                  break;
                }
              }
            }
            
            // Generate product ID
            const productId = `${mall.id}_${Date.now()}_${index}`;
            
            products.push({
              id: productId,
              url: productUrl,
              title,
              price,
              imageUrl,
              isAvailable: true,
              mallName: mall.name,
              mallUrl: actualUrl,
              scrapedAt: new Date().toISOString()
            });
            
          } catch (err) {
            console.error(`Error extracting product:`, err);
          }
        });
        
        foundProducts = true;
        break;
      }
    }
    
    if (!foundProducts) {
      console.log(`No products found for ${mall.name}. Site may require browser automation.`);
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error scraping ${mall.name}:`, errorMessage);
    throw error;
  }
  
  return products;
}

async function retryFailedMalls() {
  console.log('Starting retry for failed malls with updated URLs...');
  console.log(`Total malls to retry: ${failedMalls.length}`);
  
  const results: any[] = [];
  const startTime = Date.now();
  
  // Create output directory
  const outputDir = path.join(__dirname, 'output', 'retry-scrape');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  for (const mall of failedMalls) {
    mall.status = 'scraping';
    console.log(`\n=== Processing ${mall.name} ===`);
    
    try {
      let products: ScrapedProduct[] = [];
      
      // Use special handler for Naver smartstore
      if (mall.url.includes('smartstore.naver.com')) {
        products = await scrapeNaverSmartstore(mall);
      } else {
        products = await scrapeEnhancedMall(mall);
      }
      
      mall.status = 'completed';
      mall.productCount = products.length;
      
      // Save individual mall results
      if (products.length > 0) {
        const mallFile = path.join(outputDir, `${mall.id}-products.json`);
        fs.writeFileSync(mallFile, JSON.stringify(products, null, 2));
      }
      
      results.push({
        mall: mall.name,
        url: mall.url,
        region: mall.region,
        status: 'success',
        productCount: products.length,
        products
      });
      
      console.log(`✓ ${mall.name}: ${products.length} products`);
      
    } catch (error) {
      mall.status = 'failed';
      mall.error = error instanceof Error ? error.message : String(error);
      
      results.push({
        mall: mall.name,
        url: mall.url,
        region: mall.region,
        status: 'failed',
        error: mall.error
      });
      
      console.log(`✗ ${mall.name}: Failed - ${mall.error}`);
    }
    
    // Rate limiting
    await delay(3000);
  }
  
  // Save summary
  const summary = {
    totalMalls: failedMalls.length,
    successful: results.filter(r => r.status === 'success').length,
    failed: results.filter(r => r.status === 'failed').length,
    totalProducts: results.reduce((sum, r) => sum + (r.productCount || 0), 0),
    duration: Math.round((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
    results
  };
  
  fs.writeFileSync(
    path.join(outputDir, 'retry-scrape-summary.json'),
    JSON.stringify(summary, null, 2)
  );
  
  console.log('\n=== Retry Scraping Complete ===');
  console.log(`Total malls: ${summary.totalMalls}`);
  console.log(`Successful: ${summary.successful}`);
  console.log(`Failed: ${summary.failed}`);
  console.log(`Total products: ${summary.totalProducts}`);
  console.log(`Duration: ${summary.duration} seconds`);
  
  return summary;
}

// Run the retry scraper
if (require.main === module) {
  retryFailedMalls().catch(console.error);
}

export { retryFailedMalls };