import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

async function analyzeOkjMallStructure() {
  try {
    console.log('🔍 Starting 장흥몰 (OKJ Mall) structure analysis...');
    
    const baseUrl = 'https://okjmall.com';
    const outputDir = path.join(process.cwd(), 'scripts', 'output');
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log('📡 Fetching homepage...');
    
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    };

    const response = await axios.get(baseUrl, { 
      headers,
      timeout: 30000,
      maxRedirects: 5
    });

    const $ = cheerio.load(response.data);
    
    // Save homepage for analysis
    fs.writeFileSync(
      path.join(outputDir, 'okjmall-homepage.html'),
      response.data
    );
    
    console.log(`✅ Homepage saved (${response.data.length} characters)`);

    // Analyze page structure
    const analysis = {
      timestamp: new Date().toISOString(),
      url: baseUrl,
      title: $('title').text().trim(),
      platform: 'Unknown',
      structure: {
        productSelectors: [] as string[],
        categoryLinks: [] as string[],
        navigationMenus: [] as string[],
        productContainers: [] as string[]
      },
      sampleProducts: [] as any[],
      categoryAnalysis: [] as any[],
      homepageProducts: 0
    };

    // Try to identify platform
    if (response.data.includes('cafe24')) {
      analysis.platform = 'Cafe24';
      analysis.structure.productSelectors.push('.xans-product-listmain', '.prdList', '.goods_list');
    } else if (response.data.includes('makeshop')) {
      analysis.platform = 'MakeShop';
      analysis.structure.productSelectors.push('.item_list', '.product_list');
    } else if (response.data.includes('godo')) {
      analysis.platform = 'Godo Mall';
      analysis.structure.productSelectors.push('.goods_list', '.item_wrap');
    } else if (response.data.includes('shopify')) {
      analysis.platform = 'Shopify';
      analysis.structure.productSelectors.push('.product-item', '.grid-item');
    } else if (response.data.includes('wordpress') || response.data.includes('woocommerce')) {
      analysis.platform = 'WooCommerce';
      analysis.structure.productSelectors.push('.product', '.woocommerce-loop-product');
    } else if (response.data.includes('smartstore') || response.data.includes('naver')) {
      analysis.platform = 'Naver SmartStore';
      analysis.structure.productSelectors.push('.product_item', '.goods_item');
    }

    console.log(`🏗️  Detected platform: ${analysis.platform}`);

    // Look for product containers
    const productContainerSelectors = [
      '.goods_list', '.product_list', '.item_list', '.prd_list',
      '.xans-product-listmain', '.prdList', '.goods_wrap',
      '.product-grid', '.product_grid', '.grid-item',
      '[class*="goods"]', '[class*="product"]', '[class*="item"]',
      '.shop_item', '.store_item', '.mall_item', '.content_item'
    ];

    productContainerSelectors.forEach(selector => {
      const elements = $(selector);
      if (elements.length > 0) {
        analysis.structure.productContainers.push(`${selector} (${elements.length} found)`);
        
        // If this looks like a product container, analyze the first few items
        if (elements.length > 2 && elements.length < 50) {
          elements.slice(0, 3).each((i, el) => {
            const $el = $(el);
            const sample = {
              selector: selector,
              hasImage: $el.find('img').length > 0,
              hasLink: $el.find('a').length > 0,
              hasPrice: $el.text().includes('원') || $el.text().includes('₩'),
              textContent: $el.text().trim().substring(0, 100)
            };
            analysis.sampleProducts.push(sample);
          });
        }
      }
    });

    // Count potential products on homepage
    const possibleProductSelectors = [
      '.goods_item', '.product_item', '.item', '.goods',
      '.prd_item', '.product', '.goods_list li', '.product_list li',
      '.xans-record-', '[class*="goods_"]', '[class*="product_"]',
      '.shop_item', '.grid-item', '.content_item'
    ];

    let maxProductCount = 0;
    for (const selector of possibleProductSelectors) {
      const count = $(selector).length;
      if (count > maxProductCount) {
        maxProductCount = count;
      }
      if (count > 2) {
        analysis.structure.productSelectors.push(`${selector} (${count} items)`);
      }
    }
    analysis.homepageProducts = maxProductCount;

    // Look for category navigation
    const categorySelectors = [
      '.category_list a', '.cate_list a', '.menu_list a',
      '.gnb a', '.lnb a', '.category a', '.cate a',
      'nav a', '.navigation a', '.main-menu a',
      '.product-category a', '.shop-menu a', '.menu a'
    ];

    categorySelectors.forEach(selector => {
      const links = $(selector);
      if (links.length > 0 && links.length < 50) { // Reasonable number of categories
        analysis.structure.categoryLinks.push(`${selector} (${links.length} found)`);
        
        // Extract sample category URLs
        links.slice(0, 15).each((i, el) => {
          const href = $(el).attr('href');
          const text = $(el).text().trim();
          if (href && text && text.length < 50) {
            analysis.structure.navigationMenus.push(`${text}: ${href}`);
          }
        });
      }
    });

    // Look for specific product listing pages
    $('a[href]').each((i, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim();
      
      if (href && (
        href.includes('goods') || href.includes('product') || 
        href.includes('category') || href.includes('cate') ||
        href.includes('list') || href.includes('shop') ||
        text.includes('상품') || text.includes('카테고리') ||
        text.includes('전체') || text.includes('농산물') ||
        text.includes('수산물') || text.includes('특산품') ||
        text.includes('한우') || text.includes('홍차') ||
        text.includes('표고버섯')
      )) {
        const fullUrl = href.startsWith('http') ? href : `${baseUrl}${href.startsWith('/') ? '' : '/'}${href}`;
        analysis.categoryAnalysis.push({
          text: text.substring(0, 30),
          href: fullUrl,
          isInternal: href.startsWith('/') || href.includes('okjmall.com')
        });
      }
    });

    // Remove duplicates from category analysis
    analysis.categoryAnalysis = analysis.categoryAnalysis
      .filter((item, index, self) => index === self.findIndex(t => t.href === item.href))
      .slice(0, 20); // Limit to 20 most relevant links

    // Save analysis
    const analysisPath = path.join(outputDir, 'okjmall-structure-analysis.json');
    fs.writeFileSync(analysisPath, JSON.stringify(analysis, null, 2));
    
    console.log('📊 Structure Analysis Summary:');
    console.log(`   Platform: ${analysis.platform}`);
    console.log(`   Title: ${analysis.title}`);
    console.log(`   Homepage products detected: ${analysis.homepageProducts}`);
    console.log(`   Product containers found: ${analysis.structure.productContainers.length}`);
    console.log(`   Category links found: ${analysis.structure.categoryLinks.length}`);
    console.log(`   Sample products analyzed: ${analysis.sampleProducts.length}`);
    console.log(`   Category pages identified: ${analysis.categoryAnalysis.length}`);
    
    // Show some category examples
    if (analysis.categoryAnalysis.length > 0) {
      console.log('📂 Sample category pages:');
      analysis.categoryAnalysis.slice(0, 5).forEach(cat => {
        console.log(`   - ${cat.text}: ${cat.href}`);
      });
    }
    
    console.log(`✅ Analysis saved to: ${path.basename(analysisPath)}`);
    
    return analysis;

  } catch (error) {
    console.error('❌ Analysis failed:', error);
    
    // Save error details
    const errorReport = {
      timestamp: new Date().toISOString(),
      error: (error as Error).message,
      stack: (error as Error).stack,
      url: 'https://okjmall.com'
    };
    
    const outputDir = path.join(process.cwd(), 'scripts', 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(outputDir, 'okjmall-analysis-error.json'),
      JSON.stringify(errorReport, null, 2)
    );
    
    throw error;
  }
}

analyzeOkjMallStructure();