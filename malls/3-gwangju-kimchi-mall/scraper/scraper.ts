import axios from 'axios';
import * as cheerio from 'cheerio';
import { writeFileSync } from 'fs';
import { join } from 'path';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  discountRate: number;
  image: string;
  link: string;
  manufacturer: string;
  description: string;
  rating: number;
  reviewCount: number;
  category: string;
  categoryId: string;
  mallId: number;
  mallName: string;
}

interface Category {
  id: string;
  name: string;
  url: string;
  subcategories?: Category[];
}

const MALL_ID = 3;
const MALL_NAME = '광주김치몰';
const BASE_URL = 'https://www.k-kimchi.kr';

// Categories from analysis
const CATEGORIES: Category[] = [
  {
    id: "001",
    name: "포기김치",
    url: "/index.php?cate=001"
  },
  {
    id: "003",
    name: "묵은지",
    url: "/index.php?cate=003"
  },
  {
    id: "004",
    name: "별미김치",
    url: "/index.php?cate=004",
    subcategories: [
      { id: "004001", name: "깍두기", url: "/index.php?cate=004001" },
      { id: "004003", name: "갓김치", url: "/index.php?cate=004003" },
      { id: "004005", name: "백김치", url: "/index.php?cate=004005" },
      { id: "004007", name: "부추김치", url: "/index.php?cate=004007" },
      { id: "004008", name: "석박지", url: "/index.php?cate=004008" },
      { id: "004010", name: "오이소박이", url: "/index.php?cate=004010" },
      { id: "004011", name: "열무김치", url: "/index.php?cate=004011" },
      { id: "004012", name: "총각김치", url: "/index.php?cate=004012" },
      { id: "004013", name: "파김치", url: "/index.php?cate=004013" }
    ]
  },
  {
    id: "005",
    name: "30%할인전",
    url: "/index.php?cate=005"
  },
  {
    id: "006",
    name: "명인 명품김치",
    url: "/index.php?cate=006"
  },
  {
    id: "002",
    name: "반찬가게",
    url: "/index.php?cate=002"
  },
  {
    id: "015",
    name: "선물세트",
    url: "/index.php?cate=015"
  }
];

async function fetchPage(url: string): Promise<string> {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    throw error;
  }
}

function calculateRating($element: cheerio.Cheerio<cheerio.Element>): number {
  // Count filled stars (fa-star class)
  const filledStars = $element.find('.star .fa-star').length;
  // Count half stars if any (fa-star-half-o class)
  const halfStars = $element.find('.star .fa-star-half-o').length;
  return filledStars + (halfStars * 0.5);
}

function extractProducts($: cheerio.CheerioAPI, categoryName: string, categoryId: string): Product[] {
  const products: Product[] = [];
  
  $('.product_cell').each((index, element) => {
    const $element = $(element);
    
    // Extract product details
    const name = $element.find('.productName a').text().trim();
    const originalPriceText = $element.find('.price strike').text().trim();
    const discountedPriceText = $element.find('.price span').text().trim();
    const discountRateText = $element.find('.salePercentage').text().trim();
    
    const originalPrice = parseInt(originalPriceText.replace(/[^0-9]/g, '')) || 0;
    const price = parseInt(discountedPriceText.replace(/[^0-9]/g, '')) || originalPrice;
    const discountRate = parseInt(discountRateText.replace(/[^0-9]/g, '')) || 0;
    
    const imageUrl = $element.find('.viewImage img').attr('src') || '';
    const image = imageUrl.startsWith('http') ? imageUrl : `${BASE_URL}${imageUrl}`;
    
    const linkUrl = $element.find('.productName a').attr('href') || '';
    const link = linkUrl.startsWith('http') ? linkUrl : `${BASE_URL}${linkUrl}`;
    
    const manufacturer = $element.find('.product_cell_tit a').text().trim();
    const description = $element.find('.productSubject').text().trim();
    
    const rating = calculateRating($element);
    const reviewCountText = $element.find('.star span').text().trim();
    const reviewCount = parseInt(reviewCountText.match(/\d+/)?.[0] || '0');
    
    // Extract product ID from URL
    const idMatch = linkUrl.match(/num=(\d+)/);
    const id = idMatch ? idMatch[1] : `${MALL_ID}-${Date.now()}-${index}`;
    
    if (name && price > 0) {
      products.push({
        id,
        name,
        price,
        originalPrice,
        discountRate,
        image,
        link,
        manufacturer,
        description,
        rating,
        reviewCount,
        category: categoryName,
        categoryId,
        mallId: MALL_ID,
        mallName: MALL_NAME
      });
    }
  });
  
  return products;
}

