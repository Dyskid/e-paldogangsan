import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import path from 'path';

const BASE_URL = 'https://yanggu-mall.com';
const OUTPUT_DIR = path.join(__dirname, 'output');
const DELAY_MS = 2000; // 2 second delay between requests

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  region: string;
  url: string;
  description: string;
  tags: string[];
  isFeatured: boolean;
  isNew: boolean;
  mall: {
    mallId: string;
    mallName: string;
    mallUrl: string;
    region: string;
  };
}

interface ScrapingResult {
  totalProducts: number;
  successfullyScraped: number;
  failedProducts: number;
  products: Product[];
  errors: Array<{
    url: string;
    error: string;
  }>;
}

async function ensureOutputDir() {
  try {
    await fs.access(OUTPUT_DIR);
  } catch {
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
  }
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchPage(url: string): Promise<string> {
  try {
    console.log(`Fetching: ${url}`);
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      timeout: 15000,
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${url}:`, error.message);
    throw error;
  }
}

async function extractProductUrlsFromHomepage(): Promise<string[]> {
  console.log('🏠 홈페이지에서 상품 URL 추출 중...');
  
  const html = await fetchPage(BASE_URL);
  const $ = cheerio.load(html);
  
  const productUrls = new Set<string>();
  
  // Look for direct product links on homepage
  $('a[href*="/goods/view?no="]').each((_, element) => {
    const href = $(element).attr('href');
    if (href) {
      const fullUrl = href.startsWith('http') ? href : BASE_URL + (href.startsWith('/') ? href : '/' + href);
      productUrls.add(fullUrl);
    }
  });
  
  // Also look for any links that contain 'view?no='
  $('a').each((_, element) => {
    const href = $(element).attr('href');
    if (href && href.includes('view?no=')) {
      const fullUrl = href.startsWith('http') ? href : BASE_URL + (href.startsWith('/') ? href : '/' + href);
      productUrls.add(fullUrl);
    }
  });
  
  console.log(`홈페이지에서 ${productUrls.size}개 상품 URL 발견`);
  
  return Array.from(productUrls);
}

async function scrapeProduct(productUrl: string): Promise<Product | null> {
  try {
    const html = await fetchPage(productUrl);
    const $ = cheerio.load(html);
    
    // Extract product ID from URL - fix regex pattern
    const urlMatch = productUrl.match(/no=(\d+)/);
    const productId = urlMatch ? urlMatch[1] : '';
    
    if (!productId) {
      console.log(`URL: ${productUrl}`);
      console.log(`Match result: ${urlMatch}`);
      throw new Error('Could not extract product ID from URL');
    }
    
    // Extract product title - using .name selector found in analysis
    let title = $('.name').first().text().trim();
                
    if (!title) {
      throw new Error('Could not extract product title');
    }
    
    // Extract price - using .sale_price selector found in analysis
    let price = 0;
    const priceText = $('.sale_price').first().text().trim();
    if (priceText) {
      // Remove ₩ and extract numbers
      const priceMatch = priceText.replace(/₩/g, '').match(/([\d,]+)/);
      if (priceMatch) {
        price = parseInt(priceMatch[1].replace(/,/g, ''));
      }
    }
    
    // If no price in .sale_price, try other selectors
    if (price === 0) {
      const fallbackSelectors = ['.price', '[class*="price"]', '.consumer_price', '.market_price'];
      for (const selector of fallbackSelectors) {
        const fallbackPriceText = $(selector).first().text().trim();
        if (fallbackPriceText) {
          const priceMatch = fallbackPriceText.replace(/₩/g, '').match(/([\d,]+)/);
          if (priceMatch) {
            price = parseInt(priceMatch[1].replace(/,/g, ''));
            break;
          }
        }
      }
    }
    
    // Extract image URL - using img[src*="goods"] found in analysis
    let imageUrl = '';
    const imgSrc = $('img[src*="goods"]').first().attr('src');
    if (imgSrc && !imgSrc.includes('no_image') && !imgSrc.includes('noimg')) {
      imageUrl = imgSrc.startsWith('http') ? imgSrc : BASE_URL + (imgSrc.startsWith('/') ? imgSrc : '/' + imgSrc);
    }
    
    // Extract description from summary
    let description = $('.summary').first().text().trim() || title;
    
    // Clean description
    description = description.replace(/\\s+/g, ' ').substring(0, 200);
    
    // Determine category based on title/description
    let category = '지역특산품';
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes('시래기') || titleLower.includes('무청')) {
      category = '농산물';
    } else if (titleLower.includes('나물') || titleLower.includes('곰취') || titleLower.includes('취나물')) {
      category = '농산물';
    } else if (titleLower.includes('쌀') || titleLower.includes('잡곡') || titleLower.includes('현미')) {
      category = '농산물';
    } else if (titleLower.includes('꿀') || titleLower.includes('벌꿀')) {
      category = '임산물';
    } else if (titleLower.includes('두부') || titleLower.includes('두유') || titleLower.includes('콩')) {
      category = '가공식품';
    } else if (titleLower.includes('한과') || titleLower.includes('과자') || titleLower.includes('빵')) {
      category = '가공식품';
    } else if (titleLower.includes('건강') || titleLower.includes('즙') || titleLower.includes('환')) {
      category = '건강식품';
    } else if (titleLower.includes('차') || titleLower.includes('티') || titleLower.includes('음료')) {
      category = '가공식품';
    } else if (titleLower.includes('김') || titleLower.includes('미역') || titleLower.includes('해조')) {
      category = '수산물';
    } else if (titleLower.includes('유정란') || titleLower.includes('계란')) {
      category = '축산물';
    }
    
    const product: Product = {
      id: `yanggu-${productId}`,
      name: title,
      price: price,
      image: imageUrl,
      category: category,
      region: '강원도',
      url: productUrl,
      description: description,
      tags: [
        '양구',
        '강원도',
        '지역특산품',
        '양구몰',
        category
      ],
      isFeatured: false,
      isNew: false,
      mall: {
        mallId: 'yanggu',
        mallName: '양구몰',
        mallUrl: BASE_URL,
        region: '강원도'
      }
    };
    
    console.log(`✅ 상품 추출 성공: ${title} (${price.toLocaleString()}원)`);
    return product;
    
  } catch (error) {
    console.error(`❌ 상품 추출 실패 ${productUrl}:`, error.message);
    return null;
  }
}

async function main() {
  try {
    await ensureOutputDir();
    
    console.log('🚀 양구몰 상품 스크래핑 시작...');
    
    // Extract product URLs from homepage
    const productUrls = await extractProductUrlsFromHomepage();
    console.log(`\\n📊 총 ${productUrls.length}개 상품 URL 발견`);
    
    if (productUrls.length === 0) {
      throw new Error('상품 URL을 찾을 수 없습니다');
    }
    
    // Save URLs for reference
    await fs.writeFile(
      path.join(OUTPUT_DIR, 'yanggu-product-urls.txt'),
      productUrls.join('\\n')
    );
    
    // Show sample URLs for debugging
    console.log('\\n📝 샘플 URL들:');
    productUrls.slice(0, 3).forEach(url => {
      console.log(`  ${url}`);
      const match = url.match(/no=(\d+)/);
      console.log(`  ID 추출: ${match ? match[1] : 'None'}`);
    });
    
    // Scrape products
    const result: ScrapingResult = {
      totalProducts: productUrls.length,
      successfullyScraped: 0,
      failedProducts: 0,
      products: [],
      errors: []
    };
    
    console.log('\\n🔍 상품 정보 추출 중...');
    
    for (let i = 0; i < productUrls.length; i++) {
      const url = productUrls[i];
      console.log(`\\n진행률: ${i + 1}/${productUrls.length} (${Math.round((i + 1) / productUrls.length * 100)}%)`);
      
      try {
        const product = await scrapeProduct(url);
        if (product && product.price > 0) {
          result.products.push(product);
          result.successfullyScraped++;
        } else if (product) {
          console.log(`⚠️ 가격 정보 없음: ${product.name}`);
          result.failedProducts++;
          result.errors.push({
            url,
            error: 'No price information'
          });
        } else {
          result.failedProducts++;
          result.errors.push({
            url,
            error: 'Failed to extract product data'
          });
        }
      } catch (error) {
        result.failedProducts++;
        result.errors.push({
          url,
          error: error.message
        });
        console.error(`❌ 스크래핑 실패: ${url} - ${error.message}`);
      }
      
      // Delay between requests
      if (i < productUrls.length - 1) {
        await delay(DELAY_MS);
      }
    }
    
    // Save results
    await fs.writeFile(
      path.join(OUTPUT_DIR, 'yanggu-products.json'),
      JSON.stringify(result.products, null, 2)
    );
    
    await fs.writeFile(
      path.join(OUTPUT_DIR, 'yanggu-scrape-summary.json'),
      JSON.stringify(result, null, 2)
    );
    
    console.log('\\n📊 스크래핑 완료!');
    console.log(`✅ 성공: ${result.successfullyScraped}개`);
    console.log(`❌ 실패: ${result.failedProducts}개`);
    console.log(`💰 가격이 있는 상품: ${result.products.length}개`);
    
    // Show sample products
    if (result.products.length > 0) {
      console.log('\\n🛍️ 추출된 상품 샘플:');
      result.products.slice(0, 5).forEach(product => {
        console.log(`  - ${product.name}: ${product.price.toLocaleString()}원 (${product.category})`);
      });
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ 스크래핑 실패:', error);
    throw error;
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export default main;