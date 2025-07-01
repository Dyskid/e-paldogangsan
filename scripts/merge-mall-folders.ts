import { promises as fs } from 'fs';
import path from 'path';

interface Mall {
  id: string;
  name: string;
  url: string;
  region: string;
}

async function main() {
  const mallsJsonPath = path.join(process.cwd(), 'data', 'raw', 'malls.json');
  const mallsDir = path.join(process.cwd(), 'malls');

  // Read malls.json
  const mallsData = JSON.parse(await fs.readFile(mallsJsonPath, 'utf-8')) as Mall[];
  
  // Get all folders in malls directory
  const entries = await fs.readdir(mallsDir, { withFileTypes: true });
  const folders = entries.filter(entry => entry.isDirectory()).map(entry => entry.name);
  
  console.log(`Found ${folders.length} folders in malls directory`);
  console.log('Sample folders:', folders.slice(0, 10));

  // Create a map of all mall IDs for quick lookup
  const mallIds = new Set(mallsData.map(mall => mall.id));
  console.log('Sample mall IDs:', Array.from(mallIds).slice(0, 10));

  // Identify non-ID folders and their corresponding ID folders
  const mergePairs: Array<{ from: string; to: string }> = [];
  
  // Create mappings between Korean folder names and English folder names
  const koreanToEnglishMap: { [key: string]: string } = {
    // Folders with underscores
    '곡성몰_곡성군농특산물중개몰': 'gokseongmall',
    '공룡나라_고성': 'edinomall',
    '단풍미인_정읍': 'danpoong',
    '별빛촌장터_영천': '01000',
    '사이소_경북몰': 'cyso',
    '산엔청_산청': 'sanencheong',
    '장흥몰_산들해랑장흥몰': 'okjmall',
    '지평선몰_김제': 'jps',
    '참달성_달성군': 'chamds',
    '초록믿음_강진': 'greengj',
    '토요애_의령': 'toyoae',
    '문경_새제의아침': 'mgmall',
    '부안_텃밭할매': 'buan',
    '상주_명실상주몰': 'sjmall',
    '청도_청리브': 'cdmall',
    
    // Simple Korean folders
    '강릉몰': 'gangneung',
    '강원더몰': 'gwdmall',
    '경산몰': 'gsmall',
    '경주몰': 'gjmall',
    '고령몰': 'grmall',
    '고성몰': 'goseong',
    '고창마켓': 'gochang',
    '광명가치몰': 'gmsocial',
    '광주김치몰': 'kkimchi',
    '괴산장터': 'goesan',
    '구미팜': 'gmmall',
    '기찬들영암몰': 'yeongam',
    '김천노다지장터': 'gcnodaji',
    '김해온몰': 'gimhaemall',
    '나주몰': 'najumall',
    '남도장터': 'jnmall',
    '남해몰': 'enamhae',
    '농사랑': 'nongsarang',
    '담양장터': 'damyang',
    '당진팜': 'dangjinfarm',
    '대전사랑몰': 'ontongdaejeon',
    '동해몰': 'donghae',
    '마켓경기': 'marketgyeonggi',
    '보성몰': 'boseong',
    '봉화장터': 'bmall',
    '삼척몰': 'samcheok',
    '서산뜨레': 'seosanttre',
    '순창로컬푸드쇼핑몰': 'sunchang',
    '순천로컬푸드함께가게': 'sclocal',
    '신안1004몰': 'shinan1004',
    '안동장터': 'andongjang',
    '양구몰': 'yanggu',
    '양양몰': 'yangyang',
    '양주농부마켓': 'yangju',
    '여수몰': 'yeosumall',
    '영덕장터': 'ydmall',
    '영양온심마켓': 'onsim',
    '영월몰': 'yeongwol',
    '영주장날': 'yjmarket',
    '예천장터': 'ycjang',
    '오산함께장터': 'osansemall',
    '완도군이숍': 'wandofood',
    '우리몰': 'wemall',
    '울릉도': 'ulmall',
    '울진몰': 'ujmall',
    '원주몰': 'wonju',
    '음성장터': 'esjang',
    '의성장날': 'esmall',
    '이제주몰': 'ejeju',
    '익산몰': 'iksan',
    '인제몰': 'inje',
    '임실몰': 'imsil',
    '장수몰': 'jangsu',
    '전북생생장터': 'freshjb',
    '정선몰': 'jeongseon',
    '진도아리랑몰': 'jindoarirang',
    '진안고원몰': 'jinan',
    '진주드림': 'jinjudream',
    '진천몰': 'jcmall',
    '착착착': 'chack3',
    '철원몰': 'cheorwon',
    '청송몰': 'csmall',
    '춘천몰': 'chuncheon',
    '칠곡몰': 'cgmall',
    '태백몰': 'taebaek',
    '평창몰': 'gwpc',
    '포항마켓': 'pohangmarket',
    '함안몰': 'hamanmall',
    '함양몰': 'hamyang',
    '함평천지몰': 'hampyeong',
    '해가람': 'haegaram',
    '해남미소': 'hnmiso',
    '해피굿팜': 'hgoodfarm',
    '홍천몰': 'hongcheon',
    '화순팜': 'hwasunfarm',
    '횡성몰': 'hoengseong',
    'e경남몰': 'egnmall',
    'e홍성장터': 'ehongseong'
  };

  // Look for Korean name folders and merge them with their English counterparts
  const koreanFolders = folders.filter(f => /[가-힣]/.test(f));
  console.log(`Found ${koreanFolders.length} Korean folders:`, koreanFolders.slice(0, 10));
  
  for (const folder of folders) {
    // Check if this is a Korean folder that's also an ID
    if (mallIds.has(folder) && /[가-힣]/.test(folder)) {
      // This is a Korean ID folder, check if we have an English mapping
      const englishFolder = koreanToEnglishMap[folder];
      if (englishFolder && folders.includes(englishFolder)) {
        mergePairs.push({ from: folder, to: englishFolder });
      } else if (englishFolder && !folders.includes(englishFolder)) {
        console.log(`English folder not found for ${folder}: ${englishFolder}`);
      }
    }
  }

  console.log(`Found ${mergePairs.length} folders to merge:`);
  mergePairs.forEach(pair => {
    console.log(`  ${pair.from} → ${pair.to}`);
  });

  // Perform the merging
  for (const { from, to } of mergePairs) {
    const fromPath = path.join(mallsDir, from);
    const toPath = path.join(mallsDir, to);
    
    console.log(`\nMerging ${from} → ${to}`);
    
    // Get all files in the source folder
    const sourceEntries = await fs.readdir(fromPath, { withFileTypes: true });
    
    for (const entry of sourceEntries) {
      const sourcePath = path.join(fromPath, entry.name);
      const destPath = path.join(toPath, entry.name);
      
      if (entry.isFile()) {
        // Check if file already exists in destination
        try {
          await fs.access(destPath);
          console.log(`  File ${entry.name} already exists in destination, skipping`);
        } catch {
          // File doesn't exist, copy it
          await fs.copyFile(sourcePath, destPath);
          console.log(`  Copied ${entry.name}`);
        }
      } else if (entry.isDirectory()) {
        // For directories, we'd need recursive copying
        console.log(`  Skipping directory ${entry.name} (manual review needed)`);
      }
    }
    
    // Remove the source folder after merging
    try {
      // Only remove if folder is empty or contains only the copied files
      const remainingEntries = await fs.readdir(fromPath);
      if (remainingEntries.length === 0 || 
          remainingEntries.every(e => sourceEntries.some(se => se.name === e))) {
        await fs.rm(fromPath, { recursive: true, force: true });
        console.log(`  Removed source folder ${from}`);
      } else {
        console.log(`  Source folder ${from} has additional files, not removing`);
      }
    } catch (error) {
      console.error(`  Error removing ${from}:`, error);
    }
  }

  console.log('\nMerge complete!');
}

main().catch(console.error);