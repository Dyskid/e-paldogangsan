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

async function scrapeCdmallProducts() {
  const baseUrl = 'https://cdmall.cyso.co.kr';
  const mallName = '청도몰';
  const mallId = 'cdmall';
  
  console.log(`Starting comprehensive scraping for ${mallName}...`);
  
  const products: Product[] = [];
  const visitedUrls = new Set<string>();
  
  try {
    // Strategy 1: Search for key terms (청도 specialty products)
    const searchTerms = ['청도', '감말랭이', '반건시', '한재미나리', '복숭아', '감', '사과'];
    
    for (const term of searchTerms) {
      console.log(`\nSearching for: ${term}`);
      const searchUrl = `${baseUrl}/shop/search.php?sfl=wr_subject&sop=and&q=${encodeURIComponent(term)}`;
      
      try {
        const response = await axios.get(searchUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          timeout: 30000
        });
        
        const $ = cheerio.load(response.data);
        
        // Find product links
        $('a[href*="shop/item.php?it_id="]').each((i, el) => {
          const href = $(el).attr('href');
          if (href) {
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
    
    // Strategy 2: Browse main categories
    const categories = [
      { name: '과일류', url: '/shop/list.php?ca_id=10' },
      { name: '채소류', url: '/shop/list.php?ca_id=20' },
      { name: '축산물', url: '/shop/list.php?ca_id=30' },
      { name: '가공식품', url: '/shop/list.php?ca_id=40' },
      { name: '김치/장류', url: '/shop/list.php?ca_id=50' },
      { name: '특산물', url: '/shop/list.php?ca_id=70' }
    ];
    
    for (const category of categories) {
      console.log(`\nBrowsing category: ${category.name}`);
      const categoryUrl = baseUrl + category.url;
      
      try {
        const response = await axios.get(categoryUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          timeout: 30000
        });
        
        const $ = cheerio.load(response.data);
        
        // Find product links
        $('a[href*="shop/item.php?it_id="]').each((i, el) => {
          const href = $(el).attr('href');
          if (href) {
            const fullUrl = href.startsWith('http') ? href : baseUrl + href;
            if (!visitedUrls.has(fullUrl)) {
              visitedUrls.add(fullUrl);
            }
          }
        });
      } catch (error) {
        console.error(`Error browsing category ${category.name}:`, error);
      }
    }
    
    console.log(`\nFound ${visitedUrls.size} unique product URLs`);
    console.log('Now scraping product details...');
    
    // Scrape each product
    let scrapedCount = 0;
    for (const productUrl of visitedUrls) {
      if (scrapedCount >= 50) break; // Limit for comprehensive scraper
      
      try {
        console.log(`Scraping product ${scrapedCount + 1}/${Math.min(visitedUrls.size, 50)}: ${productUrl}`);
        
        const response = await axios.get(productUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          timeout: 30000
        });
        
        const $ = cheerio.load(response.data);
        
        // Extract product ID from URL
        const idMatch = productUrl.match(/it_id=(\d+)/);
        const productId = idMatch ? idMatch[1] : '';
        
        // Extract title (multiple strategies)
        let title = '';
        const titleSelectors = ['h1', '.it_name', 'title', '[class*="title"]'];
        for (const selector of titleSelectors) {
          const element = $(selector);
          if (element.length > 0) {
            const text = element.first().text().trim();
            if (text && text.length > 5 && !text.includes('청리브')) {
              title = text;
              break;
            }
          }
        }
        
        // Clean title
        if (title.includes(' - ')) {
          title = title.split(' - ')[0].trim();
        }
        
        // Extract price
        let price = '';
        const pricePatterns = [
          /(\d{1,3}(?:,\d{3})*)\s*원/,
          /판매가\s*:\s*([\d,]+원)/,
          /가격\s*:\s*([\d,]+원)/,
          /소비자가\s*:\s*([\d,]+원)/
        ];
        
        const bodyText = $('body').text();
        for (const pattern of pricePatterns) {
          const match = bodyText.match(pattern);
          if (match && match[0]) {
            price = match[0];
            break;
          }
        }
        
        // Extract image
        let image = '';
        const imageSelectors = [
          '.it_image img',
          '.product_image img',
          '.item_image img',
          '[class*="image"] img',
          'img[src*="item"]',
          'img[src*="product"]'
        ];
        
        for (const selector of imageSelectors) {
          const img = $(selector).first();
          if (img.length > 0) {
            const src = img.attr('src');
            if (src && !src.includes('no_image')) {
              image = src.startsWith('http') ? src : baseUrl + src;
              break;
            }
          }
        }
        
        // Determine category
        let category = '청도특산물';
        const breadcrumb = $('.breadcrumb').text().toLowerCase();
        const pageText = $('body').text().toLowerCase();
        
        if (breadcrumb.includes('과일') || pageText.includes('복숭아') || pageText.includes('사과')) {
          category = '과일류';
        } else if (breadcrumb.includes('채소') || pageText.includes('미나리')) {
          category = '채소류';
        } else if (breadcrumb.includes('축산') || pageText.includes('한우')) {
          category = '축산물';
        } else if (breadcrumb.includes('가공') || pageText.includes('말랭이') || pageText.includes('반건시')) {
          category = '가공식품';
        } else if (breadcrumb.includes('김치') || breadcrumb.includes('장류')) {
          category = '김치/장류';
        }
        
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
          scrapedCount++;
        }
        
        // Delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Error scraping product ${productUrl}:`, error);
      }
    }
    
    // Save the results
    const outputDir = path.join(process.cwd(), 'scripts/output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputPath = path.join(outputDir, 'cdmall-products.json');
    fs.writeFileSync(outputPath, JSON.stringify(products, null, 2));
    
    console.log(`\n=== Scraping Summary ===`);
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
scrapeCdmallProducts().catch(console.error);