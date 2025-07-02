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

function analyzeReportContent(content: string): Partial<ReportAnalysis> {
  const analysis: Partial<ReportAnalysis> = {
    hasSchema: false,
    schemaStatus: 'unknown',
    missingFields: [],
    errors: [],
    notes: []
  };

  // Check for success indicators
  if (content.includes('Analysis Status: SUCCESS') || 
      content.includes('Status: SUCCESS') || 
      content.includes('✅ SUCCESS') || 
      content.includes('Successfully generated') || 
      content.includes('completed successfully') ||
      content.includes('## Summary') && content.includes('successfully')) {
    analysis.schemaStatus = 'success';
    analysis.hasSchema = true;
  }

  // Check for failure indicators
  if (content.includes('Status: Failed') || 
      content.includes('## Status: Failed') ||
      content.includes('Failed to') || 
      content.includes('## Error Details:')) {
    analysis.schemaStatus = 'failed';
  }

  // Extract error messages
  if (content.includes('Error Details:')) {
    const errorSection = content.split('Error Details:')[1]?.split('\n')[0]?.trim();
    if (errorSection) {
      analysis.errors!.push(errorSection);
    }
  }

  if (content.includes('reason:')) {
    const reasonMatch = content.match(/reason:\s*(.+)/);
    if (reasonMatch) {
      analysis.errors!.push(reasonMatch[1].trim());
    }
  }

  // Check for specific issues
  if (content.includes('redirect') || content.includes('301') || content.includes('302')) {
    analysis.notes!.push('Redirect issues detected');
  }

  if (content.includes('timeout') || content.includes('Timeout')) {
    analysis.notes!.push('Timeout issues');
  }

  if (content.includes('certificate') || content.includes('SSL') || content.includes('TLS')) {
    analysis.notes!.push('SSL/Certificate issues');
  }

  if (content.includes('network') || content.includes('ECONNREFUSED') || content.includes('ETIMEDOUT')) {
    analysis.notes!.push('Network connectivity issues');
  }

  if (content.includes('CAPTCHA') || content.includes('captcha')) {
    analysis.notes!.push('CAPTCHA protection detected');
  }

  if (content.includes('JavaScript') || content.includes('dynamic content')) {
    analysis.notes!.push('JavaScript rendering required');
  }

  if (content.includes('Access denied') || content.includes('403') || content.includes('Forbidden')) {
    analysis.notes!.push('Access denied/forbidden');
  }

  // Check if analysis files were generated
  if (content.includes('Files Generated') || content.includes('analysis-') || content.includes('.json')) {
    analysis.hasSchema = true;
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
const successful = results.filter(r => r.schemaStatus === 'success').sort((a, b) => a.mallId - b.mallId);
successful.forEach(r => {
  console.log(`- ${r.mallName} (#${r.mallId})`);
});

console.log('\n## Malls with Failed Schemas');
const failed = results.filter(r => r.schemaStatus === 'failed').sort((a, b) => a.mallId - b.mallId);
failed.forEach(r => {
  console.log(`- ${r.mallName} (#${r.mallId})`);
  if (r.errors.length > 0) {
    r.errors.forEach(e => console.log(`  - Error: ${e}`));
  }
  if (r.notes.length > 0) {
    r.notes.forEach(n => console.log(`  - Note: ${n}`));
  }
});

console.log('\n## Malls with Unknown Status');
const unknown = results.filter(r => r.schemaStatus === 'unknown').sort((a, b) => a.mallId - b.mallId);
unknown.forEach(r => {
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
const allErrors = results.flatMap(r => r.errors);

// Count error types
const errorTypes: Record<string, number> = {};
allErrors.forEach(error => {
  if (error.includes('certificate')) errorTypes['SSL/Certificate issues'] = (errorTypes['SSL/Certificate issues'] || 0) + 1;
  else if (error.includes('timeout')) errorTypes['Timeout'] = (errorTypes['Timeout'] || 0) + 1;
  else if (error.includes('ECONNREFUSED')) errorTypes['Connection refused'] = (errorTypes['Connection refused'] || 0) + 1;
  else if (error.includes('404')) errorTypes['404 Not Found'] = (errorTypes['404 Not Found'] || 0) + 1;
  else errorTypes['Other'] = (errorTypes['Other'] || 0) + 1;
});

Object.entries(errorTypes)
  .sort(([, a], [, b]) => b - a)
  .forEach(([type, count]) => {
    console.log(`- ${type}: ${count} occurrences`);
  });

// Save detailed results to JSON
fs.writeFileSync(
  '/mnt/c/Users/johndoe/Desktop/e-paldogangsan/scraper-schema-analysis.json',
  JSON.stringify(results, null, 2)
);