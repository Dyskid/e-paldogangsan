import * as fs from 'fs';
import * as path from 'path';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

interface MallAnalysis {
  id: number;
  engname: string;
  name: string;
  url: string;
  structure: {
    categoryStructure: string;
    urlPatterns: string;
    paginationMethod: string;
    dynamicLoading: boolean;
    productDataLocation: string;
  };
  selectors: {
    productList: string;
    productItem: string;
    productName: string;
    productPrice: string;
    productImage: string;
    productLink: string;
    pagination: string;
    categories: string;
  };
  sampleData: any[];
  analysisTimestamp: string;
  success: boolean;
  error?: string;
}

async function analyzeMall(): Promise<void> {
  const analysis: MallAnalysis = {
    id: 22,
    engname: "taebaek-mall",
    name: "태백몰",
    url: "https://taebaek-mall.com/",
    structure: {
      categoryStructure: "",
      urlPatterns: "",
      paginationMethod: "",
      dynamicLoading: false,
      productDataLocation: ""
    },
    selectors: {
      productList: "",
      productItem: "",
      productName: "",
      productPrice: "",
      productImage: "",
      productLink: "",
      pagination: "",
      categories: ""
    },
    sampleData: [],
    analysisTimestamp: new Date().toISOString(),
    success: false
  };

  try {
    console.log("Fetching main page...");
    const response = await fetch(analysis.url);
    const html = await response.text();
    
    // Save the HTML for analysis
    const requirementsDir = path.join(__dirname, 'requirements');
    fs.writeFileSync(path.join(requirementsDir, 'main-page.html'), html);
    
    const $ = cheerio.load(html);
    
    // Analyze the structure
    console.log("Analyzing structure...");
    
    // Check for common e-commerce patterns
    const hasProductGrid = $('.product-list, .item-list, .goods-list, .prd-list').length > 0;
    const hasProductCards = $('.product-item, .item, .goods-item, .prd-item').length > 0;
    
    // Try to identify product listing structure
    let productListSelector = '';
    let productItemSelector = '';
    
    const possibleListSelectors = [
      '.product-list', '.item-list', '.goods-list', '.prd-list',
      '.product-grid', '.item-grid', '.goods-grid',
      '[class*="product"][class*="list"]', '[class*="item"][class*="list"]'
    ];
    
    const possibleItemSelectors = [
      '.product-item', '.item', '.goods-item', '.prd-item',
      '.product-card', '.item-card', '.goods-card',
      '[class*="product"][class*="item"]', '[class*="goods"][class*="item"]'
    ];
    
    for (const selector of possibleListSelectors) {
      if ($(selector).length > 0) {
        productListSelector = selector;
        break;
      }
    }
    
    for (const selector of possibleItemSelectors) {
      if ($(selector).length > 0) {
        productItemSelector = selector;
        break;
      }
    }
    
    // Analyze product data location
    if (productItemSelector) {
      const firstProduct = $(productItemSelector).first();
      
      // Try to find product name
      const nameSelectors = [
        '.product-name', '.item-name', '.goods-name', '.prd-name',
        '.title', '.name', 'h3', 'h4', '[class*="name"]', '[class*="title"]'
      ];
      
      for (const selector of nameSelectors) {
        if (firstProduct.find(selector).length > 0) {
          analysis.selectors.productName = selector;
          break;
        }
      }
      
      // Try to find product price
      const priceSelectors = [
        '.price', '.cost', '.product-price', '.item-price',
        '[class*="price"]', '[class*="cost"]', '.won'
      ];
      
      for (const selector of priceSelectors) {
        if (firstProduct.find(selector).length > 0) {
          analysis.selectors.productPrice = selector;
          break;
        }
      }
      
      // Try to find product image
      const imageSelectors = [
        'img', '.product-image img', '.item-image img',
        '[class*="image"] img', '[class*="thumb"] img'
      ];
      
      for (const selector of imageSelectors) {
        if (firstProduct.find(selector).length > 0) {
          analysis.selectors.productImage = selector;
          break;
        }
      }
      
      // Try to find product link
      const linkSelectors = [
        'a', '.product-link', '.item-link',
        'a[href*="product"]', 'a[href*="goods"]'
      ];
      
      for (const selector of linkSelectors) {
        if (firstProduct.find(selector).length > 0) {
          analysis.selectors.productLink = selector;
          break;
        }
      }
    }
    
    // Check for pagination
    const paginationSelectors = [
      '.pagination', '.paging', '.page-navigation',
      '[class*="pagination"]', '[class*="paging"]'
    ];
    
    for (const selector of paginationSelectors) {
      if ($(selector).length > 0) {
        analysis.selectors.pagination = selector;
        analysis.structure.paginationMethod = "standard pagination";
        break;
      }
    }
    
    // Check for categories
    const categorySelectors = [
      '.category', '.categories', '.menu',
      '[class*="category"]', '[class*="menu"]', 'nav'
    ];
    
    for (const selector of categorySelectors) {
      if ($(selector).length > 0) {
        analysis.selectors.categories = selector;
        break;
      }
    }
    
    // Check for dynamic loading
    const hasInfiniteScroll = $('[class*="infinite"]').length > 0;
    const hasLoadMore = $('[class*="load-more"], [class*="loadmore"]').length > 0;
    analysis.structure.dynamicLoading = hasInfiniteScroll || hasLoadMore;
    
    // Update structure information
    analysis.structure.categoryStructure = analysis.selectors.categories ? "Category menu found" : "No clear category structure";
    analysis.structure.urlPatterns = "Base URL: " + analysis.url;
    analysis.structure.productDataLocation = productListSelector || "Could not identify product list location";
    
    analysis.selectors.productList = productListSelector;
    analysis.selectors.productItem = productItemSelector;
    
    // Try to get sample data if we found product items
    if (productItemSelector && $(productItemSelector).length > 0) {
      $(productItemSelector).slice(0, 3).each((index, element) => {
        const $item = $(element);
        const sample: any = {
          index: index
        };
        
        if (analysis.selectors.productName) {
          sample.name = $item.find(analysis.selectors.productName).text().trim();
        }
        
        if (analysis.selectors.productPrice) {
          sample.price = $item.find(analysis.selectors.productPrice).text().trim();
        }
        
        if (analysis.selectors.productImage) {
          sample.image = $item.find(analysis.selectors.productImage).attr('src');
        }
        
        if (analysis.selectors.productLink) {
          sample.link = $item.find(analysis.selectors.productLink).attr('href');
        }
        
        analysis.sampleData.push(sample);
      });
    }
    
    // Try category pages if main page doesn't have products
    if (!productItemSelector || $(productItemSelector).length === 0) {
      console.log("No products on main page, trying to find category links...");
      
      const categoryLinks: string[] = [];
      $('a').each((i, elem) => {
        const href = $(elem).attr('href');
        if (href && (href.includes('category') || href.includes('product') || href.includes('goods'))) {
          categoryLinks.push(href);
        }
      });
      
      if (categoryLinks.length > 0) {
        const testUrl = new URL(categoryLinks[0], analysis.url).toString();
        console.log("Testing category page:", testUrl);
        
        try {
          const catResponse = await fetch(testUrl);
          const catHtml = await catResponse.text();
          fs.writeFileSync(path.join(requirementsDir, 'category-page.html'), catHtml);
          
          // Re-analyze with category page
          const $cat = cheerio.load(catHtml);
          
          for (const selector of possibleListSelectors) {
            if ($cat(selector).length > 0) {
              analysis.selectors.productList = selector;
              analysis.structure.productDataLocation = "Products found on category pages";
              break;
            }
          }
          
          for (const selector of possibleItemSelectors) {
            if ($cat(selector).length > 0) {
              analysis.selectors.productItem = selector;
              break;
            }
          }
        } catch (error) {
          console.error("Error fetching category page:", error);
        }
      }
    }
    
    analysis.success = analysis.selectors.productItem !== '';
    
    if (!analysis.success) {
      analysis.error = "Could not identify product structure";
    }
    
  } catch (error) {
    console.error("Error analyzing mall:", error);
    analysis.success = false;
    analysis.error = error instanceof Error ? error.message : String(error);
  }
  
  // Save the analysis
  const outputPath = path.join(__dirname, 'analysis-22.json');
  fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2));
  console.log("Analysis saved to:", outputPath);
}

// Run the analysis
analyzeMall().catch(console.error);