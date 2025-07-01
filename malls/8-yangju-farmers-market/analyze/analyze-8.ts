import * as fs from 'fs';
import * as path from 'path';

interface CategoryStructure {
  mainCategories: {
    xcode: string;
    name: string;
    type?: string;
    subcategories?: {
      mcode: string;
      name: string;
    }[];
  }[];
}

interface URLPatterns {
  categoryPattern: string;
  subcategoryPattern: string;
  productDetailPattern: string;
  searchPattern: string;
  paginationParameter: string;
}

interface ProductSelectors {
  container: string;
  link: string;
  image: string;
  name: string;
  subtitle: string;
  price: string;
  originalPrice: string;
  hiddenPriceData: {
    original: string;
    discounted: string;
  };
}

interface AnalysisResult {
  mallId: number;
  mallName: string;
  url: string;
  categoryStructure: CategoryStructure;
  urlPatterns: URLPatterns;
  productSelectors: ProductSelectors;
  requiresJavaScript: boolean;
  paginationMethod: string;
  additionalNotes: string[];
}

const analysis: AnalysisResult = {
  mallId: 8,
  mallName: "양주농부마켓 (Yangju Farmers Market)",
  url: "https://market.yangju.go.kr/",
  categoryStructure: {
    mainCategories: [
      {
        xcode: "001",
        name: "신선농축산물",
        subcategories: [
          { mcode: "012", name: "쌀 잡곡류" },
          { mcode: "014", name: "농산물꾸러미" },
          { mcode: "013", name: "고기류" },
          { mcode: "001", name: "계란" },
          { mcode: "005", name: "고구마" },
          { mcode: "004", name: "과채류" },
          { mcode: "006", name: "꿀" },
          { mcode: "009", name: "돼지감자" },
          { mcode: "007", name: "무" },
          { mcode: "002", name: "버섯/인삼" },
          { mcode: "003", name: "쌈채류" },
          { mcode: "010", name: "여주/작두콩" },
          { mcode: "011", name: "기타" }
        ]
      },
      {
        xcode: "003",
        name: "농산물 가공품",
        subcategories: [
          { mcode: "007", name: "건강차/즙/환/분말" },
          { mcode: "005", name: "꽃차" },
          { mcode: "006", name: "김치/반찬" },
          { mcode: "001", name: "치즈/요거트/잼" },
          { mcode: "003", name: "전통장류/기름류" },
          { mcode: "004", name: "흑염소진액" },
          { mcode: "008", name: "밀키트" },
          { mcode: "009", name: "전통주" }
        ]
      },
      {
        xcode: "004",
        name: "화훼",
        subcategories: [
          { mcode: "001", name: "반려식물" }
        ]
      },
      {
        xcode: "006",
        name: "선물세트",
        type: "P"
      },
      {
        xcode: "007",
        name: "정기배송상품"
      }
    ]
  },
  urlPatterns: {
    categoryPattern: "/shop/shopbrand.html?xcode={xcode}&type={type}",
    subcategoryPattern: "/shop/shopbrand.html?type=M&xcode={xcode}&mcode={mcode}",
    productDetailPattern: "/shop/shopdetail.html?branduid={product_id}&search=&xcode={xcode}&mcode={mcode}&scode=&special={special}&{hash}",
    searchPattern: "/shop/shopbrand.html?search={keyword}",
    paginationParameter: "page"
  },
  productSelectors: {
    container: "dl.item-list",
    link: "dl.item-list dt.thumb a",
    image: "img.MS_prod_img_m",
    name: "li.prd-name",
    subtitle: "li.prd-subname",
    price: "li.prd-price",
    originalPrice: "li.prd-consumer strike",
    hiddenPriceData: {
      original: "#s_price",
      discounted: "#s_dc"
    }
  },
  requiresJavaScript: false,
  paginationMethod: "URL parameter using 'page' (e.g., page=1, page=2)",
  additionalNotes: [
    "Uses MakeShop platform (evident from MS_ class prefixes)",
    "Product data is server-side rendered in HTML",
    "No API endpoints detected - traditional form submission",
    "Lazy loading implemented for images using lazyload.min.js",
    "Member login system affects price visibility",
    "Product IDs (branduid) are numeric identifiers",
    "Shopping cart system with quantity tracking available",
    "jQuery 1.7.2 used for UI interactions but not required for scraping"
  ]
};

// Generate output file
const outputPath = path.join(__dirname, 'analysis-8.json');
fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2));

console.log(`Analysis completed. Output saved to: ${outputPath}`);