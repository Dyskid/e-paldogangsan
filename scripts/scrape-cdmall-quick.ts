import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

interface Product {
  id: string;
  title: string;
  price: string;
  image: string;
  url: string;
  category: string;
  mall: string;
  mallId: string;
}

async function scrapeCdmallQuick() {
  const baseUrl = 'https://cdmall.cyso.co.kr';
  const mallName = '청도몰';
  const mallId = 'cdmall';
  
  console.log(`Starting quick scraping for ${mallName}...`);
  
  const products: Product[] = [];
  const visitedUrls = new Set<string>();
  
  try {
    // First, get products from homepage
    console.log('Fetching homepage...');
    const homepage = await axios.get(baseUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 30000
    });
    
    const $ = cheerio.load(homepage.data);
    
    // Collect product URLs from homepage
    $('a[href*="shop/item.php?it_id="]').each((i, el) => {
      const href = $(el).attr('href');
      if (href) {
        const fullUrl = href.startsWith('http') ? href : baseUrl + href;
        if (!visitedUrls.has(fullUrl)) {
          visitedUrls.add(fullUrl);
        }
      }
    });
    
    console.log(`Found ${visitedUrls.size} products on homepage`);
    
    // Search for key terms to get more products
    const searchTerms = ['청도', '감말랭이', '반건시'];
    
    for (const term of searchTerms) {
      console.log(`\nSearching for: ${term}`);
      try {
        const searchUrl = `${baseUrl}/shop/search.php?q=${encodeURIComponent(term)}`;
        const searchResp = await axios.get(searchUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          timeout: 30000
        });
        
        const $search = cheerio.load(searchResp.data);
        $search('a[href*="shop/item.php?it_id="]').each((i, el) => {
          const href = $search(el).attr('href');
          if (href && visitedUrls.size < 30) { // Limit to 30 URLs
            const fullUrl = href.startsWith('http') ? href : baseUrl + href;
            if (!visitedUrls.has(fullUrl)) {
              visitedUrls.add(fullUrl);
            }
          }
        });
      } catch (error) {
        console.error(`Error searching for ${term}:`, error);
      }
    }
    
    console.log(`\nTotal unique URLs collected: ${visitedUrls.size}`);
    console.log('Now scraping product details...');
    
    // Process products
    let processedCount = 0;
    for (const productUrl of visitedUrls) {
      if (processedCount >= 30) break; // Limit for quick scraper
      
      try {
        console.log(`\nProcessing ${processedCount + 1}/${Math.min(visitedUrls.size, 30)}: ${productUrl}`);
        
        const response = await axios.get(productUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
          },
          timeout: 15000 // Shorter timeout
        });
        
        const $prod = cheerio.load(response.data);
        
        // Extract product ID
        const idMatch = productUrl.match(/it_id=(\d+)/);
        const productId = idMatch ? idMatch[1] : '';
        
        if (!productId) continue;
        
        // Extract title - look for actual product title, not page title
        let title = '';
        
        // Try different selectors
        const titleSelectors = [
          'h1.it_name',
          'h1',
          '.it_name',
          '.product_name',
          '[itemprop="name"]',
          '.goods_name'
        ];
        
        for (const selector of titleSelectors) {
          const el = $prod(selector).first();
          if (el.length > 0) {
            const text = el.text().trim();
            // Filter out generic titles
            if (text && text.length > 3 && !text.includes('청리브') && !text.includes('쇼핑몰')) {
              title = text;
              break;
            }
          }
        }
        
        // If still no title, try meta tags
        if (!title) {
          const ogTitle = $prod('meta[property="og:title"]').attr('content');
          if (ogTitle && !ogTitle.includes('청리브')) {
            title = ogTitle.trim();
          }
        }
        
        // Extract price - look in specific areas
        let price = '';
        
        // First try specific price containers
        const priceSelectors = [
          '#it_price',
          '.it_price',
          '[itemprop="price"]',
          '.price',
          'dd:contains("원")',
          'span:contains("원")',
          'strong:contains("원")'
        ];
        
        for (const selector of priceSelectors) {
          const elements = $prod(selector);
          elements.each((i, el) => {
            const text = $prod(el).text();
            const match = text.match(/(\d{1,3}(?:,\d{3})*)\s*원/);
            if (match && !price) {
              price = match[0];
              return false; // break
            }
          });
          if (price) break;
        }
        
        // Extract image
        let image = '';
        const imageSelectors = [
          '#it_image img',
          '.it_image img',
          '.bigimg img',
          '[itemprop="image"]',
          'img[src*="/data/item/"]',
          '.item_image img',
          '.product_image img'
        ];
        
        for (const selector of imageSelectors) {
          const img = $prod(selector).first();
          if (img.length > 0) {
            const src = img.attr('src');
            if (src && !src.includes('no_image') && !src.includes('blank')) {
              image = src.startsWith('http') ? src : baseUrl + src;
              break;
            }
          }
        }
        
        // Determine category based on title or breadcrumb
        let category = '청도특산물';
        const titleLower = title.toLowerCase();
        const breadcrumb = $prod('.breadcrumb, .location').text().toLowerCase();
        
        if (titleLower.includes('감말랭이') || titleLower.includes('반건시') || titleLower.includes('곶감')) {
          category = '가공식품';
        } else if (titleLower.includes('복숭아') || titleLower.includes('사과') || breadcrumb.includes('과일')) {
          category = '과일류';
        } else if (titleLower.includes('미나리') || breadcrumb.includes('채소')) {
          category = '채소류';
        } else if (titleLower.includes('한우') || titleLower.includes('돼지') || breadcrumb.includes('축산')) {
          category = '축산물';
        }
        
        // Add product if we have required fields
        if (title && price && productId) {
          products.push({
            id: `${mallId}-${productId}`,
            title,
            price,
            image,
            url: productUrl,
            category,
            mall: mallName,
            mallId
          });
          processedCount++;
          console.log(`✓ Added: ${title} - ${price}`);
        } else {
          console.log(`✗ Skipped: Missing data (title: ${!!title}, price: ${!!price})`);
        }
        
        // Small delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`Error processing ${productUrl}:`, error);
      }
    }
    
    // Save results
    const outputDir = path.join(process.cwd(), 'scripts/output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputPath = path.join(outputDir, 'cdmall-products.json');
    fs.writeFileSync(outputPath, JSON.stringify(products, null, 2));
    
    console.log(`\n=== Scraping Complete ===`);
    console.log(`Total products scraped: ${products.length}`);
    console.log(`Products saved to: ${outputPath}`);
    
    // Category breakdown
    const categoryCount = products.reduce((acc, product) => {
      acc[product.category] = (acc[product.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('\nCategory breakdown:');
    Object.entries(categoryCount).forEach(([category, count]) => {
      console.log(`  ${category}: ${count}`);
    });
    
    // Save summary
    const summary = {
      mallName,
      mallId,
      totalProducts: products.length,
      categoryBreakdown: categoryCount,
      scrapedAt: new Date().toISOString(),
      sampleProducts: products.slice(0, 5)
    };
    
    fs.writeFileSync(
      path.join(outputDir, 'cdmall-scrape-summary.json'),
      JSON.stringify(summary, null, 2)
    );
    
    return products;
    
  } catch (error) {
    console.error('Error during scraping:', error);
    return products;
  }
}

// Run the scraper
scrapeCdmallQuick().catch(console.error);