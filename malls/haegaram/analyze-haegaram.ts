import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';

async function analyzeHaegaramStructure() {
  try {
    console.log('Fetching haegaram.com...');
    
    // Fetch homepage
    const response = await axios.get('https://haegaram.com', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      timeout: 30000,
      maxRedirects: 5
    });
    
    const html = response.data;
    await fs.writeFile('scripts/output/haegaram-homepage.html', html);
    
    const $ = cheerio.load(html);
    
    // Analysis object
    const analysis: any = {
      url: 'https://haegaram.com',
      timestamp: new Date().toISOString(),
      navigation: [],
      categoryLinks: [],
      productPatterns: [],
      platformInfo: {}
    };
    
    // Try to detect the platform
    if (html.includes('cafe24') || html.includes('Cafe24')) {
      analysis.platformInfo.platform = 'Cafe24';
    } else if (html.includes('makeshop') || html.includes('Makeshop')) {
      analysis.platformInfo.platform = 'Makeshop';
    } else if (html.includes('godo') || html.includes('Godomall')) {
      analysis.platformInfo.platform = 'Godomall';
    }
    
    // Extract navigation links
    const navSelectors = [
      'nav a',
      '.nav a',
      '.menu a',
      '.category a',
      '.gnb a',
      '.lnb a',
      '#header a',
      '.header a',
      '.menuCategory a',
      '.xans-layout-category a'
    ];
    
    const links = new Set<{href: string, text: string}>();
    
    navSelectors.forEach(selector => {
      $(selector).each((_, elem) => {
        const $elem = $(elem);
        const href = $elem.attr('href');
        const text = $elem.text().trim();
        
        if (href && text && !href.includes('javascript:') && !href.startsWith('#')) {
          const fullUrl = href.startsWith('http') ? href : `https://haegaram.com${href.startsWith('/') ? '' : '/'}${href}`;
          links.add({ href: fullUrl, text });
        }
      });
    });
    
    analysis.navigation = Array.from(links);
    
    // Look for category patterns
    const categoryPatterns = [
      '/shop/',
      '/product/',
      '/goods/',
      '/category/',
      '/list/',
      'category_no=',
      'cate_no=',
      'cid=',
      'cate_code='
    ];
    
    analysis.categoryLinks = analysis.navigation.filter((link: any) => 
      categoryPatterns.some(pattern => link.href.includes(pattern))
    );
    
    // Look for specific Cafe24 patterns
    const cafe24CategoryLinks = $('a[href*="/product/list.html"]').map((_, elem) => {
      const $elem = $(elem);
      return {
        href: $elem.attr('href'),
        text: $elem.text().trim()
      };
    }).get();
    
    if (cafe24CategoryLinks.length > 0) {
      analysis.categoryLinks = [...analysis.categoryLinks, ...cafe24CategoryLinks];
    }
    
    // Save analysis
    await fs.writeFile(
      'scripts/output/haegaram-structure-analysis.json',
      JSON.stringify(analysis, null, 2)
    );
    
    console.log('Initial analysis complete!');
    console.log(`Found ${analysis.navigation.length} navigation links`);
    console.log(`Found ${analysis.categoryLinks.length} category links`);
    
    // If we found category links, analyze the first one
    if (analysis.categoryLinks.length > 0) {
      const firstCategory = analysis.categoryLinks[0];
      console.log(`\nAnalyzing category: ${firstCategory.text} - ${firstCategory.href}`);
      
      try {
        const categoryResponse = await axios.get(firstCategory.href, {
          headers: response.config.headers,
          timeout: 30000
        });
        
        const categoryHtml = categoryResponse.data;
        await fs.writeFile('scripts/output/haegaram-category-sample.html', categoryHtml);
        
        const $cat = cheerio.load(categoryHtml);
        
        // Look for product links
        const productSelectors = [
          '.xans-product-normalpackage a',
          '.prdList a',
          '.product-item a',
          '.item a',
          '.goods a',
          '.product a',
          'a[href*="/shop/shopdetail.html"]',
          'a[href*="/product/detail.html"]',
          'a[href*="/product/"]',
          'a[href*="/goods/"]',
          'a[href*="product_no="]',
          'a[href*="pid="]',
          '.thumbnail a',
          '.prdImg a'
        ];
        
        const productLinks = new Set<{href: string, title?: string}>();
        
        productSelectors.forEach(selector => {
          $cat(selector).each((_, elem) => {
            const $elem = $cat(elem);
            const href = $elem.attr('href');
            const img = $elem.find('img');
            const title = $elem.find('.name, .title, .product-name').text().trim() ||
                         $elem.attr('title') ||
                         img.attr('alt') ||
                         '';
            
            if (href && !href.includes('javascript:')) {
              const fullUrl = href.startsWith('http') ? href : `https://haegaram.com${href.startsWith('/') ? '' : '/'}${href}`;
              productLinks.add({ href: fullUrl, title });
            }
          });
        });
        
        analysis.productPatterns = Array.from(productLinks).slice(0, 10);
        console.log(`Found ${productLinks.size} product links`);
        
        // Analyze product page structure
        if (analysis.productPatterns.length > 0) {
          const firstProduct = analysis.productPatterns[0];
          console.log(`\nAnalyzing product: ${firstProduct.title} - ${firstProduct.href}`);
          
          try {
            const productResponse = await axios.get(firstProduct.href, {
              headers: response.config.headers,
              timeout: 30000
            });
            
            const productHtml = productResponse.data;
            await fs.writeFile('scripts/output/haegaram-product-sample.html', productHtml);
            
            const $prod = cheerio.load(productHtml);
            
            // Analyze product structure
            const productInfo: any = {};
            
            // Price selectors
            const priceSelectors = [
              '#span_product_price_text',
              '.price',
              '.product-price',
              '.item-price',
              '.selling-price',
              '.sale-price',
              '.real-price',
              'span[class*="price"]',
              'div[class*="price"]',
              '.consumer_price',
              '.selling_price',
              '.xans-product-detail .price',
              '.infoArea .price'
            ];
            
            for (const selector of priceSelectors) {
              const elem = $prod(selector).first();
              if (elem.length > 0) {
                productInfo.priceSelector = selector;
                productInfo.priceText = elem.text().trim();
                break;
              }
            }
            
            // Title selectors
            const titleSelectors = [
              '.headingArea h2',
              '.infoArea h2',
              'h1',
              'h2',
              '.product-name',
              '.item-name',
              '.goods-name',
              '.title',
              '.name',
              '[class*="product_name"]',
              '[class*="item_name"]',
              '.xans-product-detail .name'
            ];
            
            for (const selector of titleSelectors) {
              const elem = $prod(selector).first();
              if (elem.length > 0 && elem.text().trim()) {
                productInfo.titleSelector = selector;
                productInfo.titleText = elem.text().trim();
                break;
              }
            }
            
            // Image selectors
            const imageSelectors = [
              '.bigImage img',
              '.keyImg img',
              '.product-image img',
              '.item-image img',
              '.main-image img',
              '.detail-image img',
              '#product-image img',
              'img[class*="product"]',
              'img[class*="item"]',
              '.xans-product-detail img',
              '.imgArea img'
            ];
            
            for (const selector of imageSelectors) {
              const elem = $prod(selector).first();
              if (elem.length > 0 && elem.attr('src')) {
                productInfo.imageSelector = selector;
                productInfo.imageSrc = elem.attr('src');
                break;
              }
            }
            
            analysis.productPageStructure = productInfo;
            
          } catch (productError) {
            console.error('Error fetching product page:', productError);
          }
        }
        
      } catch (categoryError) {
        console.error('Error fetching category page:', categoryError);
      }
    }
    
    // Update analysis file
    await fs.writeFile(
      'scripts/output/haegaram-structure-analysis.json',
      JSON.stringify(analysis, null, 2)
    );
    
    console.log('\nAnalysis Summary:');
    console.log('Platform:', analysis.platformInfo.platform || 'Unknown');
    console.log('Navigation Links:', analysis.navigation.length);
    console.log('Category Links:', analysis.categoryLinks.length);
    console.log('Product Patterns:', analysis.productPatterns.length);
    if (analysis.productPageStructure) {
      console.log('Product Page Structure:');
      console.log('  - Title selector:', analysis.productPageStructure.titleSelector);
      console.log('  - Price selector:', analysis.productPageStructure.priceSelector);
      console.log('  - Image selector:', analysis.productPageStructure.imageSelector);
    }
    
    return analysis;
    
  } catch (error) {
    console.error('Error analyzing structure:', error);
    throw error;
  }
}

// Run the analysis
analyzeHaegaramStructure().catch(console.error);