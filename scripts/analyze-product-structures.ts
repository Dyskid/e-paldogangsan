// Analysis results for both product pages

export const productAnalysis = {
  gmsocial: {
    url: "http://gmsocial.mangotree.co.kr/mall/goods/view.php?product_id=52",
    title: "담다 부드러운 쌀빵 쌀가루 디저트 단호박 홍국 모닝 오징어치즈먹물 소시지 주악 100g",
    structure: {
      pageLayout: {
        wrapper: "광명시사회적경제센터 - 사회적경제기업 제품·서비스",
        mainContainer: "product view page",
        sections: ["view_top", "view_con"]
      },
      productCard: {
        container: "view_top",
        imageSection: {
          class: "view_image", 
          imageUrl: "https://shop-phinf.pstatic.net/20211119_236/1637279776450PYeh6_JPEG/38415674958048097_710691607.jpg",
          altText: "우성레포츠"
        },
        infoSection: {
          class: "view_info",
          title: {
            class: "view_title",
            tag: "h2",
            text: "담다 부드러운 쌀빵 쌀가루 디저트 단호박 홍국 모닝 오징어치즈먹물 소시지 주악 100g"
          },
          priceSection: {
            class: "view_price_wrap",
            salesPercent: "sales_percent (empty)",
            price: {
              class: "view_price",
              defaultPrice: "2,000원",
              structure: '<span class="default_price"><strong>2,000</strong>원</span>'
            }
          },
          additionalInfo: {
            class: "view_infos",
            brand: {
              label: "브랜드",
              value: "협동조합 담다"
            },
            shipping: {
              label: "배송료", 
              value: "조건부 무료배송"
            },
            reviews: {
              label: "리뷰",
              rating: "0/5",
              count: "0건",
              structure: '<i class="fas fa-star product_star"></i>'
            }
          },
          actionSection: {
            class: "view_btn",
            purchaseLink: "https://smartstore.naver.com/damda615/products/6024199179",
            buttonText: "상품 구매하기",
            target: "_blank"
          }
        }
      },
      contentSection: {
        class: "view_con",
        detailPage: "detail_page",
        viewer: "se-viewer se-theme-default"
      }
    },
    vendor: "협동조합 담다",
    price: "2,000원",
    category: "식품/쌀빵",
    externalLink: "네이버 스마트스토어",
    features: [
      "사회적경제기업 제품",
      "광명시 지역 상품",
      "네이버 스마트스토어 연동"
    ]
  },
  
  gangneung: {
    url: "https://gangneung-mall.com/goods/view?no=41648", 
    title: "강릉무진장한과 실속세트 과줄강정반반 중",
    structure: {
      vendor: {
        company: "농업회사법인 주식회사 무진장",
        location: "강원도 강릉시 사천면 해살이길 40-1 1층"
      },
      product: {
        name: "강릉무진장한과 실속세트 과줄강정반반 중",
        weight: "1300g",
        origin: "국내산 (찹쌀, 맵쌀, 백련초가루 등)",
        nutrition: "453.7 kcal per 100g"
      },
      pricing: {
        originalPrice: "50,000₩",
        salePrice: "40,000₩", 
        discount: "20%",
        discountAmount: "10,000₩"
      },
      shipping: {
        fee: "3,000₩",
        freeThreshold: "30,000₩ 이상 무료배송",
        method: "직접배송"
      },
      images: {
        count: 3,
        types: ["상품 이미지", "상세 이미지", "썸네일"],
        description: "한과 선물세트 이미지"
      },
      features: [
        "전통 한과",
        "강릉 지역 특산품", 
        "할부 결제 가능",
        "다양한 결제 수단",
        "선물용 포장"
      ]
    },
    category: "전통식품/한과",
    region: "강원도 강릉시",
    type: "지역특산품 선물세트"
  }
};

console.log('📋 Product Structure Analysis Complete');
console.log('🏪 GMSocial (광명가치몰):', productAnalysis.gmsocial.title);
console.log('🏪 Gangneung Mall:', productAnalysis.gangneung.title);