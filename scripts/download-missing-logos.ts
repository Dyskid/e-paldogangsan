import { promises as fs } from 'fs';
import path from 'path';
import axios from 'axios';
import sharp from 'sharp';

interface Mall {
  id: string;
  name: string;
  url: string;
  region: string;
  logo?: string;
}

const LOGOS_DIR = path.join(process.cwd(), 'public', 'logos');

// Default placeholder logo generator
async function generatePlaceholderLogo(mallName: string, mallId: string): Promise<void> {
  const initials = mallName
    .split(' ')
    .map(word => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const colors = [
    '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', 
    '#EF4444', '#EC4899', '#14B8A6', '#6366F1'
  ];
  
  const color = colors[Math.floor(Math.random() * colors.length)];
  
  const svg = `
    <svg width="200" height="100" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="100" fill="${color}" rx="8"/>
      <text x="100" y="60" font-family="Arial, sans-serif" font-size="36" font-weight="bold" text-anchor="middle" fill="white">
        ${initials}
      </text>
    </svg>
  `;

  const outputPath = path.join(LOGOS_DIR, `${mallId}.png`);
  await sharp(Buffer.from(svg))
    .png()
    .toFile(outputPath);
}

async function main() {
  try {
    // Read current mall data
    const mallData = await fs.readFile(
      path.join(process.cwd(), 'src', 'data', 'malls.json'),
      'utf-8'
    );
    const malls: Mall[] = JSON.parse(mallData);
    
    // Find malls without logos
    const mallsWithoutLogos = malls.filter(mall => !mall.logo);
    
    console.log(`Found ${mallsWithoutLogos.length} malls without logos`);
    
    // Generate placeholder logos for missing ones
    for (const mall of mallsWithoutLogos) {
      try {
        await generatePlaceholderLogo(mall.name, mall.id);
        mall.logo = `/logos/${mall.id}.png`;
        console.log(`✅ Generated placeholder logo for ${mall.name}`);
      } catch (error) {
        console.error(`❌ Failed to generate placeholder for ${mall.name}:`, error);
      }
    }
    
    // Update mall data with all logo paths
    await fs.writeFile(
      path.join(process.cwd(), 'src', 'data', 'malls.json'),
      JSON.stringify(malls, null, 2)
    );
    
    console.log('\n✅ All malls now have logo placeholders!');
    
  } catch (error) {
    console.error('Failed to process missing logos:', error);
    process.exit(1);
  }
}

main();