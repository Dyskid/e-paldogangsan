const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const baseUrl = 'https://www.xn--9z2bv5bx25anyd.kr';
const mallName = '부안 텃밭할매';

const categories = [
  { id: '1010', name: '곡류' },
  { id: '1020', name: '과일·채소' },
  { id: '1030', name: '수산물' },
  { id: '1040', name: '가공식품' },
  { id: '1050', name: '선물세트' },
  { id: '1060', name: '축산물' },
  { id: '1070', name: '반찬류' },
  { id: '1080', name: '기타 먹거리' }
];

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchPage(url) {
  try {
    console.log(`Fetching: ${url}`);
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3'
      },
      timeout: 15000
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${url}:`, error.message);
    return null;
  }
}

async function scrapeProductsFromCategory(categoryId, categoryName) {
  const products = [];
  let page = 1;
  
  while (true) {
    const listUrl = `${baseUrl}/board/shop/list.php?ca_id=${categoryId}&page=${page}`;
    const html = await fetchPage(listUrl);
    
    if (!html) break;
    
    const $ = cheerio.load(html);
    
    // Look for list items that contain product information
    const productItems = $('li').filter((i, el) => {
      const $el = $(el);
      return $el.find('a[href*="item.php?it_id="]').length > 0;
    });
    
    if (productItems.length === 0) {
      console.log(`No products found on page ${page} for category ${categoryName}`);
      break;
    }
    
    console.log(`Found ${productItems.length} products on page ${page} for category ${categoryName}`);
    
    productItems.each((i, element) => {
      try {
        const $item = $(element);
        
        // Extract product link
        const productLink = $item.find('a[href*="item.php?it_id="]').attr('href');
        let productUrl = null;
        if (productLink) {
          if (productLink.startsWith('http')) {
            productUrl = productLink;
          } else if (productLink.startsWith('/')) {
            productUrl = `${baseUrl}${productLink}`;
          } else if (productLink.startsWith('..')) {
            productUrl = `${baseUrl}/board/shop/${productLink.replace('../', '')}`;
          } else {
            productUrl = `${baseUrl}/board/shop/${productLink}`;
          }
        }
        
        // Extract product name from link text
        const name = $item.find('a[href*="item.php?it_id="]').text().trim();
        
        // Extract image
        const imgSrc = $item.find('img').attr('src');
        let imageUrl = null;
        if (imgSrc) {
          if (imgSrc.startsWith('http')) {
            imageUrl = imgSrc;
          } else if (imgSrc.startsWith('/')) {
            imageUrl = `${baseUrl}${imgSrc}`;
          } else {
            imageUrl = `${baseUrl}/${imgSrc}`;
          }
        }
        
        // For now, we'll scrape the product detail page to get the price
        // Store the basic info and we'll get price later
        if (name && name.length > 2 && productUrl) {
          products.push({
            name: name,
            url: productUrl,
            image: imageUrl,
            category: categoryName,
            mall: mallName,
            tempId: `${categoryId}_${i}_${page}`
          });
          console.log(`📦 Found product: ${name}`);
        }
        
      } catch (error) {
        console.error('Error parsing product item:', error);
      }
    });
    
    // Check for next page
    const nextPage = $('a').filter((i, el) => $(el).text().includes('다음')).length > 0;
    if (!nextPage) break;
    
    page++;
    await delay(1000);
  }
  
  return products;
}

async function scrapeProductDetails(product) {
  const html = await fetchPage(product.url);
  if (!html) return null;

  const $ = cheerio.load(html);
  
  try {
    // Try to find price in the product detail page
    let price = null;
    
    // Look for price patterns
    const priceSelectors = [
      'strong:contains("원")',
      '[class*="price"]',
      'td:contains("판매가")',
      'td:contains("가격")',
      '.price',
      'span:contains("원")'
    ];
    
    for (const selector of priceSelectors) {
      let priceText = '';
      if (selector.includes('contains')) {
        if (selector.includes('판매가') || selector.includes('가격')) {
          priceText = $(selector).next().text() || $(selector).parent().text();
        } else {
          priceText = $(selector).text();
        }
      } else {
        priceText = $(selector).text();
      }
      
      if (priceText) {
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
    
    if (price) {
      return {
        ...product,
        price: price,
        scrapedAt: new Date().toISOString()
      };
    }
    
  } catch (error) {
    console.error(`Error scraping product details for ${product.url}:`, error.message);
  }
  
  return null;
}

async function main() {
  console.log(`🚀 Starting improved scraper for ${mallName}`);
  const allProducts = [];
  
  // First pass: Get all product URLs and basic info
  for (const category of categories) {
    console.log(`\n📂 Processing category: ${category.name} (${category.id})`);
    
    const products = await scrapeProductsFromCategory(category.id, category.name);
    console.log(`Found ${products.length} products in ${category.name}`);
    
    allProducts.push(...products);
    
    await delay(2000);
  }
  
  console.log(`\n📊 Total products found: ${allProducts.length}`);
  
  // Second pass: Get detailed information including prices
  const productsWithPrices = [];
  
  for (let i = 0; i < allProducts.length; i++) {
    const product = allProducts[i];
    console.log(`\n🔍 Getting details for product ${i + 1}/${allProducts.length}: ${product.name}`);
    
    const detailedProduct = await scrapeProductDetails(product);
    
    if (detailedProduct && detailedProduct.price) {
      productsWithPrices.push(detailedProduct);
      console.log(`✅ Added: ${detailedProduct.name} - ${detailedProduct.price}원`);
    } else {
      console.log(`⚠️ Skipped (no price): ${product.name}`);
    }
    
    await delay(1500); // Be respectful to the server
  }
  
  console.log(`\n🎉 Products with prices: ${productsWithPrices.length}`);
  
  if (productsWithPrices.length > 0) {
    // Save scraped data
    const timestamp = Date.now();
    const scrapedDataPath = path.join(__dirname, `buan-improved-scraped-${timestamp}.json`);
    fs.writeFileSync(scrapedDataPath, JSON.stringify(productsWithPrices, null, 2));
    console.log(`💾 Scraped data saved to: ${scrapedDataPath}`);

    // Add to products.json
    const productsPath = path.join(__dirname, '../src/data/products.json');
    let existingProducts = [];
    
    if (fs.existsSync(productsPath)) {
      existingProducts = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
    }

    const updatedProducts = [...existingProducts, ...productsWithPrices];
    fs.writeFileSync(productsPath, JSON.stringify(updatedProducts, null, 2));
    
    console.log(`📝 Added ${productsWithPrices.length} products to products.json`);
    console.log(`📊 Total products in database: ${updatedProducts.length}`);
    
    // Summary
    console.log('\n🎯 Summary:');
    console.log(`Mall: ${mallName}`);
    console.log(`Products with prices: ${productsWithPrices.length}`);
    console.log(`Categories processed: ${categories.length}`);
    
  } else {
    console.log('❌ No products with prices found');
  }
}

main().catch(console.error);