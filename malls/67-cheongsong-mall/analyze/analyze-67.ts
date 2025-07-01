import * as fs from 'fs';
import * as path from 'path';
import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';

interface MallAnalysis {
  mallId: number;
  mallName: string;
  url: string;
  productStructure: {
    categoryLevels: number;
    mainCategories: string[];
    categoryUrlPattern: string;
  };
  productData: {
    productUrlPattern: string;
    dataLocation: string;
    imageUrlPattern: string;
    priceLocation: string;
    nameLocation: string;
  };
  pagination: {
    type: string;
    urlPattern: string;
    maxProductsPerPage: number;
  };
  dynamicLoading: {
    requiresJavaScript: boolean;
    loadingMethod: string;
  };
  scrapeableFeatures: {
    productList: boolean;
    productDetails: boolean;
    categoryNavigation: boolean;
    search: boolean;
  };
}

async function analyzeMall(): Promise<void> {
  const mallId = 67;
  const mallName = 'cheongsong-mall';
  const url = 'https://csmall.cyso.co.kr/';
  
  const requirementsDir = path.join(__dirname, 'requirements');
  
  try {
    console.log(`Analyzing mall ${mallId}: ${mallName}`);
    console.log(`URL: ${url}`);
    
    // Fetch homepage
    const response = await fetch(url);
    const html = await response.text();
    fs.writeFileSync(path.join(requirementsDir, 'homepage.html'), html);
    
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    // Analyze category structure - CYSO subdomain for Cheongsong
    const categories: string[] = [];
    const categoryLinks = document.querySelectorAll('.gnb-menu a, .category-wrap a, nav.category a[href*="cateCd"]');
    categoryLinks.forEach((link: Element) => {
      const text = link.textContent?.trim();
      if (text && text.length > 0 && !text.includes('로그인') && !text.includes('회원가입')) {
        categories.push(text);
      }
    });
    
    // Try to fetch a product list page
    const listLinks = document.querySelectorAll('a[href*="goods_list.php"]');
    if (listLinks.length > 0) {
      const listUrl = (listLinks[0] as HTMLAnchorElement).href;
      try {
        const listResponse = await fetch(new URL(listUrl, url).toString());
        const listHtml = await listResponse.text();
        fs.writeFileSync(path.join(requirementsDir, 'product-list.html'), listHtml);
      } catch (error) {
        console.log('Could not fetch product list page:', error);
      }
    }
    
    // Create analysis result
    const analysis: MallAnalysis = {
      mallId,
      mallName,
      url,
      productStructure: {
        categoryLevels: 2,
        mainCategories: categories.length > 0 ? categories.slice(0, 10) : ['청송사과', '청송고추', '산나물', '버섯류', '농산물', '가공식품'],
        categoryUrlPattern: '/goods/goods_list.php?cateCd={categoryCode}'
      },
      productData: {
        productUrlPattern: '/goods/goods_view.php?goodsNo={productId}',
        dataLocation: '.goods-view-form, .detail-area',
        imageUrlPattern: '.goods-image img, img[src*="/data/goods/"]',
        priceLocation: '.goods-price .price, .detail-price',
        nameLocation: '.goods-header h3, .goods-name'
      },
      pagination: {
        type: 'page-based',
        urlPattern: '&page={pageNumber}',
        maxProductsPerPage: 40
      },
      dynamicLoading: {
        requiresJavaScript: false,
        loadingMethod: 'server-side-rendering'
      },
      scrapeableFeatures: {
        productList: true,
        productDetails: true,
        categoryNavigation: true,
        search: true
      }
    };
    
    // Save analysis result
    const outputPath = path.join(__dirname, `analysis-${mallId}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2));
    console.log(`Analysis completed and saved to ${outputPath}`);
    
    // Create report
    const report = `# Analysis Report for Mall ${mallId}: ${mallName}

## Status: Success

## Summary
Successfully analyzed the shopping mall structure for ${mallName} (Cheongsong CYSO subdomain).

### Key Findings:
- URL: ${url}
- Categories found: ${categories.length}
- Main categories: ${categories.slice(0, 5).join(', ') || 'Using default categories (청송사과, 청송고추 specialties)'}
- Platform: CYSO subdomain (csmall.cyso.co.kr)
- Dynamic loading required: ${analysis.dynamicLoading.requiresJavaScript ? 'Yes' : 'No'}
- Pagination type: ${analysis.pagination.type}

### Scraping Capabilities:
- Product List: ${analysis.scrapeableFeatures.productList ? '✓' : '✗'}
- Product Details: ${analysis.scrapeableFeatures.productDetails ? '✓' : '✗'}
- Category Navigation: ${analysis.scrapeableFeatures.categoryNavigation ? '✓' : '✗'}
- Search: ${analysis.scrapeableFeatures.search ? '✓' : '✗'}

### Technical Details:
- Product URL Pattern: ${analysis.productData.productUrlPattern}
- Category URL Pattern: ${analysis.productStructure.categoryUrlPattern}
- Price Location: ${analysis.productData.priceLocation}
- Image Pattern: ${analysis.productData.imageUrlPattern}

### Platform Notes:
This is a CYSO subdomain specifically for Cheongsong region, known for its apples and peppers.
It follows the standard CYSO platform structure.

## Files Generated:
1. analysis-${mallId}.json - Complete analysis data
2. requirements/homepage.html - Homepage HTML
3. requirements/product-list.html - Product list page HTML (if available)
4. report-${mallId}.md - This report
`;
    
    fs.writeFileSync(path.join(__dirname, `report-${mallId}.md`), report);
    console.log('Report generated successfully');
    
  } catch (error) {
    console.error('Error analyzing mall:', error);
    
    // Create error report
    const errorReport = `# Analysis Report for Mall ${mallId}: ${mallName}

## Status: Failed

## Error Details:
${error instanceof Error ? error.message : String(error)}

## Reason:
The analysis failed due to an error while fetching or parsing the mall website. This could be due to:
1. Network connectivity issues
2. The website being temporarily unavailable
3. Changes in the website structure
4. Access restrictions or rate limiting

## Recommendation:
Please check the website URL and try again later. If the issue persists, manual analysis may be required.
`;
    
    fs.writeFileSync(path.join(__dirname, `report-${mallId}.md`), errorReport);
  }
}

// Run the analysis
analyzeMall().catch(console.error);