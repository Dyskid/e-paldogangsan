import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import path from 'path';

const TEST_CATEGORY_URL = 'https://yanggu-mall.com/goods/catalog?code=0001';
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

async function analyzeCategory() {
  try {
    await ensureOutputDir();
    
    const html = await fetchPage(TEST_CATEGORY_URL);
    const $ = cheerio.load(html);
    
    // Save HTML for analysis
    await fs.writeFile(path.join(OUTPUT_DIR, 'yanggu-category-sample.html'), html);
    
    console.log('\\n=== 카테고리 페이지 분석 ===');
    
    // Look for product links
    console.log('\\n🔍 상품 링크 찾기:');
    const linkSelectors = [
      'a[href*="/goods/view"]',
      'a[href*="view?no="]',
      '.product a',
      '.goods a',
      '.item a',
      '.display_goods a',
      '.goods_list a'
    ];
    
    linkSelectors.forEach(selector => {
      $(selector).each((index, element) => {
        const href = $(element).attr('href');
        const text = $(element).text().trim();
        if (href && index < 5) { // Show first 5 matches
          console.log(`  ${selector}: "${href}" - "${text.substring(0, 50)}"`);
        }
      });
    });
    
    // Look for all links containing "goods" or numbers
    console.log('\\n🔗 모든 goods 관련 링크:');
    $('a').each((index, element) => {
      const href = $(element).attr('href');
      if (href && (href.includes('goods') || href.includes('view')) && index < 10) {
        const text = $(element).text().trim();
        console.log(`  "${href}" - "${text.substring(0, 50)}"`);
      }
    });
    
    // Look for JavaScript or AJAX content loading
    console.log('\\n⚡ JavaScript/AJAX 관련:');
    $('script').each((index, element) => {
      const scriptContent = $(element).html() || '';
      if (scriptContent.includes('goods') || scriptContent.includes('product') || scriptContent.includes('ajax')) {
        console.log(`  Script ${index + 1}: ${scriptContent.substring(0, 200)}...`);
      }
    });
    
    // Check for product display elements
    console.log('\\n🛍️ 상품 표시 요소:');
    const productSelectors = [
      '.display_goods',
      '.goods_list',
      '.product_list',
      '.item_list',
      '[class*="display"]',
      '[class*="goods"]',
      '[class*="product"]'
    ];
    
    productSelectors.forEach(selector => {
      const elements = $(selector);
      if (elements.length > 0) {
        console.log(`  ${selector}: ${elements.length}개 발견`);
        elements.each((index, element) => {
          if (index < 3) {
            const text = $(element).text().trim();
            console.log(`    ${index + 1}: "${text.substring(0, 100)}"`);
          }
        });
      }
    });
    
    console.log('\\n✅ 분석 완료! yanggu-category-sample.html 파일을 확인하세요.');
    
  } catch (error) {
    console.error('❌ 분석 실패:', error);
  }
}

analyzeCategory();