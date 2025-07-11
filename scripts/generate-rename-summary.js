const fs = require('fs');
const path = require('path');

// Load malls data
const mallsData = require('../assets/malls.json');

// Create mapping of various name patterns to mall data
const nameToMallMap = {};

// Helper function to normalize names for matching
function normalizeName(name) {
  return name.toLowerCase()
    .replace(/[-_\s]/g, '') // Remove hyphens, underscores, spaces
    .replace(/mall|mol|market|장터|몰/g, ''); // Remove common suffixes
}

// Build the mapping (same as in rename script)
mallsData.forEach(mall => {
  const id = mall.id;
  const engname = mall.engname;
  
  // Add various possible name patterns
  const baseEngName = engname.replace(/-/g, '');
  
  // Common patterns found in file names
  nameToMallMap[baseEngName] = { id, engname };
  nameToMallMap[normalizeName(engname)] = { id, engname };
  
  // Special cases based on observed patterns
  if (engname.includes('cham-dalseong')) {
    nameToMallMap['chamds'] = { id, engname };
    nameToMallMap['chamdalseong'] = { id, engname };
  }
  if (engname.includes('gwangju-kimchi')) {
    nameToMallMap['kkimchi'] = { id, engname };
  }
  if (engname.includes('daejeon-love')) {
    nameToMallMap['ontongdaejeon'] = { id, engname };
  }
  if (engname.includes('we-mall')) {
    nameToMallMap['wemall'] = { id, engname };
  }
  if (engname.includes('e-jeju')) {
    nameToMallMap['ejeju'] = { id, engname };
    nameToMallMap['jejumall'] = { id, engname };
    nameToMallMap['jeju'] = { id, engname };
  }
  if (engname.includes('gwangmyeong-value')) {
    nameToMallMap['gmsocial'] = { id, engname };
  }
  if (engname.includes('yangju-farmers')) {
    nameToMallMap['yangju'] = { id, engname };
  }
  if (engname.includes('osan-together')) {
    nameToMallMap['osansemall'] = { id, engname };
  }
  if (engname.includes('cyso')) {
    nameToMallMap['cyso'] = { id, engname };
  }
  if (engname.includes('chack-chack')) {
    nameToMallMap['chack3'] = { id, engname };
  }
  if (engname.includes('gangwon-the')) {
    nameToMallMap['gwdmall'] = { id, engname };
  }
  if (engname.includes('suncheon-local-food')) {
    nameToMallMap['sclocal'] = { id, engname };
  }
  if (engname.includes('jeonbuk-fresh')) {
    nameToMallMap['freshjb'] = { id, engname };
  }
  if (engname.includes('namdo-market')) {
    nameToMallMap['jnmall'] = { id, engname };
  }
  if (engname.includes('buan-grandmas')) {
    nameToMallMap['buan'] = { id, engname };
  }
  if (engname.includes('maple-beauty')) {
    nameToMallMap['danpoong'] = { id, engname };
  }
  if (engname.includes('horizon-mall')) {
    nameToMallMap['jps'] = { id, engname };
    nameToMallMap['jpsmall'] = { id, engname };
  }
  if (engname.includes('iksan-mall')) {
    nameToMallMap['iksan'] = { id, engname };
    nameToMallMap['iksanmall'] = { id, engname };
  }
  if (engname.includes('jinan-highland')) {
    nameToMallMap['jinan'] = { id, engname };
  }
  if (engname.includes('jangsu-mall')) {
    nameToMallMap['jangsu'] = { id, engname };
  }
  if (engname.includes('gochang-market')) {
    nameToMallMap['gochang'] = { id, engname };
    nameToMallMap['noblegochang'] = { id, engname };
  }
  if (engname.includes('imsil-mall')) {
    nameToMallMap['imsil'] = { id, engname };
    nameToMallMap['imsilin'] = { id, engname };
  }
  if (engname.includes('sunchang-local')) {
    nameToMallMap['sunchang'] = { id, engname };
  }
  if (engname.includes('haegaram')) {
    nameToMallMap['haegaram'] = { id, engname };
  }
  if (engname.includes('yeosu-mall')) {
    nameToMallMap['yeosu'] = { id, engname };
    nameToMallMap['yeosumall'] = { id, engname };
  }
  if (engname.includes('happy-good-farm')) {
    nameToMallMap['happygoodfarm'] = { id, engname };
    nameToMallMap['hgoodfarm'] = { id, engname };
  }
  if (engname.includes('boseong-mall')) {
    nameToMallMap['boseong'] = { id, engname };
    nameToMallMap['boseongmall'] = { id, engname };
  }
  if (engname.includes('naju-mall')) {
    nameToMallMap['naju'] = { id, engname };
    nameToMallMap['najumall'] = { id, engname };
  }
  if (engname.includes('shinan-1004')) {
    nameToMallMap['shinan1004'] = { id, engname };
  }
  if (engname.includes('jangheung-mall')) {
    nameToMallMap['okjmall'] = { id, engname };
  }
  if (engname.includes('gichandeul-yeongam')) {
    nameToMallMap['yeongam'] = { id, engname };
    nameToMallMap['yeongammall'] = { id, engname };
  }
  if (engname.includes('jindo-arirang')) {
    nameToMallMap['jindoarirang'] = { id, engname };
  }
  if (engname.includes('wando-county')) {
    nameToMallMap['wandofood'] = { id, engname };
  }
  if (engname.includes('hampyeong-cheonji')) {
    nameToMallMap['hampyeong'] = { id, engname };
  }
  if (engname.includes('haenam-smile')) {
    nameToMallMap['haenam'] = { id, engname };
    nameToMallMap['hnmiso'] = { id, engname };
  }
  if (engname.includes('damyang-market')) {
    nameToMallMap['damyang'] = { id, engname };
  }
  if (engname.includes('green-trust')) {
    nameToMallMap['greengj'] = { id, engname };
  }
  if (engname.includes('hwasun-farm')) {
    nameToMallMap['hwasun'] = { id, engname };
    nameToMallMap['hwasunfarm'] = { id, engname };
  }
  if (engname.includes('gokseong-mall')) {
    nameToMallMap['gokseong'] = { id, engname };
    nameToMallMap['gokseongmall'] = { id, engname };
  }
  if (engname.includes('e-gyeongnam')) {
    nameToMallMap['egnmall'] = { id, engname };
  }
  if (engname.includes('toyoae')) {
    nameToMallMap['toyoae'] = { id, engname };
  }
  if (engname.includes('namhae-mall')) {
    nameToMallMap['namhae'] = { id, engname };
    nameToMallMap['enamhae'] = { id, engname };
  }
  if (engname.includes('san-n-cheong')) {
    nameToMallMap['sanencheong'] = { id, engname };
  }
  if (engname.includes('dinosaur-land')) {
    nameToMallMap['edinomall'] = { id, engname };
  }
  if (engname.includes('hamyang-mall')) {
    nameToMallMap['hamyang'] = { id, engname };
  }
  if (engname.includes('jinju-dream')) {
    nameToMallMap['jinju'] = { id, engname };
    nameToMallMap['jinjudream'] = { id, engname };
  }
  if (engname.includes('haman-mall')) {
    nameToMallMap['haman'] = { id, engname };
    nameToMallMap['hamanmall'] = { id, engname };
  }
  if (engname.includes('gimhae-on')) {
    nameToMallMap['gimhae'] = { id, engname };
    nameToMallMap['gimhaemall'] = { id, engname };
  }
  
  // Additional mappings for other mall names
  const simpleName = engname.split('-')[0];
  nameToMallMap[simpleName] = { id, engname };
  
  // Map based on mall name patterns
  if (engname.includes('mall')) {
    const prefix = engname.split('-mall')[0];
    nameToMallMap[prefix] = { id, engname };
    nameToMallMap[prefix + 'mall'] = { id, engname };
  }
});

