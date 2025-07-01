import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

interface CategoryInfo {
  name: string;
  url: string;
  productCount?: number;
}

interface MallStructure {
  mallName: string;
  baseUrl: string;
  categories: CategoryInfo[];
  productListingPatterns: string[];
  productUrlPattern?: string;
  totalProducts?: number;
}

async function analyzeSjlocalStructure() {
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    console.log('📋 Fetching homepage...');
    await page.goto('https://www.sjlocal.or.kr/', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Save homepage HTML for debugging
    const homepageHtml = await page.content();
    fs.writeFileSync(
      path.join(__dirname, 'output', 'sjlocal-homepage.html'),
      homepageHtml
    );
    
    console.log('🔍 Analyzing navigation structure...');
    
    // Look for category navigation
    const categories: CategoryInfo[] = await page.evaluate(() => {
      const categoryData: CategoryInfo[] = [];
      
      // Check for various navigation patterns
      // Pattern 1: Main navigation menu
      const mainNavLinks = document.querySelectorAll('nav a, .nav a, .navigation a, .menu a, .gnb a, .lnb a');
      mainNavLinks.forEach(link => {
        const href = (link as HTMLAnchorElement).href;
        const text = (link as HTMLAnchorElement).textContent?.trim() || '';
        
        if (href && text && !href.includes('#') && !href.includes('javascript:')) {
          categoryData.push({ name: text, url: href });
        }
      });
      
      // Pattern 2: Category sections
      const categoryLinks = document.querySelectorAll('[class*="category"] a, [class*="cate"] a');
      categoryLinks.forEach(link => {
        const href = (link as HTMLAnchorElement).href;
        const text = (link as HTMLAnchorElement).textContent?.trim() || '';
        
        if (href && text && !href.includes('#') && !href.includes('javascript:')) {
          categoryData.push({ name: text, url: href });
        }
      });
      
      // Pattern 3: Product listing links
      const productListLinks = document.querySelectorAll('a[href*="product"], a[href*="goods"], a[href*="item"]');
      productListLinks.forEach(link => {
        const href = (link as HTMLAnchorElement).href;
        const text = (link as HTMLAnchorElement).textContent?.trim() || '';
        
        if (href && text && !href.includes('#') && !href.includes('javascript:')) {
          categoryData.push({ name: text, url: href });
        }
      });
      
      return categoryData;
    });
    
    // Remove duplicates
    const uniqueCategories = Array.from(
      new Map(categories.map(cat => [cat.url, cat])).values()
    );
    
    console.log(`📂 Found ${uniqueCategories.length} potential category links`);
    
    // Try to identify product listing pages
    const productListingPatterns: string[] = [];
    
    for (const category of uniqueCategories.slice(0, 5)) { // Check first 5 categories
      try {
        console.log(`🔍 Checking category: ${category.name}`);
        await page.goto(category.url, { 
          waitUntil: 'networkidle2',
          timeout: 30000 
        });
        
        // Check for product listings
        const hasProducts = await page.evaluate(() => {
          // Common product listing selectors
          const productSelectors = [
            '.product-item', '.product', '.goods-item', '.item',
            '[class*="product-list"]', '[class*="goods-list"]',
            '.list-item', '.prd-item', '.prod-item'
          ];
          
          for (const selector of productSelectors) {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
              return { found: true, selector, count: elements.length };
            }
          }
          
          return { found: false, selector: null, count: 0 };
        });
        
        if (hasProducts.found && hasProducts.selector) {
          productListingPatterns.push(hasProducts.selector);
          category.productCount = hasProducts.count;
          console.log(`✅ Found ${hasProducts.count} products with selector: ${hasProducts.selector}`);
        }
      } catch (error) {
        console.log(`❌ Error checking category ${category.name}: ${error}`);
      }
    }
    
    // Try to identify product URL pattern
    const productUrls = await page.evaluate(() => {
      const urls: string[] = [];
      const links = document.querySelectorAll('a[href*="product"], a[href*="goods"], a[href*="item"]');
      
      links.forEach(link => {
        const href = (link as HTMLAnchorElement).href;
        if (href && !href.includes('#') && !href.includes('javascript:')) {
          urls.push(href);
        }
      });
      
      return urls.slice(0, 10); // Get sample URLs
    });
    
    console.log('🔍 Sample product URLs:', productUrls);
    
    const structure: MallStructure = {
      mallName: '세종로컬푸드',
      baseUrl: 'https://www.sjlocal.or.kr',
      categories: uniqueCategories.filter(cat => cat.productCount && cat.productCount > 0),
      productListingPatterns: [...new Set(productListingPatterns)],
      productUrlPattern: productUrls.length > 0 ? productUrls[0] : undefined,
      totalProducts: uniqueCategories.reduce((sum, cat) => sum + (cat.productCount || 0), 0)
    };
    
    // Save analysis results
    fs.writeFileSync(
      path.join(__dirname, 'output', 'sjlocal-structure-analysis.json'),
      JSON.stringify(structure, null, 2)
    );
    
    console.log('\n📊 Analysis Summary:');
    console.log(`Mall: ${structure.mallName}`);
    console.log(`Categories with products: ${structure.categories.length}`);
    console.log(`Product listing patterns: ${structure.productListingPatterns.join(', ')}`);
    console.log(`Estimated total products: ${structure.totalProducts}`);
    
    return structure;
    
  } catch (error) {
    console.error('Error analyzing mall structure:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the analysis
analyzeSjlocalStructure()
  .then(() => console.log('✅ Analysis complete'))
  .catch(error => console.error('❌ Analysis failed:', error));