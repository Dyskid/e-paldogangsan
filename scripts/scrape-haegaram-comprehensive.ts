import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import { existsSync } from 'fs';

interface Product {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  productUrl: string;
  category: string;
  mall: string;
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, maxRetries = 3): Promise<string> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Cache-Control': 'max-age=0'
        },
        timeout: 30000
      });
      return response.data;
    } catch (error) {
      console.error(`Attempt ${i + 1} failed for ${url}:`, error.message);
      if (i === maxRetries - 1) throw error;
      await delay(2000 * (i + 1)); // Exponential backoff
    }
  }
  throw new Error('Max retries exceeded');
}

function extractPrice(priceText: string): number {
  // Remove all non-numeric characters except comma and period
  const cleanedText = priceText.replace(/[^0-9,.-]/g, '');
  // Remove commas
  const priceStr = cleanedText.replace(/,/g, '');
  const price = parseInt(priceStr);
  return isNaN(price) ? 0 : price;
}

async function scrapeProductDetails(productUrl: string): Promise<Product | null> {
  try {
    console.log(`  Fetching product: ${productUrl}`);
    const html = await fetchWithRetry(productUrl);
    const $ = cheerio.load(html);
    
    // Extract product ID from URL
    const urlMatch = productUrl.match(/\/product\/[^\/]+\/(\d+)\//);
    const productId = urlMatch ? urlMatch[1] : '';
    
    // Extract title - first try meta tags
    let title = '';
    
    // Try meta og:title first (most reliable for this site)
    const metaTitle = $('meta[property="og:title"]').attr('content');
    if (metaTitle) {
      title = metaTitle.trim();
    }
    
    // If no meta title, try image alt text
    if (!title) {
      const imgAlt = $('.keyImg img, .bigImage img').first().attr('alt');
      if (imgAlt) {
        title = imgAlt.trim();
      }
    }
    
    // Finally try regular title selectors
    if (!title) {
      const titleSelectors = [
        '.headingArea h2',
        '.infoArea h2',
        'h1.product-name',
        'h2.product-name',
        '.product_name',
        '.name h3',
        '.name'
      ];
      
      for (const selector of titleSelectors) {
        const elem = $(selector).first();
        if (elem.length > 0 && elem.text().trim() && elem.text().trim() !== 'VIEW') {
          title = elem.text().trim();
          break;
        }
      }
    }
    
    // Extract price
    let price = 0;
    let originalPrice = 0;
    
    const priceSelectors = [
      '#span_product_price_text',
      '.real_price',
      'strong#span_product_price_text',
      '.price',
      '.product-price',
      '.selling-price',
      '.sale-price',
      '.infoArea .price',
      'span[id*="product_price"]'
    ];
    
    for (const selector of priceSelectors) {
      const elem = $(selector).first();
      if (elem.length > 0 && elem.text().trim()) {
        const priceText = elem.text().trim();
        price = extractPrice(priceText);
        if (price > 0) break;
      }
    }
    
    // Try to find original price
    const originalPriceSelectors = [
      '.custom',
      '.consumer',
      '.consumer_price',
      '.list_price',
      'span[id*="product_custom"]'
    ];
    
    for (const selector of originalPriceSelectors) {
      const elem = $(selector).first();
      if (elem.length > 0 && elem.text().trim()) {
        const priceText = elem.text().trim();
        originalPrice = extractPrice(priceText);
        if (originalPrice > 0) break;
      }
    }
    
    // Extract image
    let imageUrl = '';
    const imageSelectors = [
      '.bigImage img',
      '.keyImg img',
      '.imgArea img',
      '.product-image img',
      '.detail-image img',
      '#prdDetail img',
      '.xans-product-image img'
    ];
    
    for (const selector of imageSelectors) {
      const elem = $(selector).first();
      if (elem.length > 0 && elem.attr('src')) {
        imageUrl = elem.attr('src') || '';
        if (!imageUrl.startsWith('http')) {
          imageUrl = `https://haegaram.com${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
        }
        break;
      }
    }
    
    // Extract category from URL or page
    let category = '';
    const categoryMatch = productUrl.match(/category\/(\d+)\//);
    if (categoryMatch) {
      const categoryId = categoryMatch[1];
      const categoryMap: { [key: string]: string } = {
        '23': '생선/어패',
        '56': '건어물',
        '64': '해조류',
        '57': '젓갈/액젓'
      };
      category = categoryMap[categoryId] || '기타';
    }
    
    if (!title || price === 0) {
      console.log(`  ⚠️ Missing required data - Title: "${title}", Price: ${price}`);
      return null;
    }
    
    const product: Product = {
      id: `haegaram_${productId}`,
      title,
      price,
      imageUrl,
      productUrl,
      category,
      mall: '해가람'
    };
    
    if (originalPrice > price) {
      product.originalPrice = originalPrice;
    }
    
    console.log(`  ✓ ${title} - ${price.toLocaleString()}원`);
    return product;
    
  } catch (error) {
    console.error(`  ✗ Error scraping ${productUrl}:`, error.message);
    return null;
  }
}

async function scrapeCategory(categoryUrl: string, categoryName: string): Promise<Product[]> {
  const products: Product[] = [];
  const productUrls = new Set<string>();
  
  try {
    let page = 1;
    let hasNextPage = true;
    
    while (hasNextPage && page <= 10) { // Limit to 10 pages per category
      const pageUrl = `${categoryUrl}${categoryUrl.includes('?') ? '&' : '?'}page=${page}`;
      console.log(`\nFetching ${categoryName} page ${page}: ${pageUrl}`);
      
      try {
        const html = await fetchWithRetry(pageUrl);
        const $ = cheerio.load(html);
        
        // Extract product URLs
        const productSelectors = [
          '.xans-product-normalpackage .prdList .item a.prdImg',
          '.prdList li a[href*="/product/"]',
          '.product-item a[href*="/product/"]',
          'a[href*="/product/"][href*="/category/"]'
        ];
        
        let foundProducts = 0;
        for (const selector of productSelectors) {
          $(selector).each((_, elem) => {
            const href = $(elem).attr('href');
            if (href && href.includes('/product/') && !href.includes('##param##')) {
              const fullUrl = href.startsWith('http') ? href : `https://haegaram.com${href}`;
              productUrls.add(fullUrl);
              foundProducts++;
            }
          });
        }
        
        console.log(`Found ${foundProducts} products on page ${page}`);
        
        // Check if there's a next page
        const nextPageExists = $('.xans-product-normalpaging a').filter((_, el) => {
          const text = $(el).text().trim();
          return text === String(page + 1) || text.includes('다음');
        }).length > 0;
        
        hasNextPage = nextPageExists && foundProducts > 0;
        page++;
        
        // Add delay between pages
        await delay(1000);
        
      } catch (error) {
        console.error(`Error fetching page ${page}:`, error.message);
        hasNextPage = false;
      }
    }
    
    console.log(`\nTotal unique products found in ${categoryName}: ${productUrls.size}`);
    
    // Scrape each product
    let scraped = 0;
    for (const productUrl of productUrls) {
      const product = await scrapeProductDetails(productUrl);
      if (product) {
        product.category = categoryName; // Override with actual category name
        products.push(product);
        scraped++;
      }
      
      // Add delay between products
      await delay(500);
      
      // Progress update
      if (scraped % 10 === 0) {
        console.log(`Progress: ${scraped}/${productUrls.size} products scraped`);
      }
    }
    
  } catch (error) {
    console.error(`Error scraping category ${categoryName}:`, error);
  }
  
  return products;
}

