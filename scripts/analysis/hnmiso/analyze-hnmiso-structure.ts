import puppeteer from 'puppeteer';
import { writeFileSync } from 'fs';
import { join } from 'path';

interface MallAnalysis {
  name: string;
  url: string;
  region: string;
  categories: {
    structure: string;
    mainCategories: string[];
    urlPattern: string;
  };
  products: {
    htmlStructure: string;
    dataLocation: string;
    imageSelector: string;
    titleSelector: string;
    priceSelector: string;
    linkSelector: string;
  };
  pagination: {
    type: string;
    selector: string;
    urlPattern: string;
  };
  dynamicLoading: {
    required: boolean;
    type: string;
    triggerElement?: string;
  };
  sampleData: any[];
}

async function analyzeHnmiso() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('해남미소 쇼핑몰 구조 분석 시작...');
  
  const analysis: MallAnalysis = {
    name: '해남미소',
    url: 'https://www.hnmiso.com/kwa-home',
    region: '전남',
    categories: {
      structure: '',
      mainCategories: [],
      urlPattern: ''
    },
    products: {
      htmlStructure: '',
      dataLocation: '',
      imageSelector: '',
      titleSelector: '',
      priceSelector: '',
      linkSelector: ''
    },
    pagination: {
      type: '',
      selector: '',
      urlPattern: ''
    },
    dynamicLoading: {
      required: false,
      type: ''
    },
    sampleData: []
  };

  try {
    // 메인 페이지 방문
    await page.goto(analysis.url, { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 페이지 HTML 저장
    const mainPageHtml = await page.content();
    writeFileSync(
      join(__dirname, '../../output/hnmiso/hnmiso-homepage.html'),
      mainPageHtml
    );

    // 카테고리 구조 분석
    const categories = await page.evaluate(() => {
      const categoryElements = document.querySelectorAll('nav a, .category a, .menu a, [class*="category"] a, [class*="menu"] a');
      const cats: string[] = [];
      categoryElements.forEach(el => {
        const text = el.textContent?.trim();
        const href = el.getAttribute('href');
        if (text && href && href.includes('category') || href?.includes('goods')) {
          cats.push(`${text} (${href})`);
        }
      });
      return cats;
    });

    analysis.categories.mainCategories = categories;
    console.log('발견된 카테고리:', categories);

    // 제품 리스트 페이지 찾기
    const productListLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      return links
        .map(link => ({
          text: link.textContent?.trim() || '',
          href: link.href
        }))
        .filter(link => 
          link.href.includes('goods') || 
          link.href.includes('product') || 
          link.href.includes('item') ||
          link.href.includes('shop')
        );
    });

    if (productListLinks.length > 0) {
      console.log('제품 페이지 링크 발견:', productListLinks[0].href);
      
      // 제품 리스트 페이지로 이동
      await page.goto(productListLinks[0].href, { waitUntil: 'networkidle2' });
      await new Promise(resolve => setTimeout(resolve, 3000));

      // 제품 리스트 HTML 저장
      const productListHtml = await page.content();
      writeFileSync(
        join(__dirname, '../../output/hnmiso/hnmiso-product-list.html'),
        productListHtml
      );

      // 제품 구조 분석
      const productStructure = await page.evaluate(() => {
        // 가능한 제품 셀렉터들 시도
        const possibleSelectors = [
          '.product-item',
          '.goods-item',
          '.item',
          '[class*="product"]',
          '[class*="goods"]',
          '.list-item',
          'li[class*="item"]'
        ];

        for (const selector of possibleSelectors) {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            const firstItem = elements[0];
            
            // 이미지 찾기
            const img = firstItem.querySelector('img');
            const imgSelector = img ? (img.className || 'img') : '';
            
            // 제목 찾기
            const title = firstItem.querySelector('h2, h3, h4, .title, .name, [class*="title"], [class*="name"]');
            const titleSelector = title ? (title.className || title.tagName.toLowerCase()) : '';
            
            // 가격 찾기
            const price = firstItem.querySelector('.price, [class*="price"], .cost, [class*="cost"]');
            const priceSelector = price ? (price.className || '.price') : '';
            
            // 링크 찾기
            const link = firstItem.querySelector('a');
            const linkSelector = link ? 'a' : '';

            return {
              containerSelector: selector,
              imageSelector: imgSelector,
              titleSelector: titleSelector,
              priceSelector: priceSelector,
              linkSelector: linkSelector,
              itemCount: elements.length
            };
          }
        }
        return null;
      });

      if (productStructure) {
        analysis.products.htmlStructure = productStructure.containerSelector;
        analysis.products.imageSelector = productStructure.imageSelector;
        analysis.products.titleSelector = productStructure.titleSelector;
        analysis.products.priceSelector = productStructure.priceSelector;
        analysis.products.linkSelector = productStructure.linkSelector;
        
        console.log('제품 구조 발견:', productStructure);
      }

      // 페이지네이션 분석
      const paginationInfo = await page.evaluate(() => {
        const paginationSelectors = [
          '.pagination',
          '.paging',
          '.page-nav',
          '[class*="pagination"]',
          '[class*="paging"]',
          '.page-list'
        ];

        for (const selector of paginationSelectors) {
          const pagination = document.querySelector(selector);
          if (pagination) {
            const links = pagination.querySelectorAll('a');
            return {
              selector: selector,
              linkCount: links.length,
              hasNext: !!pagination.querySelector('.next, [class*="next"]'),
              hasPrev: !!pagination.querySelector('.prev, [class*="prev"]')
            };
          }
        }
        return null;
      });

      if (paginationInfo) {
        analysis.pagination.type = 'standard';
        analysis.pagination.selector = paginationInfo.selector;
        console.log('페이지네이션 발견:', paginationInfo);
      }

      // 동적 로딩 확인
      const hasInfiniteScroll = await page.evaluate(() => {
        return !!(window as any).IntersectionObserver && 
               !!document.querySelector('[class*="infinite"], [class*="load-more"]');
      });

      analysis.dynamicLoading.required = hasInfiniteScroll;
      analysis.dynamicLoading.type = hasInfiniteScroll ? 'infinite-scroll' : 'static';
    }

    // 분석 결과 저장
    writeFileSync(
      join(__dirname, '../../output/hnmiso/hnmiso-structure-analysis.json'),
      JSON.stringify(analysis, null, 2)
    );

    console.log('해남미소 분석 완료!');

  } catch (error) {
    console.error('분석 중 오류 발생:', error);
    analysis.dynamicLoading.required = true;
    analysis.dynamicLoading.type = 'unknown-error';
    
    writeFileSync(
      join(__dirname, '../../output/hnmiso/hnmiso-structure-analysis.json'),
      JSON.stringify(analysis, null, 2)
    );
  } finally {
    await browser.close();
  }
}

// 실행
analyzeHnmiso().catch(console.error);