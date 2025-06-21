import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

async function debugOsansemallCategory() {
  try {
    console.log('🔍 Debugging osansemall category page...');
    
    const categoryUrl = 'http://www.osansemall.com/goods/catalog?code=0006'; // 먹거리
    
    const response = await axios.get(categoryUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
      },
      timeout: 30000,
    });
    
    const html = response.data;
    const $ = cheerio.load(html);
    
    // Save the category page
    fs.writeFileSync(
      path.join(__dirname, 'output', 'osansemall-category-debug.html'),
      html
    );
    
    console.log('📄 Category page saved for debugging');
    console.log('🔍 Analyzing page structure...');
    
    // Check for different types of content
    const analysis = {
      totalLinks: $('a').length,
      goodsLinks: $('a[href*="goods"]').length,
      productLinks: $('a[href*="product"]').length,
      detailLinks: $('a[href*="detail"]').length,
      viewLinks: $('a[href*="view"]').length,
      listItems: $('li').length,
      tableRows: $('tr').length,
      divs: $('div').length,
      hasTable: $('table').length > 0,
      hasList: $('ul, ol').length > 0,
      hasGrid: $('.grid, .row, .col').length > 0
    };
    
    console.log('📊 Page analysis:', analysis);
    
    // Look for any links that might be products
    const potentialProductLinks: string[] = [];
    $('a').each((_, elem) => {
      const href = $(elem).attr('href');
      const text = $(elem).text().trim();
      
      if (href && href.includes('goods') && !href.includes('catalog') && text) {
        potentialProductLinks.push(`${text}: ${href}`);
      }
    });
    
    console.log('\n🔗 Potential product links:');
    potentialProductLinks.slice(0, 10).forEach(link => console.log(`  ${link}`));
    
    // Look for images that might be product images
    const images: string[] = [];
    $('img').each((_, elem) => {
      const src = $(elem).attr('src');
      const alt = $(elem).attr('alt');
      
      if (src && alt) {
        images.push(`${alt}: ${src}`);
      }
    });
    
    console.log('\n🖼️ Images found:');
    images.slice(0, 10).forEach(img => console.log(`  ${img}`));
    
    // Check for form or AJAX content
    const forms = $('form');
    console.log(`\n📝 Forms found: ${forms.length}`);
    
    forms.each((_, elem) => {
      const action = $(elem).attr('action');
      const method = $(elem).attr('method');
      console.log(`  Form: ${method || 'GET'} ${action || 'no action'}`);
    });
    
    // Look for scripts that might load content dynamically
    const scripts = $('script');
    console.log(`\n📜 Scripts found: ${scripts.length}`);
    
    let hasAjax = false;
    scripts.each((_, elem) => {
      const scriptContent = $(elem).html() || '';
      if (scriptContent.includes('ajax') || scriptContent.includes('fetch') || scriptContent.includes('XMLHttpRequest')) {
        hasAjax = true;
      }
    });
    
    console.log(`🔄 Has AJAX content: ${hasAjax}`);
    
    return {
      analysis,
      potentialProductLinks: potentialProductLinks.slice(0, 10),
      images: images.slice(0, 10),
      hasAjax
    };
    
  } catch (error) {
    console.error('Error debugging category:', error);
    throw error;
  }
}

// Run the debug
debugOsansemallCategory()
  .then(() => console.log('\n✅ Debug complete'))
  .catch(error => console.error('❌ Debug failed:', error));