// Special mappings for specific patterns found in files
nameToMallMap['esjang'] = nameToMallMap['eumseongjang'] || { id: 27, engname: 'eumseong-market' };
nameToMallMap['gsjangter'] = nameToMallMap['goesanjangter'] || { id: 29, engname: 'goesan-market' };
nameToMallMap['nongsarang'] = { id: 30, engname: 'farm-love' };
nameToMallMap['dangjinfarm'] = { id: 31, engname: 'dangjin-farm' };
nameToMallMap['ehongseong'] = { id: 32, engname: 'e-hongseong-market' };
nameToMallMap['seosanttre'] = { id: 33, engname: 'seosan-ttre' };
nameToMallMap['sjmall'] = { id: 63, engname: 'sangju-myeongsil-sangju-mall' };
nameToMallMap['sjlocal'] = nameToMallMap['sjmall'];
nameToMallMap['cdmall'] = { id: 64, engname: 'cheongdo-cheong-live' };
nameToMallMap['yjmarket'] = { id: 65, engname: 'yeongju-market-day' };
nameToMallMap['andongjang'] = { id: 66, engname: 'andong-market' };
nameToMallMap['csmall'] = { id: 67, engname: 'cheongsong-mall' };
nameToMallMap['onsim'] = { id: 68, engname: 'yeongyang-onsim-market' };
nameToMallMap['ulmall'] = { id: 69, engname: 'ulleungdo' };
nameToMallMap['bmall'] = { id: 70, engname: 'bonghwa-market' };
nameToMallMap['grmall'] = { id: 71, engname: 'goryeong-mall' };
nameToMallMap['gcnodaji'] = { id: 72, engname: 'gimcheon-nodaji-market' };
nameToMallMap['ycjang'] = { id: 73, engname: 'yecheon-market' };
nameToMallMap['mgmall'] = { id: 74, engname: 'mungyeong-morning-of-saejae' };
nameToMallMap['cgmall'] = { id: 75, engname: 'chilgok-mall' };
nameToMallMap['esmall'] = { id: 76, engname: 'uiseong-market-day' };
nameToMallMap['ujmall'] = { id: 77, engname: 'uljin-mall' };
nameToMallMap['ydmall'] = { id: 78, engname: 'yeongdeok-market' };
nameToMallMap['gsmall'] = { id: 79, engname: 'gyeongsan-mall' };
nameToMallMap['gjmall'] = { id: 80, engname: 'gyeongju-mall' };
nameToMallMap['gmmall'] = { id: 81, engname: 'gumi-farm' };
nameToMallMap['pohangmarket'] = { id: 83, engname: 'pohang-market' };

