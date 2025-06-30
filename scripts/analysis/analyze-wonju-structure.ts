import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

interface CategoryInfo {
  code: string;
  name: string;
  url: string;
  subcategories?: CategoryInfo[];
}

interface MallAnalysis {
  mallName: string;
  mallUrl: string;
  categoryStructure: CategoryInfo[];
  productUrlPattern: string;
  categoryUrlPattern: string;
  paginationPattern: string;
  totalCategories: number;
  sampleProducts: any[];
  technicalNotes: string[];
  scrapingStrategy: {
    method: string;
    steps: string[];
    estimatedProductCount: string;
  };
}

class WonjuMallAnalyzer {
  private baseUrl = 'https://wonju-mall.co.kr/';
  private analysis: MallAnalysis = {
    mallName: '',
    mallUrl: this.baseUrl,
    categoryStructure: [],
    productUrlPattern: '',
    categoryUrlPattern: '',
    paginationPattern: '',
    totalCategories: 0,
    sampleProducts: [],
    technicalNotes: [],
    scrapingStrategy: {
      method: '',
      steps: [],
      estimatedProductCount: ''
    }
  };

  async analyze() {
    console.log('🔍 Analyzing Wonju Mall structure...');
    
    try {
      // Fetch homepage
      const response = await axios.get(this.baseUrl, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      
      // Save homepage for analysis
      const outputDir = path.join(__dirname, 'output');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      fs.writeFileSync(path.join(outputDir, 'wonju-homepage.html'), response.data);
      
      // Extract mall name
      this.analysis.mallName = $('title').text().trim() || 'Wonju Mall';
      console.log(`Mall name: ${this.analysis.mallName}`);
      
      // Find categories
      await this.analyzeCategories($);
      
      // Find product URL patterns
      await this.analyzeProductPatterns($);
      
      // Test category pages
      await this.testCategoryPage();
      
      // Analyze pagination
      await this.analyzePagination();
      
      // Add technical notes
      this.addTechnicalNotes($);
      
      // Define scraping strategy
      this.defineScrapeStrategy();
      
      // Save analysis
      const analysisFile = path.join(outputDir, 'wonju-analysis.json');
      fs.writeFileSync(analysisFile, JSON.stringify(this.analysis, null, 2));
      
      console.log(`\n✅ Analysis completed and saved to: ${analysisFile}`);
      this.printSummary();
      
    } catch (error) {
      console.error('❌ Error analyzing mall:', error);
      throw error;
    }
  }

  private async analyzeCategories($: cheerio.CheerioAPI) {
    console.log('📂 Analyzing category structure...');
    
    // Look for category menu in various possible locations
    const categorySelectors = [
      '.category-menu a',
      '.gnb a',
      '.lnb a', 
      '.category a',
      '.menu-category a',
      'nav a[href*="category"]',
      'nav a[href*="product"]',
      'nav a[href*="goods"]',
      '.nav-menu a',
      '.main-menu a',
      '#gnb a',
      '.depth1 a',
      '.depth2 a',
      'a[href*="shop"]',
      'a[href*="list"]'
    ];
    
    const categories: CategoryInfo[] = [];
    const seenUrls = new Set<string>();
    
    for (const selector of categorySelectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        console.log(`Found ${elements.length} elements with selector: ${selector}`);
        
        elements.each((_, element) => {
          const $link = $(element);
          const href = $link.attr('href');
          const text = $link.text().trim();
          
          if (href && text && !seenUrls.has(href)) {
            seenUrls.add(href);
            
            // Convert relative URLs to absolute
            const fullUrl = href.startsWith('http') ? href : 
                          href.startsWith('/') ? `https://wonju-mall.co.kr${href}` :
                          `https://wonju-mall.co.kr/${href}`;
            
            // Check if this looks like a category URL
            if (fullUrl.includes('category') || fullUrl.includes('product') || 
                fullUrl.includes('goods') || fullUrl.includes('list') || 
                fullUrl.includes('shop')) {
              categories.push({
                code: this.extractCategoryCode(href),
                name: text,
                url: fullUrl
              });
            }
          }
        });
        
        if (categories.length > 0) break;
      }
    }
    
    // Also look for product listing directly
    if (categories.length === 0) {
      console.log('No categories found through standard selectors, checking for alternative patterns...');
      
      // Look for product listing sections on homepage
      const listingSelectors = [
        '[class*="product-list"]',
        '[class*="goods-list"]',
        '[class*="item-list"]',
        '.list-product',
        '.product-grid',
        '.goods-grid'
      ];
      
      for (const selector of listingSelectors) {
        const elements = $(selector);
        if (elements.length > 0) {
          console.log(`Found product listing with selector: ${selector}`);
          break;
        }
      }
    }
    
    this.analysis.categoryStructure = categories;
    this.analysis.totalCategories = categories.length;
    console.log(`Found ${categories.length} categories`);
  }

