import * as fs from 'fs';
import * as path from 'path';

interface MallAnalysis {
  id: number;
  engname: string;
  name: string;
  url: string;
  status: string;
  error: string;
  lastChecked: string;
}

const analysis: MallAnalysis = {
  id: 72,
  engname: "gimcheon-nodaji-market",
  name: "김천노다지장터",
  url: "http://gcnodaji.com/",
  status: "error",
  error: "Site structure issues - uses frameset with missing content page (index1.html returns 404). SSL certificate issues also present.",
  lastChecked: new Date().toISOString()
};

// Save analysis to JSON file
const outputPath = path.join(__dirname, 'analysis-72.json');
fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2), 'utf-8');

console.log(`Analysis completed and saved to ${outputPath}`);