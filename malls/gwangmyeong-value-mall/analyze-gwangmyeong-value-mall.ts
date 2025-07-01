import puppeteer from 'puppeteer';
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

interface ProductInfo {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  discountRate?: number;
  imageUrl: string;
  vendor?: string;
  url: string;
  shipping?: string;
  rating?: number;
  reviewCount?: number;
}

interface MallAnalysis {
  mallName: string;
  mallUrl: string;
  categoryStructure: CategoryInfo[];
  productUrlPattern: string;
  categoryUrlPattern: string;
  paginationPattern?: string;
  totalCategories: number;
  sampleProducts: ProductInfo[];
  technicalNotes: string[];
  scrapingStrategy: {
    method: string;
    steps: string[];
    estimatedProductCount?: string;
  };
}

interface AnalysisOptions {
  mode: 'simple' | 'comprehensive';
  method: 'static' | 'dynamic';
  outputDir?: string;
}

class GmsocialAnalyzer {
  private outputDir: string;
  
  constructor(outputDir?: string) {
    this.outputDir = outputDir || path.join(__dirname, 'output');
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async analyze(options: AnalysisOptions = { mode: 'comprehensive', method: 'dynamic' }): Promise<MallAnalysis> {
    console.log('🔍 Analyzing 광명가치몰 (gmsocial.or.kr)...');
    console.log(`Mode: ${options.mode}, Method: ${options.method}`);

    if (options.method === 'dynamic') {
      return await this.analyzeDynamic(options);
    } else {
      return await this.analyzeStatic(options);
    }
  }

  private async analyzeDynamic(options: AnalysisOptions): Promise<MallAnalysis> {
    const browser = await puppeteer.launch({ 
      headless: true,
      defaultViewport: { width: 1920, height: 1080 }
    });
    
    try {
      const page = await browser.newPage();
      
      // Analyze main page
      await page.goto('https://gmsocial.or.kr/mall/', { 
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      
      await page.waitForTimeout(3000);
      
      // Extract categories from dynamic content
      const categories = await page.evaluate(() => {
        const cats: CategoryInfo[] = [];
        
        document.querySelectorAll('.gnb > li').forEach((elem) => {
          const mainLink = elem.querySelector('> a');
          if (!mainLink) return;
          
          const categoryUrl = mainLink.getAttribute('href') || '';
          const categoryCode = categoryUrl.match(/category_code=(\d+)/)?.[1] || '';
          
          if (categoryCode) {
            const category: CategoryInfo = {
              code: categoryCode,
              name: mainLink.textContent?.trim() || '',
              url: `https://gmsocial.or.kr${categoryUrl}`,
              subcategories: []
            };
            
            elem.querySelectorAll('.gnb_sub li a').forEach((subElem) => {
              const subUrl = subElem.getAttribute('href') || '';
              const subCode = subUrl.match(/category_code=(\d+)/)?.[1] || '';
              
              if (subCode) {
                category.subcategories?.push({
                  code: subCode,
                  name: subElem.textContent?.trim() || '',
                  url: `https://gmsocial.or.kr${subUrl}`
                });
              }
            });
            
            cats.push(category);
          }
        });
        
        return cats;
      });

      // Sample product collection
      const sampleProducts: ProductInfo[] = [];
      
      if (options.mode === 'comprehensive') {
        // Test individual product pages
        const productIds = [103, 104, 105]; // Known product IDs
        
        for (const productId of productIds) {
          try {
            await page.goto(`https://gmsocial.or.kr/mall/mall/goods/view.php?product_id=${productId}`, {
              waitUntil: 'networkidle2',
              timeout: 15000
            });
            
            const productData = await page.evaluate((id) => {
              // Extract product details from page
              const title = document.querySelector('h1, .product-title, .goods-title')?.textContent?.trim() || '';
              const priceText = Array.from(document.querySelectorAll('*')).find(el => /[0-9,]+원/.test(el.textContent || ''))?.textContent || '';
              const price = parseInt(priceText.replace(/[^0-9]/g, '') || '0');
              const image = (document.querySelector('img[src*="goods"], img[src*="product"]') as HTMLImageElement)?.src || '';
              
              return {
                id: id.toString(),
                title,
                price,
                imageUrl: image,
                url: window.location.href
              };
            }, productId);
            
            if (productData.title) {
              sampleProducts.push(productData as ProductInfo);
            }
          } catch (error) {
            console.log(`Could not fetch product ${productId}`);
          }
        }
      }

      // Save page samples for reference
      const homepageHtml = await page.content();
      fs.writeFileSync(path.join(this.outputDir, 'gmsocial-homepage.html'), homepageHtml);

      await browser.close();

      // Create analysis report
      const analysis: MallAnalysis = {
        mallName: "광명가치몰 (광명시사회적경제센터)",
        mallUrl: "https://gmsocial.or.kr/mall/",
        categoryStructure: categories,
        productUrlPattern: "https://gmsocial.or.kr/mall/goods/view.php?product_id={productId}",
        categoryUrlPattern: "https://gmsocial.or.kr/mall/goods/list.php?category_code={categoryCode}",
        paginationPattern: "https://gmsocial.or.kr/mall/goods/list.php?category_code={categoryCode}&page={pageNumber}",
        totalCategories: categories.reduce((acc, cat) => acc + 1 + (cat.subcategories?.length || 0), 0),
        sampleProducts: sampleProducts,
        technicalNotes: [
          "Mall uses PHP-based system with standard query parameters",
          "Product images hosted on shop-phinf.pstatic.net (Naver Smart Store CDN)",
          "Categories use hierarchical numeric codes",
          "Product IDs are sequential numbers",
          "Server-side rendered content",
          "No apparent rate limiting"
        ],
        scrapingStrategy: {
          method: "Direct product ID enumeration",
          steps: [
            "1. Start with known product ID range (103-200)",
            "2. Test each product_id sequentially",
            "3. Extract product details from individual pages",
            "4. Handle missing/invalid products gracefully",
            "5. Collect all valid products"
          ],
          estimatedProductCount: "38+ (based on existing data)"
        }
      };

      return analysis;

    } catch (error) {
      await browser.close();
      throw error;
    }
  }

  private async analyzeStatic(options: AnalysisOptions): Promise<MallAnalysis> {
    // Fetch homepage
    const response = await axios.get('https://gmsocial.or.kr/mall/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const categories: CategoryInfo[] = [];
    
    // Extract categories from static HTML
    $('.gnb > li').each((i, elem) => {
      const $elem = $(elem);
      const mainLink = $elem.find('> a');
      const categoryUrl = mainLink.attr('href') || '';
      const categoryCode = categoryUrl.match(/category_code=(\d+)/)?.[1] || '';
      
      if (categoryCode) {
        const category: CategoryInfo = {
          code: categoryCode,
          name: mainLink.text().trim(),
          url: `https://gmsocial.or.kr${categoryUrl}`,
          subcategories: []
        };
        
        $elem.find('.gnb_sub li a').each((j, subElem) => {
          const $subElem = $(subElem);
          const subUrl = $subElem.attr('href') || '';
          const subCode = subUrl.match(/category_code=(\d+)/)?.[1] || '';
          
          if (subCode) {
            category.subcategories?.push({
              code: subCode,
              name: $subElem.text().trim(),
              url: `https://gmsocial.or.kr${subUrl}`
            });
          }
        });
        
        categories.push(category);
      }
    });

    // Save homepage for reference
    fs.writeFileSync(path.join(this.outputDir, 'gmsocial-homepage.html'), response.data);

    // For simple mode, just return basic structure
    const analysis: MallAnalysis = {
      mallName: "광명가치몰 (광명시사회적경제센터)",
      mallUrl: "https://gmsocial.or.kr/mall/",
      categoryStructure: categories,
      productUrlPattern: "https://gmsocial.or.kr/mall/goods/view.php?product_id={productId}",
      categoryUrlPattern: "https://gmsocial.or.kr/mall/goods/list.php?category_code={categoryCode}",
      totalCategories: categories.length,
      sampleProducts: [],
      technicalNotes: [
        "PHP-based system",
        "Server-side rendered",
        "Standard URL patterns"
      ],
      scrapingStrategy: {
        method: "Category traversal",
        steps: ["Navigate categories", "Extract products", "Parse details"],
        estimatedProductCount: "Unknown"
      }
    };

    if (options.mode === 'comprehensive') {
      // Fetch sample products for comprehensive mode
      try {
        const categoryResponse = await axios.get('https://gmsocial.or.kr/mall/goods/list.php?category_code=0006');
        const $cat = cheerio.load(categoryResponse.data);
        
        // Extract sample products (adjust selectors as needed)
        $cat('.product-item, .goods-list li').slice(0, 5).each((i, elem) => {
          const $elem = $cat(elem);
          const productUrl = $elem.find('a').attr('href') || '';
          const productId = productUrl.match(/product_id=(\d+)/)?.[1] || '';
          
          if (productId) {
            analysis.sampleProducts.push({
              id: productId,
              title: $elem.find('.product-name, .goods-name').text().trim(),
              price: parseInt($elem.find('.price').text().replace(/[^0-9]/g, '') || '0'),
              imageUrl: $elem.find('img').attr('src') || '',
              url: `https://gmsocial.or.kr${productUrl}`
            });
          }
        });
      } catch (error) {
        console.log('Could not fetch category page for samples');
      }
    }

    return analysis;
  }

  async saveAnalysis(analysis: MallAnalysis): Promise<string> {
    const filename = 'gmsocial-analysis.json';
    const filepath = path.join(this.outputDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(analysis, null, 2));
    console.log(`✅ Analysis saved to: ${filepath}`);
    return filepath;
  }
}

// Main execution
async function main() {
  const analyzer = new GmsocialAnalyzer();
  
  try {
    // Run comprehensive dynamic analysis by default
    const analysis = await analyzer.analyze({
      mode: 'comprehensive',
      method: 'dynamic'
    });
    
    await analyzer.saveAnalysis(analysis);
    
    console.log('\n📊 Analysis Summary:');
    console.log(`- Mall: ${analysis.mallName}`);
    console.log(`- Categories: ${analysis.totalCategories}`);
    console.log(`- Sample products: ${analysis.sampleProducts.length}`);
    console.log(`- Scraping method: ${analysis.scrapingStrategy.method}`);
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { GmsocialAnalyzer, MallAnalysis, AnalysisOptions };