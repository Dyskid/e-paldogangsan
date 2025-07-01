import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

interface ProductCategory {
  name: string;
  url: string;
  id: string;
}

interface ProductData {
  id: string;
  name: string;
  price: string;
  image: string;
  url: string;
  category?: string;
}

interface MallAnalysis {
  mallId: number;
  mallName: string;
  baseUrl: string;
  productCategories: ProductCategory[];
  urlPatterns: {
    categoryList: string;
    productDetail: string;
    pagination: string;
  };
  paginationMethod: 'page-number' | 'infinite-scroll' | 'load-more' | 'none';
  requiresJavaScript: boolean;
  productDataStructure: {
    listSelector: string;
    itemSelector: string;
    nameSelector: string;
    priceSelector: string;
    imageSelector: string;
    linkSelector: string;
  };
  sampleProducts: ProductData[];
  totalProductsEstimate?: number;
  analysisStatus: 'success' | 'partial' | 'failed';
  errorDetails?: string;
}

async function analyzeNaverSmartStore(): Promise<MallAnalysis> {
  const browser: Browser = await chromium.launch({ 
    headless: true,
    args: ['--disable-blink-features=AutomationControlled']
  });
  const page: Page = await browser.newPage();
  
  // Set viewport and user agent
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
  });
  
  const analysis: MallAnalysis = {
    mallId: 2,
    mallName: '참달성 (달성군)',
    baseUrl: 'https://smartstore.naver.com/chamdalseong',
    productCategories: [],
    urlPatterns: {
      categoryList: '/category/{categoryId}?cp={page}&st=POPULAR',
      productDetail: '/products/{productId}',
      pagination: '?cp={page}'
    },
    paginationMethod: 'page-number',
    requiresJavaScript: true,
    productDataStructure: {
      listSelector: 'ul[class*="ProductList"]',
      itemSelector: 'li[class*="ProductItem"]',
      nameSelector: 'strong[class*="name"]',
      priceSelector: 'span[class*="price"] > span[class*="number"]',
      imageSelector: 'img[class*="thumbnail"]',
      linkSelector: 'a[class*="ProductItem"]'
    },
    sampleProducts: [],
    analysisStatus: 'failed'
  };

  try {
    console.log('Attempting to navigate to:', analysis.baseUrl);
    
    // Add delay before navigation to avoid rate limiting
    await page.waitForTimeout(5000);
    
    // Navigate to main page with longer timeout
    let response = await page.goto(analysis.baseUrl, { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });
    
    console.log('Response status:', response?.status());
    
    // If we get rate limited, wait and retry
    if (response?.status() === 429) {
      console.log('Rate limited, waiting 30 seconds before retry...');
      await page.waitForTimeout(30000);
      
      response = await page.goto(analysis.baseUrl, { 
        waitUntil: 'domcontentloaded',
        timeout: 60000 
      });
      console.log('Retry response status:', response?.status());
    }
    
    // Wait for page to settle
    await page.waitForTimeout(5000);
    
    // Save main page HTML
    const mainPageHtml = await page.content();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    fs.writeFileSync(
      path.join(__dirname, 'requirements', `main-page-rendered-${timestamp}.html`),
      mainPageHtml
    );

    // Check if we're on an error page
    const pageTitle = await page.title();
    const isErrorPage = await page.evaluate(() => {
      const errorIndicators = [
        document.querySelector('.module_error'),
        document.querySelector('[class*="error"]'),
        document.querySelector('[class*="Error"]'),
        document.body.textContent?.includes('접속이 불가'),
        document.body.textContent?.includes('시스템오류'),
        document.body.textContent?.includes('페이지를 찾을 수 없습니다')
      ];
      return errorIndicators.some(indicator => !!indicator);
    });

    console.log('Page title:', pageTitle);
    console.log('Is error page:', isErrorPage);

    if (isErrorPage) {
      analysis.errorDetails = 'The store page returns an error. The store might be closed or the URL might have changed.';
      console.log('Error detected on page');
    } else {
      // Try multiple selector strategies for categories
      const categories = await page.evaluate(() => {
        const selectors = [
          'a[class*="CategoryItem"]',
          '[class*="category"] a',
          'nav a[href*="/category/"]',
          '[class*="gnb"] a',
          '[class*="menu"] a[href*="/category/"]'
        ];
        
        const foundCategories: any[] = [];
        
        for (const selector of selectors) {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            console.log(`Found ${elements.length} elements with selector: ${selector}`);
            elements.forEach((el, index) => {
              const anchor = el as HTMLAnchorElement;
              if (anchor.href && anchor.href.includes('/category/')) {
                foundCategories.push({
                  name: anchor.textContent?.trim() || '',
                  url: anchor.href,
                  id: anchor.href.match(/category\/([^?]+)/)?.[1] || `cat${index}`
                });
              }
            });
            break;
          }
        }
        
        return foundCategories;
      });
      
      analysis.productCategories = categories.filter(cat => cat.name && cat.url);
      console.log(`Found ${analysis.productCategories.length} categories`);

      // Try to navigate to all products or first category
      let productsPageUrl = `${analysis.baseUrl}/category/ALL?st=POPULAR`;
      
      if (analysis.productCategories.length > 0) {
        // If we found categories, try the first one
        productsPageUrl = analysis.productCategories[0].url;
        console.log('Using first category URL:', productsPageUrl);
      }
      
      try {
        await page.goto(productsPageUrl, { waitUntil: 'networkidle', timeout: 30000 });
        console.log('Navigated to products page, waiting for content...');
        
        // Wait for products to load
        try {
          await page.waitForSelector('[class*="ProductItem"], [class*="product"], [class*="goods"]', { timeout: 10000 });
        } catch (e) {
          console.log('No products found with standard selectors, continuing...');
        }
        
        await page.waitForTimeout(3000);
    
        // Save products page
        const productsPageHtml = await page.content();
        fs.writeFileSync(
          path.join(__dirname, 'requirements', `products-page-rendered-${timestamp}.html`),
          productsPageHtml
        );

        // Try multiple selector strategies for products
        const products = await page.evaluate(() => {
          const productSelectors = {
            container: [
              'li[class*="ProductItem"]',
              '[class*="product-item"]',
              '[class*="goods"]',
              'div[class*="item"]'
            ],
            name: [
              'strong[class*="name"]',
              '[class*="product-name"]',
              '[class*="goods-name"]',
              'a[class*="link"] span'
            ],
            price: [
              'span[class*="price"] span[class*="number"]',
              '[class*="price"]',
              'span[class*="cost"]',
              '[class*="amount"]'
            ],
            image: [
              'img[class*="thumbnail"]',
              'img[class*="thumb"]',
              '[class*="image"] img',
              'img[src*="shop-phinf"]'
            ],
            link: [
              'a[class*="ProductItem"]',
              'a[href*="/products/"]',
              '[class*="link"][href*="products"]'
            ]
          };
          
          const foundProducts: any[] = [];
          
          // Try each container selector
          for (const containerSel of productSelectors.container) {
            const containers = document.querySelectorAll(containerSel);
            if (containers.length > 0) {
              console.log(`Found ${containers.length} product containers with selector: ${containerSel}`);
              
              containers.forEach((container, index) => {
                if (index >= 10) return; // Limit to 10 products
                
                let product: any = {
                  id: '',
                  name: '',
                  price: '',
                  image: '',
                  url: ''
                };
                
                // Try to find link and extract ID
                for (const linkSel of productSelectors.link) {
                  const link = container.querySelector(linkSel) as HTMLAnchorElement;
                  if (link?.href) {
                    product.url = link.href;
                    const idMatch = link.href.match(/products\/(\d+)/);
                    if (idMatch) {
                      product.id = idMatch[1];
                      break;
                    }
                  }
                }
                
                // Try to find name
                for (const nameSel of productSelectors.name) {
                  const nameEl = container.querySelector(nameSel);
                  if (nameEl?.textContent) {
                    product.name = nameEl.textContent.trim();
                    break;
                  }
                }
                
                // Try to find price
                for (const priceSel of productSelectors.price) {
                  const priceEl = container.querySelector(priceSel);
                  if (priceEl?.textContent) {
                    product.price = priceEl.textContent.trim();
                    break;
                  }
                }
                
                // Try to find image
                for (const imgSel of productSelectors.image) {
                  const imgEl = container.querySelector(imgSel) as HTMLImageElement;
                  if (imgEl?.src) {
                    product.image = imgEl.src;
                    break;
                  }
                }
                
                if (product.name || product.id) {
                  foundProducts.push(product);
                }
              });
              
              if (foundProducts.length > 0) break;
            }
          }
          
          return foundProducts;
        });

        analysis.sampleProducts = products.filter(p => p.id || p.name);
        console.log(`Found ${analysis.sampleProducts.length} products`);
        
        if (analysis.sampleProducts.length > 0) {
          analysis.analysisStatus = 'success';

        } else {
          analysis.analysisStatus = 'partial';
        }
        
        // Check pagination
        const paginationInfo = await page.evaluate(() => {
          const paginationSelectors = [
            'a[class*="PaginationItem"]',
            '[class*="pagination"] a',
            'a[href*="cp="]',
            '[class*="paging"] a'
          ];
          
          for (const sel of paginationSelectors) {
            const elements = document.querySelectorAll(sel);
            if (elements.length > 0) {
              return { exists: true, selector: sel, count: elements.length };
            }
          }
          
          // Check for infinite scroll
          const infiniteScrollIndicators = [
            '[class*="infinite"]',
            '[class*="scroll-load"]',
            '[data-infinite]'
          ];
          
          for (const sel of infiniteScrollIndicators) {
            if (document.querySelector(sel)) {
              return { exists: true, type: 'infinite-scroll' };
            }
          }
          
          return { exists: false };
        });

        if (paginationInfo.exists) {
          if (paginationInfo.type === 'infinite-scroll') {
            analysis.paginationMethod = 'infinite-scroll';
          } else {
            analysis.paginationMethod = 'page-number';
          }
          console.log('Pagination found:', paginationInfo);
        } else {
          analysis.paginationMethod = 'none';
        }
        
        // Try to get total product count
        const totalProductsText = await page.evaluate(() => {
          const countSelectors = [
            '[class*="total"] [class*="number"]',
            '[class*="count"]',
            '[class*="result"]'
          ];
          
          for (const sel of countSelectors) {
            const el = document.querySelector(sel);
            if (el?.textContent) {
              const match = el.textContent.match(/(\d+)/);
              if (match) return match[1];
            }
          }
          
          // Look for text containing "개" (items)
          const allSpans = document.querySelectorAll('span');
          for (let i = 0; i < allSpans.length; i++) {
            const span = allSpans[i];
            if (span.textContent?.includes('개')) {
              const match = span.textContent.match(/(\d+)\s*개/);
              if (match) return match[1];
            }
          }
          
          return null;
        });
        
        if (totalProductsText) {
          analysis.totalProductsEstimate = parseInt(totalProductsText, 10);
          console.log('Total products estimate:', analysis.totalProductsEstimate);
        }
        
      } catch (navError) {
        console.error('Error navigating to products page:', navError);
        analysis.errorDetails = `Could not load products page: ${navError}`;
      }
    }

  } catch (error) {
    console.error('Error during analysis:', error);
    analysis.errorDetails = `Analysis failed: ${error}`;
    analysis.analysisStatus = 'failed';
  } finally {
    // Take a screenshot before closing
    try {
      await page.screenshot({ 
        path: path.join(__dirname, 'requirements', `final-screenshot-${new Date().toISOString().replace(/[:.]/g, '-')}.png`),
        fullPage: true 
      });
    } catch (screenshotError) {
      console.error('Could not take screenshot:', screenshotError);
    }
    
    await browser.close();
  }

  return analysis;
}

// Main execution
(async () => {
  try {
    console.log('Starting analysis for 참달성 (달성군) - Naver Smart Store...');
    
    const analysisResult = await analyzeNaverSmartStore();
    
    // Save analysis result
    const outputPath = path.join(__dirname, 'analysis-2.json');
    fs.writeFileSync(outputPath, JSON.stringify(analysisResult, null, 2));
    
    console.log('Analysis completed successfully!');
    console.log(`Found ${analysisResult.productCategories.length} categories`);
    console.log(`Collected ${analysisResult.sampleProducts.length} sample products`);
    if (analysisResult.totalProductsEstimate) {
      console.log(`Estimated total products: ${analysisResult.totalProductsEstimate}`);
    }
    
  } catch (error) {
    console.error('Analysis failed:', error);
    process.exit(1);
  }
})();