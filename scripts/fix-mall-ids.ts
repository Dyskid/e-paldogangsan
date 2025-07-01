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
  
  // Read malls.json
  const mallsData = JSON.parse(await fs.readFile(mallsJsonPath, 'utf-8')) as Mall[];
  
  // Remove trailing underscores from IDs
  let changedCount = 0;
  const updatedMalls = mallsData.map(mall => {
    if (mall.id.endsWith('_')) {
      changedCount++;
      console.log(`Removing trailing underscore from: ${mall.id} -> ${mall.id.slice(0, -1)}`);
      return {
        ...mall,
        id: mall.id.slice(0, -1)
      };
    }
    return mall;
  });
  
  // Write the updated data back
  await fs.writeFile(
    mallsJsonPath, 
    JSON.stringify(updatedMalls, null, 2) + '\n',
    'utf-8'
  );
  
  console.log(`\nUpdated ${changedCount} mall IDs by removing trailing underscores.`);
}

main().catch(console.error);