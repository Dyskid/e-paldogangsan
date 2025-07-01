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
  id: 73,
  engname: "yecheon-market",
  name: "예천장터",
  url: "https://ycjang.cyso.co.kr/",
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
    { id: "yg01", name: "쌀/잡곡/떡", url: "https://ycjang.cyso.co.kr/shop/list.php?ca_id=yg01" },
    { id: "yg0103", name: "쌀", url: "https://ycjang.cyso.co.kr/shop/list.php?ca_id=yg0103" },
    { id: "yg0106", name: "찹쌀", url: "https://ycjang.cyso.co.kr/shop/list.php?ca_id=yg0106" },
    { id: "yg0107", name: "현미", url: "https://ycjang.cyso.co.kr/shop/list.php?ca_id=yg0107" },
    { id: "yg0117", name: "잡곡", url: "https://ycjang.cyso.co.kr/shop/list.php?ca_id=yg0117" },
    { id: "yg0127", name: "떡", url: "https://ycjang.cyso.co.kr/shop/list.php?ca_id=yg0127" },
    { id: "yg02", name: "과일/채소", url: "https://ycjang.cyso.co.kr/shop/list.php?ca_id=yg02" },
    { id: "yg0201", name: "과일", url: "https://ycjang.cyso.co.kr/shop/list.php?ca_id=yg0201" },
    { id: "yg0202", name: "채소", url: "https://ycjang.cyso.co.kr/shop/list.php?ca_id=yg0202" },
    { id: "yg03", name: "축산/가공품", url: "https://ycjang.cyso.co.kr/shop/list.php?ca_id=yg03" },
    { id: "yg04", name: "수산물", url: "https://ycjang.cyso.co.kr/shop/list.php?ca_id=yg04" },
    { id: "yg05", name: "건강식품", url: "https://ycjang.cyso.co.kr/shop/list.php?ca_id=yg05" },
    { id: "yg06", name: "가공식품", url: "https://ycjang.cyso.co.kr/shop/list.php?ca_id=yg06" },
    { id: "yg07", name: "김치/장류", url: "https://ycjang.cyso.co.kr/shop/list.php?ca_id=yg07" },
    { id: "yg08", name: "차/음료", url: "https://ycjang.cyso.co.kr/shop/list.php?ca_id=yg08" },
    { id: "sc", name: "선물세트", url: "https://ycjang.cyso.co.kr/shop/list.php?ca_id=sc" }
  ],
  sampleProducts: [
    {
      id: "1560840030",
      name: "[구룡영농조합법인] 2024년 햅쌀 예천 구룡쌀(영호진미) 20kg 백미 햇쌀",
      url: "https://ycjang.cyso.co.kr/shop/item.php?it_id=1560840030",
      price: "74,000원"
    },
    {
      id: "1610687193",
      name: "[풍국미곡처리장(주)] 2024년도산 햅쌀 당일도정 일품햅쌀 예천 우렁이쌀(일품) 20kg 백미",
      url: "https://ycjang.cyso.co.kr/shop/item.php?it_id=1610687193",
      price: "71,000원"
    },
    {
      id: "1560838598",
      name: "[예천열무농원] 국산대추 대추말랭이 300g",
      url: "https://ycjang.cyso.co.kr/shop/item.php?it_id=1560838598",
      price: "18,000원"
    },
    {
      id: "1560839094",
      name: "[예천열무농원] 청아 감말랭이 300g",
      url: "https://ycjang.cyso.co.kr/shop/item.php?it_id=1560839094",
      price: "15,000원"
    },
    {
      id: "1701745879",
      name: "[참들애영농조합법인] 국산 돼지고기 앞다리살 1kg",
      url: "https://ycjang.cyso.co.kr/shop/item.php?it_id=1701745879",
      price: "19,000원"
    }
  ]
};

// Save analysis to JSON file
const outputPath = path.join(__dirname, 'analysis-73.json');
fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2), 'utf-8');

console.log(`Analysis completed and saved to ${outputPath}`);