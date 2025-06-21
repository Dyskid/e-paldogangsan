import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import * as iconv from 'iconv-lite';

interface Chack3Product {
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

async function fetchWithEncoding(url: string): Promise<string> {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
      },
      timeout: 30000,
    });
    
    // Convert from EUC-KR to UTF-8
    const html = iconv.decode(Buffer.from(response.data), 'EUC-KR');
    return html;
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    throw error;
  }
}

async function extractProductsFromList(categoryUrl: string, categoryName: string): Promise<Chack3Product[]> {
  try {
    console.log(`📋 Fetching category: ${categoryName} - ${categoryUrl}`);
    const html = await fetchWithEncoding(categoryUrl);
    const $ = cheerio.load(html);
    
    const products: Chack3Product[] = [];
    
    // Multiple possible product container selectors
    const productSelectors = [
      '.item-wrap', '.product-item', '.goods-item',
      '.list_goods', '.product_list', '.item_list',
      'table.product-list tr', '.prd-list li'
    ];
    
    let foundProducts = false;
    
    for (const selector of productSelectors) {
      const productElements = $(selector);
      
      if (productElements.length > 0) {
        console.log(`Found ${productElements.length} products with selector: ${selector}`);
        foundProducts = true;
        
        productElements.each((index, elem) => {
          const $product = $(elem);
          
          // Extract product URL
          const linkElem = $product.find('a').first();
          const relativeUrl = linkElem.attr('href');
          
          if (!relativeUrl) return;
          
          const productUrl = relativeUrl.startsWith('http') 
            ? relativeUrl 
            : `https://www.chack3.com${relativeUrl.startsWith('/') ? '' : '/'}${relativeUrl}`;
          
          // Extract product name
          const name = $product.find('.product-name, .item-name, .goods_name, [class*="name"]').text().trim() ||
                       $product.find('a').attr('title') ||
                       $product.find('img').attr('alt') ||
                       '';
          
          // Extract price
          const priceText = $product.find('.price, .cost, [class*="price"]').text() ||
                           $product.text();
          const priceMatch = priceText.match(/[\d,]+원/);
          const price = priceMatch ? parseInt(priceMatch[0].replace(/[^0-9]/g, '')) : 0;
          
          // Extract image
          const imgElem = $product.find('img').first();
          let imageUrl = imgElem.attr('src') || imgElem.attr('data-src') || '';
          
          if (imageUrl && !imageUrl.startsWith('http')) {
            imageUrl = `https://www.chack3.com${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
          }
          
          // Extract product ID from URL
          const branduidMatch = productUrl.match(/branduid=(\d+)/);
          const productId = branduidMatch ? branduidMatch[1] : `chack3-${index}`;
          
          if (name && productUrl) {
            const product: Chack3Product = {
              id: `chack3-${productId}`,
              name,
              price,
              image: imageUrl,
              category: categoryName,
              region: '경기도',
              url: productUrl,
              description: name,
              tags: ['착3몰', categoryName, '김치', '사회적기업'],
              isFeatured: false,
              isNew: false,
              mall: {
                mallId: 'chack3',
                mallName: '착3몰',
                mallUrl: 'https://www.chack3.com',
                region: '경기도'
              }
            };
            
            products.push(product);
          }
        });
        
        break; // Found products, no need to try other selectors
      }
    }
    
    if (!foundProducts) {
      console.log('No products found with standard selectors, trying alternative approach...');
      
      // Try to find product links directly
      $('a[href*="shopdetail.html"]').each((index, elem) => {
        const $link = $(elem);
        const href = $link.attr('href');
        
        if (!href) return;
        
        const productUrl = href.startsWith('http') 
          ? href 
          : `https://www.chack3.com${href.startsWith('/') ? '' : '/'}${href}`;
        
        // Get parent container
        const $parent = $link.closest('td, div, li');
        
        // Extract name
        const name = $link.find('img').attr('alt') || 
                    $link.attr('title') ||
                    $parent.find('.name').text().trim() ||
                    '';
        
        // Extract price
        const priceText = $parent.text();
        const priceMatch = priceText.match(/[\d,]+원/);
        const price = priceMatch ? parseInt(priceMatch[0].replace(/[^0-9]/g, '')) : 0;
        
        // Extract image
        const imgElem = $link.find('img').first();
        let imageUrl = imgElem.attr('src') || '';
        
        if (imageUrl && !imageUrl.startsWith('http')) {
          imageUrl = `https://www.chack3.com${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
        }
        
        // Extract product ID
        const branduidMatch = productUrl.match(/branduid=(\d+)/);
        const productId = branduidMatch ? branduidMatch[1] : `alt-${index}`;
        
        if (name && !products.some(p => p.id === `chack3-${productId}`)) {
          const product: Chack3Product = {
            id: `chack3-${productId}`,
            name,
            price,
            image: imageUrl,
            category: categoryName,
            region: '경기도',
            url: productUrl,
            description: name,
            tags: ['착3몰', categoryName, '김치', '사회적기업'],
            isFeatured: false,
            isNew: false,
            mall: {
              mallId: 'chack3',
              mallName: '착3몰',
              mallUrl: 'https://www.chack3.com',
              region: '경기도'
            }
          };
          
          products.push(product);
        }
      });
    }
    
    console.log(`✅ Found ${products.length} products in ${categoryName}`);
    return products;
    
  } catch (error) {
    console.error(`Error extracting products from ${categoryUrl}:`, error);
    return [];
  }
}

async function scrapeProductDetails(product: Chack3Product): Promise<Chack3Product> {
  try {
    console.log(`📋 Fetching details for: ${product.name}`);
    const html = await fetchWithEncoding(product.url);
    const $ = cheerio.load(html);
    
    // Extract detailed price
    const priceText = $('.price_real, .real_price, #price_text, .goods_price').text() ||
                     $('td:contains("판매가")').next().text() ||
                     $('.price').text();
    
    const priceMatch = priceText.match(/[\d,]+/);
    if (priceMatch) {
      product.price = parseInt(priceMatch[0].replace(/,/g, ''));
    }
    
    // Extract original price
    const originalPriceText = $('.price_old, .old_price, .consumer_price').text();
    const originalPriceMatch = originalPriceText.match(/[\d,]+/);
    if (originalPriceMatch) {
      product.originalPrice = parseInt(originalPriceMatch[0].replace(/,/g, ''));
    }
    
    // Extract better image
    const mainImage = $('.detail_image img, .goods_detail img, #productDetail img').first().attr('src') ||
                     $('img[id*="big"], img[class*="big"]').first().attr('src');
    
    if (mainImage && mainImage.startsWith('http')) {
      product.image = mainImage;
    } else if (mainImage) {
      product.image = `https://www.chack3.com${mainImage.startsWith('/') ? '' : '/'}${mainImage}`;
    }
    
    // Extract description
    const description = $('.goods_detail_cont, .detail_cont, #productDetail').text().trim().substring(0, 500) ||
                       product.description;
    
    if (description) {
      product.description = description;
    }
    
    return product;
    
  } catch (error) {
    console.error(`Error fetching product details for ${product.url}:`, error);
    return product;
  }
}

async function scrapeChack3Products() {
  console.log('🛒 Starting chack3.com product scraping...');
  
  // Define categories to scrape
  const categories = [
    { name: '전체상품', url: 'https://www.chack3.com/shop/shopbrand.html?type=P' },
    { name: '김치', url: 'https://www.chack3.com/shop/shopbrand.html?xcode=001&type=P' },
    { name: '반찬', url: 'https://www.chack3.com/shop/shopbrand.html?xcode=002&type=P' },
    { name: '장아찌', url: 'https://www.chack3.com/shop/shopbrand.html?xcode=003&type=P' },
    { name: '선물세트', url: 'https://www.chack3.com/shop/shopbrand.html?xcode=004&type=P' }
  ];
  
  const allProducts: Chack3Product[] = [];
  const uniqueProductIds = new Set<string>();
  
  // Scrape each category
  for (const category of categories) {
    const products = await extractProductsFromList(category.url, category.name);
    
    // Add unique products
    for (const product of products) {
      if (!uniqueProductIds.has(product.id)) {
        uniqueProductIds.add(product.id);
        allProducts.push(product);
      }
    }
    
    await delay(2000); // Be respectful to the server
  }
  
  console.log(`\n📊 Total unique products found: ${allProducts.length}`);
  
  // Fetch detailed information for products without prices
  const productsNeedingDetails = allProducts.filter(p => p.price === 0);
  console.log(`\n🔍 Fetching details for ${productsNeedingDetails.length} products without prices...`);
  
  for (let i = 0; i < productsNeedingDetails.length && i < 20; i++) { // Limit to 20 for testing
    const updatedProduct = await scrapeProductDetails(productsNeedingDetails[i]);
    const index = allProducts.findIndex(p => p.id === updatedProduct.id);
    if (index !== -1) {
      allProducts[index] = updatedProduct;
    }
    await delay(1000);
  }
  
  // Filter products with valid prices
  const validProducts = allProducts.filter(p => p.price > 0);
  
  console.log(`\n✅ Products with valid prices: ${validProducts.length}`);
  
  // Save products
  const outputPath = path.join(__dirname, 'output', 'chack3-products.json');
  fs.writeFileSync(outputPath, JSON.stringify(validProducts, null, 2));
  
  // Save summary
  const summary = {
    mallName: '착3몰',
    totalProducts: allProducts.length,
    productsWithPrice: validProducts.length,
    productsWithImage: validProducts.filter(p => p.image).length,
    categories: [...new Set(validProducts.map(p => p.category))],
    priceRange: {
      min: Math.min(...validProducts.map(p => p.price)),
      max: Math.max(...validProducts.map(p => p.price)),
      average: Math.round(validProducts.reduce((sum, p) => sum + p.price, 0) / validProducts.length)
    },
    scrapedAt: new Date().toISOString()
  };
  
  fs.writeFileSync(
    path.join(__dirname, 'output', 'chack3-scrape-summary.json'),
    JSON.stringify(summary, null, 2)
  );
  
  return { products: validProducts, summary };
}

// Run the scraper
scrapeChack3Products()
  .then(({ summary }) => {
    console.log('\n✅ Scraping complete!');
    console.log(`📄 Products saved to: chack3-products.json`);
    console.log(`📊 Summary saved to: chack3-scrape-summary.json`);
  })
  .catch(error => {
    console.error('❌ Scraping failed:', error);
  });