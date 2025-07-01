import * as fs from 'fs';
import * as path from 'path';
import * as cheerio from 'cheerio';

interface Category {
  id: string;
  name: string;
  url: string;
  subcategories?: Category[];
}

interface Product {
  id: string;
  name: string;
  url: string;
  imageUrl: string;
  originalPrice: string;
  discountedPrice: string;
  discountRate: string;
  manufacturer: string;
  description: string;
  rating: number;
  reviewCount: number;
}

interface AnalysisResult {
  mallName: string;
  mallUrl: string;
  structure: {
    categories: Category[];
    urlPatterns: {
      homepage: string;
      category: string;
      product: string;
      search: string;
      cart: string;
    };
    pagination: {
      supported: boolean;
      method: string;
      parameterName: string;
    };
    requiresJavaScript: boolean;
    productSelectors: {
      container: string;
      name: string;
      price: string;
      discountPrice: string;
      discountRate: string;
      image: string;
      manufacturer: string;
      description: string;
      rating: string;
      reviewCount: string;
    };
  };
  sampleProducts: Product[];
  analysisDate: string;
  status: string;
  notes: string[];
}

function analyzeGwangjuKimchiMall(): AnalysisResult {
  const baseUrl = 'https://www.k-kimchi.kr';
  
  // Read the category page HTML
  const categoryHtml = fs.readFileSync(
    path.join(__dirname, 'requirements', 'category_page.html'),
    'utf-8'
  );
  
  const $ = cheerio.load(categoryHtml);
  
  // Extract categories from the navigation
  const categories: Category[] = [
    { id: '001', name: '포기김치', url: '/index.php?cate=001' },
    { id: '003', name: '묵은지', url: '/index.php?cate=003' },
    { id: '004', name: '별미김치', url: '/index.php?cate=004',
      subcategories: [
        { id: '004001', name: '깍두기', url: '/index.php?cate=004001' },
        { id: '004003', name: '갓김치', url: '/index.php?cate=004003' },
        { id: '004005', name: '백김치', url: '/index.php?cate=004005' },
        { id: '004007', name: '부추김치', url: '/index.php?cate=004007' },
        { id: '004008', name: '석박지', url: '/index.php?cate=004008' },
        { id: '004010', name: '오이소박이', url: '/index.php?cate=004010' },
        { id: '004011', name: '열무김치', url: '/index.php?cate=004011' },
        { id: '004012', name: '총각김치', url: '/index.php?cate=004012' },
        { id: '004013', name: '파김치', url: '/index.php?cate=004013' }
      ]
    },
    { id: '005', name: '30%할인전', url: '/index.php?cate=005' },
    { id: '006', name: '명인 명품김치', url: '/index.php?cate=006' },
    { id: '002', name: '반찬가게', url: '/index.php?cate=002' },
    { id: '015', name: '선물세트', url: '/index.php?cate=015' }
  ];
  
  // Extract sample products from the HTML
  const sampleProducts: Product[] = [];
  
  $('.product_cell').each((index, element) => {
    if (index < 5) { // Get first 5 products as samples
      const $product = $(element);
      
      // Extract product URL and ID
      const productLink = $product.find('.productName a').attr('href') || '';
      const productMatch = productLink.match(/num=(\d+)/);
      const productId = productMatch ? productMatch[1] : '';
      
      // Extract prices
      const priceText = $product.find('.price').text();
      const originalPriceMatch = priceText.match(/(\d+,?\d*)원/);
      const discountedPriceMatch = priceText.match(/→\s*(\d+,?\d*)원/);
      const discountRateText = $product.find('.salePercentage').text();
      
      // Extract rating
      const filledStars = $product.find('.star .fa-star:not(.bg)').length;
      const halfStar = $product.find('.fa-star-half').length > 0 ? 0.5 : 0;
      const rating = filledStars + halfStar;
      
      // Extract review count
      const reviewText = $product.find('.star span').text();
      const reviewMatch = reviewText.match(/\((\d+)\)/);
      const reviewCount = reviewMatch ? parseInt(reviewMatch[1]) : 0;
      
      const product: Product = {
        id: productId,
        name: $product.find('.productName a').text().trim(),
        url: baseUrl + productLink,
        imageUrl: baseUrl + ($product.find('.viewImage img').attr('src') || ''),
        originalPrice: originalPriceMatch ? originalPriceMatch[1] : '',
        discountedPrice: discountedPriceMatch ? discountedPriceMatch[1] : '',
        discountRate: discountRateText.replace('%', ''),
        manufacturer: $product.find('.product_cell_tit a').text().trim(),
        description: $product.find('.productSubject').text().trim(),
        rating: rating,
        reviewCount: reviewCount
      };
      
      sampleProducts.push(product);
    }
  });
  
  const analysisResult: AnalysisResult = {
    mallName: '광주김치몰',
    mallUrl: baseUrl,
    structure: {
      categories: categories,
      urlPatterns: {
        homepage: '/index.php',
        category: '/index.php?cate={category_id}',
        product: '/?cate={category_id}&type=view&num={product_id}#module',
        search: '/index.php?cate=000003001&type=search&prodName={keyword}',
        cart: '/index.php?cate=000002004&type=cart#module'
      },
      pagination: {
        supported: true,
        method: 'query_parameter',
        parameterName: 'page'
      },
      requiresJavaScript: false,
      productSelectors: {
        container: '.product_cell',
        name: '.productName a',
        price: '.price strike',
        discountPrice: '.price span',
        discountRate: '.salePercentage',
        image: '.viewImage img',
        manufacturer: '.product_cell_tit a',
        description: '.productSubject',
        rating: '.star .fa-star',
        reviewCount: '.star span'
      }
    },
    sampleProducts: sampleProducts,
    analysisDate: new Date().toISOString(),
    status: 'success',
    notes: [
      '광주김치몰은 전통적인 서버 사이드 렌더링 방식을 사용합니다.',
      '제품 목록은 HTML에 직접 포함되어 있어 JavaScript 없이도 크롤링 가능합니다.',
      '할인율이 명확하게 표시되며, 제조사(브랜드) 정보도 각 제품에 포함됩니다.',
      '별점은 Font Awesome 아이콘을 사용하여 표시되며, 채워진 별의 개수로 평점을 계산할 수 있습니다.',
      'URL 구조가 일관되며, 카테고리 ID와 제품 번호를 통해 접근 가능합니다.',
      '검색 기능은 GET 파라미터를 통해 구현되어 있습니다.'
    ]
  };
  
  return analysisResult;
}

// Execute the analysis
const result = analyzeGwangjuKimchiMall();

// Save the result to JSON file
const outputPath = path.join(__dirname, 'analysis-gwangju-kimchi-mall.json');
fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');

console.log('Analysis completed successfully!');
console.log(`Results saved to: ${outputPath}`);