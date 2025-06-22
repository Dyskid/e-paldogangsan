import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import path from 'path';

const TEST_URL = 'https://yanggu-mall.com/goods/view?no=107927';
const OUTPUT_DIR = path.join(__dirname, 'output');

async function ensureOutputDir() {
  try {
    await fs.access(OUTPUT_DIR);
  } catch {
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
  }
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

async function analyzePage() {
  try {
    await ensureOutputDir();
    
    const html = await fetchPage(TEST_URL);
    const $ = cheerio.load(html);
    
    // Save HTML for analysis
    await fs.writeFile(path.join(OUTPUT_DIR, 'yanggu-product-sample.html'), html);
    
    console.log('\\n=== 상품 정보 분석 ===');
    
    // Title extraction tests
    console.log('\\n📝 제목 추출 테스트:');
    const titleSelectors = [
      '.name',
      '.goods_name', 
      '.product_name',
      '.item_name',
      'h1',
      '.title',
      '#goods_name',
      '.product-title',
      '.goods-title'
    ];
    
    titleSelectors.forEach(selector => {
      const text = $(selector).first().text().trim();
      if (text) {
        console.log(`  ${selector}: "${text}"`);
      }
    });
    
    // Price extraction tests
    console.log('\\n💰 가격 추출 테스트:');
    const priceSelectors = [
      '.price',
      '.goods_price',
      '.product_price', 
      '.item_price',
      '[class*="price"]',
      '.money',
      '.cost',
      '.amount',
      '#goods_price',
      '.sale_price',
      '.selling_price',
      '.consumer_price',
      '.market_price'
    ];
    
    priceSelectors.forEach(selector => {
      const text = $(selector).first().text().trim();
      if (text) {
        console.log(`  ${selector}: "${text}"`);
      }
    });
    
    // Image extraction tests
    console.log('\\n🖼️ 이미지 추출 테스트:');
    const imageSelectors = [
      '.goods_image img',
      '.product_image img',
      '.item_image img',
      '#goods_image img',
      '#product_image img',
      '.thumb img',
      '.thumbnail img',
      '.image img',
      'img[src*="goods"]',
      'img[src*="product"]'
    ];
    
    imageSelectors.forEach(selector => {
      const src = $(selector).first().attr('src');
      if (src) {
        console.log(`  ${selector}: "${src}"`);
      }
    });
    
    // Look for all elements containing numbers (potential prices)
    console.log('\\n🔍 숫자가 포함된 요소들:');
    $('*').each((_, element) => {
      const text = $(element).text().trim();
      if (text.match(/\\d{1,3}(,\\d{3})*원/) || text.match(/\\d+원/)) {
        const tagName = element.tagName;
        const className = $(element).attr('class') || '';
        const id = $(element).attr('id') || '';
        console.log(`  <${tagName}${id ? ' id="' + id + '"' : ''}${className ? ' class="' + className + '"' : ''}>${text.substring(0, 100)}</${tagName}>`);
      }
    });
    
    // Look for all price-related text
    console.log('\\n💸 "가격", "원", "Price" 관련 텍스트:');
    $('*').each((_, element) => {
      const text = $(element).text().trim();
      if (text.includes('가격') || text.includes('원') || text.toLowerCase().includes('price')) {
        const tagName = element.tagName;
        const className = $(element).attr('class') || '';
        const id = $(element).attr('id') || '';
        if (text.length < 200) {
          console.log(`  <${tagName}${id ? ' id="' + id + '"' : ''}${className ? ' class="' + className + '"' : ''}>${text}</${tagName}>`);
        }
      }
    });
    
    console.log('\\n✅ 분석 완료! yanggu-product-sample.html 파일을 확인하세요.');
    
  } catch (error) {
    console.error('❌ 분석 실패:', error);
  }
}

analyzePage();