const fs = require('fs');
const path = require('path');

// Read the malls from the clean file
const mallsCleanPath = path.join(__dirname, '../data/raw/malls-clean.txt');
const mallsCleanContent = fs.readFileSync(mallsCleanPath, 'utf8');

// Parse malls from the clean file
const malls = mallsCleanContent.split('\n')
  .filter(line => line.trim())
  .map(line => {
    const parts = line.split('|');
    return {
      id: parts[0],
      name: parts[1],
      url: parts[2],
      region: parts[3]
    };
  });

// Get all analysis files
const outputDir = path.join(__dirname, 'output');
const analysisFiles = fs.readdirSync(outputDir)
  .filter(file => file.endsWith('-analysis.json') || file.endsWith('-structure-analysis.json'));

// Extract mall identifiers from analysis files
const analyzedMalls = new Set();
analysisFiles.forEach(file => {
  // Extract the mall identifier from the filename
  const mallId = file.replace(/-analysis\.json$/, '').replace(/-structure-analysis\.json$/, '');
  analyzedMalls.add(mallId);
});

// Create a mapping of mall names to their expected analysis file names
const mallNameToFileMap = {
  '우리몰': 'wemall',
  '참달성 (달성군)': 'chamds',
  '광주김치몰': 'kkimchi',
  '대전사랑몰': 'ontongdaejeon',
  '착착착': 'chack3',
  '오산함께장터': 'osansemall',
  '광명가치몰': 'gmsocial',
  '양주농부마켓': 'yangju',
  '마켓경기': 'marketgyeonggi',
  '강원더몰': 'gwdmall',
  '원주몰': 'wonju',
  '강릉몰': 'gangneung',
  '고성몰': 'goseong',
  '동해몰': 'donghae',
  '삼척몰': 'samcheok',
  '양구몰': 'yanggu',
  '양양몰': 'yangyang',
  '영월몰': 'yeongwol',
  '인제몰': 'inje',
  '철원몰': 'cheorwon',
  '정선몰': 'jeongseon',
  '태백몰': 'taebaek',
  '횡성몰': 'hoengseong',
  '춘천몰': 'chuncheon',
  '홍천몰': 'hongcheon',
  '평창몰': 'gwpc',
  '음성장터': 'esjang',
  '진천몰': 'jcmall',
  '괴산장터': 'goesan',
  '농사랑': 'nongsarang',
  '당진팜': 'dangjinfarm',
  'e홍성장터': 'ehongseong',
  '서산뜨레': 'seosanttre',
  '부안 텃밭할매': 'buan',
  '단풍미인 (정읍)': 'danpoong',
  '지평선몰(김제)': 'jps',
  '전북생생장터': 'freshjb',
  '익산몰': 'iksan',
  '진안고원몰': 'jinan',
  '장수몰': 'jangsu',
  '고창마켓': 'gochang',
  '임실몰': 'imsilin',
  '순창로컬푸드쇼핑몰': 'sunchang',
  '해가람': 'haegaram',
  '남도장터': 'jnmall',
  '여수몰': 'yeosumall',
  '해피굿팜': 'hgoodfarm',
  '보성몰': 'boseong',
  '나주몰': 'najumall',
  '순천로컬푸드함께가게': 'sclocal',
  '신안1004몰': 'shinan1004',
  '장흥몰 (산들해랑장흥몰)': 'okjmall',
  '기찬들영암몰': 'yeongam',
  '진도아리랑몰': 'jindoarirang',
  '완도군이숍': 'wandofood',
  '함평천지몰': 'hampyeong',
  '해남미소': 'hnmiso',
  '담양장터': 'damyang',
  '초록믿음(강진)': 'greengj',
  '화순팜': 'hwasunfarm',
  '곡성몰 (곡성군농특산물중개몰)': 'gokseongmall',
  '사이소(경북몰)': 'cyso',
  '상주 명실상주몰': 'sjmall',
  '청도 청리브': 'cdmall',
  '영주장날': 'yjmarket',
  '안동장터': 'andongjang',
  '청송몰': 'csmall',
  '영양온심마켓': 'onsim',
  '울릉도': 'ulmall',
  '봉화장터': 'bmall',
  '고령몰': 'grmall',
  '김천노다지장터': 'gcnodaji',
  '예천장터': 'ycjang',
  '문경 새제의아침': 'mgmall',
  '칠곡몰': 'cgmall',
  '의성장날': 'esmall',
  '울진몰': 'ujmall',
  '영덕장터': 'ydmall',
  '경산몰': 'gsmall',
  '경주몰': 'gjmall',
  '구미팜': 'gmmall',
  '별빛촌장터(영천)': '01000',
  '포항마켓': 'pohangmarket',
  'e경남몰': 'egnmall',
  '토요애 (의령)': 'toyoae',
  '남해몰': 'enamhae',
  '산엔청 (산청)': 'sanencheong',
  '공룡나라 (고성)': 'edinomall',
  '함양몰': 'hamyang',
  '진주드림': 'jinjudream',
  '함안몰': 'hamanmall',
  '김해온몰': 'gimhaemall',
  '이제주몰': 'ejeju'
};

