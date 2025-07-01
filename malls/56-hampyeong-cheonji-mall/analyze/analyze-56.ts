import * as fs from 'fs';
import * as path from 'path';

interface MallAnalysis {
  mallId: string;
  mallName: string;
  baseUrl: string;
  platform: string;
  categories: CategoryInfo[];
  productStructure: ProductStructure;
  paginationMethod: PaginationInfo;
  javascriptRequired: boolean;
  dataLocation: DataLocation;
  urlPatterns: UrlPatterns;
  additionalNotes: string[];
}

interface CategoryInfo {
  id: string;
  name: string;
  url: string;
  parentId?: string;
}

interface ProductStructure {
  containerSelector: string;
  productItemSelector: string;
  titleSelector: string;
  priceSelector: string;
  imageSelector: string;
  linkSelector: string;
}

interface PaginationInfo {
  type: 'numbered' | 'loadMore' | 'infinite' | 'none';
  selector?: string;
  urlPattern?: string;
}

interface DataLocation {
  inHtml: boolean;
  inScript: boolean;
  apiEndpoint?: string;
}

interface UrlPatterns {
  category: string;
  product: string;
  search?: string;
}

const analysis: MallAnalysis = {
  mallId: '56-hampyeong-cheonji-mall',
  mallName: '함평천지몰',
  baseUrl: 'https://www.hampyeongm.com',
  platform: 'Cafe24',
  categories: [
    {
      id: '81',
      name: '베스트',
      url: '/product/list.html?cate_no=81'
    },
    {
      id: '84',
      name: '농산물',
      url: '/product/list.html?cate_no=84'
    },
    {
      id: '75',
      name: '축수산물',
      url: '/product/list.html?cate_no=75'
    },
    {
      id: '27',
      name: '가공식품',
      url: '/product/list.html?cate_no=27'
    },
    {
      id: '78',
      name: '공예품',
      url: '/product/list.html?cate_no=78'
    }
  ],
  productStructure: {
    containerSelector: '.xans-product-listmain, .xans-product-normalpackage',
    productItemSelector: '.prdList li',
    titleSelector: '.name a span:last-child',
    priceSelector: '.xans-product-listitem li[rel="판매가"] span:last-child',
    imageSelector: '.thumbnail img',
    linkSelector: '.thumbnail a, .name a'
  },
  paginationMethod: {
    type: 'numbered',
    selector: '.xans-product-normalpaging',
    urlPattern: '&page={pageNumber}'
  },
  javascriptRequired: true,
  dataLocation: {
    inHtml: true,
    inScript: true,
    apiEndpoint: 'CAFE24API'
  },
  urlPatterns: {
    category: '/product/list.html?cate_no={categoryId}',
    product: '/product/detail.html?product_no={productId}',
    search: '/product/search.html?keyword={searchTerm}'
  },
  additionalNotes: [
    'Uses Cafe24 e-commerce platform',
    'Heavy JavaScript usage for dynamic content loading',
    'Product data is embedded in HTML but also loaded via CAFE24API',
    'Multiple product display sections: New Products, Category Best, MD Recommendations',
    'Uses Korean domain (xn--352bl9yz7b63kj6b.kr) which redirects to www.hampyeongm.com',
    'Products have both consumer price (소비자가) and selling price (판매가)',
    'Site focuses on regional agricultural products from Hampyeong area'
  ]
};

// Write analysis to JSON file
const outputPath = path.join(__dirname, 'analysis-56.json');
fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2));

console.log(`Analysis completed and saved to: ${outputPath}`);

// Export for potential use in other modules
export default analysis;