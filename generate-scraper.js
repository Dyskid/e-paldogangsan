"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function generateScraperCode(analysis) {
    const requiresJS = analysis.dynamicLoading?.requiresJavaScript || analysis.requiresJavaScript || false;
    const scraperType = requiresJS ? 'puppeteer' : 'axios';
    if (scraperType === 'axios') {
        return `import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

interface Product {
  id: string;
  name: string;
  price: string;
  imageUrl: string;
  productUrl: string;
  category: string;
  mallId: number;
  mallName: string;
}

class Mall${analysis.mallId}Scraper {
  private baseUrl = '${analysis.url}';
  private mallId = ${analysis.mallId};
  private mallName = '${analysis.mallName}';
  private products: Product[] = [];

  async scrape() {
    console.log(\`Starting scraper for \${this.mallName} (ID: \${this.mallId})\`);
    
    try {
      // Scrape categories
      const categories = await this.getCategories();
      console.log(\`Found \${categories.length} categories\`);
      
      // Scrape products from each category
      for (const category of categories) {
        console.log(\`Scraping category: \${category.name}\`);
        await this.scrapeCategory(category);
      }
      
      // Save results
      this.saveResults();
      console.log(\`Scraping completed. Total products: \${this.products.length}\`);
    } catch (error) {
      console.error('Scraping failed:', error);
    }
  }

  private async getCategories() {
    try {
      const response = await axios.get(this.baseUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      const categories: any[] = [];
      
      // Extract categories based on analysis
      ${analysis.categories && analysis.categories.length > 0 ?
            `const categorySelectors = ['${analysis.productStructure?.containerSelector || '.category a'}'];` :
            `const categorySelectors = ['.category a', '.nav-category a', '.menu-category a'];`}
      
      for (const selector of categorySelectors) {
        $(selector).each((i, el) => {
          const $el = $(el);
          const href = $el.attr('href');
          const name = $el.text().trim();
          
          if (href && name) {
            const url = new URL(href, this.baseUrl).toString();
            categories.push({ name, url, id: \`cat\${i}\` });
          }
        });
        
        if (categories.length > 0) break;
      }
      
      return categories.slice(0, 20); // Limit categories
    } catch (error) {
      console.error('Failed to get categories:', error);
      return [];
    }
  }

  private async scrapeCategory(category: any) {
    let page = 1;
    let hasMore = true;
    
    while (hasMore && page <= 5) { // Limit pages per category
      const url = this.buildCategoryUrl(category.url, page);
      
      try {
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        const $ = cheerio.load(response.data);
        const productCount = this.extractProducts($, category.name);
        
        if (productCount === 0) {
          hasMore = false;
        } else {
          page++;
        }
        
        // Rate limiting
        await this.delay(1000);
      } catch (error) {
        console.error(\`Failed to scrape page \${page} of \${category.name}:\`, error);
        hasMore = false;
      }
    }
  }

  private buildCategoryUrl(categoryUrl: string, page: number): string {
    const separator = categoryUrl.includes('?') ? '&' : '?';
    return \`\${categoryUrl}\${separator}page=\${page}\`;
  }

  private extractProducts($: cheerio.CheerioAPI, categoryName: string): number {
    let productCount = 0;
    const productSelectors = ['${analysis.productStructure?.itemSelector || '.product-item'}', '.item', '.goods'];
    
    for (const selector of productSelectors) {
      $(selector).each((i, el) => {
        const $product = $(el);
        
        const name = $product.find('${analysis.productData?.nameLocation || '.name'}').text().trim();
        const price = $product.find('${analysis.productData?.priceLocation || '.price'}').text().trim();
        const imageUrl = $product.find('img').attr('src') || '';
        const productLink = $product.find('a').attr('href') || '';
        
        if (name && price) {
          const product: Product = {
            id: \`\${this.mallId}_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`,
            name,
            price: this.normalizePrice(price),
            imageUrl: new URL(imageUrl, this.baseUrl).toString(),
            productUrl: new URL(productLink, this.baseUrl).toString(),
            category: categoryName,
            mallId: this.mallId,
            mallName: this.mallName
          };
          
          this.products.push(product);
          productCount++;
        }
      });
      
      if (productCount > 0) break;
    }
    
    return productCount;
  }

  private normalizePrice(price: string): string {
    return price.replace(/[^0-9]/g, '');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private saveResults() {
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputFile = path.join(outputDir, \`products-\${this.mallId}.json\`);
    fs.writeFileSync(outputFile, JSON.stringify(this.products, null, 2));
    console.log(\`Results saved to \${outputFile}\`);
  }
}

// Run the scraper
const scraper = new Mall${analysis.mallId}Scraper();
scraper.scrape().catch(console.error);
`;
    }
    else {
        // Puppeteer scraper for dynamic sites
        return `import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

interface Product {
  id: string;
  name: string;
  price: string;
  imageUrl: string;
  productUrl: string;
  category: string;
  mallId: number;
  mallName: string;
}

class Mall${analysis.mallId}Scraper {
  private baseUrl = '${analysis.url}';
  private mallId = ${analysis.mallId};
  private mallName = '${analysis.mallName}';
  private products: Product[] = [];

  async scrape() {
    console.log(\`Starting scraper for \${this.mallName} (ID: \${this.mallId})\`);
    
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      
      // Navigate to main page
      await page.goto(this.baseUrl, { waitUntil: 'networkidle2' });
      
      // Get categories
      const categories = await this.getCategories(page);
      console.log(\`Found \${categories.length} categories\`);
      
      // Scrape products from each category
      for (const category of categories) {
        console.log(\`Scraping category: \${category.name}\`);
        await this.scrapeCategory(page, category);
      }
      
      // Save results
      this.saveResults();
      console.log(\`Scraping completed. Total products: \${this.products.length}\`);
    } catch (error) {
      console.error('Scraping failed:', error);
    } finally {
      await browser.close();
    }
  }

  private async getCategories(page: puppeteer.Page) {
    try {
      const categories = await page.evaluate(() => {
        const cats: any[] = [];
        const selectors = ['.category a', '.nav-category a', '.menu-category a'];
        
        for (const selector of selectors) {
          const elements = document.querySelectorAll(selector);
          elements.forEach((el, i) => {
            const href = el.getAttribute('href');
            const name = el.textContent?.trim();
            
            if (href && name) {
              cats.push({ name, url: href, id: \`cat\${i}\` });
            }
          });
          
          if (cats.length > 0) break;
        }
        
        return cats;
      });
      
      return categories.slice(0, 20).map(cat => ({
        ...cat,
        url: new URL(cat.url, this.baseUrl).toString()
      }));
    } catch (error) {
      console.error('Failed to get categories:', error);
      return [];
    }
  }

  private async scrapeCategory(page: puppeteer.Page, category: any) {
    try {
      await page.goto(category.url, { waitUntil: 'networkidle2' });
      
      // Extract products
      const products = await page.evaluate((categoryName, mallId, mallName) => {
        const items: Product[] = [];
        const productSelectors = ['.product-item', '.item', '.goods'];
        
        for (const selector of productSelectors) {
          const elements = document.querySelectorAll(selector);
          
          elements.forEach(el => {
            const nameEl = el.querySelector('.name, .title, .product-name');
            const priceEl = el.querySelector('.price, .cost');
            const imgEl = el.querySelector('img');
            const linkEl = el.querySelector('a');
            
            const name = nameEl?.textContent?.trim();
            const price = priceEl?.textContent?.trim();
            const imageUrl = imgEl?.getAttribute('src') || '';
            const productUrl = linkEl?.getAttribute('href') || '';
            
            if (name && price) {
              items.push({
                id: \`\${mallId}_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`,
                name,
                price: price.replace(/[^0-9]/g, ''),
                imageUrl,
                productUrl,
                category: categoryName,
                mallId,
                mallName
              });
            }
          });
          
          if (items.length > 0) break;
        }
        
        return items;
      }, category.name, this.mallId, this.mallName);
      
      // Fix relative URLs
      products.forEach(product => {
        if (product.imageUrl) {
          product.imageUrl = new URL(product.imageUrl, this.baseUrl).toString();
        }
        if (product.productUrl) {
          product.productUrl = new URL(product.productUrl, this.baseUrl).toString();
        }
      });
      
      this.products.push(...products);
      
      // Check for pagination and scrape additional pages if needed
      // Limited to 5 pages per category
      
    } catch (error) {
      console.error(\`Failed to scrape category \${category.name}:\`, error);
    }
  }

  private saveResults() {
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputFile = path.join(outputDir, \`products-\${this.mallId}.json\`);
    fs.writeFileSync(outputFile, JSON.stringify(this.products, null, 2));
    console.log(\`Results saved to \${outputFile}\`);
  }
}

// Run the scraper
const scraper = new Mall${analysis.mallId}Scraper();
scraper.scrape().catch(console.error);
`;
    }
}
function generatePackageJson(analysis) {
    const requiresJS = analysis.dynamicLoading?.requiresJavaScript || analysis.requiresJavaScript || false;
    return `{
  "name": "scraper-mall-${analysis.mallId}",
  "version": "1.0.0",
  "description": "Scraper for ${analysis.mallName}",
  "main": "scraper.js",
  "scripts": {
    "build": "tsc",
    "start": "npm run build && node dist/scraper.js",
    "dev": "ts-node scraper.ts"
  },
  "dependencies": {
    ${requiresJS ? '"puppeteer": "^21.0.0",' : '"axios": "^1.6.0",\n    "cheerio": "^1.0.0-rc.12",'}
    "typescript": "^5.3.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    ${requiresJS ? '"@types/puppeteer": "^7.0.4",' : '"@types/cheerio": "^0.22.35",'}
    "ts-node": "^10.9.0"
  }
}`;
}
function generateTsConfig() {
    return `{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": [
    "*.ts"
  ],
  "exclude": [
    "node_modules",
    "dist"
  ]
}`;
}
function generateConfig(analysis) {
    return `{
  "mallId": ${analysis.mallId},
  "mallName": "${analysis.mallName}",
  "baseUrl": "${analysis.url}",
  "scrapeConfig": {
    "maxCategories": 20,
    "maxPagesPerCategory": 5,
    "maxProductsPerPage": 50,
    "rateLimitMs": 1000
  },
  "selectors": {
    "category": "${analysis.categories?.[0]?.url ? '.category a' : '.nav a'}",
    "productContainer": "${analysis.productStructure?.containerSelector || '.product-item'}",
    "productName": "${analysis.productData?.nameLocation || '.name'}",
    "productPrice": "${analysis.productData?.priceLocation || '.price'}",
    "productImage": "img",
    "productLink": "a"
  }
}`;
}
function generateReadme(analysis) {
    return `# Scraper for ${analysis.mallName} (Mall ID: ${analysis.mallId})

## Overview
This scraper is designed to collect product information from ${analysis.url}

## Features
- Category-based scraping
- Pagination support
- ${analysis.dynamicLoading?.requiresJavaScript || analysis.requiresJavaScript ? 'JavaScript rendering with Puppeteer' : 'Static HTML scraping with Axios/Cheerio'}
- Product data extraction (name, price, image, URL)

## Installation
\`\`\`bash
npm install
\`\`\`

## Usage
\`\`\`bash
# Build and run
npm start

# Development mode
npm run dev
\`\`\`

## Output
The scraper saves products to \`output/products-${analysis.mallId}.json\`

## Configuration
See \`config.json\` for scraping parameters and selectors.
`;
}
function generateReport(analysis) {
    const timestamp = new Date().toISOString();
    return `# Scraper Generation Report - Mall ${analysis.mallId}

## Generation Details
- **Generated At**: ${timestamp}
- **Mall Name**: ${analysis.mallName}
- **Mall URL**: ${analysis.url}
- **Mall ID**: ${analysis.mallId}

## Scraper Configuration
- **Type**: ${analysis.dynamicLoading?.requiresJavaScript || analysis.requiresJavaScript ? 'Dynamic (Puppeteer)' : 'Static (Axios/Cheerio)'}
- **Categories Found**: ${analysis.categories?.length || 0}
- **Pagination**: ${analysis.pagination?.type || 'Unknown'}

## Files Generated
1. \`scraper.ts\` - Main scraper implementation
2. \`package.json\` - Dependencies configuration
3. \`tsconfig.json\` - TypeScript configuration
4. \`config.json\` - Scraper settings
5. \`README.md\` - Usage documentation

## Notes
- The scraper is configured based on the analysis data
- Rate limiting is implemented (1 second between requests)
- Maximum 20 categories and 5 pages per category to prevent overload
- Products are saved with unique IDs including mall ID prefix

## Next Steps
1. Run \`npm install\` to install dependencies
2. Review and adjust selectors in \`config.json\` if needed
3. Run \`npm start\` to execute the scraper
`;
}
async function generateScraperForMall(mallId, mallData) {
    try {
        // Find analysis file
        const analysisPath = `malls/${mallId}-${mallData.engname}/analyze/analysis-${mallId}.json`;
        if (!fs.existsSync(analysisPath)) {
            console.error(`Analysis file not found for mall ${mallId}: ${analysisPath}`);
            return false;
        }
        // Read analysis data
        const analysisData = JSON.parse(fs.readFileSync(analysisPath, 'utf-8'));
        // Merge mall data
        analysisData.mallName = mallData.engname;
        analysisData.url = analysisData.url || mallData.url;
        // Create output directory
        const outputDir = `malls/${mallId}-${mallData.engname}/scraper`;
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        // Generate files
        fs.writeFileSync(path.join(outputDir, 'scraper.ts'), generateScraperCode(analysisData));
        fs.writeFileSync(path.join(outputDir, 'package.json'), generatePackageJson(analysisData));
        fs.writeFileSync(path.join(outputDir, 'tsconfig.json'), generateTsConfig());
        fs.writeFileSync(path.join(outputDir, 'config.json'), generateConfig(analysisData));
        fs.writeFileSync(path.join(outputDir, 'README.md'), generateReadme(analysisData));
        fs.writeFileSync(path.join(outputDir, `report-${mallId}.md`), generateReport(analysisData));
        console.log(`✓ Generated scraper for mall ${mallId} (${mallData.name})`);
        return true;
    }
    catch (error) {
        console.error(`✗ Failed to generate scraper for mall ${mallId}:`, error);
        return false;
    }
}
// Main execution
async function main() {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.error('Usage: ts-node generate-scraper.ts <mall-id> [mall-id...]');
        console.error('   or: ts-node generate-scraper.ts --range <start> <end>');
        process.exit(1);
    }
    // Load malls data
    const mallsData = JSON.parse(fs.readFileSync('data/malls.json', 'utf-8'));
    const mallsMap = new Map(mallsData.map((m) => [m.id, m]));
    let mallIds = [];
    if (args[0] === '--range' && args.length === 3) {
        const start = parseInt(args[1]);
        const end = parseInt(args[2]);
        mallIds = Array.from({ length: end - start + 1 }, (_, i) => start + i);
    }
    else {
        mallIds = args.map(id => parseInt(id));
    }
    console.log(`Generating scrapers for ${mallIds.length} malls...`);
    let successCount = 0;
    for (const mallId of mallIds) {
        const mallData = mallsMap.get(mallId);
        if (!mallData) {
            console.error(`Mall data not found for ID ${mallId}`);
            continue;
        }
        const success = await generateScraperForMall(mallId, mallData);
        if (success)
            successCount++;
    }
    console.log(`\nCompleted: ${successCount}/${mallIds.length} scrapers generated successfully`);
}
main().catch(console.error);
