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

async function scrapeSCLocalProducts() {
  const baseUrl = 'https://sclocal.kr';
  const products: Product[] = [];
  const errors: string[] = [];
  
  try {
    console.log('🚀 Starting SC Local (순천로컬푸드) comprehensive scraping...');
    
    // Categories to scrape
    const categories = [
      { id: '436', name: '농산물', mainCategory: '농산물' },
      { id: '461', name: '과일류', mainCategory: '농산물' },
      { id: '469', name: '신선채소', mainCategory: '농산물' },
      { id: '472', name: '버섯류', mainCategory: '농산물' },
      { id: '471', name: '견과류', mainCategory: '농산물' },
      { id: '460', name: '곡류/잡곡/두류', mainCategory: '농산물' },
      { id: '470', name: '특약용/건농산물', mainCategory: '농산물' },
      { id: '442', name: '축산물', mainCategory: '축산물' },
      { id: '473', name: '한우', mainCategory: '축산물' },
      { id: '474', name: '돼지', mainCategory: '축산물' },
      { id: '475', name: '오리/닭', mainCategory: '축산물' },
      { id: '476', name: '계란', mainCategory: '축산물' },
      { id: '443', name: '수산물', mainCategory: '수산물' },
      { id: '444', name: '가공식품', mainCategory: '가공식품' },
      { id: '462', name: '김치/반찬', mainCategory: '가공식품' },
      { id: '463', name: '떡/빵', mainCategory: '가공식품' },
      { id: '464', name: '밀키트/HMR', mainCategory: '가공식품' },
      { id: '465', name: '엑기스/즙', mainCategory: '가공식품' },
      { id: '466', name: '차류', mainCategory: '가공식품' },
      { id: '467', name: '장류/젓갈류', mainCategory: '가공식품' },
      { id: '468', name: '꿀/조청', mainCategory: '가공식품' }
    ];
    
    // Scrape each category
    for (const category of categories) {
      console.log(`\n📦 Scraping category: ${category.name} (${category.id})`);
      
      try {
        // Get first page to check total pages
        const firstPageUrl = `${baseUrl}/?pn=product.list&cuid=${category.id}`;
        const firstPageResponse = await axios.get(firstPageUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          timeout: 30000
        });
        
        const $ = cheerio.load(firstPageResponse.data);
        
        // Extract products from first page
        const categoryProducts = extractProducts($, category, baseUrl);
        products.push(...categoryProducts);
        console.log(`  ✅ Found ${categoryProducts.length} products on page 1`);
        
        // Check for pagination
        const totalPages = getTotalPages($);
        
        // Scrape additional pages if they exist
        for (let page = 2; page <= Math.min(totalPages, 10); page++) { // Limit to 10 pages per category
          try {
            console.log(`  📄 Scraping page ${page}/${totalPages}`);
            const pageUrl = `${baseUrl}/?pn=product.list&cuid=${category.id}&listpg=${page}`;
            
            const pageResponse = await axios.get(pageUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
              },
              timeout: 30000
            });
            
            const $page = cheerio.load(pageResponse.data);
            const pageProducts = extractProducts($page, category, baseUrl);
            products.push(...pageProducts);
            console.log(`  ✅ Found ${pageProducts.length} products on page ${page}`);
            
            // Small delay to avoid overwhelming the server
            await new Promise(resolve => setTimeout(resolve, 1000));
            
          } catch (error) {
            console.error(`  ❌ Error scraping page ${page}:`, error.message);
            errors.push(`Category ${category.name} page ${page}: ${error.message}`);
          }
        }
        
      } catch (error) {
        console.error(`❌ Error scraping category ${category.name}:`, error.message);
        errors.push(`Category ${category.name}: ${error.message}`);
      }
      
      // Delay between categories
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Remove duplicates
    const uniqueProducts = removeDuplicates(products);
    console.log(`\n🎯 Total unique products found: ${uniqueProducts.length}`);
    
    // Save results
    const summary = {
      totalProducts: uniqueProducts.length,
      mall: '순천로컬푸드 함께가게',
      region: '전남',
      baseUrl: baseUrl,
      categories: [...new Set(uniqueProducts.map(p => p.category))],
      scrapeDate: new Date().toISOString(),
      errors: errors,
      sampleProducts: uniqueProducts.slice(0, 5).map(p => ({ 
        title: p.title, 
        price: p.price, 
        category: p.category 
      }))
    };
    
    fs.writeFileSync('./output/sclocal-products.json', JSON.stringify(uniqueProducts, null, 2));
    fs.writeFileSync('./output/sclocal-scrape-summary.json', JSON.stringify(summary, null, 2));
    
    console.log('\n📊 Scraping Summary:');
    console.log(`Total products: ${uniqueProducts.length}`);
    console.log(`Categories: ${summary.categories.join(', ')}`);
    console.log(`Errors: ${errors.length}`);
    console.log('Sample products:');
    summary.sampleProducts.forEach((p, i) => {
      console.log(`  ${i+1}. ${p.title} - ${p.price} (${p.category})`);
    });
    console.log('✅ Results saved to sclocal-products.json and sclocal-scrape-summary.json');
    
    return uniqueProducts;
    
  } catch (error) {
    console.error('❌ Fatal error during scraping:', error);
    throw error;
  }
}