async function scrapeCategory(category: Category, parentName: string = ''): Promise<Product[]> {
  const allProducts: Product[] = [];
  const categoryName = parentName ? `${parentName} > ${category.name}` : category.name;
  
  console.log(`Scraping category: ${categoryName}`);
  
  // Scrape subcategories first if they exist
  if (category.subcategories && category.subcategories.length > 0) {
    for (const subcategory of category.subcategories) {
      const subcategoryProducts = await scrapeCategory(subcategory, category.name);
      allProducts.push(...subcategoryProducts);
    }
  } else {
    // Scrape products from this category
    let page = 1;
    let hasMorePages = true;
    
    while (hasMorePages) {
      const url = `${BASE_URL}${category.url}&page=${page}`;
      console.log(`  Fetching page ${page}: ${url}`);
      
      try {
        const html = await fetchPage(url);
        const $ = cheerio.load(html);
        
        const products = extractProducts($, categoryName, category.id);
        
        if (products.length === 0) {
          hasMorePages = false;
        } else {
          allProducts.push(...products);
          console.log(`  Found ${products.length} products (total: ${allProducts.length})`);
          
          // Check if there's a next page by looking for pagination links
          const nextPageExists = $('.pagination a').filter((i, el) => {
            return $(el).text().includes('다음') || $(el).text() === (page + 1).toString();
          }).length > 0;
          
          if (!nextPageExists) {
            hasMorePages = false;
          } else {
            page++;
          }
        }
        
        // Add delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`  Error scraping category ${categoryName}:`, error);
        hasMorePages = false;
      }
    }
  }
  
  return allProducts;
}

async function main() {
  console.log(`Starting scraper for ${MALL_NAME} (ID: ${MALL_ID})`);
  console.log(`Mall URL: ${BASE_URL}`);
  
  const allProducts: Product[] = [];
  
  // Scrape all categories
  for (const category of CATEGORIES) {
    const categoryProducts = await scrapeCategory(category);
    allProducts.push(...categoryProducts);
  }
  
  // Remove duplicates based on product ID
  const uniqueProducts = Array.from(
    new Map(allProducts.map(p => [p.id, p])).values()
  );
  
  console.log(`\nTotal products scraped: ${uniqueProducts.length}`);
  
  // Save results
  const outputPath = join(__dirname, `products-${MALL_ID}.json`);
  writeFileSync(outputPath, JSON.stringify(uniqueProducts, null, 2));
  console.log(`Results saved to: ${outputPath}`);
  
  // Save summary
  const summary = {
    mallId: MALL_ID,
    mallName: MALL_NAME,
    totalProducts: uniqueProducts.length,
    scrapedAt: new Date().toISOString(),
    categories: CATEGORIES.map(c => ({
      name: c.name,
      productCount: uniqueProducts.filter(p => 
        p.categoryId === c.id || p.categoryId.startsWith(c.id)
      ).length
    })),
    averageRating: uniqueProducts.reduce((sum, p) => sum + p.rating, 0) / uniqueProducts.length,
    averageDiscount: uniqueProducts.reduce((sum, p) => sum + p.discountRate, 0) / uniqueProducts.length
  };
  
  const summaryPath = join(__dirname, `summary-${MALL_ID}.json`);
  writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  console.log(`Summary saved to: ${summaryPath}`);
}

// Run the scraper
main().catch(error => {
  console.error('Scraper failed:', error);
  process.exit(1);
});