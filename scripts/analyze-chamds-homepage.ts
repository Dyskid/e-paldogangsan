import axios, { AxiosRequestConfig } from 'axios';
import * as cheerio from 'cheerio';
import * as https from 'https';
import * as fs from 'fs';

const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

const axiosConfig: AxiosRequestConfig = {
  httpsAgent,
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
};

async function analyzeHomepage(): Promise<void> {
  console.log('🔍 Analyzing Chamds homepage structure...');
  
  try {
    const response = await axios.get('https://chamds.com/', axiosConfig);
    const $ = cheerio.load(response.data);
    
    // Save homepage for analysis
    fs.writeFileSync('/mnt/c/Users/johndoe/Desktop/e-paldogangsan/scripts/output/chamds-homepage.html', response.data);
    console.log('✅ Homepage saved to output/chamds-homepage.html');
    
    // Analyze navigation structure
    console.log('\n📋 Navigation Analysis:');
    
    // Check for any menu structure
    const navElements = $('#header, .header, .gnb, .lnb, .menu, .navigation, nav').length;
    console.log(`Navigation elements found: ${navElements}`);
    
    // Look for all links
    const allLinks: string[] = [];
    $('a[href]').each((_, elem) => {
      const href = $(elem).attr('href');
      const text = $(elem).text().trim();
      
      if (href && href !== '#' && href !== 'javascript:void(0)' && text) {
        const fullUrl = href.startsWith('http') ? href : `https://chamds.com${href}`;
        allLinks.push(`${text} -> ${fullUrl}`);
      }
    });
    
    console.log(`\n🔗 All links found (${allLinks.length}):`);
    allLinks.slice(0, 20).forEach(link => console.log(`   ${link}`));
    if (allLinks.length > 20) {
      console.log(`   ... and ${allLinks.length - 20} more`);
    }
    
    // Look for any product-related content
    console.log('\n🛍️ Product-related content:');
    
    const productKeywords = ['product', '상품', '제품', 'item', '농산물', '과일', '채소'];
    productKeywords.forEach(keyword => {
      const elements = $(`*:contains("${keyword}")`).length;
      if (elements > 0) {
        console.log(`   "${keyword}": ${elements} elements`);
      }
    });
    
    // Check for any forms or search functionality
    console.log('\n🔍 Forms and search:');
    const forms = $('form').length;
    const searchInputs = $('input[type="search"], input[name*="search"], input[placeholder*="search"]').length;
    console.log(`   Forms: ${forms}`);
    console.log(`   Search inputs: ${searchInputs}`);
    
    // Look for any JavaScript that might load products dynamically
    console.log('\n⚡ JavaScript analysis:');
    const scripts = $('script').length;
    let hasAjax = false;
    let hasProductJs = false;
    
    $('script').each((_, elem) => {
      const scriptContent = $(elem).html() || '';
      if (scriptContent.includes('ajax') || scriptContent.includes('fetch')) {
        hasAjax = true;
      }
      if (scriptContent.includes('product') || scriptContent.includes('상품')) {
        hasProductJs = true;
      }
    });
    
    console.log(`   Total scripts: ${scripts}`);
    console.log(`   Has AJAX/fetch: ${hasAjax}`);
    console.log(`   Has product-related JS: ${hasProductJs}`);
    
    // Check page title and meta description
    console.log('\n📄 Page info:');
    const title = $('title').text().trim();
    const description = $('meta[name="description"]').attr('content') || '';
    console.log(`   Title: ${title}`);
    console.log(`   Description: ${description}`);
    
    // Look for any iframe or embedded content
    console.log('\n🖼️ Embedded content:');
    const iframes = $('iframe').length;
    const embeds = $('embed, object').length;
    console.log(`   iFrames: ${iframes}`);
    console.log(`   Embeds: ${embeds}`);
    
    // Check if this might be a temporary page or under construction
    const underConstruction = $('*').text().toLowerCase().includes('준비') || 
                            $('*').text().toLowerCase().includes('공사') ||
                            $('*').text().toLowerCase().includes('오픈') ||
                            $('*').text().toLowerCase().includes('coming');
    
    console.log(`\n⚠️ Under construction: ${underConstruction}`);
    
  } catch (error) {
    console.error('❌ Error analyzing homepage:', error);
  }
}

analyzeHomepage().catch(console.error);