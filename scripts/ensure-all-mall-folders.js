const fs = require('fs').promises;
const path = require('path');

// Complete mall mapping from malls-clean.txt
const allMalls = {
  'mall_3_우리몰': 'wemall',
  'mall_4_참달성_달성군_': 'chamds',
  'mall_6_광주김치몰': 'kkimchi',
  'mall_7_대전사랑몰': 'ontongdaejeon',
  'mall_10_착착착': 'chack3',
  'mall_11_오산함께장터': 'osansemall',
  'mall_12_광명가치몰': 'gmsocial',
  'mall_13_양주농부마켓': 'yangju',
  'mall_14_마켓경기': 'marketgyeonggi',
  'mall_15_강원더몰': 'gwdmall',
  'mall_16_원주몰': 'wonju',
  'mall_17_강릉몰': 'gangneung',
  'mall_18_고성몰': 'goseong',
  'mall_19_동해몰': 'donghae',
  'mall_20_삼척몰': 'samcheok',
  'mall_21_양구몰': 'yanggu',
  'mall_22_양양몰': 'yangyang',
  'mall_23_영월몰': 'yeongwol',
  'mall_24_인제몰': 'inje',
  'mall_25_철원몰': 'cheorwon',
  'mall_26_정선몰': 'jeongseon',
  'mall_27_태백몰': 'taebaek',
  'mall_28_횡성몰': 'hoengseong',
  'mall_29_춘천몰': 'chuncheon',
  'mall_30_홍천몰': 'hongcheon',
  'mall_31_평창몰': 'gwpc',
  'mall_33_음성장터': 'esjang',
  'mall_34_진천몰': 'jcmall',
  'mall_35_괴산장터': 'goesan',
  'mall_36_농사랑': 'nongsarang',
  'mall_37_당진팜': 'dangjinfarm',
  'mall_38_e홍성장터': 'ehongseong',
  'mall_39_서산뜨레': 'seosanttre',
  'mall_40_부안_텃밭할매': 'buan',
  'mall_41_단풍미인_정읍_': 'danpoong',
  'mall_42_지평선몰_김제_': 'jps',
  'mall_43_전북생생장터': 'freshjb',
  'mall_44_익산몰': 'iksan',
  'mall_45_진안고원몰': 'jinan',
  'mall_46_장수몰': 'jangsu',
  'mall_47_고창마켓': 'gochang',
  'mall_48_임실몰': 'imsil',
  'mall_49_순창로컬푸드쇼핑몰': 'sunchang',
  'mall_50_해가람': 'haegaram',
  'mall_51_남도장터': 'jnmall',
  'mall_52_여수몰': 'yeosumall',
  'mall_53_해피굿팜': 'hgoodfarm',
  'mall_54_보성몰': 'boseong',
  'mall_55_나주몰': 'najumall',
  'mall_56_순천로컬푸드함께가게': 'sclocal',
  'mall_57_신안1004몰': 'shinan1004',
  'mall_58_장흥몰_산들해랑장흥몰_': 'okjmall',
  'mall_59_기찬들영암몰': 'yeongam',
  'mall_60_진도아리랑몰': 'jindoarirang',
  'mall_61_완도군이숍': 'wandofood',
  'mall_62_함평천지몰': 'hampyeong',
  'mall_63_해남미소': 'haenam',
  'mall_64_담양장터': 'damyang',
  'mall_65_초록믿음_강진_': 'greengj',
  'mall_66_화순팜': 'hwasunfarm',
  'mall_67_곡성몰_곡성군농특산물중개몰_': 'gokseongmall',
  'mall_68_사이소_경북몰_': 'cyso',
  'mall_69_상주_명실상주몰': 'sjmall',
  'mall_70_청도_청리브': 'cdmall',
  'mall_71_영주장날': 'yjmarket',
  'mall_72_안동장터': 'andongjang',
  'mall_73_청송몰': 'csmall',
  'mall_74_영양온심마켓': 'onsim',
  'mall_75_울릉도': 'ulmall',
  'mall_76_봉화장터': 'bmall',
  'mall_77_고령몰': 'grmall',
  'mall_78_김천노다지장터': 'gcnodaji',
  'mall_79_예천장터': 'ycjang',
  'mall_80_문경_새제의아침': 'mgmall',
  'mall_81_칠곡몰': 'cgmall',
  'mall_82_의성장날': 'esmall',
  'mall_83_울진몰': 'ujmall',
  'mall_84_영덕장터': 'ydmall',
  'mall_85_경산몰': 'gsmall',
  'mall_86_경주몰': 'gjmall',
  'mall_87_구미팜': 'gmmall',
  'mall_88_별빛촌장터_영천_': '01000',
  'mall_89_포항마켓': 'pohangmarket',
  'mall_90_e경남몰': 'egnmall',
  'mall_91_토요애_의령_': 'toyoae',
  'mall_92_남해몰': 'enamhae',
  'mall_93_산엔청_산청_': 'sanencheong',
  'mall_94_공룡나라_고성_': 'edinomall',
  'mall_95_함양몰': 'hamyang',
  'mall_96_진주드림': 'jinjudream',
  'mall_97_함안몰': 'hamanmall',
  'mall_98_김해온몰': 'gimhaemall',
  'mall_100_이제주몰': 'ejeju'
};

