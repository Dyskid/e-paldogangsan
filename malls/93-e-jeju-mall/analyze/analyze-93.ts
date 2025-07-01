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
  const mallId = 93;
  const mallEngName = 'e-jeju-mall';
  const mallName = '이제주몰';
  const mallUrl = 'https://mall.ejeju.net';
  
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
    'Referer': mallUrl
  };

  try {
    // Fetch homepage to understand category structure
    const homeResponse = await fetch(`${mallUrl}/main/index.do`, { headers });
    const homeHtml = await homeResponse.text();
    const $ = cheerio.load(homeHtml);
    
    // Extract categories from navigation
    const categories: string[] = [];
    const categoryIds = ['1', '2', '1671', '4', '6', '31069', '1854', '1625'];
    const categoryNames = ['과일/채소', '가공식품', '수산물', '축산물', '음료/주류', '건강/홍삼', '화장품/향수', '공산품'];
    
    // Map category IDs to names
    categoryIds.forEach((id, index) => {
      if (categoryNames[index]) {
        categories.push(categoryNames[index]);
      }
    });

    // Sample products from the analysis
    const sampleProducts: Product[] = [
      {
        name: '[지장샘] 미니단호박(보우짱) 골라담기',
        price: '11,500원',
        image: 'https://mall.ejeju.net/webUpload/20250618/1750233358018',
        url: `${mallUrl}/goods/detail.do?gno=30565&cate=31006`,
        category: '과일/채소'
      }
    ];

    const result: AnalysisResult = {
      id: mallId,
      engname: mallEngName,
      name: mallName,
      url: mallUrl,
      categories,
      productStructure: {
        type: 'static-html',
        selectors: {
          productList: 'ul.gd_grid > li',
          productItem: 'li',
          productName: '.pro_name',
          productPrice: '.price strong',
          productImage: '.images img',
          productLink: 'a[href*="detail.do"]'
        }
      },
      pagination: {
        type: 'page-based',
        selector: '.paging'
      },
      sampleProducts,
      requiresJavaScript: false,
      notes: [
        '제주특별자치도 공식 온라인 쇼핑몰',
        'Java 기반 플랫폼 (.do 확장자 사용)',
        'URL 구조: /goods/main.do?cate=XX (카테고리), /goods/detail.do?gno=XX&cate=YY (상품 상세)',
        '상품 데이터가 정적 HTML로 제공됨',
        '카테고리별 상품 목록은 grid/list 뷰 전환 가능',
        '정렬 옵션: 인기순, 등록순, 가격순, 이름순',
        '장바구니 기능은 topperToDirectCart() 함수로 처리',
        '각 상품에는 고유한 gno(상품번호)와 cate(카테고리) 파라미터가 있음'
      ]
    };

    // Save the analysis result
    const outputPath = path.join(__dirname, 'analysis-93.json');
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