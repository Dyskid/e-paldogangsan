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
  const mallId = 92;
  const mallEngName = 'gimhae-on-mall';
  const mallName = '김해온몰';
  const mallUrl = 'https://gimhaemall.kr';
  
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
    
    // Extract categories from navigation
    const categories: string[] = [];
    const categoryMap = new Map<string, string>();
    
    // Look for category links
    $('a[href*="kwa-ABS_goods_l-"]').each((_, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim();
      if (href && text && !text.includes('더보기')) {
        categories.push(text);
        categoryMap.set(text, href);
      }
    });

    // Fetch a category page to analyze product structure
    const categoryUrl = `${mallUrl}/kwa-ABS_goods_l-1003`; // Meat category
    const categoryResponse = await fetch(categoryUrl, { headers });
    const categoryHtml = await categoryResponse.text();
    const $category = cheerio.load(categoryHtml);

    // Extract sample products
    const sampleProducts: Product[] = [];
    
    $('.GoodsWrap-').each((index, el) => {
      if (index >= 5) return; // Get only first 5 products
      
      const $item = $category(el);
      const name = $item.find('.-fdGoodsName a').text().trim();
      const priceText = $item.find('.ABS-sell-price').first().text().trim();
      const price = priceText.replace(/[^0-9]/g, '');
      const imageUrl = $item.find('.-fdThumb img').attr('src');
      const productLink = $item.find('.-fdGoodsName a').attr('href');
      
      if (name && price && imageUrl && productLink) {
        sampleProducts.push({
          name,
          price: price + '원',
          image: imageUrl.startsWith('./') ? `${mallUrl}/${imageUrl.substring(2)}` : imageUrl,
          url: `${mallUrl}/${productLink}`,
          category: '축산물'
        });
      }
    });

    const result: AnalysisResult = {
      id: mallId,
      engname: mallEngName,
      name: mallName,
      url: mallUrl,
      categories: categories.length > 0 ? [...new Set(categories)] : ['축산물', '농산물', '수산물', '가공식품'],
      productStructure: {
        type: 'static-html',
        selectors: {
          productList: '.goodsListYjmall',
          productItem: '[class*="GoodsWrap-"]',
          productName: '.-fdGoodsName a',
          productPrice: '.ABS-sell-price',
          productImage: '.-fdThumb img',
          productLink: '.-fdGoodsName a'
        }
      },
      pagination: {
        type: 'page-based',
        selector: '.AB-pagination'
      },
      sampleProducts,
      requiresJavaScript: false,
      notes: [
        '사이트가 ABuilder 플랫폼 기반으로 구축됨',
        'URL 구조: kwa-ABS_goods_l-XXXX (카테고리), kwa-ABS_goods_v-XXXX-YYYY (상품 상세)',
        '상품 정보가 정적 HTML로 제공되어 크롤링이 용이함',
        '각 상품에는 고유한 GoodsWrap- 클래스가 부여됨',
        '가격 정보는 .ABS-sell-price 클래스에 포함됨',
        '할인 가격은 .ABS-org-price 클래스에 원가로 표시됨'
      ]
    };

    // Save the analysis result
    const outputPath = path.join(__dirname, 'analysis-92.json');
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