import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';

async function analyzeGokseongmallStructure() {
  const baseUrl = 'https://gokseongmall.com';
  
  console.log('Starting analysis of 곡성몰 structure...');
  
  try {
    // Get the main page
    const response = await axios.get(baseUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 30000
    });

    const $ = cheerio.load(response.data);
    
    // Save the homepage for reference
    fs.writeFileSync('./gokseongmall-homepage.html', response.data);
    
    // Analyze the page structure
    const analysis = {
      platform: 'Unknown',
      detectedPatterns: [] as string[],
      productSelectors: [] as string[],
      categoryLinks: [] as Array<{text: string, href: string}>,
      productLinks: [] as string[],
      notes: [] as string[]
    };

    // Add basic page info
    analysis.notes.push(`Page title: ${$('title').text().trim()}`);
    analysis.notes.push(`Description: ${$('meta[name="description"]').attr('content') || 'No description'}`);
    
    // Check for common e-commerce platforms
    const bodyText = response.data.toLowerCase();
    if (bodyText.includes('cafe24')) {
      analysis.platform = 'Cafe24';
      analysis.detectedPatterns.push('Cafe24 platform detected');
    } else if (bodyText.includes('godo') || bodyText.includes('고도몰')) {
      analysis.platform = 'Godo';
      analysis.detectedPatterns.push('Godo platform detected');
    } else if (bodyText.includes('makeshop')) {
      analysis.platform = 'MakeShop';
      analysis.detectedPatterns.push('MakeShop platform detected');
    }

    // Look for common product selectors
    const commonSelectors = [
      '.product',
      '.item',
      '.goods',
      '.prd',
      '.product-item',
      '.goods-item',
      '.shop-item',
      '[class*="product"]',
      '[class*="goods"]',
      '[class*="item"]'
    ];

    commonSelectors.forEach(selector => {
      const elements = $(selector);
      if (elements.length > 0) {
        analysis.productSelectors.push(`${selector}: ${elements.length} elements`);
      }
    });

    // Look for navigation and category links
    $('a[href]').each((index, element) => {
      const href = $(element).attr('href');
      const text = $(element).text().trim();
      
      if (href && text) {
        // Look for category-like links
        if (href.includes('category') || href.includes('list') || 
            href.includes('goods') || href.includes('product') ||
            href.includes('shop') || text.match(/[가-힣]+류|[가-힣]+품/)) {
          analysis.categoryLinks.push({ text, href });
        }
        
        // Look for product detail links
        if (href.includes('goods') || href.includes('product') || 
            href.includes('item') || href.includes('detail')) {
          analysis.productLinks.push(href);
        }
      }
    });

    // Remove duplicates from product links
    analysis.productLinks = [...new Set(analysis.productLinks)];
    
    // Analyze page structure
    analysis.notes.push(`Total links found: ${$('a').length}`);
    analysis.notes.push(`Images found: ${$('img').length}`);
    analysis.notes.push(`[class*="price"]: ${$('[class*="price"]').length} elements`);
    analysis.notes.push(`Main content areas: ${$('main, .main, .content, .container').length}`);
    analysis.notes.push(`Item elements: ${$('.item, .product, .goods').length}`);
    analysis.notes.push(`Shop elements: ${$('[class*="shop"]').length}`);

    // Save analysis results
    const outputFile = './scripts/output/gokseongmall-structure-analysis.json';
    fs.writeFileSync(outputFile, JSON.stringify(analysis, null, 2));

    console.log('\n=== STRUCTURE ANALYSIS ===');
    console.log(`Platform: ${analysis.platform}`);
    console.log(`Detected patterns: ${analysis.detectedPatterns.length}`);
    console.log(`Product selectors found: ${analysis.productSelectors.length}`);
    console.log(`Category links found: ${analysis.categoryLinks.length}`);
    console.log(`Product links found: ${analysis.productLinks.length}`);
    console.log(`\nResults saved to: ${outputFile}`);
    console.log(`Homepage saved to: ./scripts/output/gokseongmall-homepage.html`);

    return analysis;

  } catch (error) {
    console.error('Error analyzing 곡성몰 structure:', error);
    throw error;
  }
}

if (require.main === module) {
  analyzeGokseongmallStructure().catch(console.error);
}

export { analyzeGokseongmallStructure };