// Additional direct mappings for files found
nameToMallMap['wonju'] = { id: 11, engname: 'wonju-mall' };
nameToMallMap['gangneung'] = { id: 12, engname: 'gangneung-mall' };
nameToMallMap['goseong'] = { id: 13, engname: 'goseong-mall' };
nameToMallMap['donghae'] = { id: 14, engname: 'donghae-mall' };
nameToMallMap['samcheok'] = { id: 15, engname: 'samcheok-mall' };
nameToMallMap['yanggu'] = { id: 16, engname: 'yanggu-mall' };
nameToMallMap['yangyang'] = { id: 17, engname: 'yangyang-mall' };
nameToMallMap['yeongwol'] = { id: 18, engname: 'yeongwol-mall' };
nameToMallMap['inje'] = { id: 19, engname: 'inje-mall' };
nameToMallMap['cheorwon'] = { id: 20, engname: 'cheorwon-mall' };
nameToMallMap['jeongseon'] = { id: 21, engname: 'jeongseon-mall' };
nameToMallMap['taebaek'] = { id: 22, engname: 'taebaek-mall' };
nameToMallMap['hoengseong'] = { id: 23, engname: 'hoengseong-mall' };
nameToMallMap['chuncheon'] = { id: 24, engname: 'chuncheon-mall' };
nameToMallMap['hongcheon'] = { id: 25, engname: 'hongcheon-mall' };
nameToMallMap['pyeongchang'] = { id: 26, engname: 'pyeongchang-mall' };
nameToMallMap['gwpc'] = { id: 26, engname: 'pyeongchang-mall' };
nameToMallMap['jcmall'] = { id: 28, engname: 'jincheon-mall' };
nameToMallMap['goesan'] = { id: 29, engname: 'goesan-market' };

