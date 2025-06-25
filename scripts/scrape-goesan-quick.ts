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

async function scrapeGoesanQuick() {
  console.log('🚀 Starting quick Goesan Marketplace scraping...');
  
  const baseUrl = 'https://www.gsjangter.go.kr';
  const products: Product[] = [];

  // Based on the successful scraping output, I'll use a subset of product IDs
  const productIds = [
    'G2000484012', 'G2000483563', 'G2000483530', 'G2000483309', 'G2000483308', 
    'G2000483307', 'G2000483249', 'G2000483206', 'G2000483051', 'G2000482849',
    'G2000482225', 'G2000484060', 'G2000484128', 'G2000484007', 'G2000483886',
    'G2000484003', 'G2000484009', 'G2000483873', 'G2000483878', 'G2000482059',
    'G2000483168', 'G2000483448', 'G2000482229', 'G2000482162', 'G2000483375',
    'G2000483861', 'G2000482164', 'G2000482060', 'G2000484131', 'G2000482544',
    'G2000484129', 'G2000482389', 'G2000483621', 'G2000484120', 'G2000483659',
    'G2000483702', 'G2000483603', 'G2000483692', 'G2000483569', 'G2000483927',
    'G2000483484', 'G2000483667', 'G2000483924', 'G2000483450', 'G2000483487',
    'G2000484013', 'G2000482961', 'G2000483940'
  ];

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  };

  console.log(`📦 Processing ${productIds.length} products...`);

  for (let i = 0; i < productIds.length; i++) {
    const productId = productIds[i];
    
    try {
      console.log(`📦 Processing ${i + 1}/${productIds.length}: ${productId}`);

      const productUrl = `${baseUrl}/products/view/${productId}`;
      const response = await axios.get(productUrl, {
        timeout: 10000,
        headers,
        validateStatus: (status) => status < 500
      });

      if (response.status >= 400) {
        console.log(`⚠️ HTTP ${response.status} for product ${productId}`);
        continue;
      }

      const $ = cheerio.load(response.data);

      // Extract title
      let title = '';
      const titleSelectors = ['.prd_name', '#itemTitle', '.name', 'h1'];
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

      // Extract price
      let price = '';
      const salePrice = $('.set_prc .point').first();
      if (salePrice.length > 0) {
        const priceText = salePrice.text().trim();
        if (priceText && priceText.length > 0) {
          price = priceText + '원';
        }
      }

      if (!price) {
        const originalPrice = $('.item_prc span').first();
        if (originalPrice.length > 0) {
          const priceText = originalPrice.text().trim();
          if (priceText && priceText.length > 0) {
            price = priceText + '원';
          }
        }
      }

      if (!price) {
        const priceSelectors = ['.set_price strong', '.price'];
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
      const imgSelectors = ['img[src*="item"]', '.thumbnail img', '.prd_img img'];
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

      // Determine category
      let category = '농특산품';
      const titleLower = title.toLowerCase();
      
      if (titleLower.includes('쌀') || titleLower.includes('현미') || titleLower.includes('찹쌀') || titleLower.includes('누룽')) {
        category = '쌀/곡류';
      } else if (titleLower.includes('배추') || titleLower.includes('김치') || titleLower.includes('절임')) {
        category = '김치/절임류';
      } else if (titleLower.includes('브로콜리') || titleLower.includes('당근') || titleLower.includes('양파') || titleLower.includes('채소')) {
        category = '채소류';
      } else if (titleLower.includes('고구마') || titleLower.includes('감자') || titleLower.includes('두백')) {
        category = '채소류';
      } else if (titleLower.includes('사과') || titleLower.includes('배') || titleLower.includes('포도') || titleLower.includes('복숭아') || titleLower.includes('오디') || titleLower.includes('매실')) {
        category = '과일류';
      } else if (titleLower.includes('된장') || titleLower.includes('고추장') || titleLower.includes('간장') || titleLower.includes('메주')) {
        category = '발효식품';
      } else if (titleLower.includes('들기름') || titleLower.includes('참기름')) {
        category = '기름/참깨';
      } else if (titleLower.includes('꿀') || titleLower.includes('잼')) {
        category = '가공식품';
      } else if (titleLower.includes('한약') || titleLower.includes('약초')) {
        category = '건강식품';
      } else if (titleLower.includes('버섯') || titleLower.includes('표고')) {
        category = '버섯류';
      } else if (titleLower.includes('고춧가루') || titleLower.includes('건고추') || titleLower.includes('홍고추')) {
        category = '조미료';
      } else if (titleLower.includes('옥수수')) {
        category = '곡류';
      }

      // Generate tags
      const tags = ['괴산특산품', '충북특산품'];
      
      if (titleLower.includes('유기농') || titleLower.includes('친환경')) tags.push('친환경');
      if (titleLower.includes('전통')) tags.push('전통');
      if (titleLower.includes('수제')) tags.push('수제');
      if (titleLower.includes('국내산') || titleLower.includes('국산')) tags.push('국내산');
      if (titleLower.includes('농협')) tags.push('농협');
      if (titleLower.includes('햇')) tags.push('햇');
      if (titleLower.includes('신선')) tags.push('신선');
      if (titleLower.includes('당일수확')) tags.push('당일수확');
      if (titleLower.includes('haccp')) tags.push('HACCP');

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

      console.log(`✅ ${title} - ${formattedPrice} (${category})`);

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));

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
}

// Run the scraper
scrapeGoesanQuick().catch(console.error);