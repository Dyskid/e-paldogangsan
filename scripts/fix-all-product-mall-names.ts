import fs from 'fs';
import path from 'path';

// Read malls data
const mallsPath = path.join(__dirname, '../src/data/malls.json');
const malls = JSON.parse(fs.readFileSync(mallsPath, 'utf-8'));

// Create comprehensive mappings
const mallMappings: Record<string, string> = {
  // Direct mappings from product ID prefixes to mall names
  'jcmall': '진천몰',
  'cgmall': '청송몰',
  'csmall': '청주몰',
  'cyso': '온세종',
  'onsim': '온심마켓',
  'cdmall': '청도몰',
  'boseong': '보성몰',
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
  'ontongdaejeon': '대전사랑몰',
  'freshjb': '전북생생장터',
  'danpoong': '단풍미인',
  'jnmall': '남도장터',
  'buan': '부안 텃밭할매',
  'bmall': '부산브랜드몰',
  'busanbrand': '부산브랜드몰',
  'najumall': '나주몰',
  'mgmall': '목포맛나',
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
  'haegaram': '해가람',
  'sclocal': '순천로컬푸드함께가게',
  'wandofood': '완도푸드',
  'gochang': '고창마켓',
  'yanggu': '양구몰',
  'mall_22': '양양몰',
  'mall_23': '영월몰'
};

// Read products data
const productsPath = path.join(__dirname, '../src/data/products.json');
const products = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));

// Track statistics
let fixedCount = 0;
const unknownPrefixes = new Set<string>();

// Fix products
const fixedProducts = products.map((product: any) => {
  // If mallName is missing, empty, or generic
  if (!product.mallName || product.mallName === '' || product.mallName === '쇼핑몰') {
    // Try to extract mall ID from product ID
    let productIdPrefix = product.id.split('_')[0];
    
    // Handle special cases with hyphen-separated IDs
    if (product.id.includes('-')) {
      const parts = product.id.split('-');
      // For IDs like "ehongseong-12345", extract "ehongseong"
      if (parts[0].match(/^[a-z]+$/i)) {
        productIdPrefix = parts[0];
      }
    }
    
    // Special handling for numeric IDs (likely freshjb)
    if (product.id.match(/^\d+$/)) {
      productIdPrefix = 'freshjb';
    }
    
    // Special handling for URL-encoded IDs (likely buan or danpoong)
    if (product.id.includes('%')) {
      if (product.id.includes('단풍미인')) {
        productIdPrefix = 'danpoong';
      } else if (product.id.includes('추석') || product.id.includes('내장산')) {
        productIdPrefix = 'danpoong';
      } else {
        productIdPrefix = 'buan';
      }
    }
    
    // Special handling for chack3 prefixed IDs
    if (product.id.startsWith('chack3-')) {
      productIdPrefix = 'chack3';
    }
    
    if (mallMappings[productIdPrefix]) {
      product.mallName = mallMappings[productIdPrefix];
      fixedCount++;
    } else if (product.mallId && mallMappings[product.mallId]) {
      product.mallName = mallMappings[product.mallId];
      fixedCount++;
    } else {
      // Try to find from the malls list
      const mall = malls.find((m: any) => {
        return m.scraperId === productIdPrefix || 
               m.id.includes(productIdPrefix) ||
               m.url.includes(productIdPrefix);
      });
      
      if (mall) {
        product.mallName = mall.name;
        fixedCount++;
      } else {
        unknownPrefixes.add(productIdPrefix);
      }
    }
  }
  
  return product;
});

// Write the fixed products back
fs.writeFileSync(productsPath, JSON.stringify(fixedProducts, null, 2));

console.log(`\nFixed ${fixedCount} products`);
console.log(`Unknown prefixes: ${Array.from(unknownPrefixes).join(', ')}`);

// Check final status
const stillMissing = fixedProducts.filter((p: any) => 
  !p.mallName || p.mallName === '' || p.mallName === '쇼핑몰'
).length;

console.log(`\nProducts still missing mall names: ${stillMissing}`);