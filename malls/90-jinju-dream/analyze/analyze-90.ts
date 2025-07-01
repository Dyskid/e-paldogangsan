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
    mallId: 90,
    mallName: 'jinju-dream',
    url: 'https://jinjudream.com/',
    categories: [],
    productStructure: {
      urlPattern: 'https://jinjudream.com/product/detail.html?product_no={product_id}',
      categoryUrlPattern: 'https://jinjudream.com/product/list.html?cate_no={category_id}',
      paginationMethod: 'page_parameter',
      dynamicLoading: false,
      productSelectors: {
        container: '.prdList li, .xans-product-listnormal li',
        name: '.name a, .description .name',
        price: '.price, .xans-product-listitem',
        image: '.thumbnail img, .prdImg img',
        link: '.thumbnail a, .prdImg a'
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

    // Extract categories from navigation - Cafe24 pattern
    const categoryElements = homeDoc.querySelectorAll('.xans-layout-category a[href*="cate_no="], nav a[href*="cate_no="], .category a[href*="cate_no="]');
    categoryElements.forEach((elem) => {
      const name = elem.textContent?.trim() || '';
      const href = elem.getAttribute('href') || '';
      
      if (name && href.includes('cate_no=')) {
        const categoryId = href.match(/cate_no=(\d+)/)?.[1] || '';
        if (categoryId && !analysis.categories.find(cat => cat.link.includes(categoryId))) {
          analysis.categories.push({
            name,
            link: `https://jinjudream.com${href.startsWith('/') ? href : '/' + href}`
          });
        }
      }
    });

    // Read and analyze category page
    const categoryHtml = fs.readFileSync(path.join(__dirname, 'requirements', 'category_page.html'), 'utf-8');
    const categoryDom = new JSDOM(categoryHtml);
    const categoryDoc = categoryDom.window.document;

    // Extract sample products - Cafe24 structure
    const productElements = categoryDoc.querySelectorAll('.prdList li, .xans-product-listnormal li, .xans-product-normalpackage li');
    productElements.forEach((elem, index) => {
      if (index < 5) {
        const nameElem = elem.querySelector('.name a, .description .name, .prdName');
        const priceElem = elem.querySelector('.price, .xans-product-listitem, .prdPrice');
        const imageElem = elem.querySelector('.thumbnail img, .prdImg img, img');
        const linkElem = elem.querySelector('.thumbnail a, .prdImg a, a[href*="product_no="]');

        const href = linkElem?.getAttribute('href') || '';
        const productNo = href.match(/product_no=(\d+)/)?.[1] || '';

        const product: ProductInfo = {
          name: nameElem?.textContent?.trim() || '',
          price: priceElem?.textContent?.trim() || '',
          image: imageElem?.getAttribute('src') || '',
          link: productNo ? `https://jinjudream.com/product/detail.html?product_no=${productNo}` : ''
        };

        if (product.name && product.link) {
          if (!product.image.startsWith('http')) {
            product.image = 'https://jinjudream.com' + product.image;
          }
          analysis.sampleProducts.push(product);
        }
      }
    });

    // Check for pagination
    const paginationElements = categoryDoc.querySelectorAll('.xans-product-normalpaging a, .paging a, a[href*="page="]');
    if (paginationElements.length > 0) {
      analysis.notes.push('Pagination detected using page parameter');
    }

    // Read and analyze product detail page
    const productHtml = fs.readFileSync(path.join(__dirname, 'requirements', 'product_page.html'), 'utf-8');
    const productDom = new JSDOM(productHtml);
    const productDoc = productDom.window.document;

    // Verify product structure - Cafe24
    const productName = productDoc.querySelector('.xans-product-detail .heading h2, .infoArea h1, .product_name');
    const productPrice = productDoc.querySelector('.xans-product-detail .price, .infoArea .price, #span_product_price_text');
    
    if (productName) {
      analysis.notes.push('Product detail page structure confirmed');
    }

    // Check for Cafe24 indicators
    const cafe24Scripts = productDoc.querySelectorAll('script[src*="cafe24"], script[src*="EC_"]');
    if (cafe24Scripts.length > 0) {
      analysis.notes.push('Site uses Cafe24 e-commerce platform');
    }

    // Additional notes
    analysis.notes.push('Site appears to use Cafe24 e-commerce platform');
    analysis.notes.push('Product IDs use numeric product_no parameter');
    analysis.notes.push('Categories use numeric cate_no parameter');
    analysis.notes.push('Standard Cafe24 HTML structure with xans- prefixed classes');

  } catch (error) {
    analysis.errors.push(`Error analyzing mall: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return analysis;
}

// Execute analysis
analyzeMall().then(analysis => {
  // Save analysis results
  const outputPath = path.join(__dirname, 'analysis-90.json');
  fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2), 'utf-8');
  console.log('Analysis completed and saved to:', outputPath);
}).catch(error => {
  console.error('Analysis failed:', error);
});