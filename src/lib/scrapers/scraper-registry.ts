import { GenericHTMLScraper } from './generic-scraper';
import { EnhancedGenericHTMLScraper } from './enhanced-generic-scraper';
import { BaseScraper } from './base-scraper';

interface ScraperDefinition {
  type: 'generic' | 'enhanced-generic' | 'custom';
  config: any;
}

// Mall-specific scraper configurations
export const scraperRegistry: Record<string, ScraperDefinition> = {
  // Updated configurations for merged malls
  'mall_1_온서울마켓': {
    type: 'generic',
    config: {
      mallId: 'mall_1_온서울마켓',
      mallName: '온서울마켓',
      baseUrl: 'https://on.seoul.go.kr',
      productSelector: '.product-item',
      nameSelector: '.product-name',
      priceSelector: '.product-price',
      imageSelector: '.product-image img',
      linkSelector: 'a'
    }
  },
  'mall_2_부산브랜드몰': {
    type: 'generic',
    config: {
      mallId: 'mall_2_부산브랜드몰',
      mallName: '부산브랜드몰',
      baseUrl: 'https://busanbrand.kr',
      productSelector: '.item-box',
      nameSelector: '.item-title',
      priceSelector: '.item-price',
      imageSelector: '.item-img img',
      linkSelector: 'a.item-link'
    }
  },
  // Generic configurations for other major malls
  'mall_15_강원더몰': {
    type: 'generic',
    config: {
      mallId: 'mall_15_강원더몰',
      mallName: '강원더몰',
      baseUrl: 'https://gwdmall.kr',
      productSelector: '.product-item',
      nameSelector: '.product-name',
      priceSelector: '.product-price',
      imageSelector: '.product-image img',
      linkSelector: 'a'
    }
  },
  'mall_51_남도장터': {
    type: 'generic',
    config: {
      mallId: 'mall_51_남도장터',
      mallName: '남도장터',
      baseUrl: 'https://jnmall.kr',
      productSelector: '.product-item',
      nameSelector: '.product-name',
      priceSelector: '.product-price',
      imageSelector: '.product-image img',
      linkSelector: 'a'
    }
  },
  'mall_68_사이소_경북몰_': {
    type: 'generic',
    config: {
      mallId: 'mall_68_사이소_경북몰_',
      mallName: '사이소(경북몰)',
      baseUrl: 'https://www.cyso.co.kr',
      productSelector: '.product-item',
      nameSelector: '.product-name',
      priceSelector: '.product-price',
      imageSelector: '.product-image img',
      linkSelector: 'a'
    }
  },
  'mall_99_제주몰': {
    type: 'generic',
    config: {
      mallId: 'mall_99_제주몰',
      mallName: '제주몰',
      baseUrl: 'https://www.jejumall.kr',
      productSelector: '.product-item',
      nameSelector: '.product-name',
      priceSelector: '.product-price',
      imageSelector: '.product-image img',
      linkSelector: 'a'
    }
  },
  'chuncheon-mall': {
    type: 'generic',
    config: {
      mallId: 'chuncheon-mall',
      mallName: '춘천몰',
      baseUrl: 'https://gwch-mall.com',
      productSelector: 'a[href*="/goods/view"]',
      nameSelector: '[class*="name"], .name, h3',
      priceSelector: '[class*="price"]',
      imageSelector: 'img[src*="goods"]',
      linkSelector: 'a[href*="/goods/view"]'
    }
  },
  'hongcheon-mall': {
    type: 'generic',
    config: {
      mallId: 'hongcheon-mall',
      mallName: '홍천몰',
      baseUrl: 'https://hongcheon-mall.com',
      productSelector: 'a[href*="/goods/view"]',
      nameSelector: 'h3, .name, [class*="name"]',
      priceSelector: '[class*="price"]',
      imageSelector: 'img[src*="goods"]',
      linkSelector: 'a[href*="/goods/view"]'
    }
  },
  'gwpc-mall': {
    type: 'generic',
    config: {
      mallId: 'gwpc-mall',
      mallName: '평창몰',
      baseUrl: 'https://gwpc-mall.com',
      productSelector: 'a[href*="/goods/view"]',
      nameSelector: '.name, h3, [class*="name"]',
      priceSelector: '[class*="price"]',
      imageSelector: 'img[src*="goods"]',
      linkSelector: 'a[href*="/goods/view"]'
    }
  },
  'haegaram': {
    type: 'generic',
    config: {
      mallId: 'haegaram',
      mallName: '해가람',
      baseUrl: 'https://haegaram.com',
      productSelector: '.xans-product-normalpackage .prdList .item',
      nameSelector: 'meta[property="og:title"]',
      priceSelector: '#span_product_price_text',
      imageSelector: '.keyImg img, .bigImage img',
      linkSelector: 'a.prdImg'
    }
  },
  'jnmall': {
    type: 'generic',
    config: {
      mallId: 'jnmall',
      mallName: '남도장터',
      baseUrl: 'https://www.jnmall.kr',
      productSelector: '.prd_list .item',
      nameSelector: '.prd_title',
      priceSelector: '.price_sale',
      imageSelector: '.prd_img img',
      linkSelector: 'a'
    }
  },
  'yeosumall': {
    type: 'generic',
    config: {
      mallId: 'yeosumall',
      mallName: '여수몰',
      baseUrl: 'http://www.yeosumall.co.kr',
      productSelector: '.goods_list .item, .product_list .item',
      nameSelector: '.goods_name, .product_name',
      priceSelector: '.price, .sale_price',
      imageSelector: '.goods_image img, .product_image img',
      linkSelector: 'a[href*="goods_view"], a[href*="product"]',
      note: 'Site frequently shows server capacity errors - may need alternative access methods'
    }
  },
  'boseongmall': {
    type: 'generic',
    config: {
      mallId: 'boseongmall',
      mallName: '보성몰',
      baseUrl: 'https://boseongmall.co.kr',
      productSelector: 'ul.prdList li.xans-record-',
      nameSelector: 'img',
      nameAttribute: 'alt',
      priceSelector: 'li.product_price',
      imageSelector: 'img',
      linkSelector: 'a',
      categories: ['채소', '가공식품', '곡물', '농산물'],
      tags: ['농산물', '전남', '보성'],
      note: 'Cafe24-based platform - uses img alt for product titles and li.product_price for prices'
    }
  },
  'sclocal': {
    type: 'generic',
    config: {
      mallId: 'sclocal',
      mallName: '순천로컬푸드 함께가게',
      baseUrl: 'https://sclocal.kr',
      productSelector: '.item_list .item_box',
      nameSelector: '.item_name',
      priceSelector: '.price',
      imageSelector: 'img',
      linkSelector: 'a',
      categories: ['농산물', '축산물', '가공식품'],
      tags: ['농산물', '전남', '순천', '로컬푸드'],
      note: 'Custom platform with category-based product listings. URL format: ?pn=product.list&cuid=XXX'
    }
  },
  'najumall': {
    type: 'generic',
    config: {
      mallId: 'najumall',
      mallName: '나주몰',
      baseUrl: 'https://najumall.kr',
      productSelector: '.xans-product-listmain .xans-record-',
      nameSelector: 'img',
      nameAttribute: 'alt',
      priceSelector: 'li.product_price',
      imageSelector: 'img',
      linkSelector: 'a',
      categories: ['과일', '농산물', '축산물', '채소', '건강식품', '곡물', '수산물', '가공식품', '남도 전통주'],
      tags: ['농산물', '전남', '나주', '나주배'],
      note: 'Cafe24-based platform with 9 categories. Famous for Naju pears (나주배)'
    }
  },
  'shinan1004': {
    type: 'generic',
    config: {
      mallId: 'shinan1004',
      mallName: '신안1004몰',
      baseUrl: 'https://shinan1004mall.kr',
      productSelector: '.xans-product-listmain .xans-record-, .prdList .xans-record-',
      nameSelector: 'img',
      nameAttribute: 'alt',
      priceSelector: 'ul.spec li.xans-record- span:last-child',
      imageSelector: 'img',
      linkSelector: 'a',
      categories: ['소금', '수산물', '신안특산품', '젓갈', '곡물', '농산물'],
      tags: ['농산물', '수산물', '전남', '신안', '1004섬', '천일염'],
      note: 'Cafe24-based platform. Famous for Shinan sea salt and seafood products. Requires price correction for truncated values.'
    }
  },
  'okjmall': {
    type: 'generic',
    config: {
      mallId: 'okjmall',
      mallName: '장흥몰',
      baseUrl: 'https://okjmall.com',
      productSelector: '.item_gallery_type .item_cont, .item_list_type .item_cont',
      nameSelector: '.item_name',
      priceSelector: '.item_price_sale',
      imageSelector: '.item_photo_box img',
      linkSelector: 'a[href*="goods_view"]',
      categories: ['한우', '표고버섯', '장흥특산품', '곡물', '버섯', '농산물'],
      tags: ['농산물', '전남', '장흥', '한우', '표고버섯', '홍차'],
      note: 'Godo Mall platform. Famous for Jangheung Korean beef, shiitake mushrooms, and black tea.'
    }
  },
  'yeongammall': {
    type: 'generic',
    config: {
      mallId: 'yeongammall',
      mallName: '영암몰',
      baseUrl: 'https://yeongammall.co.kr',
      productSelector: '.xans-record-',
      nameSelector: 'img',
      nameAttribute: 'alt',
      priceSelector: 'span:contains("원"), .price, [class*="price"]',
      imageSelector: 'img',
      linkSelector: 'a',
      categories: ['한우', '곡물', '수산물', '채소', '가공식품', '전통주', '과일', '영암특산품'],
      tags: ['농산물', '수산물', '전남', '영암', '한우', '멜론', '장어', '기찬랜드'],
      note: 'Cafe24 platform. Famous for Yeongam Korean beef (기찬랜드), melons, and freshwater eel.'
    }
  },
  'jindoarirangmall': {
    type: 'enhanced-generic',
    config: {
      mallId: 'jindoarirangmall',
      mallName: '진도아리랑몰',
      baseUrl: 'https://jindoarirangmall.com',
      productSelector: '.xans-record-',
      nameSelector: 'img',
      nameAttribute: 'alt',
      priceSelector: 'span:contains("원"), .price, [class*="price"], li:contains("원")',
      imageSelector: 'img',
      linkSelector: 'a',
      categories: ['수산물', '울금', '구기자', '곡물', '한우', '전통주', '선물세트', '채소', '가공식품', '꿀', '진도특산품'],
      tags: ['농산물', '수산물', '전남', '진도', '울금', '구기자', '전복', '곱창김', '홍주'],
      note: 'Cafe24 platform. Famous for Jindo turmeric (울금), goji berries (구기자), abalone, laver (곱창김), and traditional hongju wine.'
    }
  },
  'wandofood': {
    type: 'generic',
    config: {
      mallId: 'wandofood',
      mallName: '완도군이숍',
      baseUrl: 'https://wandofood.go.kr',
      productSelector: '.xans-record-',
      nameSelector: 'img',
      nameAttribute: 'alt',
      priceSelector: 'span:contains("원"), .price, [class*="price"], li:contains("원")',
      imageSelector: 'img',
      linkSelector: 'a',
      categories: ['완도전복', '해조류', '수산물', '농산물', '간편식품', '선물세트', '김', '완도특산품'],
      tags: ['수산물', '전남', '완도', '전복', '해조류', '김', '미역', '다시마', '황칠'],
      note: 'Cafe24 platform. Famous for Wando abalone (완도전복), seaweed products, and premium laver. Also produces hwangchil and moringa.'
    }
  },
  'hampyeongm': {
    type: 'generic',
    config: {
      mallId: 'hampyeongm',
      mallName: '함평천지몰',
      baseUrl: 'https://hampyeongm.com',
      productSelector: '.prd-item',
      nameSelector: '.description',
      nameAttribute: 'text',
      nameExtractor: (text: string) => {
        const match = text.match(/상품명\s*:\s*(.+?)(?=\s*판매가|$)/);
        return match ? match[1].trim() : '';
      },
      priceSelector: '.description',
      priceExtractor: (text: string) => {
        const match = text.match(/판매가\s*:\s*([\d,]+원)/);
        return match ? match[1] : '';
      },
      imageSelector: 'img',
      linkSelector: 'a',
      categories: ['베스트', '농산물', '축수산물', '가공식품', '공예품'],
      tags: ['전남', '함평', '천지몰', '농수산물', '로컬푸드', '한우', '민물장어', '쌀'],
      note: 'Cafe24 platform with .prd-item product structure. Product info in .description element.'
    }
  },
  'damyangmk': {
    type: 'generic',
    config: {
      mallId: 'damyangmk',
      mallName: '담양장터',
      baseUrl: 'https://damyangmk.kr',
      productSelector: 'li[id^="anchorBoxId"]',
      nameSelector: 'img',
      nameAttribute: 'alt',
      priceSelector: '.description',
      priceExtractor: (text: string) => {
        const match = text.match(/판매가\s*:\s*([\d,]+원)/);
        return match ? match[1] : '';
      },
      imageSelector: 'img',
      linkSelector: 'a',
      categories: ['신선식품', '가공식품', '전통식품', '인기상품', '전체상품'],
      tags: ['전남', '담양', '죽순', '대나무', '한과', '전통식품', '한우', '참기름', '매실', '식초'],
      note: 'Cafe24 platform with li[id^="anchorBoxId"] product structure. Price in .description element.'
    }
  },
  'greengj': {
    type: 'generic',
    config: {
      mallId: 'greengj',
      mallName: '초록믿음(강진)',
      baseUrl: 'https://greengj.com',
      productSelector: 'li[id^="anchorBoxId"]',
      nameSelector: 'img',
      nameAttribute: 'alt',
      priceSelector: '.description',
      priceExtractor: (text: string) => {
        const match = text.match(/판매가\s*:\s*([\d,]+원)/);
        return match ? match[1] : '';
      },
      imageSelector: 'img',
      linkSelector: 'a',
      categories: ['전체상품', '발효식품', '곡류', '건강식품', '버섯류', '가공식품', '수산물', '농/축산물', '강진쌀', '쌀귀리'],
      tags: ['전남', '강진', '초록믿음', '유기농', '발효식품', '한우', '쌀', '귀리', '버섯', '전복', '토하젓', '황칠'],
      note: 'Cafe24 platform with li[id^="anchorBoxId"] product structure. Specializes in organic and fermented foods.'
    }
  },
  'hwasunfarm': {
    type: 'generic',
    config: {
      mallId: 'hwasunfarm',
      mallName: '화순팜',
      baseUrl: 'https://www.hwasunfarm.com',
      productSelector: 'a[href*="kwa-ABS_goods_v-"]',
      nameSelector: 'h1, title, .goods_name, [class*="title"], [class*="name"]',
      priceSelector: 'body',
      priceExtractor: (text: string) => {
        const pricePatterns = [
          /(\d{1,3}(?:,\d{3})*)\s*원/,
          /판매가\s*:\s*([\d,]+원)/,
          /가격\s*:\s*([\d,]+원)/
        ];
        for (const pattern of pricePatterns) {
          const match = text.match(pattern);
          if (match && match[0]) {
            return match[0];
          }
        }
        return '';
      },
      imageSelector: '.goods_image img, .product_image img, .main_image img, [class*="image"] img, img[src*="goods"]',
      linkSelector: 'a',
      categories: ['농산물', '축산물', '화순쌀', '수산물', '가공상품', '설레는 날', '기타제품', '화훼류', '로컬푸드', '상생 마켓'],
      tags: ['전남', '화순', '화순팜', '샤인머스켓', '고구마', '파프리카', '토마토', '한우', '흑돼지', '화순쌀', '무농약', '한약재', '블루베리', '복숭아'],
      note: 'Custom platform with kwa-ABS_goods_v-{id}-{category} URL pattern. Comprehensive agricultural products.'
    }
  },
  'gokseongmall': {
    type: 'generic',
    config: {
      mallId: 'gokseongmall',
      mallName: '곡성몰',
      baseUrl: 'https://gokseongmall.com',
      productSelector: 'a[href*="kwa-ABS_goods_v-"]',
      nameSelector: 'h1, title, .goods_name, [class*="title"], [class*="name"]',
      priceSelector: 'body',
      priceExtractor: (text: string) => {
        const pricePatterns = [
          /(\d{1,3}(?:,\d{3})*)\s*원/,
          /판매가\s*:\s*([\d,]+원)/,
          /가격\s*:\s*([\d,]+원)/,
          /소비자가\s*:\s*([\d,]+원)/
        ];
        for (const pattern of pricePatterns) {
          const match = text.match(pattern);
          if (match && match[0]) {
            return match[0];
          }
        }
        return '';
      },
      imageSelector: '.goods_image img, .product_image img, .main_image img, [class*="image"] img, img[src*="goods"], img[src*="upload"]',
      linkSelector: 'a',
      categories: ['농산물', '축수산물', '가공식품', '생활', '관광', '여행', '베스트상품', '멜론왔썸'],
      tags: ['전남', '곡성', '곡성몰', '유기농', '쌀', '멜론', '토란', '한우', '흑돼지', '민물장어', '지리산', '기차마을', '섬진강', '토마토', '죽염'],
      note: 'Custom platform with kwa-ABS_goods_v-{id}-{category} URL pattern. Specializes in Gokseong regional products.'
    }
  },
  'cyso': {
    type: 'generic',
    config: {
      mallId: 'cyso',
      mallName: '사이소(경북몰)',
      baseUrl: 'https://www.cyso.co.kr',
      productSelector: 'a[href*="shop/item.php?it_id="]',
      nameSelector: 'h1, title, .it_name, [class*="title"], [class*="name"]',
      priceSelector: 'body',
      priceExtractor: (text: string) => {
        const pricePatterns = [
          /(\d{1,3}(?:,\d{3})*)\s*원/,
          /판매가\s*:\s*([\d,]+원)/,
          /가격\s*:\s*([\d,]+원)/,
          /소비자가\s*:\s*([\d,]+원)/,
          /할인가\s*:\s*([\d,]+원)/
        ];
        for (const pattern of pricePatterns) {
          const match = text.match(pattern);
          if (match && match[0]) {
            return match[0];
          }
        }
        return '';
      },
      imageSelector: '.it_image img, .product_image img, .item_image img, [class*="image"] img, img[src*="item"], img[src*="product"]',
      linkSelector: 'a',
      categories: ['쌀/잡곡', '과일류', '채소류', '축산물', '수산물', '가공식품', '김치/장류/참기름', '한과/떡/빵류'],
      tags: ['경북', '사이소', '경상북도', '쌀', '잡곡', '곶감', '상주곶감', '한우', '풍기인삼', '예천참기름', '안동', '경주', '포항', '구미', '영주', '상주', '문경', '경산'],
      note: 'Traditional PHP e-commerce platform with shop/item.php?it_id= URL pattern. Gyeongbuk regional specialties.'
    }
  },
  'sjmall': {
    type: 'generic',
    config: {
      mallId: 'sjmall',
      mallName: '상주몰',
      baseUrl: 'https://sjmall.cyso.co.kr',
      productSelector: 'a[href*="shop/item.php?it_id="]',
      nameSelector: 'h1, title, .it_name, [class*="title"], [class*="name"]',
      priceSelector: 'body',
      priceExtractor: (text: string) => {
        const pricePatterns = [
          /(\d{1,3}(?:,\d{3})*)\s*원/,
          /판매가\s*:\s*([\d,]+원)/,
          /가격\s*:\s*([\d,]+원)/,
          /소비자가\s*:\s*([\d,]+원)/,
          /할인가\s*:\s*([\d,]+원)/
        ];
        for (const pattern of pricePatterns) {
          const match = text.match(pattern);
          if (match && match[0]) {
            return match[0];
          }
        }
        return '';
      },
      imageSelector: '.it_image img, .product_image img, .item_image img, [class*="image"] img, img[src*="item"], img[src*="product"]',
      linkSelector: 'a',
      categories: ['축산물', '채소', '상주특산물', '농산물', '곶감', '쌀/곡류'],
      tags: ['경북', '상주', '명실상주', '상주곶감', '한우', '쌀', '곡류', '농산물', '축산물', '특산물'],
      note: 'Traditional PHP e-commerce platform with shop/item.php?it_id= URL pattern. Sangju regional specialties including famous Sangju dried persimmons.'
    }
  },
  'cdmall': {
    type: 'generic',
    config: {
      mallId: 'cdmall',
      mallName: '청도몰',
      baseUrl: 'https://cdmall.cyso.co.kr',
      productSelector: 'a[href*="shop/item.php?it_id="]',
      nameSelector: '#sit_title, h2#sit_title, #sit_desc, p#sit_desc',
      priceSelector: 'body',
      priceExtractor: (text: string) => {
        const pricePatterns = [
          /(\d{1,3}(?:,\d{3})*)\s*원/,
          /판매가\s*:\s*([\d,]+원)/,
          /가격\s*:\s*([\d,]+원)/,
          /소비자가\s*:\s*([\d,]+원)/,
          /할인가\s*:\s*([\d,]+원)/
        ];
        for (const pattern of pricePatterns) {
          const match = text.match(pattern);
          if (match && match[0]) {
            return match[0];
          }
        }
        return '';
      },
      imageSelector: 'img[src*="/data/item/"], .it_image img, .product_image img, .item_image img, [class*="image"] img',
      linkSelector: 'a',
      categories: ['과일류', '가공식품', '채소류', '축산물', '김치/장류', '청도특산물'],
      tags: ['경북', '청도', '청리브', '감말랭이', '반건시', '아이스홍시', '한재미나리', '복숭아', '곶감', '청도감'],
      note: 'Traditional PHP e-commerce platform with shop/item.php?it_id= URL pattern. Cheongdo regional specialties including famous dried persimmons and semi-dried persimmons.'
    }
  },
  'yjmarket': {
    type: 'generic',
    config: {
      mallId: 'yjmarket',
      mallName: '영주장날',
      baseUrl: 'https://yjmarket.cyso.co.kr',
      productSelector: 'a[href*="shop/item.php?it_id="]',
      nameSelector: '#sit_title, h2#sit_title, #sit_desc, p#sit_desc',
      priceSelector: 'body',
      priceExtractor: (text: string) => {
        const pricePatterns = [
          /(\d{1,3}(?:,\d{3})*)\s*원/,
          /판매가\s*:\s*([\d,]+원)/,
          /가격\s*:\s*([\d,]+원)/,
          /소비자가\s*:\s*([\d,]+원)/,
          /할인가\s*:\s*([\d,]+원)/
        ];
        for (const pattern of pricePatterns) {
          const match = text.match(pattern);
          if (match && match[0]) {
            return match[0];
          }
        }
        return '';
      },
      imageSelector: 'img[src*="/data/item/"], .it_image img, .product_image img, .item_image img, [class*="image"] img',
      linkSelector: 'a',
      categories: ['과일류', '영주특산물', '축산물', '꿀/홍삼', '쌀/잡곡', '채소류', '김치/장류', '가공식품'],
      tags: ['경북', '영주', '영주장날', '사과', '인삼', '풍기인삼', '한우', '영주한우', '팔팔메기', '영주쌀', '소백산', '선비'],
      note: 'Traditional PHP e-commerce platform with shop/item.php?it_id= URL pattern. Yeongju regional specialties including famous apples, ginseng, Korean beef, and local products.'
    }
  },
  'csmall': {
    type: 'generic',
    config: {
      mallId: 'csmall',
      mallName: '청송몰',
      baseUrl: 'https://csmall.cyso.co.kr',
      productSelector: 'a[href*="shop/item.php?it_id="]',
      nameSelector: '#sit_title, h2#sit_title, #sit_desc, p#sit_desc',
      priceSelector: 'body',
      priceExtractor: (text: string) => {
        const pricePatterns = [
          /(\d{1,3}(?:,\d{3})*)\s*원/,
          /판매가\s*:\s*([\d,]+원)/,
          /가격\s*:\s*([\d,]+원)/,
          /소비자가\s*:\s*([\d,]+원)/,
          /할인가\s*:\s*([\d,]+원)/
        ];
        for (const pattern of pricePatterns) {
          const match = text.match(pattern);
          if (match && match[0]) {
            return match[0];
          }
        }
        return '';
      },
      imageSelector: 'img[src*="/data/item/"], .it_image img, .product_image img, .item_image img, [class*="image"] img',
      linkSelector: 'a',
      categories: ['과일류', '청송특산물', '즙류/식초', '꿀', '한과', '가공식품', '전통장류'],
      tags: ['경북', '청송', '청송사과', '사과', '부사', '사과즙', '한과', '유과', '청송특산물', '매실', '토종꿀', '엉겅퀴', '청송명품'],
      note: 'Traditional PHP e-commerce platform with shop/item.php?it_id= URL pattern. Specializes in Cheongsung apples and regional specialties including apple juice, traditional confections, and local products.'
    }
  },
  'onsim': {
    type: 'generic',
    config: {
      mallId: 'onsim',
      mallName: '영양온심마켓',
      baseUrl: 'https://onsim.cyso.co.kr',
      productSelector: 'a[href*="shop/item.php?it_id="]',
      nameSelector: '#sit_title, h2#sit_title, #sit_desc, p#sit_desc',
      priceSelector: 'body',
      priceExtractor: (text: string) => {
        // Check JavaScript variables first (more reliable for 영양온심마켓)
        const jsMatch = text.match(/var labbit_price = parseInt\('(\d+)'\)/);
        if (jsMatch) {
          return parseInt(jsMatch[1]).toLocaleString() + '원';
        }
        
        // Fallback to regular patterns
        const pricePatterns = [
          /(\d{1,3}(?:,\d{3})*)\s*원/,
          /판매가\s*:\s*([\d,]+원)/,
          /가격\s*:\s*([\d,]+원)/,
          /소비자가\s*:\s*([\d,]+원)/,
          /할인가\s*:\s*([\d,]+원)/
        ];
        for (const pattern of pricePatterns) {
          const match = text.match(pattern);
          if (match && match[0]) {
            return match[0];
          }
        }
        return '';
      },
      imageSelector: 'img[src*="/data/item/"], #sit_pvi img, .it_image img, .product_image img, .item_image img, [class*="image"] img',
      linkSelector: 'a',
      categories: ['영양고추', '고춧가루', '과일류', '임산물류/채소류', '쌀/잡곡류', '건강/가공식품', '토종꿀/장뇌삼/녹용', '전통장류', '기타'],
      tags: ['경북', '영양', '영양고추', '고춧가루', '착한송이', '홍화씨', '산나물', '버섯', '당귀', '장뇌삼', '꿀', '전통장류', '유기농'],
      note: 'Traditional PHP e-commerce platform with shop/item.php?it_id= URL pattern. Specializes in Yeongyang red peppers, gochugaru (red pepper powder), mushrooms, and traditional health foods. Price extraction uses JavaScript variables for reliability.'
    }
  },
  'ulmall': {
    type: 'generic',
    config: {
      mallId: 'ulmall',
      mallName: '울릉도몰',
      baseUrl: 'https://ulmall.cyso.co.kr',
      productSelector: 'a[href*="shop/item.php?it_id="]',
      nameSelector: '#sit_title, h2#sit_title, #sit_desc, p#sit_desc',
      priceSelector: 'body',
      priceExtractor: (text: string) => {
        // Check JavaScript variables first (reliable for CYSO platforms)
        const jsMatch = text.match(/var labbit_price = parseInt\('(\d+)'\)/);
        if (jsMatch) {
          return parseInt(jsMatch[1]).toLocaleString() + '원';
        }
        
        // Fallback to regular patterns
        const pricePatterns = [
          /(\d{1,3}(?:,\d{3})*)\s*원/,
          /판매가\s*:\s*([\d,]+원)/,
          /가격\s*:\s*([\d,]+원)/,
          /소비자가\s*:\s*([\d,]+원)/,
          /할인가\s*:\s*([\d,]+원)/
        ];
        for (const pattern of pricePatterns) {
          const match = text.match(pattern);
          if (match && match[0]) {
            return match[0];
          }
        }
        return '';
      },
      imageSelector: 'img[src*="/data/item/"], #sit_pvi img, .it_image img, .product_image img, .item_image img, [class*="image"] img',
      linkSelector: 'a',
      categories: ['채소류', '수산물', '건나물/건채소', '전복/홍합/골뱅이', '건어물', '액젓/젓갈', '산채나물', '버섯', '기타특산물'],
      tags: ['경북', '울릉도', '울릉군', '명이나물', '산마늘', '부지갱이', '오징어', '전복', '산나물', '산삼', '호박식혜', '섬초롱', '자연산'],
      note: 'Traditional PHP e-commerce platform with shop/item.php?it_id= URL pattern. Specializes in Ulleungdo island products including wild vegetables (명이나물, 부지갱이), seafood (오징어, 전복), and unique island specialties. Price extraction uses JavaScript variables for reliability.'
    }
  },
  'bmall': {
    type: 'generic',
    config: {
      mallId: 'bmall',
      mallName: '봉화장터',
      baseUrl: 'https://bmall.cyso.co.kr',
      productSelector: 'a[href*="shop/item.php?it_id="]',
      nameSelector: '#sit_title, h2#sit_title, #sit_desc, p#sit_desc',
      priceSelector: 'body',
      priceExtractor: (text: string) => {
        // Check JavaScript variables first (reliable for CYSO platforms)
        const jsMatch = text.match(/var labbit_price = parseInt\('(\d+)'\)/);
        if (jsMatch) {
          return parseInt(jsMatch[1]).toLocaleString() + '원';
        }
        
        // Fallback to regular patterns
        const pricePatterns = [
          /(\d{1,3}(?:,\d{3})*)\s*원/,
          /판매가\s*:\s*([\d,]+원)/,
          /가격\s*:\s*([\d,]+원)/,
          /소비자가\s*:\s*([\d,]+원)/,
          /할인가\s*:\s*([\d,]+원)/
        ];
        for (const pattern of pricePatterns) {
          const match = text.match(pattern);
          if (match && match[0]) {
            return match[0];
          }
        }
        return '';
      },
      imageSelector: 'img[src*="/data/item/"], #sit_pvi img, .it_image img, .product_image img, .item_image img, [class*="image"] img',
      linkSelector: 'a',
      categories: ['쌀/잡곡', '과일류', '축산물', '발효식품', '전통장류', '식초/조청', '버섯류', '건강식품', '김치/장아찌', '기름/참깨'],
      tags: ['경북', '봉화', '봉화군', '한우', '로얄한우', '현미흑초', '홍도라지', '조청', '참기름', '들기름', '된장', '청국장', '표고버섯', '초석잠', '동충하초', '전통발효'],
      note: 'Traditional PHP e-commerce platform with shop/item.php?it_id= URL pattern. Specializes in Bonghwa regional products including premium Korean beef, traditional fermented foods, mountain herbs, premium oils, and health foods. Price extraction uses JavaScript variables for reliability.'
    }
  },
  'ycjang': {
    type: 'generic',
    config: {
      mallId: 'ycjang',
      mallName: '예천장터',
      baseUrl: 'https://ycjang.cyso.co.kr',
      productSelector: 'a[href*="shop/item.php?it_id="]',
      nameSelector: '#sit_title, h2#sit_title, #sit_desc, p#sit_desc',
      priceSelector: 'body',
      priceExtractor: (text: string) => {
        // Check JavaScript variables first (reliable for CYSO platforms)
        const jsMatch = text.match(/var labbit_price = parseInt\('(\d+)'\)/);
        if (jsMatch) {
          return parseInt(jsMatch[1]).toLocaleString() + '원';
        }
        
        // Fallback to regular patterns
        const pricePatterns = [
          /(\d{1,3}(?:,\d{3})*)\s*원/,
          /판매가\s*:\s*([\d,]+원)/,
          /가격\s*:\s*([\d,]+원)/,
          /소비자가\s*:\s*([\d,]+원)/,
          /할인가\s*:\s*([\d,]+원)/
        ];
        for (const pattern of pricePatterns) {
          const match = text.match(pattern);
          if (match && match[0]) {
            return match[0];
          }
        }
        return '';
      },
      imageSelector: 'img[src*="/data/item/"], #sit_pvi img, .it_image img, .product_image img, .item_image img, [class*="image"] img',
      linkSelector: 'a',
      categories: ['유지류', '참기름/들기름세트', '한우', '돼지고기', '과일류', '쌀/잡곡', '건강식품', '가공식품', '예천특산물'],
      tags: ['경북', '예천', '예천장터', '구룡쌀', '예천참기름', '들기름', '예천한우', '인들한우', '지역특산품', '농산물', '축산물', '전통식품'],
      note: 'Traditional PHP e-commerce platform with shop/item.php?it_id= URL pattern. Specializes in Yecheon regional products including premium rice (구룡쌀), sesame oil, perilla oil, Korean beef, and local agricultural products. Price extraction uses JavaScript variables for reliability.'
    }
  },
  'mgmall': {
    type: 'generic',
    config: {
      mallId: 'mgmall',
      mallName: '문경몰',
      baseUrl: 'https://mgmall.cyso.co.kr',
      productSelector: 'a[href*="shop/item.php?it_id="]',
      nameSelector: '#sit_title, h2#sit_title, #sit_desc, p#sit_desc',
      priceSelector: 'body',
      priceExtractor: (text: string) => {
        // Check JavaScript variables first (reliable for CYSO platforms)
        const jsMatch = text.match(/var labbit_price = parseInt\('(\d+)'\)/);
        if (jsMatch) {
          return parseInt(jsMatch[1]).toLocaleString() + '원';
        }
        
        // Fallback to regular patterns
        const pricePatterns = [
          /(\d{1,3}(?:,\d{3})*)\s*원/,
          /판매가\s*:\s*([\d,]+원)/,
          /가격\s*:\s*([\d,]+원)/,
          /소비자가\s*:\s*([\d,]+원)/,
          /할인가\s*:\s*([\d,]+원)/
        ];
        for (const pattern of pricePatterns) {
          const match = text.match(pattern);
          if (match && match[0]) {
            return match[0];
          }
        }
        return '';
      },
      imageSelector: 'img[src*="/data/item/"], #sit_pvi img, .it_image img, .product_image img, .item_image img, [class*="image"] img',
      linkSelector: 'a',
      categories: ['오미자 제품', '유제품', '꿀', '돼지고기', '버섯', '김치/절임', '쌀/곡류', '식초', '기름류', '감자', '문경특산물'],
      tags: ['경북', '문경', '문경몰', '문경새재', '오미자', '약돌벌꿀', '송화고버섯', '백송화버섯', '문경쌀', '참기름', '들기름', '한돈', '문경약돌돼지', '현미식초', '감자'],
      note: 'Traditional PHP e-commerce platform with shop/item.php?it_id= URL pattern. Specializes in Mungyeong regional products including schisandra (오미자) products, medicinal stone honey (약돌벌꿀), pine mushrooms (송화고), premium oils, Korean pork, and local agricultural products. Price extraction uses JavaScript variables for reliability.'
    }
  },
  'cgmall': {
    type: 'generic',
    config: {
      mallId: 'cgmall',
      mallName: '칠곡몰',
      baseUrl: 'https://cgmall.cyso.co.kr',
      productSelector: 'a[href*="shop/item.php?it_id="]',
      nameSelector: '#sit_title, h2#sit_title, #sit_desc, p#sit_desc',
      priceSelector: 'body',
      priceExtractor: (text: string) => {
        // Check JavaScript variables first (reliable for CYSO platforms)
        const jsMatch = text.match(/var labbit_price = parseInt\('(\d+)'\)/);
        if (jsMatch) {
          return parseInt(jsMatch[1]).toLocaleString() + '원';
        }
        
        // Fallback to regular patterns
        const pricePatterns = [
          /(\d{1,3}(?:,\d{3})*)\s*원/,
          /판매가\s*:\s*([\d,]+원)/,
          /가격\s*:\s*([\d,]+원)/,
          /소비자가\s*:\s*([\d,]+원)/,
          /할인가\s*:\s*([\d,]+원)/
        ];
        for (const pattern of pricePatterns) {
          const match = text.match(pattern);
          if (match && match[0]) {
            return match[0];
          }
        }
        return '';
      },
      imageSelector: 'img[src*="/data/item/"], #sit_pvi img, .it_image img, .product_image img, .item_image img, [class*="image"] img',
      linkSelector: 'a',
      categories: ['돼지고기', '꿀', '기름류', '버섯', '제과/제빵', '과일', '채소', '장류', '식초', '한우/소고기', '두부', '즙류', '칠곡특산물'],
      tags: ['경북', '칠곡', '칠곡몰', '칠곡양돈', '무항생제', '칠곡양봉', '아카시아꿀', '기산참외', '착한송이버섯', '농부플러스', '들기름', '참기름', '표고버섯', '한돈', '복숭아', '자두', '가시오이', '명이나물'],
      note: 'Traditional PHP e-commerce platform with shop/item.php?it_id= URL pattern. Specializes in Chilgok regional products including antibiotic-free pork (무항생제 돼지고기), acacia honey (아카시아꿀), premium mushrooms (표고버섯, 송이버섯), local fruits (기산참외, 복숭아), and various agricultural products. Price extraction uses JavaScript variables for reliability.'
    }
  }
  // Add more mall configurations as needed
};

export function createScraper(mallId: string): BaseScraper | null {
  const definition = scraperRegistry[mallId];
  
  if (!definition) {
    console.warn(`No scraper configuration found for mall: ${mallId}`);
    return null;
  }

  switch (definition.type) {
    case 'generic':
      return new GenericHTMLScraper(definition.config);
    case 'enhanced-generic':
      return new EnhancedGenericHTMLScraper(definition.config);
    // Add more scraper types as needed
    default:
      return null;
  }
}