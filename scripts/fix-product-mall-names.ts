import fs from 'fs';
import path from 'path';

// Read malls data
const mallsPath = path.join(__dirname, '../src/data/malls.json');
const malls = JSON.parse(fs.readFileSync(mallsPath, 'utf-8'));

// Create a map of mall IDs to mall names
const mallIdToName = new Map<string, string>();
malls.forEach((mall: any) => {
  // Map the full mall ID
  mallIdToName.set(mall.id, mall.name);
  
  // Extract the ID part after "mall_XX_"
  const idMatch = mall.id.match(/mall_\d+_(.*)/);
  if (idMatch) {
    const shortId = idMatch[1].toLowerCase();
    mallIdToName.set(shortId, mall.name);
  }
  
  // Also map just the numeric part
  const numMatch = mall.id.match(/mall_(\d+)_/);
  if (numMatch) {
    mallIdToName.set(`mall_${numMatch[1]}`, mall.name);
  }
  
  // Also map scraperId to name if exists
  if (mall.scraperId) {
    mallIdToName.set(mall.scraperId, mall.name);
  }
});

// Additional mappings for known mall IDs
const additionalMappings: Record<string, string> = {
  'donghae': '동해몰',
  'gangneung': '강릉몰',
  'goseong': '고성몰',
  'samcheok': '삼척몰',
  'yangju': '양주농부마켓',
  'osansemall': '오산함께장터',
  'chack3': '착착착',
  'gmsocial': '광명가치몰',
  'gwdmall': '강원더몰',
  'sjlocal': '세종로컬푸드',
  'wemall': '우리몰',
  'kkimchi': '광주김치몰',
  'chamds': '참달성',
  'ontongdaejeon': '온통대전몰',
  'freshjb': '전북생생장터',
  'danpoong': '단풍미인',
  'jnmall': '남도장터',
  'buan': '부안 텃밭할매',
  'bmall': '부산브랜드몰',
  'busanbrand': '부산브랜드몰',
  'najumall': '나주몰',
  'mgmall': '목포맛나',
  'jcmall': '진천몰',
  'cgmall': '청송몰',
  'csmall': '청주몰',
  'cyso': '온세종',
  'onsim': '온심마켓',
  'cdmall': '청도몰',
  'boseong': '보성몰',
  'chamseongdong': '참성동몰',
  'chemindong': '제민동몰',
  'chokchokmall': '촉촉몰',
  'wandofood': '완도푸드',
  'jsmarket': '장수몰',
  'gochang': '고창마켓',
  'haegaram': '해가람',
  'sclocal': '순천로컬푸드함께가게',
  'esjang': '음성장터',
  'goesan': '괴산장터',
  'gwpc': '평창몰',
  'hongcheon': '홍천몰',
  'greengj': '곡성몰',
  'cyhealth': '음성장터',
  'dangjinfarm': '당진팜',
  'ehongseong': 'e홍성장터',
  'farmingdalrae': '영암몰',
  'nongsarang': '농사랑',
  'okjmall': '장흥몰',
  'seosanttre': '서산뜨레',
  'jinanmall': '진안고원몰',
  'freshdj': '단풍미인',
  'hampyeong': '함평천지몰',
  'hoengseong': '횡성몰',
  'hwasunfarm': '화순몰',
  'iksan': '익산몰',
  'imsilin': '임실몰',
  'inje': '인제몰',
  'jclocal': '제천로컬푸드',
  'jeongseon': '정선몰',
  'jindoarirang': '진도몰',
  'jpsmall': '지평선몰',
  'jshop': '장수몰',
  'najushopping': '나주몰',
  'shinan1004': '신안1004몰',
  'sjmall': '순천몰',
  'smartstore': '고창마켓',
  'taebaek': '태백몰',
  'ulmall': '울산몰',
  'ycjang': '예천장터',
  'yeongam': '기찬들영암몰',
  'yeongwol': '영월몰',
  'yeosumall': '여수몰',
  'yjmarket': '연제마켓',
  'yangyang': '양양몰',
  'damyang': '담양몰',
  'cheorwon': '철원몰',
  'chuncheon': '춘천몰',
  'gokseongmall': '곡성몰',
  'hwach': '화천몰',
  'jangsu': '장수몰',
  'onsemall': '온서울마켓',
  'yanggu': '양구몰'
};

// Merge additional mappings
Object.entries(additionalMappings).forEach(([id, name]) => {
  mallIdToName.set(id, name);
});

// Read products data
const productsPath = path.join(__dirname, '../src/data/products.json');
const products = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));

// Track statistics
let fixedCount = 0;
let missingMallName = 0;
const unmatched = new Set<string>();

// Fix products
const fixedProducts = products.map((product: any) => {
  // Check if mallName is missing or is the generic '쇼핑몰'
  if (!product.mallName || product.mallName === '쇼핑몰' || product.mallName === '') {
    missingMallName++;
    
    // Try to find the mall name from mallId
    if (product.mallId && mallIdToName.has(product.mallId)) {
      product.mallName = mallIdToName.get(product.mallId);
      fixedCount++;
    } else if (product.mallId) {
      unmatched.add(product.mallId);
      console.log(`No mapping found for mallId: ${product.mallId}`);
    }
  }
  
  return product;
});

// Write the fixed products back
fs.writeFileSync(productsPath, JSON.stringify(fixedProducts, null, 2));

console.log(`\nFixed ${fixedCount} products`);
console.log(`Total products with missing mall names: ${missingMallName}`);
console.log(`Unmatched mall IDs: ${Array.from(unmatched).join(', ')}`);

// Also update any product type definitions if needed
const typeContent = `export interface Product {
  id: string;
  title?: string;
  name?: string;
  price: number | string;
  originalPrice?: number;
  imageUrl?: string;
  image?: string;
  productUrl?: string;
  url?: string;
  category: string;
  description?: string;
  mallId: string;
  mallName: string;
  mallUrl?: string;
  region?: string;
  tags?: string[];
  featured?: boolean;
  isNew?: boolean;
  clickCount?: number;
  lastVerified?: string;
  mall?: {
    mallId: string;
    mallName: string;
  };
}`;

console.log('\nProduct type definition should include mallName as required field.');