// Find malls without analysis files
const missingAnalysis = [];
malls.forEach(mall => {
  const expectedFileName = mallNameToFileMap[mall.name];
  
  // Check if we have any analysis file for this mall
  let hasAnalysis = false;
  
  if (expectedFileName) {
    hasAnalysis = analyzedMalls.has(expectedFileName) || 
                  analyzedMalls.has(`${expectedFileName}-analysis`) ||
                  analyzedMalls.has(`${expectedFileName}-structure-analysis`);
  }
  
  // Also check using the mall ID
  const mallIdCheck = mall.id.replace('mall_', '').replace(/_/g, '');
  if (!hasAnalysis) {
    hasAnalysis = Array.from(analyzedMalls).some(analyzed => 
      analyzed.toLowerCase().includes(mall.name.toLowerCase().replace(/[^a-z0-9]/gi, '')) ||
      analyzed.includes(mallIdCheck)
    );
  }
  
  if (!hasAnalysis) {
    missingAnalysis.push(mall);
  }
});

// Special cases - check for alternative names
const specialCases = {
  '이제주몰': ['jeju-mall', 'ejeju'],
  '마켓경기': ['marketgyeonggi', 'marketgg'],
  '진안고원몰': ['jinan', 'jinangowon'],
  '임실몰': ['imsilin', 'imsil'],
  '순창로컬푸드쇼핑몰': ['sunchang', 'schfarm'],
  '해피굿팜': ['hgoodfarm', 'happygoodfarm'],
  '해남미소': ['hnmiso', 'haenammiso'],
  '고령몰': ['grmall', 'goryeong'],
  '김천노다지장터': ['gcnodaji', 'gimcheon'],
  '의성장날': ['esmall', 'uiseong'],
  '울진몰': ['ujmall', 'uljin'],
  '영덕장터': ['ydmall', 'yeongdeok'],
  '경산몰': ['gsmall', 'gyeongsan'],
  '경주몰': ['gjmall', 'gyeongju'],
  '구미팜': ['gmmall', 'gumi'],
  '별빛촌장터(영천)': ['01000', 'yeongcheon'],
  '포항마켓': ['pohangmarket', 'pohang'],
  'e경남몰': ['egnmall', 'gyeongnam'],
  '토요애 (의령)': ['toyoae', 'uiryeong'],
  '남해몰': ['enamhae', 'namhae'],
  '산엔청 (산청)': ['sanencheong', 'sancheong'],
  '공룡나라 (고성)': ['edinomall', 'goseong-gyeongnam'],
  '함양몰': ['hamyang', 'hamyangmall'],
  '진주드림': ['jinjudream', 'jinju'],
  '함안몰': ['hamanmall', 'haman'],
  '김해온몰': ['gimhaemall', 'gimhae']
};

// Re-check missing analysis with special cases
const stillMissingAnalysis = missingAnalysis.filter(mall => {
  const alternativeNames = specialCases[mall.name];
  if (alternativeNames) {
    return !alternativeNames.some(altName => 
      Array.from(analyzedMalls).some(analyzed => analyzed.includes(altName))
    );
  }
  return true;
});

// Output results
console.log('===== Mall Analysis Comparison Report =====\n');
console.log(`Total malls in malls-clean.txt: ${malls.length}`);
console.log(`Total analysis files found: ${analysisFiles.length}`);
console.log(`\nMalls missing analysis files: ${stillMissingAnalysis.length}\n`);

if (stillMissingAnalysis.length > 0) {
  console.log('List of malls without analysis files:');
  console.log('=====================================');
  stillMissingAnalysis.forEach((mall, index) => {
    console.log(`${index + 1}. ${mall.name} (ID: ${mall.id})`);
    console.log(`   URL: ${mall.url}`);
    console.log(`   Region: ${mall.region}`);
    console.log('');
  });
}

// Save the missing malls to a JSON file
const outputPath = path.join(outputDir, 'missing-analysis-malls.json');
fs.writeFileSync(outputPath, JSON.stringify({
  summary: {
    totalMalls: malls.length,
    totalAnalysisFiles: analysisFiles.length,
    missingAnalysisCount: stillMissingAnalysis.length
  },
  missingMalls: stillMissingAnalysis
}, null, 2));

console.log(`\nDetailed report saved to: ${outputPath}`);