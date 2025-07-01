import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

async function analyzeYcjangStructure() {
  const baseUrl = 'https://ycjang.cyso.co.kr';
  console.log('Analyzing 예천장터 structure...');
  
  try {
    // Test the main page
    const response = await axios.get(baseUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    
    // Save homepage for analysis
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(path.join(outputDir, 'ycjang-homepage.html'), response.data);
    
    // Look for product links
    const productLinks: string[] = [];
    $('a[href*="shop/item.php?it_id="]').each((i, elem) => {
      const href = $(elem).attr('href');
      if (href) {
        productLinks.push(href);
      }
    });
    
    // Look for categories
    const categories: string[] = [];
    $('a[href*="shop/list.php"], a[href*="category"], .category').each((i, elem) => {
      const text = $(elem).text().trim();
      if (text && text.length < 50) {
        categories.push(text);
      }
    });
    
    // Test a sample product page
    let sampleProductUrl = '';
    if (productLinks.length > 0) {
      sampleProductUrl = productLinks[0].startsWith('http') ? 
        productLinks[0] : 
        baseUrl + '/' + productLinks[0].replace(/^\//, '');
      
      console.log(`Testing product page: ${sampleProductUrl}`);
    }
    
    const analysis = {
      mallName: '예천장터',
      baseUrl,
      platform: 'CYSO (Same as 사이소/상주몰/청도몰/영주장날/청송몰/영양온심마켓/울릉도몰/봉화장터)',
      productUrlPattern: 'shop/item.php?it_id=',
      categoriesFound: Array.from(new Set(categories)).slice(0, 15),
      productsOnHomepage: productLinks.length,
      sampleProductUrl,
      hasSearch: $('input[name*="search"], input[type="search"]').length > 0,
      notes: [
        'CYSO platform - consistent with other CYSO malls',
        'Uses shop/item.php?it_id= URL pattern',
        'Should support JavaScript price extraction method',
        'Specializes in Yecheon regional products (herbs, mountain vegetables, agricultural products)'
      ]
    };
    
    console.log('\n=== 예천장터 Structure Analysis ===');
    console.log(`Platform: ${analysis.platform}`);
    console.log(`Categories found: ${analysis.categoriesFound.length}`);
    console.log(`Products on homepage: ${analysis.productsOnHomepage}`);
    console.log(`Product URL pattern: ${analysis.productUrlPattern}`);
    console.log(`Has search: ${analysis.hasSearch}`);
    
    if (analysis.categoriesFound.length > 0) {
      console.log('\nSample categories: [');
      analysis.categoriesFound.slice(0, 10).forEach(cat => console.log(`  '${cat}',`));
      console.log(']');
    }
    
    const analysisPath = path.join(outputDir, 'ycjang-analysis.json');
    fs.writeFileSync(analysisPath, JSON.stringify(analysis, null, 2));
    console.log(`\nAnalysis saved to: ${analysisPath}`);
    
    return analysis;
    
  } catch (error) {
    console.error('Error analyzing 예천장터:', error);
    throw error;
  }
}

if (require.main === module) {
  analyzeYcjangStructure().catch(console.error);
}

export { analyzeYcjangStructure };