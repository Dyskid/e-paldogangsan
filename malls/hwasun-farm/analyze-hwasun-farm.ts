import axios from 'axios';
import * as cheerio from 'cheerio';
import { writeFileSync } from 'fs';

async function analyzeHwasunfarmStructure() {
  const baseUrl = 'https://www.hwasunfarm.com';
  
  try {
    console.log('Analyzing 화순팜 structure...');
    
    // Get homepage
    const response = await axios.get(baseUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 30000
    });
    
    const $ = cheerio.load(response.data);
    
    // Save homepage HTML for analysis
    writeFileSync('./hwasunfarm-homepage.html', response.data);
    
    // Look for common e-commerce patterns
    const analysis = {
      platform: 'Unknown',
      detectedPatterns: [] as string[],
      productSelectors: [] as string[],
      categoryLinks: [] as { text: string; href: string }[],
      productLinks: [] as string[],
      notes: [] as string[]
    };
    
    // Check for common platforms
    if ($('.xans-product-listmain').length > 0) {
      analysis.platform = 'Cafe24';
      analysis.detectedPatterns.push('Cafe24 platform detected');
      analysis.productSelectors.push('.xans-product-listmain .xans-record-');
    }
    
    if ($('.item_gallery_type').length > 0) {
      analysis.platform = 'Godo Mall';
      analysis.detectedPatterns.push('Godo Mall platform detected');
      analysis.productSelectors.push('.item_gallery_type .item_cont');
    }
    
    if ($('.prdList').length > 0) {
      analysis.detectedPatterns.push('prdList structure found');
      analysis.productSelectors.push('.prdList .item, .prdList li');
    }
    
    if ($('.goods_list').length > 0) {
      analysis.detectedPatterns.push('goods_list structure found');
      analysis.productSelectors.push('.goods_list .item');
    }
    
    // Look for product containers
    const productContainers = [
      '.product-item', '.prd-item', '.goods-item',
      '.product_list', '.goods_list', '.prd_list',
      '.item-box', '.product-box', '.goods-box',
      '.xans-record-', '.item_cont', '.product-wrap',
      '.goods-wrap', '.item-wrap', '.product_item',
      '.goods', '.item', '.prd_box', '.box_item',
      '.product_area', '.goods_area', '.item_area',
      'li[id^="anchorBoxId"]'
    ];
    
    productContainers.forEach(selector => {
      const count = $(selector).length;
      if (count > 0) {
        analysis.productSelectors.push(`${selector} (${count} items)`);
      }
    });
    
    // Look for category/navigation links
    $('a[href*="category"], a[href*="goods"], a[href*="product"], a[href*="list"], a[href*="shop"]').each((i, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim();
      if (href && text && text.length < 50) {
        analysis.categoryLinks.push({ text, href });
      }
    });
    
    // Look for product links
    $('a[href*="view"], a[href*="detail"], a[href*="goods"], a[href*="product"], a[href*="shop"]').each((i, el) => {
      const href = $(el).attr('href');
      if (href && (href.includes('view') || href.includes('detail') || href.includes('product'))) {
        analysis.productLinks.push(href);
      }
    });
    
    // Check page title and meta
    const title = $('title').text();
    const description = $('meta[name="description"]').attr('content') || '';
    
    analysis.notes.push(`Page title: ${title}`);
    analysis.notes.push(`Description: ${description}`);
    analysis.notes.push(`Total links found: ${$('a').length}`);
    analysis.notes.push(`Images found: ${$('img').length}`);
    
    // Look for common price patterns
    const priceSelectors = ['.price', '.product-price', '.goods-price', '[class*="price"]'];
    priceSelectors.forEach(selector => {
      const count = $(selector).length;
      if (count > 0) {
        analysis.notes.push(`${selector}: ${count} elements`);
      }
    });
    
    // Check for specific Korean mall patterns
    if ($('[class*="main"]').length > 0) {
      analysis.notes.push(`Main content areas: ${$('[class*="main"]').length}`);
    }
    
    if ($('[class*="item"]').length > 0) {
      analysis.notes.push(`Item elements: ${$('[class*="item"]').length}`);
    }
    
    // Check for specific patterns
    if ($('[class*="shop"]').length > 0) {
      analysis.notes.push(`Shop elements: ${$('[class*="shop"]').length}`);
    }
    
    // Look for common Korean mall patterns
    if ($('[class*="상품"]').length > 0) {
      analysis.notes.push(`Korean product elements: ${$('[class*="상품"]').length}`);
    }
    
    console.log('Analysis Results:');
    console.log('Platform:', analysis.platform);
    console.log('Product selectors found:', analysis.productSelectors.length);
    console.log('Category links found:', analysis.categoryLinks.length);
    console.log('Product links found:', analysis.productLinks.length);
    
    // Save analysis
    writeFileSync('./hwasunfarm-structure-analysis.json', JSON.stringify(analysis, null, 2));
    
    return analysis;
    
  } catch (error) {
    console.error('Error analyzing mall structure:', error);
    return null;
  }
}

analyzeHwasunfarmStructure().then(result => {
  if (result) {
    console.log('Analysis completed. Check hwasunfarm-structure-analysis.json for details.');
  }
}).catch(console.error);