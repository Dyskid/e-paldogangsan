import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

interface CategoryInfo {
  name: string;
  url: string;
  type?: string;
}

async function analyzeSjlocalStructure() {
  try {
    console.log('📋 Fetching sjlocal.or.kr homepage...');
    
    const response = await axios.get('https://www.sjlocal.or.kr/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
      },
      timeout: 30000,
      maxRedirects: 5,
    });
    
    const html = response.data;
    const $ = cheerio.load(html);
    
    // Save homepage for debugging
    fs.writeFileSync(
      path.join(__dirname, 'output', 'sjlocal-homepage.html'),
      html
    );
    
    console.log('🔍 Analyzing page structure...');
    
    // Extract all links
    const links: CategoryInfo[] = [];
    
    // Check for navigation menus
    $('nav a, .nav a, .menu a, .gnb a, .lnb a, .category a').each((_, elem) => {
      const href = $(elem).attr('href');
      const text = $(elem).text().trim();
      
      if (href && text && !href.startsWith('#') && !href.includes('javascript:')) {
        const fullUrl = href.startsWith('http') ? href : `https://www.sjlocal.or.kr${href.startsWith('/') ? '' : '/'}${href}`;
        links.push({ name: text, url: fullUrl });
      }
    });
    
    // Check for product-related links
    $('a[href*="product"], a[href*="goods"], a[href*="item"], a[href*="shop"]').each((_, elem) => {
      const href = $(elem).attr('href');
      const text = $(elem).text().trim();
      
      if (href && text && !href.startsWith('#') && !href.includes('javascript:')) {
        const fullUrl = href.startsWith('http') ? href : `https://www.sjlocal.or.kr${href.startsWith('/') ? '' : '/'}${href}`;
        links.push({ name: text, url: fullUrl, type: 'product-related' });
      }
    });
    
    // Look for iframe or embedded shopping sections
    const iframes = $('iframe');
    console.log(`Found ${iframes.length} iframes`);
    
    iframes.each((_, elem) => {
      const src = $(elem).attr('src');
      if (src) {
        console.log(`Iframe src: ${src}`);
      }
    });
    
    // Look for shopping mall indicators
    const indicators = {
      hasProductGrid: $('.product-grid, .goods-list, .item-list').length > 0,
      hasShoppingCart: $('[class*="cart"], [id*="cart"]').length > 0,
      hasCategories: $('.category, .cate').length > 0,
      hasSearch: $('input[name*="search"], input[name*="keyword"]').length > 0,
    };
    
    console.log('🛍️ Shopping mall indicators:', indicators);
    
    // Remove duplicate links
    const uniqueLinks = Array.from(
      new Map(links.map(link => [link.url, link])).values()
    );
    
    // Save analysis results
    const analysis = {
      mallName: '세종로컬푸드',
      baseUrl: 'https://www.sjlocal.or.kr',
      links: uniqueLinks,
      indicators,
      pageTitle: $('title').text(),
      metaDescription: $('meta[name="description"]').attr('content'),
      hasIframes: iframes.length > 0,
      iframeSources: iframes.map((_, elem) => $(elem).attr('src')).get().filter(Boolean),
    };
    
    fs.writeFileSync(
      path.join(__dirname, 'output', 'sjlocal-simple-analysis.json'),
      JSON.stringify(analysis, null, 2)
    );
    
    console.log('\n📊 Analysis Summary:');
    console.log(`Page Title: ${analysis.pageTitle}`);
    console.log(`Total unique links found: ${uniqueLinks.length}`);
    console.log(`Product-related links: ${uniqueLinks.filter(l => l.type === 'product-related').length}`);
    console.log(`Has iframes: ${analysis.hasIframes}`);
    
    if (analysis.iframeSources.length > 0) {
      console.log('\n🔗 Iframe sources:');
      analysis.iframeSources.forEach(src => console.log(`  - ${src}`));
    }
    
    return analysis;
    
  } catch (error) {
    console.error('Error analyzing mall:', error);
    throw error;
  }
}

// Run the analysis
analyzeSjlocalStructure()
  .then(() => console.log('\n✅ Initial analysis complete'))
  .catch(error => console.error('❌ Analysis failed:', error));