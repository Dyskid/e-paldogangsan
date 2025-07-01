import * as fs from 'fs';
import * as path from 'path';
import { JSDOM } from 'jsdom';

interface Category {
  name: string;
  url: string;
  id: string;
}

interface Product {
  id: string;
  name: string;
  price: string;
  image: string;
  url: string;
  category?: string;
}

interface MallAnalysis {
  mallId: string;
  mallName: string;
  baseUrl: string;
  structure: {
    platform: string;
    requiresJavaScript: boolean;
    hasPagination: boolean;
    paginationType: string;
    productsPerPage: number;
    categories: Category[];
  };
  selectors: {
    categoryList: string;
    productList: string;
    productItem: string;
    productName: string;
    productPrice: string;
    productImage: string;
    productLink: string;
    pagination: string;
    nextPageButton: string;
  };
  urlPatterns: {
    category: string;
    product: string;
    pagination: string;
  };
  sampleProducts: Product[];
  analysisDate: string;
  notes: string[];
}

async function analyzeWandoCountyEShop(): Promise<void> {
  const requirementsDir = path.join(__dirname, 'requirements');
  
  // Read and parse HTML files
  const homepageHtml = fs.readFileSync(path.join(requirementsDir, 'homepage.html'), 'utf-8');
  const categoryHtml = fs.readFileSync(path.join(requirementsDir, 'category_abalone.html'), 'utf-8');
  const productDetailHtml = fs.readFileSync(path.join(requirementsDir, 'product_detail.html'), 'utf-8');
  
  const categoryDom = new JSDOM(categoryHtml);
  const categoryDoc = categoryDom.window.document;
  
  // Extract categories
  const categories: Category[] = [];
  
  // Main categories from analysis
  const mainCategories = [
    { name: '완도전복', url: '/category/완도전복/744/', id: '744' },
    { name: '해조류', url: '/category/해조류/745/', id: '745' },
    { name: '수산물', url: '/category/수산물/746/', id: '746' },
    { name: '농산물', url: '/category/농산물/747/', id: '747' },
    { name: '간편식품', url: '/category/간편식품/801/', id: '801' },
    { name: '소상공인 선물꾸러미', url: '/category/소상공인-선물꾸러미/806/', id: '806' }
  ];
  
  categories.push(...mainCategories);
  
  // Extract sample products from category page
  const products: Product[] = [];
  const productElements = categoryDoc.querySelectorAll('li[id^="anchorBoxId_"]');
  
  productElements.forEach((element, index) => {
    if (index < 5) { // Get first 5 products as samples
      const id = element.getAttribute('id')?.replace('anchorBoxId_', '') || '';
      
      // Get the actual product name (last span with font-size:16px)
      const nameSpans = element.querySelectorAll('.name a span[style*="font-size:16px"]');
      const nameElement = nameSpans[nameSpans.length - 1]; // Get the last one which contains actual name
      
      // Get the actual price (last span with font-size:18px)
      const priceSpans = element.querySelectorAll('.product_price span[style*="font-size:18px"]');
      const priceElement = priceSpans[priceSpans.length - 1]; // Get the last one which contains actual price
      
      const imageElement = element.querySelector('.prdImg img');
      const linkElement = element.querySelector('.name a');
      
      if (nameElement && priceElement && imageElement && linkElement) {
        products.push({
          id,
          name: nameElement.textContent?.trim() || '',
          price: priceElement.textContent?.trim() || '',
          image: imageElement.getAttribute('src') || '',
          url: linkElement.getAttribute('href') || '',
          category: '완도전복'
        });
      }
    }
  });
  
  // Count products per page
  const productsPerPage = productElements.length;
  
  // Check pagination
  const paginationElement = categoryDoc.querySelector('.xans-product-normalpaging');
  const hasPages = paginationElement ? paginationElement.querySelectorAll('a[href*="page="]').length > 0 : false;
  
  const analysis: MallAnalysis = {
    mallId: '55-wando-county-e-shop',
    mallName: '완도군 이숍',
    baseUrl: 'https://wandofood.go.kr',
    structure: {
      platform: 'Cafe24',
      requiresJavaScript: true,
      hasPagination: true,
      paginationType: 'page-number',
      productsPerPage: productsPerPage,
      categories: categories
    },
    selectors: {
      categoryList: '.menuCategory li a',
      productList: '.xans-product-normalpackage .xans-product-listnormal',
      productItem: 'li[id^="anchorBoxId_"]',
      productName: '.name a span[style*="font-size:16px"]',
      productPrice: '.product_price span[style*="font-size:18px"]',
      productImage: '.prdImg img',
      productLink: '.name a',
      pagination: '.xans-product-normalpaging',
      nextPageButton: '.xans-product-normalpaging a[href*="page="] img[alt="다음 페이지"]'
    },
    urlPatterns: {
      category: '/category/{categoryName}/{categoryId}/',
      product: '/product/{productName}/{productId}/category/{categoryId}/display/1/',
      pagination: '?page={pageNumber}'
    },
    sampleProducts: products,
    analysisDate: new Date().toISOString(),
    notes: [
      'Cafe24 e-commerce platform',
      'Heavy JavaScript usage for dynamic content',
      'Product IDs are numeric (e.g., 5630, 5629)',
      'Category IDs are numeric (e.g., 744 for 완도전복)',
      'Images use CDN with authentication tokens',
      'Pagination uses query parameter ?page=N',
      'Maximum 28 pages found in 완도전복 category',
      'Products have options that require additional selection',
      'Cart functionality uses JavaScript functions',
      'Site includes like/wish list features'
    ]
  };
  
  // Save analysis to JSON file
  const outputPath = path.join(__dirname, 'analysis-55.json');
  fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2));
  
  console.log(`Analysis completed and saved to ${outputPath}`);
}

// Run the analysis
analyzeWandoCountyEShop().catch(console.error);