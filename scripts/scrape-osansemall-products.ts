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

async function extractProductsFromCategory(categoryUrl: string, categoryName: string): Promise<OsansemallProduct[]> {
  try {
    console.log(`📋 Fetching category: ${categoryName} - ${categoryUrl}`);
    
    const response = await axios.get(categoryUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
      },
      timeout: 30000,
    });
    
    const $ = cheerio.load(response.data);
    const products: OsansemallProduct[] = [];
    
    // Multiple possible product container selectors
    const productSelectors = [
      '.goods-list li', '.product-list li', '.item-list li',
      '.goods_list li', '.product_list li', '.item_list li',
      'ul.goods li', 'ul.product li', 'ul.item li',
      '[class*="goods"] li', '[class*="product"] li',
      '.list-item', '.goods-item', '.product-item'
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
            : `http://www.osansemall.com${relativeUrl.startsWith('/') ? '' : '/'}${relativeUrl}`;
          
          // Extract product name
          const name = $product.find('.goods-name, .product-name, .item-name, [class*="name"]').text().trim() ||
                       $product.find('a').attr('title') ||
                       $product.find('img').attr('alt') ||
                       $product.find('strong, h3, h4').text().trim() ||
                       '';
          
          // Extract price
          const priceText = $product.find('.price, .cost, [class*="price"]').text() ||
                           $product.text();
          const priceMatch = priceText.match(/[\d,]+원|[\d,]+\s*원/);
          const price = priceMatch ? parseInt(priceMatch[0].replace(/[^0-9]/g, '')) : 0;
          
          // Extract original price (if discounted)
          const originalPriceText = $product.find('.original-price, .old-price, [class*="original"]').text();
          const originalPriceMatch = originalPriceText.match(/[\d,]+원/);
          const originalPrice = originalPriceMatch ? parseInt(originalPriceMatch[0].replace(/[^0-9]/g, '')) : undefined;
          
          // Extract image
          const imgElem = $product.find('img').first();
          let imageUrl = imgElem.attr('src') || imgElem.attr('data-src') || '';
          
          if (imageUrl && !imageUrl.startsWith('http')) {
            imageUrl = imageUrl.startsWith('/') 
              ? `http://www.osansemall.com${imageUrl}` 
              : `http://www.osansemall.com/${imageUrl}`;
          }
          
          // Extract product ID from URL
          const idMatch = productUrl.match(/[?&]goodsNo=(\d+)|[?&]id=(\d+)|\/(\d+)$/);
          const productId = idMatch ? (idMatch[1] || idMatch[2] || idMatch[3]) : `osansemall-${index}`;
          
          if (name && productUrl) {
            const product: OsansemallProduct = {
              id: `osansemall-${productId}`,
              name,
              price,
              originalPrice,
              image: imageUrl,
              category: categoryName,
              region: '경기도',
              url: productUrl,
              description: name,
              tags: ['오산함께장터', categoryName, '전통시장', '경기도', '오산시'],
              isFeatured: false,
              isNew: false,
              mall: {
                mallId: 'osansemall',
                mallName: '오산함께장터',
                mallUrl: 'http://www.osansemall.com',
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
      $('a[href*="goods"], a[href*="product"]').each((index, elem) => {
        const $link = $(elem);
        const href = $link.attr('href');
        
        if (!href || href.includes('catalog') || href.includes('category')) return;
        
        const productUrl = href.startsWith('http') 
          ? href 
          : `http://www.osansemall.com${href.startsWith('/') ? '' : '/'}${href}`;
        
        // Get parent container
        const $parent = $link.closest('td, div, li');
        
        // Extract name
        const name = $link.find('img').attr('alt') || 
                    $link.attr('title') ||
                    $parent.find('.name, strong, h3, h4').text().trim() ||
                    $link.text().trim() ||
                    '';
        
        // Extract price
        const priceText = $parent.text();
        const priceMatch = priceText.match(/[\d,]+원/);
        const price = priceMatch ? parseInt(priceMatch[0].replace(/[^0-9]/g, '')) : 0;
        
        // Extract image
        const imgElem = $link.find('img').first();
        let imageUrl = imgElem.attr('src') || '';
        
        if (imageUrl && !imageUrl.startsWith('http')) {
          imageUrl = imageUrl.startsWith('/') 
            ? `http://www.osansemall.com${imageUrl}` 
            : `http://www.osansemall.com/${imageUrl}`;
        }
        
        // Extract product ID
        const idMatch = productUrl.match(/[?&]goodsNo=(\d+)|[?&]id=(\d+)|\/(\d+)$/);
        const productId = idMatch ? (idMatch[1] || idMatch[2] || idMatch[3]) : `alt-${index}`;
        
        if (name && !products.some(p => p.id === `osansemall-${productId}`)) {
          const product: OsansemallProduct = {
            id: `osansemall-${productId}`,
            name,
            price,
            image: imageUrl,
            category: categoryName,
            region: '경기도',
            url: productUrl,
            description: name,
            tags: ['오산함께장터', categoryName, '전통시장', '경기도', '오산시'],
            isFeatured: false,
            isNew: false,
            mall: {
              mallId: 'osansemall',
              mallName: '오산함께장터',
              mallUrl: 'http://www.osansemall.com',
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

async function scrapeProductDetails(product: OsansemallProduct): Promise<OsansemallProduct> {
  try {
    console.log(`📋 Fetching details for: ${product.name}`);
    
    const response = await axios.get(product.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      timeout: 30000,
    });
    
    const $ = cheerio.load(response.data);
    
    // Extract detailed price
    const priceText = $('.price_real, .real_price, .goods_price, .price').text() ||
                     $('td:contains("판매가"), td:contains("가격")').next().text() ||
                     $('.cost, [class*="price"]').text();
    
    const priceMatch = priceText.match(/[\d,]+/);
    if (priceMatch && parseInt(priceMatch[0].replace(/,/g, '')) > 0) {
      product.price = parseInt(priceMatch[0].replace(/,/g, ''));
    }
    
    // Extract original price
    const originalPriceText = $('.price_old, .old_price, .consumer_price').text();
    const originalPriceMatch = originalPriceText.match(/[\d,]+/);
    if (originalPriceMatch) {
      product.originalPrice = parseInt(originalPriceMatch[0].replace(/,/g, ''));
    }
    
    // Extract better image
    const mainImage = $('.detail_image img, .goods_detail img, .product_image img').first().attr('src') ||
                     $('img[id*="big"], img[class*="big"]').first().attr('src');
    
    if (mainImage) {
      product.image = mainImage.startsWith('http') 
        ? mainImage 
        : `http://www.osansemall.com${mainImage.startsWith('/') ? '' : '/'}${mainImage}`;
    }
    
    // Extract description
    const description = $('.goods_detail_cont, .detail_cont, .product_desc').text().trim().substring(0, 500) ||
                       product.description;
    
    if (description && description.length > product.description.length) {
      product.description = description;
    }
    
    return product;
    
  } catch (error) {
    console.error(`Error fetching product details for ${product.url}:`, error);
    return product;
  }
}

async function scrapeOsansemallProducts() {
  console.log('🛒 Starting osansemall.com product scraping...');
  
  // Define categories to scrape (focusing on food and main categories)
  const categories = [
    { name: '먹거리', url: 'http://www.osansemall.com/goods/catalog?code=0006' },
    { name: '가공식품', url: 'http://www.osansemall.com/goods/catalog?code=00060001' },
    { name: '농수산물', url: 'http://www.osansemall.com/goods/catalog?code=00060004' },
    { name: '생활용품', url: 'http://www.osansemall.com/goods/catalog?code=0001' },
    { name: '수공예', url: 'http://www.osansemall.com/goods/catalog?code=00010001' },
    { name: '행사', url: 'http://www.osansemall.com/goods/catalog?code=0002' },
    { name: '다과', url: 'http://www.osansemall.com/goods/catalog?code=00020001' },
    { name: '도시락', url: 'http://www.osansemall.com/goods/catalog?code=00020002' },
    { name: '사회적기업', url: 'http://www.osansemall.com/goods/catalog?code=00070001' },
    { name: '마을기업', url: 'http://www.osansemall.com/goods/catalog?code=00070002' },
    { name: '협동조합', url: 'http://www.osansemall.com/goods/catalog?code=00070003' },
    { name: '신제품', url: 'http://www.osansemall.com/goods/catalog?code=0011' }
  ];
  
  const allProducts: OsansemallProduct[] = [];
  const uniqueProductIds = new Set<string>();
  
  // Scrape each category
  for (const category of categories) {
    const products = await extractProductsFromCategory(category.url, category.name);
    
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
  
  for (let i = 0; i < Math.min(productsNeedingDetails.length, 20); i++) { // Limit to 20 for testing
    const updatedProduct = await scrapeProductDetails(productsNeedingDetails[i]);
    const index = allProducts.findIndex(p => p.id === updatedProduct.id);
    if (index !== -1) {
      allProducts[index] = updatedProduct;
    }
    await delay(1000);
  }
  
  // Filter products with valid prices and names
  const validProducts = allProducts.filter(p => 
    p.price > 0 && 
    p.name.trim().length > 0 &&
    !p.name.toLowerCase().includes('undefined')
  );
  
  console.log(`\n✅ Products with valid prices: ${validProducts.length}`);
  
  // Save products
  const outputPath = path.join(__dirname, 'output', 'osansemall-products.json');
  fs.writeFileSync(outputPath, JSON.stringify(validProducts, null, 2));
  
  // Save summary
  const summary = {
    mallName: '오산함께장터',
    totalProducts: allProducts.length,
    productsWithPrice: validProducts.length,
    productsWithImage: validProducts.filter(p => p.image).length,
    categories: [...new Set(validProducts.map(p => p.category))],
    priceRange: validProducts.length > 0 ? {
      min: Math.min(...validProducts.map(p => p.price)),
      max: Math.max(...validProducts.map(p => p.price)),
      average: Math.round(validProducts.reduce((sum, p) => sum + p.price, 0) / validProducts.length)
    } : null,
    scrapedAt: new Date().toISOString()
  };
  
  fs.writeFileSync(
    path.join(__dirname, 'output', 'osansemall-scrape-summary.json'),
    JSON.stringify(summary, null, 2)
  );
  
  return { products: validProducts, summary };
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