async function ensureAllMallFolders() {
  const analysisDir = path.join(__dirname, 'analysis');
  const outputDir = path.join(__dirname, 'output');
  
  try {
    console.log('Ensuring all mall folders exist...\n');
    
    const mallIdentifiers = Object.values(allMalls);
    const totalMalls = mallIdentifiers.length;
    let createdAnalysis = 0;
    let createdOutput = 0;
    let existingAnalysis = 0;
    let existingOutput = 0;
    
    for (const mallId of mallIdentifiers) {
      const analysisPath = path.join(analysisDir, mallId);
      const outputPath = path.join(outputDir, mallId);
      
      // Check and create analysis folder
      try {
        await fs.access(analysisPath);
        existingAnalysis++;
      } catch {
        await fs.mkdir(analysisPath, { recursive: true });
        console.log(`Created analysis/${mallId}/`);
        createdAnalysis++;
      }
      
      // Check and create output folder
      try {
        await fs.access(outputPath);
        existingOutput++;
      } catch {
        await fs.mkdir(outputPath, { recursive: true });
        console.log(`Created output/${mallId}/`);
        createdOutput++;
      }
    }
    
    console.log('\n=== Summary ===');
    console.log(`Total malls: ${totalMalls}`);
    console.log(`\nAnalysis folders:`);
    console.log(`  - Already existed: ${existingAnalysis}`);
    console.log(`  - Newly created: ${createdAnalysis}`);
    console.log(`  - Total: ${existingAnalysis + createdAnalysis}`);
    console.log(`\nOutput folders:`);
    console.log(`  - Already existed: ${existingOutput}`);
    console.log(`  - Newly created: ${createdOutput}`);
    console.log(`  - Total: ${existingOutput + createdOutput}`);
    
    // List any folders that have no files
    console.log('\n=== Empty Folders ===');
    const emptyFolders = [];
    
    for (const mallId of mallIdentifiers) {
      const analysisPath = path.join(analysisDir, mallId);
      const outputPath = path.join(outputDir, mallId);
      
      const analysisFiles = await fs.readdir(analysisPath);
      const outputFiles = await fs.readdir(outputPath);
      
      if (analysisFiles.length === 0 && outputFiles.length === 0) {
        emptyFolders.push(mallId);
      }
    }
    
    if (emptyFolders.length > 0) {
      console.log(`Found ${emptyFolders.length} malls with no files in either folder:`);
      emptyFolders.forEach(mall => console.log(`  - ${mall}`));
    } else {
      console.log('All malls have at least some files.');
    }
    
    // Save detailed report
    const report = {};
    for (const [mallKey, mallId] of Object.entries(allMalls)) {
      const analysisPath = path.join(analysisDir, mallId);
      const outputPath = path.join(outputDir, mallId);
      
      const analysisFiles = await fs.readdir(analysisPath);
      const outputFiles = await fs.readdir(outputPath);
      
      report[mallId] = {
        mallKey,
        analysisFiles: analysisFiles.length,
        outputFiles: outputFiles.length,
        totalFiles: analysisFiles.length + outputFiles.length
      };
    }
    
    await fs.writeFile(
      path.join(__dirname, 'mall-folders-complete-report.json'),
      JSON.stringify(report, null, 2)
    );
    
    console.log('\nDetailed report saved to mall-folders-complete-report.json');
    
  } catch (error) {
    console.error('Error ensuring mall folders:', error);
  }
}

// Run the check
ensureAllMallFolders();