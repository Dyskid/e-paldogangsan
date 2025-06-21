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

async function extractAllProductUrls(): Promise<Set<string>> {
  console.log('🔍 Extracting all product URLs from main page...');
  
  const response = await axios.get('http://www.osansemall.com/', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
    },
    timeout: 30000,
  });
  
  const $ = cheerio.load(response.data);
  const productUrls = new Set<string>();
  
  // Extract all product view URLs
  $('a[href*="goods/view"]').each((_, elem) => {
    const href = $(elem).attr('href');
    if (href && href.includes('no=')) {
      const fullUrl = href.startsWith('http') 
        ? href 
        : `http://www.osansemall.com${href}`;
      productUrls.add(fullUrl);
    }
  });
  
  console.log(`✅ Found ${productUrls.size} unique product URLs`);
  return productUrls;
}

async function scrapeProductFromMainPage(productUrl: string): Promise<OsansemallProduct | null> {
  try {
    const response = await axios.get('http://www.osansemall.com/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      timeout: 30000,
    });
    
    const $ = cheerio.load(response.data);
    
    // Find the product section that contains this URL
    const productSection = $(`a[href="${productUrl}"]`).closest('[class*="item"], .goods_list li, .product_list li');
    
    if (productSection.length === 0) {
      return null;
    }
    
    // Extract product information from the main page
    const name = productSection.find('a[href*="goods/view"]').text().trim() ||
                productSection.find('img').attr('alt') ||
                productSection.text().replace(/[\n\t]/g, ' ').trim().split(/\s+/).slice(0, 10).join(' ');
    
    // Extract price from the section
    const priceText = productSection.text();
    const priceMatch = priceText.match(/[\d,]+원/);
    const price = priceMatch ? parseInt(priceMatch[0].replace(/[^0-9]/g, '')) : 0;
    
    // Extract original price
    const originalPriceMatches = priceText.match(/[\d,]+원/g);
    let originalPrice: number | undefined;
    if (originalPriceMatches && originalPriceMatches.length > 1) {
      const prices = originalPriceMatches.map(p => parseInt(p.replace(/[^0-9]/g, '')));
      originalPrice = Math.max(...prices);
    }
    
    // Extract image
    const imgElem = productSection.find('img').first();
    let imageUrl = imgElem.attr('src') || '';
    
    if (imageUrl && !imageUrl.startsWith('http')) {
      imageUrl = imageUrl.startsWith('/') 
        ? `http://www.osansemall.com${imageUrl}` 
        : `http://www.osansemall.com/${imageUrl}`;
    }
    
    // Extract product ID
    const idMatch = productUrl.match(/no=(\d+)/);
    const productId = idMatch ? idMatch[1] : Math.random().toString();
    
    if (!name || name.length < 3) {
      return null;
    }
    
    const product: OsansemallProduct = {
      id: `osansemall-${productId}`,
      name,
      price,
      originalPrice,
      image: imageUrl,
      category: '종합상품', // Will be categorized later
      region: '경기도',
      url: productUrl,
      description: name,
      tags: ['오산함께장터', '전통시장', '경기도', '오산시'],
      isFeatured: false,
      isNew: false,
      mall: {
        mallId: 'osansemall',
        mallName: '오산함께장터',
        mallUrl: 'http://www.osansemall.com',
        region: '경기도'
      }
    };
    
    return product;
    
  } catch (error) {
    console.error(`Error scraping product from main page: ${error.message}`);
    return null;
  }
}

