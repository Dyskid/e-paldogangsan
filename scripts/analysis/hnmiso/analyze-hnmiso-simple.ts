import { execSync } from 'child_process';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const outputDir = join(__dirname, '../../output/hnmiso');
mkdirSync(outputDir, { recursive: true });

async function analyzeHnmiso() {
  console.log('해남미소 쇼핑몰 구조 분석 시작...');
  
  // 메인 페이지 가져오기
  try {
    const mainPageHtml = execSync('curl -s "https://www.hnmiso.com/kwa-home"').toString();
    writeFileSync(join(outputDir, 'hnmiso-homepage.html'), mainPageHtml);
    
    // HTML 분석
    const analysis = {
      name: '해남미소',
      url: 'https://www.hnmiso.com/kwa-home',
      region: '전남',
      platform: 'unknown',
      categories: {
        structure: '',
        mainCategories: [] as string[],
        urlPattern: ''
      },
      products: {
        htmlStructure: '',
        dataLocation: '',
        selectors: {}
      },
      pagination: {
        type: '',
        pattern: ''
      },
      dynamicLoading: {
        required: false,
        type: ''
      }
    };

    // 카테고리 링크 찾기
    const categoryMatches = mainPageHtml.match(/href="([^"]*(?:category|goods|product|shop)[^"]*)"/gi);
    if (categoryMatches) {
      analysis.categories.mainCategories = [...new Set(categoryMatches.map(m => m.replace(/href="|"/g, '')))];
      console.log('발견된 카테고리 링크:', analysis.categories.mainCategories.slice(0, 5));
    }

    // 플랫폼 감지
    if (mainPageHtml.includes('cafe24') || mainPageHtml.includes('EC_GLOBAL')) {
      analysis.platform = 'cafe24';
    } else if (mainPageHtml.includes('godomall')) {
      analysis.platform = 'godomall';
    } else if (mainPageHtml.includes('makeshop')) {
      analysis.platform = 'makeshop';
    }

    // 제품 페이지 샘플 가져오기
    if (analysis.categories.mainCategories.length > 0) {
      const sampleUrl = analysis.categories.mainCategories[0];
      const fullUrl = sampleUrl.startsWith('http') ? sampleUrl : `https://www.hnmiso.com${sampleUrl}`;
      
      try {
        const productListHtml = execSync(`curl -s "${fullUrl}"`).toString();
        writeFileSync(join(outputDir, 'hnmiso-product-list.html'), productListHtml);
        
        // 제품 구조 분석
        const productPatterns = [
          /class="[^"]*product[^"]*"[^>]*>/gi,
          /class="[^"]*item[^"]*"[^>]*>/gi,
          /class="[^"]*goods[^"]*"[^>]*>/gi
        ];
        
        for (const pattern of productPatterns) {
          const matches = productListHtml.match(pattern);
          if (matches && matches.length > 0) {
            analysis.products.htmlStructure = matches[0];
            break;
          }
        }

        // 페이지네이션 분석
        if (productListHtml.includes('pagination') || productListHtml.includes('paging')) {
          analysis.pagination.type = 'standard';
          const pagePattern = productListHtml.match(/[?&]page=(\d+)/);
          if (pagePattern) {
            analysis.pagination.pattern = 'page=NUMBER';
          }
        }

        // 동적 로딩 체크
        if (productListHtml.includes('infinite') || productListHtml.includes('load-more')) {
          analysis.dynamicLoading.required = true;
          analysis.dynamicLoading.type = 'infinite-scroll';
        }
        
      } catch (error) {
        console.error('제품 페이지 분석 중 오류:', error);
      }
    }

    // 결과 저장
    writeFileSync(
      join(outputDir, 'hnmiso-structure-analysis.json'),
      JSON.stringify(analysis, null, 2)
    );

    console.log('해남미소 분석 완료!');
    console.log('플랫폼:', analysis.platform);
    console.log('카테고리 수:', analysis.categories.mainCategories.length);
    console.log('제품 구조:', analysis.products.htmlStructure);
    
  } catch (error) {
    console.error('분석 중 오류 발생:', error);
  }
}

analyzeHnmiso();