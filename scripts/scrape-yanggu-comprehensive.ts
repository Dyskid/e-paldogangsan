import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import path from 'path';

const BASE_URL = 'https://yanggu-mall.com';
const OUTPUT_DIR = path.join(__dirname, 'output');
const DELAY_MS = 1000; // 1 second delay between requests

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

async function extractProductUrls(): Promise<string[]> {
  const productUrls = new Set<string>();
  
  console.log('🔍 홈페이지에서 상품 URL 추출 중...');
  
  // Get homepage to find featured products
  try {
    const homepageHtml = await fetchPage(BASE_URL);
    const $ = cheerio.load(homepageHtml);
    
    // Look for product links on homepage
    const productSelectors = [
      'a[href*="/goods/view?no="]',
      'a[href*="goods/view"]',
      '.product a',
      '.goods a',
      '.item a'
    ];
    
    productSelectors.forEach(selector => {
      $(selector).each((_, element) => {
        const href = $(element).attr('href');
        if (href && href.includes('/goods/view?no=')) {
          const fullUrl = href.startsWith('http') ? href : BASE_URL + (href.startsWith('/') ? href : '/' + href);
          productUrls.add(fullUrl);
        }
      });
    });
    
    console.log(`홈페이지에서 ${productUrls.size}개 상품 URL 발견`);
    
  } catch (error) {
    console.error('홈페이지 분석 실패:', error.message);
  }
  
  await delay(DELAY_MS);
  
  // Get category pages
  const categoryUrls = [
    'https://yanggu-mall.com/goods/catalog?code=0001', // 과일/야채/시래기
    'https://yanggu-mall.com/goods/catalog?code=00010007', // 양구시래기
    'https://yanggu-mall.com/goods/catalog?code=00010002', // 나물류
    'https://yanggu-mall.com/goods/catalog?code=00010003', // 채소
    'https://yanggu-mall.com/goods/catalog?code=00010006', // 오미자
    'https://yanggu-mall.com/goods/catalog?code=0003', // 해조류
    'https://yanggu-mall.com/goods/catalog?code=0002', // 쌀/잡곡
    'https://yanggu-mall.com/goods/catalog?code=0021', // 임산물
    'https://yanggu-mall.com/goods/catalog?code=00210001', // 꿀
    'https://yanggu-mall.com/goods/catalog?code=00210002', // 가시오가피
    'https://yanggu-mall.com/goods/catalog?code=0017', // 가공식품
    'https://yanggu-mall.com/goods/catalog?code=00170001', // 간편식/반찬/장아찌
    'https://yanggu-mall.com/goods/catalog?code=00170002', // 한과
    'https://yanggu-mall.com/goods/catalog?code=00170004', // 두유
    'https://yanggu-mall.com/goods/catalog?code=00170005', // 간식류/빵류
    'https://yanggu-mall.com/goods/catalog?code=0005', // 건강식품
    'https://yanggu-mall.com/goods/catalog?code=00050002', // 건강즙/건강환
    'https://yanggu-mall.com/goods/catalog?code=0006', // 생활용품
    'https://yanggu-mall.com/goods/catalog?code=00060003', // 커피/음료/차류
    'https://yanggu-mall.com/goods/catalog?code=00060006', // 우유/치즈/요거트
  ];
  
  console.log('📋 카테고리 페이지에서 상품 URL 추출 중...');
  
  for (const categoryUrl of categoryUrls) {
    try {
      const categoryHtml = await fetchPage(categoryUrl);
      const $ = cheerio.load(categoryHtml);
      
      // Extract product URLs from category page
      $('a[href*="/goods/view?no="]').each((_, element) => {
        const href = $(element).attr('href');
        if (href) {
          const fullUrl = href.startsWith('http') ? href : BASE_URL + (href.startsWith('/') ? href : '/' + href);
          productUrls.add(fullUrl);
        }
      });
      
      console.log(`${categoryUrl}에서 ${productUrls.size}개 누적`);
      await delay(DELAY_MS);
      
    } catch (error) {
      console.error(`카테고리 ${categoryUrl} 분석 실패:`, error.message);
    }
  }
  
  return Array.from(productUrls);
}

async function scrapeProduct(productUrl: string): Promise<Product | null> {
  try {
    const html = await fetchPage(productUrl);
    const $ = cheerio.load(html);
    
    // Extract product ID from URL
    const urlMatch = productUrl.match(/no=(\d+)/);
    const productId = urlMatch ? urlMatch[1] : '';
    
    if (!productId) {
      throw new Error('Could not extract product ID from URL');
    }
    
    // Extract product title
    let title = $('.name').first().text().trim() ||
                $('h1').text().trim() ||
                $('.title').text().trim() ||
                $('.product-name').text().trim() ||
                $('.goods_name').text().trim() ||
                $('.item_name').text().trim() ||
                $('title').text().replace('양구몰', '').trim() ||
                '';
                
    if (!title || title === '양구몰') {
      // Try meta description as fallback
      title = $('meta[name="description"]').attr('content') || '';
      if (title.includes('양구')) {
        title = title.split('.')[0].trim();
      }
    }
    
    if (!title) {
      throw new Error('Could not extract product title');
    }
    
    // Extract price
    let price = 0;
    const priceSelectors = [
      '.price', '.goods_price', '.product_price', '.item_price',
      '[class*="price"]', '.money', '.cost', '.amount'
    ];
    
    for (const selector of priceSelectors) {
      const priceText = $(selector).first().text().trim();
      if (priceText) {
        const priceMatch = priceText.match(/([\\d,]+)/);
        if (priceMatch) {
          price = parseInt(priceMatch[1].replace(/,/g, ''));
          break;
        }
      }
    }
    
    // Extract image URL
    let imageUrl = '';
    const imageSelectors = [
      '.goods_image img', '.product_image img', '.item_image img',
      '#goods_image img', '#product_image img',
      '.thumb img', '.thumbnail img',
      '.image img', 'img[src*="goods"]'
    ];
    
    for (const selector of imageSelectors) {
      const imgSrc = $(selector).first().attr('src');
      if (imgSrc && !imgSrc.includes('no_image') && !imgSrc.includes('noimg')) {
        imageUrl = imgSrc.startsWith('http') ? imgSrc : BASE_URL + (imgSrc.startsWith('/') ? imgSrc : '/' + imgSrc);
        break;
      }
    }
    
    // Extract description
    let description = $('.description').first().text().trim() ||
                     $('.goods_description').first().text().trim() ||
                     $('.product_description').first().text().trim() ||
                     title;
    
    // Clean description
    description = description.replace(/\s+/g, ' ').substring(0, 200);
    
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
    
    console.log(`✅ 상품 추출 성공: ${title} (${price}원)`);
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
    
    // Extract all product URLs
    const productUrls = await extractProductUrls();
    console.log(`\\n📊 총 ${productUrls.length}개 상품 URL 발견`);
    
    if (productUrls.length === 0) {
      throw new Error('상품 URL을 찾을 수 없습니다');
    }
    
    // Save URLs for reference
    await fs.writeFile(
      path.join(OUTPUT_DIR, 'yanggu-product-urls.txt'),
      productUrls.join('\\n')
    );
    
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
        console.log(`  - ${product.name}: ${product.price.toLocaleString()}원`);
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