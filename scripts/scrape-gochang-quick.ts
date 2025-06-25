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

async function scrapeGochangQuick() {
  console.log('🚀 Starting quick 고창마켓 product scraping...');

  const baseUrl = 'https://noblegochang.com';
  const products: Product[] = [];
  const errors: string[] = [];
  
  try {
    console.log('🔍 Loading homepage for product extraction...');
    const homepageResponse = await axios.get(baseUrl, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const $ = cheerio.load(homepageResponse.data);
    
    // Extract product information directly from homepage
    const productSelectors = [
      '.item', '.product', '.goods', '.prdItem',
      '.product-item', '.goods-item', '.item-inner',
      '.recommend-item', '.main-item'
    ];
    
    let extractedFromHomepage = 0;
    
    for (const selector of productSelectors) {
      const items = $(selector);
      if (items.length > 0) {
        console.log(`✅ Found ${items.length} items with selector: ${selector}`);
        
        items.each((_, element) => {
          const $el = $(element);
          
          // Extract title
          let title = '';
          const titleSelectors = ['h3', 'h4', '.title', '.name', '.prd-name', 'strong', 'a'];
          for (const titleSel of titleSelectors) {
            const titleEl = $el.find(titleSel).first();
            const titleText = cleanText(titleEl.text() || titleEl.attr('title') || '');
            if (titleText && titleText.length > 5 && 
                !titleText.includes('최근본상품') && 
                !titleText.includes('위시리스트') &&
                !titleText.includes('장바구니') &&
                !titleText.includes('주문') &&
                !titleText.includes('배송')) {
              title = titleText;
              break;
            }
          }
          
          // Extract URL
          const linkEl = $el.find('a').first();
          let url = linkEl.attr('href') || '';
          if (url && url.startsWith('/')) {
            url = baseUrl + url;
          }
          
          // Skip if URL doesn't look like a product
          if (!url.includes('/product/') || 
              url.includes('recent_view') || 
              url.includes('wish') ||
              !url.match(/\/\d+\//)) {
            return;
          }
          
          // Extract price
          let price = '';
          const priceSelectors = ['.price', '.cost', '.amount', '.won', '.원', '.sale_price'];
          for (const priceSel of priceSelectors) {
            const priceText = $el.find(priceSel).text().trim();
            const extractedPrice = extractPrice(priceText);
            if (extractedPrice) {
              price = extractedPrice;
              break;
            }
          }
          
          // Extract image
          let image = '';
          const imgEl = $el.find('img').first();
          const imgSrc = imgEl.attr('src') || imgEl.attr('data-src') || imgEl.attr('data-original');
          if (imgSrc) {
            image = imgSrc.startsWith('http') ? imgSrc : baseUrl + imgSrc;
          }
          
          // Extract description from alt or title
          let description = imgEl.attr('alt') || linkEl.attr('title') || '';
          description = cleanText(description);
          
          // Determine basic category from title
          let category = '기타';
          const titleLower = title.toLowerCase();
          if (titleLower.includes('복분자') || titleLower.includes('오디') || titleLower.includes('딸기') || titleLower.includes('블루베리')) {
            category = '과일';
          } else if (titleLower.includes('수박') || titleLower.includes('멜론')) {
            category = '과일';
          } else if (titleLower.includes('쌀') || titleLower.includes('콩') || titleLower.includes('깨')) {
            category = '쌀·잡곡·견과';
          } else if (titleLower.includes('장어') || titleLower.includes('육류')) {
            category = '해산·수산·육류';
          } else if (titleLower.includes('차') || titleLower.includes('즙') || titleLower.includes('원액')) {
            category = '차·음료';
          } else if (titleLower.includes('버터') || titleLower.includes('기름') || titleLower.includes('간장') || titleLower.includes('소금')) {
            category = '가공식품';
          } else if (titleLower.includes('환') || titleLower.includes('보감')) {
            category = '건강식품';
          }

          if (title && title.length > 3 && url) {
            const product: Product = {
              title,
              price: price || '가격문의',
              image: image || '',
              url,
              description: description.substring(0, 100),
              category
            };

            // Check for duplicates
            const isDuplicate = products.some(p => p.title === title && p.url === url);
            if (!isDuplicate) {
              products.push(product);
              extractedFromHomepage++;
            }
          }
        });
        
        if (extractedFromHomepage > 0) {
          console.log(`📦 Extracted ${extractedFromHomepage} products from homepage`);
          break; // Found products, no need to try other selectors
        }
      }
    }
    
    // If we didn't get many products from the homepage, try to get some individual product pages
    if (products.length < 20) {
      console.log('🔍 Not enough products from homepage, trying individual pages...');
      
      // Get product URLs
      const productUrls = new Set<string>();
      $('a[href*="/product/"]').each((_, element) => {
        let href = $(element).attr('href');
        if (href && !href.includes('recent_view') && !href.includes('wish')) {
          if (href.startsWith('/')) {
            href = baseUrl + href;
          }
          if (href.match(/\/\d+\//) && !href.includes('javascript')) {
            productUrls.add(href);
          }
        }
      });
      
      const urlArray = Array.from(productUrls).slice(0, 30); // Limit to 30 for speed
      console.log(`📦 Found ${urlArray.length} product URLs to scrape`);
      
      for (let i = 0; i < urlArray.length; i++) {
        const productUrl = urlArray[i];
        
        try {
          console.log(`🔍 Scraping ${i + 1}/${urlArray.length}: ${productUrl.substring(0, 80)}...`);
          
          const response = await axios.get(productUrl, {
            timeout: 15000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
          });

          const productPage$ = cheerio.load(response.data);
          
          // Extract title
          let title = '';
          const titleSelectors = [
            '.item_detail_tit',
            '.product_title',
            '.goods_name',
            'h1',
            'h2'
          ];
          
          for (const selector of titleSelectors) {
            const titleText = cleanText(productPage$(selector).text());
            if (titleText && titleText.length > 3) {
              title = titleText;
              break;
            }
          }
          
          // Extract from page title if needed
          if (!title) {
            const pageTitle = productPage$('title').text();
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
            '.sales_price'
          ];
          
          for (const selector of priceSelectors) {
            const priceText = productPage$(selector).text();
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
            '.big_image img'
          ];
          
          for (const selector of imageSelectors) {
            const imgSrc = productPage$(selector).attr('src') || productPage$(selector).attr('data-src');
            if (imgSrc) {
              image = imgSrc.startsWith('http') ? imgSrc : baseUrl + imgSrc;
              break;
            }
          }
          
          // Basic category detection
          let category = '기타';
          const titleLower = title.toLowerCase();
          if (titleLower.includes('복분자') || titleLower.includes('딸기') || titleLower.includes('블루베리')) {
            category = '과일';
          } else if (titleLower.includes('쌀') || titleLower.includes('콩')) {
            category = '쌀·잡곡·견과';
          } else if (titleLower.includes('장어')) {
            category = '해산·수산·육류';
          } else if (titleLower.includes('차') || titleLower.includes('즙')) {
            category = '차·음료';
          }

          if (title && title.length > 3) {
            const product: Product = {
              title,
              price: price || '가격문의',
              image: image || '',
              url: productUrl,
              category
            };

            // Check for duplicates
            const isDuplicate = products.some(p => p.title === title);
            if (!isDuplicate) {
              products.push(product);
            }
          }
          
          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 800));
          
        } catch (error) {
          console.log(`⚠️  Skipping product (${error.message.substring(0, 50)}...)`);
          errors.push(`${productUrl}: ${error.message}`);
          continue;
        }
      }
    }

  } catch (error) {
    console.error('❌ Error during scraping:', error.message);
    errors.push(`Homepage error: ${error.message}`);
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
    totalProductsScraped: products.length,
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

  console.log('\n✅ Quick scraping completed!');
  console.log(`📊 Results: ${products.length} products extracted`);
  console.log(`❌ Errors: ${errors.length}`);
  
  console.log('\n🏷️ Category distribution:');
  Object.entries(summary.categories).forEach(([category, count]) => {
    console.log(`   ${category}: ${count} products`);
  });
  
  console.log('\n📄 Sample products:');
  products.slice(0, 5).forEach((product, i) => {
    console.log(`   ${i + 1}. ${product.title} - ${product.price}`);
  });
  
  console.log('\n📄 Files saved:');
  console.log(`   Products: ${path.join(outputPath, 'gochang-products.json')}`);
  console.log(`   Summary: ${path.join(outputPath, 'gochang-scrape-summary.json')}`);
}

scrapeGochangQuick().catch(console.error);