import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

async function analyzeCheorwonStructure(): Promise<void> {
  try {
    console.log('🔍 Analyzing Cheorwon Mall structure...');
    
    const baseUrl = 'https://cheorwon-mall.com/';
    console.log(`Fetching homepage: ${baseUrl}`);
    
    const response = await axios.get(baseUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);
    
    console.log('✅ Successfully loaded homepage');
    console.log(`Page title: ${$('title').text()}`);
    
    // Look for product links
    const productLinks: string[] = [];
    const potentialSelectors = [
      'a[href*="/goods/"]',
      'a[href*="/product/"]', 
      'a[href*="/item/"]',
      'a[href*="view"]',
      'a[href*="detail"]'
    ];
    
    console.log('\n🔗 Searching for product links...');
    potentialSelectors.forEach(selector => {
      const links = $(selector);
      console.log(`${selector}: ${links.length} links found`);
      
      links.each((_, element) => {
        const href = $(element).attr('href');
        if (href) {
          let fullUrl = href;
          if (href.startsWith('/')) {
            fullUrl = 'https://cheorwon-mall.com' + href;
          }
          if (!productLinks.includes(fullUrl)) {
            productLinks.push(fullUrl);
          }
        }
      });
    });
    
    console.log(`\n📦 Total unique product links found: ${productLinks.length}`);
    
    // Look for navigation/category links
    console.log('\n🗂️ Analyzing navigation structure...');
    const navLinks: string[] = [];
    const navSelectors = [
      'nav a',
      '.menu a',
      '.category a',
      '.navigation a',
      'a[href*="category"]',
      'a[href*="list"]'
    ];
    
    navSelectors.forEach(selector => {
      const links = $(selector);
      console.log(`${selector}: ${links.length} links found`);
      
      links.each((_, element) => {
        const href = $(element).attr('href');
        const text = $(element).text().trim();
        if (href && text) {
          let fullUrl = href;
          if (href.startsWith('/')) {
            fullUrl = 'https://cheorwon-mall.com' + href;
          }
          navLinks.push(`${text}: ${fullUrl}`);
        }
      });
    });
    
    // Sample all links to understand structure
    console.log('\n🔍 Sample links found:');
    $('a').slice(0, 20).each((index, element) => {
      const href = $(element).attr('href');
      const text = $(element).text().trim();
      if (href && text) {
        console.log(`  ${index + 1}. "${text}" -> ${href}`);
      }
    });
    
    // Look for specific elements that might contain products
    console.log('\n🛍️ Looking for product containers...');
    const productContainers = [
      '.product',
      '.item',
      '.goods',
      '[class*="product"]',
      '[class*="item"]',
      '[class*="goods"]'
    ];
    
    productContainers.forEach(selector => {
      const elements = $(selector);
      if (elements.length > 0) {
        console.log(`${selector}: ${elements.length} elements found`);
        
        // Sample first few elements
        elements.slice(0, 3).each((index, element) => {
          const $el = $(element);
          const text = $el.text().trim().substring(0, 100);
          const links = $el.find('a').length;
          console.log(`  Element ${index + 1}: ${links} links, text: "${text}..."`);
        });
      }
    });
    
    // Check for pagination or category pages
    console.log('\n📄 Looking for pagination or categories...');
    const paginationSelectors = [
      '.page',
      '.pagination',
      '[class*="page"]',
      'a[href*="page"]'
    ];
    
    paginationSelectors.forEach(selector => {
      const elements = $(selector);
      if (elements.length > 0) {
        console.log(`${selector}: ${elements.length} elements found`);
      }
    });
    
    // Save analysis results
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const analysis = {
      url: baseUrl,
      timestamp: new Date().toISOString(),
      pageTitle: $('title').text(),
      productLinksFound: productLinks.length,
      sampleProductLinks: productLinks.slice(0, 10),
      navigationLinks: navLinks.slice(0, 10),
      recommendations: {
        primaryStrategy: productLinks.length > 0 ? 'direct_product_links' : 'category_exploration',
        productLinkPatterns: productLinks.length > 0 ? 'Found product links' : 'No clear product links found',
        nextSteps: productLinks.length > 0 
          ? 'Proceed with scraping individual product pages'
          : 'Explore category pages or search for alternative product listing methods'
      }
    };
    
    const analysisFile = path.join(outputDir, 'cheorwon-analysis.json');
    fs.writeFileSync(analysisFile, JSON.stringify(analysis, null, 2), 'utf8');
    
    // Save homepage HTML for manual inspection
    const homepageFile = path.join(outputDir, 'cheorwon-homepage.html');
    fs.writeFileSync(homepageFile, response.data, 'utf8');
    
    console.log('\n📊 Analysis Summary:');
    console.log(`• Product links found: ${productLinks.length}`);
    console.log(`• Navigation elements analyzed`);
    console.log(`• Analysis saved to: ${analysisFile}`);
    console.log(`• Homepage HTML saved to: ${homepageFile}`);
    
    if (productLinks.length > 0) {
      console.log('\n✅ Recommendation: Proceed with direct product link scraping');
      console.log('Sample product URLs:');
      productLinks.slice(0, 5).forEach((url, index) => {
        console.log(`  ${index + 1}. ${url}`);
      });
    } else {
      console.log('\n⚠️  No clear product links found. Manual inspection of homepage needed.');
      console.log('Check the saved HTML file for category pages or product listing methods.');
    }
    
  } catch (error) {
    console.error('❌ Error analyzing Cheorwon Mall structure:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    throw error;
  }
}

if (require.main === module) {
  analyzeCheorwonStructure()
    .then(() => {
      console.log('✅ Analysis completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Analysis failed:', error);
      process.exit(1);
    });
}

export { analyzeCheorwonStructure };