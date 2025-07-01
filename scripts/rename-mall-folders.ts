import * as fs from 'fs';
import * as path from 'path';

interface Mall {
  id: string;
  name: string;
  engname: string;
  url: string;
  region: string;
}

// Read malls.json
const mallsJsonPath = '/mnt/c/Users/johndoe/Desktop/e-paldogangsan/data/raw/malls.json';
const mallsData: Mall[] = JSON.parse(fs.readFileSync(mallsJsonPath, 'utf-8'));

// Create mapping from mall names to IDs
const nameToIdMap = new Map<string, string>();
mallsData.forEach(mall => {
  nameToIdMap.set(mall.name, mall.id);
});

// Get all current folders in malls directory
const mallsDir = '/mnt/c/Users/johndoe/Desktop/e-paldogangsan/malls';
const folders = fs.readdirSync(mallsDir).filter(item => {
  const itemPath = path.join(mallsDir, item);
  return fs.statSync(itemPath).isDirectory();
});

console.log(`Total folders found: ${folders.length}`);
console.log(`Total malls in JSON: ${mallsData.length}`);

// Create mapping for renaming
const renameMapping: { oldName: string; newName: string; mallName: string }[] = [];
const notFoundFolders: string[] = [];

folders.forEach(folder => {
  // Try direct match first
  let mallId = nameToIdMap.get(folder);
  
  if (\!mallId) {
    // Try variations
    // Remove spaces
    const folderNoSpace = folder.replace(/\s+/g, '');
    
    // Check each mall name
    for (const [name, id] of nameToIdMap.entries()) {
      const nameNoSpace = name.replace(/\s+/g, '');
      
      // Exact match without spaces
      if (folderNoSpace === nameNoSpace) {
        mallId = id;
        break;
      }
      
      // Check if folder contains the name
      if (folder.includes(name) || name.includes(folder)) {
        mallId = id;
        break;
      }
      
      // Special cases
      if (folder === '참달성_달성군' && name === '참달성 (달성군)') {
        mallId = id;
        break;
      }
      if (folder === '단풍미인_정읍_' && name === '단풍미인 (정읍)') {
        mallId = id;
        break;
      }
      if (folder === '지평선몰_김제_' && name === '지평선몰(김제)') {
        mallId = id;
        break;
      }
      if (folder === '장흥몰_산들해랑장흥몰_' && name === '장흥몰 (산들해랑장흥몰)') {
        mallId = id;
        break;
      }
      if (folder === '곡성몰_곡성군농특산물중개몰_' && name === '곡성몰 (곡성군농특산물중개몰)') {
        mallId = id;
        break;
      }
      if (folder === '사이소_경북몰_' && name === '사이소(경북몰)') {
        mallId = id;
        break;
      }
      if (folder === '상주_명실상주몰' && name === '상주 명실상주몰') {
        mallId = id;
        break;
      }
      if (folder === '청도_청리브' && name === '청도 청리브') {
        mallId = id;
        break;
      }
      if (folder === '문경_새제의아침' && name === '문경 새제의아침') {
        mallId = id;
        break;
      }
      if (folder === '별빛촌장터_영천_' && name === '별빛촌장터(영천)') {
        mallId = id;
        break;
      }
      if (folder === '토요애_의령_' && name === '토요애 (의령)') {
        mallId = id;
        break;
      }
      if (folder === '산엔청_산청_' && name === '산엔청 (산청)') {
        mallId = id;
        break;
      }
      if (folder === '공룡나라_고성_' && name === '공룡나라 (고성)') {
        mallId = id;
        break;
      }
      if (folder === '초록믿음_강진_' && name === '초록믿음(강진)') {
        mallId = id;
        break;
      }
      if (folder === '해남미소' && name === '해남미소') {
        mallId = id;
        break;
      }
    }
  }
  
  if (mallId) {
    if (folder \!== mallId) {
      renameMapping.push({
        oldName: folder,
        newName: mallId,
        mallName: mallsData.find(m => m.id === mallId)?.name || ''
      });
    }
  } else {
    notFoundFolders.push(folder);
  }
});

// Display results
console.log('\n📋 Folders to be renamed:');
renameMapping.forEach(({ oldName, newName, mallName }) => {
  console.log(`  ${oldName} → ${newName} (${mallName})`);
});

if (notFoundFolders.length > 0) {
  console.log('\n❌ Folders not found in malls.json:');
  notFoundFolders.forEach(folder => {
    console.log(`  - ${folder}`);
  });
}

// Perform renaming
if (renameMapping.length > 0) {
  console.log('\n🔄 Starting rename process...');
  
  let successCount = 0;
  let errorCount = 0;
  
  renameMapping.forEach(({ oldName, newName }) => {
    const oldPath = path.join(mallsDir, oldName);
    const newPath = path.join(mallsDir, newName);
    
    try {
      // Check if target already exists
      if (fs.existsSync(newPath)) {
        console.log(`⚠️  Skipping ${oldName}: Target ${newName} already exists`);
        errorCount++;
        return;
      }
      
      fs.renameSync(oldPath, newPath);
      console.log(`✅ Renamed: ${oldName} → ${newName}`);
      successCount++;
    } catch (error) {
      console.error(`❌ Error renaming ${oldName}: ${error}`);
      errorCount++;
    }
  });
  
  console.log(`\n✨ Rename complete\! Success: ${successCount}, Errors: ${errorCount}`);
} else {
  console.log('\n✅ All folders already have correct names\!');
}

// Final check
const finalFolders = fs.readdirSync(mallsDir).filter(item => {
  const itemPath = path.join(mallsDir, item);
  return fs.statSync(itemPath).isDirectory();
});

const nonIdFolders = finalFolders.filter(folder => \!mallsData.some(mall => mall.id === folder));
if (nonIdFolders.length > 0) {
  console.log('\n⚠️  Folders still not using mall IDs:');
  nonIdFolders.forEach(folder => {
    console.log(`  - ${folder}`);
  });
}
EOF < /dev/null
