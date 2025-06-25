import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';

interface Product {
  id: string;
  title: string;
  price: string;
  originalPrice?: string;
  image: string;
  url: string;
  category: string;
  description?: string;
  inStock?: boolean;
  mall: string;
  region: string;
  tags: string[];
}

async function scrapeBoseongProducts() {
  const baseUrl = 'https://boseongmall.co.kr';
  const products: Product[] = [];
  const errors: string[] = [];
  
  try {
    console.log('🚀 Starting Boseong Mall fixed scraping...');
    
    // Scrape the homepage for featured products
    console.log('\n🏠 Scraping homepage products...');
    const homepageResponse = await axios.get(baseUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 30000
    });
    
    const $homepage = cheerio.load(homepageResponse.data);
    
    // Extract products from homepage
    $homepage('ul.prdList li.xans-record-').each((index, element) => {
      try {
        const $item = $homepage(element);
        
        // Extract product link
        const productLink = $item.find('a').first().attr('href');
        if (!productLink) return;
        
        const fullUrl = productLink.startsWith('http') ? productLink : new URL(productLink, baseUrl).href;
        
        // Extract title from img alt attribute (cleanest source)
        const imgAlt = $item.find('img').first().attr('alt') || '';
        const title = cleanTitle(imgAlt);
        
        // Extract price from the product_price li element  
        const priceText = $item.find('li.product_price').text().trim();
        const price = cleanPrice(priceText);
        
        let image = $item.find('img').first().attr('src') || '';
        if (image && !image.startsWith('http')) {
          image = image.startsWith('//') ? 'https:' + image : new URL(image, baseUrl).href;
        }
        
        if (title && price && image && fullUrl && title.length > 3) {
          const productId = extractProductId(fullUrl);
          products.push({
            id: productId,
            title: title,
            price: price,
            image: image,
            url: fullUrl,
            category: categorizeProduct(title),
            mall: '보성몰',
            region: '전남',
            tags: generateTags(title),
            inStock: true
          });
        }
      } catch (error) {
        console.error(`❌ Error processing homepage product ${index}:`, error);
        errors.push(`Homepage product ${index}: ${error}`);
      }
    });
    
    console.log(`✅ Found ${products.length} products from homepage`);
    
    // Try to scrape from main product listing page for additional products
    console.log('\n📦 Scraping product listing page...');
    try {
      const listUrl = `${baseUrl}/product/list.html`;
      const listResponse = await axios.get(listUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 30000
      });
      
      const $list = cheerio.load(listResponse.data);
      let newProductsCount = 0;
      
      // Extract products from listing page
      $list('ul.prdList li.xans-record-, .xans-product-normalpackage .xans-record-').each((index, element) => {
        try {
          const $item = $list(element);
          
          const productLink = $item.find('a').first().attr('href');
          if (!productLink) return;
          
          const fullUrl = productLink.startsWith('http') ? productLink : new URL(productLink, baseUrl).href;
          
          // Skip if we already have this product
          const productId = extractProductId(fullUrl);
          if (products.some(p => p.id === productId)) return;
          
          // Extract title from img alt attribute
          const imgAlt = $item.find('img').first().attr('alt') || '';
          const title = cleanTitle(imgAlt);
          
          // Extract price from the product_price li element  
          const priceText = $item.find('li.product_price').text().trim();
          const price = cleanPrice(priceText);
          
          let image = $item.find('img').first().attr('src') || '';
          if (image && !image.startsWith('http')) {
            image = image.startsWith('//') ? 'https:' + image : new URL(image, baseUrl).href;
          }
          
          if (title && price && image && fullUrl && title.length > 3) {
            products.push({
              id: productId,
              title: title,
              price: price,
              image: image,
              url: fullUrl,
              category: categorizeProduct(title),
              mall: '보성몰',
              region: '전남',
              tags: generateTags(title),
              inStock: true
            });
            newProductsCount++;
          }
        } catch (error) {
          console.error(`❌ Error processing list product ${index}:`, error);
          errors.push(`List product ${index}: ${error}`);
        }
      });
      
      console.log(`✅ Found ${newProductsCount} additional products from listing page`);
      
    } catch (error) {
      console.error('❌ Error scraping product listing page:', error);
      errors.push(`Listing page error: ${error}`);
    }
    
    console.log(`\n🎯 Total unique products found: ${products.length}`);
    
    // Save results
    const summary = {
      totalProducts: products.length,
      mall: '보성몰',
      region: '전남',
      baseUrl: baseUrl,
      categories: [...new Set(products.map(p => p.category))],
      scrapeDate: new Date().toISOString(),
      errors: errors,
      sampleProducts: products.slice(0, 5).map(p => ({ title: p.title, price: p.price, category: p.category }))
    };
    
    fs.writeFileSync('./scripts/output/boseong-products.json', JSON.stringify(products, null, 2));
    fs.writeFileSync('./scripts/output/boseong-scrape-summary.json', JSON.stringify(summary, null, 2));
    
    console.log('\n📊 Scraping Summary:');
    console.log(`Total products: ${products.length}`);
    console.log(`Categories: ${summary.categories.join(', ')}`);
    console.log(`Errors: ${errors.length}`);
    console.log('Sample products:');
    summary.sampleProducts.forEach((p, i) => {
      console.log(`  ${i+1}. ${p.title} - ${p.price} (${p.category})`);
    });
    console.log('✅ Results saved to boseong-products.json and boseong-scrape-summary.json');
    
    return products;
    
  } catch (error) {
    console.error('❌ Fatal error during scraping:', error);
    throw error;
  }
}

