/**
 * Yangyang Mall Structure Analysis
 * URL: https://yangyang-mall.com/
 */

import * as puppeteer from 'puppeteer';
import * as fs from 'fs/promises';
import * as path from 'path';

interface AnalysisResult {
  url: string;
  title: string;
  categories: Array<{
    name: string;
    url: string;
    productCount?: number;
  }>;
  productSelectors: {
    container?: string;
    name?: string;
    price?: string;
    image?: string;
    link?: string;
  };
  pagination?: {
    type: string;
    selector?: string;
  };
  notes: string[];
}

async function analyzeYangyangMall(): Promise<void> {
  console.log('🔍 Starting Yangyang Mall structure analysis...');
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    const analysis: AnalysisResult = {
      url: 'https://yangyang-mall.com/',
      title: '',
      categories: [],
      productSelectors: {},
      notes: []
    };

    // Navigate to homepage
    console.log('📱 Navigating to Yangyang Mall homepage...');
    await page.goto('https://yangyang-mall.com/', { 
      waitUntil: 'networkidle2', 
      timeout: 60000 
    });
    await page.waitForTimeout(3000);

    // Get page title
    analysis.title = await page.title();
    console.log(`📋 Page title: ${analysis.title}`);

    // Save homepage HTML
    const homepageHtml = await page.content();
    const outputDir = path.join(__dirname, 'output');
    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(path.join(outputDir, 'yangyang-homepage.html'), homepageHtml);

    // Look for navigation menu and categories
    console.log('🔍 Analyzing navigation structure...');
    
    // Try different navigation selectors
    const navSelectors = [
      'nav a[href*="category"]',
      '.menu a[href*="category"]', 
      '.category a',
      '.nav-menu a',
      'ul.menu li a',
      '.main-menu a',
      '#menu a',
      '.navigation a'
    ];

    let categoryLinks: Array<{name: string, url: string}> = [];
    
    for (const selector of navSelectors) {
      try {
        const links = await page.$$eval(selector, (elements) => 
          elements.map(el => ({
            name: el.textContent?.trim() || '',
            url: el.getAttribute('href') || ''
          })).filter(link => link.name && link.url)
        );
        
        if (links.length > 0) {
          categoryLinks = links;
          analysis.notes.push(`Found navigation links using selector: ${selector}`);
          break;
        }
      } catch (error) {
        // Continue to next selector
      }
    }

    // If no category links found, look for any product-related links
    if (categoryLinks.length === 0) {
      try {
        const allLinks = await page.$$eval('a[href]', (elements) => 
          elements.map(el => ({
            name: el.textContent?.trim() || '',
            url: el.getAttribute('href') || ''
          })).filter(link => 
            link.name && 
            link.url && 
            (link.url.includes('product') || 
             link.url.includes('category') || 
             link.url.includes('shop') ||
             link.name.includes('상품') ||
             link.name.includes('카테고리'))
          )
        );
        categoryLinks = allLinks.slice(0, 10); // Limit to first 10
        analysis.notes.push('Used general link analysis for product/category detection');
      } catch (error) {
        analysis.notes.push(`Error finding links: ${error}`);
      }
    }

    // Process found category links
    for (const link of categoryLinks.slice(0, 5)) { // Limit to 5 for analysis
      const fullUrl = link.url.startsWith('http') ? link.url : `https://yangyang-mall.com${link.url}`;
      analysis.categories.push({
        name: link.name,
        url: fullUrl
      });
    }

    console.log(`📂 Found ${analysis.categories.length} potential categories`);

    // Analyze product listing structure if we found categories
    if (analysis.categories.length > 0) {
      console.log('🛍️ Analyzing product listing structure...');
      
      const testCategory = analysis.categories[0];
      try {
        await page.goto(testCategory.url, { waitUntil: 'networkidle2', timeout: 30000 });
        await page.waitForTimeout(2000);

        // Save category page for analysis
        const categoryHtml = await page.content();
        await fs.writeFile(path.join(outputDir, 'yangyang-category-sample.html'), categoryHtml);

        // Try to identify product containers
        const productSelectors = [
          '.product-item',
          '.product',
          '.item',
          '.goods',
          '.product-list .item',
          '.shop-item',
          '[class*="product"]',
          '.thumbnail',
          '.product-box'
        ];

        for (const selector of productSelectors) {
          try {
            const productCount = await page.$$eval(selector, (elements) => elements.length);
            if (productCount > 0) {
              analysis.productSelectors.container = selector;
              analysis.notes.push(`Found ${productCount} products using selector: ${selector}`);
              
              // Try to identify sub-selectors for product details
              const firstProduct = await page.$(selector);
              if (firstProduct) {
                // Look for name selectors
                const nameSelectors = ['.name', '.title', '.product-name', 'h3', 'h4', '.item-name'];
                for (const nameSelector of nameSelectors) {
                  const nameElement = await firstProduct.$(nameSelector);
                  if (nameElement) {
                    analysis.productSelectors.name = nameSelector;
                    break;
                  }
                }

                // Look for price selectors
                const priceSelectors = ['.price', '.cost', '.amount', '[class*="price"]', '.money'];
                for (const priceSelector of priceSelectors) {
                  const priceElement = await firstProduct.$(priceSelector);
                  if (priceElement) {
                    analysis.productSelectors.price = priceSelector;
                    break;
                  }
                }

                // Look for image selectors
                const imageSelectors = ['img', '.image img', '.photo img', '.thumbnail img'];
                for (const imageSelector of imageSelectors) {
                  const imageElement = await firstProduct.$(imageSelector);
                  if (imageElement) {
                    analysis.productSelectors.image = imageSelector;
                    break;
                  }
                }

                // Look for link selectors
                const linkSelectors = ['a', '.link', '[href]'];
                for (const linkSelector of linkSelectors) {
                  const linkElement = await firstProduct.$(linkSelector);
                  if (linkElement) {
                    analysis.productSelectors.link = linkSelector;
                    break;
                  }
                }
              }
              break;
            }
          } catch (error) {
            // Continue to next selector
          }
        }

        // Look for pagination
        const paginationSelectors = ['.pagination', '.paging', '.page-numbers', '[class*="page"]'];
        for (const pagSelector of paginationSelectors) {
          try {
            const pagElement = await page.$(pagSelector);
            if (pagElement) {
              analysis.pagination = {
                type: 'numbered',
                selector: pagSelector
              };
              break;
            }
          } catch (error) {
            // Continue
          }
        }

      } catch (error) {
        analysis.notes.push(`Error analyzing category page: ${error}`);
      }
    }

    // Look for search functionality
    try {
      const searchSelectors = ['[type="search"]', '.search input', '#search', '[placeholder*="검색"]'];
      for (const searchSelector of searchSelectors) {
        const searchElement = await page.$(searchSelector);
        if (searchElement) {
          analysis.notes.push(`Found search functionality: ${searchSelector}`);
          break;
        }
      }
    } catch (error) {
      // Search not critical
    }

    // Save analysis results
    const analysisFile = path.join(outputDir, 'yangyang-analysis.json');
    await fs.writeFile(analysisFile, JSON.stringify(analysis, null, 2));

    console.log('✅ Analysis completed!');
    console.log(`📊 Results saved to: ${analysisFile}`);
    console.log(`📂 Found ${analysis.categories.length} categories`);
    console.log(`🏷️ Product container: ${analysis.productSelectors.container || 'Not found'}`);
    console.log(`💰 Price selector: ${analysis.productSelectors.price || 'Not found'}`);

  } catch (error) {
    console.error('❌ Error during analysis:', error);
  } finally {
    await browser.close();
  }
}

// Run the analysis
if (require.main === module) {
  analyzeYangyangMall().catch(console.error);
}

export { analyzeYangyangMall };