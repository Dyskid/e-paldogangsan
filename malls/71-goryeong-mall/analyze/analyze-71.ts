import * as fs from 'fs';
import * as path from 'path';

interface MallAnalysis {
  id: number;
  engname: string;
  name: string;
  url: string;
  structure: {
    productUrlPattern: string;
    categoryUrlPattern: string;
    paginationPattern: string;
    javascriptRequired: boolean;
    dataLocation: {
      productTitle: string;
      productPrice: string;
      productImage: string;
      productDescription: string;
    };
  };
  categories: Array<{
    id: string;
    name: string;
    url: string;
  }>;
  sampleProducts: Array<{
    id: string;
    name: string;
    url: string;
    price?: string;
  }>;
}

const analysis: MallAnalysis = {
  id: 71,
  engname: "goryeong-mall",
  name: "고령몰",
  url: "https://grmall.cyso.co.kr/",
  structure: {
    productUrlPattern: "/shop/item.php?it_id={productId}",
    categoryUrlPattern: "/shop/list.php?ca_id={categoryId}",
    paginationPattern: "/shop/list.php?ca_id={categoryId}&page={pageNumber}",
    javascriptRequired: false,
    dataLocation: {
      productTitle: ".sit_title",
      productPrice: ".tr_price",
      productImage: "#sit_pvi_big img",
      productDescription: "#sit_inf"
    }
  },
  categories: [
    { id: "gr10", name: "쌀/잡곡", url: "https://grmall.cyso.co.kr/shop/list.php?ca_id=gr10" },
    { id: "gr1010", name: "쌀", url: "https://grmall.cyso.co.kr/shop/list.php?ca_id=gr1010" },
    { id: "gr1020", name: "찹쌀", url: "https://grmall.cyso.co.kr/shop/list.php?ca_id=gr1020" },
    { id: "gr1030", name: "찰현미", url: "https://grmall.cyso.co.kr/shop/list.php?ca_id=gr1030" },
    { id: "gr1040", name: "흑미", url: "https://grmall.cyso.co.kr/shop/list.php?ca_id=gr1040" },
    { id: "gr1050", name: "기타잡곡", url: "https://grmall.cyso.co.kr/shop/list.php?ca_id=gr1050" },
    { id: "gr1090", name: "도정맵쌀", url: "https://grmall.cyso.co.kr/shop/list.php?ca_id=gr1090" },
    { id: "gr10a0", name: "떡/한과", url: "https://grmall.cyso.co.kr/shop/list.php?ca_id=gr10a0" },
    { id: "gr10b0", name: "누룽지", url: "https://grmall.cyso.co.kr/shop/list.php?ca_id=gr10b0" },
    { id: "gr20", name: "과일/채소", url: "https://grmall.cyso.co.kr/shop/list.php?ca_id=gr20" },
    { id: "gr30", name: "육류/가공품", url: "https://grmall.cyso.co.kr/shop/list.php?ca_id=gr30" },
    { id: "gr40", name: "차/음료", url: "https://grmall.cyso.co.kr/shop/list.php?ca_id=gr40" },
    { id: "gr50", name: "장류/소스", url: "https://grmall.cyso.co.kr/shop/list.php?ca_id=gr50" },
    { id: "gr60", name: "가공식품", url: "https://grmall.cyso.co.kr/shop/list.php?ca_id=gr60" },
    { id: "gr70", name: "건강식품", url: "https://grmall.cyso.co.kr/shop/list.php?ca_id=gr70" },
    { id: "gc", name: "선물세트", url: "https://grmall.cyso.co.kr/shop/list.php?ca_id=gc" }
  ],
  sampleProducts: [
    {
      id: "1729593010",
      name: "[생생팜]찰흑미 900g*4개",
      url: "https://grmall.cyso.co.kr/shop/item.php?it_id=1729593010",
      price: "32,000원"
    },
    {
      id: "1706074368",
      name: "[대림축산] 국내산 한우 소곱창모듬세트 1kg",
      url: "https://grmall.cyso.co.kr/shop/item.php?it_id=1706074368",
      price: "98,000원"
    },
    {
      id: "1698730733",
      name: "[하니베 누룽지]오분도 현미 누룽지 3팩묶음",
      url: "https://grmall.cyso.co.kr/shop/item.php?it_id=1698730733",
      price: "12,000원"
    },
    {
      id: "1698720696",
      name: "고령 우륵 쌀 10kg",
      url: "https://grmall.cyso.co.kr/shop/item.php?it_id=1698720696",
      price: "45,000원"
    },
    {
      id: "1705993451",
      name: "[태왕농원] 고령 대가야 쌀 10kg",
      url: "https://grmall.cyso.co.kr/shop/item.php?it_id=1705993451",
      price: "42,000원"
    }
  ]
};

// Save analysis to JSON file
const outputPath = path.join(__dirname, 'analysis-71.json');
fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2), 'utf-8');

console.log(`Analysis completed and saved to ${outputPath}`);