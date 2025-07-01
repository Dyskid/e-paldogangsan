# 영월몰 (yeongwol-mall) 분석 리포트

## 기본 정보
- **몰 ID**: 18
- **몰 이름**: yeongwol-mall
- **웹사이트 URL**: https://yeongwol-mall.com/
- **분석 날짜**: 2025-01-01
- **상태**: ✅ 접근 가능

## 플랫폼 정보
- **플랫폼**: Firstmall
- **특징**: 
  - Firstmall 기반 쇼핑몰
  - JavaScript 렌더링 필요
  - 표준 Firstmall URL 구조 사용

## 카테고리 구조
총 8개의 메인 카테고리 발견:
1. 축산물 - `/goods/catalog?code=0030`
2. 과일/견과 - `/goods/catalog?code=0017`
3. 채소/나물 - `/goods/catalog?code=0021`
4. 장/소금/기름/양념 - `/goods/catalog?code=0005`
5. 가공식품 - `/goods/catalog?code=0020`
6. 쌀/잡곡 - `/goods/catalog?code=0019`
7. 건강식품 - `/goods/catalog?code=0022`
8. 생활용품/뷰티 - `/goods/catalog?code=0008`

## 제품 구조 분석
### URL 패턴
- **카테고리 패턴**: `/goods/catalog?code=`
- **제품 상세 패턴**: `/goods/view?no=`
- **검색 패턴**: `/goods/search`

### HTML 선택자
- **제품 목록 컨테이너**: `.gl_item`
- **제품 링크**: `.goodS_info.displaY_goods_name a`
- **가격**: `.goodS_info.displaY_sales_price .nuM`
- **제품명**: `.goodS_info.displaY_goods_name`
- **이미지**: `.goodsDisplayImage`
- **페이지네이션**: `.paging a`

## 데이터 수집 방법
- **타입**: JavaScript 렌더링 필요
- **주요 엔드포인트**:
  - `/goods/search` - 검색
  - `/goods/catalog` - 카테고리
  - `/goods/view` - 제품 상세

## 추가 정보
- 영월군 지역 특산품 중심 쇼핑몰
- 강원특별자치도경제진흥원 운영
- 모바일 반응형 디자인 지원
- 네이버/카카오 애널리틱스 사용

## 권장사항
1. Firstmall 플랫폼 표준 크롤링 방식 사용
2. JavaScript 렌더링 지원 필요
3. 제품 ID는 URL의 `no` 파라미터에서 추출
4. 카테고리 코드는 4자리 숫자 체계 사용