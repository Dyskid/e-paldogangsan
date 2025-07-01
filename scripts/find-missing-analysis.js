const fs = require('fs');
const path = require('path');

// Read malls-clean.txt
const mallsCleanPath = '/mnt/c/Users/johndoe/Desktop/e-paldogangsan/data/raw/malls-clean.txt';
const mallsCleanContent = fs.readFileSync(mallsCleanPath, 'utf-8');

// Parse malls from malls-clean.txt
const malls = mallsCleanContent.split('\n')
  .filter(line => line.trim())
  .map((line, index) => {
    const parts = line.trim().split('|');
    if (parts.length >= 4) {
      return {
        number: index + 1,
        id: parts[0],
        name: parts[1],
        url: parts[2],
        region: parts[3]
      };
    }
    return null;
  })
  .filter(mall => mall !== null);

console.log(`Total malls in malls-clean.txt: ${malls.length}`);

// Get list of analysis files
const outputDir = '/mnt/c/Users/johndoe/Desktop/e-paldogangsan/scripts/output';
const analysisFiles = fs.readdirSync(outputDir)
  .filter(file => file.endsWith('-analysis.json') && file !== 'all-malls-analysis.json');

console.log(`\nTotal analysis files found: ${analysisFiles.length}`);

// Create a mapping of mall names to analysis files
const mallNameToFile = {
  // Mapping based on observed patterns
  '우리몰': 'wemall-analysis.json',
  '참달성 (달성군)': 'chamds-analysis.json',
  '광주김치몰': 'kkimchi-analysis.json',
  '대전사랑몰': 'ontongdaejeon-analysis.json',
  '착착착': 'chack3-structure-analysis.json',
  '오산함께장터': 'osansemall-main-analysis.json',
  '광명가치몰': 'gmsocial-analysis.json',
  '양주농부마켓': 'yangju-analysis.json',
  '강원더몰': 'gwdmall-analysis.json',
  '원주몰': 'wonju-analysis.json',
  '강릉몰': 'gangneung-analysis.json',
  '고성몰': 'goseong-analysis.json',
  '동해몰': 'donghae-analysis.json',
  '삼척몰': 'samcheok-analysis.json',
  '양구몰': 'yanggu-analysis.json',
  '양양몰': 'yangyang-analysis.json',
  '영월몰': 'yeongwol-analysis.json',
  '인제몰': 'inje-analysis.json',
  '철원몰': 'cheorwon-analysis.json',
  '정선몰': 'jeongseon-analysis.json',
  '태백몰': 'taebaek-analysis.json',
  '횡성몰': 'hoengseong-analysis.json',
  '춘천몰': 'chuncheon-analysis.json',
  '홍천몰': 'hongcheon-analysis.json',
  '평창몰': 'gwpc-analysis.json',
  '음성장터': 'esjang-structure-analysis.json',
  '진천몰': 'jcmall-analysis.json',
  '괴산장터': 'goesan-analysis.json',
  '농사랑': 'nongsarang-analysis.json',
  '당진팜': 'dangjinfarm-analysis.json',
  'e홍성장터': 'ehongseong-analysis.json',
  '서산뜨레': 'seosanttre-structure-analysis.json',
  '부안 텃밭할매': 'buan-structure-analysis.json',
  '단풍미인 (정읍)': 'danpoong-structure-analysis.json',
  '전북생생장터': 'freshjb-structure-analysis.json',
  '익산몰': 'iksan-structure-analysis.json',
  '장수몰': 'jangsu-structure-analysis.json',
  '고창마켓': 'gochang-structure-analysis.json',
  '해가람': 'haegaram-structure-analysis.json',
  '남도장터': 'jnmall-structure-analysis.json',
  '여수몰': 'yeosumall-structure-analysis.json',
  '보성몰': 'boseong-structure-analysis.json',
  '나주몰': 'najumall-structure-analysis.json',
  '순천로컬푸드함께가게': 'sclocal-structure-analysis.json',
  '신안1004몰': 'shinan1004-structure-analysis.json',
  '장흥몰 (산들해랑장흥몰)': 'okjmall-structure-analysis.json',
  '기찬들영암몰': 'yeongam-structure-analysis.json',
  '진도아리랑몰': 'jindoarirang-structure-analysis.json',
  '완도군이숍': 'wandofood-structure-analysis.json',
  '함평천지몰': 'hampyeong-structure-analysis.json',
  '담양장터': 'damyang-structure-analysis.json',
  '초록믿음(강진)': 'greengj-structure-analysis.json',
  '화순팜': 'hwasunfarm-structure-analysis.json',
  '곡성몰 (곡성군농특산물중개몰)': 'gokseongmall-structure-analysis.json',
  '사이소(경북몰)': 'cyso-structure-analysis.json',
  '상주 명실상주몰': 'sjmall-structure-analysis.json',
  '청도 청리브': 'cdmall-analysis.json',
  '영주장날': 'yjmarket-analysis.json',
  '청송몰': 'csmall-analysis.json',
  '영양온심마켓': 'onsim-analysis.json',
  '울릉도': 'ulmall-analysis.json',
  '봉화장터': 'bmall-analysis.json',
  '문경 새제의아침': 'mgmall-analysis.json',
  '칠곡몰': 'cgmall-analysis.json',
  '예천장터': 'ycjang-analysis.json',
  '이제주몰': 'jeju-mall-analysis.json'
};

// Find missing malls
const missingMalls = [];
const foundMalls = [];

malls.forEach(mall => {
  const analysisFile = mallNameToFile[mall.name];
  if (analysisFile && analysisFiles.includes(analysisFile)) {
    foundMalls.push({ ...mall, analysisFile });
  } else {
    missingMalls.push(mall);
  }
});

console.log(`\nMalls with analysis files: ${foundMalls.length}`);
console.log(`Malls WITHOUT analysis files: ${missingMalls.length}`);

console.log('\n=== MISSING MALLS (WITHOUT ANALYSIS FILES) ===\n');
missingMalls.forEach(mall => {
  console.log(`${mall.number}. ${mall.id} | ${mall.name} | ${mall.url} | ${mall.region}`);
});

// Save to JSON file
const missingMallsData = {
  totalMalls: malls.length,
  mallsWithAnalysis: foundMalls.length,
  mallsWithoutAnalysis: missingMalls.length,
  missingMalls: missingMalls
};

fs.writeFileSync(
  path.join(outputDir, 'missing-analysis-malls-final.json'),
  JSON.stringify(missingMallsData, null, 2)
);

console.log(`\nResults saved to: ${path.join(outputDir, 'missing-analysis-malls-final.json')}`);