/**
 * Comprehensive Yangyang Mall Analysis
 * URL: https://yangyang-mall.com/
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs/promises';
import * as path from 'path';

interface Product {
  name: string;
  price: string;
  image: string;
  link: string;
}

interface AnalysisResult {
  url: string;
  title: string;
  categories: Array<{
    name: string;
    url: string;
    productCount?: number;
  }>;
  sampleProducts: Product[];
  productSelectors: {
    container?: string;
    name?: string;
    price?: string;
    image?: string;
    link?: string;
  };
  notes: string[];
  status: string;
}

async function analyzeYangyangMallComprehensive(): Promise<void> {
  console.log('🔍 Starting comprehensive Yangyang Mall analysis...');
  
  const analysis: AnalysisResult = {
    url: 'https://yangyang-mall.com/',
    title: '',
    categories: [],
    sampleProducts: [],
    productSelectors: {},
    notes: [],
    status: 'analyzing'
  };

  try {
    const outputDir = path.join(__dirname, 'output');
    await fs.mkdir(outputDir, { recursive: true });

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
    };

    // 1. Analyze homepage
    console.log('📱 Fetching homepage...');
    const homeResponse = await axios.get('https://yangyang-mall.com/', { headers, timeout: 30000 });
    await fs.writeFile(path.join(outputDir, 'yangyang-homepage.html'), homeResponse.data);
    
    const $ = cheerio.load(homeResponse.data);
    analysis.title = $('title').text().trim();
    console.log(`📋 Page title: ${analysis.title}`);

    // 2. Look for product listing pages or categories
    console.log('🔍 Looking for product categories...');
    
    // Try common category URLs
    const commonPaths = [
      '/goods/catalog',
      '/product/list',
      '/category',
      '/shop',
      '/goods/list',
      '/product',
      '/goods'
    ];

    let foundProductPage = false;
    
    for (const path of commonPaths) {
      try {
        console.log(`🔗 Trying: https://yangyang-mall.com${path}`);
        const response = await axios.get(`https://yangyang-mall.com${path}`, { 
          headers, 
          timeout: 20000,
          validateStatus: (status) => status < 400 // Accept redirects
        });
        
        if (response.status === 200) {
          await fs.writeFile(path.join(outputDir, `yangyang-${path.replace(/\//g, '-')}.html`), response.data);
          
          const page$ = cheerio.load(response.data);
          
          // Look for product listings
          const productSelectors = [
            '.goods-list .goods-item',
            '.product-list .product-item',
            '.item-list .item',
            '.goods-item',
            '.product-item',
            '.list-item',
            '.goods',
            '.product',
            'li[class*="goods"]',
            'li[class*="product"]',
            'div[class*="goods"]',
            'div[class*="product"]'
          ];

          for (const selector of productSelectors) {
            const products = page$(selector);
            if (products.length > 2) { // At least 3 products to consider it a listing
              analysis.productSelectors.container = selector;
              analysis.notes.push(`Found product listing at ${path} with selector: ${selector} (${products.length} items)`);
              
              // Analyze first product for selectors
              const firstProduct = products.first();
              
              // Name selectors
              const nameSelectors = ['.name', '.title', '.goods-name', '.product-name', 'h3', 'h4', 'strong', '.subject'];
              for (const nameSelector of nameSelectors) {
                const nameEl = firstProduct.find(nameSelector);
                if (nameEl.length > 0 && nameEl.text().trim()) {
                  analysis.productSelectors.name = nameSelector;
                  break;
                }
              }

              // Price selectors
              const priceSelectors = ['.price', '.cost', '.amount', '.money', '.won', '[class*="price"]', '.sale-price'];
              for (const priceSelector of priceSelectors) {
                const priceEl = firstProduct.find(priceSelector);
                if (priceEl.length > 0 && priceEl.text().trim()) {
                  analysis.productSelectors.price = priceSelector;
                  break;
                }
              }

              // Image selectors
              const imgEl = firstProduct.find('img');
              if (imgEl.length > 0) {
                analysis.productSelectors.image = 'img';
              }

              // Link selectors
              const linkEl = firstProduct.find('a');
              if (linkEl.length > 0) {
                analysis.productSelectors.link = 'a';
              }

              // Extract sample products
              products.slice(0, 5).each((index, element) => {
                const $product = page$(element);
                const name = $product.find(analysis.productSelectors.name || '.name, .title, h3, h4').text().trim();
                const price = $product.find(analysis.productSelectors.price || '.price, .cost').text().trim();
                const imgSrc = $product.find('img').attr('src') || '';
                const link = $product.find('a').attr('href') || '';
                
                if (name) {
                  analysis.sampleProducts.push({
                    name,
                    price,
                    image: imgSrc.startsWith('http') ? imgSrc : `https://yangyang-mall.com${imgSrc}`,
                    link: link.startsWith('http') ? link : `https://yangyang-mall.com${link}`
                  });
                }
              });

              foundProductPage = true;
              analysis.categories.push({
                name: `Product Listing`,
                url: `https://yangyang-mall.com${path}`,
                productCount: products.length
              });
              
              break;
            }
          }
          
          if (foundProductPage) break;
        }
      } catch (error) {
        console.log(`❌ Failed to access ${path}: ${error.message}`);
      }
    }

    // 3. If no standard product listing found, try to find individual product URLs
    if (!foundProductPage) {
      console.log('🔍 Looking for individual product pages...');
      
      // Look for product links in homepage
      const productLinks: string[] = [];
      $('a[href*="/goods/"]').each((index, element) => {
        const href = $(element).attr('href');
        if (href && href.includes('/goods/view')) {
          const fullUrl = href.startsWith('http') ? href : `https://yangyang-mall.com${href}`;
          productLinks.push(fullUrl);
        }
      });

      if (productLinks.length > 0) {
        console.log(`📦 Found ${productLinks.length} individual product links`);
        
        // Analyze first product page
        try {
          const productUrl = productLinks[0];
          console.log(`🔍 Analyzing product page: ${productUrl}`);
          
          const productResponse = await axios.get(productUrl, { headers, timeout: 20000 });
          await fs.writeFile(path.join(outputDir, 'yangyang-product-sample.html'), productResponse.data);
          
          const product$ = cheerio.load(productResponse.data);
          
          // Extract product details
          const productName = product$('h1, .goods-name, .product-name, .subject').first().text().trim();
          const productPrice = product$('.price, .cost, .amount, .sale-price').first().text().trim();
          const productImage = product$('.goods-image img, .product-image img, .main-image img').first().attr('src') || '';
          
          if (productName) {
            analysis.sampleProducts.push({
              name: productName,
              price: productPrice,
              image: productImage.startsWith('http') ? productImage : `https://yangyang-mall.com${productImage}`,
              link: productUrl
            });
            
            analysis.notes.push(`Analyzed individual product page: ${productName}`);
            analysis.categories.push({
              name: 'Individual Products',
              url: productUrl,
              productCount: productLinks.length
            });
          }
        } catch (error) {
          analysis.notes.push(`Error analyzing product page: ${error.message}`);
        }
      }
    }

    // 4. Try to find search or all products page
    const searchUrls = [
      '/goods/search',
      '/search',
      '/goods/list?search=',
      '/product/search'
    ];

    for (const searchUrl of searchUrls) {
      try {
        const response = await axios.get(`https://yangyang-mall.com${searchUrl}`, { headers, timeout: 20000 });
        if (response.status === 200) {
          analysis.notes.push(`Found search functionality at: ${searchUrl}`);
          break;
        }
      } catch (error) {
        // Continue to next URL
      }
    }

    analysis.status = 'completed';

    // Save results
    const analysisFile = path.join(outputDir, 'yangyang-comprehensive-analysis.json');
    await fs.writeFile(analysisFile, JSON.stringify(analysis, null, 2));

    console.log('✅ Comprehensive analysis completed!');
    console.log(`📊 Results saved to: ${analysisFile}`);
    console.log(`📂 Found ${analysis.categories.length} categories`);
    console.log(`🛍️ Found ${analysis.sampleProducts.length} sample products`);
    console.log(`🏷️ Product container: ${analysis.productSelectors.container || 'Not found'}`);
    console.log(`💰 Price selector: ${analysis.productSelectors.price || 'Not found'}`);

    // Display sample products
    if (analysis.sampleProducts.length > 0) {
      console.log('\n🛍️ Sample products found:');
      analysis.sampleProducts.forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.name} - ${product.price}`);
      });
    }

  } catch (error) {
    console.error('❌ Error during comprehensive analysis:', error);
    analysis.status = 'error';
    analysis.notes.push(`Error: ${error.message}`);
    
    const analysisFile = path.join(__dirname, 'output', 'yangyang-comprehensive-analysis.json');
    await fs.writeFile(analysisFile, JSON.stringify(analysis, null, 2)).catch(() => {});
  }
}

// Run the analysis
if (require.main === module) {
  analyzeYangyangMallComprehensive().catch(console.error);
}

export { analyzeYangyangMallComprehensive };