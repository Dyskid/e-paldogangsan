import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

const JEJU_MALL_BASE_URL = 'https://mall.ejeju.net';
const OUTPUT_DIR = path.join(__dirname, 'output');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function analyzePageStructure() {
  try {
    console.log('Fetching main page to analyze structure...');
    const response = await axios.get(`${JEJU_MALL_BASE_URL}/main/index.do`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    
    console.log('\n=== Page Analysis ===');
    
    // Find all elements that might contain products
    const potentialProductContainers = [
      'div[class*="goods"]',
      'div[class*="product"]',
      'div[class*="item"]',
      'li[class*="goods"]',
      'li[class*="product"]',
      'li[class*="item"]',
      '.goods_list',
      '.product_list',
      '.item_list'
    ];
    
    for (const selector of potentialProductContainers) {
      const elements = $(selector);
      if (elements.length > 0) {
        console.log(`\nFound ${elements.length} elements with selector: ${selector}`);
        
        // Analyze first element structure
        const firstElement = elements.first();
        console.log('First element HTML preview:');
        console.log(firstElement.html()?.substring(0, 500) + '...');
        
        // Look for child elements
        console.log('\nChild elements:');
        firstElement.children().each((i, child) => {
          const $child = $(child);
          console.log(`  - ${child.tagName}: ${$child.attr('class') || 'no class'}`);
        });
        
        // Look for links
        const links = firstElement.find('a');
        console.log(`\nFound ${links.length} links`);
        links.each((i, link) => {
          if (i < 3) { // Show first 3 links
            console.log(`  - ${$(link).attr('href')}`);
          }
        });
        
        // Look for images
        const images = firstElement.find('img');
        console.log(`\nFound ${images.length} images`);
        images.each((i, img) => {
          if (i < 3) { // Show first 3 images
            console.log(`  - src: ${$(img).attr('src')}`);
            console.log(`    alt: ${$(img).attr('alt')}`);
          }
        });
        
        // Look for text content
        console.log('\nText content in element:');
        const texts = firstElement.find('*').map((i, el) => $(el).text().trim()).get();
        const uniqueTexts = [...new Set(texts)].filter(t => t.length > 0 && t.length < 100);
        uniqueTexts.slice(0, 5).forEach(text => {
          console.log(`  - "${text}"`);
        });
      }
    }
    
    // Check for AJAX endpoints in scripts
    console.log('\n=== Script Analysis ===');
    $('script').each((i, script) => {
      const scriptContent = $(script).html();
      if (scriptContent && (scriptContent.includes('ajax') || scriptContent.includes('product') || scriptContent.includes('goods'))) {
        console.log(`\nScript ${i} contains potential AJAX calls:`);
        // Extract URLs from script
        const urlMatches = scriptContent.match(/["'](\/[^"']*(?:product|goods|list)[^"']*?)["']/gi);
        if (urlMatches) {
          urlMatches.slice(0, 5).forEach(match => {
            console.log(`  - ${match}`);
          });
        }
      }
    });
    
    // Save the full HTML for manual inspection
    const htmlPath = path.join(OUTPUT_DIR, 'jeju-mall-page.html');
    fs.writeFileSync(htmlPath, response.data);
    console.log(`\nFull HTML saved to: ${htmlPath}`);
    
  } catch (error) {
    console.error('Error analyzing page:', error);
  }
}

analyzePageStructure().catch(console.error);