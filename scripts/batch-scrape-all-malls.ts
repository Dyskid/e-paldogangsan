import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import { Product } from '../src/types';

interface MallInfo {
  id: string;
  name: string;
  url: string;
  region: string;
  status: 'pending' | 'scraping' | 'completed' | 'failed';
  productCount?: number;
  error?: string;
}

interface ScrapedProduct {
  id: string;
  url: string;
  title: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  category?: string;
  categoryId?: string;
  isAvailable: boolean;
  brand?: string;
  description?: string;
  mallName: string;
  mallUrl: string;
  scrapedAt: string;
}

// Mall list from the todolist (excluding 이제주몰 which is already done)
const mallList: MallInfo[] = [
  // 서울특별시
  { id: 'on-seoul', name: '온서울마켓', url: 'https://on.seoul.go.kr', region: '서울특별시', status: 'pending' },
  
  // 부산광역시
  { id: 'busan-brand', name: '부산브랜드몰', url: 'https://busanbrand.kr', region: '부산광역시', status: 'pending' },
  
  // 대구광역시
  { id: 'wemall', name: '우리몰', url: 'https://wemall.kr', region: '대구광역시', status: 'pending' },
  { id: 'chamds', name: '참달성', url: 'https://chamds.com', region: '대구광역시', status: 'pending' },
  
  // 인천광역시
  { id: 'incheon-emall', name: '인천e몰', url: 'https://www.incheone-mall.kr', region: '인천광역시', status: 'pending' },
  
  // 광주광역시
  { id: 'k-kimchi', name: '광주김치몰', url: 'https://www.k-kimchi.kr/index.php', region: '광주광역시', status: 'pending' },
  
  // 대전광역시
  { id: 'ontong-daejeon', name: '온통대전몰', url: 'https://ontongdaejeon.ezwel.com/onnuri/main', region: '대전광역시', status: 'pending' },
  
  // 울산광역시
  { id: 'ulsan-mall', name: '울산몰', url: 'https://www.ulsanmall.kr', region: '울산광역시', status: 'pending' },
  
  // 세종특별자치시
  { id: 'sejong-local', name: '세종로컬푸드', url: 'https://www.sjlocal.or.kr/', region: '세종특별자치시', status: 'pending' },
  
  // 경기도
  { id: 'chack3', name: '착착착', url: 'https://www.chack3.com/', region: '경기도', status: 'pending' },
  { id: 'osansemall', name: '오산함께장터', url: 'http://www.osansemall.com/', region: '경기도', status: 'pending' },
  { id: 'gm-social', name: '광명가치몰', url: 'https://gmsocial.or.kr/mall/', region: '경기도', status: 'pending' },
  { id: 'yangju-market', name: '양주농부마켓', url: 'https://market.yangju.go.kr/', region: '경기도', status: 'pending' },
  { id: 'market-gyeonggi', name: '마켓경기', url: 'https://smartstore.naver.com/marketgyeonggi', region: '경기도', status: 'pending' },
  
  // 강원도
  { id: 'gwd-mall', name: '강원더몰', url: 'https://gwdmall.kr/', region: '강원도', status: 'pending' },
  { id: 'wonju-mall', name: '원주몰', url: 'https://wonju-mall.co.kr/', region: '강원도', status: 'pending' },
  { id: 'gangneung-mall', name: '강릉몰', url: 'https://gangneung-mall.com/', region: '강원도', status: 'pending' },
  { id: 'goseong-mall', name: '고성몰', url: 'https://gwgoseong-mall.com/', region: '강원도', status: 'pending' },
  { id: 'donghae-mall', name: '동해몰', url: 'https://donghae-mall.com/', region: '강원도', status: 'pending' },
  { id: 'samcheok-mall', name: '삼척몰', url: 'https://samcheok-mall.com/', region: '강원도', status: 'pending' },
  { id: 'yanggu-mall', name: '양구몰', url: 'https://yanggu-mall.com/', region: '강원도', status: 'pending' },
  { id: 'yangyang-mall', name: '양양몰', url: 'https://yangyang-mall.com/', region: '강원도', status: 'pending' },
  { id: 'yeongwol-mall', name: '영월몰', url: 'https://yeongwol-mall.com/', region: '강원도', status: 'pending' },
  { id: 'inje-mall', name: '인제몰', url: 'https://inje-mall.com/', region: '강원도', status: 'pending' },
  { id: 'cheorwon-mall', name: '철원몰', url: 'https://cheorwon-mall.com/', region: '강원도', status: 'pending' },
  { id: 'jeongseon-mall', name: '정선몰', url: 'https://jeongseon-mall.com/', region: '강원도', status: 'pending' },
  { id: 'taebaek-mall', name: '태백몰', url: 'https://taebaek-mall.com/', region: '강원도', status: 'pending' },
  { id: 'hoengseong-mall', name: '횡성몰', url: 'https://hoengseong-mall.com/', region: '강원도', status: 'pending' },
  { id: 'chuncheon-mall', name: '춘천몰', url: 'https://gwch-mall.com/', region: '강원도', status: 'pending' },
  { id: 'hongcheon-mall', name: '홍천몰', url: 'https://hongcheon-mall.com/', region: '강원도', status: 'pending' },
  { id: 'pyeongchang-mall', name: '평창몰', url: 'https://gwpc-mall.com/', region: '강원도', status: 'pending' },
  
  // 충청북도
  { id: 'jecheon-local', name: '제천로컬푸드', url: 'https://www.jclocal.co.kr/index.local', region: '충청북도', status: 'pending' },
  { id: 'eumseong-jang', name: '음성장터', url: 'https://www.esjang.go.kr/', region: '충청북도', status: 'pending' },
  { id: 'jincheon-mall', name: '진천몰', url: 'https://jcmall.net/', region: '충청북도', status: 'pending' },
  { id: 'goesan-jangter', name: '괴산장터', url: 'https://www.gsjangter.go.kr/', region: '충청북도', status: 'pending' },
  
  // 충청남도
  { id: 'nongsarang', name: '농사랑', url: 'https://nongsarang.co.kr/', region: '충청남도', status: 'pending' },
  { id: 'dangjin-farm', name: '당진팜', url: 'https://dangjinfarm.com/', region: '충청남도', status: 'pending' },
  { id: 'ehongseong', name: 'e홍성장터', url: 'https://ehongseong.com/', region: '충청남도', status: 'pending' },
  { id: 'seosan-ttre', name: '서산뜨레', url: 'https://seosanttre.com/index.html', region: '충청남도', status: 'pending' },
  
  // 전라북도
  { id: 'textbat-halmae', name: '부안 텃밭할매', url: 'https://www.xn--9z2bv5bx25anyd.kr/', region: '전라북도', status: 'pending' },
  { id: 'danpoong-mall', name: '단풍미인', url: 'https://www.danpoongmall.kr/', region: '전라북도', status: 'pending' },
  { id: 'jps-mall', name: '지평선몰', url: 'https://jpsmall.com/', region: '전라북도', status: 'pending' },
  { id: 'fresh-jb', name: '전북생생장터', url: 'https://freshjb.com/', region: '전라북도', status: 'pending' },
  { id: 'iksan-mall', name: '익산몰', url: 'https://iksanmall.com/', region: '전라북도', status: 'pending' },
  { id: 'jinan-gowon', name: '진안고원몰', url: 'https://jinangowonmall.com/', region: '전라북도', status: 'pending' },
  { id: 'jangsu-mall', name: '장수몰', url: 'https://www.장수몰.com/', region: '전라북도', status: 'pending' },
  { id: 'gochang-market', name: '고창마켓', url: 'https://noblegochang.com/', region: '전라북도', status: 'pending' },
  { id: 'imsil-mall', name: '임실몰', url: 'https://www.imsilin.kr/home', region: '전라북도', status: 'pending' },
  { id: 'sunchang-local', name: '순창로컬푸드', url: 'https://smartstore.naver.com/schfarm', region: '전라북도', status: 'pending' },
  { id: 'haegaram', name: '해가람', url: 'https://haegaram.com', region: '전라북도', status: 'pending' },
  
  // 전라남도
  { id: 'namdo-jangter', name: '남도장터', url: 'https://jnmall.kr/', region: '전라남도', status: 'pending' },
  { id: 'yeosu-mall', name: '여수몰', url: 'http://www.yeosumall.co.kr/', region: '전라남도', status: 'pending' },
  { id: 'happy-goodfarm', name: '해피굿팜', url: 'https://smartstore.naver.com/hgoodfarm', region: '전라남도', status: 'pending' },
  { id: 'boseong-mall', name: '보성몰', url: 'https://boseongmall.co.kr/', region: '전라남도', status: 'pending' },
  { id: 'naju-mall', name: '나주몰', url: 'https://najumall.kr/', region: '전라남도', status: 'pending' },
  { id: 'suncheon-local', name: '순천로컬푸드', url: 'https://sclocal.kr/', region: '전라남도', status: 'pending' },
  { id: 'shinan-1004', name: '신안1004몰', url: 'https://shinan1004mall.kr/', region: '전라남도', status: 'pending' },
  { id: 'jangheung-mall', name: '장흥몰', url: 'https://okjmall.com/', region: '전라남도', status: 'pending' },
  { id: 'yeongam-mall', name: '기찬들영암몰', url: 'https://yeongammall.co.kr/', region: '전라남도', status: 'pending' },
  { id: 'jindo-arirang', name: '진도아리랑몰', url: 'https://jindoarirangmall.com/', region: '전라남도', status: 'pending' },
  { id: 'wando-eshop', name: '완도군이숍', url: 'https://wandofood.go.kr/', region: '전라남도', status: 'pending' },
  { id: 'hampyeong-cheonji', name: '함평천지몰', url: 'https://함평천지몰.kr/', region: '전라남도', status: 'pending' },
  { id: 'haenam-miso', name: '해남미소', url: 'https://www.hnmiso.com/ACC_index.asp', region: '전라남도', status: 'pending' },
  { id: 'damyang-jangter', name: '담양장터', url: 'https://damyangmk.kr/', region: '전라남도', status: 'pending' },
  { id: 'green-gangjin', name: '초록믿음', url: 'https://greengj.com/', region: '전라남도', status: 'pending' },
  { id: 'hwasun-farm', name: '화순팜', url: 'https://www.hwasunfarm.com/', region: '전라남도', status: 'pending' },
  { id: 'gokseong-mall', name: '곡성몰', url: 'https://gokseongmall.com/', region: '전라남도', status: 'pending' },
  
  // 경상북도
  { id: 'cyso', name: '사이소', url: 'https://www.cyso.co.kr/', region: '경상북도', status: 'pending' },
  { id: 'sangju-mall', name: '명실상주몰', url: 'https://sjmall.cyso.co.kr/', region: '경상북도', status: 'pending' },
  { id: 'cheongdo-mall', name: '청도 청리브', url: 'https://cdmall.cyso.co.kr', region: '경상북도', status: 'pending' },
  { id: 'yeongju-market', name: '영주장날', url: 'https://yjmarket.cyso.co.kr/', region: '경상북도', status: 'pending' },
  { id: 'andong-jang', name: '안동장터', url: 'https://andongjang.andong.go.kr/', region: '경상북도', status: 'pending' },
  { id: 'cheongsong-mall', name: '청송몰', url: 'https://csmall.cyso.co.kr/', region: '경상북도', status: 'pending' },
  { id: 'yeongyang-onsim', name: '영양온심마켓', url: 'https://onsim.cyso.co.kr/', region: '경상북도', status: 'pending' },
  { id: 'ulleung-mall', name: '울릉도몰', url: 'https://ulmall.cyso.co.kr', region: '경상북도', status: 'pending' },
  { id: 'bonghwa-jangter', name: '봉화장터', url: 'https://bmall.cyso.co.kr/', region: '경상북도', status: 'pending' },
  { id: 'goryeong-mall', name: '고령몰', url: 'https://grmall.cyso.co.kr/', region: '경상북도', status: 'pending' },
  { id: 'gimcheon-nodaji', name: '김천노다지장터', url: 'http://gcnodaji.com/', region: '경상북도', status: 'pending' },
  { id: 'yecheon-jangter', name: '예천장터', url: 'https://ycjang.cyso.co.kr/', region: '경상북도', status: 'pending' },
  { id: 'mungyeong-mall', name: '문경 새재의아침', url: 'https://mgmall.cyso.co.kr/', region: '경상북도', status: 'pending' },
  { id: 'chilgok-mall', name: '칠곡몰', url: 'https://cgmall.cyso.co.kr/', region: '경상북도', status: 'pending' },
  { id: 'uiseong-jangnal', name: '의성장날', url: 'https://esmall.cyso.co.kr/', region: '경상북도', status: 'pending' },
  { id: 'uljin-mall', name: '울진몰', url: 'https://ujmall.cyso.co.kr/', region: '경상북도', status: 'pending' },
  { id: 'yeongdeok-jangter', name: '영덕장터', url: 'https://ydmall.cyso.co.kr/', region: '경상북도', status: 'pending' },
  { id: 'gyeongsan-mall', name: '경산몰', url: 'https://gsmall.cyso.co.kr/', region: '경상북도', status: 'pending' },
  { id: 'gyeongju-mall', name: '경주몰', url: 'https://gjmall.cyso.co.kr/', region: '경상북도', status: 'pending' },
  { id: 'gumi-farm', name: '구미팜', url: 'https://gmmall.cyso.co.kr/', region: '경상북도', status: 'pending' },
  { id: 'yeongcheon-star', name: '별빛촌장터', url: 'https://01000.cyso.co.kr/', region: '경상북도', status: 'pending' },
  { id: 'pohang-market', name: '포항마켓', url: 'https://pohangmarket.cyso.co.kr/', region: '경상북도', status: 'pending' },
  
  // 경상남도
  { id: 'egn-mall', name: 'e경남몰', url: 'https://egnmall.kr', region: '경상남도', status: 'pending' },
  { id: 'toyoae', name: '토요애', url: 'https://toyoae.com/', region: '경상남도', status: 'pending' },
  { id: 'namhae-mall', name: '남해몰', url: 'https://enamhae.co.kr/', region: '경상남도', status: 'pending' },
  { id: 'sanencheong', name: '산엔청', url: 'https://sanencheong.com/', region: '경상남도', status: 'pending' },
  { id: 'goseong-dino', name: '공룡나라', url: 'https://www.edinomall.com/shop/smain/index.php', region: '경상남도', status: 'pending' },
  { id: 'hamyang-mall', name: '함양몰', url: 'https://2900.co.kr/', region: '경상남도', status: 'pending' },
  { id: 'jinju-dream', name: '진주드림', url: 'https://jinjudream.com/', region: '경상남도', status: 'pending' },
  { id: 'haman-mall', name: '함안몰', url: 'https://hamanmall.com', region: '경상남도', status: 'pending' },
  { id: 'gimhae-mall', name: '김해온몰', url: 'https://gimhaemall.kr', region: '경상남도', status: 'pending' },
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Generic scraper function that tries different approaches
async function scrapeGenericMall(mall: MallInfo): Promise<ScrapedProduct[]> {
  console.log(`\nStarting scrape for ${mall.name} (${mall.url})`);
  const products: ScrapedProduct[] = [];
  
  try {
    const response = await axios.get(mall.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
      },
      timeout: 30000
    });
    
    const $ = cheerio.load(response.data);
    
    // Try multiple selectors for product listings
    const productSelectors = [
      '.product-item', '.item', '.goods-item', '.product', 
      '.prd-item', '.prd_item', '.product-list li', '.goods_list li',
      '.item-list li', '.product_list li', 'ul.products li',
      '.product-grid .item', '.goods-list .item'
    ];
    
    let foundProducts = false;
    
    for (const selector of productSelectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        console.log(`Found ${elements.length} products with selector: ${selector}`);
        
        elements.each((index, element) => {
          try {
            const $elem = $(element);
            
            // Extract product URL
            let productUrl = '';
            const linkSelectors = ['a', 'a.link', 'a.product-link', '.product-name a'];
            for (const linkSel of linkSelectors) {
              const link = $elem.find(linkSel).first();
              if (link.length > 0) {
                productUrl = link.attr('href') || '';
                break;
              }
            }
            
            if (!productUrl) return;
            
            // Make URL absolute
            if (!productUrl.startsWith('http')) {
              productUrl = new URL(productUrl, mall.url).href;
            }
            
            // Extract title
            let title = '';
            const titleSelectors = ['.product-name', '.item-name', '.goods-name', '.title', '.name', '.prd-name'];
            for (const titleSel of titleSelectors) {
              const titleElem = $elem.find(titleSel).first();
              if (titleElem.length > 0) {
                title = titleElem.text().trim();
                break;
              }
            }
            
            if (!title) return;
            
            // Extract price
            let price = 0;
            const priceSelectors = ['.price', '.product-price', '.item-price', '.goods-price', '.cost'];
            for (const priceSel of priceSelectors) {
              const priceElem = $elem.find(priceSel).first();
              if (priceElem.length > 0) {
                const priceText = priceElem.text();
                const priceMatch = priceText.match(/[\d,]+/);
                if (priceMatch) {
                  price = parseInt(priceMatch[0].replace(/,/g, ''));
                  break;
                }
              }
            }
            
            // Extract image
            let imageUrl = '';
            const imgElem = $elem.find('img').first();
            if (imgElem.length > 0) {
              imageUrl = imgElem.attr('src') || imgElem.attr('data-src') || '';
              if (imageUrl && !imageUrl.startsWith('http')) {
                imageUrl = new URL(imageUrl, mall.url).href;
              }
            }
            
            // Generate product ID
            const productId = `${mall.id}_${Date.now()}_${index}`;
            
            products.push({
              id: productId,
              url: productUrl,
              title,
              price,
              imageUrl,
              isAvailable: true,
              mallName: mall.name,
              mallUrl: mall.url,
              scrapedAt: new Date().toISOString()
            });
            
          } catch (err) {
            console.error(`Error extracting product:`, err);
          }
        });
        
        foundProducts = true;
        break;
      }
    }
    
    if (!foundProducts) {
      console.log(`No products found for ${mall.name}. May require specialized scraper.`);
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error scraping ${mall.name}:`, errorMessage);
    throw error;
  }
  
  return products;
}

async function batchScrapeMalls() {
  console.log('Starting batch scrape of all shopping malls...');
  console.log(`Total malls to scrape: ${mallList.length}`);
  
  const results: any[] = [];
  const startTime = Date.now();
  
  // Create output directory
  const outputDir = path.join(__dirname, 'output', 'batch-scrape');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Process malls in batches to avoid overwhelming the system
  const batchSize = 5;
  
  for (let i = 0; i < mallList.length; i += batchSize) {
    const batch = mallList.slice(i, i + batchSize);
    console.log(`\n=== Processing batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(mallList.length/batchSize)} ===`);
    
    const batchPromises = batch.map(async (mall) => {
      mall.status = 'scraping';
      
      try {
        const products = await scrapeGenericMall(mall);
        
        mall.status = 'completed';
        mall.productCount = products.length;
        
        // Save individual mall results
        if (products.length > 0) {
          const mallFile = path.join(outputDir, `${mall.id}-products.json`);
          fs.writeFileSync(mallFile, JSON.stringify(products, null, 2));
        }
        
        results.push({
          mall: mall.name,
          url: mall.url,
          region: mall.region,
          status: 'success',
          productCount: products.length,
          products
        });
        
        console.log(`✓ ${mall.name}: ${products.length} products`);
        
      } catch (error) {
        mall.status = 'failed';
        mall.error = error instanceof Error ? error.message : String(error);
        
        results.push({
          mall: mall.name,
          url: mall.url,
          region: mall.region,
          status: 'failed',
          error: mall.error
        });
        
        console.log(`✗ ${mall.name}: Failed - ${mall.error}`);
      }
      
      // Rate limiting
      await delay(2000);
    });
    
    await Promise.all(batchPromises);
  }
  
  // Save summary
  const summary = {
    totalMalls: mallList.length,
    successful: results.filter(r => r.status === 'success').length,
    failed: results.filter(r => r.status === 'failed').length,
    totalProducts: results.reduce((sum, r) => sum + (r.productCount || 0), 0),
    duration: Math.round((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
    results
  };
  
  fs.writeFileSync(
    path.join(outputDir, 'batch-scrape-summary.json'),
    JSON.stringify(summary, null, 2)
  );
  
  console.log('\n=== Batch Scraping Complete ===');
  console.log(`Total malls: ${summary.totalMalls}`);
  console.log(`Successful: ${summary.successful}`);
  console.log(`Failed: ${summary.failed}`);
  console.log(`Total products: ${summary.totalProducts}`);
  console.log(`Duration: ${summary.duration} seconds`);
  
  return summary;
}

// Run the batch scraper
if (require.main === module) {
  batchScrapeMalls().catch(console.error);
}

export { batchScrapeMalls, scrapeGenericMall };