import { execSync } from 'child_process';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const outputDir = join(__dirname, '../../output/mgmall');
mkdirSync(outputDir, { recursive: true });

async function analyzeMgmall() {
  console.log('문경 새제의아침 쇼핑몰 구조 분석 시작...');
  
  const analysis = {
    name: '문경 새제의아침',
    url: 'https://mgmall.cyso.co.kr/',
    region: '경북',
    platform: 'unknown',
    categories: {
      structure: '',
      mainCategories: [] as any[],
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

  try {
    // 메인 페이지 가져오기
    const mainPageHtml = execSync('curl -s -k "https://mgmall.cyso.co.kr/"').toString();
    writeFileSync(join(outputDir, 'mgmall-homepage.html'), mainPageHtml);
    
    // 플랫폼 감지 - URL에 cyso가 포함되어 있으므로 영카트5일 가능성이 높음
    if (mainPageHtml.includes('youngcart') || mainPageHtml.includes('g5_')) {
      analysis.platform = 'youngcart5';
    } else if (mainPageHtml.includes('shop/list.php')) {
      analysis.platform = 'youngcart5';
    }

    // 카테고리 링크 찾기
    const categoryMatches = mainPageHtml.match(/href="([^"]*\/shop\/list\.php\?ca_id=[^"]*)"/gi);
    
    if (categoryMatches) {
      // 영카트5 패턴 확인됨
      analysis.platform = 'youngcart5';
      analysis.categories.urlPattern = '/shop/list.php?ca_id={categoryId}';
      
      const categoryUrls = [...new Set(categoryMatches.map(m => m.replace(/href="|"/g, '')))];
      
      // 카테고리 ID 추출
      const categories = categoryUrls.map(url => {
        const match = url.match(/ca_id=([^&]+)/);
        return {
          url,
          id: match ? match[1] : ''
        };
      }).filter(cat => cat.id);
      
      analysis.categories.mainCategories = categories.slice(0, 10);
      
      console.log('영카트5 플랫폼 감지됨');
      console.log('카테고리 샘플:', analysis.categories.mainCategories[0]);
      
      // 카테고리 페이지 샘플 분석
      if (analysis.categories.mainCategories.length > 0) {
        const sampleUrl = analysis.categories.mainCategories[0].url;
        const fullUrl = sampleUrl.startsWith('http') ? sampleUrl : `https://mgmall.cyso.co.kr${sampleUrl}`;
        
        try {
          const categoryPageHtml = execSync(`curl -s -k "${fullUrl}"`).toString();
          writeFileSync(join(outputDir, 'mgmall-category-sample.html'), categoryPageHtml);
          
          // 제품 구조 분석
          if (categoryPageHtml.includes('sct_li')) {
            analysis.products.htmlStructure = 'youngcart5-standard';
            analysis.products.selectors = {
              wrapper: '.sct',
              item: '.sct_li',
              image: '.sct_img img',
              title: '.sct_txt a',
              price: '.sct_cost',
              link: '.sct_txt a'
            };
          }
          
          // 페이지네이션 분석
          if (categoryPageHtml.includes('pg_wrap')) {
            analysis.pagination.type = 'standard';
            analysis.pagination.pattern = '&page={pageNumber}';
          }
          
        } catch (error) {
          console.error('카테고리 페이지 분석 중 오류:', error);
        }
      }
    }

    // 결과 저장
    writeFileSync(
      join(outputDir, 'mgmall-structure-analysis.json'),
      JSON.stringify(analysis, null, 2)
    );

    console.log('문경 새제의아침 분석 완료!');
    console.log('플랫폼:', analysis.platform);
    console.log('카테고리 수:', analysis.categories.mainCategories.length);
    
  } catch (error) {
    console.error('분석 중 오류 발생:', error);
  }
}

analyzeMgmall();