import * as fs from 'fs';
import * as path from 'path';

interface ReportAnalysis {
  mallId: number;
  mallName: string;
  reportPath: string;
  hasSchema: boolean;
  schemaStatus: 'success' | 'partial' | 'failed' | 'unknown';
  missingFields: string[];
  errors: string[];
  notes: string[];
}

const requiredFields = [
  'productSelector',
  'nameSelector',
  'priceSelector',
  'imageSelector',
  'linkSelector',
  'categorySelector',
  'searchSelector'
];

function analyzeReportContent(content: string): Partial<ReportAnalysis> {
  const analysis: Partial<ReportAnalysis> = {
    hasSchema: false,
    schemaStatus: 'unknown',
    missingFields: [],
    errors: [],
    notes: []
  };

  // Check if schema was generated
  if (content.includes('## Scraper Schema') || content.includes('scraperSchema') || content.includes('const schema =')) {
    analysis.hasSchema = true;
  }

  // Check for success indicators
  if (content.includes('Successfully generated') || content.includes('Schema generated successfully')) {
    analysis.schemaStatus = 'success';
  }

  // Check for failure indicators
  if (content.includes('Failed to') || content.includes('Error:') || content.includes('Could not')) {
    analysis.schemaStatus = 'failed';
  }

  // Extract error messages
  const errorMatches = content.match(/Error:.*?[\n\r]/g) || [];
  analysis.errors = errorMatches.map(e => e.trim());

  // Check for specific issues
  if (content.includes('redirect') || content.includes('301') || content.includes('302')) {
    analysis.notes.push('Redirect issues detected');
  }

  if (content.includes('timeout') || content.includes('Timeout')) {
    analysis.notes.push('Timeout issues');
  }

  if (content.includes('CAPTCHA') || content.includes('captcha')) {
    analysis.notes.push('CAPTCHA protection detected');
  }

  if (content.includes('JavaScript') || content.includes('dynamic content')) {
    analysis.notes.push('JavaScript rendering required');
  }

  if (content.includes('Access denied') || content.includes('403') || content.includes('Forbidden')) {
    analysis.notes.push('Access denied/forbidden');
  }

  // Check for missing selectors
  requiredFields.forEach(field => {
    if (!content.includes(field) && analysis.hasSchema) {
      analysis.missingFields.push(field);
    }
  });

  // If schema exists but has missing fields, it's partial
  if (analysis.hasSchema && analysis.missingFields.length > 0) {
    analysis.schemaStatus = 'partial';
  }

  return analysis;
}

function analyzeAllReports() {
  const results: ReportAnalysis[] = [];
  
  // Analyze reports in main pattern
  for (let i = 1; i <= 93; i++) {
    const mallDir = fs.readdirSync('/mnt/c/Users/johndoe/Desktop/e-paldogangsan/malls')
      .find(dir => dir.startsWith(`${i}-`));
    
    if (!mallDir) continue;
    
    let reportPath = path.join('/mnt/c/Users/johndoe/Desktop/e-paldogangsan/malls', mallDir, 'analyze', `report-${i}.md`);
    
    // Check exception pattern for malls 78, 79, 80
    if ([78, 79, 80].includes(i)) {
      const altPath = path.join('/mnt/c/Users/johndoe/Desktop/e-paldogangsan/malls', mallDir, 'analyze', 'requirements', `report-${i}.md`);
      if (fs.existsSync(altPath)) {
        reportPath = altPath;
      }
    }
    
    if (fs.existsSync(reportPath)) {
      const content = fs.readFileSync(reportPath, 'utf-8');
      const analysis = analyzeReportContent(content);
      
      results.push({
        mallId: i,
        mallName: mallDir,
        reportPath: reportPath,
        ...analysis
      } as ReportAnalysis);
    }
  }
  
  return results;
}

// Run analysis
const results = analyzeAllReports();

// Generate summary
const totalMalls = 93;
const reportsFound = results.length;
const successfulSchemas = results.filter(r => r.schemaStatus === 'success').length;
const partialSchemas = results.filter(r => r.schemaStatus === 'partial').length;
const failedSchemas = results.filter(r => r.schemaStatus === 'failed').length;
const unknownStatus = results.filter(r => r.schemaStatus === 'unknown').length;

console.log('# Mall Scraper Schema Analysis Report\n');
console.log(`## Summary`);
console.log(`- Total malls: ${totalMalls}`);
console.log(`- Reports found: ${reportsFound}`);
console.log(`- Missing reports: ${totalMalls - reportsFound}`);
console.log(`- Successful schemas: ${successfulSchemas}`);
console.log(`- Partial schemas: ${partialSchemas}`);
console.log(`- Failed schemas: ${failedSchemas}`);
console.log(`- Unknown status: ${unknownStatus}\n`);

console.log('## Malls with Successful Schemas');
results.filter(r => r.schemaStatus === 'success').forEach(r => {
  console.log(`- ${r.mallName} (#${r.mallId})`);
});

console.log('\n## Malls with Partial Schemas');
results.filter(r => r.schemaStatus === 'partial').forEach(r => {
  console.log(`- ${r.mallName} (#${r.mallId}) - Missing: ${r.missingFields.join(', ')}`);
});

console.log('\n## Malls with Failed Schemas');
results.filter(r => r.schemaStatus === 'failed').forEach(r => {
  console.log(`- ${r.mallName} (#${r.mallId})`);
  if (r.errors.length > 0) {
    r.errors.forEach(e => console.log(`  - ${e}`));
  }
  if (r.notes.length > 0) {
    r.notes.forEach(n => console.log(`  - Note: ${n}`));
  }
});

console.log('\n## Malls with Unknown Status');
results.filter(r => r.schemaStatus === 'unknown').forEach(r => {
  console.log(`- ${r.mallName} (#${r.mallId})`);
});

console.log('\n## Missing Reports');
const missingReports = [52, 53, 55, 57, 58, 59, 60];
missingReports.forEach(id => {
  const mallDir = fs.readdirSync('/mnt/c/Users/johndoe/Desktop/e-paldogangsan/malls')
    .find(dir => dir.startsWith(`${id}-`));
  if (mallDir) {
    console.log(`- ${mallDir} (#${id})`);
  }
});

console.log('\n## Common Failure Patterns');
const allNotes = results.flatMap(r => r.notes);
const noteCounts = allNotes.reduce((acc, note) => {
  acc[note] = (acc[note] || 0) + 1;
  return acc;
}, {} as Record<string, number>);

Object.entries(noteCounts)
  .sort(([, a], [, b]) => b - a)
  .forEach(([note, count]) => {
    console.log(`- ${note}: ${count} malls`);
  });