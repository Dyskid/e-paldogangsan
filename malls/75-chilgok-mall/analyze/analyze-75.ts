interface MallAnalysis {
  mallId: number;
  platform: 'CYSO' | 'Cafe24' | 'MakeShop' | 'Unknown';
  homepage: string;
  productUrlPattern: string;
  categoryUrlPattern: string;
  sampleCategories: Array<{
    id: string;
    name: string;
    url: string;
  }>;
  sampleProducts: Array<{
    id: string;
    name: string;
    url: string;
    price: string | null;
  }>;
  dataLocation: {
    productList: string;
    productName: string;
    productPrice: string;
    productImage: string;
    productLink: string;
  };
  requiresJavaScript: boolean;
}

const analysis: MallAnalysis = {
  mallId: 75,
  platform: 'CYSO',
  homepage: 'https://cgmall.cyso.co.kr',
  productUrlPattern: 'https://cgmall.cyso.co.kr/shop/item.php?it_id={productId}',
  categoryUrlPattern: 'https://cgmall.cyso.co.kr/shop/list.php?ca_id={categoryId}',
  sampleCategories: [
    {
      id: 'cg10',
      name: '쌀/잡곡',
      url: 'https://cgmall.cyso.co.kr/shop/list.php?ca_id=cg10'
    },
    {
      id: 'cg1010',
      name: '쌀',
      url: 'https://cgmall.cyso.co.kr/shop/list.php?ca_id=cg1010'
    },
    {
      id: 'cg1020',
      name: '기타잡곡',
      url: 'https://cgmall.cyso.co.kr/shop/list.php?ca_id=cg1020'
    },
    {
      id: 'cg20',
      name: '과일류',
      url: 'https://cgmall.cyso.co.kr/shop/list.php?ca_id=cg20'
    },
    {
      id: 'cg2010',
      name: '과일',
      url: 'https://cgmall.cyso.co.kr/shop/list.php?ca_id=cg2010'
    },
    {
      id: 'cg30',
      name: '채소류',
      url: 'https://cgmall.cyso.co.kr/shop/list.php?ca_id=cg30'
    },
    {
      id: 'cg3010',
      name: '채소',
      url: 'https://cgmall.cyso.co.kr/shop/list.php?ca_id=cg3010'
    },
    {
      id: 'cg40',
      name: '축산물',
      url: 'https://cgmall.cyso.co.kr/shop/list.php?ca_id=cg40'
    },
    {
      id: 'cg4010',
      name: '한우',
      url: 'https://cgmall.cyso.co.kr/shop/list.php?ca_id=cg4010'
    },
    {
      id: 'cg60',
      name: '꿀/홍삼',
      url: 'https://cgmall.cyso.co.kr/shop/list.php?ca_id=cg60'
    },
    {
      id: 'cg70',
      name: '가공식품',
      url: 'https://cgmall.cyso.co.kr/shop/list.php?ca_id=cg70'
    },
    {
      id: 'cg80',
      name: '김치/장류/참기름',
      url: 'https://cgmall.cyso.co.kr/shop/list.php?ca_id=cg80'
    },
    {
      id: 'cg90',
      name: '한과/떡/빵류',
      url: 'https://cgmall.cyso.co.kr/shop/list.php?ca_id=cg90'
    },
    {
      id: 'cga0',
      name: '전통주류/와인',
      url: 'https://cgmall.cyso.co.kr/shop/list.php?ca_id=cga0'
    },
    {
      id: 'cgb0',
      name: '특산물',
      url: 'https://cgmall.cyso.co.kr/shop/list.php?ca_id=cgb0'
    }
  ],
  sampleProducts: [
    {
      id: '1647325366',
      name: '[기산마을] 칠곡 기산참외5kg(특)(14~24과)',
      url: 'https://cgmall.cyso.co.kr/shop/item.php?it_id=1647325366',
      price: '37,000원'
    },
    {
      id: '1623751903',
      name: '[피플앤팜] 후무사 자두3kg특(100~119g) 과즙팡팡 달콤한 포모사 맛있는자두',
      url: 'https://cgmall.cyso.co.kr/shop/item.php?it_id=1623751903',
      price: '40,000원'
    },
    {
      id: '1644807378',
      name: '[칠칠곡곡협동조합]칠칠곡곡 바로한끼 밥나물',
      url: 'https://cgmall.cyso.co.kr/shop/item.php?it_id=1644807378',
      price: '6,000원'
    },
    {
      id: '1729501904',
      name: '[기산마을] 생표고버섯 1kg 가정용',
      url: 'https://cgmall.cyso.co.kr/shop/item.php?it_id=1729501904',
      price: '22,000원'
    },
    {
      id: '1647477569',
      name: '[행복표고농원] 생표고버섯 1kg',
      url: 'https://cgmall.cyso.co.kr/shop/item.php?it_id=1647477569',
      price: '30,000원'
    },
    {
      id: '1673412483',
      name: '[칠곡양돈]직접키운 무항생제 돈삼겹살 캠핑용 500g',
      url: 'https://cgmall.cyso.co.kr/shop/item.php?it_id=1673412483',
      price: '19,000원'
    },
    {
      id: '1607478386',
      name: '[한돈 다릿살] 맵깔고추장 불고기500g+단짠 간장불고기500g',
      url: 'https://cgmall.cyso.co.kr/shop/item.php?it_id=1607478386',
      price: '22,000원'
    },
    {
      id: '1622016512',
      name: '[ 농부플러스 ] 파인애플 식초 자연발효식초 수제식초 300ml',
      url: 'https://cgmall.cyso.co.kr/shop/item.php?it_id=1622016512',
      price: '12,300원'
    },
    {
      id: '1669258589',
      name: '[돌모리마을] 촌두부 (550g)',
      url: 'https://cgmall.cyso.co.kr/shop/item.php?it_id=1669258589',
      price: '5,000원'
    },
    {
      id: '1746598260',
      name: '[칠곡양돈]무항생제 한우 선물세트 소한마리 1.8kg',
      url: 'https://cgmall.cyso.co.kr/shop/item.php?it_id=1746598260',
      price: null
    }
  ],
  dataLocation: {
    productList: '.sct.sct_30 .sct_li, .sct.sct_40 .sct_li',
    productName: '.sct_txt a',
    productPrice: '.sct_cost',
    productImage: '.sct_img img',
    productLink: '.sct_img > a'
  },
  requiresJavaScript: true
};

export default analysis;