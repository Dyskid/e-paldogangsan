const fs = require('fs');
const path = require('path');

// Paths
const SCRAPED_DATA_PATH = path.join(__dirname, '..', 'data', 'scraped-products');
const OUTPUT_PATH = path.join(__dirname, 'output');
const VALIDATION_REPORT_PATH = path.join(__dirname, '..', 'data', 'validation-report.json');

// Mall ID to engname mapping
const mallIdMapping = {
  '우리몰': { id: 1, engname: 'we-mall' },
  '참달성달성군': { id: 2, engname: 'cham-dalseong-dalseong-county' },
  '광주김치몰': { id: 3, engname: 'gwangju-kimchi-mall' },
  '대전사랑몰': { id: 4, engname: 'daejeon-love-mall' },
  '착착착': { id: 5, engname: 'chack-chack-chack' },
  '오산함께장터': { id: 6, engname: 'osan-together-market' },
  '광명가치몰': { id: 7, engname: 'gwangmyeong-value-mall' },
  '양주농가마켓': { id: 8, engname: 'yangju-farmers-market' },
  '경기장터': { id: 9, engname: 'market-gyeonggi' },
  '강원더몰': { id: 10, engname: 'gangwon-the-mall' },
  '원주몰': { id: 11, engname: 'wonju-mall' },
  '강릉몰': { id: 12, engname: 'gangneung-mall' },
  '고성몰': { id: 13, engname: 'goseong-mall' },
  '동해몰': { id: 14, engname: 'donghae-mall' },
  '삼척몰': { id: 15, engname: 'samcheok-mall' },
  '양구몰': { id: 16, engname: 'yanggu-mall' },
  '양양몰': { id: 17, engname: 'yangyang-mall' },
  '영월몰': { id: 18, engname: 'yeongwol-mall' },
  '인제몰': { id: 19, engname: 'inje-mall' },
  '철원몰': { id: 20, engname: 'cheorwon-mall' },
  '정선몰': { id: 21, engname: 'jeongseon-mall' },
  '태백몰': { id: 22, engname: 'taebaek-mall' },
  '횡성몰': { id: 23, engname: 'hoengseong-mall' },
  '춘천몰': { id: 24, engname: 'chuncheon-mall' },
  '홍천몰': { id: 25, engname: 'hongcheon-mall' },
  '평창몰': { id: 26, engname: 'pyeongchang-mall' },
  '음성장터': { id: 27, engname: 'eumseong-market' },
  '진천몰': { id: 28, engname: 'jincheon-mall' },
  '괴산장터': { id: 29, engname: 'goesan-market' },
  '농사랑': { id: 30, engname: 'farm-love' },
  '당진팜': { id: 31, engname: 'dangjin-farm' },
  'e홍성몰': { id: 32, engname: 'e-hongseong-market' },
  '서산뜨레': { id: 33, engname: 'seosan-ttre' },
  '부안떫밭할매텃밭': { id: 34, engname: 'buan-grandmas-garden' },
  '단풍미인정읍': { id: 35, engname: 'maple-beauty-jeongeup' },
  '수평선몰김제': { id: 36, engname: 'horizon-mall-gimje' },
  '전북생생장터': { id: 37, engname: 'jeonbuk-fresh-market' },
  '익산몰': { id: 38, engname: 'iksan-mall' },
  '진안고원몰': { id: 39, engname: 'jinan-highland-mall' },
  '장수몰': { id: 40, engname: 'jangsu-mall' },
  '고창장터': { id: 41, engname: 'gochang-market' },
  '임실몰': { id: 42, engname: 'imsil-mall' },
  '무주장터': { id: 43, engname: 'muju-market' },
  '해가람': { id: 44, engname: 'haegaram' },
  '남도장터': { id: 45, engname: 'namdo-market' },
  '여수몰': { id: 46, engname: 'yeosu-mall' },
  '광양몰': { id: 47, engname: 'gwangyang-mall' },
  '보성몰': { id: 48, engname: 'boseong-mall' },
  '나주몰': { id: 49, engname: 'naju-mall' },
  '순천로컬푸드함께가게': { id: 50, engname: 'suncheon-local-food-together-store' },
  '신안1004몰': { id: 51, engname: 'shinan-1004-mall' },
  '장흥몰산들해장흥몰': { id: 52, engname: 'jangheung-mall-mountain-sea-jangheung-mall' },
  '기찬들영암몰': { id: 53, engname: 'gichandeul-yeongam-mall' },
  '진도아리랑몰': { id: 54, engname: 'jindo-arirang-mall' },
  '완도군이숍': { id: 55, engname: 'wando-county-e-shop' },
  '함평천지몰': { id: 56, engname: 'hampyeong-cheonji-mall' },
  '해남미소': { id: 57, engname: 'haenam-smile' },
  '담양장터': { id: 58, engname: 'damyang-market' },
  '녹색한우믿음강진': { id: 59, engname: 'green-trust-gangjin' },
  '화순팜': { id: 60, engname: 'hwasun-farm' },
  '곡성몰곡성농특산물몰': { id: 61, engname: 'gokseong-mall-gokseong-agricultural-products-mall' },
  'CYSO경북몰': { id: 62, engname: 'cyso-gyeongbuk-mall' },
  '상주명실상주몰': { id: 63, engname: 'sangju-myeongsil-sangju-mall' },
  '청도청라이브': { id: 64, engname: 'cheongdo-cheong-live' },
  '영주장날': { id: 65, engname: 'yeongju-market-day' },
  '안동장터': { id: 66, engname: 'andong-market' },
  '청송몰': { id: 67, engname: 'cheongsong-mall' },
  '영양온심마켓': { id: 68, engname: 'yeongyang-onsim-market' },
  '울릉도명품관몰': { id: 69, engname: 'ulleungdo' },
  '봉화장터': { id: 70, engname: 'bonghwa-market' },
  '고령몰': { id: 71, engname: 'goryeong-mall' },
  '김천노다지장터': { id: 72, engname: 'gimcheon-nodaji-market' },
  '예천장날': { id: 73, engname: 'yecheon-market' },
  '문경새재아침': { id: 74, engname: 'mungyeong-morning-of-saejae' },
  '칠곡몰': { id: 75, engname: 'chilgok-mall' },
  '의성장날': { id: 76, engname: 'uiseong-market-day' },
  '경산장터': { id: 77, engname: 'gyeongsan-market' },
  '군위장터': { id: 78, engname: 'gunwi-market' },
  '성주온라인장터': { id: 79, engname: 'seongju-online-market' },
  '울진몰': { id: 80, engname: 'uljin-mall' },
  '영덕온라인몰': { id: 81, engname: 'yeongdeok-online-mall' },
  '포항ㅅ장터': { id: 82, engname: 'pohang-market' },
  '창원상생몰': { id: 83, engname: 'changwon-sangsaeng-mall' },
  '통영e몰': { id: 84, engname: 'tongyeong-e-mall' },
  '사천쇼핑몰': { id: 85, engname: 'sacheon-shopping-mall' },
  '거제몰': { id: 86, engname: 'geoje-mall' },
  '양산들말': { id: 87, engname: 'yangsan-deulmal' },
  '밀양팜': { id: 88, engname: 'miryang-farm' },
  '의령몰': { id: 89, engname: 'uiryeong-mall' },
  '함안몰': { id: 90, engname: 'haman-mall' },
  '창녕몰': { id: 91, engname: 'changnyeong-mall' },
  '김해온': { id: 92, engname: 'gimhae-on' },
  'e제주몰': { id: 93, engname: 'e-jeju-mall' },
  '서귀포클릭': { id: 94, engname: 'seogwipo-click' },
  '고성오이소': { id: 95, engname: 'goseong-oiso' },
  '남해몰': { id: 96, engname: 'namhae-mall' },
  '하동몰': { id: 97, engname: 'hadong-mall' },
  '산청군농산물쇼핑몰': { id: 98, engname: 'sancheong-county-agricultural-products-shopping-mall' },
  '함양몰': { id: 99, engname: 'hamyang-mall' },
  '거창몰': { id: 100, engname: 'geochang-mall' },
  '합천황토몰': { id: 101, engname: 'hapcheon-hwangto-mall' }
};

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_PATH)) {
  fs.mkdirSync(OUTPUT_PATH, { recursive: true });
}

