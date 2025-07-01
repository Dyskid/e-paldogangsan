import * as fs from 'fs';
import * as path from 'path';
import { JSDOM } from 'jsdom';

interface ProductInfo {
  name: string;
  price: string;
  image?: string;
  link?: string;
}

interface AnalysisResult {
  mallId: number;
  mallName: string;
  url: string;
  platform: string;
  hasProducts: boolean;
  productCount: number;
  sampleProducts: ProductInfo[];
  analysisDate: string;
  error?: string;
}

async function analyzeMall(): Promise<AnalysisResult> {
  const mallId = 50;
  const mallName = 'suncheon-local-food-together-store';
  const url = 'https://suncheon-local-food-together-store.com';
  
  const result: AnalysisResult = {
    mallId,
    mallName,
    url,
    platform: 'unknown',
    hasProducts: false,
    productCount: 0,
    sampleProducts: [],
    analysisDate: new Date().toISOString()
  };

  try {
    // Read the downloaded HTML
    const htmlPath = path.join(__dirname, 'requirements', 'homepage.html');
    const html = fs.readFileSync(htmlPath, 'utf-8');
    
    // Parse HTML with jsdom
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    // Check for platform indicators
    if (html.includes('cafe24') || html.includes('Cafe24')) {
      result.platform = 'Cafe24';
    } else if (html.includes('고도몰') || html.includes('godomall')) {
      result.platform = 'Godomall';
    } else if (html.includes('makeshop') || html.includes('MakeShop')) {
      result.platform = 'MakeShop';
    } else if (html.includes('shopify')) {
      result.platform = 'Shopify';
    } else if (html.includes('woocommerce')) {
      result.platform = 'WooCommerce';
    }
    
    // Try to find products - common patterns
    const products: ProductInfo[] = [];
    
    // Pattern 1: Product list items with common class names
    const productSelectors = [
      '.product-item',
      '.prd-item',
      '.item-list li',
      '.goods-item',
      '.product',
      '.item',
      '[class*="product"]',
      '[class*="item"]'
    ];
    
    for (const selector of productSelectors) {
      const items = document.querySelectorAll(selector);
      if (items.length > 0) {
        items.forEach((item: Element, index: number) => {
          if (index >= 5) return; // Get only first 5 samples
          
          const product: ProductInfo = {
            name: '',
            price: ''
          };
          
          // Try to find product name
          const nameSelectors = ['h3', 'h4', '.product-name', '.prd-name', '.item-name', '.title', '[class*="name"]'];
          for (const nameSelector of nameSelectors) {
            const nameElem = item.querySelector(nameSelector);
            if (nameElem?.textContent) {
              product.name = nameElem.textContent.trim();
              break;
            }
          }
          
          // Try to find price
          const priceSelectors = ['.price', '.product-price', '.prd-price', '.item-price', '[class*="price"]'];
          for (const priceSelector of priceSelectors) {
            const priceElem = item.querySelector(priceSelector);
            if (priceElem?.textContent) {
              product.price = priceElem.textContent.trim();
              break;
            }
          }
          
          // Try to find image
          const imgElem = item.querySelector('img');
          if (imgElem) {
            product.image = imgElem.src || imgElem.getAttribute('data-src') || '';
          }
          
          // Try to find link
          const linkElem = item.querySelector('a');
          if (linkElem) {
            product.link = linkElem.href;
          }
          
          if (product.name || product.price) {
            products.push(product);
          }
        });
        
        if (products.length > 0) break;
      }
    }
    
    // Check for specific suncheon-local-food-together-store patterns
    const suncheon-local-food-together-storeProducts = document.querySelectorAll('.xans-product-listmain li, .xans-product li');
    if (suncheon-local-food-together-storeProducts.length > 0) {
      result.platform = 'Cafe24'; // xans- prefix is typical for Cafe24
      suncheon-local-food-together-storeProducts.forEach((item: Element, index: number) => {
        if (index >= 5) return;
        
        const product: ProductInfo = {
          name: '',
          price: ''
        };
        
        const nameElem = item.querySelector('.name a') || item.querySelector('.description .name');
        if (nameElem?.textContent) {
          product.name = nameElem.textContent.trim();
        }
        
        const priceElem = item.querySelector('.price') || item.querySelector('.prdprice');
        if (priceElem?.textContent) {
          product.price = priceElem.textContent.trim();
        }
        
        const imgElem = item.querySelector('img');
        if (imgElem) {
          product.image = imgElem.src || imgElem.getAttribute('data-src') || '';
        }
        
        const linkElem = item.querySelector('a');
        if (linkElem) {
          product.link = linkElem.href;
        }
        
        if (product.name || product.price) {
          products.push(product);
        }
      });
    }
    
    result.sampleProducts = products;
    result.productCount = products.length;
    result.hasProducts = products.length > 0;
    
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown error occurred';
  }
  
  return result;
}

// Run analysis and save results
(async () => {
  const result = await analyzeMall();
  
  // Save results to JSON file
  const outputPath = path.join(__dirname, 'analysis-50.json');
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  
  console.log('Analysis completed for suncheon-local-food-together-store (ID: 50)');
  console.log(`Results saved to: ${outputPath}`);
  console.log(`Platform: ${result.platform}`);
  console.log(`Products found: ${result.productCount}`);
})();