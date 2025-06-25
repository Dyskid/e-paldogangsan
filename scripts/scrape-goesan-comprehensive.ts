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
  mall: string;
  region: string;
  tags: string[];
  description?: string;
  inStock: boolean;
}

async function scrapeGoesanComprehensive() {
  console.log('🚀 Starting comprehensive Goesan Marketplace scraping...');
  
  const baseUrl = 'https://www.gsjangter.go.kr';
  const products: Product[] = [];
  const scrapedIds = new Set<string>();

  // Common headers
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1'
  };

  try {
    // First, collect all product URLs from the analysis
    console.log('📋 Step 1: Loading product URLs from analysis...');
    
    const analysisPath = '/mnt/c/Users/johndoe/Desktop/e-paldogangsan/scripts/output/goesan-analysis.json';
    const analysis = JSON.parse(fs.readFileSync(analysisPath, 'utf-8'));
    
    // Filter out non-product URLs (remove javascript: links)
    const validProductUrls = analysis.productUrls.filter((url: string) => 
      url.includes('/products/view/') && !url.includes('javascript:')
    );

    console.log(`📦 Found ${validProductUrls.length} valid product URLs`);

    // Extract product IDs from URLs
    const productIds = new Set<string>();
    validProductUrls.forEach((url: string) => {
      const match = url.match(/products\/view\/([A-Z0-9]+)/);
      if (match) {
        productIds.add(match[1]);
      }
    });

    console.log(`🔢 Unique product IDs: ${productIds.size}`);

    // Try to find more products by exploring category pages
    console.log('📋 Step 2: Exploring category pages for more products...');
    
    const categoryPages = [
      '/categories/index/season',
      '/event/new',
      '/event/best',
      '/event/md'
    ];

    for (const categoryPath of categoryPages) {
      try {
        console.log(`🏷️ Checking category: ${categoryPath}`);
        const categoryUrl = `${baseUrl}${categoryPath}`;
        const categoryResponse = await axios.get(categoryUrl, { timeout: 10000, headers });
        const $category = cheerio.load(categoryResponse.data);
        
        // Look for product links
        $category('a[href*="/products/view/"]').each((i, el) => {
          const href = $category(el).attr('href');
          if (href) {
            const match = href.match(/products\/view\/([A-Z0-9]+)/);
            if (match) {
              productIds.add(match[1]);
            }
          }
        });
        
        await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
        
      } catch (error) {
        console.log(`⚠️ Could not access category: ${categoryPath}`);
      }
    }

    console.log(`📦 Total unique product IDs found: ${productIds.size}`);

    // Step 3: Scrape individual products
    console.log('\n📋 Step 3: Scraping individual products...');
    
    let processedCount = 0;
    const totalProducts = productIds.size;

    for (const productId of Array.from(productIds)) {
      try {
        processedCount++;
        console.log(`\n📦 Processing product ${processedCount}/${totalProducts}: ${productId}`);

        if (scrapedIds.has(productId)) {
          console.log('⏭️ Already scraped, skipping...');
          continue;
        }

        const productUrl = `${baseUrl}/products/view/${productId}`;
        const response = await axios.get(productUrl, {
          timeout: 15000,
          headers,
          validateStatus: (status) => status < 500 // Accept 4xx but not 5xx
        });

        if (response.status >= 400) {
          console.log(`⚠️ HTTP ${response.status} for product ${productId}`);
          continue;
        }

        const $ = cheerio.load(response.data);

        // Extract product information
        let title = '';

        // Try different title selectors - prioritize the product name element
        const titleSelectors = ['.prd_name', '#itemTitle', '.name', 'h1', '.product-title', '.product-name'];
        for (const selector of titleSelectors) {
          const element = $(selector).first();
          if (element.length > 0) {
            const text = element.text().trim();
            if (text && text.length > 2 && !text.includes('대메뉴')) {
              title = text;
              break;
            }
          }
        }

        // If no title found, try to get from page title
        if (!title) {
          const pageTitle = $('title').text();
          if (pageTitle) {
            title = pageTitle.replace('괴산군청공식몰 괴산장터', '').trim();
          }
        }

        if (!title) {
          console.log('❌ No title found, skipping...');
          continue;
        }

        // Extract price - look for the actual sale price
        let price = '';
        
        // First try to get the sale price (current price)
        const salePrice = $('.set_prc .point').first();
        if (salePrice.length > 0) {
          const priceText = salePrice.text().trim();
          if (priceText && priceText.length > 0) {
            price = priceText + '원';
          }
        }
        
        // If no sale price, try original price
        if (!price) {
          const originalPrice = $('.item_prc span').first();
          if (originalPrice.length > 0) {
            const priceText = originalPrice.text().trim();
            if (priceText && priceText.length > 0) {
              price = priceText + '원';
            }
          }
        }
        
        // Try other price selectors as fallback
        if (!price) {
          const priceSelectors = ['.set_price strong', '.price', 'span[class*="price"]'];
          for (const selector of priceSelectors) {
            const element = $(selector).first();
            if (element.length > 0) {
              const text = element.text().trim();
              if (text && text.length > 0 && !text.includes('0')) {
                price = text.includes('원') ? text : text + '원';
                break;
              }
            }
          }
        }

        if (!price) {
          console.log('❌ No price found, skipping...');
          continue;
        }

        // Clean and format price
        const priceMatch = price.match(/[\d,]+/);
        if (!priceMatch) {
          console.log('❌ Invalid price format, skipping...');
          continue;
        }

        const numericPrice = parseInt(priceMatch[0].replace(/,/g, ''));
        if (numericPrice <= 0) {
          console.log('❌ Invalid price value, skipping...');
          continue;
        }
        
        const formattedPrice = `${numericPrice.toLocaleString()}원`;

        // Extract image
        let image = '';
        const imgSelectors = ['img[src*="item"]', '.thumbnail img', '.product-image img'];

        for (const selector of imgSelectors) {
          const element = $(selector).first();
          if (element.length > 0) {
            const src = element.attr('src');
            if (src) {
              image = src.startsWith('http') ? src : `${baseUrl}${src}`;
              break;
            }
          }
        }

        if (!image) {
          console.log('⚠️ No image found');
        }

        // Determine category from title
        let category = '농특산품';
        const titleLower = title.toLowerCase();
        
        if (titleLower.includes('쌀') || titleLower.includes('현미') || titleLower.includes('찹쌀')) {
          category = '쌀/곡류';
        } else if (titleLower.includes('배추') || titleLower.includes('김치') || titleLower.includes('절임')) {
          category = '김치/절임류';
        } else if (titleLower.includes('브로콜리') || titleLower.includes('당근') || titleLower.includes('양파') || titleLower.includes('채소')) {
          category = '채소류';
        } else if (titleLower.includes('사과') || titleLower.includes('배') || titleLower.includes('포도') || titleLower.includes('과일')) {
          category = '과일류';
        } else if (titleLower.includes('된장') || titleLower.includes('고추장') || titleLower.includes('간장')) {
          category = '발효식품';
        } else if (titleLower.includes('들기름') || titleLower.includes('참기름')) {
          category = '기름/참깨';
        } else if (titleLower.includes('꿀') || titleLower.includes('잼')) {
          category = '가공식품';
        } else if (titleLower.includes('한약') || titleLower.includes('약초')) {
          category = '건강식품';
        } else if (titleLower.includes('버섯')) {
          category = '버섯류';
        }

        // Generate appropriate tags
        const tags = ['괴산특산품', '충북특산품'];
        
        if (titleLower.includes('유기농') || titleLower.includes('친환경')) tags.push('친환경');
        if (titleLower.includes('전통')) tags.push('전통');
        if (titleLower.includes('수제')) tags.push('수제');
        if (titleLower.includes('국내산')) tags.push('국내산');
        if (titleLower.includes('농협')) tags.push('농협');
        if (titleLower.includes('햇')) tags.push('햇');
        if (titleLower.includes('신선')) tags.push('신선');
        if (titleLower.includes('당일수확')) tags.push('당일수확');

        const product: Product = {
          id: `goesan_${productId}`,
          title: title,
          price: formattedPrice,
          image: image,
          url: productUrl,
          category: category,
          mall: '괴산장터',
          region: '충청북도',
          tags: tags,
          inStock: true
        };

        products.push(product);
        scrapedIds.add(productId);

        console.log(`✅ Successfully scraped: ${title}`);
        console.log(`   💰 Price: ${formattedPrice}`);
        console.log(`   🏷️ Category: ${category}`);
        console.log(`   📸 Image: ${image ? 'Found' : 'Missing'}`);

        // Rate limiting - wait between requests
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error: any) {
        console.error(`❌ Error scraping product ${productId}:`, error.message);
        continue;
      }
    }

    console.log(`\n🎉 Scraping completed! Total products: ${products.length}`);

    // Save results
    const summary = {
      timestamp: new Date().toISOString(),
      totalProducts: products.length,
      mall: '괴산장터',
      region: '충청북도',
      categories: [...new Set(products.map(p => p.category))],
      averagePrice: products.length > 0 ? Math.round(products.reduce((sum, p) => sum + parseInt(p.price.replace(/[^\d]/g, '')), 0) / products.length) : 0,
      priceRange: {
        min: products.length > 0 ? Math.min(...products.map(p => parseInt(p.price.replace(/[^\d]/g, '')))) : 0,
        max: products.length > 0 ? Math.max(...products.map(p => parseInt(p.price.replace(/[^\d]/g, '')))) : 0
      }
    };

    // Save products
    fs.writeFileSync(
      '/mnt/c/Users/johndoe/Desktop/e-paldogangsan/scripts/output/goesan-products.json',
      JSON.stringify(products, null, 2)
    );

    // Save summary
    fs.writeFileSync(
      '/mnt/c/Users/johndoe/Desktop/e-paldogangsan/scripts/output/goesan-scrape-summary.json',
      JSON.stringify(summary, null, 2)
    );

    console.log(`💾 Products saved to: goesan-products.json`);
    console.log(`📊 Summary saved to: goesan-scrape-summary.json`);

    return { products, summary };

  } catch (error: any) {
    console.error('❌ Fatal error during scraping:', error.message);
    throw error;
  }
}

// Run the scraper
scrapeGoesanComprehensive().catch(console.error);