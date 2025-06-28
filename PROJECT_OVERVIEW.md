# E-Paldogangsan Project Overview

## 📋 Table of Contents
1. [Project Introduction](#project-introduction)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Data Architecture](#data-architecture)
5. [Key Components](#key-components)
6. [API Endpoints](#api-endpoints)
7. [Pages and Routes](#pages-and-routes)
8. [Data Flow](#data-flow)
9. [Deployment](#deployment)
10. [Development Guide](#development-guide)

## 🎯 Project Introduction

**E-Paldogangsan (e-팔도강산)** is a comprehensive web portal that aggregates and showcases local government shopping malls across South Korea. The name "Paldogangsan" (팔도강산) refers to the eight provinces and beautiful mountains of Korea, representing the entire Korean peninsula.

### Purpose
- Centralize access to 100+ local government shopping malls
- Promote regional products and local economies
- Provide easy discovery of specialty products from all Korean regions
- Support local farmers, fishermen, and small businesses

### Key Features
- Interactive map of South Korea for region-based browsing
- Comprehensive product search across all malls
- Category-based filtering (agricultural, seafood, processed foods, etc.)
- Direct links to original shopping mall products
- Mobile-responsive design

## 🛠 Technology Stack

### Frontend
- **Next.js 14.2.3** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Fuse.js** - Client-side fuzzy search

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **File-based data storage** - JSON files for data persistence

### Development Tools
- **ESLint** - Code linting
- **Node.js** - Runtime environment
- **npm** - Package management

### Deployment
- **Vercel** - Hosting and deployment platform

## 📁 Project Structure

```
backup/
  ├── categories.txt
  ├── claude command for phase1.txt
  ├── e-Paldogangsan Phase 1 MVP Specific.txt
  ├── mergedmalls.txt
  ├── Project Title e-Paldogangsan South.txt
  ├── scrapercommand.txt
public/
  ├── logos/
  │   ├── mall_10_착착착.png
  │   ├── mall_100_이제주몰.png
  │   ├── mall_11_오산함께장터.png
  │   ├── mall_12_광명가치몰.png
  │   ├── mall_13_양주농부마켓.png
  │   ├── mall_14_마켓경기.png
  │   ├── mall_15_강원더몰.png
  │   ├── mall_16_원주몰.png
  │   ├── mall_17_강릉몰.png
  │   ├── mall_18_고성몰.png
  │   ├── mall_19_동해몰.png
  │   ├── mall_20_삼척몰.png
  │   ├── mall_21_양구몰.png
  │   ├── mall_22_양양몰.png
  │   ├── mall_23_영월몰.png
  │   ├── mall_24_인제몰.png
  │   ├── mall_25_철원몰.png
  │   ├── mall_26_정선몰.png
  │   ├── mall_27_태백몰.png
  │   ├── mall_28_횡성몰.png
  │   ├── mall_29_춘천몰.png
  │   ├── mall_3_우리몰.png
  │   ├── mall_30_홍천몰.png
  │   ├── mall_31_평창몰.png
  │   ├── mall_32_제천로컬푸드.png
  │   ├── mall_33_음성장터.png
  │   ├── mall_34_진천몰.png
  │   ├── mall_35_괴산장터.png
  │   ├── mall_36_농사랑.png
  │   ├── mall_37_당진팜.png
  │   ├── mall_38_e홍성장터.png
  │   ├── mall_39_서산뜨레.png
  │   ├── mall_4_참달성_달성군_.png
  │   ├── mall_40_부안_텃밭할매.png
  │   ├── mall_41_단풍미인_정읍_.png
  │   ├── mall_42_지평선몰_김제_.png
  │   ├── mall_43_전북생생장터.png
  │   ├── mall_44_익산몰.png
  │   ├── mall_45_진안고원몰.png
  │   ├── mall_46_장수몰.png
  │   ├── mall_47_고창마켓.png
  │   ├── mall_48_임실몰.png
  │   ├── mall_49_순창로컬푸드쇼핑몰.png
  │   ├── mall_5_인천e몰.png
  │   ├── mall_50_해가람.png
  │   ├── mall_51_남도장터.png
  │   ├── mall_52_여수몰.png
  │   ├── mall_53_해피굿팜.png
  │   ├── mall_54_보성몰.png
  │   ├── mall_55_나주몰.png
  │   ├── mall_56_순천로컬푸드함께가게.png
  │   ├── mall_57_신안1004몰.png
  │   ├── mall_58_장흥몰_산들해랑장흥몰_.png
  │   ├── mall_59_기찬들영암몰.png
  │   ├── mall_6_광주김치몰.png
  │   ├── mall_60_진도아리랑몰.png
  │   ├── mall_61_완도군이숍.png
  │   ├── mall_62_함평천지몰.png
  │   ├── mall_63_해남미소.png
  │   ├── mall_64_담양장터.png
  │   ├── mall_65_초록믿음_강진_.png
  │   ├── mall_66_화순팜.png
  │   ├── mall_67_곡성몰_곡성군농특산물중개몰_.png
  │   ├── mall_68_사이소_경북몰_.png
  │   ├── mall_69_상주_명실상주몰.png
  │   ├── mall_7_대전사랑몰.png
  │   ├── mall_70_청도_청리브.png
  │   ├── mall_71_영주장날.png
  │   ├── mall_72_안동장터.png
  │   ├── mall_73_청송몰.png
  │   ├── mall_74_영양온심마켓.png
  │   ├── mall_75_울릉도.png
  │   ├── mall_76_봉화장터.png
  │   ├── mall_77_고령몰.png
  │   ├── mall_78_김천노다지장터.png
  │   ├── mall_79_예천장터.png
  │   ├── mall_8_울산몰.png
  │   ├── mall_80_문경_새제의아침.png
  │   ├── mall_81_칠곡몰.png
  │   ├── mall_82_의성장날.png
  │   ├── mall_83_울진몰.png
  │   ├── mall_84_영덕장터.png
  │   ├── mall_85_경산몰.png
  │   ├── mall_86_경주몰.png
  │   ├── mall_87_구미팜.png
  │   ├── mall_88_별빛촌장터_영천_.png
  │   ├── mall_89_포항마켓.png
  │   ├── mall_9_세종로컬푸드.png
  │   ├── mall_90_e경남몰.png
  │   ├── mall_91_토요애_의령_.png
  │   ├── mall_92_남해몰.png
  │   ├── mall_93_산엔청_산청_.png
  │   ├── mall_94_공룡나라_고성_.png
  │   ├── mall_95_함양몰.png
  │   ├── mall_96_진주드림.png
  │   ├── mall_97_함안몰.png
  │   ├── mall_98_김해온몰.png
scripts/
  ├── dist/
  │   ├── scripts/
  │   │   ├── fix-chamds-images-fallback.js
  │   │   ├── fix-chamds-images-real.js
  │   │   ├── fix-chamds-images.js
  │   │   ├── register-chamds-food-products.js
  │   │   ├── register-kkimchi-food-products.js
  │   │   ├── register-wemall-food-products.js
  │   │   ├── scrape-wemall-food-final.js
  │   │   ├── verify-chamds-food-registration.js
  │   │   ├── verify-kkimchi-food-registration.js
  │   │   ├── verify-wemall-food-registration.js
  │   ├── src/
  │   │   ├── types/
  │   │   │   ├── index.js
  │   ├── scrape-chamds-comprehensive.js
  │   ├── scrape-kkimchi-comprehensive.js
  │   ├── scrape-wemall-food-comprehensive.js
  │   ├── scrape-wemall-food-final.js
  │   ├── test-wemall-food-category.js
  ├── output/
  │   ├── batch-scrape/
  │   │   ├── batch-registration-summary.json
  │   │   ├── batch-scrape-summary.json
  │   │   ├── dangjin-farm-products.json
  │   │   ├── danpoong-mall-products.json
  │   │   ├── hampyeong-cheonji-products.json
  │   │   ├── hamyang-mall-products.json
  │   ├── debug/
  │   │   ├── ejeju-cat26-page1.html
  │   │   ├── ejeju-cat27-page1.html
  │   │   ├── ejeju-cat28-page1.html
  │   │   ├── ejeju-cat29-page1.html
  │   │   ├── ejeju-cat30-page1.html
  │   │   ├── ejeju-cat31-page1.html
  │   │   ├── ejeju-cat31008-page1.html
  │   │   ├── ejeju-cat32-page1.html
  │   │   ├── ontongdaejeon-product-1750420391361.html
  │   │   ├── ontongdaejeon-product-1750420393867.html
  │   │   ├── ontongdaejeon-product-1750420396332.html
  │   │   ├── ontongdaejeon-product-1750420399656.html
  │   │   ├── ontongdaejeon-product-1750420402178.html
  │   ├── retry-scrape/
  │   │   ├── jps-mall-products.json
  │   │   ├── retry-registration-summary.json
  │   │   ├── retry-scrape-summary.json
  │   ├── all-malls-analysis.json
  │   ├── all-malls-products.json
  │   ├── bmall-analysis.json
  │   ├── bmall-homepage.html
  │   ├── bmall-products.json
  │   ├── bmall-registration-summary.json
  │   ├── bmall-scrape-summary.json
  │   ├── bmall-verification-report.json
  │   ├── boseong-homepage.html
  │   ├── boseong-product-list.html
  │   ├── boseong-product-sample.html
  │   ├── boseong-product-test-results.json
  │   ├── boseong-products.json
  │   ├── boseong-registration-summary.json
  │   ├── boseong-scrape-summary.json
  │   ├── boseong-structure-analysis.json
  │   ├── boseong-verification-report.json
  │   ├── buan-category-sample.html
  │   ├── buan-homepage.html
  │   ├── buan-product-sample.html
  │   ├── buan-products.json
  │   ├── buan-registration-summary.json
  │   ├── buan-scrape-summary.json
  │   ├── buan-structure-analysis.json
  │   ├── buan-verification-report.json
  │   ├── category-cleanup-report.json
  │   ├── category-products-analysis.json
  │   ├── cdmall-analysis.json
  │   ├── cdmall-homepage.html
  │   ├── cdmall-product-sample.html
  │   ├── cdmall-products.json
  │   ├── cdmall-registration-summary.json
  │   ├── cdmall-scrape-summary.json
  │   ├── cdmall-test-product.html
  │   ├── cdmall-verification-report.json
  │   ├── cgmall-analysis.json
  │   ├── cgmall-homepage.html
  │   ├── cgmall-products.json
  │   ├── cgmall-registration-summary.json
  │   ├── cgmall-scrape-summary.json
  │   ├── cgmall-verification-report.json
  │   ├── chack3-homepage.html
  │   ├── chack3-mall-suggestion.json
  │   ├── chack3-products.json
  │   ├── chack3-registration-summary.json
  │   ├── chack3-scrape-summary.json
  │   ├── chack3-structure-analysis.json
  │   ├── chack3-verification-report.json
  │   ├── chamdalseong-analysis-final.json
  │   ├── chamds-analysis-final.json
  │   ├── chamds-analysis.json
  │   ├── chamds-detailed-analysis.json
  │   ├── chamds-food-registration-summary.json
  │   ├── chamds-food-verification-final.json
  │   ├── chamds-homepage.html
  │   ├── chamds-image-fallback-summary.json
  │   ├── chamds-image-fix-summary.json
  │   ├── chamds-image-real-fix-summary.json
  │   ├── chamds-main-analysis.html
  │   ├── chamds-page-_product_list_html.html
  │   ├── chamds-products-_product_list.html.html
  │   ├── chamds-products.json
  │   ├── chamds-registration-summary.json
  │   ├── chamds-scrape-summary.json
  │   ├── chamds-structure-analysis.json
  │   ├── chamds-verification-report.json
  │   ├── cheorwon-analysis.json
  │   ├── cheorwon-homepage.html
  │   ├── cheorwon-products.json
  │   ├── cheorwon-registration-summary.json
  │   ├── cheorwon-scrape-summary.json
  │   ├── cheorwon-verification-report.json
  │   ├── chuncheon-analysis.json
  │   ├── chuncheon-homepage.html
  │   ├── chuncheon-products.json
  │   ├── chuncheon-registration-summary.json
  │   ├── chuncheon-scrape-summary.json
  │   ├── chuncheon-verification-report.json
  │   ├── csmall-analysis.json
  │   ├── csmall-homepage.html
  │   ├── csmall-product-sample.html
  │   ├── csmall-products.json
  │   ├── csmall-registration-summary.json
  │   ├── csmall-scrape-summary.json
  │   ├── csmall-verification-report.json
  │   ├── cyso-homepage.html
  │   ├── cyso-products.json
  │   ├── cyso-registration-summary.json
  │   ├── cyso-scrape-summary.json
  │   ├── cyso-structure-analysis.json
  │   ├── cyso-verification-report.json
  │   ├── damyang-category-sample.html
  │   ├── damyang-homepage.html
  │   ├── damyang-products.json
  │   ├── damyang-registration-summary.json
  │   ├── damyang-scrape-summary.json
  │   ├── damyang-structure-analysis.json
  │   ├── damyang-verification-report.json
  │   ├── dangjinfarm-analysis.json
  │   ├── dangjinfarm-homepage.html
  │   ├── dangjinfarm-product-sample.html
  │   ├── dangjinfarm-products.json
  │   ├── dangjinfarm-registration-summary.json
  │   ├── dangjinfarm-scrape-summary.json
  │   ├── dangjinfarm-verification-report.json
  │   ├── danpoong-category-sample.html
  │   ├── danpoong-homepage.html
  │   ├── danpoong-products.json
  │   ├── danpoong-registration-summary.json
  │   ├── danpoong-scrape-summary.json
  │   ├── danpoong-structure-analysis.json
  │   ├── danpoong-verification-report.json
  │   ├── donghae-analysis.json
  │   ├── donghae-homepage.html
  │   ├── donghae-product-1.html
  │   ├── donghae-product-sample.html
  │   ├── donghae-products.json
  │   ├── donghae-registration-summary.json
  │   ├── donghae-scrape-summary.json
  │   ├── donghae-verification-report.json
  │   ├── ehongseong-analysis.json
  │   ├── ehongseong-homepage.html
  │   ├── ehongseong-product-sample.html
  │   ├── ehongseong-products.json
  │   ├── ehongseong-registration-summary.json
  │   ├── ehongseong-scrape-summary.json
  │   ├── ehongseong-verification-report.json
  │   ├── ejeju-mall-products-comprehensive.json
  │   ├── ejeju-mall-products.json
  │   ├── ejeju-mall-summary-comprehensive.json
  │   ├── ejeju-mall-summary.json
  │   ├── ejeju-registration-summary.json
  │   ├── ejeju-test-page.html
  │   ├── ejeju-verification-report.json
  │   ├── esjang-category.html
  │   ├── esjang-homepage.html
  │   ├── esjang-product-ids.txt
  │   ├── esjang-product-sample.html
  │   ├── esjang-product-test-results.json
  │   ├── esjang-products.json
  │   ├── esjang-registration-summary.json
  │   ├── esjang-scrape-summary.json
  │   ├── esjang-test.html
  │   ├── esjang-verification-report.json
  │   ├── freshjb-api--api-categories.json
  │   ├── freshjb-api--api-category-list.json
  │   ├── freshjb-api--api-goods.json
  │   ├── freshjb-api--api-items.json
  │   ├── freshjb-api--api-product-list.json
  │   ├── freshjb-api--api-products.json
  │   ├── freshjb-api--category-list.json
  │   ├── freshjb-api--exec-front-Category-ApiCategoryList.json
  │   ├── freshjb-api--exec-front-Product-ApiProductList.json
  │   ├── freshjb-api--product-list.json
  │   ├── freshjb-api--shop-categories.json
  │   ├── freshjb-api--shop-products.json
  │   ├── freshjb-homepage.html
  │   ├── freshjb-page--categories.html
  │   ├── freshjb-page--category.html
  │   ├── freshjb-page--goods-list.html
  │   ├── freshjb-page--goods.html
  │   ├── freshjb-page--list.html
  │   ├── freshjb-page--product-list.html
  │   ├── freshjb-page--product.html
  │   ├── freshjb-page--products.html
  │   ├── freshjb-page--shop-list.html
  │   ├── freshjb-page--shop.html
  │   ├── freshjb-products.json
  │   ├── freshjb-registration-summary.json
  │   ├── freshjb-robots.txt
  │   ├── freshjb-scrape-summary.json
  │   ├── freshjb-sitemap.xml
  │   ├── freshjb-structure-analysis.json
  │   ├── freshjb-verification-report.json
  │   ├── gangneung-analysis.json
  │   ├── gangneung-homepage.html
  │   ├── gangneung-product-1.html
  │   ├── gangneung-product-sample.html
  │   ├── gangneung-products.json
  │   ├── gangneung-registration-summary.json
  │   ├── gangneung-scrape-summary.json
  │   ├── gangneung-verification-report.json
  │   ├── gimhaemall-page.html
  │   ├── gimhaemall-real-products.json
  │   ├── gmsocial-all-products.json
  │   ├── gmsocial-analysis.json
  │   ├── gmsocial-category-scrape-summary.json
  │   ├── gmsocial-complete-summary.json
  │   ├── gmsocial-direct-scraped.json
  │   ├── gmsocial-direct-summary.json
  │   ├── gmsocial-extracted-products.json
  │   ├── gmsocial-food-category.html
  │   ├── gmsocial-homepage.html
  │   ├── gmsocial-product-sample.html
  │   ├── gmsocial-products-complete.json
  │   ├── gmsocial-registered-products.json
  │   ├── gmsocial-registration-summary-final.json
  │   ├── gmsocial-registration-summary.json
  │   ├── gmsocial-scraped-products.json
  │   ├── gmsocial-test-food-category.html
  │   ├── gmsocial-url-fix-summary.json
  │   ├── gmsocial-verification-final.json
  │   ├── gmsocial-verification-report.json
  │   ├── gochang-categories-analysis.json
  │   ├── gochang-homepage.html
  │   ├── gochang-product-sample.html
  │   ├── gochang-products.json
  │   ├── gochang-registration-summary.json
  │   ├── gochang-scrape-errors.txt
  │   ├── gochang-scrape-summary.json
  │   ├── gochang-structure-analysis.json
  │   ├── gochang-verification-report.json
  │   ├── goesan-analysis.json
  │   ├── goesan-homepage.html
  │   ├── goesan-product-sample.html
  │   ├── goesan-products.json
  │   ├── goesan-registration-summary.json
  │   ├── goesan-scrape-summary.json
  │   ├── goesan-verification-report.json
  │   ├── gokseongmall-homepage.html
  │   ├── gokseongmall-products.json
  │   ├── gokseongmall-registration-summary.json
  │   ├── gokseongmall-scrape-summary.json
  │   ├── gokseongmall-structure-analysis.json
  │   ├── gokseongmall-verification-report.json
  │   ├── goseong-analysis.json
  │   ├── goseong-homepage.html
  │   ├── goseong-product-1.html
  │   ├── goseong-product-sample.html
  │   ├── goseong-products.json
  │   ├── goseong-registration-summary.json
  │   ├── goseong-scrape-summary.json
  │   ├── goseong-verification-report.json
  │   ├── greengj-homepage.html
  │   ├── greengj-products.json
  │   ├── greengj-registration-summary.json
  │   ├── greengj-scrape-summary.json
  │   ├── greengj-structure-analysis.json
  │   ├── greengj-verification-report.json
  │   ├── gwdmall-analysis.json
  │   ├── gwdmall-homepage-content.html
  │   ├── gwdmall-homepage.html
  │   ├── gwdmall-products.json
  │   ├── gwdmall-registration-summary.json
  │   ├── gwdmall-scrape-summary.json
  │   ├── gwdmall-test-category.html
  │   ├── gwdmall-test-product.html
  │   ├── gwdmall-verification-report.json
  │   ├── gwdmall-working-products.json
  │   ├── gwdmall-working-summary.json
  │   ├── gwpc-analysis.json
  │   ├── gwpc-homepage.html
  │   ├── gwpc-product-sample.html
  │   ├── gwpc-product-test-results.json
  │   ├── gwpc-products.json
  │   ├── gwpc-registration-summary.json
  │   ├── gwpc-scrape-summary.json
  │   ├── gwpc-verification-report.json
  │   ├── haegaram-category-sample.html
  │   ├── haegaram-homepage.html
  │   ├── haegaram-product-sample.html
  │   ├── haegaram-products.json
  │   ├── haegaram-registration-summary.json
  │   ├── haegaram-scrape-summary.json
  │   ├── haegaram-scrape.log
  │   ├── haegaram-structure-analysis.json
  │   ├── haegaram-test-product.html
  │   ├── haegaram-verification-report.json
  │   ├── hampyeong-category-sample.html
  │   ├── hampyeong-homepage.html
  │   ├── hampyeong-products.json
  │   ├── hampyeong-registration-summary.json
  │   ├── hampyeong-scrape-summary.json
  │   ├── hampyeong-structure-analysis.json
  │   ├── hampyeong-verification-report.json
  │   ├── hoengseong-analysis.json
  │   ├── hoengseong-homepage.html
  │   ├── hoengseong-products.json
  │   ├── hoengseong-registration-summary.json
  │   ├── hoengseong-scrape-summary.json
  │   ├── hoengseong-verification-report.json
  │   ├── hongcheon-analysis.json
  │   ├── hongcheon-homepage.html
  │   ├── hongcheon-product-sample.html
  │   ├── hongcheon-product-test-results.json
  │   ├── hongcheon-products.json
  │   ├── hongcheon-registration-summary.json
  │   ├── hongcheon-scrape-summary.json
  │   ├── hongcheon-verification-report.json
  │   ├── hwasunfarm-homepage.html
  │   ├── hwasunfarm-products.json
  │   ├── hwasunfarm-registration-summary.json
  │   ├── hwasunfarm-scrape-summary.json
  │   ├── hwasunfarm-structure-analysis.json
  │   ├── hwasunfarm-verification-report.json
  │   ├── iksan-category-sample.html
  │   ├── iksan-category-test-results.json
  │   ├── iksan-homepage.html
  │   ├── iksan-products.json
  │   ├── iksan-registration-summary.json
  │   ├── iksan-scrape-summary.json
  │   ├── iksan-structure-analysis.json
  │   ├── iksan-verification-report.json
  │   ├── individual-products-verification-all-malls.json
  │   ├── inje--goods-catalog.html
  │   ├── inje--goods.html
  │   ├── inje-analysis.json
  │   ├── inje-homepage.html
  │   ├── inje-product-sample.html
  │   ├── inje-product-test.html
  │   ├── inje-products.json
  │   ├── inje-registration-summary.json
  │   ├── inje-scrape-summary.json
  │   ├── inje-verification-report.json
  │   ├── integration-summary.json
  │   ├── jangsu-category-exploration.json
  │   ├── jangsu-category-sample.html
  │   ├── jangsu-category-test-results.json
  │   ├── jangsu-homepage.html
  │   ├── jangsu-product-sample.html
  │   ├── jangsu-product-test.json
  │   ├── jangsu-products.json
  │   ├── jangsu-registration-summary.json
  │   ├── jangsu-scrape-summary.json
  │   ├── jangsu-structure-analysis.json
  │   ├── jangsu-verification-report.json
  │   ├── jcmall-analysis.json
  │   ├── jcmall-homepage.html
  │   ├── jcmall-product-sample.html
  │   ├── jcmall-products.json
  │   ├── jcmall-registration-summary.json
  │   ├── jcmall-scrape-summary.json
  │   ├── jcmall-verification-report.json
  │   ├── jeju-image-fallback-summary.json
  │   ├── jeju-image-fix-summary.json
  │   ├── jeju-listing-titles.json
  │   ├── jeju-mall-all-products.json
  │   ├── jeju-mall-analysis.json
  │   ├── jeju-mall-api-response.json
  │   ├── jeju-mall-final-products.json
  │   ├── jeju-mall-page.html
  │   ├── jeju-mall-products-ajax.json
  │   ├── jeju-mall-products-complete.json
  │   ├── jeju-mall-products-sample.json
  │   ├── jeju-mall-products-summary.json
  │   ├── jeju-mall-products.json
  │   ├── jeju-mall-real-products.json
  │   ├── jeju-mall-real-summary.json
  │   ├── jeju-mall-scrape-errors.txt
  │   ├── jeju-mall-scrape-summary-full.json
  │   ├── jeju-mall-scrape-summary.json
  │   ├── jeju-mall-summary.json
  │   ├── jeju-mall-urls.txt
  │   ├── jeju-price-fix-summary.json
  │   ├── jeju-products-removal-summary.json
  │   ├── jeju-real-images-summary.json
  │   ├── jeju-real-titles.json
  │   ├── jeju-title-update-report.json
  │   ├── jeongseon-analysis.json
  │   ├── jeongseon-homepage.html
  │   ├── jeongseon-products.json
  │   ├── jeongseon-registration-summary.json
  │   ├── jeongseon-scrape-summary.json
  │   ├── jeongseon-verification-report.json
  │   ├── jindoarirang-homepage.html
  │   ├── jindoarirang-products.json
  │   ├── jindoarirang-registration-summary.json
  │   ├── jindoarirang-scrape-summary.json
  │   ├── jindoarirang-structure-analysis.json
  │   ├── jindoarirang-verification-report.json
  │   ├── jnmall-category-sample.html
  │   ├── jnmall-homepage.html
  │   ├── jnmall-html-products.json
  │   ├── jnmall-products.json
  │   ├── jnmall-recommend-page.html
  │   ├── jnmall-registration-summary.json
  │   ├── jnmall-scrape-summary.json
  │   ├── jnmall-structure-analysis.json
  │   ├── jnmall-verification-report.json
  │   ├── kkimchi-analysis.json
  │   ├── kkimchi-category-_index.php_cate_004.html
  │   ├── kkimchi-category-_index.php_cate_004001.html
  │   ├── kkimchi-category-_index.php_cate_005.html
  │   ├── kkimchi-category-_index.php_cate_005001.html
  │   ├── kkimchi-category-_index.php_cate_005002.html
  │   ├── kkimchi-category-_index.php_cate_005003.html
  │   ├── kkimchi-category-_index.php_cate_006.html
  │   ├── kkimchi-comprehensive-report.json
  │   ├── kkimchi-food-registration-summary.json
  │   ├── kkimchi-food-verification-final.json
  │   ├── kkimchi-homepage.html
  │   ├── kkimchi-products.json
  │   ├── kkimchi-registration-summary.json
  │   ├── kkimchi-scrape-summary.json
  │   ├── kkimchi-verification-report.json
  │   ├── logo-download-summary.json
  │   ├── mgmall-analysis.json
  │   ├── mgmall-homepage.html
  │   ├── mgmall-products.json
  │   ├── mgmall-registration-summary.json
  │   ├── mgmall-scrape-summary.json
  │   ├── mgmall-verification-report.json
  │   ├── najumall-homepage.html
  │   ├── najumall-product-list.html
  │   ├── najumall-product-sample.html
  │   ├── najumall-product-test-results.json
  │   ├── najumall-products.json
  │   ├── najumall-registration-summary.json
  │   ├── najumall-scrape-summary.json
  │   ├── najumall-structure-analysis.json
  │   ├── najumall-verification-report.json
  │   ├── nongsarang-analysis.json
  │   ├── nongsarang-detailed-analysis.json
  │   ├── nongsarang-homepage-decoded.html
  │   ├── nongsarang-homepage.html
  │   ├── nongsarang-product-sample.html
  │   ├── nongsarang-products.json
  │   ├── nongsarang-registration-summary.json
  │   ├── nongsarang-scrape-summary.json
  │   ├── nongsarang-shop-exploration.json
  │   ├── nongsarang-shop-page.html
  │   ├── nongsarang-verification-report.json
  │   ├── okjmall-element-_item.html
  │   ├── okjmall-homepage-sample.html
  │   ├── okjmall-homepage.html
  │   ├── okjmall-products.json
  │   ├── okjmall-registration-summary.json
  │   ├── okjmall-scrape-summary.json
  │   ├── okjmall-structure-analysis.json
  │   ├── okjmall-test-page.html
  │   ├── okjmall-verification-report.json
  │   ├── onsim-analysis.json
  │   ├── onsim-homepage.html
  │   ├── onsim-product-sample.html
  │   ├── onsim-product-test.html
  │   ├── onsim-products.json
  │   ├── onsim-registration-summary.json
  │   ├── onsim-scrape-summary.json
  │   ├── onsim-verification-report.json
  │   ├── ontongdaejeon-analysis.json
  │   ├── ontongdaejeon-cleaning-verification-report.json
  │   ├── ontongdaejeon-detail-100416837.html
  │   ├── ontongdaejeon-enhanced-all-products.json
  │   ├── ontongdaejeon-enhanced-food-products.json
  │   ├── ontongdaejeon-enhanced-summary.json
  │   ├── ontongdaejeon-final-summary.json
  │   ├── ontongdaejeon-food-products-with-prices.json
  │   ├── ontongdaejeon-food-products.json
  │   ├── ontongdaejeon-food-registration-summary.json
  │   ├── ontongdaejeon-food-scrape-summary.json
  │   ├── ontongdaejeon-homepage.html
  │   ├── ontongdaejeon-main-analysis.html
  │   ├── ontongdaejeon-price-structure-analysis.json
  │   ├── ontongdaejeon-price-test-results.json
  │   ├── ontongdaejeon-price-test-summary.json
  │   ├── ontongdaejeon-product-ids.json
  │   ├── ontongdaejeon-products-with-prices.json
  │   ├── ontongdaejeon-products.json
  │   ├── ontongdaejeon-registration-summary.json
  │   ├── ontongdaejeon-scrape-summary.json
  │   ├── ontongdaejeon-verification-report.json
  │   ├── ontongdaejeon-with-prices-registration-summary.json
  │   ├── ontongdaejeon-with-prices-summary.json
  │   ├── osansemall-category-debug.html
  │   ├── osansemall-homepage.html
  │   ├── osansemall-main-analysis.json
  │   ├── osansemall-products.json
  │   ├── osansemall-registration-summary.json
  │   ├── osansemall-sample-product.html
  │   ├── osansemall-scrape-summary.json
  │   ├── osansemall-structure-analysis.json
  │   ├── osansemall-verification-report.json
  │   ├── problematic-mall-products.json
  │   ├── products-backup-1750327814345.json
  │   ├── products-backup-1750500297722.json
  │   ├── products-backup-1750501203131.json
  │   ├── products-backup-1750566302957.json
  │   ├── products-backup-1750566316946.json
  │   ├── products-backup-1750568100208.json
  │   ├── products-backup-1750900403527.json
  │   ├── products-without-prices.txt
  │   ├── samcheok-analysis.json
  │   ├── samcheok-homepage.html
  │   ├── samcheok-product-1.html
  │   ├── samcheok-product-sample.html
  │   ├── samcheok-products.json
  │   ├── samcheok-registration-summary.json
  │   ├── samcheok-scrape-summary.json
  │   ├── samcheok-verification-report.json
  │   ├── sclocal-category-page.html
  │   ├── sclocal-category-test-results.json
  │   ├── sclocal-homepage.html
  │   ├── sclocal-products.json
  │   ├── sclocal-registration-summary.json
  │   ├── sclocal-scrape-summary.json
  │   ├── sclocal-structure-analysis.json
  │   ├── sclocal-verification-report.json
  │   ├── seosanttre-homepage.html
  │   ├── seosanttre-product-sample.html
  │   ├── seosanttre-products.json
  │   ├── seosanttre-registration-summary.json
  │   ├── seosanttre-scrape-summary.json
  │   ├── seosanttre-structure-analysis.json
  │   ├── seosanttre-verification-report.json
  │   ├── shinan1004-category-sample.html
  │   ├── shinan1004-element-_xans_product_listmain__xans_record_.html
  │   ├── shinan1004-homepage-sample.html
  │   ├── shinan1004-homepage.html
  │   ├── shinan1004-products.json
  │   ├── shinan1004-registration-summary.json
  │   ├── shinan1004-scrape-summary.json
  │   ├── shinan1004-structure-analysis.json
  │   ├── shinan1004-verification-report.json
  │   ├── sjlocal-analysis-report.md
  │   ├── sjlocal-homepage.html
  │   ├── sjlocal-product-analysis.json
  │   ├── sjlocal-product-page.html
  │   ├── sjlocal-products.json
  │   ├── sjlocal-scrape-summary.json
  │   ├── sjlocal-simple-analysis.json
  │   ├── sjmall-homepage.html
  │   ├── sjmall-products.json
  │   ├── sjmall-registration-summary.json
  │   ├── sjmall-scrape-summary.json
  │   ├── sjmall-structure-analysis.json
  │   ├── sjmall-verification-report.json
  │   ├── taebaek-analysis.json
  │   ├── taebaek-homepage.html
  │   ├── taebaek-products.json
  │   ├── taebaek-registration-summary.json
  │   ├── taebaek-scrape-summary.json
  │   ├── taebaek-verification-report.json
  │   ├── ulmall-analysis.json
  │   ├── ulmall-homepage.html
  │   ├── ulmall-products.json
  │   ├── ulmall-registration-summary.json
  │   ├── ulmall-scrape-summary.json
  │   ├── ulmall-verification-report.json
  │   ├── unknown-mall-removal-summary.json
  │   ├── wandofood-homepage.html
  │   ├── wandofood-products.json
  │   ├── wandofood-registration-summary.json
  │   ├── wandofood-scrape-summary.json
  │   ├── wandofood-structure-analysis.json
  │   ├── wandofood-verification-report.json
  │   ├── wemall-analysis.json
  │   ├── wemall-category-001.html
  │   ├── wemall-category-010.html
  │   ├── wemall-final-summary.json
  │   ├── wemall-food-filter-summary.json
  │   ├── wemall-food-products-comprehensive.json
  │   ├── wemall-food-products-final.json
  │   ├── wemall-food-registration-summary.json
  │   ├── wemall-food-scrape-final-summary.json
  │   ├── wemall-food-scrape-summary.json
  │   ├── wemall-food-verification-final.json
  │   ├── wemall-food-verification-report.json
  │   ├── wemall-homepage.html
  │   ├── wemall-individual-products-verification.json
  │   ├── wemall-products.json
  │   ├── wemall-registration-summary.json
  │   ├── wemall-scrape-summary.json
  │   ├── wemall-verification-report.json
  │   ├── wonju-analysis.json
  │   ├── wonju-homepage.html
  │   ├── wonju-products.json
  │   ├── wonju-registration-summary.json
  │   ├── wonju-scrape-summary.json
  │   ├── wonju-test-category.html
  │   ├── wonju-test-product.html
  │   ├── wonju-verification-report.json
  │   ├── yanggu-analysis.json
  │   ├── yanggu-category-sample.html
  │   ├── yanggu-homepage.html
  │   ├── yanggu-product-sample.html
  │   ├── yanggu-product-urls.txt
  │   ├── yanggu-products.json
  │   ├── yanggu-registration-summary.json
  │   ├── yanggu-scrape-summary.json
  │   ├── yanggu-verification-report.json
  │   ├── yangju-analysis.json
  │   ├── yangju-careful-products.json
  │   ├── yangju-careful-summary.json
  │   ├── yangju-homepage-content.html
  │   ├── yangju-homepage.html
  │   ├── yangju-products.json
  │   ├── yangju-registration-summary.json
  │   ├── yangju-scrape-summary.json
  │   ├── yangju-verification-report.json
  │   ├── yangyang-analysis.json
  │   ├── yangyang-comprehensive-analysis.json
  │   ├── yangyang-final-product-urls.txt
  │   ├── yangyang-final-products.json
  │   ├── yangyang-final-scrape-summary.json
  │   ├── yangyang-homepage.html
  │   ├── yangyang-product-sample.html
  │   ├── yangyang-product-urls.txt
  │   ├── yangyang-products.json
  │   ├── yangyang-registration-error.json
  │   ├── yangyang-registration-summary.json
  │   ├── yangyang-scrape-summary.json
  │   ├── yangyang-test-product.html
  │   ├── yangyang-verification-report.json
  │   ├── ycjang-analysis.json
  │   ├── ycjang-homepage.html
  │   ├── ycjang-products.json
  │   ├── ycjang-registration-summary.json
  │   ├── ycjang-scrape-summary.json
  │   ├── ycjang-verification-report.json
  │   ├── yeongam-homepage.html
  │   ├── yeongam-products.json
  │   ├── yeongam-registration-summary.json
  │   ├── yeongam-scrape-summary.json
  │   ├── yeongam-structure-analysis.json
  │   ├── yeongam-verification-report.json
  │   ├── yeongwol--goods-catalog.html
  │   ├── yeongwol--goods.html
  │   ├── yeongwol-analysis.json
  │   ├── yeongwol-category-sample.html
  │   ├── yeongwol-homepage.html
  │   ├── yeongwol-product-sample.html
  │   ├── yeongwol-product-test.html
  │   ├── yeongwol-product-urls.txt
  │   ├── yeongwol-products.json
  │   ├── yeongwol-registration-summary.json
  │   ├── yeongwol-scrape-summary.json
  │   ├── yeongwol-verification-report.json
  │   ├── yeosumall-accessible-homepage.html
  │   ├── yeosumall-homepage.html
  │   ├── yeosumall-mock-products.json
  │   ├── yeosumall-mock-registration-summary.json
  │   ├── yeosumall-products-ready-for-registration.json
  │   ├── yeosumall-products.json
  │   ├── yeosumall-registration-summary.json
  │   ├── yeosumall-scrape-summary.json
  │   ├── yeosumall-structure-analysis.json
  │   ├── yeosumall-unavailable-report.json
  │   ├── yeosumall-verification-report.json
  │   ├── yjmarket-analysis.json
  │   ├── yjmarket-homepage.html
  │   ├── yjmarket-product-sample.html
  │   ├── yjmarket-products.json
  │   ├── yjmarket-registration-summary.json
  │   ├── yjmarket-scrape-summary.json
  │   ├── yjmarket-verification-report.json
  ├── analyze-all-malls.ts
  ├── analyze-bmall-structure.ts
  ├── analyze-boseong-structure.ts
  ├── analyze-buan-structure.ts
  ├── analyze-cdmall-structure.ts
  ├── analyze-cgmall-structure.ts
  ├── analyze-chack3-structure.ts
  ├── analyze-chamdalseong-smartstore.ts
  ├── analyze-chamds-detailed.ts
  ├── analyze-chamds-homepage.ts
  ├── analyze-chamds-structure.ts
  ├── analyze-cheorwon-structure.ts
  ├── analyze-chuncheon-structure.ts
  ├── analyze-csmall-structure.ts
  ├── analyze-cyso-structure.ts
  ├── analyze-damyang-structure.ts
  ├── analyze-dangjinfarm-structure.ts
  ├── analyze-danpoong-structure.ts
  ├── analyze-donghae-structure.ts
  ├── analyze-ehongseong-structure.ts
  ├── analyze-ejeju-mall-structure.ts
  ├── analyze-esjang-structure.ts
  ├── analyze-freshjb-structure.ts
  ├── analyze-gangneung-structure.ts
  ├── analyze-gimhaemall-structure.ts
  ├── analyze-gmsocial-live.ts
  ├── analyze-gmsocial-structure.ts
  ├── analyze-gochang-structure.ts
  ├── analyze-goesan-structure.ts
  ├── analyze-gokseongmall-structure.ts
  ├── analyze-goseong-structure.ts
  ├── analyze-greengj-structure.ts
  ├── analyze-gwdmall-structure.ts
  ├── analyze-gwpc-structure.ts
  ├── analyze-haegaram-structure.ts
  ├── analyze-hampyeong-structure.ts
  ├── analyze-hoengseong-structure.ts
  ├── analyze-hongcheon-structure.ts
  ├── analyze-hwasunfarm-structure.ts
  ├── analyze-iksan-structure.ts
  ├── analyze-inje-structure.ts
  ├── analyze-jangsu-structure.ts
  ├── analyze-jcmall-structure.ts
  ├── analyze-jeju-mall-ajax.ts
  ├── analyze-jeju-mall-structure.ts
  ├── analyze-jeju-mall.ts
  ├── analyze-jeongseon-structure.ts
  ├── analyze-jindoarirang-structure.ts
  ├── analyze-jnmall-spa.ts
  ├── analyze-jnmall-structure.ts
  ├── analyze-kkimchi-structure.ts
  ├── analyze-mgmall-structure.ts
  ├── analyze-najumall-structure.ts
  ├── analyze-nongsarang-detailed.ts
  ├── analyze-nongsarang-structure.ts
  ├── analyze-okjmall-structure.ts
  ├── analyze-onsim-structure.ts
  ├── analyze-ontongdaejeon-price-structure.ts
  ├── analyze-ontongdaejeon-structure.ts
  ├── analyze-osansemall-main-page.ts
  ├── analyze-osansemall-structure.ts
  ├── analyze-product-structures.ts
  ├── analyze-samcheok-structure.ts
  ├── analyze-sclocal-structure.ts
  ├── analyze-seosanttre-structure.ts
  ├── analyze-shinan1004-structure.ts
  ├── analyze-sjlocal-products.ts
  ├── analyze-sjlocal-simple.ts
  ├── analyze-sjlocal-structure.ts
  ├── analyze-sjmall-structure.ts
  ├── analyze-smartstore-with-retry.ts
  ├── analyze-taebaek-structure.ts
  ├── analyze-ulmall-structure.ts
  ├── analyze-wandofood-structure.ts
  ├── analyze-wemall-structure.ts
  ├── analyze-wonju-structure.ts
  ├── analyze-yanggu-structure.ts
  ├── analyze-yangju-structure.ts
  ├── analyze-yangyang-comprehensive.ts
  ├── analyze-yangyang-simple.ts
  ├── analyze-yangyang-structure.ts
  ├── analyze-ycjang-structure.ts
  ├── analyze-yeongam-structure.ts
  ├── analyze-yeongwol-structure.ts
  ├── analyze-yeosumall-alternatives.ts
  ├── analyze-yeosumall-structure.ts
  ├── analyze-yjmarket-structure.ts
  ├── batch-scrape-all-malls.ts
  ├── buan-test-products-1751018797462.json
  ├── check-gmsocial-name-fields.ts
  ├── check-gmsocial-names.ts
  ├── check-gmsocial-product-names.ts
  ├── check-gwdmall-names.ts
  ├── check-jeju-titles.ts
  ├── check-live-products.ts
  ├── check-mall-details.js
  ├── check-mall-structure.js
  ├── check-missing-mall-names.ts
  ├── check-price-status.js
  ├── classify-products.ts
  ├── clean-and-verify-ontongdaejeon-products.ts
  ├── clean-category-products.ts
  ├── clean-extracted-titles.ts
  ├── clean-jeju-titles.ts
  ├── cleanup-nonexistent-malls.ts
  ├── comprehensive-jeju-title-update.ts
  ├── convert-title-to-name-only.ts
  ├── create-jeju-products-dataset.ts
  ├── create-test-buan-products.js
  ├── create-yeosumall-mock-scraper.ts
  ├── danpoong-scraped-backup-1751020379631.json
  ├── danpoong-scraped-backup-1751020526212.json
  ├── danpoong-scraped-backup-1751020669285.json
  ├── danpoong-scraped-backup-1751020817925.json
  ├── debug-gmsocial-products.ts
  ├── debug-osansemall-category.ts
  ├── discover-freshjb-api.ts
  ├── download-mall-logos.ts
  ├── download-missing-logos.ts
  ├── enrich-jeju-products.ts
  ├── explore-chamds-categories.ts
  ├── explore-gochang-categories.ts
  ├── explore-jangsu-categories.ts
  ├── explore-kkimchi-categories.ts
  ├── explore-kkimchi-shop.ts
  ├── explore-nongsarang-shop.ts
  ├── explore-ontongdaejeon-categories.ts
  ├── extract-jeju-mall-urls.ts
  ├── extract-jnmall-products.ts
  ├── extract-ontongdaejeon-prices-axios.ts
  ├── extract-ontongdaejeon-prices.ts
  ├── extract-real-jeju-titles.ts
  ├── fetch-real-jeju-images-axios.ts
  ├── fetch-real-jeju-images.ts
  ├── fetch-real-jeju-titles.ts
  ├── filter-wemall-food-products.ts
  ├── final-verification.ts
  ├── find-chamds-categories.ts
  ├── find-remaining-issue.ts
  ├── fix-agricultural-categories.py
  ├── fix-all-missing-product-names.ts
  ├── fix-all-product-mall-names.ts
  ├── fix-chamds-images-fallback.ts
  ├── fix-chamds-images-real.ts
  ├── fix-chamds-images.ts
  ├── fix-final-generic-title.ts
  ├── fix-gmsocial-names-comprehensive.ts
  ├── fix-gmsocial-product-names.ts
  ├── fix-gmsocial-scraper-urls.ts
  ├── fix-gmsocial-urls.ts
  ├── fix-jeju-images-fallback.ts
  ├── fix-jeju-images.ts
  ├── fix-jeju-prices.ts
  ├── fix-priority-malls.ts
  ├── fix-product-mall-names.ts
  ├── fix-specific-jeju-titles.ts
  ├── identify-category-products.ts
  ├── improve-danpoong-categories.js
  ├── improve-scraped-titles.ts
  ├── improved-buan-scraper.js
  ├── integrate-final-jeju-products.ts
  ├── integrate-jeju-products.ts
  ├── list-all-gmsocial-products.ts
  ├── list-all-gwdmall-products.ts
  ├── list-gmsocial-products.ts
  ├── list-problematic-products.js
  ├── move-rice-products.py
  ├── ontongdaejeon-final-summary.ts
  ├── overview-helpers.ts
  ├── README.md
  ├── reclassify-jeonche-products.py
  ├── register-all-mall-products.ts
  ├── register-batch-products.ts
  ├── register-bmall-products.ts
  ├── register-boseong-products.ts
  ├── register-buan-products.ts
  ├── register-cdmall-products.ts
  ├── register-cgmall-products.ts
  ├── register-chack3-products.ts
  ├── register-chamds-food-products.ts
  ├── register-chamds-products.ts
  ├── register-cheorwon-products.ts
  ├── register-chuncheon-products.ts
  ├── register-csmall-products.ts
  ├── register-cyso-products.ts
  ├── register-damyang-products.ts
  ├── register-dangjinfarm-products.ts
  ├── register-danpoong-products.js
  ├── register-danpoong-products.ts
  ├── register-donghae-products.ts
  ├── register-ehongseong-products.ts
  ├── register-ejeju-products.ts
  ├── register-esjang-products.ts
  ├── register-freshjb-products.ts
  ├── register-gangneung-products.ts
  ├── register-gmsocial-clean.ts
  ├── register-gmsocial-products.ts
  ├── register-gochang-products.ts
  ├── register-goesan-products.ts
  ├── register-gokseongmall-products.ts
  ├── register-goseong-products.ts
  ├── register-greengj-products.ts
  ├── register-gwdmall-products.ts
  ├── register-gwpc-products.ts
  ├── register-haegaram-products.ts
  ├── register-hampyeong-products.ts
  ├── register-hoengseong-products.ts
  ├── register-hongcheon-products.ts
  ├── register-hwasunfarm-products.ts
  ├── register-iksan-products.ts
  ├── register-inje-products.ts
  ├── register-jangsu-products.ts
  ├── register-jcmall-products.ts
  ├── register-jeongseon-products.ts
  ├── register-jindoarirang-products.ts
  ├── register-jnmall-products.ts
  ├── register-kkimchi-food-products.ts
  ├── register-kkimchi-products.ts
  ├── register-mgmall-products.ts
  ├── register-najumall-products.ts
  ├── register-nongsarang-products.ts
  ├── register-okjmall-products.ts
  ├── register-onsim-products.ts
  ├── register-ontongdaejeon-food-products.ts
  ├── register-ontongdaejeon-products-with-prices.ts
  ├── register-ontongdaejeon-products.ts
  ├── register-osansemall-products.ts
  ├── register-retry-products.ts
  ├── register-samcheok-products.ts
  ├── register-sclocal-products.ts
  ├── register-seosanttre-products.ts
  ├── register-shinan1004-products.ts
  ├── register-sjmall-products.ts
  ├── register-taebaek-products.ts
  ├── register-ulmall-products.ts
  ├── register-wandofood-products.ts
  ├── register-wemall-food-products.ts
  ├── register-wemall-products.ts
  ├── register-wonju-products.ts
  ├── register-yanggu-products.ts
  ├── register-yangju-products.ts
  ├── register-yangyang-products.ts
  ├── register-ycjang-products.ts
  ├── register-yeongam-products.ts
  ├── register-yeongwol-products.ts
  ├── register-yeosumall-mock-products.ts
  ├── register-yeosumall-products.ts
  ├── register-yjmarket-products.ts
  ├── remove-buan-products.js
  ├── remove-danpoong-products.js
  ├── remove-failed-jeju-products.ts
  ├── remove-jejumall.ts
  ├── remove-unknown-mall-products.ts
  ├── retry-failed-malls.ts
  ├── scrape-all-jeju-products.ts
  ├── scrape-and-register-haegaram.ts
  ├── scrape-bmall-comprehensive.ts
  ├── scrape-boseong-comprehensive.ts
  ├── scrape-boseong-fixed.ts
  ├── scrape-buan-comprehensive.ts
  ├── scrape-buan-quick.ts
  ├── scrape-buan-tteotbat-halme-api.js
  ├── scrape-buan-tteotbat-halme.js
  ├── scrape-cdmall-comprehensive.ts
  ├── scrape-cdmall-fixed.ts
  ├── scrape-cdmall-quick.ts
  ├── scrape-cgmall-comprehensive.ts
  ├── scrape-chack3-products.ts
  ├── scrape-chamds-comprehensive.ts
  ├── scrape-cheorwon-comprehensive.ts
  ├── scrape-chuncheon-comprehensive.ts
  ├── scrape-csmall-comprehensive.ts
  ├── scrape-cyso-comprehensive.ts
  ├── scrape-cyso-quick.ts
  ├── scrape-damyang-comprehensive.ts
  ├── scrape-dangjinfarm-comprehensive.ts
  ├── scrape-dangjinfarm-final.ts
  ├── scrape-dangjinfarm-fixed.ts
  ├── scrape-danpoong-comprehensive.ts
  ├── scrape-danpoong-mall-api.js
  ├── scrape-danpoong-mall.js
  ├── scrape-danpoong-quick.ts
  ├── scrape-donghae-comprehensive.ts
  ├── scrape-ehongseong-comprehensive.ts
  ├── scrape-ehongseong-quick.ts
  ├── scrape-ejeju-mall-accurate.ts
  ├── scrape-ejeju-mall-comprehensive.ts
  ├── scrape-ejeju-mall-simple.ts
  ├── scrape-ejeju-mall.ts
  ├── scrape-esjang-comprehensive.ts
  ├── scrape-esjang-simple.ts
  ├── scrape-freshjb-comprehensive.ts
  ├── scrape-gangneung-comprehensive.ts
  ├── scrape-gimhaemall-comprehensive.ts
  ├── scrape-gimhaemall-real.ts
  ├── scrape-gmsocial-categories.ts
  ├── scrape-gmsocial-comprehensive.ts
  ├── scrape-gmsocial-direct.ts
  ├── scrape-gmsocial-focused.ts
  ├── scrape-gmsocial-optimized.ts
  ├── scrape-gmsocial-quick.ts
  ├── scrape-gmsocial-robust.ts
  ├── scrape-gochang-comprehensive.ts
  ├── scrape-gochang-quick.ts
  ├── scrape-goesan-comprehensive.ts
  ├── scrape-goesan-quick.ts
  ├── scrape-gokseongmall-comprehensive.ts
  ├── scrape-gokseongmall-quick.ts
  ├── scrape-goseong-comprehensive.ts
  ├── scrape-greengj-comprehensive.ts
  ├── scrape-gwdmall-comprehensive.ts
  ├── scrape-gwdmall-working.ts
  ├── scrape-gwpc-comprehensive.ts
  ├── scrape-haegaram-comprehensive.ts
  ├── scrape-hampyeong-comprehensive.ts
  ├── scrape-hoengseong-comprehensive.ts
  ├── scrape-hongcheon-comprehensive.ts
  ├── scrape-hwasunfarm-comprehensive.ts
  ├── scrape-hwasunfarm-quick.ts
  ├── scrape-iksan-comprehensive.ts
  ├── scrape-iksan-quick.ts
  ├── scrape-individual-jeju-titles.ts
  ├── scrape-inje-comprehensive.ts
  ├── scrape-jangsu-comprehensive.ts
  ├── scrape-jangsu-quick.ts
  ├── scrape-jcmall-comprehensive.ts
  ├── scrape-jcmall-enhanced.ts
  ├── scrape-jcmall-final.ts
  ├── scrape-jeju-listing-titles.ts
  ├── scrape-jeju-mall-accurate.ts
  ├── scrape-jeju-mall-ajax.ts
  ├── scrape-jeju-mall-final.ts
  ├── scrape-jeju-mall-real.ts
  ├── scrape-jeju-mall-simple.ts
  ├── scrape-jeju-mall.ts
  ├── scrape-jeju-products-from-urls.ts
  ├── scrape-jeongseon-comprehensive.ts
  ├── scrape-jindoarirang-comprehensive.ts
  ├── scrape-jnmall-comprehensive.ts
  ├── scrape-kkimchi-comprehensive.ts
  ├── scrape-mall-template.ts
  ├── scrape-mgmall-comprehensive.ts
  ├── scrape-missing-jeju-titles.ts
  ├── scrape-najumall-comprehensive.ts
  ├── scrape-nongsarang-comprehensive.ts
  ├── scrape-nongsarang-fixed.ts
  ├── scrape-okjmall-comprehensive.ts
  ├── scrape-okjmall-fixed.ts
  ├── scrape-onsim-comprehensive.ts
  ├── scrape-ontongdaejeon-comprehensive.ts
  ├── scrape-ontongdaejeon-detailed.ts
  ├── scrape-ontongdaejeon-enhanced.ts
  ├── scrape-ontongdaejeon-fixed.ts
  ├── scrape-ontongdaejeon-food-products.ts
  ├── scrape-ontongdaejeon-with-prices.ts
  ├── scrape-osansemall-direct.ts
  ├── scrape-osansemall-products.ts
  ├── scrape-osansemall-real.ts
  ├── scrape-samcheok-comprehensive.ts
  ├── scrape-sclocal-comprehensive.ts
  ├── scrape-seosanttre-comprehensive.ts
  ├── scrape-seosanttre-quick.ts
  ├── scrape-shinan1004-comprehensive.ts
  ├── scrape-shinan1004-fixed.ts
  ├── scrape-sjlocal-products.ts
  ├── scrape-sjmall-comprehensive.ts
  ├── scrape-taebaek-comprehensive.ts
  ├── scrape-ulmall-comprehensive.ts
  ├── scrape-wandofood-comprehensive.ts
  ├── scrape-wemall-comprehensive.ts
  ├── scrape-wemall-food-comprehensive.ts
  ├── scrape-wemall-food-final.ts
  ├── scrape-wemall-priority.ts
  ├── scrape-wonju-comprehensive.ts
  ├── scrape-wonju-working.ts
  ├── scrape-yanggu-comprehensive.ts
  ├── scrape-yanggu-final.ts
  ├── scrape-yanggu-fixed.ts
  ├── scrape-yanggu-homepage.ts
  ├── scrape-yangju-careful.ts
  ├── scrape-yangju-comprehensive.ts
  ├── scrape-yangyang-comprehensive.ts
  ├── scrape-yangyang-final.ts
  ├── scrape-ycjang-comprehensive.ts
  ├── scrape-yeongam-comprehensive.ts
  ├── scrape-yeongwol-comprehensive.ts
  ├── scrape-yeosumall-comprehensive.ts
  ├── scrape-yeosumall-template.ts
  ├── scrape-yjmarket-comprehensive.ts
  ├── simple-buan-scraper.js
  ├── test-api-products.ts
  ├── test-boseong-product.ts
  ├── test-buan-category.ts
  ├── test-buan-product.ts
  ├── test-cdmall-product.ts
  ├── test-chamds-product-pages.ts
  ├── test-cheorwon-product.ts
  ├── test-chuncheon-product.ts
  ├── test-damyang-category.ts
  ├── test-dangjinfarm-product.ts
  ├── test-danpoong-category.ts
  ├── test-donghae-product.ts
  ├── test-ehongseong-product.ts
  ├── test-ejeju-fetch.ts
  ├── test-esjang-product.ts
  ├── test-freshjb-ajax.ts
  ├── test-freshjb-products.ts
  ├── test-gangneung-product.ts
  ├── test-gmsocial-access.ts
  ├── test-gmsocial.ts
  ├── test-goesan-product.ts
  ├── test-goseong-product.ts
  ├── test-gwdmall-page.ts
  ├── test-gwpc-product.ts
  ├── test-haegaram-product.ts
  ├── test-hampyeong-category.ts
  ├── test-hoengseong-product.ts
  ├── test-hongcheon-product.ts
  ├── test-iksan-category.ts
  ├── test-inje-product.ts
  ├── test-jangsu-category.ts
  ├── test-jcmall-product.ts
  ├── test-jeju-title-puppeteer.ts
  ├── test-jeju-title.ts
  ├── test-jeongseon-product.ts
  ├── test-jnmall-structure.ts
  ├── test-najumall-product.ts
  ├── test-nongsarang-product.ts
  ├── test-okjmall-product.ts
  ├── test-onsim-product.ts
  ├── test-samcheok-product.ts
  ├── test-sclocal-category.ts
  ├── test-seosanttre-product.ts
  ├── test-shinan1004-product.ts
  ├── test-specific-url.ts
  ├── test-taebaek-product.ts
  ├── test-wemall-category.ts
  ├── test-wemall-food-category.ts
  ├── test-wonju-product.ts
  ├── test-yanggu-category.ts
  ├── test-yanggu-product.ts
  ├── test-yangju-page.ts
  ├── test-yangyang-product.ts
  ├── test-yeongwol-product.ts
  ├── test-yeosumall-access.ts
  ├── trigger-rebuild.json
  ├── trigger-rebuild.ts
  ├── update-overview.ts
  ├── verify-bmall-registration.ts
  ├── verify-boseong-registration.ts
  ├── verify-buan-registration.ts
  ├── verify-cdmall-registration.ts
  ├── verify-cgmall-registration.ts
  ├── verify-chack3-registration.ts
  ├── verify-chamds-food-registration.ts
  ├── verify-chamds-registration.ts
  ├── verify-cheorwon-registration.ts
  ├── verify-chuncheon-registration.ts
  ├── verify-csmall-registration.ts
  ├── verify-cyso-registration.ts
  ├── verify-damyang-registration.ts
  ├── verify-dangjinfarm-registration.ts
  ├── verify-danpoong-registration.ts
  ├── verify-donghae-registration.ts
  ├── verify-ehongseong-registration.ts
  ├── verify-ejeju-products.ts
  ├── verify-esjang-registration.ts
  ├── verify-freshjb-registration.ts
  ├── verify-gangneung-registration.ts
  ├── verify-gmsocial-clean.ts
  ├── verify-gmsocial-registration.ts
  ├── verify-gochang-registration.ts
  ├── verify-goesan-registration.ts
  ├── verify-gokseongmall-registration.ts
  ├── verify-goseong-registration.ts
  ├── verify-greengj-registration.ts
  ├── verify-gwdmall-registration.ts
  ├── verify-gwpc-registration.ts
  ├── verify-haegaram-registration.ts
  ├── verify-hampyeong-registration.ts
  ├── verify-hoengseong-registration.ts
  ├── verify-hongcheon-registration.ts
  ├── verify-hwasunfarm-registration.ts
  ├── verify-iksan-registration.ts
  ├── verify-individual-products-all-malls.ts
  ├── verify-inje-registration.ts
  ├── verify-jangsu-registration.ts
  ├── verify-jcmall-registration.ts
  ├── verify-jejumall-removal.ts
  ├── verify-jeongseon-registration.ts
  ├── verify-jindoarirang-registration.ts
  ├── verify-jnmall-registration.ts
  ├── verify-kkimchi-food-registration.ts
  ├── verify-kkimchi-registration.ts
  ├── verify-mgmall-registration.ts
  ├── verify-najumall-registration.ts
  ├── verify-nongsarang-registration.ts
  ├── verify-okjmall-registration.ts
  ├── verify-onsim-registration.ts
  ├── verify-ontongdaejeon-food-registration.ts
  ├── verify-ontongdaejeon-registration.ts
  ├── verify-osansemall-registration.ts
  ├── verify-samcheok-registration.ts
  ├── verify-sclocal-registration.ts
  ├── verify-seosanttre-registration.ts
  ├── verify-shinan1004-registration.ts
  ├── verify-sjmall-registration.ts
  ├── verify-taebaek-registration.ts
  ├── verify-ulmall-registration.ts
  ├── verify-wandofood-registration.ts
  ├── verify-wemall-food-products.ts
  ├── verify-wemall-food-registration.ts
  ├── verify-wemall-individual-products.ts
  ├── verify-wemall-registration.ts
  ├── verify-wonju-registration.ts
  ├── verify-yanggu-registration.ts
  ├── verify-yangju-registration.ts
  ├── verify-yangyang-registration.ts
  ├── verify-ycjang-registration.ts
  ├── verify-yeongam-registration.ts
  ├── verify-yeongwol-registration.ts
  ├── verify-yeosumall-registration.ts
  ├── verify-yeosumall-status.ts
  ├── verify-yjmarket-registration.ts
src/
  ├── app/
  │   ├── about/
  │   │   ├── page.tsx
  │   ├── admin/
  │   │   ├── dashboard/
  │   │   │   ├── page.tsx
  │   │   ├── page.tsx
  │   ├── api/
  │   │   ├── admin/
  │   │   │   ├── login/
  │   │   │   │   ├── route.ts
  │   │   ├── products/
  │   │   │   ├── route.ts
  │   │   ├── scrape-mall/
  │   │   │   ├── route.ts
  │   │   ├── sync-products/
  │   │   │   ├── route.ts
  │   │   ├── track-click/
  │   ├── contact/
  │   │   ├── page.tsx
  │   ├── privacy/
  │   │   ├── page.tsx
  │   ├── product/
  │   │   ├── [productId]/
  │   │   │   ├── page.tsx
  │   │   ├── \[productId\]/
  │   ├── products/
  │   │   ├── page.tsx
  │   ├── region/
  │   │   ├── [regionName]/
  │   │   │   ├── page.tsx
  │   │   │   ├── RegionPageClient.tsx
  │   │   ├── \[regionName\]/
  │   ├── scrapermalls/
  │   │   ├── page.tsx
  │   ├── search/
  │   │   ├── page.tsx
  │   ├── terms/
  │   │   ├── page.tsx
  │   ├── globals.css
  │   ├── layout.tsx
  │   ├── page.tsx
  ├── components/
  │   ├── AllMallsDisplay.tsx
  │   ├── FeaturedMalls.tsx
  │   ├── InteractiveMap.tsx
  │   ├── MallCard.tsx
  │   ├── ProductCard.tsx
  │   ├── ProductSearchBar.tsx
  │   ├── QuickFilters.tsx
  │   ├── SearchBar.tsx
  ├── data/
  │   ├── categories.json
  │   ├── category-mapping.json
  │   ├── malls.json
  │   ├── products_backup.json
  │   ├── products-backup-1750328004702.json
  │   ├── products-backup-1750568863072.json
  │   ├── products-backup-1750570197131.json
  │   ├── products-backup-1750572300975.json
  │   ├── products-backup-1750574795060.json
  │   ├── products-backup-1750575412352.json
  │   ├── products-backup-1750588183121.json
  │   ├── products-backup-1750592898092.json
  │   ├── products-backup-1750592931358.json
  │   ├── products-backup-1750594992322.json
  │   ├── products-backup-1750596621903.json
  │   ├── products-backup-1750661161158.json
  │   ├── products-backup-1750671690959.json
  │   ├── products-backup-1750678187895.json
  │   ├── products-backup-1750681078365.json
  │   ├── products-backup-1750683931765.json
  │   ├── products-backup-1750685816271.json
  │   ├── products-backup-1750688260481.json
  │   ├── products-backup-1750688848924.json
  │   ├── products-backup-1750689870280.json
  │   ├── products-backup-1750694610785.json
  │   ├── products-backup-1750734292049.json
  │   ├── products-backup-1750747721811.json
  │   ├── products-backup-1750748824102.json
  │   ├── products-backup-1750749802755.json
  │   ├── products-backup-1750753552495.json
  │   ├── products-backup-1750755847687.json
  │   ├── products-backup-1750757661925.json
  │   ├── products-backup-1750760294270.json
  │   ├── products-backup-1750762878316.json
  │   ├── products-backup-1750762893303.json
  │   ├── products-backup-1750764569119.json
  │   ├── products-backup-1750766787460.json
  │   ├── products-backup-1750769094310.json
  │   ├── products-backup-1750769635860.json
  │   ├── products-backup-1750783806494.json
  │   ├── products-sample.json
  │   ├── products.json
  │   ├── regions.json
  │   ├── tag-analysis.json
  │   ├── tag-mapping.json
  ├── lib/
  │   ├── scrapers/
  │   │   ├── base-scraper.ts
  │   │   ├── generic-scraper.ts
  │   │   ├── scraper-registry.ts
  │   ├── cron-config.ts
  │   ├── data.ts
  │   ├── product-classifier.ts
  │   ├── product-sync.ts
  ├── types/
  │   ├── index.ts
analyze-product-names.js/
check-actual-mall-ids.js/
CLAUDE.md/
CRON_SETUP.md/
debug-problematic-products.js/
debug-specific-malls.js/
jeju-mall-product-urls.txt/
next-env.d.ts/
next.config.js/
package-lock.json/
package.json/
postcss.config.js/
PROJECT_OVERVIEW.md/
README.md/
tailwind.config.js/
test-api.js/
tsconfig.json/
tsconfig.tsbuildinfo/
vercel.json/
```

## 🗄 Data Architecture

### 1. Malls Data (`malls.json`)
```typescript
{
  id: string;           // Unique identifier (e.g., "mall_1_온서울마켓")
  name: string;         // Korean name
  url: string;          // Mall website URL
  region: string;       // Korean region name (서울, 부산, etc.)
  tags: string[];       // Categories/features
  featured: boolean;    // Featured status
  isNew: boolean;       // New mall indicator
  clickCount: number;   // Popularity metric
  lastVerified: string; // Date last checked
  district?: string;    // Optional sub-region
}
```

Total: **93 shopping malls** across 17 regions

### 2. Products Data (`products.json`)
```typescript
{
  id: string;              // Unique identifier
  name: string;            // Product name
  description: string;     // Product description
  price: string;           // Current price (Korean format)
  originalPrice?: string;  // Original price if discounted
  imageUrl: string;        // Product image URL
  productUrl: string;      // Link to product page
  mallId: string;          // Associated mall ID
  mallName: string;        // Mall name for display
  category: string;        // Product category
  tags: string[];          // Search tags
  inStock: boolean;        // Availability status
  lastUpdated: string;     // Last update timestamp
  createdAt: string;       // Creation timestamp
}
```

Total: **4247 products** with real data for featured malls

### 3. Regions Data (`regions.json`)
```typescript
{
  id: string;           // Region identifier (e.g., "seoul")
  name_ko: string;      // Korean name (서울)
  name_en: string;      // English name
  description_ko: string; // Korean description
  mall_count: number;   // Number of malls
  highlight_text: string; // Featured text
}
```

17 regions covering all of South Korea:
- Metropolitan cities: Seoul, Busan, Daegu, Incheon, Gwangju, Daejeon, Ulsan, Sejong
- Provinces: Gyeonggi, Gangwon, Chungbuk, Chungnam, Jeonbuk, Jeonnam, Gyeongbuk, Gyeongnam, Jeju

### 4. Categories Data (`categories.json`)
```typescript
{
  id: string;        // Category identifier
  name: string;      // Korean name
  slug: string;      // URL-friendly name
  icon?: string;     // Optional icon
}
```

10 main categories:
- agricultural (농산물)
- seafood (수산물)
- livestock (축산물)
- processed (가공식품)
- health (건강식품)
- traditional (전통식품)
- specialty (지역특산품)
- eco_friendly (친환경인증)
- crafts (공예품)
- other (기타)

## 🧩 Key Components

### 1. InteractiveMap Component
- SVG-based map of South Korea
- Clickable regions with hover effects
- Mobile-responsive with auto-scroll
- Region-based mall filtering
- Visual feedback for selection

### 2. SearchBar Component
- Real-time search with Fuse.js
- Autocomplete suggestions
- Keyboard navigation support
- Search across mall names, tags, and regions
- Configurable placeholder text

### 3. ProductCard Component
- Product image with fallback
- Price display with discount indicator
- Category badges with color coding
- Mall attribution
- Click-through to original product
- Stock status indicator

### 4. MallCard Component
- Mall information display
- Tag visualization
- Click tracking integration
- Featured/New badges
- Region indication

### 5. QuickFilters Component
- Category-based filtering
- Visual filter pills
- Multi-select capability
- Result count display

## 🔌 API Endpoints

### 1. GET `/api/products`
Fetches product data with optional filtering

Query parameters:
- `category` - Filter by category
- `mallId` - Filter by specific mall
- `search` - Search query
- `limit` - Limit results

Response:
```json
{
  "products": [...],
  "total": 451,
  "timestamp": "2025-06-01T..."
}
```

### 2. POST `/api/sync-products`
Synchronizes products from mall websites (requires auth)

Headers:
- `Authorization: Bearer {SYNC_API_KEY}`

Response:
```json
{
  "success": true,
  "message": "Synced 6 malls",
  "timestamp": "2025-06-01T..."
}
```

### 3. POST `/api/track-click`
Records mall click events for analytics

Body:
```json
{
  "mallId": "mall_1_온서울마켓"
}
```

## 📄 Pages and Routes

### Static Pages
- `/` - Homepage with map and featured malls
- `/about` - About the platform
- `/contact` - Contact information
- `/privacy` - Privacy policy
- `/terms` - Terms of service
- `/products` - All products grid view
- `/search` - Search results page

### Dynamic Routes
- `/region/[regionName]` - Region-specific mall listings
  - Examples: `/region/seoul`, `/region/busan`, `/region/gangwon`
  - Shows all malls and products from that region

## 🔄 Data Flow

### 1. Homepage Flow
```
User lands on homepage
  ↓
InteractiveMap loads with regions data
  ↓
User clicks region or uses search
  ↓
Navigation to region page or search results
```

### 2. Product Discovery Flow
```
User browses products
  ↓
Filters by category/region/search
  ↓
Views product details
  ↓
Clicks through to original mall
  ↓
Click tracked via API
```

### 3. Data Sync Flow
```
Cron job triggers sync API
  ↓
Scraper fetches mall products
  ↓
Products updated in JSON file
  ↓
Changes reflected on next request
```

## 🚀 Deployment

### Vercel Deployment
The project is configured for Vercel deployment with:
- Automatic builds on push to `pre-production` branch
- Environment variables for API keys
- Static generation for optimal performance
- Edge runtime for API routes

### Environment Variables
```env
SYNC_API_KEY=your_sync_api_key_here
```

### Build Configuration
- Framework: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

## 👨‍💻 Development Guide

### Setup
```bash
# Clone repository
git clone https://github.com/Dyskid/e-paldogangsan.git

# Install dependencies
npm install

# Run development server
npm run dev
```

### Key Commands
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Adding New Malls
1. Update `src/data/malls.json` with mall information
2. Add products to `src/data/products.json`
3. Update region counts in `src/data/regions.json`
4. Optionally add scraper configuration

### Code Style
- TypeScript for type safety
- Functional components with hooks
- Tailwind CSS for styling
- Async/await for asynchronous code
- ESLint rules enforced

### Git Workflow
- Main branch: `main`
- Development branch: `pre-production`
- Feature branches from `pre-production`
- Pull requests for code review

## 📝 Notes

### Data Sources
- Mall list consolidated from government sources
- Product data scraped from individual mall websites
- Regular updates via cron jobs (when configured)

### Future Enhancements
- User accounts and favorites
- Price tracking and alerts
- Advanced filtering options
- Mall reviews and ratings
- Mobile app development
- Real-time inventory updates

### Performance Considerations
- Static generation for all pages where possible
- Image optimization with Next.js Image component
- Client-side search for instant results
- Lazy loading for product grids
- CDN distribution via Vercel

---

Last Updated: 2025-06-28
Version: 1.0.0
Git Branch: enrolling
Last Commit: 1d06e16 refactor: consolidate multiple categories and improve organization

### Project Statistics
- Total Files: 1409
- Total Directories: 41
- Shopping Malls: 93
- Products: 4247
- Regions: 17
- Categories: 10