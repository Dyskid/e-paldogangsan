const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

class DanpoongMallScraper {
  constructor() {
    this.baseUrl = 'https://www.danpoongmall.kr';
    this.mallName = '단풍미인 (정읍)';
    this.products = [];
    this.allProductUrls = new Set();
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async fetchPage(url, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        console.log(`Fetching: ${url} (attempt ${i + 1})`);
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive'
          },
          timeout: 15000
        });
        return response.data;
      } catch (error) {
        console.error(`Error fetching ${url} (attempt ${i + 1}):`, error.message);
        if (i === retries - 1) return null;
        await this.delay(2000);
      }
    }
    return null;
  }

  async getAllProductUrls() {
    console.log('🔍 Starting to collect all product URLs...');
    
    // Start with the shop page
    let page = 1;
    let hasMorePages = true;
    
    while (hasMorePages && page <= 20) { // Limit to 20 pages to prevent infinite loops
      const shopUrl = page === 1 
        ? `${this.baseUrl}/shop/`
        : `${this.baseUrl}/shop/page/${page}/`;
      
      const html = await this.fetchPage(shopUrl);
      if (!html) {
        console.log(`Failed to fetch page ${page}, stopping`);
        break;
      }
      
      const $ = cheerio.load(html);
      
      // Look for product links
      const productLinks = $('a[href*="/product/"]').filter((i, el) => {
        const href = $(el).attr('href');
        return href && href.includes('/product/') && !href.includes('/product-category/');
      });
      
      console.log(`Found ${productLinks.length} product links on page ${page}`);
      
      if (productLinks.length === 0) {
        console.log(`No products found on page ${page}, stopping`);
        hasMorePages = false;
        break;
      }
      
      productLinks.each((i, el) => {
        const href = $(el).attr('href');
        if (href) {
          const fullUrl = href.startsWith('http') ? href : `${this.baseUrl}${href}`;
          this.allProductUrls.add(fullUrl);
        }
      });
      
      // Check if there's a next page
      const nextPageLink = $('.next.page-numbers').length > 0;
      if (!nextPageLink) {
        hasMorePages = false;
      }
      
      page++;
      await this.delay(1000); // Be respectful
    }
    
    console.log(`📊 Total unique product URLs collected: ${this.allProductUrls.size}`);
    return Array.from(this.allProductUrls);
  }

  async scrapeProductDetails(productUrl) {
    const html = await this.fetchPage(productUrl);
    if (!html) return null;

    const $ = cheerio.load(html);

    try {
      // Extract product name
      const name = $('h1.product_title.entry-title').text().trim() ||
                  $('.product-title').text().trim() ||
                  $('h1').first().text().trim();
      
      if (!name || name.length < 2) {
        console.log(`No valid name found for ${productUrl}`);
        return null;
      }

      // Extract price
      let price = null;
      const priceSelectors = [
        '.price .woocommerce-Price-amount',
        '.price ins .woocommerce-Price-amount',
        '.price .amount',
        '.woocommerce-Price-amount',
        '.price bdi',
        '.price',
        '[class*="price"]'
      ];
      
      for (const selector of priceSelectors) {
        const priceElement = $(selector).first();
        if (priceElement.length > 0) {
          const priceText = priceElement.text().trim();
          const priceMatch = priceText.match(/[\d,]+/);
          if (priceMatch) {
            const parsedPrice = parseInt(priceMatch[0].replace(/,/g, ''));
            if (parsedPrice > 0) {
              price = parsedPrice;
              break;
            }
          }
        }
      }

      // Extract image
      let imageUrl = null;
      const imgSelectors = [
        '.woocommerce-product-gallery__image img',
        '.product-images img',
        '.wp-post-image',
        '.product-image img',
        'img[data-src]',
        'img[src]'
      ];
      
      for (const selector of imgSelectors) {
        const imgElement = $(selector).first();
        if (imgElement.length > 0) {
          const imgSrc = imgElement.attr('src') || imgElement.attr('data-src');
          if (imgSrc && imgSrc.includes('uploads')) {
            imageUrl = imgSrc.startsWith('http') ? imgSrc : `${this.baseUrl}${imgSrc}`;
            break;
          }
        }
      }

      // Extract category
      const categoryBreadcrumb = $('.woocommerce-breadcrumb').text() ||
                                $('.breadcrumb').text() ||
                                $('.product-category').text();
      
      let category = '기타';
      if (categoryBreadcrumb.includes('쌀')) category = '곡류';
      else if (categoryBreadcrumb.includes('과일') || categoryBreadcrumb.includes('베리')) category = '과일';
      else if (categoryBreadcrumb.includes('채소') || categoryBreadcrumb.includes('야채')) category = '채소';
      else if (categoryBreadcrumb.includes('축산') || categoryBreadcrumb.includes('수산')) category = '축산/수산';
      else if (categoryBreadcrumb.includes('전통') || categoryBreadcrumb.includes('장류')) category = '전통식품';
      else if (categoryBreadcrumb.includes('건강') || categoryBreadcrumb.includes('차')) category = '건강식품';

      // Extract description
      const description = $('.woocommerce-product-details__short-description').text().trim() ||
                         $('.product-short-description').text().trim() ||
                         $('.entry-summary p').first().text().trim();

      if (price && price > 0) {
        return {
          name: name,
          price: price,
          image: imageUrl,
          url: productUrl,
          mall: this.mallName,
          category: category,
          description: description.substring(0, 200), // Limit description length
          scrapedAt: new Date().toISOString()
        };
      }

    } catch (error) {
      console.error(`Error scraping product ${productUrl}:`, error.message);
    }
    
    return null;
  }

  async scrapeAllProducts() {
    console.log(`🚀 Starting to scrape ${this.mallName}`);
    
    // First, get all product URLs
    const productUrls = await this.getAllProductUrls();
    
    if (productUrls.length === 0) {
      console.log('❌ No product URLs found');
      return [];
    }
    
    console.log(`📦 Found ${productUrls.length} products to scrape`);
    
    // Scrape details for each product
    for (let i = 0; i < productUrls.length; i++) {
      const url = productUrls[i];
      console.log(`\n🔍 Scraping product ${i + 1}/${productUrls.length}: ${url}`);
      
      const product = await this.scrapeProductDetails(url);
      
      if (product && product.price) {
        this.products.push(product);
        console.log(`✅ Added: ${product.name} - ${product.price}원`);
      } else {
        console.log(`⚠️ Skipped: Unable to extract complete product data`);
      }
      
      // Be respectful to the server
      await this.delay(1500);
      
      // Save progress every 50 products
      if ((i + 1) % 50 === 0) {
        console.log(`💾 Saving progress... ${this.products.length} products collected so far`);
        await this.saveResults(true); // Save as backup
      }
    }
    
    console.log(`\n🎉 Scraping completed! Found ${this.products.length} products with prices`);
    return this.products;
  }

  async saveResults(isBackup = false) {
    const timestamp = Date.now();
    const suffix = isBackup ? '-backup' : '';
    
    // Save scraped data
    const scrapedDataPath = path.join(__dirname, `danpoong-scraped${suffix}-${timestamp}.json`);
    fs.writeFileSync(scrapedDataPath, JSON.stringify(this.products, null, 2));
    console.log(`💾 Scraped data saved to: ${scrapedDataPath}`);

    if (!isBackup) {
      // Load existing products
      const productsPath = path.join(__dirname, '../src/data/products.json');
      let existingProducts = [];
      
      if (fs.existsSync(productsPath)) {
        existingProducts = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
      }

      // Add new products
      const updatedProducts = [...existingProducts, ...this.products];
      
      // Save updated products
      fs.writeFileSync(productsPath, JSON.stringify(updatedProducts, null, 2));
      console.log(`📝 Added ${this.products.length} products to products.json`);
      console.log(`📊 Total products in database: ${updatedProducts.length}`);
    }
  }
}

// Run the scraper
async function main() {
  const scraper = new DanpoongMallScraper();
  
  try {
    await scraper.scrapeAllProducts();
    await scraper.saveResults();
    
    console.log('\n🎯 Summary:');
    console.log(`Mall: ${scraper.mallName}`);
    console.log(`Products scraped: ${scraper.products.length}`);
    console.log(`Total URLs found: ${scraper.allProductUrls.size}`);
    
  } catch (error) {
    console.error('❌ Scraping failed:', error);
    // Still try to save what we have
    if (scraper.products.length > 0) {
      await scraper.saveResults();
    }
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = DanpoongMallScraper;