// Function to find mall info from filename
function findMallInfo(filename) {
  // Remove extension and split by dash or hyphen
  const baseName = path.basename(filename, path.extname(filename));
  const parts = baseName.split(/[-_]/);
  
  // Try to find a match starting from the beginning
  for (let i = 1; i <= parts.length; i++) {
    const testName = parts.slice(0, i).join('').toLowerCase();
    if (nameToMallMap[testName]) {
      return {
        mall: nameToMallMap[testName],
        remainingParts: parts.slice(i)
      };
    }
  }
  
  // Try normalized version
  const normalizedBase = normalizeName(parts[0]);
  if (nameToMallMap[normalizedBase]) {
    return {
      mall: nameToMallMap[normalizedBase],
      remainingParts: parts.slice(1)
    };
  }
  
  return null;
}

// Function to generate new filename
function generateNewFilename(oldFilename, mallInfo) {
  const ext = path.extname(oldFilename);
  const { mall, remainingParts } = mallInfo;
  
  // Reconstruct the file type from remaining parts
  const fileType = remainingParts.join('-');
  
  if (fileType) {
    return `${mall.id}-${mall.engname}-${fileType}${ext}`;
  } else {
    // If no file type, just use the original filename pattern
    return `${mall.id}-${mall.engname}${ext}`;
  }
}

// Function to process directory
function processDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);
  const renameMap = [];
  const unmatchedFiles = [];
  
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isFile()) {
      const mallInfo = findMallInfo(file);
      if (mallInfo) {
        const newFilename = generateNewFilename(file, mallInfo);
        renameMap.push({
          oldPath: filePath,
          newPath: path.join(dirPath, newFilename),
          oldName: file,
          newName: newFilename,
          mallId: mallInfo.mall.id,
          mallEngName: mallInfo.mall.engname
        });
      } else {
        unmatchedFiles.push(file);
      }
    }
  });
  
  return { renameMap, unmatchedFiles };
}

// Main execution
const outputDir = path.join(__dirname, 'output');
const distDir = path.join(__dirname, 'dist');

console.log('=== Generating Rename Summary ===\n');

// Process output directory
const outputResults = processDirectory(outputDir);

// Process dist directory  
const distResults = processDirectory(distDir);

// Combine all results
const allRenames = [...outputResults.renameMap, ...distResults.renameMap];
const allUnmatched = [...outputResults.unmatchedFiles, ...distResults.unmatchedFiles];

// Sort by mall ID for better organization
allRenames.sort((a, b) => a.mallId - b.mallId);

// Generate summary
const summary = {
  totalFiles: allRenames.length + allUnmatched.length,
  filesToRename: allRenames.length,
  unmatchedFiles: allUnmatched.length,
  renamesByMall: {},
  unmatchedFilesList: allUnmatched,
  fullRenameList: allRenames.map(r => ({
    old: r.oldName,
    new: r.newName,
    mallId: r.mallId,
    mallEngName: r.mallEngName
  }))
};

// Group renames by mall
allRenames.forEach(rename => {
  const mallKey = `${rename.mallId}-${rename.mallEngName}`;
  if (!summary.renamesByMall[mallKey]) {
    summary.renamesByMall[mallKey] = {
      mallId: rename.mallId,
      mallEngName: rename.mallEngName,
      files: []
    };
  }
  summary.renamesByMall[mallKey].files.push({
    old: rename.oldName,
    new: rename.newName
  });
});

// Write summary to file
const summaryPath = path.join(__dirname, 'output', 'rename-summary.json');
fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

console.log(`Summary written to: ${summaryPath}`);
console.log(`\nTotal files found: ${summary.totalFiles}`);
console.log(`Files to rename: ${summary.filesToRename}`);
console.log(`Unmatched files: ${summary.unmatchedFiles}`);
console.log(`\nMalls affected: ${Object.keys(summary.renamesByMall).length}`);

// Show sample of unmatched files if any
if (allUnmatched.length > 0) {
  console.log('\nUnmatched files (first 10):');
  allUnmatched.slice(0, 10).forEach(file => {
    console.log(`  - ${file}`);
  });
  if (allUnmatched.length > 10) {
    console.log(`  ... and ${allUnmatched.length - 10} more`);
  }
}