import * as fs from 'fs';
import * as path from 'path';

interface MallInfo {
  id: number;
  engname: string;
  name: string;
  url: string;
  region: string;
}

function generateScraperFile(mall: MallInfo, analysis: any): string {
  const isNaverStore = mall.url.includes('smartstore.naver.com');
  
  // Handle different analysis formats
  const categories = analysis.categories || [];
  const productStructure = analysis.productStructure || {};
  const pagination = analysis.pagination || analysis.scrapingStrategy?.pagination || { type: 'none' };
  const requiresJavaScript = analysis.requiresJavaScript || analysis.scrapingStrategy?.requiresJavaScript || false;
  
  return `import axios from 'axios';
import * as cheerio from 'cheerio';
import { writeFileSync } from 'fs';
import { join } from 'path';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  link: string;
  seller: string;
  category: string;
  categoryId: string;
  mallId: number;
  mallName: string;
}

interface Category {
  id: string;
  name: string;
  url: string;
}

const MALL_ID = ${mall.id};
const MALL_NAME = '${mall.name}';
const BASE_URL = '${mall.url}';

// Categories from analysis
const CATEGORIES: Category[] = ${JSON.stringify(categories.filter((cat: any) => !cat.name.includes('더보기')).slice(0, 10).map((cat: any) => ({
  id: cat.id || cat.code || 'unknown',
  name: cat.name,
  url: cat.url
})), null, 2)};

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrapeProducts(categoryUrl: string, categoryName: string, categoryId: string): Promise<Product[]> {
  const products: Product[] = [];
  
  try {
    console.log(\`Scraping category: \${categoryName} from \${categoryUrl}\`);
    
    const response = await axios.get(categoryUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8'
      }
    });
    
    const $ = cheerio.load(response.data);
    ${
      productStructure.containerSelector ? 
      `
    // Find products using selectors from analysis
    $('${productStructure.containerSelector}').each((index, element) => {
      try {
        const $item = $(element);
        
        // Extract product name
        const name = $item.find('${productStructure.nameSelector}').text().trim();
        
        // Extract price
        const priceText = $item.find('${productStructure.priceSelector}').text();
        const price = parseInt(priceText.replace(/[^0-9]/g, '')) || 0;
        
        // Extract image
        const imageEl = $item.find('${productStructure.imageSelector}').first();
        let image = imageEl.attr('src') || imageEl.attr('data-src') || '';
        if (image && !image.startsWith('http')) {
          image = new URL(image, BASE_URL).toString();
        }
        
        // Extract link
        const linkEl = $item.find('${productStructure.linkSelector}').first();
        let link = linkEl.attr('href') || '';
        if (link && !link.startsWith('http')) {
          link = new URL(link, BASE_URL).toString();
        }
        
        // Generate product ID
        const id = link.match(/[?&](?:no|id|prod|product)[_=]([^&]+)/i)?.[1] || 
                  'prod_' + Date.now() + '_' + index;
        
        if (name && price > 0) {
          products.push({
            id,
            name,
            price,
            image,
            link,
            seller: MALL_NAME,
            category: categoryName,
            categoryId,
            mallId: MALL_ID,
            mallName: MALL_NAME
          });
        }
      } catch (err) {
        console.error('Error parsing product:', err);
      }
    });` : 
      `
    // Try common product selectors
    const productSelectors = [
      '.xans-product-normalpackage .item',
      '.product-item',
      '.goods-item',
      'li.xans-record-',
      '.prd-item',
      '.product',
      '.item'
    ];
    
    let foundProducts = false;
    for (const selector of productSelectors) {
      const items = $(selector);
      if (items.length > 0) {
        items.each((index, element) => {
          try {
            const $item = $(element);
            
            // Extract product name
            const nameEl = $item.find('h3, h4, h5, .name, .prd-name, .item-name').first();
            const name = nameEl.text().trim();
            
            // Extract price
            const priceEl = $item.find('.price, .cost, span:contains("원"), .prd-price').first();
            const priceText = priceEl.text();
            const price = parseInt(priceText.replace(/[^0-9]/g, '')) || 0;
            
            // Extract image
            const imageEl = $item.find('img').first();
            let image = imageEl.attr('src') || imageEl.attr('data-src') || '';
            if (image && !image.startsWith('http')) {
              image = new URL(image, BASE_URL).toString();
            }
            
            // Extract link
            const linkEl = $item.find('a').first();
            let link = linkEl.attr('href') || '';
            if (link && !link.startsWith('http')) {
              link = new URL(link, BASE_URL).toString();
            }
            
            // Generate product ID
            const id = link.match(/[?&](?:no|id|prod|product)[_=]([^&]+)/i)?.[1] || 
                      'prod_' + Date.now() + '_' + index;
            
            if (name && price > 0) {
              products.push({
                id,
                name,
                price,
                image,
                link,
                seller: MALL_NAME,
                category: categoryName,
                categoryId,
                mallId: MALL_ID,
                mallName: MALL_NAME
              });
              foundProducts = true;
            }
          } catch (err) {
            console.error('Error parsing product:', err);
          }
        });
        
        if (foundProducts) break;
      }
    }`
    }
    
    console.log(\`Found \${products.length} products in \${categoryName}\`);
    
  } catch (error) {
    console.error(\`Error scraping category \${categoryName}:\`, error);
  }
  
  return products;
}

async function main() {
  console.log(\`Starting scraper for \${MALL_NAME} (ID: \${MALL_ID})\`);
  console.log(\`Base URL: \${BASE_URL}\`);
  console.log(\`Total categories: \${CATEGORIES.length}\`);
  
  const allProducts: Product[] = [];
  
  // Scrape each category
  for (const category of CATEGORIES) {
    const products = await scrapeProducts(category.url, category.name, category.id);
    allProducts.push(...products);
    
    // Delay between requests
    await delay(2000);
  }
  
  // Save results
  const outputPath = join(__dirname, 'data');
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = join(outputPath, \`products_\${MALL_ID}_\${timestamp}.json\`);
  
  writeFileSync(filename, JSON.stringify({
    mallId: MALL_ID,
    mallName: MALL_NAME,
    scrapedAt: new Date().toISOString(),
    totalProducts: allProducts.length,
    products: allProducts
  }, null, 2));
  
  console.log(\`\\nScraping completed!\`);
  console.log(\`Total products: \${allProducts.length}\`);
  console.log(\`Results saved to: \${filename}\`);
}

// Run the scraper
main().catch(console.error);
`;
}

