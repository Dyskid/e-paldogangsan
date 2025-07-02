# Web Scraper Generation Summary for Malls 1-30

## Task Overview (from plan3.md)
**Objective**: Generate web scrapers based on analysis-[id].json files for each mall.

### Files to Generate per Mall:
1. `scraper.ts` - Main scraper implementation
2. `config.json` - Configuration settings
3. `package.json` - Project dependencies
4. `tsconfig.json` - TypeScript configuration
5. `README.md` - Usage documentation
6. `report-[id].md` - Report of the generation

**Output Directory**: `./malls/[id]-[engname]/scraper/`

## Mall Status for IDs 1-30

### Malls WITH Existing Scraper Directories (9 malls):
1. **Mall 1**: we-mall (우리몰) - https://wemall.kr
2. **Mall 2**: cham-dalseong-dalseong-county (참달성) - https://smartstore.naver.com/chamdalseong
3. **Mall 3**: gwangju-kimchi-mall (광주김치몰) - https://www.k-kimchi.kr/index.php
4. **Mall 4**: daejeon-love-mall (대전사랑몰) - https://ontongdaejeon.ezwel.com/onnuri/main
5. **Mall 5**: chack-chack-chack (착착착) - https://www.chack3.com/
6. **Mall 6**: osan-together-market (오산함께장터) - http://www.osansemall.com/
7. **Mall 7**: gwangmyeong-value-mall (광명가치몰) - http://gmsocial.mangotree.co.kr/mall/
8. **Mall 11**: wonju-mall (원주몰) - https://wonju-mall.co.kr/
9. **Mall 21**: jeongseon-mall (정선몰) - https://jeongseon-mall.com/

### Malls NEEDING Scraper Generation (21 malls):
1. **Mall 8**: yangju-farmers-market (양주농부마켓) - https://market.yangju.go.kr/
2. **Mall 9**: market-gyeonggi (마켓경기) - https://smartstore.naver.com/marketgyeonggi
3. **Mall 10**: gangwon-the-mall (강원더몰) - https://gwdmall.kr/
4. **Mall 12**: gangneung-mall (강릉몰) - https://gangneung-mall.com/
5. **Mall 13**: goseong-mall (고성몰) - https://gwgoseong-mall.com/
6. **Mall 14**: donghae-mall (동해몰) - https://donghae-mall.com/
7. **Mall 15**: samcheok-mall (삼척몰) - https://samcheok-mall.com/
8. **Mall 16**: yanggu-mall (양구몰) - https://yanggu-mall.com/
9. **Mall 17**: yangyang-mall (양양몰) - https://yangyang-mall.com/
10. **Mall 18**: yeongwol-mall (영월몰) - https://yeongwol-mall.com/
11. **Mall 19**: inje-mall (인제몰) - https://inje-mall.com/
12. **Mall 20**: cheorwon-mall (철원몰) - https://cheorwon-mall.com/
13. **Mall 22**: taebaek-mall (태백몰) - https://taebaek-mall.com/
14. **Mall 23**: hoengseong-mall (횡성몰) - https://hoengseong-mall.com/
15. **Mall 24**: chuncheon-mall (춘천몰) - https://gwch-mall.com/
16. **Mall 25**: hongcheon-mall (홍천몰) - https://hongcheon-mall.com/
17. **Mall 26**: pyeongchang-mall (평창몰) - https://gwpc-mall.com/
18. **Mall 27**: eumseong-market (음성장터) - https://www.esjang.go.kr/
19. **Mall 28**: jincheon-mall (진천몰) - https://jcmall.net/
20. **Mall 29**: goesan-market (괴산장터) - https://www.gsjangter.go.kr/
21. **Mall 30**: farm-love (농사랑) - https://nongsarang.co.kr/

## Summary Statistics
- **Total Malls (ID 1-30)**: 30
- **Scrapers Already Exist**: 9 (30%)
- **Scrapers Need Generation**: 21 (70%)

## Regions Breakdown
- **대구**: 2 malls (IDs 1-2)
- **광주**: 1 mall (ID 3)
- **대전**: 1 mall (ID 4)
- **경기**: 5 malls (IDs 5-9)
- **강원**: 16 malls (IDs 10-26)
- **충북**: 3 malls (IDs 27-29)
- **충남**: 1 mall (ID 30)

## Next Steps
To generate scrapers for the 21 malls that don't have them, ensure that:
1. Analysis files (`analysis-[id].json`) exist for each mall
2. Use the analysis data to inform scraper generation
3. Follow the file structure specified in plan3.md
4. Generate all required files for each mall individually