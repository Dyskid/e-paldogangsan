import { execSync } from 'child_process';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const outputDir = join(__dirname, '../../output/andongjang');
mkdirSync(outputDir, { recursive: true });

async function analyzeAndongjang() {
  console.log('안동장터 쇼핑몰 구조 분석 시작...');
  
  const analysis = {
    name: '안동장터',
    url: 'https://andongjang.cyso.co.kr/',
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
    const mainPageHtml = execSync('curl -s -k "https://andongjang.cyso.co.kr/"').toString();
    writeFileSync(join(outputDir, 'andongjang-homepage.html'), mainPageHtml);
    
    // 플랫폼 감지
    if (mainPageHtml.includes('cafe24') || mainPageHtml.includes('EC_GLOBAL')) {
      analysis.platform = 'cafe24';
    } else if (mainPageHtml.includes('godomall')) {
      analysis.platform = 'godomall';
    } else if (mainPageHtml.includes('makeshop')) {
      analysis.platform = 'makeshop';
    } else if (mainPageHtml.includes('godo5')) {
      analysis.platform = 'godo5';
    }

    // 카테고리 링크 찾기
    const categoryMatches = mainPageHtml.match(/href="([^"]*(?:category|goods|product|shop|item)[^"]*)"/gi);
    const goodsListMatches = mainPageHtml.match(/href="([^"]*goods\/goods_list[^"]*)"/gi);
    
    if (goodsListMatches) {
      // 고도몰 패턴
      analysis.platform = 'godomall5';
      analysis.categories.urlPattern = '/goods/goods_list.php?cateCd={categoryCode}';
      
      const categoryUrls = goodsListMatches.map(m => m.replace(/href="|"/g, ''));
      analysis.categories.mainCategories = [...new Set(categoryUrls)].slice(0, 10);
      
      console.log('고도몰5 플랫폼 감지됨');
      console.log('카테고리 URL 샘플:', analysis.categories.mainCategories[0]);
      
      // 카테고리 페이지 샘플 가져오기
      if (analysis.categories.mainCategories.length > 0) {
        const sampleUrl = analysis.categories.mainCategories[0];
        const fullUrl = sampleUrl.startsWith('http') ? sampleUrl : `https://andongjang.cyso.co.kr${sampleUrl}`;
        
        try {
          const categoryPageHtml = execSync(`curl -s -k "${fullUrl}"`).toString();
          writeFileSync(join(outputDir, 'andongjang-category-sample.html'), categoryPageHtml);
          
          // 제품 구조 분석
          if (categoryPageHtml.includes('goods_list_')) {
            analysis.products.htmlStructure = '.goods_list_item';
            analysis.products.selectors = {
              container: '.goods_list_item',
              image: '.goods_prd_img img',
              title: '.goods_name',
              price: '.goods_price',
              link: '.goods_name a'
            };
          }
          
          // 페이지네이션 분석
          if (categoryPageHtml.includes('pagination')) {
            analysis.pagination.type = 'standard';
            analysis.pagination.pattern = 'page={pageNumber}';
          }
          
        } catch (error) {
          console.error('카테고리 페이지 분석 중 오류:', error);
        }
      }
    } else if (categoryMatches) {
      analysis.categories.mainCategories = [...new Set(categoryMatches.map(m => m.replace(/href="|"/g, '')))].slice(0, 10);
    }

    // 결과 저장
    writeFileSync(
      join(outputDir, 'andongjang-structure-analysis.json'),
      JSON.stringify(analysis, null, 2)
    );

    console.log('안동장터 분석 완료!');
    console.log('플랫폼:', analysis.platform);
    console.log('카테고리 수:', analysis.categories.mainCategories.length);
    
  } catch (error) {
    console.error('분석 중 오류 발생:', error);
  }
}

analyzeAndongjang();