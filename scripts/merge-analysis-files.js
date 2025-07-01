const fs = require('fs').promises;
const path = require('path');

async function mergeAnalysisFiles() {
  const analysisDir = 'analysis';
  
  let mergedCount = 0;
  let errorCount = 0;
  const results = [];

  try {
    // Get all mall directories
    const entries = await fs.readdir(analysisDir, { withFileTypes: true });
    const mallDirs = entries
      .filter(entry => entry.isDirectory() && !entry.name.startsWith('.'))
      .map(entry => entry.name);

    console.log(`Processing ${mallDirs.length} mall directories...`);

    for (const mallName of mallDirs) {
      const mallDir = path.join(analysisDir, mallName);
      const analysisPath = path.join(mallDir, 'analysis.json');
      const structurePath = path.join(mallDir, 'structure-analysis.json');
      
      try {
        // Check if both files exist
        const analysisExists = await fs.access(analysisPath).then(() => true).catch(() => false);
        const structureExists = await fs.access(structurePath).then(() => true).catch(() => false);
        
        if (analysisExists && structureExists) {
          // Read both files
          const analysisData = JSON.parse(await fs.readFile(analysisPath, 'utf8'));
          const structureData = JSON.parse(await fs.readFile(structurePath, 'utf8'));
          
          // Merge the data
          const mergedData = {
            ...analysisData,
            structure: structureData,
            merged: true,
            mergedAt: new Date().toISOString()
          };
          
          // Backup original analysis.json
          await fs.copyFile(analysisPath, path.join(mallDir, 'analysis.original.json'));
          
          // Write merged data to analysis.json
          await fs.writeFile(analysisPath, JSON.stringify(mergedData, null, 2));
          
          // Rename structure-analysis.json to indicate it's been merged
          await fs.rename(structurePath, path.join(mallDir, 'structure-analysis.merged.json'));
          
          console.log(`✓ Merged files for ${mallName}`);
          results.push({
            mall: mallName,
            status: 'merged',
            hasAnalysis: true,
            hasStructure: true
          });
          mergedCount++;
          
        } else {
          // Log which files exist
          results.push({
            mall: mallName,
            status: 'not_merged',
            hasAnalysis: analysisExists,
            hasStructure: structureExists
          });
          
          if (!analysisExists && structureExists) {
            // If only structure exists, rename it to analysis.json
            await fs.rename(structurePath, analysisPath);
            console.log(`✓ Renamed structure-analysis.json to analysis.json for ${mallName}`);
            results[results.length - 1].status = 'renamed';
          }
        }
        
      } catch (error) {
        console.error(`Error processing ${mallName}:`, error.message);
        results.push({
          mall: mallName,
          status: 'error',
          error: error.message
        });
        errorCount++;
      }
    }

    // Save summary
    const summary = {
      timestamp: new Date().toISOString(),
      totalMalls: mallDirs.length,
      mergedCount: mergedCount,
      errorCount: errorCount,
      results: results
    };
    
    await fs.writeFile(
      'analysis-merge-summary.json',
      JSON.stringify(summary, null, 2)
    );

    console.log(`\nSummary:`);
    console.log(`- Total mall directories: ${mallDirs.length}`);
    console.log(`- Files merged: ${mergedCount}`);
    console.log(`- Errors: ${errorCount}`);
    
    // Count different statuses
    const statusCounts = results.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {});
    
    console.log(`\nStatus breakdown:`);
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`- ${status}: ${count}`);
    });
    
    console.log(`\nResults saved to analysis-merge-summary.json`);

  } catch (error) {
    console.error('Error merging analysis files:', error);
  }
}

// Run the merge
mergeAnalysisFiles();