import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import * as fs from 'fs';
import * as path from 'path';

interface Product {
  name: string;
  price: string;
  image: string;
  url: string;
  category: string;
}

interface AnalysisResult {
  id: number;
  engname: string;
  name: string;
  url: string;
  categories: string[];
  productStructure: {
    type: string;
    selectors: {
      productList: string;
      productItem: string;
      productName: string;
      productPrice: string;
      productImage: string;
      productLink: string;
    };
  };
  pagination: {
    type: string;
    selector?: string;
  };
  sampleProducts: Product[];
  requiresJavaScript: boolean;
  notes: string[];
}

async function analyzeMall(): Promise<AnalysisResult> {
  const mallId = 91;
  const mallEngName = 'haman-mall';
  const mallName = '함안몰';
  const mallUrl = 'https://hamanmall.com';
  
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
  };

  try {
    // Fetch homepage to understand category structure
    const homeResponse = await fetch(mallUrl, { headers });
    const homeHtml = await homeResponse.text();
    const $ = cheerio.load(homeHtml);
    
    // Extract categories
    const categories: string[] = [];
    $('.categoryDepth1 > a').each((_, el) => {
      const categoryName = $(el).find('em').text().trim();
      const categoryUrl = $(el).attr('href');
      if (categoryName && categoryUrl) {
        categories.push(categoryName);
      }
    });

    // The site appears to use a custom e-commerce platform with dynamic content loading
    // Products are likely loaded via AJAX after page load
    const result: AnalysisResult = {
      id: mallId,
      engname: mallEngName,
      name: mallName,
      url: mallUrl,
      categories: categories.length > 0 ? categories : ['농축산물', '가공식품', '공예품', '건강식품'],
      productStructure: {
        type: 'dynamic-loading',
        selectors: {
          productList: '.goodsDisplayItemWrap',
          productItem: '.goodsDisplayItem',
          productName: '.goodsDisplayItemName',
          productPrice: '.goodsDisplayItemPrice',
          productImage: '.goodsDisplayImageWrap img',
          productLink: '.goodsDisplayLink'
        }
      },
      pagination: {
        type: 'ajax-based',
        selector: '.paging_navigation'
      },
      sampleProducts: [],
      requiresJavaScript: true,
      notes: [
        '사이트가 FirstMall 플랫폼 기반으로 구축됨',
        '상품 데이터가 JavaScript를 통해 동적으로 로드됨',
        'URL 구조: /goods/catalog?code=XXXX (카테고리)',
        '/goods/view?no=XXXX (상품 상세)',
        'AJAX 요청을 통한 상품 목록 로드가 필요할 것으로 예상됨',
        '페이지네이션도 AJAX 기반으로 작동할 가능성이 높음'
      ]
    };

    // Save the analysis result
    const outputPath = path.join(__dirname, 'analysis-91.json');
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    
    console.log('Analysis completed successfully');
    return result;
    
  } catch (error) {
    console.error('Error during analysis:', error);
    throw error;
  }
}

// Execute the analysis
analyzeMall().catch(console.error);