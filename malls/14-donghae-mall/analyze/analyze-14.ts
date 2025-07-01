/**
 * Donghae Mall (동해몰) Analysis Script
 * Mall ID: 14
 * URL: https://donghae-mall.com/
 * 
 * This script analyzes the structure and data patterns of Donghae Mall
 */

import * as fs from 'fs';
import * as path from 'path';

interface ProductData {
  id: string;
  name: string;
  price: string;
  originalPrice?: string;
  imageUrl: string;
  productUrl: string;
  rating?: string;
  reviewScore?: string;
}

interface CategoryData {
  name: string;
  url: string;
  code: string;
  subcategories?: CategoryData[];
}

interface MallAnalysis {
  mallId: number;
  mallName: string;
  mallUrl: string;
  analysisDate: string;
  status: 'accessible' | 'inaccessible' | 'error';
  structure: {
    productSelector: string;
    productIdPattern: string;
    productNameSelector: string;
    priceSelector: string;
    originalPriceSelector: string;
    imageSelector: string;
    productLinkPattern: string;
    ratingSelector: string;
    pagination: {
      type: string;
      pageParam: string;
      maxPageIdentifier?: string;
    };
    categories: CategoryData[];
    searchUrl: string;
    searchParam: string;
  };
  sampleProducts: ProductData[];
  notes: string[];
}

// Analyze the mall structure
function analyzeMall(): MallAnalysis {
  const analysis: MallAnalysis = {
    mallId: 14,
    mallName: '동해몰',
    mallUrl: 'https://donghae-mall.com/',
    analysisDate: new Date().toISOString(),
    status: 'accessible',
    structure: {
      productSelector: '.goods_list .gl_item',
      productIdPattern: 'display_goods_view\\(\'(\\d+)\'',
      productNameSelector: '.displaY_goods_name a',
      priceSelector: '.displaY_sales_price .nuM',
      originalPriceSelector: '.displaY_consumer_price .nuM',
      imageSelector: '.goodsDisplayImage',
      productLinkPattern: '/goods/view?no={productId}',
      ratingSelector: '.displaY_review_score_b .nuM',
      pagination: {
        type: 'page_number',
        pageParam: 'page',
        maxPageIdentifier: '.paging_navigation .last'
      },
      categories: [
        {
          name: '수산물',
          url: '/goods/catalog?code=0017',
          code: '0017'
        },
        {
          name: '축산물',
          url: '/goods/catalog?code=0019',
          code: '0019'
        },
        {
          name: '농산물',
          url: '/goods/catalog?code=0020',
          code: '0020'
        },
        {
          name: '과일/채소',
          url: '/goods/catalog?code=0003',
          code: '0003'
        },
        {
          name: '가공식품',
          url: '/goods/catalog?code=0006',
          code: '0006',
          subcategories: [
            {
              name: '소스/장류',
              url: '/goods/catalog?code=00060004',
              code: '00060004'
            },
            {
              name: '음료/차류',
              url: '/goods/catalog?code=00060003',
              code: '00060003'
            },
            {
              name: '기름',
              url: '/goods/catalog?code=00060002',
              code: '00060002'
            },
            {
              name: '기타',
              url: '/goods/catalog?code=00060006',
              code: '00060006'
            }
          ]
        }
      ],
      searchUrl: '/goods/search',
      searchParam: 'search_text'
    },
    sampleProducts: [
      {
        id: '43598',
        name: '[묵호]언바람묵호태 채 500g/1kg',
        price: '30,000',
        imageUrl: 'http://gwchild838.firstmall.kr/data/goods/1/2021/08/43598_tmp_0f44e61134915eaddd31ff86fe35f3b96965view.png',
        productUrl: '/goods/view?no=43598',
        rating: '4.9',
        reviewScore: '98.7'
      },
      {
        id: '106395',
        name: '동해항씨푸드 강원도 동해안 손질생선 임연수 이면수',
        price: '19,000',
        originalPrice: '23,000',
        imageUrl: 'https://gwchild1038.firstmall.kr/data/goods/1/2024/04/3_temp_17120356066086view.png',
        productUrl: '/goods/view?no=106395',
        rating: '5.0',
        reviewScore: '100'
      },
      {
        id: '108858',
        name: '[동해식품상사] 동해 당일바리 통오징어 1kg(무료배송 이벤트중)',
        price: '29,900',
        originalPrice: '35,000',
        imageUrl: 'https://gwchild440.firstmall.kr/data/goods/1/2025/06/_temp_17502998461755view.jpg',
        productUrl: '/goods/view?no=108858'
      }
    ],
    notes: [
      'Uses Firstmall e-commerce platform',
      'Product IDs are extracted from JavaScript function calls',
      'Images are hosted on multiple subdomains (gwchild838, gwchild1038, gwchild440)',
      'Prices are displayed in Korean Won (₩) format',
      'Supports category navigation with hierarchical structure',
      'Search functionality available with text-based queries',
      'Mobile-responsive design with swiper for category navigation',
      'Product listings use lazy loading for images',
      'Note: Initial curl request without User-Agent returned 404, but works with proper headers'
    ]
  };

  return analysis;
}

// Save analysis to JSON file
function saveAnalysis(analysis: MallAnalysis): void {
  const outputPath = path.join(__dirname, 'analysis-14.json');
  fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2), 'utf-8');
  console.log(`Analysis saved to: ${outputPath}`);
}

// Main execution
function main(): void {
  console.log('Starting Donghae Mall analysis...');
  
  try {
    const analysis = analyzeMall();
    saveAnalysis(analysis);
    console.log('Analysis completed successfully!');
    console.log('Status:', analysis.status);
    console.log('Mall Name:', analysis.mallName);
    console.log('Categories found:', analysis.structure.categories.length);
    console.log('Sample products collected:', analysis.sampleProducts.length);
  } catch (error) {
    console.error('Error during analysis:', error);
    process.exit(1);
  }
}

// Run the analysis
main();