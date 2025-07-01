import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import path from 'path';

const BASE_URL = 'https://yanggu-mall.com';
const OUTPUT_DIR = path.join(__dirname, 'output');

interface AnalysisResult {
  homepage: {
    title: string;
    hasProductListing: boolean;
    categoryLinks: string[];
    productLinks: string[];
  };
  categories: Array<{
    name: string;
    url: string;
    productCount: number;
  }>;
  productUrlPattern: string;
  findings: string[];
}

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
      timeout: 10000,
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    throw error;
  }
}

async function analyzeHomepage(): Promise<any> {
  const html = await fetchPage(BASE_URL);
  const $ = cheerio.load(html);
  
  // Save homepage for analysis
  await fs.writeFile(path.join(OUTPUT_DIR, 'yanggu-homepage.html'), html);
  
  const title = $('title').text().trim();
  console.log(`홈페이지 제목: ${title}`);
  
  // Look for category links
  const categoryLinks: string[] = [];
  const productLinks: string[] = [];
  
  // Common selectors for category links
  const categorySelectors = [
    'nav a', '.menu a', '.category a', '.gnb a',
    '.navigation a', '.main-menu a', '.category-menu a',
    'a[href*="category"]', 'a[href*="goods"]', 'a[href*="list"]',
    'a[href*="shop"]', 'a[href*="product"]'
  ];
  
  categorySelectors.forEach(selector => {
    $(selector).each((_, element) => {
      const href = $(element).attr('href');
      const text = $(element).text().trim();
      if (href && text && text.length > 0 && text.length < 50) {
        const fullUrl = href.startsWith('http') ? href : BASE_URL + (href.startsWith('/') ? href : '/' + href);
        if (!categoryLinks.includes(fullUrl) && 
            !href.includes('javascript') && 
            !href.includes('mailto') &&
            !href.includes('#')) {
          categoryLinks.push(fullUrl);
          console.log(`카테고리 링크 발견: ${text} -> ${fullUrl}`);
        }
      }
    });
  });
  
  // Look for direct product links
  const productSelectors = [
    'a[href*="/goods/"]', 'a[href*="/product/"]', 'a[href*="view"]',
    'a[href*="detail"]', 'a[href*="item"]'
  ];
  
  productSelectors.forEach(selector => {
    $(selector).each((_, element) => {
      const href = $(element).attr('href');
      if (href) {
        const fullUrl = href.startsWith('http') ? href : BASE_URL + (href.startsWith('/') ? href : '/' + href);
        if (!productLinks.includes(fullUrl)) {
          productLinks.push(fullUrl);
        }
      }
    });
  });
  
  return {
    title,
    hasProductListing: productLinks.length > 0,
    categoryLinks: categoryLinks.slice(0, 20), // Limit for analysis
    productLinks: productLinks.slice(0, 10), // Sample product links
  };
}

async function testCategoryPage(categoryUrl: string): Promise<any> {
  try {
    const html = await fetchPage(categoryUrl);
    const $ = cheerio.load(html);
    
    // Look for product items on category page
    const productSelectors = [
      '.product-item', '.goods-item', '.item', '.product',
      '.goods-list .goods', '.product-list .product',
      'a[href*="/goods/"]', 'a[href*="/product/"]', 'a[href*="view"]'
    ];
    
    let productCount = 0;
    const sampleProducts: string[] = [];
    
    productSelectors.forEach(selector => {
      $(selector).each((_, element) => {
        const $element = $(element);
        let productUrl = '';
        
        // If element is a link
        if (element.tagName === 'a') {
          productUrl = $element.attr('href') || '';
        } else {
          // Look for link inside element
          productUrl = $element.find('a').first().attr('href') || '';
        }
        
        if (productUrl) {
          const fullUrl = productUrl.startsWith('http') ? productUrl : BASE_URL + (productUrl.startsWith('/') ? productUrl : '/' + productUrl);
          if (!sampleProducts.includes(fullUrl)) {
            sampleProducts.push(fullUrl);
            productCount++;
          }
        }
      });
    });
    
    return {
      url: categoryUrl,
      productCount,
      sampleProducts: sampleProducts.slice(0, 5),
    };
  } catch (error) {
    console.error(`Error analyzing category ${categoryUrl}:`, error);
    return {
      url: categoryUrl,
      productCount: 0,
      sampleProducts: [],
      error: error.message,
    };
  }
}