  private extractCategoryCode(url: string): string {
    // Try to extract category code from URL
    const patterns = [
      /category[=_](\w+)/i,
      /cate[=_](\w+)/i,
      /cat[=_](\w+)/i,
      /code[=_](\w+)/i,
      /id[=_](\w+)/i
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    
    return url.split('/').pop() || 'unknown';
  }

  private async analyzeProductPatterns($: cheerio.CheerioAPI) {
    console.log('🔍 Analyzing product URL patterns...');
    
    // Look for product links
    const productSelectors = [
      'a[href*="product/view"]',
      'a[href*="goods/view"]',
      'a[href*="item/view"]',
      'a[href*="product_id="]',
      'a[href*="goods_id="]',
      'a[href*="pid="]',
      'a[href*="detail"]',
      '.product-item a',
      '.goods-item a',
      '.item a'
    ];
    
    for (const selector of productSelectors) {
      const links = $(selector);
      if (links.length > 0) {
        const firstLink = links.first().attr('href');
        if (firstLink) {
          console.log(`Found product link pattern: ${firstLink}`);
          
          // Extract pattern
          if (firstLink.includes('product_id=')) {
            this.analysis.productUrlPattern = 'https://wonju-mall.co.kr/...?product_id={productId}';
          } else if (firstLink.includes('goods_id=')) {
            this.analysis.productUrlPattern = 'https://wonju-mall.co.kr/...?goods_id={goodsId}';
          } else if (firstLink.includes('/view/')) {
            this.analysis.productUrlPattern = 'https://wonju-mall.co.kr/.../view/{productId}';
          } else if (firstLink.includes('/detail/')) {
            this.analysis.productUrlPattern = 'https://wonju-mall.co.kr/.../detail/{productId}';
          }
          break;
        }
      }
    }
  }

  private async testCategoryPage() {
    console.log('🧪 Testing category page structure...');
    
    // Try to fetch a category page if we found any
    if (this.analysis.categoryStructure.length > 0) {
      const testCategory = this.analysis.categoryStructure[0];
      try {
        const response = await axios.get(testCategory.url, {
          timeout: 20000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        const $ = cheerio.load(response.data);
        
        // Save test category page
        const outputDir = path.join(__dirname, 'output');
        fs.writeFileSync(path.join(outputDir, 'wonju-test-category.html'), response.data);
        
        // Look for products on the page
        const productCount = $('a[href*="product"], a[href*="goods"], .product-item, .goods-item').length;
        console.log(`Found ${productCount} potential products on category page`);
        
        // Extract sample product info
        const sampleProducts: any[] = [];
        $('.product-item, .goods-item, .item').slice(0, 3).each((_, element) => {
          const $item = $(element);
          const product = {
            title: $item.find('.product-name, .goods-name, .title, h3, h4').first().text().trim(),
            price: $item.find('.price, .product-price, .goods-price').first().text().trim(),
            image: $item.find('img').first().attr('src'),
            link: $item.find('a').first().attr('href')
          };
          if (product.title || product.price) {
            sampleProducts.push(product);
          }
        });
        
        this.analysis.sampleProducts = sampleProducts;
        console.log(`Extracted ${sampleProducts.length} sample products`);
        
      } catch (error) {
        console.error('Error testing category page:', error.message);
      }
    }
  }

  private async analyzePagination() {
    console.log('📄 Analyzing pagination patterns...');
    
    // Common pagination patterns
    const patterns = [
      '?page={pageNumber}',
      '&page={pageNumber}',
      '/page/{pageNumber}',
      '?p={pageNumber}',
      '&p={pageNumber}'
    ];
    
    // For now, assume standard page parameter
    this.analysis.paginationPattern = '?page={pageNumber}';
  }

  private addTechnicalNotes($: cheerio.CheerioAPI) {
    const notes: string[] = [];
    
    // Check for JavaScript frameworks
    if ($('script[src*="react"]').length > 0) {
      notes.push('Site uses React - may require dynamic content loading');
    }
    if ($('script[src*="vue"]').length > 0) {
      notes.push('Site uses Vue.js - may require dynamic content loading');
    }
    if ($('script[src*="angular"]').length > 0) {
      notes.push('Site uses Angular - may require dynamic content loading');
    }
    
    // Check for AJAX loading
    if ($('script:contains("ajax")').length > 0 || $('script:contains("XMLHttpRequest")').length > 0) {
      notes.push('Site uses AJAX for content loading');
    }
    
    // Check for infinite scroll
    if ($('script:contains("infinite")').length > 0 || $('script:contains("scroll")').length > 0) {
      notes.push('Site may use infinite scroll for pagination');
    }
    
    // Check encoding
    const charset = $('meta[charset]').attr('charset') || 
                   $('meta[http-equiv="Content-Type"]').attr('content')?.match(/charset=([^;]+)/)?.[1];
    if (charset) {
      notes.push(`Character encoding: ${charset}`);
    }
    
    this.analysis.technicalNotes = notes;
  }

  private defineScrapeStrategy() {
    this.analysis.scrapingStrategy = {
      method: 'Homepage and category traversal',
      steps: [
        '1. Start from homepage to get product listings',
        '2. Extract product URLs from homepage',
        '3. For each category found, fetch the listing page',
        '4. Handle pagination if multiple pages exist',
        '5. For each product URL, fetch product details',
        '6. Extract title, price, image, and other details',
        '7. Clean and normalize the data',
        '8. Save products with valid prices'
      ],
      estimatedProductCount: 'Unknown - requires exploration'
    };
  }

  private printSummary() {
    console.log('\n📊 Analysis Summary:');
    console.log(`- Mall Name: ${this.analysis.mallName}`);
    console.log(`- Categories Found: ${this.analysis.totalCategories}`);
    console.log(`- Product URL Pattern: ${this.analysis.productUrlPattern || 'Not determined'}`);
    console.log(`- Sample Products: ${this.analysis.sampleProducts.length}`);
    console.log(`- Technical Notes: ${this.analysis.technicalNotes.length}`);
    
    if (this.analysis.categoryStructure.length > 0) {
      console.log('\n📂 Categories:');
      this.analysis.categoryStructure.slice(0, 5).forEach(cat => {
        console.log(`  - ${cat.name} (${cat.code})`);
      });
      if (this.analysis.categoryStructure.length > 5) {
        console.log(`  ... and ${this.analysis.categoryStructure.length - 5} more`);
      }
    }
  }
}

// Run the analyzer
async function main() {
  const analyzer = new WonjuMallAnalyzer();
  await analyzer.analyze();
}

if (require.main === module) {
  main().catch(console.error);
}