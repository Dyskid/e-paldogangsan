import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';

interface Product {
  id: string;
  title: string;
  image: string;
  price: string;
  originalPrice?: string;
  description: string;
  category: string;
  subcategory?: string;
  mall: string;
  url: string;
  region: string;
  tags: string[];
}

interface ScrapeSummary {
  timestamp: string;
  mall: string;
  totalProducts: number;
  successCount: number;
  errorCount: number;
  errors: string[];
  sampleProducts: Product[];
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const cleanText = (text: string): string => {
  return text.replace(/\s+/g, ' ').trim();
};

const cleanPrice = (priceText: string): string => {
  const priceMatch = priceText.match(/₩([\d,]+)/);
  return priceMatch ? priceMatch[1].replace(/,/g, '') : '';
};

const extractProductId = (url: string): string => {
  const match = url.match(/\/product\/([^\/]+)/);
  return match ? match[1] : Math.random().toString(36).substr(2, 9);
};

async function scrapeCategoryProducts(categoryUrl: string, categoryName: string, maxProducts: number = 25): Promise<Product[]> {
  const products: Product[] = [];

  try {
    console.log(`Scraping ${categoryName} (max ${maxProducts} products)...`);
    
    const response = await axios.get(categoryUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);
    const productElements = $('.product').slice(0, maxProducts);

    console.log(`Found ${productElements.length} products to process`);

    productElements.each((index, element) => {
      try {
        const $product = $(element);
        
        // Extract product link
        const productLink = $product.find('a').first().attr('href');
        if (!productLink) return;

        // Extract title
        const titleElement = $product.find('.woocommerce-loop-product__title, h2, h3, .product-title');
        const title = cleanText(titleElement.text());
        if (!title || title.includes('옵션 선택')) return;

        // Extract image
        const imgElement = $product.find('img').first();
        let imageUrl = imgElement.attr('src') || imgElement.attr('data-src') || '';
        if (imageUrl && imageUrl.startsWith('/')) {
          imageUrl = 'https://www.danpoongmall.kr' + imageUrl;
        }

        // Extract price
        const priceElement = $product.find('.price, .woocommerce-Price-amount');
        const priceText = priceElement.text();
        const price = cleanPrice(priceText);

        // Skip if no price found
        if (!price) {
          console.log(`Skipping product without price: ${title}`);
          return;
        }

        // Extract original price if on sale
        let originalPrice: string | undefined;
        const originalPriceElement = $product.find('.price del .woocommerce-Price-amount');
        if (originalPriceElement.length > 0) {
          originalPrice = cleanPrice(originalPriceElement.text());
        }

        const productId = extractProductId(productLink);

        const product: Product = {
          id: productId,
          title: title,
          image: imageUrl,
          price: price,
          originalPrice: originalPrice,
          description: title,
          category: categoryName,
          mall: '단풍미인',
          url: productLink.startsWith('http') ? productLink : 'https://www.danpoongmall.kr' + productLink,
          region: '전라북도 정읍시',
          tags: ['정읍시', '전라북도', '단풍미인', '농산물']
        };

        // Add category-specific tags
        if (categoryName.includes('쌀') || categoryName.includes('잡곡')) {
          product.tags.push('쌀', '잡곡', '곡물');
        }
        if (categoryName.includes('축산') || categoryName.includes('수산') || categoryName.includes('한우')) {
          product.tags.push('축산물', '한우', '고기');
        }
        if (categoryName.includes('과일')) {
          product.tags.push('과일', '생과일');
        }
        if (categoryName.includes('채소')) {
          product.tags.push('채소', '농산물');
        }
        if (categoryName.includes('전통') || categoryName.includes('발효')) {
          product.tags.push('전통식품', '발효식품', '장류');
        }
        if (categoryName.includes('건강') || categoryName.includes('가공')) {
          product.tags.push('건강식품', '가공식품');
        }

        products.push(product);
        console.log(`✓ ${products.length}: ${title} - ₩${price}`);

      } catch (error) {
        console.error(`Error processing product ${index}:`, error);
      }
    });

  } catch (error) {
    console.error(`Error scraping ${categoryName}:`, error);
  }

  return products;
}

async function main() {
  console.log('=== 단풍미인 Mall Quick Scraping ===');
  
  const startTime = Date.now();
  const allProducts: Product[] = [];
  const errors: string[] = [];
  let errorCount = 0;

  // Main categories to scrape with product limits
  const categories = [
    { name: '쌀/잡곡', url: 'https://www.danpoongmall.kr/product-category/%ec%8c%80-%ec%9e%a1%ea%b3%a1/', maxProducts: 30 },
    { name: '농축/수산물', url: 'https://www.danpoongmall.kr/product-category/%ec%b6%95%ec%82%b0%eb%ac%bc/', maxProducts: 20 },
    { name: '과일류', url: 'https://www.danpoongmall.kr/product-category/%ea%b3%bc%ec%9d%bc%eb%a5%98/', maxProducts: 15 },
    { name: '채소류', url: 'https://www.danpoongmall.kr/product-category/%ec%b1%84%ec%86%8c%eb%a5%98/', maxProducts: 15 },
    { name: '전통/발효식품', url: 'https://www.danpoongmall.kr/product-category/%ec%a0%84%ed%86%b5-%eb%b0%9c%ed%9a%a8%ec%8b%9d%ed%92%88/', maxProducts: 15 },
    { name: '건강/가공식품', url: 'https://www.danpoongmall.kr/product-category/%ea%b1%b4%ea%b0%95-%ea%b0%80%ea%b3%b5%ec%8b%9d%ed%92%88/', maxProducts: 15 }
  ];

  try {
    console.log(`\nStarting to scrape ${categories.length} main categories...\n`);

    // Scrape each category
    for (const category of categories) {
      try {
        console.log(`\n=== Scraping Category: ${category.name} ===`);
        const categoryProducts = await scrapeCategoryProducts(category.url, category.name, category.maxProducts);
        
        if (categoryProducts.length > 0) {
          allProducts.push(...categoryProducts);
          console.log(`✓ Successfully scraped ${categoryProducts.length} products from ${category.name}`);
        } else {
          console.log(`⚠ No products found in ${category.name}`);
        }

        await delay(1500); // Rate limiting

      } catch (error) {
        errorCount++;
        const errorMsg = `Error scraping category ${category.name}: ${error}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    // Create summary
    const summary: ScrapeSummary = {
      timestamp: new Date().toISOString(),
      mall: '단풍미인',
      totalProducts: allProducts.length,
      successCount: allProducts.length,
      errorCount,
      errors,
      sampleProducts: allProducts.slice(0, 5)
    };

    // Save products
    if (allProducts.length > 0) {
      fs.writeFileSync(
        'scripts/output/danpoong-products.json',
        JSON.stringify(allProducts, null, 2),
        'utf8'
      );
      console.log(`\n✓ Saved ${allProducts.length} products to danpoong-products.json`);
    }

    // Save summary
    fs.writeFileSync(
      'scripts/output/danpoong-scrape-summary.json',
      JSON.stringify(summary, null, 2),
      'utf8'
    );

    // Final results
    const duration = (Date.now() - startTime) / 1000;
    console.log('\n=== SCRAPING COMPLETE ===');
    console.log(`Total Products: ${allProducts.length}`);
    console.log(`Categories Processed: ${categories.length}`);
    console.log(`Success Rate: ${allProducts.length}/${allProducts.length + errorCount} (${((allProducts.length / (allProducts.length + errorCount)) * 100).toFixed(1)}%)`);
    console.log(`Duration: ${duration.toFixed(1)} seconds`);
    
    if (errors.length > 0) {
      console.log(`\nErrors encountered: ${errors.length}`);
      errors.forEach(error => console.log(`- ${error}`));
    }

    // Show sample products
    if (allProducts.length > 0) {
      console.log('\nSample products:');
      allProducts.slice(0, 5).forEach((product, index) => {
        console.log(`${index + 1}. ${product.title} - ₩${product.price} (${product.category})`);
      });
    }

  } catch (error) {
    console.error('Fatal error during scraping:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}