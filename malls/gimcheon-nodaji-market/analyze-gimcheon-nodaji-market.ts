import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

async function analyzeGcnodajiStructure() {
  const baseUrl = 'http://gcnodaji.com';
  
  console.log('Starting analysis of 김천노다지장터 structure...');
  
  const outputDir = path.join(__dirname, '../../output/gcnodaji');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
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
    fs.writeFileSync(path.join(outputDir, 'gcnodaji-homepage.html'), response.data);
    
    // Analyze the page structure
    const analysis = {
      mallName: '김천노다지장터',
      baseUrl,
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
    } else if (bodyText.includes('imweb')) {
      analysis.platform = 'IMWEB';
      analysis.detectedPatterns.push('IMWEB platform detected');
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
      '[class*="item"]',
      '.card',
      '.list-item',
      '.mall-item',
      '.sale-item'
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
            href.includes('shop') || href.includes('mall') || 
            text.match(/[가-힣]+류|[가-힣]+품/) || 
            text.includes('농산물') || text.includes('특산물') ||
            text.includes('포도') || text.includes('자두')) {
          const fullHref = href.startsWith('http') ? href : baseUrl + '/' + href.replace(/^\//, '');
          analysis.categoryLinks.push({ text, href: fullHref });
        }
        
        // Look for product detail links
        if (href.includes('goods') || href.includes('product') || 
            href.includes('item') || href.includes('detail') ||
            href.includes('view')) {
          const fullHref = href.startsWith('http') ? href : baseUrl + '/' + href.replace(/^\//, '');
          analysis.productLinks.push(fullHref);
        }
      }
    });

    // Remove duplicates
    analysis.productLinks = [...new Set(analysis.productLinks)];
    analysis.categoryLinks = analysis.categoryLinks.filter((item, index, self) => 
      index === self.findIndex(t => t.href === item.href)
    );
    
    // Analyze page structure
    analysis.notes.push(`Total links found: ${$('a').length}`);
    analysis.notes.push(`Images found: ${$('img').length}`);
    analysis.notes.push(`[class*="price"]: ${$('[class*="price"]').length} elements`);
    analysis.notes.push(`Main content areas: ${$('main, .main, .content, .container').length}`);
    analysis.notes.push(`Item elements: ${$('.item, .product, .goods').length}`);
    
    // Add specific notes for 김천노다지장터
    analysis.notes.push('김천시 특산물 전문몰');
    analysis.notes.push('포도, 자두 등 과일 특화');
    analysis.notes.push('지역 농산물 직거래 장터');

    // Save analysis results
    const outputFile = path.join(outputDir, 'gcnodaji-structure-analysis.json');
    fs.writeFileSync(outputFile, JSON.stringify(analysis, null, 2));

    console.log('\n=== STRUCTURE ANALYSIS ===');
    console.log(`Mall: ${analysis.mallName}`);
    console.log(`Platform: ${analysis.platform}`);
    console.log(`Detected patterns: ${analysis.detectedPatterns.length}`);
    console.log(`Product selectors found: ${analysis.productSelectors.length}`);
    console.log(`Category links found: ${analysis.categoryLinks.length}`);
    console.log(`Product links found: ${analysis.productLinks.length}`);
    console.log(`\nResults saved to: ${outputFile}`);

    return analysis;

  } catch (error) {
    console.error('Error analyzing 김천노다지장터 structure:', error);
    throw error;
  }
}

if (require.main === module) {
  analyzeGcnodajiStructure().catch(console.error);
}

export { analyzeGcnodajiStructure };