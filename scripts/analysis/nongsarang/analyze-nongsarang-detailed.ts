import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import iconv from 'iconv-lite';

async function analyzeNongsarangDetailed() {
  try {
    console.log('Starting detailed analysis of 농사랑 (nongsarang.co.kr)...');
    
    const baseUrl = 'https://nongsarang.co.kr';
    
    // Fetch homepage with proper encoding handling
    console.log('Fetching homepage with EUC-KR encoding...');
    const homeResponse = await axios.get(baseUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3'
      },
      timeout: 30000,
      responseType: 'arraybuffer'
    });
    
    // Decode EUC-KR to UTF-8
    const html = iconv.decode(Buffer.from(homeResponse.data), 'euc-kr');
    const $ = cheerio.load(html);
    
    // Save properly encoded homepage
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(outputDir, 'nongsarang-homepage-decoded.html'),
      html
    );
    
    console.log('Analyzing navigation and links...');
    
    // Look for shop/category links with common Korean e-commerce patterns
    const shopLinks: { href: string, text: string }[] = [];
    
    // Common Korean shopping mall selectors
    const shopSelectors = [
      'a[href*="shop"]',
      'a[href*="goods"]',
      'a[href*="item"]',
      'a[href*="product"]',
      'a[href*="list"]',
      'a[href*="category"]',
      'a[href*="cate"]',
      '.gnb a',
      '.menu a',
      'nav a',
      '.category a',
      '.shop a'
    ];
    
    for (const selector of shopSelectors) {
      $(selector).each((_, element) => {
        const href = $(element).attr('href');
        const text = $(element).text().trim();
        
        if (href && text && text.length > 0) {
          const fullUrl = href.startsWith('http') ? href : baseUrl + href;
          shopLinks.push({ href: fullUrl, text });
        }
      });
    }
    
    // Remove duplicates
    const uniqueShopLinks = shopLinks.filter((link, index, self) => 
      index === self.findIndex(l => l.href === link.href)
    );
    
    // Look for specific product patterns in the HTML
    const productPatterns = [
      '/shop/item.html',
      '/shop/goods.html',
      '/shop/list.html',
      '/product/',
      '/goods/',
      'item_uid=',
      'goods_uid=',
      'product_uid='
    ];
    
    const foundPatterns: string[] = [];
    for (const pattern of productPatterns) {
      if (html.includes(pattern)) {
        foundPatterns.push(pattern);
        console.log(`✓ Found pattern: ${pattern}`);
      }
    }
    
    // Test common shop URLs with proper encoding
    const testUrls = [
      baseUrl + '/shop/',
      baseUrl + '/shop/list.html',
      baseUrl + '/shop/goods.html',
      baseUrl + '/shop/item.html',
      baseUrl + '/goods/',
      baseUrl + '/product/',
      baseUrl + '/category/',
      baseUrl + '/mall/'
    ];
    
    const validShopUrls: string[] = [];
    
    for (const url of testUrls) {
      try {
        console.log(`Testing URL: ${url}`);
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
          },
          timeout: 10000,
          responseType: 'arraybuffer'
        });
        
        const testHtml = iconv.decode(Buffer.from(response.data), 'euc-kr');
        
        // Check if response contains product-like content
        if (testHtml.length > 100 && !testHtml.includes('No') && !testHtml.includes('404')) {
          validShopUrls.push(url);
          console.log(`✓ Valid shop URL: ${url}`);
          
          // Save sample page
          fs.writeFileSync(
            path.join(outputDir, `nongsarang-${url.split('/').pop() || 'page'}.html`),
            testHtml
          );
        }
      } catch (error) {
        console.log(`✗ URL not accessible: ${url}`);
      }
      
      // Small delay
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Check if site uses AJAX/JavaScript for product loading
    const hasAjax = html.includes('ajax') || html.includes('XMLHttpRequest') || html.includes('fetch');
    const hasReact = html.includes('react') || html.includes('React');
    const hasVue = html.includes('vue') || html.includes('Vue');
    
    // Look for data attributes or JSON data
    const jsonMatches = html.match(/\{[^{}]*".*"[^{}]*\}/g) || [];
    const dataAttributes = $('*').filter((_, el) => {
      const attrs = Object.keys(el.attribs || {});
      return attrs.some(attr => attr.startsWith('data-'));
    }).length;
    
    // Generate detailed analysis
    const analysis = {
      timestamp: new Date().toISOString(),
      baseUrl,
      encoding: 'EUC-KR',
      structure: {
        title: $('title').text(),
        totalLinks: $('a').length,
        shopLinks: uniqueShopLinks.slice(0, 20),
        validShopUrls,
        foundPatterns,
        hasProducts: foundPatterns.length > 0 || validShopUrls.length > 0
      },
      technical: {
        hasAjax,
        hasReact,
        hasVue,
        jsonDataFound: jsonMatches.length,
        dataAttributes,
        framework: hasReact ? 'React' : hasVue ? 'Vue' : 'Traditional'
      },
      recommendations: []
    };
    
    // Add specific recommendations
    if (foundPatterns.length > 0) {
      analysis.recommendations.push(`Found ${foundPatterns.length} product URL patterns in HTML`);
    }
    
    if (validShopUrls.length > 0) {
      analysis.recommendations.push(`Found ${validShopUrls.length} accessible shop URLs`);
    }
    
    if (uniqueShopLinks.length > 0) {
      analysis.recommendations.push(`Found ${uniqueShopLinks.length} navigation links to explore`);
    }
    
    if (hasAjax) {
      analysis.recommendations.push('Site uses AJAX - may need dynamic scraping approach');
    }
    
    // Save detailed analysis
    const analysisPath = path.join(outputDir, 'nongsarang-detailed-analysis.json');
    fs.writeFileSync(analysisPath, JSON.stringify(analysis, null, 2));
    
    console.log('\n=== 농사랑 DETAILED ANALYSIS ===');
    console.log(`Site encoding: ${analysis.encoding}`);
    console.log(`Total links found: ${analysis.structure.totalLinks}`);
    console.log(`Shop-related links: ${analysis.structure.shopLinks.length}`);
    console.log(`Valid shop URLs: ${analysis.structure.validShopUrls.length}`);
    console.log(`Product patterns found: ${analysis.structure.foundPatterns.length}`);
    console.log(`Has products: ${analysis.structure.hasProducts}`);
    
    if (analysis.structure.foundPatterns.length > 0) {
      console.log('\nProduct URL patterns found:');
      analysis.structure.foundPatterns.forEach(pattern => {
        console.log(`  - ${pattern}`);
      });
    }
    
    if (analysis.structure.validShopUrls.length > 0) {
      console.log('\nValid shop URLs:');
      analysis.structure.validShopUrls.forEach(url => {
        console.log(`  - ${url}`);
      });
    }
    
    if (analysis.structure.shopLinks.length > 0) {
      console.log('\nSample shop links:');
      analysis.structure.shopLinks.slice(0, 5).forEach(link => {
        console.log(`  - ${link.text}: ${link.href}`);
      });
    }
    
    console.log(`\nDetailed analysis saved to: ${analysisPath}`);
    console.log('농사랑 detailed analysis completed!');
    
  } catch (error) {
    console.error('Error in detailed analysis:', error);
    process.exit(1);
  }
}

analyzeNongsarangDetailed();