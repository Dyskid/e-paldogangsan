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

async function scrapeCdmallFixed() {
  const baseUrl = 'https://cdmall.cyso.co.kr';
  const mallName = '청도몰';
  const mallId = 'cdmall';
  
  console.log(`Starting fixed scraping for ${mallName}...`);
  
  const products: Product[] = [];
  const visitedUrls = new Set<string>();
  
  try {
    // Strategy 1: Get products from homepage
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
        visitedUrls.add(fullUrl);
      }
    });
    
    console.log(`Found ${visitedUrls.size} products on homepage`);
    
    // Strategy 2: Search for 청도 specialty products
    const searchTerms = ['청도', '감말랭이', '반건시', '미나리', '복숭아'];
    
    for (const term of searchTerms) {
      if (visitedUrls.size >= 50) break;
      
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
          if (href && visitedUrls.size < 50) {
            const fullUrl = href.startsWith('http') ? href : baseUrl + href;
            visitedUrls.add(fullUrl);
          }
        });
      } catch (error) {
        console.error(`Error searching for ${term}:`, error);
      }
    }
    
    // Strategy 3: Browse categories
    const categoryUrls = [
      '/shop/list.php?ca_id=10', // 과일류
      '/shop/list.php?ca_id=40', // 가공식품
      '/shop/list.php?ca_id=70'  // 특산물
    ];
    
    for (const catUrl of categoryUrls) {
      if (visitedUrls.size >= 50) break;
      
      try {
        const categoryResp = await axios.get(baseUrl + catUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          timeout: 30000
        });
        
        const $cat = cheerio.load(categoryResp.data);
        $cat('a[href*="shop/item.php?it_id="]').each((i, el) => {
          const href = $cat(el).attr('href');
          if (href && visitedUrls.size < 50) {
            const fullUrl = href.startsWith('http') ? href : baseUrl + href;
            visitedUrls.add(fullUrl);
          }
        });
      } catch (error) {
        console.error(`Error browsing category:`, error);
      }
    }
    
    console.log(`\nTotal unique URLs collected: ${visitedUrls.size}`);
    console.log('Now scraping product details...');
    
    // Process products
    let processedCount = 0;
    const urlArray = Array.from(visitedUrls);
    
    for (let i = 0; i < urlArray.length && processedCount < 50; i++) {
      const productUrl = urlArray[i];
      
      try {
        console.log(`\nProcessing ${i + 1}/${urlArray.length}: ${productUrl}`);
        
        const response = await axios.get(productUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
          },
          timeout: 15000
        });
        
        const $prod = cheerio.load(response.data);
        
        // Extract product ID
        const idMatch = productUrl.match(/it_id=(\d+)/);
        const productId = idMatch ? idMatch[1] : '';
        
        if (!productId) continue;
        
        // Extract title - use the specific selector we found
        let title = '';
        const titleElement = $prod('#sit_title, h2#sit_title');
        if (titleElement.length > 0) {
          title = titleElement.text().trim();
          // Remove "요약정보 및 구매" suffix if present
          title = title.replace(/\s*요약정보 및 구매.*$/, '').trim();
        }
        
        // If no title, try description
        if (!title) {
          const desc = $prod('#sit_desc, p#sit_desc').text().trim();
          if (desc && desc.length > 10) {
            title = desc.substring(0, 50);
          }
        }
        
        // Extract price - look for strong tags with price
        let price = '';
        
        // First look for the main price display
        $prod('strong').each((i, el) => {
          const text = $prod(el).text();
          const match = text.match(/(\d{1,3}(?:,\d{3})*)\s*원/);
          if (match && !price && !text.includes('배송비')) {
            price = match[0];
          }
        });
        
        // If not found, look in table cells
        if (!price) {
          $prod('td').each((i, el) => {
            const text = $prod(el).text();
            const match = text.match(/(\d{1,3}(?:,\d{3})*)\s*원/);
            if (match && !price && !text.includes('배송비') && !text.includes('적립금')) {
              price = match[0];
            }
          });
        }
        
        // Extract image
        let image = '';
        const imgElement = $prod('img[src*="/data/item/"]').first();
        if (imgElement.length > 0) {
          const src = imgElement.attr('src');
          if (src) {
            image = src.startsWith('http') ? src : baseUrl + src;
          }
        }
        
        // Determine category based on title and content
        let category = '청도특산물';
        const titleLower = title.toLowerCase();
        const pageText = $prod('body').text().toLowerCase();
        
        if (titleLower.includes('감말랭이') || titleLower.includes('반건시') || titleLower.includes('곶감')) {
          category = '가공식품';
        } else if (titleLower.includes('복숭아') || titleLower.includes('사과') || pageText.includes('과일')) {
          category = '과일류';
        } else if (titleLower.includes('미나리') || titleLower.includes('한재') || pageText.includes('채소')) {
          category = '채소류';
        } else if (titleLower.includes('한우') || titleLower.includes('축산')) {
          category = '축산물';
        } else if (titleLower.includes('식초') || titleLower.includes('장류') || titleLower.includes('김치')) {
          category = '김치/장류';
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
        await new Promise(resolve => setTimeout(resolve, 1000));
        
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
scrapeCdmallFixed().catch(console.error);