import * as fs from 'fs';
import * as path from 'path';

interface ReportAnalysis {
  mallId: number;
  mallName: string;
  reportPath: string;
  hasAnalysisJson: boolean;
  schemaStatus: 'success' | 'partial' | 'failed' | 'unknown';
  errors: string[];
  notes: string[];
}

function analyzeReport(mallId: number, mallDir: string): ReportAnalysis | null {
  // Find report path
  let reportPath = path.join('/mnt/c/Users/johndoe/Desktop/e-paldogangsan/malls', mallDir, 'analyze', `report-${mallId}.md`);
  
  // Check exception pattern for malls 78, 79, 80
  if ([78, 79, 80].includes(mallId)) {
    const altPath = path.join('/mnt/c/Users/johndoe/Desktop/e-paldogangsan/malls', mallDir, 'analyze', 'requirements', `report-${mallId}.md`);
    if (fs.existsSync(altPath)) {
      reportPath = altPath;
    }
  }
  
  if (!fs.existsSync(reportPath)) {
    return null;
  }
  
  // Check if analysis JSON exists
  const analysisJsonPath = path.join('/mnt/c/Users/johndoe/Desktop/e-paldogangsan/malls', mallDir, 'analyze', `analysis-${mallId}.json`);
  const hasAnalysisJson = fs.existsSync(analysisJsonPath);
  
  // Read report content
  const content = fs.readFileSync(reportPath, 'utf-8');
  
  const analysis: ReportAnalysis = {
    mallId,
    mallName: mallDir,
    reportPath,
    hasAnalysisJson,
    schemaStatus: 'unknown',
    errors: [],
    notes: []
  };
  
  // Determine status
  if (hasAnalysisJson) {
    // If analysis JSON exists, it's likely successful
    analysis.schemaStatus = 'success';
  } else if (content.includes('Status: Failed') || 
             content.includes('## Status: Failed') ||
             content.includes('Failed to') || 
             content.includes('## Error Details:')) {
    analysis.schemaStatus = 'failed';
  } else if (content.includes('Analysis Status: SUCCESS') || 
             content.includes('Status: SUCCESS') || 
             content.includes('✅ SUCCESS') || 
             content.includes('✅') ||
             content.includes('성공') ||
             content.includes('Successfully generated') || 
             content.includes('completed successfully') ||
             content.includes('## Summary') && content.includes('successfully')) {
    analysis.schemaStatus = 'success';
  }
  
  // Extract errors
  if (content.includes('Error Details:')) {
    const errorSection = content.split('Error Details:')[1]?.split('\n')[0]?.trim();
    if (errorSection) {
      analysis.errors.push(errorSection);
    }
  }
  
  if (content.includes('reason:')) {
    const reasonMatch = content.match(/reason:\s*(.+)/);
    if (reasonMatch) {
      analysis.errors.push(reasonMatch[1].trim());
    }
  }
  
  // Identify issues
  if (content.includes('certificate') || content.includes('SSL') || content.includes('TLS')) {
    analysis.notes.push('SSL/Certificate issues');
  }
  
  if (content.includes('timeout') || content.includes('Timeout')) {
    analysis.notes.push('Timeout issues');
  }
  
  if (content.includes('redirect')) {
    analysis.notes.push('Redirect issues');
  }
  
  if (content.includes('CAPTCHA') || content.includes('captcha')) {
    analysis.notes.push('CAPTCHA protection');
  }
  
  if (content.includes('403') || content.includes('Forbidden')) {
    analysis.notes.push('Access forbidden');
  }
  
  return analysis;
}

