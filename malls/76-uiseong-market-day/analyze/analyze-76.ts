interface MallInfo {
  platform: 'CYSO' | 'CAFE24' | 'OTHER';
  homepage: string;
  categoryPattern: string;
  productPattern: string;
  sampleCategories: Array<{
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
  dataLocation: {
    categoryList: string;
    productName: string;
    productPrice: string;
    productImage: string;
  };
  javascriptRequired: boolean;
}

const mallInfo: MallInfo = {
  platform: 'CYSO',
  homepage: 'https://esmall.cyso.co.kr',
  categoryPattern: 'https://esmall.cyso.co.kr/shop/list.php?ca_id={categoryId}',
  productPattern: 'https://esmall.cyso.co.kr/shop/item.php?it_id={productId}',
  sampleCategories: [
    {
      id: 'es10',
      name: '쌀/잡곡',
      url: 'https://esmall.cyso.co.kr/shop/list.php?ca_id=es10'
    },
    {
      id: 'es20',
      name: '과일류',
      url: 'https://esmall.cyso.co.kr/shop/list.php?ca_id=es20'
    },
    {
      id: 'es30',
      name: '의성마늘',
      url: 'https://esmall.cyso.co.kr/shop/list.php?ca_id=es30'
    },
    {
      id: 'es90',
      name: '가공식품',
      url: 'https://esmall.cyso.co.kr/shop/list.php?ca_id=es90'
    },
    {
      id: 'es40',
      name: '채소류',
      url: 'https://esmall.cyso.co.kr/shop/list.php?ca_id=es40'
    },
    {
      id: 'es50',
      name: '김치/장류/양념류',
      url: 'https://esmall.cyso.co.kr/shop/list.php?ca_id=es50'
    },
    {
      id: 'es80',
      name: '한과/떡/빵 류',
      url: 'https://esmall.cyso.co.kr/shop/list.php?ca_id=es80'
    },
    {
      id: 'es70',
      name: '축산물',
      url: 'https://esmall.cyso.co.kr/shop/list.php?ca_id=es70'
    },
    {
      id: 'esa0',
      name: '로컬푸드',
      url: 'https://esmall.cyso.co.kr/shop/list.php?ca_id=esa0'
    }
  ],
  sampleProducts: [
    {
      id: '1751250822',
      name: '[의성복숭아나라] 햇살어린 말랑이 알찬 백도복숭아 3kg 9과~13과',
      url: 'https://esmall.cyso.co.kr/shop/item.php?it_id=1751250822',
      price: '22,080원'
    },
    {
      id: '1751250811',
      name: '[의성복숭아나라] 햇살어린 말랑이 알찬 백도복숭아 3kg 14과~17과',
      url: 'https://esmall.cyso.co.kr/shop/item.php?it_id=1751250811',
      price: '18,630원'
    },
    {
      id: '1751125819',
      name: '[샘골도담] 임신선물 유미 복숭아 2.5kg 대과',
      url: 'https://esmall.cyso.co.kr/shop/item.php?it_id=1751125819',
      price: '28,400원'
    },
    {
      id: '1690724482',
      name: '의성장날 베스트상품',
      url: 'https://esmall.cyso.co.kr/shop/item.php?it_id=1690724482',
      price: '13,300원'
    },
    {
      id: '512907',
      name: '의성장날 추천상품',
      url: 'https://esmall.cyso.co.kr/shop/item.php?it_id=512907'
    }
  ],
  dataLocation: {
    categoryList: '.gnb_al_li',
    productName: '.sct_txt',
    productPrice: '.sct_cost',
    productImage: '.sct_img img'
  },
  javascriptRequired: true
};

export default mallInfo;