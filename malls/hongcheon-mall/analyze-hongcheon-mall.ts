import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

async function analyzeHongcheonStructure() {
  console.log('🔍 Starting Hongcheon Mall structure analysis...');
  
  try {
    const baseUrl = 'https://hongcheon-mall.com';
    console.log(`Fetching homepage: ${baseUrl}`);
    
    const response = await axios.get(baseUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 30000
    });
    
    const $ = cheerio.load(response.data);
    
    // Save HTML for analysis
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(outputDir, 'hongcheon-homepage.html'),
      response.data,
      'utf-8'
    );
    
    console.log('📄 Homepage HTML saved for analysis');
    
    // Analyze structure
    const analysis = {
      timestamp: new Date().toISOString(),
      url: baseUrl,
      pageTitle: $('title').text().trim(),
      
      // Look for product links
      productLinks: {
        totalLinks: $('a').length,
        productUrls: [] as string[],
        patterns: {
          'goods/view': $('a[href*="goods/view"]').length,
          'product': $('a[href*="product"]').length,
          'item': $('a[href*="item"]').length,
          'shop': $('a[href*="shop"]').length
        }
      },
      
      // Analyze page structure
      structure: {
        navigation: $('.nav, .menu, .gnb').length,
        productSections: $('.product, .goods, .item').length,
        categoryMenus: $('.category, .cate').length,
        searchForms: $('form[action*="search"], input[name*="search"]').length
      },
      
      // Look for specific selectors
      selectors: {
        productNames: [] as string[],
        productPrices: [] as string[],
        productImages: [] as string[],
        productLinks: [] as string[]
      },
      
      // Sample content analysis
      sampleContent: {
        headings: $('h1, h2, h3').map((i, el) => $(el).text().trim()).get().slice(0, 10),
        productKeywords: [] as string[]
      }
    };
    
    // Extract product URLs
    const productUrls = new Set<string>();
    
    $('a').each((i, element) => {
      const href = $(element).attr('href');
      if (href) {
        const fullUrl = href.startsWith('http') ? href : new URL(href, baseUrl).toString();
        
        // Look for product URL patterns
        if (href.includes('goods/view') || 
            href.includes('product') ||
            href.includes('item/') ||
            href.includes('shop/view')) {
          productUrls.add(fullUrl);
        }
      }
    });
    
    analysis.productLinks.productUrls = Array.from(productUrls);
    
    // Look for common product selectors
    const commonProductSelectors = [
      '.product-name', '.goods-name', '.item-name', '.title',
      '.product-price', '.goods-price', '.item-price', '.price',
      '.product-img', '.goods-img', '.item-img', 'img[src*="goods"]',
      'a[href*="goods"]', 'a[href*="product"]', 'a[href*="item"]'
    ];
    
    commonProductSelectors.forEach(selector => {
      const elements = $(selector);
      if (elements.length > 0) {
        if (selector.includes('name') || selector.includes('title')) {
          analysis.selectors.productNames.push(`${selector}: ${elements.length} elements`);
        } else if (selector.includes('price')) {
          analysis.selectors.productPrices.push(`${selector}: ${elements.length} elements`);
        } else if (selector.includes('img')) {
          analysis.selectors.productImages.push(`${selector}: ${elements.length} elements`);
        } else if (selector.includes('href')) {
          analysis.selectors.productLinks.push(`${selector}: ${elements.length} elements`);
        }
      }
    });
    
    // Look for Hongcheon-specific keywords
    const pageText = $.text();
    const hongcheonKeywords = ['홍천', '한우', '더덕', '내면', '명품', '특산품', '농산물'];
    hongcheonKeywords.forEach(keyword => {
      if (pageText.includes(keyword)) {
        analysis.sampleContent.productKeywords.push(keyword);
      }
    });
    
    // Save analysis
    const analysisPath = path.join(outputDir, 'hongcheon-analysis.json');
    fs.writeFileSync(analysisPath, JSON.stringify(analysis, null, 2), 'utf-8');
    
    // Console output
    console.log('\n📊 Hongcheon Mall Analysis Results:');
    console.log(`📄 Page title: ${analysis.pageTitle}`);
    console.log(`🔗 Total links found: ${analysis.productLinks.totalLinks}`);
    console.log(`📦 Potential product URLs: ${analysis.productLinks.productUrls.length}`);
    
    console.log('\n🎯 URL Patterns:');
    Object.entries(analysis.productLinks.patterns).forEach(([pattern, count]) => {
      if (count > 0) {
        console.log(`  ${pattern}: ${count} links`);
      }
    });
    
    if (analysis.productLinks.productUrls.length > 0) {
      console.log('\n📋 Sample product URLs:');
      analysis.productLinks.productUrls.slice(0, 5).forEach((url, i) => {
        console.log(`  ${i + 1}. ${url}`);
      });
    }
    
    if (analysis.selectors.productNames.length > 0) {
      console.log('\n🏷️ Product name selectors found:');
      analysis.selectors.productNames.forEach(selector => console.log(`  ${selector}`));
    }
    
    if (analysis.sampleContent.productKeywords.length > 0) {
      console.log('\n🎯 Hongcheon keywords found:');
      console.log(`  ${analysis.sampleContent.productKeywords.join(', ')}`);
    }
    
    console.log(`\n💾 Analysis saved to: ${analysisPath}`);
    console.log(`📄 Homepage HTML saved for detailed analysis`);
    
    return analysis;
    
  } catch (error) {
    console.error('❌ Error analyzing Hongcheon Mall:', error);
    throw error;
  }
}

// Run analysis
analyzeHongcheonStructure()
  .then(() => {
    console.log('🎉 Hongcheon Mall analysis completed successfully!');
  })
  .catch((error) => {
    console.error('💥 Analysis failed:', error);
    process.exit(1);
  });