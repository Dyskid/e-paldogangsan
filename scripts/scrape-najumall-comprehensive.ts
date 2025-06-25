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

async function scrapeNajuMallProducts() {
  const baseUrl = 'https://najumall.kr';
  const products: Product[] = [];
  const errors: string[] = [];
  
  try {
    console.log('🚀 Starting Naju Mall comprehensive scraping...');
    
    // First scrape the homepage for featured products
    console.log('\n🏠 Scraping homepage products...');
    const homepageResponse = await axios.get(baseUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 30000
    });
    
    const $homepage = cheerio.load(homepageResponse.data);
    
    // Extract products from homepage using Cafe24 structure
    $homepage('.xans-product-listmain .xans-record-').each((index, element) => {
      try {
        const $item = $homepage(element);
        
        // Extract product link
        const productLink = $item.find('a').first().attr('href');
        if (!productLink) return;
        
        const fullUrl = productLink.startsWith('http') ? productLink : new URL(productLink, baseUrl).href;
        
        // Extract title from img alt attribute (most reliable for Cafe24)
        const imgAlt = $item.find('img').first().attr('alt') || '';
        const title = cleanTitle(imgAlt);
        
        // Extract price - look for common Cafe24 price patterns
        const priceSelectors = ['.price', '.cost', '.xans-product-baseprice', 'li[title="판매가"]'];
        let price = '';
        for (const sel of priceSelectors) {
          const priceText = $item.find(sel).text().trim();
          if (priceText && priceText.includes('원')) {
            price = cleanPrice(priceText);
            break;
          }
        }
        
        let image = $item.find('img').first().attr('src') || '';
        if (image && !image.startsWith('http')) {
          image = image.startsWith('//') ? 'https:' + image : new URL(image, baseUrl).href;
        }
        
        if (title && image && fullUrl && title.length > 3) {
          const productId = extractProductId(fullUrl);
          products.push({
            id: productId,
            title: title,
            price: price || '가격문의',
            image: image,
            url: fullUrl,
            category: categorizeProduct(title),
            mall: '나주몰',
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
    
    // Scrape from category pages
    console.log('\n📦 Scraping category pages...');
    const categories = [
      { id: '24', name: '농산물' },
      { id: '25', name: '축산물' },
      { id: '26', name: '수산물' },
      { id: '45', name: '가공식품' },
      { id: '59', name: '건강식품' },
      { id: '87', name: '남도 전통주' },
      { id: '60', name: '인기상품' },
      { id: '61', name: '신상품' },
      { id: '79', name: '특가기획전' }
    ];
    
    for (const category of categories) {
      try {
        console.log(`  📂 Scraping category: ${category.name} (${category.id})`);
        
        const categoryUrl = `${baseUrl}/product/list.html?cate_no=${category.id}`;
        const categoryResponse = await axios.get(categoryUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          timeout: 30000
        });
        
        const $category = cheerio.load(categoryResponse.data);
        let newProductsCount = 0;
        
        // Extract products from category page
        $category('.xans-product-normalpackage .xans-record-, .xans-product-listmain .xans-record-').each((index, element) => {
          try {
            const $item = $category(element);
            
            const productLink = $item.find('a').first().attr('href');
            if (!productLink) return;
            
            const fullUrl = productLink.startsWith('http') ? productLink : new URL(productLink, baseUrl).href;
            
            // Skip if we already have this product
            const productId = extractProductId(fullUrl);
            if (products.some(p => p.id === productId)) return;
            
            // Extract title from img alt attribute
            const imgAlt = $item.find('img').first().attr('alt') || '';
            const title = cleanTitle(imgAlt);
            
            // Extract price
            const priceSelectors = ['.price', '.cost', '.xans-product-baseprice', 'li[title="판매가"]'];
            let price = '';
            for (const sel of priceSelectors) {
              const priceText = $item.find(sel).text().trim();
              if (priceText && priceText.includes('원')) {
                price = cleanPrice(priceText);
                break;
              }
            }
            
            let image = $item.find('img').first().attr('src') || '';
            if (image && !image.startsWith('http')) {
              image = image.startsWith('//') ? 'https:' + image : new URL(image, baseUrl).href;
            }
            
            if (title && image && fullUrl && title.length > 3) {
              products.push({
                id: productId,
                title: title,
                price: price || '가격문의',
                image: image,
                url: fullUrl,
                category: category.name === '인기상품' || category.name === '신상품' || category.name === '특가기획전' 
                         ? categorizeProduct(title) : category.name,
                mall: '나주몰',
                region: '전남',
                tags: generateTags(title, category.name),
                inStock: true
              });
              newProductsCount++;
            }
          } catch (error) {
            console.error(`    ❌ Error processing category product:`, error);
          }
        });
        
        console.log(`    ✅ Found ${newProductsCount} new products`);
        
        // Delay between categories
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Error scraping category ${category.name}:`, error.message);
        errors.push(`Category ${category.name}: ${error.message}`);
      }
    }
    
    console.log(`\n🎯 Total unique products found: ${products.length}`);
    
    // Enhanced product details by visiting individual product pages (limited sample)
    console.log('\n🔍 Enhancing product details...');
    const enhancedProducts: Product[] = [];
    
    for (let i = 0; i < Math.min(products.length, 30); i++) { // Limit to prevent timeout
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
        let enhancedTitle = $product('.xans-product-detail .title, .product_name, .goods_name, h1').text().trim() ||
                           $product('title').text().replace('나주몰', '').replace('나주시 지자체몰', '').trim() ||
                           product.title;
        
        // Clean title from meta og:title if available
        const metaTitle = $product('meta[property="og:title"]').attr('content');
        if (metaTitle && metaTitle.length > enhancedTitle.length) {
          enhancedTitle = metaTitle.replace('나주몰', '').replace('나주시 지자체몰', '').trim();
        }
        
        const enhancedPrice = $product('.xans-product-baseprice, .price, .cost, #span_product_price_text').text().trim() ||
                             product.price;
        
        let enhancedImage = $product('.xans-product-detail img, .product_img img, .goods_img img').first().attr('src') ||
                           product.image;
        
        if (enhancedImage && !enhancedImage.startsWith('http')) {
          enhancedImage = enhancedImage.startsWith('//') ? 'https:' + enhancedImage : new URL(enhancedImage, baseUrl).href;
        }
        
        enhancedProducts.push({
          ...product,
          title: cleanTitle(enhancedTitle),
          price: enhancedPrice ? cleanPrice(enhancedPrice) : product.price,
          image: enhancedImage
        });
        
        console.log(`✅ Enhanced product ${i + 1}/${Math.min(products.length, 30)}: ${cleanTitle(enhancedTitle)}`);
        
      } catch (error) {
        console.error(`❌ Error enhancing product ${product.id}:`, error);
        enhancedProducts.push(product); // Keep original if enhancement fails
      }
      
      // Small delay
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Add remaining products without enhancement
    if (products.length > 30) {
      enhancedProducts.push(...products.slice(30));
    }
    
    // Save results
    const summary = {
      totalProducts: enhancedProducts.length,
      mall: '나주몰',
      region: '전남',
      baseUrl: baseUrl,
      categories: [...new Set(enhancedProducts.map(p => p.category))],
      scrapeDate: new Date().toISOString(),
      errors: errors,
      sampleProducts: enhancedProducts.slice(0, 5).map(p => ({ 
        title: p.title, 
        price: p.price, 
        category: p.category 
      }))
    };
    
    fs.writeFileSync('./scripts/output/najumall-products.json', JSON.stringify(enhancedProducts, null, 2));
    fs.writeFileSync('./scripts/output/najumall-scrape-summary.json', JSON.stringify(summary, null, 2));
    
    console.log('\n📊 Scraping Summary:');
    console.log(`Total products: ${enhancedProducts.length}`);
    console.log(`Categories: ${summary.categories.join(', ')}`);
    console.log(`Errors: ${errors.length}`);
    console.log('Sample products:');
    summary.sampleProducts.forEach((p, i) => {
      console.log(`  ${i+1}. ${p.title} - ${p.price} (${p.category})`);
    });
    console.log('✅ Results saved to najumall-products.json and najumall-scrape-summary.json');
    
    return enhancedProducts;
    
  } catch (error) {
    console.error('❌ Fatal error during scraping:', error);
    throw error;
  }
}

function extractProductId(url: string): string {
  // Extract product ID from Cafe24 URL like: /product/name/1226/category/1/display/2/
  const match = url.match(/\/(\d+)\//);
  return match ? `najumall-${match[1]}` : `najumall-${Date.now()}`;
}

function cleanTitle(title: string): string {
  if (!title) return '';
  
  return title
    .replace(/\s+/g, ' ')
    .replace(/[\n\r\t]/g, ' ')
    .trim();
}

function cleanPrice(price: string): string {
  if (!price) return '';
  
  // Extract price from text like "판매가 :10,000원"
  const priceMatch = price.match(/[\d,]+원/);
  if (priceMatch) {
    return priceMatch[0];
  }
  
  // Fallback: clean up general price text
  return price
    .replace(/[^\d,원]/g, '')
    .replace(/,/g, '')
    .replace(/원.*/, '원')
    .trim();
}

function categorizeProduct(title: string): string {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('블루베리') || titleLower.includes('딸기') || titleLower.includes('사과') || 
      titleLower.includes('배') || titleLower.includes('포도') || titleLower.includes('감') || 
      titleLower.includes('복숭아') || titleLower.includes('과일')) {
    return '과일';
  }
  
  if (titleLower.includes('감자') || titleLower.includes('고구마') || titleLower.includes('양파') || 
      titleLower.includes('마늘') || titleLower.includes('배추') || titleLower.includes('무') ||
      titleLower.includes('채소') || titleLower.includes('시금치') || titleLower.includes('상추')) {
    return '채소';
  }
  
  if (titleLower.includes('쌀') || titleLower.includes('잡곡') || titleLower.includes('콩') || 
      titleLower.includes('보리') || titleLower.includes('현미') || titleLower.includes('곡물')) {
    return '곡물';
  }
  
  if (titleLower.includes('소고기') || titleLower.includes('돼지') || titleLower.includes('닭') || 
      titleLower.includes('한우') || titleLower.includes('축산') || titleLower.includes('고기')) {
    return '축산물';
  }
  
  if (titleLower.includes('생선') || titleLower.includes('새우') || titleLower.includes('조개') || 
      titleLower.includes('수산') || titleLower.includes('해산물')) {
    return '수산물';
  }
  
  if (titleLower.includes('김치') || titleLower.includes('장아찌') || titleLower.includes('젓갈') ||
      titleLower.includes('된장') || titleLower.includes('고추장') || titleLower.includes('가공')) {
    return '가공식품';
  }
  
  if (titleLower.includes('차') || titleLower.includes('녹차') || titleLower.includes('홍차') || 
      titleLower.includes('건강') || titleLower.includes('즙')) {
    return '건강식품';
  }
  
  if (titleLower.includes('술') || titleLower.includes('막걸리') || titleLower.includes('소주') || 
      titleLower.includes('전통주')) {
    return '전통주';
  }
  
  return '농산물';
}

function generateTags(title: string, categoryName?: string): string[] {
  const tags = ['농산물', '전남', '나주'];
  const titleLower = title.toLowerCase();
  
  // Add category-based tags
  if (categoryName) {
    if (categoryName.includes('특가') || categoryName.includes('기획')) tags.push('특가');
    if (categoryName.includes('신상품')) tags.push('신상품');
    if (categoryName.includes('인기')) tags.push('인기상품');
  }
  
  // Add product-specific tags
  if (titleLower.includes('무농약') || titleLower.includes('친환경') || titleLower.includes('유기농')) {
    tags.push('친환경');
  }
  
  if (titleLower.includes('국산') || titleLower.includes('우리')) {
    tags.push('국산');
  }
  
  if (titleLower.includes('블루베리')) tags.push('블루베리');
  if (titleLower.includes('소고기')) tags.push('소고기');
  if (titleLower.includes('한우')) tags.push('한우');
  if (titleLower.includes('쌀')) tags.push('쌀');
  if (titleLower.includes('전통주')) tags.push('전통주');
  
  return [...new Set(tags)];
}

// Run the scraper
scrapeNajuMallProducts()
  .then((products) => {
    console.log(`\n🎉 Successfully scraped ${products.length} products from Naju Mall!`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Scraping failed:', error.message);
    process.exit(1);
  });