async function analyzeProductUrlPattern(sampleUrls: string[]): Promise<string> {
  // Analyze patterns in product URLs
  const patterns = [
    '/goods/view/',
    '/product/view/',
    '/goods/detail/',
    '/product/detail/',
    '/item/',
    '/shop/goods/',
    '?no=',
    '?id=',
    '?goods=',
  ];
  
  for (const pattern of patterns) {
    const matchingUrls = sampleUrls.filter(url => url.includes(pattern));
    if (matchingUrls.length > 0) {
      console.log(`발견된 패턴: ${pattern} (${matchingUrls.length}개 URL 매칭)`);
      return pattern;
    }
  }
  
  return 'Unknown pattern';
}

async function main() {
  try {
    await ensureOutputDir();
    
    console.log('🔍 양구몰 구조 분석 시작...');
    
    const result: AnalysisResult = {
      homepage: await analyzeHomepage(),
      categories: [],
      productUrlPattern: '',
      findings: []
    };
    
    console.log('\\n📋 홈페이지 분석 완료');
    console.log(`제목: ${result.homepage.title}`);
    console.log(`카테고리 링크: ${result.homepage.categoryLinks.length}개`);
    console.log(`상품 링크: ${result.homepage.productLinks.length}개`);
    
    // Analyze a few category pages to understand structure
    console.log('\\n🔍 카테고리 페이지 분석 중...');
    for (let i = 0; i < Math.min(5, result.homepage.categoryLinks.length); i++) {
      const categoryUrl = result.homepage.categoryLinks[i];
      console.log(`\\n분석 중: ${categoryUrl}`);
      
      const categoryAnalysis = await testCategoryPage(categoryUrl);
      result.categories.push({
        name: categoryUrl.split('/').pop() || 'Unknown',
        url: categoryUrl,
        productCount: categoryAnalysis.productCount
      });
      
      console.log(`상품 발견: ${categoryAnalysis.productCount}개`);
      if (categoryAnalysis.sampleProducts.length > 0) {
        console.log('샘플 상품 URL:');
        categoryAnalysis.sampleProducts.forEach(url => console.log(`  - ${url}`));
        
        // Add to overall product links for pattern analysis
        result.homepage.productLinks.push(...categoryAnalysis.sampleProducts);
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Analyze product URL patterns
    const allProductUrls = [...new Set(result.homepage.productLinks)];
    result.productUrlPattern = await analyzeProductUrlPattern(allProductUrls);
    
    // Generate findings
    result.findings = [
      `홈페이지에서 ${result.homepage.categoryLinks.length}개 카테고리 링크 발견`,
      `총 ${allProductUrls.length}개 상품 URL 수집`,
      `상품 URL 패턴: ${result.productUrlPattern}`,
      `분석된 카테고리: ${result.categories.length}개`,
      `평균 카테고리당 상품: ${Math.round(result.categories.reduce((sum, cat) => sum + cat.productCount, 0) / result.categories.length || 0)}개`
    ];
    
    console.log('\\n📊 분석 결과:');
    result.findings.forEach(finding => console.log(`  - ${finding}`));
    
    // Save analysis result
    await fs.writeFile(
      path.join(OUTPUT_DIR, 'yanggu-analysis.json'),
      JSON.stringify(result, null, 2)
    );
    
    console.log('\\n✅ 분석 완료! 결과가 yanggu-analysis.json에 저장되었습니다.');
    
    return result;
    
  } catch (error) {
    console.error('❌ 분석 실패:', error);
    throw error;
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export default main;