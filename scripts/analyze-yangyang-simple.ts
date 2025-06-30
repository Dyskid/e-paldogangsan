/**
 * Yangyang Mall Simple Analysis using HTTP requests
 * URL: https://yangyang-mall.com/
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs/promises';
import * as path from 'path';

interface AnalysisResult {
  url: string;
  title: string;
  categories: Array<{
    name: string;
    url: string;
  }>;
  productSelectors: {
    container?: string;
    name?: string;
    price?: string;
    image?: string;
    link?: string;
  };
  notes: string[];
  status: string;
}

async function analyzeYangyangMallSimple(): Promise<void> {
  console.log('🔍 Starting Yangyang Mall simple analysis...');
  
  const analysis: AnalysisResult = {
    url: 'https://yangyang-mall.com/',
    title: '',
    categories: [],
    productSelectors: {},
    notes: [],
    status: 'analyzing'
  };

  try {
    // Create output directory
    const outputDir = path.join(__dirname, 'output');
    await fs.mkdir(outputDir, { recursive: true });

    // Fetch homepage
    console.log('📱 Fetching Yangyang Mall homepage...');
    const response = await axios.get('https://yangyang-mall.com/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      timeout: 30000
    });

    // Save homepage HTML
    await fs.writeFile(path.join(outputDir, 'yangyang-homepage.html'), response.data);
    
    const $ = cheerio.load(response.data);
    
    // Get page title
    analysis.title = $('title').text().trim();
    console.log(`📋 Page title: ${analysis.title}`);

    // Look for navigation and category links
    console.log('🔍 Analyzing navigation structure...');
    
    const navigationSelectors = [
      'nav a',
      '.menu a',
      '.category a',
      '.nav-menu a',
      'ul.menu li a',
      '.main-menu a',
      '#menu a',
      '.navigation a',
      '.gnb a',
      '.lnb a'
    ];

    let categoryLinks: Array<{name: string, url: string}> = [];

    for (const selector of navigationSelectors) {
      $(selector).each((index, element) => {
        const $el = $(element);
        const name = $el.text().trim();
        const href = $el.attr('href');
        
        if (name && href && name.length > 0 && name.length < 50) {
          const fullUrl = href.startsWith('http') ? href : `https://yangyang-mall.com${href}`;
          categoryLinks.push({ name, url: fullUrl });
        }
      });
      
      if (categoryLinks.length > 0) {
        analysis.notes.push(`Found navigation links using selector: ${selector}`);
        break;
      }
    }

    // If no specific navigation found, look for any relevant links
    if (categoryLinks.length === 0) {
      $('a[href]').each((index, element) => {
        const $el = $(element);
        const name = $el.text().trim();
        const href = $el.attr('href') || '';
        
        if (name && href && 
            (href.includes('product') || 
             href.includes('category') || 
             href.includes('shop') ||
             name.includes('상품') ||
             name.includes('카테고리') ||
             name.includes('쇼핑'))) {
          const fullUrl = href.startsWith('http') ? href : `https://yangyang-mall.com${href}`;
          categoryLinks.push({ name, url: fullUrl });
        }
      });
      analysis.notes.push('Used general link analysis for product/category detection');
    }

    // Remove duplicates and limit
    const uniqueLinks = categoryLinks.filter((link, index, self) => 
      index === self.findIndex(l => l.url === link.url)
    ).slice(0, 10);

    analysis.categories = uniqueLinks;
    console.log(`📂 Found ${analysis.categories.length} potential categories`);

    // Try to identify product structure from homepage
    console.log('🛍️ Analyzing potential product structure...');
    
    const productSelectors = [
      '.product-item',
      '.product',
      '.item',
      '.goods',
      '.product-list .item',
      '.shop-item',
      '[class*="product"]',
      '.thumbnail',
      '.product-box',
      '.goods-item'
    ];

    for (const selector of productSelectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        analysis.productSelectors.container = selector;
        analysis.notes.push(`Found ${elements.length} potential products using selector: ${selector}`);
        
        // Try to identify sub-selectors within first product
        const firstProduct = elements.first();
        
        // Look for name selectors
        const nameSelectors = ['.name', '.title', '.product-name', 'h3', 'h4', '.item-name', '.goods-name'];
        for (const nameSelector of nameSelectors) {
          if (firstProduct.find(nameSelector).length > 0) {
            analysis.productSelectors.name = nameSelector;
            break;
          }
        }

        // Look for price selectors
        const priceSelectors = ['.price', '.cost', '.amount', '[class*="price"]', '.money', '.won'];
        for (const priceSelector of priceSelectors) {
          if (firstProduct.find(priceSelector).length > 0) {
            analysis.productSelectors.price = priceSelector;
            break;
          }
        }

        // Look for image selectors
        if (firstProduct.find('img').length > 0) {
          analysis.productSelectors.image = 'img';
        }

        // Look for link selectors
        if (firstProduct.find('a').length > 0) {
          analysis.productSelectors.link = 'a';
        }
        
        break;
      }
    }

    // Check for search functionality
    const searchInputs = $('input[type="search"], input[placeholder*="검색"], .search input, #search');
    if (searchInputs.length > 0) {
      analysis.notes.push('Found search functionality');
    }

    // Check for pagination indicators
    const paginationElements = $('.pagination, .paging, .page-numbers, [class*="page"]');
    if (paginationElements.length > 0) {
      analysis.notes.push('Found pagination elements');
    }

    analysis.status = 'completed';

    // Save analysis results
    const analysisFile = path.join(outputDir, 'yangyang-analysis.json');
    await fs.writeFile(analysisFile, JSON.stringify(analysis, null, 2));

    console.log('✅ Analysis completed!');
    console.log(`📊 Results saved to: ${analysisFile}`);
    console.log(`📂 Found ${analysis.categories.length} categories`);
    console.log(`🏷️ Product container: ${analysis.productSelectors.container || 'Not found'}`);
    console.log(`💰 Price selector: ${analysis.productSelectors.price || 'Not found'}`);

    // Display found categories
    if (analysis.categories.length > 0) {
      console.log('\n📋 Found categories:');
      analysis.categories.forEach((cat, index) => {
        console.log(`  ${index + 1}. ${cat.name} - ${cat.url}`);
      });
    }

  } catch (error) {
    console.error('❌ Error during analysis:', error);
    analysis.status = 'error';
    analysis.notes.push(`Error: ${error.message}`);
    
    // Save error results
    const analysisFile = path.join(__dirname, 'output', 'yangyang-analysis.json');
    await fs.writeFile(analysisFile, JSON.stringify(analysis, null, 2)).catch(() => {});
  }
}

// Run the analysis
if (require.main === module) {
  analyzeYangyangMallSimple().catch(console.error);
}

export { analyzeYangyangMallSimple };