interface MallAnalysis {
  mallId: string
  platform: 'cyso'
  homepage: string
  categoryStructure: 'hierarchical'
  urlPatterns: {
    products: RegExp
    categories: RegExp
  }
  selectors: {
    categoryId: string
    categoryName: string
    productId: string
    productName: string
    productPrice: string
    productImage: string
    productUrl: string
  }
  sampleCategories: Array<{
    id: string
    name: string
    url: string
  }>
  sampleProducts: Array<{
    id: string
    name: string
    url: string
    price: string
  }>
  requiresJavaScript: boolean
  dataLocation: 'html'
}

const analysis: MallAnalysis = {
  mallId: 'yeongdeok-market',
  platform: 'cyso',
  homepage: 'https://ydmall.cyso.co.kr',
  categoryStructure: 'hierarchical',
  urlPatterns: {
    products: /\/shop\/item\.php\?it_id=(\d+)/,
    categories: /\/shop\/list\.php\?ca_id=([a-zA-Z0-9]+)/
  },
  selectors: {
    categoryId: 'ca_id parameter in URL',
    categoryName: '.gnb_al_a text',
    productId: 'it_id parameter in URL',
    productName: '.sct_txt a text',
    productPrice: '.sct_cost text',
    productImage: '.sct_img img src',
    productUrl: '.sct_txt a href or .sct_img a href'
  },
  sampleCategories: [
    {
      id: 'yd10',
      name: '쌀/잡곡',
      url: 'https://ydmall.cyso.co.kr/shop/list.php?ca_id=yd10'
    },
    {
      id: 'yd1010',
      name: '쌀',
      url: 'https://ydmall.cyso.co.kr/shop/list.php?ca_id=yd1010'
    },
    {
      id: 'yd20',
      name: '과일류',
      url: 'https://ydmall.cyso.co.kr/shop/list.php?ca_id=yd20'
    },
    {
      id: 'yd2010',
      name: '과일',
      url: 'https://ydmall.cyso.co.kr/shop/list.php?ca_id=yd2010'
    },
    {
      id: 'yd30',
      name: '채소류',
      url: 'https://ydmall.cyso.co.kr/shop/list.php?ca_id=yd30'
    },
    {
      id: 'yd40',
      name: '축산물',
      url: 'https://ydmall.cyso.co.kr/shop/list.php?ca_id=yd40'
    },
    {
      id: 'yd80',
      name: '선물세트',
      url: 'https://ydmall.cyso.co.kr/shop/list.php?ca_id=yd80'
    }
  ],
  sampleProducts: [
    {
      id: '1599026122',
      name: '[더동쪽 바다가는길] 홍영의 어간장 선물세트 1호',
      url: 'https://ydmall.cyso.co.kr/shop/item.php?it_id=1599026122',
      price: '22,000원'
    },
    {
      id: '1570784479',
      name: '[영어농조합법인]영덕게 한가득 세트',
      url: 'https://ydmall.cyso.co.kr/shop/item.php?it_id=1570784479',
      price: '45,000원'
    },
    {
      id: '1719537131',
      name: '[대부호] 산모미역 영덕 청정 돌미역 400g 해심 영덕사진마을 채취',
      url: 'https://ydmall.cyso.co.kr/shop/item.php?it_id=1719537131',
      price: '45,000원'
    },
    {
      id: '1588812496',
      name: '[동양미곡처리장] 해풍미 20kg (2024년산)',
      url: 'https://ydmall.cyso.co.kr/shop/item.php?it_id=1588812496',
      price: '57,900원'
    },
    {
      id: '1599023298',
      name: '[더동쪽 바다가는길] 홍영의 붉은대게백간장',
      url: 'https://ydmall.cyso.co.kr/shop/item.php?it_id=1599023298',
      price: '12,000원'
    },
    {
      id: '1570784477',
      name: '영덕 게간장 500ml',
      url: 'https://ydmall.cyso.co.kr/shop/item.php?it_id=1570784477',
      price: '8,000원'
    }
  ],
  requiresJavaScript: false,
  dataLocation: 'html'
}

export default analysis