import * as fs from 'fs';
import * as path from 'path';
import { JSDOM } from 'jsdom';

interface ProductInfo {
  name: string;
  price: string;
  image: string;
  link: string;
  category?: string;
}

interface CategoryInfo {
  name: string;
  link: string;
  productCount?: number;
  subcategories?: CategoryInfo[];
}

interface MallAnalysis {
  mallId: number;
  mallName: string;
  url: string;
  categories: CategoryInfo[];
  productStructure: {
    urlPattern: string;
    categoryUrlPattern: string;
    paginationMethod: string;
    dynamicLoading: boolean;
    productSelectors: {
      container: string;
      name: string;
      price: string;
      image: string;
      link: string;
    };
  };
  sampleProducts: ProductInfo[];
  notes: string[];
  errors: string[];
}

async function analyzeMall(): Promise<MallAnalysis> {
  const analysis: MallAnalysis = {
    mallId: 86,
    mallName: 'namhae-mall',
    url: 'https://enamhae.co.kr/',
    categories: [],
    productStructure: {
      urlPattern: 'https://enamhae.co.kr/shop/item.php?it_id={product_id}',
      categoryUrlPattern: 'https://enamhae.co.kr/shop/list.php?ca_id={category_id}',
      paginationMethod: 'page_parameter',
      dynamicLoading: false,
      productSelectors: {
        container: '.sct_li',
        name: '.sct_txt a',
        price: '.sct_cost',
        image: '.sct_img img',
        link: '.sct_txt a'
      }
    },
    sampleProducts: [],
    notes: [],
    errors: []
  };

  try {
    // Read and analyze homepage
    const homepageHtml = fs.readFileSync(path.join(__dirname, 'requirements', 'homepage.html'), 'utf-8');
    const homeDom = new JSDOM(homepageHtml);
    const homeDoc = homeDom.window.document;

    // Extract categories from navigation menu
    const categoryElements = homeDoc.querySelectorAll('#gnb_1dul > li > a');
    categoryElements.forEach((elem) => {
      const name = elem.textContent?.trim() || '';
      const href = elem.getAttribute('href') || '';
      
      if (name && href.includes('ca_id=')) {
        const categoryId = href.match(/ca_id=(\w+)/)?.[1] || '';
        analysis.categories.push({
          name,
          link: `https://enamhae.co.kr${href.startsWith('/') ? href : '/' + href}`,
          productCount: 0
        });
      }
    });

    // Also check for categories in the sidebar or other menu areas
    const sideCategories = homeDoc.querySelectorAll('.cate_list a, .category_menu a');
    sideCategories.forEach((elem) => {
      const name = elem.textContent?.trim() || '';
      const href = elem.getAttribute('href') || '';
      
      if (name && href.includes('ca_id=') && !analysis.categories.find(cat => cat.name === name)) {
        analysis.categories.push({
          name,
          link: `https://enamhae.co.kr${href.startsWith('/') ? href : '/' + href}`
        });
      }
    });

    // Read and analyze category page
    const categoryHtml = fs.readFileSync(path.join(__dirname, 'requirements', 'category_page.html'), 'utf-8');
    const categoryDom = new JSDOM(categoryHtml);
    const categoryDoc = categoryDom.window.document;

    // Extract sample products from category page
    const productElements = categoryDoc.querySelectorAll('.sct_li');
    productElements.forEach((elem, index) => {
      if (index < 5) { // Get first 5 products as samples
        const nameElem = elem.querySelector('.sct_txt a');
        const priceElem = elem.querySelector('.sct_cost');
        const imageElem = elem.querySelector('.sct_img img');
        const linkElem = elem.querySelector('.sct_img a, .sct_txt a');

        const product: ProductInfo = {
          name: nameElem?.textContent?.trim() || '',
          price: priceElem?.textContent?.trim() || '',
          image: imageElem?.getAttribute('src') || '',
          link: linkElem?.getAttribute('href') || ''
        };

        if (product.name) {
          analysis.sampleProducts.push(product);
        }
      }
    });

    // Check for pagination
    const paginationElements = categoryDoc.querySelectorAll('.pg_wrap .pg a, .pagination a');
    if (paginationElements.length > 0) {
      analysis.notes.push('Pagination detected using page parameter in URL');
      analysis.productStructure.paginationMethod = 'page_parameter';
    }

    // Read and analyze product detail page
    const productHtml = fs.readFileSync(path.join(__dirname, 'requirements', 'product_page.html'), 'utf-8');
    const productDom = new JSDOM(productHtml);
    const productDoc = productDom.window.document;

    // Verify product structure
    const productName = productDoc.querySelector('.sit_title, .item_name, h2');
    const productPrice = productDoc.querySelector('.sit_price, .price, .item_price');
    
    if (productName) {
      analysis.notes.push('Product detail page structure confirmed');
    }

    // Check for any JavaScript-based loading
    const scripts = productDoc.querySelectorAll('script');
    let hasAjax = false;
    scripts.forEach(script => {
      const content = script.textContent || '';
      if (content.includes('ajax') || content.includes('$.get') || content.includes('fetch')) {
        hasAjax = true;
      }
    });

    if (hasAjax) {
      analysis.notes.push('Site may use AJAX for some features, but main content appears to be server-rendered');
    }

    // Additional notes
    analysis.notes.push('Site uses YeongCart (영카트) e-commerce platform');
    analysis.notes.push('Product IDs are numeric timestamps');
    analysis.notes.push('Categories use alphanumeric IDs (e.g., ca_id=10, ca_id=20)');

  } catch (error) {
    analysis.errors.push(`Error analyzing mall: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return analysis;
}

// Execute analysis
analyzeMall().then(analysis => {
  // Save analysis results
  const outputPath = path.join(__dirname, 'analysis-86.json');
  fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2), 'utf-8');
  console.log('Analysis completed and saved to:', outputPath);
}).catch(error => {
  console.error('Analysis failed:', error);
});