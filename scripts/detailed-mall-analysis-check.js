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

// Get all files in output directory
const outputDir = path.join(__dirname, 'output');
const allFiles = fs.readdirSync(outputDir)
  .filter(file => file.endsWith('.json') && !file.includes('backup'));

// Track which malls have which files
const mallFileMapping = {};
const unmatchedFiles = new Set(allFiles);

// For each mall, try to find matching files
malls.forEach(mall => {
  const mallMatches = [];
  
  // Create various possible filename patterns
  const patterns = [];
  
  // From the URL
  if (mall.url) {
    const urlMatch = mall.url.match(/(?:https?:\/\/)?([\w-]+)/);
    if (urlMatch) {
      patterns.push(urlMatch[1].toLowerCase());
    }
  }
  
  // From the mall name
  const nameVariants = [
    mall.name.toLowerCase().replace(/[^a-z0-9가-힣]/g, ''),
    mall.name.toLowerCase().replace(/\s+/g, '-'),
    mall.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
  ];
  patterns.push(...nameVariants);
  
  // Special mappings based on known patterns
  const specialMappings = {
    '우리몰': 'wemall',
    '참달성 (달성군)': 'chamds',
    '광주김치몰': 'kkimchi',
    '대전사랑몰': 'ontongdaejeon',
    '착착착': 'chack3',
    '오산함께장터': 'osansemall',
    '광명가치몰': 'gmsocial',
    '양주농부마켓': 'yangju',
    '이제주몰': 'ejeju',
    '음성장터': 'esjang',
    '괴산장터': 'goesan',
    '전북생생장터': 'freshjb',
    '지평선몰(김제)': 'jps',
    '임실몰': 'imsilin',
    '순창로컬푸드쇼핑몰': 'sunchang',
    '해피굿팜': 'hgoodfarm',
    '순천로컬푸드함께가게': 'sclocal',
    '신안1004몰': 'shinan1004',
    '장흥몰 (산들해랑장흥몰)': 'okjmall',
    '기찬들영암몰': 'yeongam',
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
    '평창몰': 'gwpc',
  };
  
  if (specialMappings[mall.name]) {
    patterns.push(specialMappings[mall.name]);
  }
  
  // Find matching files
  allFiles.forEach(file => {
    const isMatch = patterns.some(pattern => 
      file.toLowerCase().includes(pattern) && 
      (file.includes('-analysis.json') || 
       file.includes('-products.json') || 
       file.includes('-registration-summary.json') ||
       file.includes('-verification-report.json'))
    );
    
    if (isMatch) {
      mallMatches.push(file);
      unmatchedFiles.delete(file);
    }
  });
  
  mallFileMapping[mall.name] = {
    id: mall.id,
    url: mall.url,
    region: mall.region,
    files: mallMatches,
    hasAnalysis: mallMatches.some(f => f.includes('-analysis.json')),
    hasProducts: mallMatches.some(f => f.includes('-products.json')),
    hasRegistration: mallMatches.some(f => f.includes('-registration-summary.json')),
    hasVerification: mallMatches.some(f => f.includes('-verification-report.json'))
  };
});

// Generate report
const missingAnalysis = [];
const missingAnyFile = [];

Object.entries(mallFileMapping).forEach(([mallName, data]) => {
  if (!data.hasAnalysis) {
    missingAnalysis.push({
      name: mallName,
      ...data
    });
  }
  if (data.files.length === 0) {
    missingAnyFile.push({
      name: mallName,
      ...data
    });
  }
});

// Output detailed report
console.log('===== Detailed Mall Analysis Report =====\n');
console.log(`Total malls: ${malls.length}`);
console.log(`Total JSON files in output: ${allFiles.length}`);
console.log(`Malls missing analysis files: ${missingAnalysis.length}`);
console.log(`Malls with no files at all: ${missingAnyFile.length}`);
console.log(`Unmatched files: ${unmatchedFiles.size}\n`);

if (missingAnyFile.length > 0) {
  console.log('Malls with NO files at all:');
  console.log('===========================');
  missingAnyFile.forEach((mall, index) => {
    console.log(`${index + 1}. ${mall.name}`);
    console.log(`   ID: ${mall.id}`);
    console.log(`   URL: ${mall.url}`);
    console.log(`   Region: ${mall.region}\n`);
  });
}

if (missingAnalysis.length > 0 && missingAnalysis.length !== missingAnyFile.length) {
  console.log('\nMalls missing ANALYSIS files (but have other files):');
  console.log('==================================================');
  const partialMalls = missingAnalysis.filter(m => m.files.length > 0);
  partialMalls.forEach((mall, index) => {
    console.log(`${index + 1}. ${mall.name}`);
    console.log(`   Available files: ${mall.files.join(', ')}\n`);
  });
}

// Save detailed report
const reportPath = path.join(outputDir, 'detailed-mall-file-mapping.json');
fs.writeFileSync(reportPath, JSON.stringify({
  summary: {
    totalMalls: malls.length,
    totalFiles: allFiles.length,
    missingAnalysisCount: missingAnalysis.length,
    missingAnyFileCount: missingAnyFile.length,
    unmatchedFilesCount: unmatchedFiles.size
  },
  missingAnalysis,
  missingAnyFile,
  unmatchedFiles: Array.from(unmatchedFiles),
  fullMapping: mallFileMapping
}, null, 2));

console.log(`\nDetailed report saved to: ${reportPath}`);