async function scrapeHaegaram() {
  console.log('Starting Haegaram scraper...\n');
  
  const categories = [
    { url: 'https://haegaram.com/product/list.html?cate_no=23', name: '생선/어패' },
    { url: 'https://haegaram.com/product/list.html?cate_no=56', name: '건어물' },
    { url: 'https://haegaram.com/product/list.html?cate_no=64', name: '해조류' },
    { url: 'https://haegaram.com/product/list.html?cate_no=57', name: '젓갈/액젓' }
  ];
  
  const allProducts: Product[] = [];
  
  for (const category of categories) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`Scraping category: ${category.name}`);
    console.log(`${'='.repeat(50)}`);
    
    const products = await scrapeCategory(category.url, category.name);
    allProducts.push(...products);
    
    console.log(`\nCompleted ${category.name}: ${products.length} products with valid prices`);
    
    // Save intermediate results
    await fs.writeFile(
      'scripts/output/haegaram-products.json',
      JSON.stringify(allProducts, null, 2)
    );
  }
  
  // Final summary
  const summary = {
    mallName: '해가람',
    url: 'https://haegaram.com',
    totalProducts: allProducts.length,
    categoryCounts: categories.map(cat => ({
      category: cat.name,
      count: allProducts.filter(p => p.category === cat.name).length
    })),
    priceRange: {
      min: Math.min(...allProducts.map(p => p.price)),
      max: Math.max(...allProducts.map(p => p.price)),
      average: Math.round(allProducts.reduce((sum, p) => sum + p.price, 0) / allProducts.length)
    },
    productsWithImages: allProducts.filter(p => p.imageUrl).length,
    productsWithOriginalPrice: allProducts.filter(p => p.originalPrice).length,
    scrapedAt: new Date().toISOString()
  };
  
  await fs.writeFile(
    'scripts/output/haegaram-scrape-summary.json',
    JSON.stringify(summary, null, 2)
  );
  
  console.log('\n' + '='.repeat(50));
  console.log('SCRAPING COMPLETE!');
  console.log('='.repeat(50));
  console.log(`Total products scraped: ${allProducts.length}`);
  console.log('\nCategory breakdown:');
  summary.categoryCounts.forEach(cat => {
    console.log(`  - ${cat.category}: ${cat.count} products`);
  });
  console.log(`\nPrice range: ${summary.priceRange.min.toLocaleString()}원 - ${summary.priceRange.max.toLocaleString()}원`);
  console.log(`Average price: ${summary.priceRange.average.toLocaleString()}원`);
  console.log(`Products with images: ${summary.productsWithImages}`);
  console.log(`Products with discount: ${summary.productsWithOriginalPrice}`);
  
  return allProducts;
}

// Run the scraper
scrapeHaegaram().catch(console.error);