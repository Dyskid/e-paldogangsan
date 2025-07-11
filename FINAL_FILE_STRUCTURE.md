# 📁 e-Paldogangsan 최종 파일 구조

## 🎯 정리 완료 상태

프로젝트의 파일 구조가 일관성 있게 재정리되었습니다.

### 📂 디렉토리 구조

```
e-paldogangsan/
├── config/                 # 설정 파일 (5개)
│   ├── next.config.js     # Next.js 설정
│   ├── postcss.config.js  # PostCSS 설정
│   ├── tailwind.config.js # Tailwind CSS 설정
│   ├── tsconfig.json      # TypeScript 설정
│   └── vercel.json        # Vercel 배포 설정
│
├── data/                  # 데이터 파일
│   ├── products/          # 상품 데이터 (113개 파일)
│   │   └── {id}-{mall-name}-products.json
│   ├── malls/             # 쇼핑몰 정보
│   └── scraped-products/  # 스크래핑 원본 데이터
│
├── scripts/               # 스크립트
│   ├── scrapers/          # 스크래퍼 (7개)
│   │   ├── simple-batch-scraper.js
│   │   ├── cyso-platform-scraper.js
│   │   ├── custom-platform-scraper.js
│   │   ├── naver-smartstore-scraper.js
│   │   └── master-scraper.js
│   └── utilities/         # 유틸리티 (8개)
│       ├── rename-files-with-ids.js
│       ├── cleanup-duplicate-products.js
│       └── convert-scraped-to-individual.js
│
├── docs/                  # 문서 (6개)
│   ├── README.md
│   ├── SCRAPER_GUIDE.md
│   ├── SCRAPING_README.md
│   └── PROJECT_OVERVIEW.md
│
├── src/                   # 소스 코드
│   ├── app/              # Next.js App Router
│   ├── components/       # React 컴포넌트
│   ├── lib/              # 라이브러리 함수
│   └── types/            # TypeScript 타입
│
└── archive/              # 보관된 파일 (400+개)
```

### 📋 정리 내역

1. **파일 이름 표준화**
   - 모든 파일명을 kebab-case로 통일
   - 한글 문자 제거 (예: `30-농사랑-products.json` → `30-farm-love-products.json`)
   - 일관된 명명 규칙 적용: `{id}-{mall-name}-{type}.{ext}`

2. **디렉토리 구조 개선**
   - 설정 파일을 `config/` 디렉토리로 이동
   - 상품 데이터를 `data/products/`로 통합
   - 스크래퍼와 유틸리티 분리
   - 문서를 `docs/`로 통합

3. **삭제된 파일 (750+개)**
   - HTML 캐시 파일 (183개)
   - 분석/테스트 스크립트 (200+개)
   - 중간 처리 파일 (300+개)
   - 컴파일된 파일 (dist/)
   - 백업 및 임시 파일

4. **데이터 현황**
   - 총 쇼핑몰: 93개
   - 스크래핑 완료: 85개 (91.4%)
   - 수집된 상품: 4,469개
   - 평균 상품 수: 몰당 53개

### ✅ 개선 효과

- **가독성 향상**: 일관된 파일명과 구조로 파일 찾기 용이
- **유지보수성**: 명확한 디렉토리 구분으로 관리 편의성 증대
- **용량 절감**: 불필요한 파일 삭제로 100-200MB 공간 확보
- **협업 효율**: 표준화된 구조로 팀 협업 개선

### 🔧 향후 작업

1. `assets/malls.json`과 `src/data/malls.json` 통합
2. 남은 미스크래핑 몰 추가 수집
3. 상품 데이터 정기 업데이트 시스템 구축