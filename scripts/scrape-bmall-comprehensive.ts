import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

interface Product {
  id: string;
  name: string;
  price: string;
  image: string;
  mallId: string;
  mallName: string;
  url: string;
}

async function scrapeBmall() {
  console.log('Starting comprehensive scrape of 봉화장터...');
  
  const baseUrl = 'https://bmall.cyso.co.kr';
  const products: Product[] = [];
  
  try {
    const response = await axios.get(baseUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    const productUrls: string[] = [];
    
    // Extract product URLs from homepage
    $('a[href*="shop/item.php?it_id="]').each((i, elem) => {
      const href = $(elem).attr('href');
      if (href) {
        const cleanUrl = href.replace(/javascript:[^']*'([^']*)'.*/, '$1');
        if (cleanUrl.includes('shop/item.php?it_id=')) {
          const fullUrl = cleanUrl.startsWith('http') ? cleanUrl : baseUrl + '/' + cleanUrl.replace(/^\//, '');
          productUrls.push(fullUrl);
        }
      }
    });
    
    console.log(`Found ${productUrls.length} product URLs`);
    
    // Remove duplicates
    const uniqueUrls = [...new Set(productUrls)];
    console.log(`Processing ${uniqueUrls.length} unique products...`);
    
    for (let i = 0; i < Math.min(uniqueUrls.length, 50); i++) {
      const productUrl = uniqueUrls[i];
      console.log(`Scraping product ${i + 1}/50: ${productUrl}`);
      
      try {
        const productResponse = await axios.get(productUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          timeout: 10000
        });
        
        const product$ = cheerio.load(productResponse.data);
        
        // Extract product name
        let productName = product$('#sit_title').text().trim() || 
                         product$('h2#sit_title').text().trim() ||
                         product$('#sit_desc').text().trim() ||
                         product$('p#sit_desc').text().trim() ||
                         product$('.item_title').text().trim();
        
        if (!productName) {
          console.log(`No title found for ${productUrl}, skipping...`);
          continue;
        }
        
        // Clean title
        productName = productName.replace(/\s+/g, ' ').trim();
        
        // Extract price - 봉화장터 uses same CYSO structure
        let price = '';
        
        // Check JavaScript variables first (most reliable for CYSO platforms)
        const scriptContent = productResponse.data;
        const priceMatch = scriptContent.match(/var labbit_price = parseInt\('(\d+)'\)/);
        if (priceMatch) {
          price = parseInt(priceMatch[1]).toLocaleString() + '원';
        }
        
        // Fallback to HTML extraction
        if (!price) {
          const priceTexts = [
            product$('td:contains("원")').text(),
            product$('th:contains("판매가격")').next('td').text(),
            product$('.price').text(),
            product$('.item_price').text(),
            product$('#sit_price').text(),
            product$('.shop_price').text()
          ];
          
          for (const priceText of priceTexts) {
            if (priceText) {
              const pricePatternMatch = priceText.match(/[\d,]+원/);
              if (pricePatternMatch) {
                price = pricePatternMatch[0];
                break;
              }
            }
          }
        }
        
        // Extract image
        let imageUrl = '';
        const imgSrc = product$('#sit_pvi img').attr('src') || 
                      product$('.item_image img').attr('src') ||
                      product$('.product_image img').attr('src');
        
        if (imgSrc) {
          imageUrl = imgSrc.startsWith('http') ? imgSrc : baseUrl + '/' + imgSrc.replace(/^\//, '');
        }
        
        // Extract product ID from URL
        const productIdMatch = productUrl.match(/it_id=([^&]+)/);
        const productId = productIdMatch ? productIdMatch[1] : `bmall_${Date.now()}_${i}`;
        
        if (productName && price) {
          products.push({
            id: productId,
            name: productName,
            price,
            image: imageUrl,
            mallId: 'bmall',
            mallName: '봉화장터',
            url: productUrl
          });
          
          console.log(`✓ Product added: ${productName} - ${price}`);
        } else {
          console.log(`⚠ Incomplete data for ${productName || 'Unknown'} - Name: ${!!productName}, Price: ${!!price}`);
        }
        
        // Add delay to be respectful
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Error scraping product ${productUrl}:`, error);
        continue;
      }
    }
    
    console.log(`\n=== Scraping Summary ===`);
    console.log(`Total products scraped: ${products.length}`);
    console.log(`Products with prices: ${products.filter(p => p.price).length}`);
    console.log(`Products with images: ${products.filter(p => p.image).length}`);
    
    // Group by first word for category analysis
    const categoryGroups: { [key: string]: number } = {};
    products.forEach(product => {
      const firstWord = product.name.split(' ')[0] || product.name.split('')[0];
      categoryGroups[firstWord] = (categoryGroups[firstWord] || 0) + 1;
    });
    
    console.log('\n=== Category Distribution ===');
    Object.entries(categoryGroups)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .forEach(([category, count]) => {
        console.log(`${category}: ${count}개`);
      });
    
    // Save results
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputFile = path.join(outputDir, 'bmall-products.json');
    fs.writeFileSync(outputFile, JSON.stringify(products, null, 2));
    
    const summaryFile = path.join(outputDir, 'bmall-scrape-summary.json');
    fs.writeFileSync(summaryFile, JSON.stringify({
      mallId: 'bmall',
      mallName: '봉화장터',
      baseUrl,
      timestamp: new Date().toISOString(),
      totalProducts: products.length,
      productsWithPrices: products.filter(p => p.price).length,
      productsWithImages: products.filter(p => p.image).length,
      categories: categoryGroups,
      sampleProducts: products.slice(0, 5)
    }, null, 2));
    
    console.log(`\n✅ Results saved to:`);
    console.log(`📄 Products: ${outputFile}`);
    console.log(`📊 Summary: ${summaryFile}`);
    
    return products;
    
  } catch (error) {
    console.error('Error during scraping:', error);
    throw error;
  }
}

if (require.main === module) {
  scrapeBmall().catch(console.error);
}

export { scrapeBmall };