// Function to load validation report and create mall mapping
function loadMallMapping() {
  try {
    const validationReport = JSON.parse(fs.readFileSync(VALIDATION_REPORT_PATH, 'utf8'));
    const mapping = {};
    
    // Process all malls from validation report
    const allMalls = [
      ...(validationReport.validMalls || []),
      ...(validationReport.invalidMalls || []),
      ...(validationReport.alreadyScrapedMalls || [])
    ];
    
    allMalls.forEach(mall => {
      if (mall.name && mall.id && mall.engname) {
        mapping[mall.name] = { id: mall.id, engname: mall.engname };
      }
    });
    
    // Merge with hardcoded mapping for any missing entries
    Object.keys(mallIdMapping).forEach(name => {
      if (!mapping[name]) {
        mapping[name] = mallIdMapping[name];
      }
    });
    
    return mapping;
  } catch (error) {
    console.log('Could not load validation report, using hardcoded mapping');
    return mallIdMapping;
  }
}

// Function to check if mall already has product file
function mallHasProductFile(id, engname) {
  const pattern = `${id}-${engname}-products.json`;
  const files = fs.readdirSync(OUTPUT_PATH);
  return files.some(file => file === pattern);
}

// Main conversion function
async function convertScrapedData() {
  console.log('Starting conversion of scraped data to individual mall files...\n');
  
  const report = {
    timestamp: new Date().toISOString(),
    processedMalls: [],
    skippedMalls: [],
    errors: [],
    summary: {
      totalMallsFound: 0,
      newFilesCreated: 0,
      filesSkipped: 0,
      totalProducts: 0
    }
  };
  
  try {
    // Load mall mapping
    const mallMapping = loadMallMapping();
    
    // Read latest scraped data
    const latestPath = path.join(SCRAPED_DATA_PATH, 'latest.json');
    if (!fs.existsSync(latestPath)) {
      throw new Error('No latest.json file found in scraped-products directory');
    }
    
    const scrapedData = JSON.parse(fs.readFileSync(latestPath, 'utf8'));
    report.summary.totalMallsFound = scrapedData.length;
    
    // Process each mall's data
    for (const mallData of scrapedData) {
      const mallName = mallData.mall;
      const products = mallData.products || [];
      
      // Get mall info from mapping
      const mallInfo = mallMapping[mallName];
      if (!mallInfo) {
        report.errors.push({
          mall: mallName,
          error: 'No ID/engname mapping found for this mall'
        });
        console.log(`❌ Skipping "${mallName}" - no mapping found`);
        continue;
      }
      
      const { id, engname } = mallInfo;
      const filename = `${id}-${engname}-products.json`;
      const filepath = path.join(OUTPUT_PATH, filename);
      
      // Check if file already exists
      if (mallHasProductFile(id, engname)) {
        report.skippedMalls.push({
          mall: mallName,
          id,
          engname,
          filename,
          reason: 'Product file already exists',
          productCount: products.length
        });
        report.summary.filesSkipped++;
        console.log(`⏭️  Skipping "${mallName}" - file already exists: ${filename}`);
        continue;
      }
      
      // Transform products to match expected format
      const transformedProducts = products.map((product, index) => ({
        id: `${engname}-${index + 1}`,
        title: product.name || '제품명 없음',
        description: '',
        price: product.price || '가격 정보 없음',
        originalPrice: product.originalPrice || product.price || '',
        discountPercent: product.discountPercent || '',
        imageUrl: product.imageUrl || '',
        externalUrl: product.url || '',
        category: product.category || '',
        isNew: false,
        isBest: false,
        mallId: engname,
        mallName: mallName,
        region: mallInfo.region || '',
        tags: []
      }));
      
      // Write to file
      fs.writeFileSync(filepath, JSON.stringify(transformedProducts, null, 2));
      
      report.processedMalls.push({
        mall: mallName,
        id,
        engname,
        filename,
        productCount: transformedProducts.length,
        url: mallData.url
      });
      
      report.summary.newFilesCreated++;
      report.summary.totalProducts += transformedProducts.length;
      
      console.log(`✅ Created ${filename} with ${transformedProducts.length} products`);
    }
    
  } catch (error) {
    report.errors.push({
      type: 'fatal',
      error: error.message
    });
    console.error('Fatal error:', error);
  }
  
  // Write summary report
  const reportPath = path.join(OUTPUT_PATH, 'conversion-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // Print summary
  console.log('\n📊 Conversion Summary:');
  console.log(`   Total malls found: ${report.summary.totalMallsFound}`);
  console.log(`   New files created: ${report.summary.newFilesCreated}`);
  console.log(`   Files skipped (already exist): ${report.summary.filesSkipped}`);
  console.log(`   Total products converted: ${report.summary.totalProducts}`);
  console.log(`   Errors: ${report.errors.length}`);
  console.log(`\n📄 Full report saved to: ${reportPath}`);
}

// Run the conversion
convertScrapedData().catch(console.error);