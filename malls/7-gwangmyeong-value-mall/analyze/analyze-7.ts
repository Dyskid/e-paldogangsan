import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';

interface Category {
  name: string;
  code: string;
  subcategories?: Category[];
}

interface Product {
  id: string;
  name: string;
  company: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  imageUrl: string;
  rating?: number;
  reviewCount?: number;
  shippingInfo: string;
  url: string;
}

interface MallAnalysis {
  mallId: number;
  mallName: string;
  baseUrl: string;
  categories: Category[];
  totalProducts: number;
  scrapingStrategy: {
    requiresJavaScript: boolean;
    dataLocation: string;
    paginationMethod: string;
    productsPerPage: number;
  };
  urlPatterns: {
    category: string;
    product: string;
    pagination: string;
    search: string;
  };
  selectors: {
    productContainer: string;
    productName: string;
    companyName: string;
    price: string;
    originalPrice: string;
    discountPercent: string;
    imageUrl: string;
    rating: string;
    reviewCount: string;
    shippingInfo: string;
    totalCount: string;
  };
}

function fetchPage(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (res) => {
      let data = '';
      res.setEncoding('utf8');
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve(data);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

function parseProductFromHtml(html: string): Product[] {
  const products: Product[] = [];
  
  // Simple regex-based parsing for product items
  const productRegex = /<li class="goods_item">([\s\S]*?)<\/li>/g;
  let match;
  
  while ((match = productRegex.exec(html)) !== null) {
    const productHtml = match[1];
    
    // Extract product ID from URL
    const idMatch = productHtml.match(/product_id=(\d+)/);
    const id = idMatch ? idMatch[1] : '';
    
    // Extract product name
    const nameMatch = productHtml.match(/<span class="wr_subject">([^<]+)<\/span>/);
    const name = nameMatch ? nameMatch[1].trim() : '';
    
    // Extract company name
    const companyMatch = productHtml.match(/<span class="company_name">([^<]+)<\/span>/);
    const company = companyMatch ? companyMatch[1].trim() : '';
    
    // Extract price
    const priceMatch = productHtml.match(/<span class="default_price"><strong>([\d,]+)<\/strong>/);
    const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, '')) : 0;
    
    // Extract original price if exists
    const originalPriceMatch = productHtml.match(/<span class="default_consumer_price">([\d,]+)원<\/span>/);
    const originalPrice = originalPriceMatch ? parseInt(originalPriceMatch[1].replace(/,/g, '')) : undefined;
    
    // Extract discount percentage
    const discountMatch = productHtml.match(/<span class="sales_percent">(\d+)%<\/span>/);
    const discountPercent = discountMatch ? parseInt(discountMatch[1]) : undefined;
    
    // Extract image URL
    const imageMatch = productHtml.match(/<img src="([^"]+)"/);
    const imageUrl = imageMatch ? imageMatch[1] : '';
    
    // Extract rating
    const ratingMatch = productHtml.match(/<span class="product_review_count"><strong>([\d.]+)<\/strong>/);
    const rating = ratingMatch ? parseFloat(ratingMatch[1]) : undefined;
    
    // Extract review count
    const reviewMatch = productHtml.match(/<span class="product_grade_star">\([^:]*:?\s*(\d+)건\)/);
    const reviewCount = reviewMatch ? parseInt(reviewMatch[1]) : undefined;
    
    // Extract shipping info
    const shippingMatch = productHtml.match(/<span class="product_naver_delivery">[^:]*:?\s*([^<]+)<\/span>/);
    const shippingInfo = shippingMatch ? shippingMatch[1].trim() : '';
    
    if (id && name) {
      products.push({
        id,
        name,
        company,
        price,
        originalPrice,
        discountPercent,
        imageUrl,
        rating,
        reviewCount,
        shippingInfo,
        url: `/mall/goods/view.php?product_id=${id}`
      });
    }
  }
  
  return products;
}