function main() {
  const results: ReportAnalysis[] = [];
  const missingReports: { mallId: number; mallName: string }[] = [];
  
  // Analyze all malls
  for (let i = 1; i <= 93; i++) {
    const mallDir = fs.readdirSync('/mnt/c/Users/johndoe/Desktop/e-paldogangsan/malls')
      .find(dir => dir.startsWith(`${i}-`));
    
    if (!mallDir) continue;
    
    const analysis = analyzeReport(i, mallDir);
    if (analysis) {
      results.push(analysis);
    } else {
      missingReports.push({ mallId: i, mallName: mallDir });
    }
  }
  
  // Generate report
  const totalMalls = 93;
  const successful = results.filter(r => r.schemaStatus === 'success');
  const failed = results.filter(r => r.schemaStatus === 'failed');
  const unknown = results.filter(r => r.schemaStatus === 'unknown');
  
  console.log('# Mall Scraper Schema Analysis Report\n');
  console.log('Generated on:', new Date().toISOString());
  console.log('\n## Executive Summary\n');
  console.log(`- **Total malls**: ${totalMalls}`);
  console.log(`- **Reports analyzed**: ${results.length}`);
  console.log(`- **Successful schemas**: ${successful.length} (${Math.round(successful.length / totalMalls * 100)}%)`);
  console.log(`- **Failed schemas**: ${failed.length} (${Math.round(failed.length / totalMalls * 100)}%)`);
  console.log(`- **Unknown status**: ${unknown.length} (${Math.round(unknown.length / totalMalls * 100)}%)`);
  console.log(`- **Missing reports**: ${missingReports.length} (${Math.round(missingReports.length / totalMalls * 100)}%)`);
  
  console.log('\n## Successful Schemas (' + successful.length + ' malls)\n');
  successful.sort((a, b) => a.mallId - b.mallId).forEach(r => {
    console.log(`✅ ${r.mallName} (#${r.mallId})${r.hasAnalysisJson ? ' [JSON ✓]' : ''}`);
  });
  
  console.log('\n## Failed Schemas (' + failed.length + ' malls)\n');
  failed.sort((a, b) => a.mallId - b.mallId).forEach(r => {
    console.log(`❌ ${r.mallName} (#${r.mallId})`);
    r.errors.forEach(e => console.log(`   - Error: ${e}`));
    r.notes.forEach(n => console.log(`   - Issue: ${n}`));
  });
  
  console.log('\n## Unknown Status (' + unknown.length + ' malls)\n');
  console.log('These malls have reports but unclear success/failure status:');
  unknown.sort((a, b) => a.mallId - b.mallId).forEach(r => {
    console.log(`❓ ${r.mallName} (#${r.mallId})`);
  });
  
  console.log('\n## Missing Reports (' + missingReports.length + ' malls)\n');
  missingReports.sort((a, b) => a.mallId - b.mallId).forEach(m => {
    console.log(`⚠️  ${m.mallName} (#${m.mallId})`);
  });
  
  // Issue analysis
  console.log('\n## Common Issues\n');
  const allNotes = results.flatMap(r => r.notes);
  const issueCounts: Record<string, number> = {};
  allNotes.forEach(note => {
    issueCounts[note] = (issueCounts[note] || 0) + 1;
  });
  
  Object.entries(issueCounts)
    .sort(([, a], [, b]) => b - a)
    .forEach(([issue, count]) => {
      console.log(`- ${issue}: ${count} occurrences`);
    });
  
  console.log('\n## Recommendations\n');
  console.log('1. **Missing Reports**: Prioritize analyzing the 7 malls without reports');
  console.log('2. **Failed Schemas**: Address SSL certificate issues for mall #66');
  console.log('3. **Unknown Status**: Review the ' + unknown.length + ' malls with unclear status to determine if they need re-analysis');
  console.log('4. **Success Rate**: With ' + Math.round(successful.length / totalMalls * 100) + '% success rate, consider batch processing for remaining malls');
  
  // Save detailed results
  const detailedResults = {
    summary: {
      totalMalls,
      reportsAnalyzed: results.length,
      successful: successful.length,
      failed: failed.length,
      unknown: unknown.length,
      missing: missingReports.length
    },
    successful: successful.map(r => ({ id: r.mallId, name: r.mallName, hasJson: r.hasAnalysisJson })),
    failed: failed.map(r => ({ id: r.mallId, name: r.mallName, errors: r.errors, issues: r.notes })),
    unknown: unknown.map(r => ({ id: r.mallId, name: r.mallName })),
    missing: missingReports
  };
  
  fs.writeFileSync(
    '/mnt/c/Users/johndoe/Desktop/e-paldogangsan/scraper-schema-analysis-detailed.json',
    JSON.stringify(detailedResults, null, 2)
  );
  
  console.log('\n## Files Generated\n');
  console.log('- Detailed analysis saved to: scraper-schema-analysis-detailed.json');
}

main();