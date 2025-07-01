import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

async function analyzeGimhaeMallStructure() {
  console.log('🔍 Analyzing gimhaemall.kr website structure...\n');
  
  try {
    const response = await axios.get('https://gimhaemall.kr', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      timeout: 30000
    });

    const $ = cheerio.load(response.data);
    
    console.log(`📄 Website title: "${$('title').text().trim()}"`);
    console.log(`📄 Status code: ${response.status}`);
    console.log(`📄 Content-Type: ${response.headers['content-type']}`);
    console.log(`📄 Final URL: ${response.request.res.responseUrl || 'https://gimhaemall.kr'}`);
    
    // Save the HTML for analysis
    const outputPath = path.join(__dirname, 'output', 'gimhaemall-page.html');
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(outputPath, response.data);
    console.log(`📁 Page HTML saved to: ${outputPath}`);
    
    // Analyze navigation and links
    console.log('\n🔗 Navigation and Links Analysis:');
    const allLinks = $('a[href]');
    console.log(`📊 Total links found: ${allLinks.length}`);
    
    const internalLinks = new Set<string>();
    const externalLinks = new Set<string>();
    
    allLinks.each((i, elem) => {
      const href = $(elem).attr('href');
      const text = $(elem).text().trim();
      
      if (href) {
        if (href.startsWith('http') && !href.includes('gimhaemall.kr')) {
          externalLinks.add(href);
        } else if (href.length > 1) {
          internalLinks.add(`${href} (${text})`);
        }
      }
    });
    
    console.log('\n📋 Internal Links:');
    Array.from(internalLinks).slice(0, 20).forEach(link => {
      console.log(`   ${link}`);
    });
    
    // Look for specific patterns
    console.log('\n🔍 Looking for product-related patterns:');
    
    const productPatterns = [
      'product', 'goods', 'item', 'shop', 'store',
      '상품', '제품', '물건', '쇼핑', '구매'
    ];
    
    productPatterns.forEach(pattern => {
      const matches = $(`a[href*="${pattern}"], a:contains("${pattern}")`);
      if (matches.length > 0) {
        console.log(`   Found ${matches.length} links containing "${pattern}"`);
        matches.slice(0, 3).each((i, elem) => {
          const href = $(elem).attr('href');
          const text = $(elem).text().trim();
          console.log(`     - ${href} (${text})`);
        });
      }
    });
    
    // Check for forms (might be needed for search)
    console.log('\n📝 Forms Analysis:');
    const forms = $('form');
    console.log(`📊 Total forms found: ${forms.length}`);
    
    forms.each((i, form) => {
      const action = $(form).attr('action') || 'no action';
      const method = $(form).attr('method') || 'GET';
      const inputs = $(form).find('input').length;
      console.log(`   Form ${i + 1}: ${method} ${action} (${inputs} inputs)`);
    });
    
    // Check for JavaScript that might load products dynamically
    console.log('\n⚡ JavaScript Analysis:');
    const scripts = $('script');
    console.log(`📊 Total script tags: ${scripts.length}`);
    
    let jsContent = '';
    scripts.each((i, script) => {
      const src = $(script).attr('src');
      const content = $(script).html();
      
      if (src) {
        console.log(`   External script: ${src}`);
      } else if (content && content.length > 100) {
        jsContent += content + '\n';
      }
    });
    
    // Look for API endpoints or AJAX calls
    const apiPatterns = ['api/', 'ajax/', 'json', 'xml', 'load', 'fetch'];
    apiPatterns.forEach(pattern => {
      if (jsContent.toLowerCase().includes(pattern)) {
        console.log(`   JavaScript mentions "${pattern}" - might use dynamic loading`);
      }
    });
    
    // Check for meta tags that might give clues
    console.log('\n🏷️ Meta Tags:');
    $('meta').each((i, meta) => {
      const name = $(meta).attr('name') || $(meta).attr('property');
      const content = $(meta).attr('content');
      if (name && content) {
        console.log(`   ${name}: ${content}`);
      }
    });
    
    console.log('\n✅ Analysis complete! Check the saved HTML file for more details.');
    
  } catch (error) {
    console.error('❌ Error analyzing website:', error instanceof Error ? error.message : 'Unknown error');
  }
}

analyzeGimhaeMallStructure().catch(console.error);