async function analyzeMall(): Promise<void> {
  const baseUrl = 'http://gmsocial.mangotree.co.kr';
  const mallPath = '/mall/';
  
  const categories: Category[] = [
    {
      name: '생활/리빙',
      code: '0001',
      subcategories: [
        { name: '생활용품', code: '00010001' },
        { name: '교육ㆍ완구', code: '00010002' },
        { name: '주방ㆍ욕실용품', code: '00010003' },
        { name: '침구류', code: '00010004' },
        { name: '의료기기ㆍ의약외품', code: '00010005' },
        { name: '출산ㆍ육아', code: '00010006' },
        { name: '반려동물', code: '00010007' },
        { name: '자동차용품', code: '00010008' },
        { name: '문화', code: '00010009' }
      ]
    },
    {
      name: '패션/뷰티',
      code: '0002',
      subcategories: [
        { name: '패션의류', code: '00020001' },
        { name: '패션잡화', code: '00020002' },
        { name: '화장품ㆍ미용', code: '00020003' },
        { name: '마스크ㆍ팩', code: '00020004' },
        { name: '뷰티소품', code: '00020005' }
      ]
    },
    {
      name: '디지털/가전',
      code: '0003',
      subcategories: [
        { name: 'SW/e-컨텐츠', code: '00030001' },
        { name: '산업재료', code: '00030002' },
        { name: '생활가전', code: '00030003' },
        { name: '디지털기기', code: '00030004' },
        { name: '휴대폰용품', code: '00030005' }
      ]
    },
    {
      name: '가구/인테리어',
      code: '0004',
      subcategories: [
        { name: '가구', code: '00040001' },
        { name: '인테리어 소품', code: '00040002' },
        { name: '침구ㆍ홈데코', code: '00040003' },
        { name: '커튼ㆍ블라인드', code: '00040004' },
        { name: 'DIY자재ㆍ용품', code: '00040005' }
      ]
    },
    {
      name: '스포츠/레저',
      code: '0005',
      subcategories: [
        { name: '등산ㆍ캠핑ㆍ낚시', code: '00050001' },
        { name: '골프용품', code: '00050002' },
        { name: '스포츠의류', code: '00050003' },
        { name: '스포츠ㆍ레저용품', code: '00050004' }
      ]
    },
    {
      name: '식품',
      code: '0006',
      subcategories: [
        { name: '가공식품ㆍ과자ㆍ빙수', code: '00060001' },
        { name: '커피ㆍ음료', code: '00060002' },
        { name: '건강식품', code: '00060003' },
        { name: '농수산물', code: '00060004' },
        { name: '냉동ㆍ간편조리식품', code: '00060005' },
        { name: '반찬ㆍ김치', code: '00060006' }
      ]
    }
  ];
  
  // Sample product count by fetching one category
  let totalProducts = 0;
  try {
    const sampleUrl = `${baseUrl}${mallPath}goods/list.php?category_code=0001`;
    const sampleHtml = await fetchPage(sampleUrl);
    
    // Extract total count from HTML
    const totalMatch = sampleHtml.match(/<span class="item_total">(\d+)개<\/span>/);
    if (totalMatch) {
      totalProducts = parseInt(totalMatch[1]);
    }
    
    // Parse sample products to verify selectors
    const sampleProducts = parseProductFromHtml(sampleHtml);
    console.log(`Found ${sampleProducts.length} products in sample category`);
  } catch (error) {
    console.error('Error fetching sample page:', error);
  }
  
  const analysis: MallAnalysis = {
    mallId: 7,
    mallName: '광명가치몰',
    baseUrl: baseUrl + mallPath,
    categories: categories,
    totalProducts: totalProducts,
    scrapingStrategy: {
      requiresJavaScript: false,
      dataLocation: 'Server-rendered HTML',
      paginationMethod: 'URL parameter (page)',
      productsPerPage: 12
    },
    urlPatterns: {
      category: '/mall/goods/list.php?category_code={CATEGORY_CODE}',
      product: '/mall/goods/view.php?product_id={PRODUCT_ID}',
      pagination: '/mall/goods/list.php?category_code={CODE}&page={PAGE_NUMBER}',
      search: '/mall/goods/list.php?searchText={SEARCH_QUERY}'
    },
    selectors: {
      productContainer: '.goods_item',
      productName: '.wr_subject',
      companyName: '.company_name',
      price: '.default_price strong',
      originalPrice: '.default_consumer_price',
      discountPercent: '.sales_percent',
      imageUrl: '.goods_img img',
      rating: '.product_review_count strong',
      reviewCount: '.product_grade_star',
      shippingInfo: '.product_naver_delivery',
      totalCount: '.item_total'
    }
  };
  
  // Save analysis to JSON file
  const outputPath = path.join(__dirname, 'analysis-7.json');
  fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2), 'utf8');
  console.log(`Analysis saved to: ${outputPath}`);
}

// Run the analysis
analyzeMall().catch(console.error);