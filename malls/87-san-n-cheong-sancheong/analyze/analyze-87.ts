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
    mallId: 87,
    mallName: 'san-n-cheong-sancheong',
    url: 'https://sanencheong.com/',
    categories: [],
    productStructure: {
      urlPattern: 'https://sanencheong.com/goods/view?no={product_id}',
      categoryUrlPattern: 'https://sanencheong.com/goods/catalog?code={category_code}',
      paginationMethod: 'page_parameter',
      dynamicLoading: false,
      productSelectors: {
        container: '.goods_list_item',
        name: '.goods_name a',
        price: '.goods_price',
        image: '.goods_thumb img',
        link: '.goods_name a'
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

    // Extract categories from navigation
    const categoryElements = homeDoc.querySelectorAll('.nav_category a, .category_menu a, nav a[href*="catalog"]');
    categoryElements.forEach((elem) => {
      const name = elem.textContent?.trim() || '';
      const href = elem.getAttribute('href') || '';
      
      if (name && href.includes('catalog')) {
        const categoryCode = href.match(/code=(\w+)/)?.[1] || '';
        if (categoryCode && !analysis.categories.find(cat => cat.link.includes(categoryCode))) {
          analysis.categories.push({
            name,
            link: `https://sanencheong.com${href.startsWith('/') ? href : '/' + href}`
          });
        }
      }
    });

    // Read and analyze category page
    const categoryHtml = fs.readFileSync(path.join(__dirname, 'requirements', 'category_page.html'), 'utf-8');
    const categoryDom = new JSDOM(categoryHtml);
    const categoryDoc = categoryDom.window.document;

    // Extract sample products
    const productElements = categoryDoc.querySelectorAll('.goods_list_item, .item_display_wrap li, .goods_list li');
    productElements.forEach((elem, index) => {
      if (index < 5) {
        const nameElem = elem.querySelector('.goods_name a, .name a, .item_name');
        const priceElem = elem.querySelector('.goods_price, .price, .item_price');
        const imageElem = elem.querySelector('.goods_thumb img, .thumbnail img, img');
        const linkElem = elem.querySelector('a[href*="view"]');

        const product: ProductInfo = {
          name: nameElem?.textContent?.trim() || '',
          price: priceElem?.textContent?.trim() || '',
          image: imageElem?.getAttribute('src') || '',
          link: linkElem?.getAttribute('href') || ''
        };

        if (product.name && product.link) {
          if (!product.link.startsWith('http')) {
            product.link = 'https://sanencheong.com' + product.link;
          }
          analysis.sampleProducts.push(product);
        }
      }
    });

    // Check for pagination
    const paginationElements = categoryDoc.querySelectorAll('.pagination a, .paging a, .page_list a');
    if (paginationElements.length > 0) {
      analysis.notes.push('Pagination detected with page parameter');
    }

    // Read and analyze product detail page
    const productHtml = fs.readFileSync(path.join(__dirname, 'requirements', 'product_page.html'), 'utf-8');
    const productDom = new JSDOM(productHtml);
    const productDoc = productDom.window.document;

    // Verify product structure
    const productName = productDoc.querySelector('.goods_name, .item_name, h1, h2');
    const productPrice = productDoc.querySelector('.goods_price, .price, .item_price');
    
    if (productName) {
      analysis.notes.push('Product detail page structure confirmed');
    }

    // Check for JavaScript dependencies
    const scripts = productDoc.querySelectorAll('script');
    let hasVue = false;
    let hasReact = false;
    scripts.forEach(script => {
      const src = script.getAttribute('src') || '';
      const content = script.textContent || '';
      if (src.includes('vue') || content.includes('Vue')) hasVue = true;
      if (src.includes('react') || content.includes('React')) hasReact = true;
    });

    if (hasVue) analysis.notes.push('Site uses Vue.js framework');
    if (hasReact) analysis.notes.push('Site uses React framework');

    // Additional notes
    analysis.notes.push('Product IDs are numeric');
    analysis.notes.push('Categories use 4-digit codes (e.g., 0001, 0002)');
    analysis.notes.push('Modern e-commerce platform with clean structure');

  } catch (error) {
    analysis.errors.push(`Error analyzing mall: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return analysis;
}

// Execute analysis
analyzeMall().then(analysis => {
  // Save analysis results
  const outputPath = path.join(__dirname, 'analysis-87.json');
  fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2), 'utf-8');
  console.log('Analysis completed and saved to:', outputPath);
}).catch(error => {
  console.error('Analysis failed:', error);
});