async function scrapeProductDetails(product: OsansemallProduct): Promise<OsansemallProduct> {
  try {
    console.log(`📋 Fetching details for: ${product.name.substring(0, 50)}...`);
    
    const response = await axios.get(product.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      timeout: 30000,
    });
    
    const $ = cheerio.load(response.data);
    
    // Extract better product name
    const betterName = $('h1, h2, .product-name, .goods-name, [class*="name"]').first().text().trim();
    if (betterName && betterName.length > product.name.length) {
      product.name = betterName;
      product.description = betterName;
    }
    
    // Extract detailed price
    const priceElements = $('.price, .cost, [class*="price"]');
    const priceText = priceElements.text() || $('body').text();
    
    const priceMatch = priceText.match(/[\d,]+원/);
    if (priceMatch && parseInt(priceMatch[0].replace(/[^0-9]/g, '')) > 0) {
      product.price = parseInt(priceMatch[0].replace(/[^0-9]/g, ''));
    }
    
    // Extract original price
    const allPrices = priceText.match(/[\d,]+원/g);
    if (allPrices && allPrices.length > 1) {
      const prices = allPrices.map(p => parseInt(p.replace(/[^0-9]/g, '')));
      product.originalPrice = Math.max(...prices);
    }
    
    // Extract better image
    const mainImages = $('.product-image img, .goods-image img, .detail-image img');
    if (mainImages.length > 0) {
      const src = mainImages.first().attr('src');
      if (src) {
        product.image = src.startsWith('http') 
          ? src 
          : `http://www.osansemall.com${src.startsWith('/') ? '' : '/'}${src}`;
      }
    }
    
    // Categorize based on product name
    const nameText = product.name.toLowerCase();
    if (nameText.includes('두부') || nameText.includes('두유') || nameText.includes('콩')) {
      product.category = '농수산물';
    } else if (nameText.includes('막걸리') || nameText.includes('전통주') || nameText.includes('소주')) {
      product.category = '전통주';
    } else if (nameText.includes('고추장') || nameText.includes('된장') || nameText.includes('청')) {
      product.category = '가공식품';
    } else if (nameText.includes('찹쌀파이') || nameText.includes('과자') || nameText.includes('쿠키')) {
      product.category = '과자류';
    } else if (nameText.includes('비누') || nameText.includes('캔들') || nameText.includes('디퓨저')) {
      product.category = '생활용품';
    } else if (nameText.includes('마스크') || nameText.includes('필터')) {
      product.category = '위생용품';
    } else {
      product.category = '기타';
    }
    
    // Update tags based on category
    product.tags = [
      '오산함께장터',
      '전통시장',
      '경기도',
      '오산시',
      product.category
    ];
    
    return product;
    
  } catch (error) {
    console.error(`Error fetching product details for ${product.url}:`, error);
    return product;
  }
}

async function scrapeOsansemallProducts() {
  console.log('🛒 Starting osansemall.com product scraping...');
  
  // Extract all product URLs from main page
  const productUrls = await extractAllProductUrls();
  const allProducts: OsansemallProduct[] = [];
  
  console.log(`\n📊 Processing ${productUrls.size} product URLs...`);
  
  let processedCount = 0;
  for (const productUrl of Array.from(productUrls)) {
    try {
      // Extract basic info from main page
      const basicProduct = await scrapeProductFromMainPage(productUrl);
      
      if (basicProduct) {
        // Get detailed information
        const detailedProduct = await scrapeProductDetails(basicProduct);
        
        if (detailedProduct.price > 0 && detailedProduct.name.trim().length > 0) {
          allProducts.push(detailedProduct);
          console.log(`✅ ${allProducts.length}. ${detailedProduct.name.substring(0, 50)} - ₩${detailedProduct.price.toLocaleString()}`);
        }
      }
      
      processedCount++;
      if (processedCount % 5 === 0) {
        console.log(`📊 Processed ${processedCount}/${productUrls.size} URLs...`);
      }
      
      await delay(1000); // Be respectful to the server
      
    } catch (error) {
      console.error(`Error processing ${productUrl}:`, error.message);
    }
  }
  
  console.log(`\n✅ Total products with valid data: ${allProducts.length}`);
  
  // Save products
  const outputPath = path.join(__dirname, 'output', 'osansemall-products.json');
  fs.writeFileSync(outputPath, JSON.stringify(allProducts, null, 2));
  
  // Save summary
  const summary = {
    mallName: '오산함께장터',
    totalUrlsFound: productUrls.size,
    totalProducts: allProducts.length,
    productsWithPrice: allProducts.filter(p => p.price > 0).length,
    productsWithImage: allProducts.filter(p => p.image).length,
    categories: [...new Set(allProducts.map(p => p.category))],
    priceRange: allProducts.length > 0 ? {
      min: Math.min(...allProducts.map(p => p.price)),
      max: Math.max(...allProducts.map(p => p.price)),
      average: Math.round(allProducts.reduce((sum, p) => sum + p.price, 0) / allProducts.length)
    } : null,
    scrapedAt: new Date().toISOString()
  };
  
  fs.writeFileSync(
    path.join(__dirname, 'output', 'osansemall-scrape-summary.json'),
    JSON.stringify(summary, null, 2)
  );
  
  return { products: allProducts, summary };
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