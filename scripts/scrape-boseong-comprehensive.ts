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
    console.log('🚀 Starting Boseong Mall comprehensive scraping...');
    
    // First scrape the homepage for featured products
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
        
        // Extract basic info from listing
        const title = $item.find('.prdName span:last-child, .prdName a').text().trim() ||
                     $item.find('strong.name.prdName').text().trim();
        
        const price = $item.find('.product_price:not(.product_custom)', $item).text().trim() ||
                     $item.find('li.product_price').text().trim();
        
        let image = $item.find('img').first().attr('src') || '';
        if (image && !image.startsWith('http')) {
          image = image.startsWith('//') ? 'https:' + image : new URL(image, baseUrl).href;
        }
        
        if (title && price && image && fullUrl) {
          const productId = extractProductId(fullUrl);
          products.push({
            id: productId,
            title: cleanTitle(title),
            price: cleanPrice(price),
            image: image,
            url: fullUrl,
            category: '농산물',
            mall: '보성몰',
            region: '전남',
            tags: ['농산물', '전남', '보성'],
            inStock: true
          });
        }
      } catch (error) {
        console.error(`❌ Error processing homepage product ${index}:`, error);
        errors.push(`Homepage product ${index}: ${error}`);
      }
    });
    
    console.log(`✅ Found ${products.length} products from homepage`);
    
    // Try to scrape from main product listing page
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
      
      // Extract products from listing page
      $list('ul.prdList li.xans-record-, .xans-product-normalpackage .xans-record-').each((index, element) => {
        try {
          const $item = $list(element);
          
          // Extract product link
          const productLink = $item.find('a').first().attr('href');
          if (!productLink) return;
          
          const fullUrl = productLink.startsWith('http') ? productLink : new URL(productLink, baseUrl).href;
          
          // Skip if we already have this product
          const productId = extractProductId(fullUrl);
          if (products.some(p => p.id === productId)) return;
          
          const title = $item.find('.prdName span:last-child, .prdName a').text().trim() ||
                       $item.find('strong.name.prdName').text().trim();
          
          const price = $item.find('.product_price:not(.product_custom)', $item).text().trim() ||
                       $item.find('li.product_price').text().trim();
          
          let image = $item.find('img').first().attr('src') || '';
          if (image && !image.startsWith('http')) {
            image = image.startsWith('//') ? 'https:' + image : new URL(image, baseUrl).href;
          }
          
          if (title && price && image && fullUrl) {
            products.push({
              id: productId,
              title: cleanTitle(title),
              price: cleanPrice(price),
              image: image,
              url: fullUrl,
              category: '농산물',
              mall: '보성몰',
              region: '전남',
              tags: ['농산물', '전남', '보성'],
              inStock: true
            });
          }
        } catch (error) {
          console.error(`❌ Error processing list product ${index}:`, error);
          errors.push(`List product ${index}: ${error}`);
        }
      });
      
      console.log(`✅ Total products after listing page: ${products.length}`);
      
    } catch (error) {
      console.error('❌ Error scraping product listing page:', error);
      errors.push(`Listing page error: ${error}`);
    }
    
    // Try to get more products from category pages
    console.log('\n🏷️ Scraping category pages...');
    const categoryUrls = [
      `${baseUrl}/category/농산물/1/`,
      `${baseUrl}/category/가공식품/2/`,
      `${baseUrl}/category/기타/3/`,
      `${baseUrl}/product/list.html?cate_no=1`,
      `${baseUrl}/product/list.html?cate_no=2`,
      `${baseUrl}/product/list.html?cate_no=3`
    ];
    
    for (const categoryUrl of categoryUrls) {
      try {
        const categoryResponse = await axios.get(categoryUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          timeout: 20000
        });
        
        const $category = cheerio.load(categoryResponse.data);
        
        $category('ul.prdList li.xans-record-, .xans-product-normalpackage .xans-record-').each((index, element) => {
          try {
            const $item = $category(element);
            
            const productLink = $item.find('a').first().attr('href');
            if (!productLink) return;
            
            const fullUrl = productLink.startsWith('http') ? productLink : new URL(productLink, baseUrl).href;
            
            // Skip if we already have this product
            const productId = extractProductId(fullUrl);
            if (products.some(p => p.id === productId)) return;
            
            const title = $item.find('.prdName span:last-child, .prdName a').text().trim() ||
                         $item.find('strong.name.prdName').text().trim();
            
            const price = $item.find('.product_price:not(.product_custom)', $item).text().trim() ||
                         $item.find('li.product_price').text().trim();
            
            let image = $item.find('img').first().attr('src') || '';
            if (image && !image.startsWith('http')) {
              image = image.startsWith('//') ? 'https:' + image : new URL(image, baseUrl).href;
            }
            
            if (title && price && image && fullUrl) {
              products.push({
                id: productId,
                title: cleanTitle(title),
                price: cleanPrice(price),
                image: image,
                url: fullUrl,
                category: determineCategoryFromUrl(categoryUrl),
                mall: '보성몰',
                region: '전남',
                tags: ['농산물', '전남', '보성'],
                inStock: true
              });
            }
          } catch (error) {
            console.error(`❌ Error processing category product:`, error);
          }
        });
        
        console.log(`✅ Scraped category: ${categoryUrl}`);
        
      } catch (error) {
        console.log(`⚠️ Could not access category: ${categoryUrl}`);
        // Continue with other categories
      }
    }
    
    console.log(`\n🎯 Total products found: ${products.length}`);
    
    // Enhanced product details by visiting individual product pages
    console.log('\n🔍 Enhancing product details...');
    const enhancedProducts: Product[] = [];
    
    for (let i = 0; i < Math.min(products.length, 50); i++) { // Limit to prevent timeout
      const product = products[i];
      try {
        const productResponse = await axios.get(product.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          timeout: 15000
        });
        
        const $product = cheerio.load(productResponse.data);
        
        // Extract enhanced details
        const enhancedTitle = $product('.xans-product-detail .title, .product_name, .goods_name, h1').text().trim() ||
                             $product('title').text().replace('보성몰', '').trim() ||
                             product.title;
        
        const enhancedPrice = $product('.xans-product-baseprice, .price, .cost, #span_product_price_text').text().trim() ||
                             product.price;
        
        let enhancedImage = $product('.xans-product-detail .product_img img, .goods_img img').first().attr('src') ||
                           product.image;
        
        if (enhancedImage && !enhancedImage.startsWith('http')) {
          enhancedImage = enhancedImage.startsWith('//') ? 'https:' + enhancedImage : new URL(enhancedImage, baseUrl).href;
        }
        
        // Extract description
        const description = $product('.xans-product-detail .product_detail, .product_description').text().trim().substring(0, 200);
        
        enhancedProducts.push({
          ...product,
          title: cleanTitle(enhancedTitle),
          price: cleanPrice(enhancedPrice),
          image: enhancedImage,
          description: description || undefined
        });
        
        console.log(`✅ Enhanced product ${i + 1}/${Math.min(products.length, 50)}: ${enhancedTitle}`);
        
      } catch (error) {
        console.error(`❌ Error enhancing product ${product.id}:`, error);
        enhancedProducts.push(product); // Keep original if enhancement fails
      }
    }
    
    // Add remaining products without enhancement
    if (products.length > 50) {
      enhancedProducts.push(...products.slice(50));
    }
    
    // Categorize products based on titles
    const categorizedProducts = enhancedProducts.map(product => ({
      ...product,
      category: categorizeProduct(product.title),
      tags: generateTags(product.title)
    }));
    
    // Save results
    const summary = {
      totalProducts: categorizedProducts.length,
      mall: '보성몰',
      region: '전남',
      baseUrl: baseUrl,
      categories: [...new Set(categorizedProducts.map(p => p.category))],
      scrapeDate: new Date().toISOString(),
      errors: errors
    };
    
    fs.writeFileSync('./scripts/output/boseong-products.json', JSON.stringify(categorizedProducts, null, 2));
    fs.writeFileSync('./scripts/output/boseong-scrape-summary.json', JSON.stringify(summary, null, 2));
    
    console.log('\n📊 Scraping Summary:');
    console.log(`Total products: ${categorizedProducts.length}`);
    console.log(`Categories: ${summary.categories.join(', ')}`);
    console.log(`Errors: ${errors.length}`);
    console.log('✅ Results saved to boseong-products.json and boseong-scrape-summary.json');
    
    return categorizedProducts;
    
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
  return title
    .replace(/\s+/g, ' ')
    .replace(/[\n\r\t]/g, ' ')
    .replace(/\s*\(.*?\)\s*/g, ' ')
    .replace(/\s*\[.*?\]\s*/g, ' ')
    .trim();
}

