import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

async function analyzeEhongseongStructure() {
  try {
    console.log('Starting analysis of e홍성장터 (ehongseong.com)...');
    
    const baseUrl = 'https://ehongseong.com';
    
    // Analyze homepage structure
    console.log('Fetching homepage...');
    const homeResponse = await axios.get(baseUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3'
      },
      timeout: 30000
    });
    
    const $ = cheerio.load(homeResponse.data);
    
    // Save homepage for analysis
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(outputDir, 'ehongseong-homepage.html'),
      homeResponse.data
    );
    
    console.log('Homepage saved. Analyzing structure...');
    
    // Look for navigation menu and category links
    const navLinks: { href: string, text: string }[] = [];
    
    // Check common navigation selectors
    const navSelectors = [
      'nav a',
      '.nav a',
      '.menu a',
      '.gnb a',
      '.category a',
      '.main-menu a',
      'header a',
      '.header a',
      '.navigation a',
      '.lnb a'
    ];
    
    for (const selector of navSelectors) {
      $(selector).each((_, element) => {
        const href = $(element).attr('href');
        const text = $(element).text().trim();
        
        if (href && text && text.length > 0) {
          const fullUrl = href.startsWith('http') ? href : baseUrl + href;
          navLinks.push({ href: fullUrl, text });
        }
      });
    }
    
    // Look for product links
    const productLinks: { href: string, text: string }[] = [];
    const productSelectors = [
      'a[href*="product"]',
      'a[href*="goods"]',
      'a[href*="item"]',
      'a[href*="shop"]',
      '.product a',
      '.goods a',
      '.item a',
      'a[href*="view"]',
      'a[href*="detail"]'
    ];
    
    for (const selector of productSelectors) {
      $(selector).each((_, element) => {
        const href = $(element).attr('href');
        const text = $(element).text().trim();
        
        if (href && text && text.length > 0) {
          const fullUrl = href.startsWith('http') ? href : baseUrl + href;
          productLinks.push({ href: fullUrl, text });
        }
      });
    }
    
    // Look for pagination or listing patterns
    const listingLinks: { href: string, text: string }[] = [];
    const listingSelectors = [
      'a[href*="list"]',
      'a[href*="category"]',
      'a[href*="page"]',
      '.pagination a',
      '.paging a'
    ];
    
    for (const selector of listingSelectors) {
      $(selector).each((_, element) => {
        const href = $(element).attr('href');
        const text = $(element).text().trim();
        
        if (href && text && text.length > 0) {
          const fullUrl = href.startsWith('http') ? href : baseUrl + href;
          listingLinks.push({ href: fullUrl, text });
        }
      });
    }
    
    // Test common shop URLs
    const testUrls = [
      baseUrl + '/shop',
      baseUrl + '/product',
      baseUrl + '/goods',
      baseUrl + '/category',
      baseUrl + '/shop/list',
      baseUrl + '/product/list',
      baseUrl + '/mall',
      baseUrl + '/store',
      baseUrl + '/products',
      baseUrl + '/items',
      baseUrl + '/bbs/board.php?bo_table=item',
      baseUrl + '/item',
      baseUrl + '/board'
    ];
    
    const validUrls: string[] = [];
    
    for (const url of testUrls) {
      try {
        console.log(`Testing URL: ${url}`);
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          timeout: 10000
        });
        
        if (response.status === 200 && response.data.length > 500) {
          validUrls.push(url);
          console.log(`✓ Valid URL found: ${url}`);
          
          // Save sample page
          fs.writeFileSync(
            path.join(outputDir, `ehongseong-${url.split('/').pop() || 'page'}.html`),
            response.data
          );
        }
      } catch (error) {
        console.log(`✗ URL not accessible: ${url}`);
      }
      
      // Small delay to be respectful
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Check site technology
    const html = homeResponse.data;
    const hasJavaScript = html.includes('<script');
    const hasAjax = html.includes('ajax') || html.includes('XMLHttpRequest');
    const hasReact = html.includes('react') || html.includes('React');
    const hasVue = html.includes('vue') || html.includes('Vue');
    
    // Generate analysis report
    const analysis = {
      timestamp: new Date().toISOString(),
      baseUrl,
      structure: {
        title: $('title').text(),
        navigationLinks: navLinks.slice(0, 20),
        productLinks: productLinks.slice(0, 20),
        listingLinks: listingLinks.slice(0, 20),
        validShopUrls: validUrls,
        totalLinks: $('a').length
      },
      technicalInfo: {
        hasJavaScript,
        hasAjax,
        framework: hasReact ? 'React' : hasVue ? 'Vue' : 'Traditional',
        charset: homeResponse.headers['content-type']?.includes('charset') ? 
                homeResponse.headers['content-type'] : 'Unknown'
      },
      recommendations: []
    };
    
    // Add recommendations based on findings
    if (validUrls.length > 0) {
      analysis.recommendations.push(`Found ${validUrls.length} valid shop URLs to explore for products`);
    }
    
    if (productLinks.length > 0) {
      analysis.recommendations.push(`Found ${productLinks.length} potential product links on homepage`);
    }
    
    if (navLinks.length > 0) {
      analysis.recommendations.push(`Found ${navLinks.length} navigation links to explore`);
    }
    
    // Save analysis
    const analysisPath = path.join(outputDir, 'ehongseong-analysis.json');
    fs.writeFileSync(analysisPath, JSON.stringify(analysis, null, 2));
    
    console.log('\n=== e홍성장터 STRUCTURE ANALYSIS ===');
    console.log(`Homepage title: ${analysis.structure.title}`);
    console.log(`Total links: ${analysis.structure.totalLinks}`);
    console.log(`Navigation links found: ${analysis.structure.navigationLinks.length}`);
    console.log(`Product links found: ${analysis.structure.productLinks.length}`);
    console.log(`Valid shop URLs: ${analysis.structure.validShopUrls.length}`);
    
    if (analysis.structure.validShopUrls.length > 0) {
      console.log('\nValid shop URLs:');
      analysis.structure.validShopUrls.forEach(url => {
        console.log(`  - ${url}`);
      });
    }
    
    if (analysis.structure.navigationLinks.length > 0) {
      console.log('\nSample navigation links:');
      analysis.structure.navigationLinks.slice(0, 5).forEach(link => {
        console.log(`  - ${link.text}: ${link.href}`);
      });
    }
    
    if (analysis.structure.productLinks.length > 0) {
      console.log('\nSample product links:');
      analysis.structure.productLinks.slice(0, 5).forEach(link => {
        console.log(`  - ${link.text}: ${link.href}`);
      });
    }
    
    console.log(`\nAnalysis saved to: ${analysisPath}`);
    console.log('e홍성장터 structure analysis completed!');
    
  } catch (error) {
    console.error('Error analyzing e홍성장터 structure:', error);
    process.exit(1);
  }
}

analyzeEhongseongStructure();