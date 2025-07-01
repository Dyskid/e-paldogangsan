import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

interface MallAnalysis {
  id: number;
  name: string;
  url: string;
  categories: {
    name: string;
    url: string;
    subcategories?: { name: string; url: string }[];
  }[];
  productStructure: {
    listSelector: string;
    itemSelector: string;
    nameSelector: string;
    priceSelector: string;
    imageSelector: string;
    linkSelector: string;
  };
  pagination: {
    type: 'page' | 'scroll' | 'load-more' | 'none';
    selector?: string;
    urlPattern?: string;
  };
  requiresJavaScript: boolean;
  urlPatterns: {
    category: string;
    product: string;
    search?: string;
  };
}

async function analyzeMall(): Promise<MallAnalysis> {
  const mallId = 45;
  const mallName = '남도장터';
  const mallUrl = 'https://www.jnmall.kr/';
  
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1'
  };

  try {
    // Fetch homepage
    const response = await fetch(mallUrl, { headers });
    const html = await response.text();
    
    // Save HTML for analysis
    const requirementsDir = path.join(__dirname, 'requirements');
    fs.writeFileSync(path.join(requirementsDir, 'homepage.html'), html);
    
    const $ = cheerio.load(html);
    
    // Analyze categories
    const categories: MallAnalysis['categories'] = [];
    
    // Check for navigation menu
    $('.gnb-menu > li, .nav-menu > li, .category-list > li, #gnb > li, .menu-category > li').each((i, elem) => {
      const $elem = $(elem);
      const name = $elem.find('> a').text().trim();
      const url = $elem.find('> a').attr('href');
      
      if (name && url) {
        const category = {
          name,
          url: url.startsWith('http') ? url : `https://www.jnmall.kr${url}`,
          subcategories: [] as { name: string; url: string }[]
        };
        
        // Check for subcategories
        $elem.find('.sub-menu > li > a, .dropdown-menu > li > a, ul > li > a').each((j, subElem) => {
          const subName = $(subElem).text().trim();
          const subUrl = $(subElem).attr('href');
          if (subName && subUrl) {
            category.subcategories!.push({
              name: subName,
              url: subUrl.startsWith('http') ? subUrl : `https://www.jnmall.kr${subUrl}`
            });
          }
        });
        
        categories.push(category);
      }
    });
    
    // Analyze product structure
    let productStructure = {
      listSelector: '',
      itemSelector: '',
      nameSelector: '',
      priceSelector: '',
      imageSelector: '',
      linkSelector: ''
    };
    
    // Common product list selectors
    const listSelectors = [
      '.product-list', '.item-list', '.goods-list', '.prd-list',
      '.xans-product-normalpackage', '.xans-product-listmain',
      '.product-items', '.products', '.items', '.goods_list'
    ];
    
    for (const selector of listSelectors) {
      if ($(selector).length > 0) {
        productStructure.listSelector = selector;
        
        // Find item selector
        const itemSelectors = ['li', '.item', '.product', '.goods', '.prd-item', '.goods_item'];
        for (const itemSel of itemSelectors) {
          if ($(`${selector} ${itemSel}`).length > 0) {
            productStructure.itemSelector = itemSel;
            
            // Analyze product details
            const $item = $(`${selector} ${itemSel}`).first();
            
            // Name selectors
            const nameSelectors = ['.name', '.title', '.prd-name', '.item-name', '.product-name', 'h3', 'h4', '.description strong', '.goods_name'];
            for (const nameSel of nameSelectors) {
              if ($item.find(nameSel).text().trim()) {
                productStructure.nameSelector = nameSel;
                break;
              }
            }
            
            // Price selectors
            const priceSelectors = ['.price', '.cost', '.prd-price', '.item-price', '.product-price', '.xans-product-price', '.goods_price'];
            for (const priceSel of priceSelectors) {
              if ($item.find(priceSel).text().trim()) {
                productStructure.priceSelector = priceSel;
                break;
              }
            }
            
            // Image selector
            if ($item.find('img').length > 0) {
              productStructure.imageSelector = 'img';
            }
            
            // Link selector
            if ($item.find('a').length > 0) {
              productStructure.linkSelector = 'a';
            }
            
            break;
          }
        }
        break;
      }
    }
    
    // Check pagination
    let pagination: MallAnalysis['pagination'] = { type: 'none' };
    
    if ($('.pagination, .paging, .page-nav, .xans-product-normalpaging, .paginate').length > 0) {
      pagination = {
        type: 'page',
        selector: '.pagination, .paging, .page-nav, .xans-product-normalpaging, .paginate',
        urlPattern: '?page={page}'
      };
    }
    
    // Check if JavaScript is required
    const requiresJavaScript = html.includes('React') || 
                              html.includes('Vue') || 
                              html.includes('Angular') ||
                              html.includes('__NEXT_DATA__') ||
                              $('.product-list').length === 0;
    
    // Analyze URL patterns
    const urlPatterns = {
      category: '/goods/goods_list.php?cateCd={categoryId}',
      product: '/goods/goods_view.php?goodsNo={productId}',
      search: '/goods/goods_search.php?keyword={keyword}'
    };
    
    const analysis: MallAnalysis = {
      id: mallId,
      name: mallName,
      url: mallUrl,
      categories,
      productStructure,
      pagination,
      requiresJavaScript,
      urlPatterns
    };
    
    // Save analysis result
    fs.writeFileSync(
      path.join(__dirname, 'analysis-45.json'),
      JSON.stringify(analysis, null, 2)
    );
    
    return analysis;
    
  } catch (error) {
    console.error('Error analyzing mall:', error);
    throw error;
  }
}

// Run analysis
analyzeMall().then(() => {
  console.log('Analysis completed successfully');
}).catch((error) => {
  console.error('Analysis failed:', error);
  process.exit(1);
});