function cleanPrice(price: string): string {
  return price
    .replace(/[^\d,원]/g, '')
    .replace(/,/g, '')
    .replace(/원.*/, '원')
    .trim();
}

function determineCategoryFromUrl(url: string): string {
  if (url.includes('농산물') || url.includes('cate_no=1')) return '농산물';
  if (url.includes('가공식품') || url.includes('cate_no=2')) return '가공식품';
  if (url.includes('기타') || url.includes('cate_no=3')) return '기타';
  return '농산물';
}

function categorizeProduct(title: string): string {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('감자') || titleLower.includes('고구마') || titleLower.includes('양파') || 
      titleLower.includes('마늘') || titleLower.includes('배추') || titleLower.includes('무')) {
    return '채소';
  }
  
  if (titleLower.includes('사과') || titleLower.includes('배') || titleLower.includes('포도') || 
      titleLower.includes('감') || titleLower.includes('복숭아')) {
    return '과일';
  }
  
  if (titleLower.includes('쌀') || titleLower.includes('잡곡') || titleLower.includes('콩') || 
      titleLower.includes('보리') || titleLower.includes('현미')) {
    return '곡물';
  }
  
  if (titleLower.includes('버섯') || titleLower.includes('표고') || titleLower.includes('느타리') || 
      titleLower.includes('송이')) {
    return '버섯';
  }
  
  if (titleLower.includes('차') || titleLower.includes('녹차') || titleLower.includes('홍차') || 
      titleLower.includes('발효') || titleLower.includes('즙')) {
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