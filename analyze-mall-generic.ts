import * as fs from 'fs';
import * as path from 'path';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

interface CategoryInfo {
  name: string;
  url: string;
  id: string;
}

interface PaginationInfo {
  type: string; // 'page', 'scroll', 'none'
  pageParam?: string;
  totalPages?: number;
  itemsPerPage?: number;
}

interface ProductStructure {
  containerSelector: string;
  itemSelector: string;
  nameSelector: string;
  priceSelector: string;
  imageSelector: string;
  linkSelector: string;
}

interface MallAnalysis {
  mallId: number;
  mallName: string;
  url: string;
  categories: CategoryInfo[];
  urlPatterns: {
    categoryPattern: string;
    productPattern: string;
    paginationPattern?: string;
  };
  pagination: PaginationInfo;
  requiresJavaScript: boolean;
  productStructure: ProductStructure;
  additionalNotes?: string;
}

async function analyzeMall(mallId: number, mallName: string, mallEngName: string, mallUrl: string): Promise<void> {
  const baseDir = `malls/${mallId}-${mallEngName}/analyze`;
  const outputDir = path.join(baseDir, 'requirements');
  
  // Ensure directories exist
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  try {
    // Fetch the main page
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    };

    console.log(`Fetching main page: ${mallUrl}`);
    const response = await fetch(mallUrl, { headers });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    fs.writeFileSync(path.join(outputDir, 'main.html'), html);
    
    const $ = cheerio.load(html);
    
    // Analyze categories
    const categories: CategoryInfo[] = [];
    
    // Check common category selectors
    const categorySelectors = [
      '.category-list a',
      '.nav-category a',
      '.menu-category a',
      '#category a',
      '.gnb a',
      '.lnb a',
      'nav a',
      '.category a',
      '.menu a',
      '.nav-menu a',
      '.sub-menu a',
      '.depth1 a',
      '.cate_list a',
      '.catalog_list a'
    ];
    
    let categoryFound = false;
    for (const selector of categorySelectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        elements.each((i, el) => {
          const $el = $(el);
          const href = $el.attr('href');
          const text = $el.text().trim();
          
          if (href && text && !href.startsWith('#') && !href.includes('javascript:')) {
            try {
              const fullUrl = new URL(href, mallUrl).toString();
              const id = href.match(/cate[_=]?(\d+)/i)?.[1] || 
                        href.match(/category[_=]?(\d+)/i)?.[1] ||
                        href.match(/code[_=]?(\w+)/i)?.[1] || 
                        `cat${i}`;
              
              // Skip duplicates
              if (!categories.find(c => c.url === fullUrl)) {
                categories.push({
                  name: text,
                  url: fullUrl,
                  id: id
                });
              }
            } catch (urlError) {
              // Skip invalid URLs
            }
          }
        });
        
        if (categories.length > 0) {
          categoryFound = true;
          break;
        }
      }
    }
    
    // Analyze a category page if found
    let pagination: PaginationInfo = { type: 'none' };
    let productStructure: ProductStructure = {
      containerSelector: '',
      itemSelector: '',
      nameSelector: '',
      priceSelector: '',
      imageSelector: '',
      linkSelector: ''
    };
    
    if (categories.length > 0) {
      const sampleCategory = categories[0];
      console.log(`\nFetching category page: ${sampleCategory.url}`);
      
      try {
        const catResponse = await fetch(sampleCategory.url, { headers });
        const catHtml = await catResponse.text();
        fs.writeFileSync(path.join(outputDir, 'category-sample.html'), catHtml);
        
        const $cat = cheerio.load(catHtml);
        
        // Check for products
        const productSelectors = [
          '.product-item',
          '.item',
          '.goods',
          '.product',
          '.prd-item',
          'li.xans-record-',
          '.goods_list li',
          '.item_list li',
          '.product_list li'
        ];
        
        for (const selector of productSelectors) {
          const products = $cat(selector);
          if (products.length > 0) {
            productStructure.itemSelector = selector;
            const $firstProduct = $cat(products.first());
            
            // Find product details
            const nameSelectors = ['h3', 'h4', 'h5', '.name', '.title', '.prd-name', '.goods_name', '.item_name'];
            for (const nameSelector of nameSelectors) {
              if ($firstProduct.find(nameSelector).length > 0) {
                productStructure.nameSelector = nameSelector;
                break;
              }
            }
            
            const priceSelectors = ['.price', '.cost', 'span:contains("원")', '.prd-price', '.goods_price'];
            for (const priceSelector of priceSelectors) {
              if ($firstProduct.find(priceSelector).length > 0) {
                productStructure.priceSelector = priceSelector;
                break;
              }
            }
            
            if ($firstProduct.find('img').length > 0) {
              productStructure.imageSelector = 'img';
            }
            
            if ($firstProduct.find('a').length > 0) {
              productStructure.linkSelector = 'a';
            }
            
            productStructure.containerSelector = selector;
            break;
          }
        }
        
        // Check for pagination
        const paginationSelectors = [
          '.pagination',
          '.paging',
          '.page-list',
          '.xans-product-normalpaging',
          '.page_nation',
          '.paginate'
        ];
        
        for (const selector of paginationSelectors) {
          if ($cat(selector).length > 0) {
            pagination = {
              type: 'page',
              pageParam: 'page'
            };
            break;
          }
        }
      } catch (catError) {
        console.error(`Error fetching category: ${catError}`);
      }
    }
    
    // Check if JavaScript is required
    const requiresJavaScript = html.includes('__NEXT_DATA__') || 
                              html.includes('React') || 
                              html.includes('Vue') ||
                              html.includes('angular') ||
                              html.includes('firstmall') ||
                              $('noscript').text().includes('JavaScript');
    
    // Analyze URL patterns
    const urlPatterns = {
      categoryPattern: categories.length > 0 ? 
        (categories[0].url.includes('cate=') ? '/shop/list.php?cate={categoryId}' : 
         categories[0].url.includes('category=') ? '/?category={categoryId}' :
         categories[0].url.includes('code=') ? '/goods/catalog?code={categoryId}' : 
         '/category/{categoryId}') : '',
      productPattern: '/product/{productId}',
      paginationPattern: pagination.type === 'page' ? '?page={pageNumber}' : undefined
    };
    
    const analysis: MallAnalysis = {
      mallId: mallId,
      mallName: mallName,
      url: mallUrl,
      categories: categories.slice(0, 10), // Limit to first 10 categories
      urlPatterns,
      pagination,
      requiresJavaScript,
      productStructure,
      additionalNotes: categories.length === 0 ? 
        'Unable to find category structure. Manual inspection required.' : 
        undefined
    };
    
    // Save analysis
    fs.writeFileSync(
      path.join(baseDir, `analysis-${mallId}.json`),
      JSON.stringify(analysis, null, 2)
    );
    
    // Create report
    const report = `# ${mallName} (ID: ${mallId}) Analysis Report

## Status: ${categories.length > 0 ? 'Successful' : 'Partial Success'}

## Summary
- **URL**: ${mallUrl}
- **Categories Found**: ${categories.length}
- **Requires JavaScript**: ${requiresJavaScript ? 'Yes' : 'No'}
- **Pagination Type**: ${pagination.type}

## Details

### Categories
${categories.slice(0, 5).map(cat => `- ${cat.name}: ${cat.url}`).join('\n') || 'No categories found'}

### URL Patterns
- Category: ${urlPatterns.categoryPattern || 'Not determined'}
- Product: ${urlPatterns.productPattern}
${urlPatterns.paginationPattern ? `- Pagination: ${urlPatterns.paginationPattern}` : ''}

### Product Structure
- Container: ${productStructure.containerSelector || 'Not found'}
- Name Selector: ${productStructure.nameSelector || 'Not found'}
- Price Selector: ${productStructure.priceSelector || 'Not found'}

### Notes
${analysis.additionalNotes || 'Analysis completed successfully.'}
`;

    fs.writeFileSync(
      path.join(baseDir, `report-${mallId}.md`),
      report
    );
    
    console.log('Analysis completed successfully!');
    
  } catch (error) {
    console.error('Error during analysis:', error);
    
    // Create error report
    const errorReport = `# ${mallName} (ID: ${mallId}) Analysis Report

## Status: Failed

## Error
${error}

## Reason
Unable to complete the analysis due to the error above. This could be due to:
- Network connectivity issues
- Website blocking automated requests
- Website structure changes
- SSL/TLS certificate issues

## Recommendation
Manual inspection of the website is required.
`;

    fs.writeFileSync(
      path.join(baseDir, `report-${mallId}.md`),
      errorReport
    );
    
    // Create minimal analysis file
    const failedAnalysis: MallAnalysis = {
      mallId: mallId,
      mallName: mallName,
      url: mallUrl,
      categories: [],
      urlPatterns: {
        categoryPattern: '',
        productPattern: ''
      },
      pagination: { type: 'none' },
      requiresJavaScript: false,
      productStructure: {
        containerSelector: '',
        itemSelector: '',
        nameSelector: '',
        priceSelector: '',
        imageSelector: '',
        linkSelector: ''
      },
      additionalNotes: `Analysis failed: ${error}`
    };
    
    fs.writeFileSync(
      path.join(baseDir, `analysis-${mallId}.json`),
      JSON.stringify(failedAnalysis, null, 2)
    );
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length !== 4) {
  console.error('Usage: node analyze-mall-generic.js <mallId> <mallName> <mallEngName> <mallUrl>');
  process.exit(1);
}

const [mallId, mallName, mallEngName, mallUrl] = args;

// Run the analysis
analyzeMall(parseInt(mallId), mallName, mallEngName, mallUrl).catch(console.error);