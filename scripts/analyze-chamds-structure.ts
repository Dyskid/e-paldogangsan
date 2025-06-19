import axios from 'axios';
import * as cheerio from 'cheerio';
import { writeFileSync } from 'fs';

interface AnalysisResult {
  url: string;
  title: string;
  productSelectors: string[];
  categoryLinks: string[];
  totalProducts: number;
  sampleProducts: any[];
  structure: {
    hasProductGrid: boolean;
    hasCategories: boolean;
    paginationPresent: boolean;
    ajaxLoading: boolean;
  };
}

async function analyzeChamdsStructure(): Promise<void> {
  const baseUrl = 'https://chamds.com';
  
  try {
    console.log('🔍 Analyzing 참달성 (chamds.com) website structure...');
    
    // Fetch main page
    const response = await axios.get(baseUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      timeout: 30000
    });

    console.log(`✅ Successfully fetched homepage (${response.status})`);
    
    const $ = cheerio.load(response.data);
    
    // Save HTML for analysis
    writeFileSync('./scripts/output/chamds-homepage.html', response.data);
    console.log('💾 Saved homepage HTML for analysis');

    const analysis: AnalysisResult = {
      url: baseUrl,
      title: $('title').text().trim(),
      productSelectors: [],
      categoryLinks: [],
      totalProducts: 0,
      sampleProducts: [],
      structure: {
        hasProductGrid: false,
        hasCategories: false,
        paginationPresent: false,
        ajaxLoading: false
      }
    };

    console.log(`📋 Page title: ${analysis.title}`);

    // Look for product containers
    const productContainerSelectors = [
      '.product-item', '.item', '.goods-item', '.product', '.prd-item',
      '.product-list li', '.goods_list li', '.item-list li',
      '.product-wrap', '.goods-wrap', '.item-wrap',
      '.pro-item', '.good-item', '.prod-item',
      '[class*="product"]', '[class*="goods"]', '[class*="item"]',
      '.product_item', '.goodsDisplayItemWrap', '.goods_item',
      '.prdItem', '.itemDisplayWrap', '.productItem'
    ];

    for (const selector of productContainerSelectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        console.log(`🎯 Found ${elements.length} elements with selector: ${selector}`);
        analysis.productSelectors.push(selector);
        analysis.structure.hasProductGrid = true;
        
        // Extract sample product data
        elements.slice(0, 3).each((i, elem) => {
          const $elem = $(elem);
          const productData = {
            selector: selector,
            html: $elem.html()?.substring(0, 300) + '...',
            text: $elem.text().trim().substring(0, 100),
            links: $elem.find('a').map((_, a) => $(a).attr('href')).get(),
            images: $elem.find('img').map((_, img) => $(img).attr('src')).get()
          };
          analysis.sampleProducts.push(productData);
        });
      }
    }

    // Look for category links
    const categorySelectors = [
      '.category a', '.menu a', '.nav a', '.gnb a',
      '[href*="category"]', '[href*="goods"]', '[href*="product"]',
      '.lnb a', '.depth1 a', '.depth2 a', '.cate a',
      '.categoryWrap a', '.cateMenu a'
    ];

    for (const selector of categorySelectors) {
      $(selector).each((i, elem) => {
        const href = $(elem).attr('href');
        const text = $(elem).text().trim();
        if (href && text && href.includes('/')) {
          const fullUrl = href.startsWith('http') ? href : `${baseUrl}${href}`;
          analysis.categoryLinks.push(`${text}: ${fullUrl}`);
        }
      });
    }

    analysis.structure.hasCategories = analysis.categoryLinks.length > 0;

    // Check for pagination
    const paginationSelectors = ['.pagination', '.paging', '.page', '[class*="page"]', '.paginate'];
    for (const selector of paginationSelectors) {
      if ($(selector).length > 0) {
        analysis.structure.paginationPresent = true;
        console.log(`📄 Found pagination: ${selector}`);
        break;
      }
    }

    // Check for AJAX loading indicators
    const ajaxSelectors = [
      '[data-ajax]', '.ajax-load', '.load-more', 
      'script:contains("ajax")', 'script:contains("xhr")'
    ];
    for (const selector of ajaxSelectors) {
      if ($(selector).length > 0) {
        analysis.structure.ajaxLoading = true;
        console.log(`⚡ Detected AJAX loading: ${selector}`);
        break;
      }
    }

    // Look for specific Korean e-commerce patterns
    const koreanSelectors = [
      '.상품목록', '.상품리스트', '.제품목록', '.아이템리스트',
      '[class*="상품"]', '[class*="제품"]', '[class*="굿즈"]',
      '.goods_list', '.item_list', '.product_list'
    ];

    for (const selector of koreanSelectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        console.log(`🇰🇷 Found Korean selector: ${selector} (${elements.length} elements)`);
        analysis.productSelectors.push(selector);
      }
    }

    // Look for common e-commerce platform patterns (Cafe24, Makeshop, etc.)
    const ecommercePatterns = [
      '.xans-product', '.EC-productWrap', '.displayItemWrap',
      '.thumbnail', '.listItem', '.item-container'
    ];

    for (const selector of ecommercePatterns) {
      const elements = $(selector);
      if (elements.length > 0) {
        console.log(`🛒 Found e-commerce pattern: ${selector} (${elements.length} elements)`);
        analysis.productSelectors.push(selector);
      }
    }

    // Save analysis results
    writeFileSync('./scripts/output/chamds-analysis.json', JSON.stringify(analysis, null, 2));
    
    console.log('\n📊 Analysis Summary:');
    console.log(`📰 Title: ${analysis.title}`);
    console.log(`🎯 Product selectors found: ${analysis.productSelectors.length}`);
    console.log(`📂 Category links found: ${analysis.categoryLinks.length}`);
    console.log(`🏗️ Has product grid: ${analysis.structure.hasProductGrid}`);
    console.log(`📋 Has categories: ${analysis.structure.hasCategories}`);
    console.log(`📄 Has pagination: ${analysis.structure.paginationPresent}`);
    console.log(`⚡ Uses AJAX: ${analysis.structure.ajaxLoading}`);

    if (analysis.categoryLinks.length > 0) {
      console.log('\n📂 Category Links (first 10):');
      analysis.categoryLinks.slice(0, 10).forEach(link => console.log(`  - ${link}`));
    }

    if (analysis.productSelectors.length > 0) {
      console.log('\n🎯 Product Selectors:');
      analysis.productSelectors.forEach(selector => console.log(`  - ${selector}`));
    }

  } catch (error) {
    console.error('❌ Error analyzing chamds structure:', error);
    
    // Save error for debugging
    const errorInfo = {
      url: baseUrl,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    };
    
    writeFileSync('./scripts/output/chamds-analysis-error.json', JSON.stringify(errorInfo, null, 2));
  }
}

// Run analysis
analyzeChamdsStructure().then(() => {
  console.log('✅ Analysis complete!');
}).catch(console.error);