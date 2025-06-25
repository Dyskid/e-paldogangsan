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

async function scrapeJCMallFinal() {
  console.log('🚀 Starting final JC Mall scraping...');
  
  const baseUrl = 'https://jcmall.net';
  const products: Product[] = [];
  
  // Based on the timeout, I know these product IDs exist
  const validProductIds = [
    84, 85, 86, 87, 88, 89, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 109, 110, 114, 117, 119, 123, 124, 125, 126, 127, 128, 129, 130, 134, 135, 136, 150, 151, 152, 166, 167, 173, 174, 175, 181, 219, 220, 223, 228, 229, 230, 236, 237, 238, 239, 240, 241, 256, 260, 261, 262, 287, 288, 291, 292, 293, 294, 326, 335, 336, 350, 351, 359, 360, 361, 368, 369, 370, 374, 376, 378, 379, 380, 381, 382, 383, 384, 385, 386, 387, 388, 389, 390, 391
  ];

  // Common headers
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  };

  console.log(`📦 Processing ${validProductIds.length} products...`);

  for (let i = 0; i < validProductIds.length; i++) {
    const productNo = validProductIds[i].toString();
    
    try {
      console.log(`📦 Processing ${i + 1}/${validProductIds.length}: ${productNo}`);

      const productUrl = `${baseUrl}/product/detail.html?product_no=${productNo}`;
      const response = await axios.get(productUrl, {
        timeout: 10000,
        headers,
        validateStatus: (status) => status < 500
      });

      if (response.status >= 400) {
        console.log(`⚠️ HTTP ${response.status} for product ${productNo}`);
        continue;
      }

      const $ = cheerio.load(response.data);

      // Extract title
      let title = '';
      const titleSelectors = ['h2', 'h1'];
      for (const selector of titleSelectors) {
        const element = $(selector).first();
        if (element.length > 0) {
          const text = element.text().trim();
          if (text && text.length > 2 && !text.includes('좋아요')) {
            title = text;
            break;
          }
        }
      }

      if (!title) {
        console.log('❌ No title found, skipping...');
        continue;
      }

      // Extract price from meta tags
      let price = '';
      const priceMetaContent = $('meta[property="product:price:amount"]').attr('content');
      const salePriceMetaContent = $('meta[property="product:sale_price:amount"]').attr('content');
      
      if (salePriceMetaContent) {
        price = salePriceMetaContent;
      } else if (priceMetaContent) {
        price = priceMetaContent;
      }

      if (!price || parseInt(price) <= 0) {
        console.log('❌ No valid price found, skipping...');
        continue;
      }

      const formattedPrice = `${parseInt(price).toLocaleString()}원`;

      // Extract image
      let image = '';
      const imgElement = $('.thumbnail img').first();
      if (imgElement.length > 0) {
        const src = imgElement.attr('src');
        if (src) {
          image = src.startsWith('http') ? src : `https:${src}`;
        }
      }

      // Determine category
      let category = '농특산품';
      const titleLower = title.toLowerCase();
      
      if (titleLower.includes('쌀') || titleLower.includes('현미') || titleLower.includes('찹쌀')) {
        category = '쌀/곡류';
      } else if (titleLower.includes('한우') || titleLower.includes('정육') || titleLower.includes('불고기')) {
        category = '정육류';
      } else if (titleLower.includes('된장') || titleLower.includes('고추장') || titleLower.includes('청국장') || titleLower.includes('간장')) {
        category = '발효식품';
      } else if (titleLower.includes('들기름') || titleLower.includes('참기름') || titleLower.includes('참깨')) {
        category = '기름/참깨';
      } else if (titleLower.includes('수박') || titleLower.includes('매실')) {
        category = '과일류';
      } else if (titleLower.includes('빵') || titleLower.includes('과자')) {
        category = '가공식품';
      } else if (titleLower.includes('인삼') || titleLower.includes('홍삼') || titleLower.includes('흑삼')) {
        category = '인삼/홍삼';
      } else if (titleLower.includes('화훼') || titleLower.includes('꽃')) {
        category = '원예/화훼';
      }

      // Generate tags
      const tags = ['진천특산품', '충북특산품'];
      
      if (titleLower.includes('생거진천')) tags.push('생거진천');
      if (titleLower.includes('유기농') || titleLower.includes('친환경')) tags.push('친환경');
      if (titleLower.includes('전통')) tags.push('전통');
      if (titleLower.includes('수제')) tags.push('수제');
      if (titleLower.includes('국내산')) tags.push('국내산');
      if (titleLower.includes('농협')) tags.push('농협');
      if (titleLower.includes('특허')) tags.push('특허');

      const product: Product = {
        id: `jcmall_${productNo}`,
        title: title,
        price: formattedPrice,
        image: image,
        url: productUrl,
        category: category,
        mall: '진천몰',
        region: '충청북도',
        tags: tags,
        inStock: true
      };

      products.push(product);

      console.log(`✅ ${title} - ${formattedPrice}`);

      // Small delay
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error: any) {
      console.error(`❌ Error scraping product ${productNo}:`, error.message);
      continue;
    }
  }

  console.log(`\n🎉 Scraping completed! Total products: ${products.length}`);

  // Save results
  const summary = {
    timestamp: new Date().toISOString(),
    totalProducts: products.length,
    mall: '진천몰',
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
    '/mnt/c/Users/johndoe/Desktop/e-paldogangsan/scripts/output/jcmall-products.json',
    JSON.stringify(products, null, 2)
  );

  // Save summary
  fs.writeFileSync(
    '/mnt/c/Users/johndoe/Desktop/e-paldogangsan/scripts/output/jcmall-scrape-summary.json',
    JSON.stringify(summary, null, 2)
  );

  console.log(`💾 Products saved to: jcmall-products.json`);
  console.log(`📊 Summary saved to: jcmall-scrape-summary.json`);

  return { products, summary };
}

// Run the scraper
scrapeJCMallFinal().catch(console.error);