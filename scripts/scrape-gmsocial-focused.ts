import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

interface ProductData {
  id: string;
  title: string;
  price: string;
  imageUrl: string;
  productUrl: string;
  category: string;
  vendor?: string;
  mallId: string;
  mallName: string;
  mallUrl: string;
  region: string;
  name: string;
  description?: string;
  tags?: string[];
  featured?: boolean;
  isNew?: boolean;
  clickCount?: number;
  lastVerified: string;
}

async function scrapeFocusedGmsocial() {
  console.log('🚀 Starting focused 광명가치몰 scraping...');
  
  const baseUrl = 'http://gmsocial.mangotree.co.kr/mall/';
  const products: ProductData[] = [];
  
  // Focus on known active product ranges
  const productIds = [121, 81, 80, 79, 78, 77, 76, 75, 120, 119, 118, 117, 116, 115, 114, 113, 112, 111, 110, 109, 108, 107, 106, 105, 104, 103, 102, 101, 100];
  
  for (const productId of productIds) {
    try {
      console.log(`🔍 Scraping product ${productId}...`);
      
      const productUrl = `${baseUrl}goods/view.php?product_id=${productId}`;
      
      const response = await fetch(productUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
        }
      });
      
      if (!response.ok) {
        console.log(`⏭️ Product ${productId} not found (${response.status})`);
        continue;
      }
      
      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Extract title from page title
      const pageTitle = $('title').text().trim();
      let title = '';
      
      if (pageTitle && pageTitle.includes('>')) {
        title = pageTitle.split('>')[0].trim();
      }
      
      if (!title || title.length < 5) {
        console.log(`⚠️ No valid title found for product ${productId}`);
        continue;
      }
      
      // Extract price
      let price = '';
      const bodyText = $('body').text();
      
      // Look for price patterns
      const priceMatch = bodyText.match(/(\d{1,3}(?:,\d{3})*)\s*원/);
      if (priceMatch) {
        price = priceMatch[0];
      } else {
        // Try alternative patterns
        const altPriceMatch = bodyText.match(/(\d{1,3}(?:,\d{3})+)/);
        if (altPriceMatch) {
          price = altPriceMatch[0] + '원';
        }
      }
      
      if (!price) {
        console.log(`⚠️ No price found for product ${productId}: ${title}`);
        continue;
      }
      
      // Extract image
      let imageUrl = '';
      const imageSelectors = [
        'img[src*="goods"]', 'img[src*="product"]', '.product-image img', 
        '.goods-image img', 'img[src*="phinf"]', 'img[src*="naver"]'
      ];

      for (const selector of imageSelectors) {
        const element = $(selector).first();
        if (element.length && element.attr('src')) {
          imageUrl = element.attr('src') || '';
          if (imageUrl.startsWith('//')) {
            imageUrl = 'https:' + imageUrl;
          } else if (imageUrl.startsWith('/')) {
            imageUrl = 'http://gmsocial.mangotree.co.kr' + imageUrl;
          }
          break;
        }
      }
      
      // Category and vendor extraction
      const categories = {
        '복합기': '사무용품', '프린터': '사무용품', '레이저': '사무용품',
        '고등어': '식품', '음식': '식품', '식품': '식품', '차': '식품',
        '브라': '의류', '속옷': '의류', '손수건': '의류', '앞치마': '의류',
        '교육': '교육/체험', '클래스': '교육/체험', '코딩': '교육/체험',
        '청소': '서비스', '방역': '서비스', '공사': '서비스',
        '도자기': '공예품', '옻칠': '공예품'
      };
      
      let category = '기타';
      for (const [keyword, cat] of Object.entries(categories)) {
        if (title.includes(keyword)) {
          category = cat;
          break;
        }
      }
      
      const vendors = [
        '삼삼이', '캐논', '브라더', '담다', '청소년플러스끌림', '따동',
        '이웃컴퍼니', '늘품애협동조합', '재미있는생각씨앗코딩', '선옻칠',
        '미앤드', '제일디자인', '크린환경', '시니온협동조합'
      ];
      
      let vendor: string | undefined;
      for (const v of vendors) {
        if (title.includes(v)) {
          vendor = v;
          break;
        }
      }
      
      const product: ProductData = {
        id: `gmsocial_${productId}`,
        title: title,
        name: title,
        price: price,
        imageUrl: imageUrl,
        productUrl: productUrl,
        category: category,
        vendor: vendor,
        mallId: 'gmsocial',
        mallName: '광명가치몰',
        mallUrl: baseUrl,
        region: '경기도 광명시',
        description: title,
        tags: vendor ? [vendor, category] : [category],
        featured: false,
        isNew: false,
        clickCount: 0,
        lastVerified: new Date().toISOString()
      };
      
      products.push(product);
      console.log(`✅ Found: ${title} - ${price}`);
      
      // Small delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
    } catch (error) {
      console.error(`❌ Error scraping product ${productId}:`, error);
    }
  }
  
  console.log(`\n🎉 Scraping complete! Found ${products.length} products`);
  
  // Save results
  const outputDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const outputFile = path.join(outputDir, 'gmsocial-focused-scraped.json');
  fs.writeFileSync(outputFile, JSON.stringify(products, null, 2));
  console.log(`💾 Results saved to: ${outputFile}`);
  
  return products;
}

scrapeFocusedGmsocial();