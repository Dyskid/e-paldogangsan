const fs = require('fs');
const path = require('path');

// Read mall data
const mallsPath = path.join(__dirname, '../src/data/malls.json');
const malls = JSON.parse(fs.readFileSync(mallsPath, 'utf-8'));

// Group malls by region
const grouped = {};
malls.forEach(mall => {
  if (!grouped[mall.region]) {
    grouped[mall.region] = [];
  }
  grouped[mall.region].push(mall.name);
});

// Define categories
const metropolitanCities = ['서울', '인천', '세종', '대전', '광주', '대구', '울산', '부산'];
const provinces = {
  '충청': ['충북', '충남'],
  '전라': ['전북', '전남'],
  '경상': ['경북', '경남'],
  '기타': ['강원', '제주']
};

console.log('Shopping Mall Distribution');
console.log('=========================\n');

// Show metropolitan cities
console.log('Metropolitan Cities:');
metropolitanCities.forEach(city => {
  const count = grouped[city] ? grouped[city].length : 0;
  console.log(`  ${city}: ${count} malls`);
  if (grouped[city]) {
    grouped[city].forEach(name => console.log(`    - ${name}`));
  }
});

// Show provinces
console.log('\nProvinces:');
Object.entries(provinces).forEach(([provinceName, regions]) => {
  console.log(`  ${provinceName}:`);
  regions.forEach(region => {
    const count = grouped[region] ? grouped[region].length : 0;
    console.log(`    ${region}: ${count} malls`);
    if (grouped[region]) {
      grouped[region].forEach(name => console.log(`      - ${name}`));
    }
  });
});

// Show total
const total = Object.values(grouped).reduce((sum, mallList) => sum + mallList.length, 0);
console.log(`\nTotal: ${total} malls`);