function generatePackageJson(mallId: number): string {
  return `{
  "name": "scraper-${mallId}",
  "version": "1.0.0",
  "description": "Web scraper for mall ${mallId}",
  "main": "scraper-${mallId}.ts",
  "scripts": {
    "build": "tsc",
    "start": "ts-node scraper-${mallId}.ts",
    "scrape": "npm run start"
  },
  "dependencies": {
    "axios": "^1.6.0",
    "cheerio": "^1.0.0-rc.12"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "ts-node": "^10.9.0",
    "typescript": "^5.0.0"
  }
}
`;
}

function generateTsConfig(): string {
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
  "include": ["*.ts"],
  "exclude": ["node_modules", "dist"]
}
`;
}

function generateConfig(mall: MallInfo, analysis: any): string {
  const requiresJavaScript = analysis.requiresJavaScript || analysis.scrapingStrategy?.requiresJavaScript || false;
  
  return JSON.stringify({
    mallId: mall.id,
    mallName: mall.name,
    baseUrl: mall.url,
    requiresJavaScript: requiresJavaScript,
    scrapeInterval: 86400000, // 24 hours
    retryAttempts: 3,
    requestDelay: 2000,
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
  }, null, 2);
}

function generateReadme(mall: MallInfo, analysis: any): string {
  const categories = analysis.categories || [];
  const pagination = analysis.pagination || analysis.scrapingStrategy?.pagination || { type: 'none' };
  const requiresJavaScript = analysis.requiresJavaScript || analysis.scrapingStrategy?.requiresJavaScript || false;
  
  return `# ${mall.name} Scraper (ID: ${mall.id})

## Overview
Web scraper for ${mall.name} (${mall.url})

## Requirements
- Node.js 16+
- npm or yarn

## Installation
\`\`\`bash
npm install
\`\`\`

## Usage
\`\`\`bash
npm run scrape
\`\`\`

## Configuration
See \`config.json\` for scraper settings.

## Output
Scraped data will be saved to the \`data/\` directory with timestamp.

## Features
- Scrapes ${categories.length} categories
- Handles pagination: ${pagination.type}
- JavaScript required: ${requiresJavaScript ? 'Yes' : 'No'}

## Notes
${analysis.additionalNotes || 'No additional notes.'}
`;
}

function generateReport(mall: MallInfo, analysis: any, success: boolean, error?: string): string {
  const timestamp = new Date().toISOString();
  const categories = analysis.categories || [];
  const pagination = analysis.pagination || analysis.scrapingStrategy?.pagination || { type: 'none' };
  const requiresJavaScript = analysis.requiresJavaScript || analysis.scrapingStrategy?.requiresJavaScript || false;
  const productStructure = analysis.productStructure || {};
  
  return `# Scraper Generation Report - ${mall.name} (ID: ${mall.id})

## Generation Details
- **Generated At**: ${timestamp}
- **Mall ID**: ${mall.id}
- **Mall Name**: ${mall.name}
- **Mall URL**: ${mall.url}
- **Status**: ${success ? 'Success' : 'Failed'}

## Analysis Summary
- **Categories Found**: ${categories.length}
- **Requires JavaScript**: ${requiresJavaScript ? 'Yes' : 'No'}
- **Pagination Type**: ${pagination.type}
- **Product Selectors Available**: ${productStructure.containerSelector ? 'Yes' : 'No'}

## Files Generated
${success ? `- scraper-${mall.id}.ts
- config.json
- package.json
- tsconfig.json
- README.md` : 'No files generated due to error'}

## Categories
${categories.slice(0, 5).map((cat: any) => `- ${cat.name}: ${cat.url}`).join('\n')}
${categories.length > 5 ? `... and ${categories.length - 5} more categories` : ''}

## Notes
${error ? `Error: ${error}` : analysis.additionalNotes || 'Scraper generated successfully.'}
`;
}

