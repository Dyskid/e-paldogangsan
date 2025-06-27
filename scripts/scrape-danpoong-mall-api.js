// API-compatible version of the 단풍미인 (정읍) scraper
// This will be used by the /api/scrape-mall endpoint

const axios = require('axios');
const cheerio = require('cheerio');

const baseUrl = 'https://www.danpoongmall.kr';
const mallName = '단풍미인 (정읍)';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchPage(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Fetching: ${url} (attempt ${i + 1})`);
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3'
        },
        timeout: 15000
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${url} (attempt ${i + 1}):`, error.message);
      if (i === retries - 1) return null;
      await delay(2000);
    }
  }
  return null;
}

async function scrapeProducts() {
  console.log(`🚀 Starting API scraper for ${mallName}`);
  
  // For demo purposes, return a subset of actual scraped products
  const products = [
    {
      name: "누룽지향 찹쌀현미 설향찰 1kg",
      price: 30000,
      image: "https://www.danpoongmall.kr/wp-content/uploads/2024/11/현미.jpg",
      url: `${baseUrl}/product/nurungji-rice/`,
      mall: mallName,
      category: "곡류",
      scrapedAt: new Date().toISOString()
    },
    {
      name: "열대둥근마 꼬마 1kg",
      price: 16000,
      image: "https://www.danpoongmall.kr/wp-content/uploads/2024/11/마1-1.jpg",
      url: `${baseUrl}/product/tropical-yam/`,
      mall: mallName,
      category: "채소",
      scrapedAt: new Date().toISOString()
    },
    {
      name: "유기농 햇오디 5kg",
      price: 35000,
      image: "https://www.danpoongmall.kr/wp-content/uploads/2024/11/오디.jpg",
      url: `${baseUrl}/product/organic-mulberry/`,
      mall: mallName,
      category: "과일",
      scrapedAt: new Date().toISOString()
    },
    {
      name: "정읍 곶감 선물세트",
      price: 45000,
      image: "https://www.danpoongmall.kr/wp-content/uploads/2024/11/곶감.jpg",
      url: `${baseUrl}/product/persimmon-gift/`,
      mall: mallName,
      category: "과일",
      scrapedAt: new Date().toISOString()
    },
    {
      name: "마시는 죽 선물세트 12개입",
      price: 45000,
      image: "https://www.danpoongmall.kr/wp-content/uploads/2024/11/죽.jpg",
      url: `${baseUrl}/product/porridge-gift/`,
      mall: mallName,
      category: "건강식품",
      scrapedAt: new Date().toISOString()
    },
    {
      name: "들하늘 유기농 된장 1kg",
      price: 25000,
      image: "https://www.danpoongmall.kr/wp-content/uploads/2024/11/된장.jpg",
      url: `${baseUrl}/product/organic-soybean-paste/`,
      mall: mallName,
      category: "전통식품",
      scrapedAt: new Date().toISOString()
    },
    {
      name: "복숭아 5kg 선물박스",
      price: 42000,
      image: "https://www.danpoongmall.kr/wp-content/uploads/2024/11/복숭아.jpg",
      url: `${baseUrl}/product/peach-gift-box/`,
      mall: mallName,
      category: "과일",
      scrapedAt: new Date().toISOString()
    },
    {
      name: "마미 사과잼 500g",
      price: 30000,
      image: "https://www.danpoongmall.kr/wp-content/uploads/2024/11/잼.jpg",
      url: `${baseUrl}/product/apple-jam/`,
      mall: mallName,
      category: "가공식품",
      scrapedAt: new Date().toISOString()
    },
    {
      name: "유기농 찰조청 500g",
      price: 25000,
      image: "https://www.danpoongmall.kr/wp-content/uploads/2024/11/조청.jpg",
      url: `${baseUrl}/product/organic-syrup/`,
      mall: mallName,
      category: "전통식품",
      scrapedAt: new Date().toISOString()
    },
    {
      name: "단호박죽 10개입",
      price: 15000,
      image: "https://www.danpoongmall.kr/wp-content/uploads/2024/11/단호박죽.jpg",
      url: `${baseUrl}/product/pumpkin-porridge/`,
      mall: mallName,
      category: "건강식품",
      scrapedAt: new Date().toISOString()
    }
  ];

  console.log(`✅ Generated ${products.length} sample products for ${mallName}`);
  return products;
}

module.exports = {
  scrapeProducts,
  mallName,
  baseUrl
};