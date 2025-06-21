import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

interface OsansemallProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  region: string;
  url: string;
  description: string;
  tags: string[];
  isFeatured: boolean;
  isNew: boolean;
  mall: {
    mallId: string;
    mallName: string;
    mallUrl: string;
    region: string;
  };
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function extractProductUrls(): Promise<string[]> {
  console.log('🔍 Extracting product URLs from main page...');
  
  const response = await axios.get('http://www.osansemall.com/', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    timeout: 30000,
  });
  
  const $ = cheerio.load(response.data);
  const productUrls: string[] = [];
  
  // Extract all product view URLs
  $('a[href*="goods/view"]').each((_, elem) => {
    const href = $(elem).attr('href');
    if (href && href.includes('no=')) {
      const fullUrl = href.startsWith('http') 
        ? href 
        : `http://www.osansemall.com${href}`;
      if (!productUrls.includes(fullUrl)) {
        productUrls.push(fullUrl);
      }
    }
  });
  
  console.log(`✅ Found ${productUrls.length} product URLs`);
  return productUrls;
}

async function scrapeProductPage(productUrl: string): Promise<OsansemallProduct | null> {
  try {
    console.log(`📋 Scraping: ${productUrl}`);
    
    const response = await axios.get(productUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      timeout: 30000,
    });
    
    const $ = cheerio.load(response.data);
    
    // Extract product name - try multiple selectors
    const nameSelectors = [
      'h1', 'h2', '.product-name', '.goods-name', '.item-name',
      '[class*="title"]', '[class*="name"]', '.subject'
    ];
    
    let name = '';
    for (const selector of nameSelectors) {
      const element = $(selector).first();
      const text = element.text().trim();
      if (text && text.length > name.length) {
        name = text;
      }
    }
    
    // If no specific name found, try to extract from page title or meta
    if (!name) {
      name = $('title').text().replace('오산함께장터', '').trim() ||
             $('meta[property="og:title"]').attr('content') ||
             '';
    }
    
    if (!name || name.length < 3) {
      console.log(`❌ No valid name found for ${productUrl}`);
      return null;
    }
    
    // Extract price - look for Korean won patterns
    const priceSelectors = [
      '.price', '.cost', '[class*="price"]', '[class*="cost"]',
      '.amount', '.money', '[class*="amount"]'
    ];
    
    let priceText = '';
    for (const selector of priceSelectors) {
      const text = $(selector).text();
      if (text.includes('원')) {
        priceText += ' ' + text;
      }
    }
    
    // If no price in specific elements, search the whole page
    if (!priceText.includes('원')) {
      priceText = $('body').text();
    }
    
    const priceMatches = priceText.match(/[\d,]+원/g);
    let price = 0;
    let originalPrice: number | undefined;
    
    if (priceMatches && priceMatches.length > 0) {
      const prices = priceMatches.map(p => parseInt(p.replace(/[^0-9]/g, ''))).filter(p => p > 0);
      if (prices.length > 0) {
        price = Math.min(...prices); // Take the lower price as selling price
        if (prices.length > 1) {
          originalPrice = Math.max(...prices); // Higher price as original
        }
      }
    }
    
    // Extract image
    const imageSelectors = [
      '.product-image img', '.goods-image img', '.item-image img',
      '.main-image img', '[class*="image"] img', 'img[src*="goods"]'
    ];
    
    let imageUrl = '';
    for (const selector of imageSelectors) {
      const src = $(selector).first().attr('src');
      if (src && !src.includes('logo') && !src.includes('banner')) {
        imageUrl = src.startsWith('http') 
          ? src 
          : `http://www.osansemall.com${src.startsWith('/') ? '' : '/'}${src}`;
        break;
      }
    }
    
    // If no specific product image, try any image
    if (!imageUrl) {
      $('img').each((_, elem) => {
        const src = $(elem).attr('src');
        const alt = $(elem).attr('alt');
        if (src && alt && !src.includes('logo') && !src.includes('banner') && !src.includes('icon')) {
          imageUrl = src.startsWith('http') 
            ? src 
            : `http://www.osansemall.com${src.startsWith('/') ? '' : '/'}${src}`;
          return false; // Break the loop
        }
      });
    }
    
    // Extract description
    const descSelectors = [
      '.description', '.desc', '.detail', '.content',
      '[class*="desc"]', '[class*="detail"]', '[class*="content"]'
    ];
    
    let description = name;
    for (const selector of descSelectors) {
      const text = $(selector).first().text().trim();
      if (text && text.length > description.length && text.length < 500) {
        description = text;
      }
    }
    
    // Extract product ID
    const idMatch = productUrl.match(/no=(\d+)/);
    const productId = idMatch ? idMatch[1] : Math.random().toString();
    
    // Categorize based on product name
    const nameText = name.toLowerCase();
    let category = '기타';
    if (nameText.includes('두부') || nameText.includes('두유') || nameText.includes('콩')) {
      category = '농수산물';
    } else if (nameText.includes('막걸리') || nameText.includes('전통주') || nameText.includes('소주')) {
      category = '전통주';
    } else if (nameText.includes('고추장') || nameText.includes('된장') || nameText.includes('청')) {
      category = '가공식품';
    } else if (nameText.includes('찹쌀파이') || nameText.includes('과자') || nameText.includes('쿠키')) {
      category = '과자류';
    } else if (nameText.includes('비누') || nameText.includes('캔들') || nameText.includes('디퓨저')) {
      category = '생활용품';
    } else if (nameText.includes('마스크') || nameText.includes('필터')) {
      category = '위생용품';
    } else if (nameText.includes('체험') || nameText.includes('교육') || nameText.includes('프로그램')) {
      category = '체험/교육';
    }
    
    const product: OsansemallProduct = {
      id: `osansemall-${productId}`,
      name,
      price,
      originalPrice,
      image: imageUrl,
      category,
      region: '경기도',
      url: productUrl,
      description,
      tags: ['오산함께장터', '전통시장', '경기도', '오산시', category],
      isFeatured: false,
      isNew: false,
      mall: {
        mallId: 'osansemall',
        mallName: '오산함께장터',
        mallUrl: 'http://www.osansemall.com',
        region: '경기도'
      }
    };
    
    console.log(`✅ ${name.substring(0, 50)} - ₩${price.toLocaleString()}`);
    return product;
    
  } catch (error) {
    console.error(`❌ Error scraping ${productUrl}:`, error.message);
    return null;
  }
}