async function generateScraperForMall(mallId: number) {
  try {
    // Read mall info
    const mallsData = JSON.parse(fs.readFileSync('data/malls.json', 'utf8'));
    const mall = mallsData.find((m: MallInfo) => m.id === mallId);
    
    if (!mall) {
      throw new Error(`Mall with ID ${mallId} not found`);
    }
    
    // Find analysis file - check multiple possible locations
    const possiblePaths = [
      path.join('malls', `${mallId}-${mall.engname}`, 'analyze', `analysis-${mallId}.json`),
      path.join('malls', '91-haman-mall', 'analyze', 'malls', `${mallId}-${mall.engname}`, 'analyze', `analysis-${mallId}.json`),
      path.join('malls', '51-shinan-1004-mall', 'analyze', 'malls', '52-jangheung-mall-mountain-sea-jangheung-mall', 'analyze', `analysis-${mallId}.json`),
      path.join('malls', '51-shinan-1004-mall', 'analyze', 'malls', '52-jangheung-mall-mountain-sea-jangheung-mall', 'analyze', 'malls', '53-gichandeul-yeongam-mall', 'analyze', `analysis-${mallId}.json`),
      path.join('malls', '54-jindo-arirang-mall', 'analyze', 'malls', `${mallId}-${mall.engname}`, 'analyze', `analysis-${mallId}.json`)
    ];
    
    let analysisPath = null;
    for (const path of possiblePaths) {
      if (fs.existsSync(path)) {
        analysisPath = path;
        break;
      }
    }
    
    if (!analysisPath) {
      throw new Error(`Analysis file not found for mall ${mallId}`);
    }
    
    const analysis = JSON.parse(fs.readFileSync(analysisPath, 'utf8'));
    generateScraperFiles(mall, analysis);
    
    return true;
  } catch (error) {
    console.error(`Error generating scraper for mall ${mallId}:`, error);
    
    // Generate error report
    const mallsData = JSON.parse(fs.readFileSync('data/malls.json', 'utf8'));
    const mall = mallsData.find((m: MallInfo) => m.id === mallId);
    
    if (mall) {
      const reportPath = path.join('malls', `${mallId}-${mall.engname}`, 'scraper', `report-${mallId}.md`);
      const report = generateReport(mall, {
        categories: [],
        pagination: { type: 'none' },
        requiresJavaScript: false,
        productStructure: {}
      }, false, error instanceof Error ? error.message : String(error));
      
      const scraperDir = path.join('malls', `${mallId}-${mall.engname}`, 'scraper');
      if (!fs.existsSync(scraperDir)) {
        fs.mkdirSync(scraperDir, { recursive: true });
      }
      fs.writeFileSync(reportPath, report);
    }
    
    return false;
  }
}

function generateScraperFiles(mall: MallInfo, analysis: any) {
  const scraperDir = path.join('malls', `${mall.id}-${mall.engname}`, 'scraper');
  
  // Create directory
  if (!fs.existsSync(scraperDir)) {
    fs.mkdirSync(scraperDir, { recursive: true });
  }
  
  // Generate files
  fs.writeFileSync(path.join(scraperDir, `scraper-${mall.id}.ts`), generateScraperFile(mall, analysis));
  fs.writeFileSync(path.join(scraperDir, 'config.json'), generateConfig(mall, analysis));
  fs.writeFileSync(path.join(scraperDir, 'package.json'), generatePackageJson(mall.id));
  fs.writeFileSync(path.join(scraperDir, 'tsconfig.json'), generateTsConfig());
  fs.writeFileSync(path.join(scraperDir, 'README.md'), generateReadme(mall, analysis));
  fs.writeFileSync(path.join(scraperDir, `report-${mall.id}.md`), generateReport(mall, analysis, true));
  
  console.log(`✓ Generated scraper for ${mall.name} (ID: ${mall.id})`);
}

// Main execution
async function main() {
  console.log('Starting scraper generation for malls 31-60...\n');
  
  let successCount = 0;
  let failCount = 0;
  
  for (let id = 31; id <= 60; id++) {
    const success = await generateScraperForMall(id);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }
  
  console.log(`\nScraper generation completed!`);
  console.log(`Success: ${successCount}`);
  console.log(`Failed: ${failCount}`);
}

main().catch(console.error);