function extractProductId(url: string): string {
  // Extract product ID from URL like: /product/name/2612/category/1/display/13/
  const match = url.match(/\/(\d+)\//);
  return match ? `boseong-${match[1]}` : `boseong-${Date.now()}`;
}

function cleanTitle(title: string): string {
  if (!title) return '';
  
  return title
    .replace(/\s+/g, ' ')
    .replace(/[\n\r\t]/g, ' ')
    .trim();
}

function cleanPrice(priceText: string): string {
  if (!priceText) return '';
  
  // Extract price from text like "판매가 :10,000원"
  const priceMatch = priceText.match(/[\d,]+원/);
  if (priceMatch) {
    return priceMatch[0];
  }
  
  // Fallback: clean up general price text
  return priceText
    .replace(/[^\d,원]/g, '')
    .replace(/,/g, '')
    .replace(/원.*/, '원')
    .trim();
}

function categorizeProduct(title: string): string {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('감자') || titleLower.includes('고구마') || titleLower.includes('양파') || 
      titleLower.includes('마늘') || titleLower.includes('배추') || titleLower.includes('무') ||
      titleLower.includes('시래기')) {
    return '채소';
  }
  
  if (titleLower.includes('사과') || titleLower.includes('배') || titleLower.includes('포도') || 
      titleLower.includes('감') || titleLower.includes('복숭아') || titleLower.includes('딸기')) {
    return '과일';
  }
  
  if (titleLower.includes('쌀') || titleLower.includes('잡곡') || titleLower.includes('콩') || 
      titleLower.includes('보리') || titleLower.includes('현미')) {
    return '곡물';
  }
  
  if (titleLower.includes('버섯') || titleLower.includes('표고') || titleLower.includes('느타리') || 
      titleLower.includes('송이') || titleLower.includes('참송이')) {
    return '버섯';
  }
  
  if (titleLower.includes('차') || titleLower.includes('녹차') || titleLower.includes('홍차') || 
      titleLower.includes('발효') || titleLower.includes('즙') || titleLower.includes('캔') ||
      titleLower.includes('티백')) {
    return '가공식품';
  }
  
  return '농산물';
}

function generateTags(title: string): string[] {
  const tags = ['농산물', '전남', '보성'];
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('무농약') || titleLower.includes('친환경') || titleLower.includes('유기농')) {
    tags.push('친환경');
  }
  
  if (titleLower.includes('햇') || titleLower.includes('신선') || titleLower.includes('당일')) {
    tags.push('신선');
  }
  
  if (titleLower.includes('국산') || titleLower.includes('우리')) {
    tags.push('국산');
  }
  
  if (titleLower.includes('감자')) tags.push('감자');
  if (titleLower.includes('고구마')) tags.push('고구마');
  if (titleLower.includes('버섯')) tags.push('버섯');
  if (titleLower.includes('차') || titleLower.includes('녹차')) tags.push('차');
  if (titleLower.includes('쌀')) tags.push('쌀');
  
  return tags;
}

// Run the scraper
scrapeBoseongProducts()
  .then((products) => {
    console.log(`\n🎉 Successfully scraped ${products.length} products from Boseong Mall!`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Scraping failed:', error.message);
    process.exit(1);
  });