function extractProducts($: cheerio.CheerioAPI, category: any, baseUrl: string): Product[] {
  const products: Product[] = [];
  
  $('.item_list .item_box').each((index, element) => {
    try {
      const $item = $(element);
      
      // Extract product URL
      const relativeUrl = $item.find('a').first().attr('href');
      if (!relativeUrl) return;
      
      const productUrl = relativeUrl.startsWith('http') ? relativeUrl : `${baseUrl}/${relativeUrl}`;
      
      // Extract product code from URL
      const pcode = extractProductCode(relativeUrl);
      const productId = `sclocal-${pcode}`;
      
      // Extract title
      const title = $item.find('.item_name').text().trim();
      if (!title) return;
      
      // Extract price
      const priceText = $item.find('.price').text().trim();
      const price = cleanPrice(priceText);
      if (!price || price === '원') return;
      
      // Extract image
      let image = $item.find('img').first().attr('src') || '';
      if (image && !image.startsWith('http')) {
        image = image.startsWith('//') ? 'https:' + image : `${baseUrl}${image}`;
      }
      
      // Extract sold out status
      const isSoldOut = $item.find('.soldout, .sold_out').length > 0;
      
      products.push({
        id: productId,
        title: cleanTitle(title),
        price: price,
        image: image,
        url: productUrl,
        category: category.mainCategory,
        mall: '순천로컬푸드 함께가게',
        region: '전남',
        tags: generateTags(title, category.name),
        inStock: !isSoldOut
      });
      
    } catch (error) {
      console.error(`Error extracting product ${index}:`, error);
    }
  });
  
  return products;
}

function getTotalPages($: cheerio.CheerioAPI): number {
  // Look for pagination
  const pageLinks = $('.paginate a, .paging a, .pagination a');
  let maxPage = 1;
  
  pageLinks.each((i, el) => {
    const pageText = $(el).text().trim();
    const pageNum = parseInt(pageText);
    if (!isNaN(pageNum) && pageNum > maxPage) {
      maxPage = pageNum;
    }
  });
  
  // Also check for "last" or "마지막" link
  const lastLink = $('a[href*="listpg="]').last().attr('href');
  if (lastLink) {
    const match = lastLink.match(/listpg=(\d+)/);
    if (match) {
      const lastPage = parseInt(match[1]);
      if (lastPage > maxPage) {
        maxPage = lastPage;
      }
    }
  }
  
  return maxPage;
}

function extractProductCode(url: string): string {
  const match = url.match(/pcode=([^&]+)/);
  return match ? match[1] : `${Date.now()}`;
}

function cleanTitle(title: string): string {
  return title
    .replace(/\s+/g, ' ')
    .replace(/[\n\r\t]/g, ' ')
    .trim();
}

function cleanPrice(price: string): string {
  // Extract numeric value and ensure it has "원"
  const numericPrice = price.replace(/[^\d,]/g, '');
  if (!numericPrice) return '';
  
  return `${numericPrice}원`;
}

function removeDuplicates(products: Product[]): Product[] {
  const seen = new Set<string>();
  return products.filter(product => {
    if (seen.has(product.id)) {
      return false;
    }
    seen.add(product.id);
    return true;
  });
}

function generateTags(title: string, categoryName: string): string[] {
  const tags = ['농산물', '전남', '순천', '로컬푸드'];
  const titleLower = title.toLowerCase();
  
  // Add category-based tags
  if (categoryName.includes('과일')) tags.push('과일');
  if (categoryName.includes('채소')) tags.push('채소');
  if (categoryName.includes('버섯')) tags.push('버섯');
  if (categoryName.includes('곡류') || categoryName.includes('잡곡')) tags.push('곡물');
  if (categoryName.includes('축산') || categoryName.includes('한우') || categoryName.includes('돼지')) tags.push('축산물');
  if (categoryName.includes('수산')) tags.push('수산물');
  if (categoryName.includes('가공')) tags.push('가공식품');
  
  // Add product-specific tags
  if (titleLower.includes('유기농') || titleLower.includes('무농약')) tags.push('친환경');
  if (titleLower.includes('당일')) tags.push('신선');
  if (titleLower.includes('국산') || titleLower.includes('우리')) tags.push('국산');
  if (titleLower.includes('토마토')) tags.push('토마토');
  if (titleLower.includes('호박')) tags.push('호박');
  if (titleLower.includes('죽순')) tags.push('죽순');
  if (titleLower.includes('딸기')) tags.push('딸기');
  if (titleLower.includes('감자')) tags.push('감자');
  if (titleLower.includes('고구마')) tags.push('고구마');
  
  return [...new Set(tags)];
}

// Run the scraper
scrapeSCLocalProducts()
  .then((products) => {
    console.log(`\n🎉 Successfully scraped ${products.length} products from SC Local!`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Scraping failed:', error.message);
    process.exit(1);
  });