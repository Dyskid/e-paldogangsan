import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

interface Product {
  title: string;
  price: string;
  image: string;
  url: string;
  description?: string;
  category?: string;
}

function cleanText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function extractPrice(text: string): string {
  const priceMatch = text.match(/[\d,]+원/);
  return priceMatch ? priceMatch[0] : '';
}

async function scrapeGochangProducts() {
  console.log('🚀 Starting comprehensive 고창마켓 product scraping...');

  const baseUrl = 'https://noblegochang.com';
  const products: Product[] = [];
  const errors: string[] = [];
  
  // Categories to scrape
  const categories = [
    { name: '전체상품', url: 'https://noblegochang.com/category/전체상품/175/', id: '175' },
    { name: '과일·채소', url: 'https://noblegochang.com/category/과일·채소/139/', id: '139' },
    { name: '과일', url: 'https://noblegochang.com/category/과일/142/', id: '142' },
    { name: '채소', url: 'https://noblegochang.com/category/채소/144/', id: '144' },
    { name: '쌀·잡곡·견과', url: 'https://noblegochang.com/category/쌀·잡곡·견과/140/', id: '140' },
    { name: '해산·수산·육류', url: 'https://noblegochang.com/category/해산·수산·육류/141/', id: '141' },
    { name: '가공식품', url: 'https://noblegochang.com/category/가공식품/145/', id: '145' },
    { name: '건강식품', url: 'https://noblegochang.com/category/건강식품/146/', id: '146' }
  ];

  // First, let's try to get product URLs from the homepage or category pages
  const productUrls = new Set<string>();

  try {
    console.log('🔍 Collecting product URLs from homepage...');
    const homepageResponse = await axios.get(baseUrl, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const $ = cheerio.load(homepageResponse.data);
    
    // Extract product URLs from homepage
    $('a[href*="/product/"]').each((_, element) => {
      let href = $(element).attr('href');
      if (href && !href.includes('recent_view') && !href.includes('wish')) {
        if (href.startsWith('/')) {
          href = baseUrl + href;
        }
        // Only add if it looks like a real product URL with ID
        if (href.match(/\/\d+\//) && !href.includes('javascript')) {
          productUrls.add(href);
        }
      }
    });

    console.log(`📦 Found ${productUrls.size} product URLs from homepage`);

  } catch (error) {
    console.error('❌ Error getting homepage:', error.message);
    errors.push(`Homepage error: ${error.message}`);
  }

  // Collect more URLs from category pages
  for (const category of categories) {
    try {
      console.log(`🔍 Scraping category: ${category.name}`);
      
      const response = await axios.get(category.url, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      
      // Extract product URLs from category page
      $('a[href*="/product/"]').each((_, element) => {
        let href = $(element).attr('href');
        if (href && !href.includes('recent_view') && !href.includes('wish')) {
          if (href.startsWith('/')) {
            href = baseUrl + href;
          }
          // Only add if it looks like a real product URL with ID
          if (href.match(/\/\d+\//) && !href.includes('javascript')) {
            productUrls.add(href);
          }
        }
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ Error scraping category ${category.name}:`, error.message);
      errors.push(`Category ${category.name} error: ${error.message}`);
    }
  }

  console.log(`\n📊 Total unique product URLs collected: ${productUrls.size}`);

  // Now scrape individual product pages
  let processedCount = 0;
  const urlArray = Array.from(productUrls);

  for (const productUrl of urlArray) {
    try {
      processedCount++;
      console.log(`🔍 Scraping product ${processedCount}/${urlArray.length}: ${productUrl}`);
      
      const response = await axios.get(productUrl, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      
      // Extract product details
      let title = '';
      const titleSelectors = [
        '.item_detail_tit',
        '.product_title',
        '.goods_name',
        '.item_title',
        'h1',
        'h2',
        '.title'
      ];
      
      for (const selector of titleSelectors) {
        const titleText = cleanText($(selector).text());
        if (titleText && titleText.length > 3 && !titleText.includes('최근본상품')) {
          title = titleText;
          break;
        }
      }
      
      // If no title found from selectors, try from page title or meta
      if (!title) {
        const pageTitle = $('title').text();
        if (pageTitle && !pageTitle.includes('고창마켓')) {
          title = cleanText(pageTitle.replace('고창마켓', '').replace('|', '').replace('-', ''));
        }
      }
      
      // Extract price
      let price = '';
      const priceSelectors = [
        '.item_price',
        '.price',
        '.cost',
        '.amount',
        '.sales_price',
        '.product_price'
      ];
      
      for (const selector of priceSelectors) {
        const priceText = $(selector).text();
        const extractedPrice = extractPrice(priceText);
        if (extractedPrice) {
          price = extractedPrice;
          break;
        }
      }
      
      // Extract image
      let image = '';
      const imageSelectors = [
        '.item_photo_big img',
        '.product_image img',
        '.goods_image img',
        '.main_image img',
        '.big_image img'
      ];
      
      for (const selector of imageSelectors) {
        const imgSrc = $(selector).attr('src') || $(selector).attr('data-src');
        if (imgSrc) {
          image = imgSrc.startsWith('http') ? imgSrc : baseUrl + imgSrc;
          break;
        }
      }
      
      // If no main image found, try any image
      if (!image) {
        const anyImg = $('img').first();
        const imgSrc = anyImg.attr('src') || anyImg.attr('data-src');
        if (imgSrc && imgSrc.includes('product')) {
          image = imgSrc.startsWith('http') ? imgSrc : baseUrl + imgSrc;
        }
      }
      
      // Extract description
      let description = '';
      const descSelectors = [
        '.item_description',
        '.product_description',
        '.goods_description',
        '.summary'
      ];
      
      for (const selector of descSelectors) {
        const descText = cleanText($(selector).text());
        if (descText && descText.length > 10) {
          description = descText.substring(0, 200);
          break;
        }
      }
      
      // Determine category from URL
      let category = '기타';
      if (productUrl.includes('/139/')) category = '과일·채소';
      else if (productUrl.includes('/142/')) category = '과일';
      else if (productUrl.includes('/144/')) category = '채소';
      else if (productUrl.includes('/140/')) category = '쌀·잡곡·견과';
      else if (productUrl.includes('/141/')) category = '해산·수산·육류';
      else if (productUrl.includes('/145/')) category = '가공식품';
      else if (productUrl.includes('/146/')) category = '건강식품';

      if (title && title.length > 2 && !title.includes('최근본상품') && !title.includes('위시리스트')) {
        const product: Product = {
          title,
          price: price || '가격문의',
          image: image || '',
          url: productUrl,
          description,
          category
        };

        products.push(product);
        
        if (processedCount % 10 === 0) {
          console.log(`📈 Progress: ${processedCount}/${urlArray.length} (${products.length} valid products)`);
        }
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1500));
      
    } catch (error) {
      console.error(`❌ Error scraping product ${productUrl}:`, error.message);
      errors.push(`Product ${productUrl}: ${error.message}`);
      
      // Continue on error
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Save results
  const outputPath = path.join(__dirname, 'output');
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }

  fs.writeFileSync(
    path.join(outputPath, 'gochang-products.json'),
    JSON.stringify(products, null, 2)
  );

  const summary = {
    timestamp: new Date().toISOString(),
    mall: '고창마켓',
    totalUrlsFound: urlArray.length,
    totalProductsScraped: products.length,
    successRate: ((products.length / urlArray.length) * 100).toFixed(2) + '%',
    errors: errors.length,
    categories: products.reduce((acc, p) => {
      acc[p.category || '기타'] = (acc[p.category || '기타'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    sampleProducts: products.slice(0, 5).map(p => ({
      title: p.title,
      price: p.price,
      category: p.category
    }))
  };

  fs.writeFileSync(
    path.join(outputPath, 'gochang-scrape-summary.json'),
    JSON.stringify(summary, null, 2)
  );

  if (errors.length > 0) {
    fs.writeFileSync(
      path.join(outputPath, 'gochang-scrape-errors.txt'),
      errors.join('\n')
    );
  }

  console.log('\n✅ Scraping completed!');
  console.log(`📊 Results: ${products.length} products from ${urlArray.length} URLs`);
  console.log(`📈 Success rate: ${summary.successRate}`);
  console.log(`❌ Errors: ${errors.length}`);
  
  console.log('\n🏷️ Category distribution:');
  Object.entries(summary.categories).forEach(([category, count]) => {
    console.log(`   ${category}: ${count} products`);
  });
  
  console.log('\n📄 Files saved:');
  console.log(`   Products: ${path.join(outputPath, 'gochang-products.json')}`);
  console.log(`   Summary: ${path.join(outputPath, 'gochang-scrape-summary.json')}`);
  if (errors.length > 0) {
    console.log(`   Errors: ${path.join(outputPath, 'gochang-scrape-errors.txt')}`);
  }
}

scrapeGochangProducts().catch(console.error);