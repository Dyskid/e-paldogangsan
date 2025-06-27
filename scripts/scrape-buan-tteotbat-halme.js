const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

class BuanTteotbatHalmeScraper {
  constructor() {
    this.baseUrl = 'https://www.xn--9z2bv5bx25anyd.kr';
    this.mallName = '부안 텃밭할매';
    this.products = [];
    this.categories = [
      { id: '1010', name: '곡류' },
      { id: '1020', name: '과일·채소' },
      { id: '1030', name: '수산물' },
      { id: '1040', name: '가공식품' },
      { id: '1050', name: '선물세트' },
      { id: '1060', name: '축산물' },
      { id: '1070', name: '반찬류' },
      { id: '1080', name: '기타 먹거리' }
    ];
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async fetchPage(url) {
    try {
      console.log(`Fetching: ${url}`);
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3',
          'Accept-Encoding': 'gzip, deflate'
        },
        timeout: 10000
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${url}:`, error.message);
      return null;
    }
  }

  async getProductUrlsFromCategory(categoryId) {
    const productUrls = [];
    let page = 1;
    
    while (true) {
      const listUrl = `${this.baseUrl}/board/shop/list.php?ca_id=${categoryId}&page=${page}`;
      const html = await this.fetchPage(listUrl);
      
      if (!html) break;
      
      const $ = cheerio.load(html);
      
      // Find product links
      const productLinks = $('a[href*="item.php?it_id="]');
      
      if (productLinks.length === 0) {
        console.log(`No more products found on page ${page} for category ${categoryId}`);
        break;
      }
      
      productLinks.each((i, el) => {
        const href = $(el).attr('href');
        if (href && href.includes('item.php?it_id=')) {
          let fullUrl;
          if (href.startsWith('http')) {
            fullUrl = href;
          } else if (href.startsWith('/')) {
            fullUrl = `${this.baseUrl}${href}`;
          } else if (href.startsWith('..')) {
            fullUrl = `${this.baseUrl}/board/shop/${href.replace('../', '')}`;
          } else {
            fullUrl = `${this.baseUrl}/board/shop/${href}`;
          }
          if (!productUrls.includes(fullUrl)) {
            productUrls.push(fullUrl);
          }
        }
      });
      
      console.log(`Found ${productLinks.length} products on page ${page} for category ${categoryId}`);
      
      // Check if there's a next page
      const nextPageExists = $('a').filter((i, el) => $(el).text().includes('다음')).length > 0;
      if (!nextPageExists) break;
      
      page++;
      await this.delay(1000); // Be respectful
    }
    
    return productUrls;
  }

  async scrapeProductDetails(productUrl) {
    const html = await this.fetchPage(productUrl);
    if (!html) return null;

    const $ = cheerio.load(html);

    try {
      // Extract product name - try multiple selectors
      let name = '';
      
      // Try different selectors for product name
      const nameSelectors = [
        'h1',
        '.item_name',
        '.shop_item_name',
        '[class*="name"]',
        'td:contains("상품명")',
        '.product_name',
        'title'
      ];
      
      for (const selector of nameSelectors) {
        if (selector === 'title') {
          name = $(selector).text().replace('부안 텃밭할매', '').replace('텃밭할매', '').trim();
        } else if (selector === 'td:contains("상품명")') {
          name = $(selector).next().text().trim();
        } else {
          name = $(selector).text().trim();
        }
        
        if (name && name.length > 0 && name !== '텃밭할매') {
          break;
        }
      }
      
      if (!name || name === '텃밭할매') {
        console.log(`No valid name found for ${productUrl}`);
        return null;
      }

      // Extract price - try multiple selectors
      let price = null;
      const priceSelectors = [
        '.item_price',
        '.shop_item_price',
        '[class*="price"]',
        'td:contains("판매가")',
        'td:contains("가격")',
        'strong:contains("원")',
        '.price',
        '[id*="price"]'
      ];
      
      for (const selector of priceSelectors) {
        let priceText = '';
        if (selector === 'td:contains("판매가")' || selector === 'td:contains("가격")') {
          priceText = $(selector).next().text();
        } else {
          priceText = $(selector).text();
        }
        
        if (priceText) {
          const priceMatch = priceText.match(/[\d,]+/);
          if (priceMatch) {
            price = parseInt(priceMatch[0].replace(/,/g, ''));
            break;
          }
        }
      }

      // Extract image - try multiple selectors
      let imageUrl = null;
      const imgSelectors = [
        '.item_image img',
        '.shop_item_image img',
        'img[src*="data/item"]',
        'img[src*="upload"]',
        '.product_image img',
        'img'
      ];
      
      for (const selector of imgSelectors) {
        const imgSrc = $(selector).attr('src');
        if (imgSrc && imgSrc.includes('data/item')) {
          imageUrl = imgSrc.startsWith('http') ? imgSrc : `${this.baseUrl}${imgSrc}`;
          break;
        }
      }

      // Extract additional details
      const description = $('.item_info').text().trim() || 
                         $('.item_desc').text().trim() || 
                         $('td:contains("상품설명")').next().text().trim();

      const seller = $('td:contains("판매자")').next().text().trim() ||
                    $('.seller_name').text().trim();

      return {
        name: name,
        price: price,
        image: imageUrl,
        url: productUrl,
        mall: this.mallName,
        description: description,
        seller: seller,
        scrapedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error(`Error scraping product ${productUrl}:`, error.message);
      return null;
    }
  }

  async scrapeAllProducts() {
    console.log(`🚀 Starting to scrape ${this.mallName}`);
    
    for (const category of this.categories) {
      console.log(`\n📂 Processing category: ${category.name} (${category.id})`);
      
      const productUrls = await this.getProductUrlsFromCategory(category.id);
      console.log(`Found ${productUrls.length} products in ${category.name}`);
      
      for (let i = 0; i < productUrls.length; i++) {
        const url = productUrls[i];
        console.log(`Scraping product ${i + 1}/${productUrls.length}: ${url}`);
        
        const product = await this.scrapeProductDetails(url);
        if (product && product.price) {
          this.products.push({
            ...product,
            category: category.name
          });
          console.log(`✅ Added: ${product.name} - ${product.price}원`);
        } else if (product) {
          console.log(`⚠️ Skipped (no price): ${product.name}`);
        }
        
        await this.delay(1500); // Be respectful to the server
      }
    }
    
    console.log(`\n🎉 Scraping completed! Found ${this.products.length} products with prices`);
    return this.products;
  }

  async saveResults() {
    // Save scraped data
    const scrapedDataPath = path.join(__dirname, `buan-tteotbat-halme-scraped-${Date.now()}.json`);
    fs.writeFileSync(scrapedDataPath, JSON.stringify(this.products, null, 2));
    console.log(`💾 Scraped data saved to: ${scrapedDataPath}`);

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
    console.log(`📝 Updated products.json with ${this.products.length} new products`);
    console.log(`📊 Total products in database: ${updatedProducts.length}`);
  }
}

// Run the scraper
async function main() {
  const scraper = new BuanTteotbatHalmeScraper();
  
  try {
    await scraper.scrapeAllProducts();
    await scraper.saveResults();
    
    console.log('\n🎯 Summary:');
    console.log(`Mall: ${scraper.mallName}`);
    console.log(`Products scraped: ${scraper.products.length}`);
    console.log(`Categories processed: ${scraper.categories.length}`);
    
  } catch (error) {
    console.error('❌ Scraping failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = BuanTteotbatHalmeScraper;