async function scrapeOsansemallProducts() {
  console.log('🛒 Starting osansemall.com direct product scraping...');
  
  // Extract product URLs
  const productUrls = await extractProductUrls();
  const allProducts: OsansemallProduct[] = [];
  
  console.log(`\n📊 Scraping ${productUrls.length} product pages...`);
  
  for (let i = 0; i < productUrls.length; i++) {
    const productUrl = productUrls[i];
    
    try {
      const product = await scrapeProductPage(productUrl);
      
      if (product && product.price > 0 && product.name.trim().length > 0) {
        allProducts.push(product);
      }
      
      if ((i + 1) % 5 === 0) {
        console.log(`📊 Processed ${i + 1}/${productUrls.length} pages...`);
      }
      
      await delay(1500); // Be respectful to the server
      
    } catch (error) {
      console.error(`Error processing ${productUrl}:`, error.message);
    }
  }
  
  console.log(`\n✅ Total products with valid data: ${allProducts.length}`);
  
  // Filter out duplicates by name
  const uniqueProducts = allProducts.filter((product, index, array) => 
    array.findIndex(p => p.name.toLowerCase() === product.name.toLowerCase()) === index
  );
  
  console.log(`✅ Unique products after deduplication: ${uniqueProducts.length}`);
  
  // Save products
  const outputPath = path.join(__dirname, 'output', 'osansemall-products.json');
  fs.writeFileSync(outputPath, JSON.stringify(uniqueProducts, null, 2));
  
  // Save summary
  const summary = {
    mallName: '오산함께장터',
    totalUrlsProcessed: productUrls.length,
    totalProducts: uniqueProducts.length,
    productsWithPrice: uniqueProducts.filter(p => p.price > 0).length,
    productsWithImage: uniqueProducts.filter(p => p.image).length,
    categories: [...new Set(uniqueProducts.map(p => p.category))],
    priceRange: uniqueProducts.length > 0 ? {
      min: Math.min(...uniqueProducts.map(p => p.price)),
      max: Math.max(...uniqueProducts.map(p => p.price)),
      average: Math.round(uniqueProducts.reduce((sum, p) => sum + p.price, 0) / uniqueProducts.length)
    } : null,
    sampleProducts: uniqueProducts.slice(0, 5).map(p => ({
      name: p.name,
      price: p.price,
      category: p.category
    })),
    scrapedAt: new Date().toISOString()
  };
  
  fs.writeFileSync(
    path.join(__dirname, 'output', 'osansemall-scrape-summary.json'),
    JSON.stringify(summary, null, 2)
  );
  
  return { products: uniqueProducts, summary };
}

// Run the scraper
scrapeOsansemallProducts()
  .then(({ summary }) => {
    console.log('\n✅ Scraping complete!');
    console.log(`📄 Products saved to: osansemall-products.json`);
    console.log(`📊 Summary saved to: osansemall-scrape-summary.json`);
  })
  .catch(error => {
    console.error('❌ Scraping failed:', error);
  });