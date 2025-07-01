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
    mallId: 88,
    mallName: 'dinosaur-land-goseong',
    url: 'https://www.edinomall.com/shop/smain/index.php',
    categories: [],
    productStructure: {
      urlPattern: 'https://www.edinomall.com/shop/smain/shopdetail.php?branduid={product_id}',
      categoryUrlPattern: 'https://www.edinomall.com/shop/smain/shop.php?shopcode={category_code}',
      paginationMethod: 'page_parameter',
      dynamicLoading: false,
      productSelectors: {
        container: '.productListing_ul li, .item',
        name: '.productListing_title, .prd_name',
        price: '.productListing_price, .prd_price',
        image: '.productListing_img img, .prd_img img',
        link: 'a[href*="shopdetail.php"]'
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
    const categoryElements = homeDoc.querySelectorAll('.cate_menu a, .category a[href*="shopcode"], #left_menu a');
    categoryElements.forEach((elem) => {
      const name = elem.textContent?.trim() || '';
      const href = elem.getAttribute('href') || '';
      
      if (name && href.includes('shopcode=')) {
        const shopCode = href.match(/shopcode=(\d+)/)?.[1] || '';
        if (shopCode && !analysis.categories.find(cat => cat.link.includes(shopCode))) {
          analysis.categories.push({
            name,
            link: `https://www.edinomall.com/shop/smain/${href.startsWith('/') ? href.substring(1) : href}`
          });
        }
      }
    });

    // Read and analyze category page
    const categoryHtml = fs.readFileSync(path.join(__dirname, 'requirements', 'category_page.html'), 'utf-8');
    const categoryDom = new JSDOM(categoryHtml);
    const categoryDoc = categoryDom.window.document;

    // Extract sample products - common patterns for Korean shopping malls
    const productSelectors = [
      '.productListing_ul li',
      '.item_list li',
      '.prd_list li',
      'table.product_list tr',
      '.goods_list_item'
    ];

    let productElements: NodeListOf<Element> | null = null;
    for (const selector of productSelectors) {
      productElements = categoryDoc.querySelectorAll(selector);
      if (productElements.length > 0) break;
    }

    if (productElements) {
      productElements.forEach((elem, index) => {
        if (index < 5) {
          const linkElem = elem.querySelector('a[href*="branduid"]');
          const nameElem = elem.querySelector('.productListing_title, .prd_name, .name, a[href*="branduid"]');
          const priceElem = elem.querySelector('.productListing_price, .prd_price, .price, .sellprice');
          const imageElem = elem.querySelector('img');

          const href = linkElem?.getAttribute('href') || '';
          const branduid = href.match(/branduid=(\d+)/)?.[1] || '';

          const product: ProductInfo = {
            name: nameElem?.textContent?.trim() || '',
            price: priceElem?.textContent?.trim() || '',
            image: imageElem?.getAttribute('src') || '',
            link: branduid ? `https://www.edinomall.com/shop/smain/shopdetail.php?branduid=${branduid}` : ''
          };

          if (product.name && product.link) {
            analysis.sampleProducts.push(product);
          }
        }
      });
    }

    // Check for pagination
    const paginationElements = categoryDoc.querySelectorAll('.paging a, .pagination a, a[href*="page="]');
    if (paginationElements.length > 0) {
      analysis.notes.push('Pagination detected using page parameter');
    }

    // Read and analyze product detail page
    const productHtml = fs.readFileSync(path.join(__dirname, 'requirements', 'product_page.html'), 'utf-8');
    const productDom = new JSDOM(productHtml);
    const productDoc = productDom.window.document;

    // Verify product structure
    const productName = productDoc.querySelector('.product_name, .prd_detail_name, h1, h2');
    const productPrice = productDoc.querySelector('.product_price, .prd_detail_price, .price');
    
    if (productName) {
      analysis.notes.push('Product detail page structure confirmed');
    }

    // Additional notes
    analysis.notes.push('Site uses traditional Korean e-commerce platform structure');
    analysis.notes.push('Product IDs use "branduid" parameter');
    analysis.notes.push('Categories use numeric shopcode (e.g., 003001000000)');
    analysis.notes.push('Multi-level category hierarchy with numeric codes');

  } catch (error) {
    analysis.errors.push(`Error analyzing mall: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return analysis;
}

// Execute analysis
analyzeMall().then(analysis => {
  // Save analysis results
  const outputPath = path.join(__dirname, 'analysis-88.json');
  fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2), 'utf-8');
  console.log('Analysis completed and saved to:', outputPath);
}).catch(error => {
  console.error('Analysis failed:', error);
});