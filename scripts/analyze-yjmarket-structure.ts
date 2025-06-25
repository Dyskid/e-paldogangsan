import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

async function analyzeYjmarketStructure() {
  const baseUrl = 'https://yjmarket.cyso.co.kr';
  
  console.log('Analyzing 영주장날 structure...');
  
  try {
    // First, fetch the homepage
    const response = await axios.get(baseUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    
    // Save the homepage for analysis
    const outputDir = path.join(process.cwd(), 'scripts/output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(outputDir, 'yjmarket-homepage.html'),
      response.data
    );
    
    // Analyze the structure
    const analysis: any = {
      baseUrl,
      mallName: '영주장날',
      platform: 'CYSO (Same as 사이소/상주몰/청도몰)',
      timestamp: new Date().toISOString()
    };
    
    // Check for categories
    const categories: string[] = [];
    
    // Look for category links (common CYSO patterns)
    $('a[href*="ca_id="], a[href*="category="], .menu a, .nav a').each((i, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim();
      if (href && text && !categories.includes(text)) {
        categories.push(text);
      }
    });
    
    analysis.categories = categories;
    
    // Look for product links (CYSO pattern)
    const productLinks: string[] = [];
    $('a[href*="shop/item.php?it_id="]').each((i, el) => {
      const href = $(el).attr('href');
      if (href) {
        const fullUrl = href.startsWith('http') ? href : baseUrl + href;
        if (!productLinks.includes(fullUrl)) {
          productLinks.push(fullUrl);
        }
      }
    });
    
    analysis.productUrlPattern = 'shop/item.php?it_id=';
    analysis.sampleProductUrls = productLinks.slice(0, 5);
    analysis.totalProductsOnHomepage = productLinks.length;
    
    // Check for search functionality
    const searchForm = $('form[action*="search"], form[name*="search"]');
    if (searchForm.length > 0) {
      analysis.hasSearch = true;
      analysis.searchAction = searchForm.attr('action');
    }
    
    // Look for pagination or category pages
    const listPages: string[] = [];
    $('a[href*="list.php"], a[href*="search.php"]').each((i, el) => {
      const href = $(el).attr('href');
      if (href) {
        const fullUrl = href.startsWith('http') ? href : baseUrl + href;
        if (!listPages.includes(fullUrl)) {
          listPages.push(fullUrl);
        }
      }
    });
    
    analysis.listPages = listPages.slice(0, 5);
    
    // Try to fetch a product page to understand structure
    if (productLinks.length > 0) {
      try {
        const productUrl = productLinks[0];
        const productResponse = await axios.get(productUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        const $product = cheerio.load(productResponse.data);
        
        // Save sample product page
        fs.writeFileSync(
          path.join(outputDir, 'yjmarket-product-sample.html'),
          productResponse.data
        );
        
        // Analyze product page structure
        analysis.productPageStructure = {
          hasTitle: $product('#sit_title, h1, .it_name, [class*="title"]').length > 0,
          hasPrice: $product(':contains("원")').length > 0,
          hasImage: $product('img[src*="item"], img[src*="product"], img[src*="data"]').length > 0,
          titleSelectors: [],
          priceSelectors: [],
          imageSelectors: []
        };
        
        // Find title
        ['#sit_title', 'h1', '.it_name', '[class*="title"]', 'title'].forEach(selector => {
          const el = $product(selector);
          if (el.length > 0 && el.text().trim()) {
            analysis.productPageStructure.titleSelectors.push({
              selector,
              sample: el.first().text().trim().substring(0, 50)
            });
          }
        });
        
        // Find price patterns
        $product('*').each((i, el) => {
          const text = $product(el).text();
          if (text.match(/\d{1,3}(,\d{3})*\s*원/) && !text.includes('script')) {
            const selector = el.name;
            const classes = $product(el).attr('class');
            if (classes) {
              analysis.productPageStructure.priceSelectors.push({
                selector: `.${classes.split(' ')[0]}`,
                sample: text.trim().substring(0, 50)
              });
            }
          }
        });
        
        // Find images
        $product('img[src*="data"], img[src*="item"], img[src*="product"]').each((i, el) => {
          const src = $product(el).attr('src');
          if (src) {
            analysis.productPageStructure.imageSelectors.push({
              selector: 'img[src*="data"]',
              sample: src.substring(0, 50)
            });
          }
        });
        
      } catch (productError) {
        console.error('Error fetching product page:', productError);
      }
    }
    
    // Save analysis
    fs.writeFileSync(
      path.join(outputDir, 'yjmarket-analysis.json'),
      JSON.stringify(analysis, null, 2)
    );
    
    console.log('\n=== 영주장날 Structure Analysis ===');
    console.log(`Platform: ${analysis.platform}`);
    console.log(`Categories found: ${categories.length}`);
    console.log(`Products on homepage: ${analysis.totalProductsOnHomepage}`);
    console.log(`Product URL pattern: ${analysis.productUrlPattern}`);
    console.log(`Has search: ${analysis.hasSearch}`);
    
    console.log('\nAnalysis saved to:', path.join(outputDir, 'yjmarket-analysis.json'));
    
  } catch (error) {
    console.error('Error analyzing 영주장날:', error);
  }
}

// Run the analysis
analyzeYjmarketStructure().catch(console.error);