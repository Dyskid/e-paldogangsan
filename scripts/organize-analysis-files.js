const fs = require('fs').promises;
const path = require('path');

async function organizeAnalysisFiles() {
  const outputDir = 'output';
  const analysisDir = 'analysis';
  
  let movedCount = 0;
  let errorCount = 0;
  const results = [];

  try {
    // Get all mall directories in scripts/analysis
    const analysisEntries = await fs.readdir(analysisDir, { withFileTypes: true });
    const mallDirs = analysisEntries
      .filter(entry => entry.isDirectory() && !entry.name.startsWith('.'))
      .map(entry => entry.name);

    console.log(`Found ${mallDirs.length} mall directories in scripts/analysis`);

    // Process each mall directory
    for (const mallName of mallDirs) {
      const mallAnalysisDir = path.join(analysisDir, mallName);
      const mallOutputDir = path.join(outputDir, mallName);
      
      // Check if output directory exists
      const outputDirExists = await fs.access(mallOutputDir).then(() => true).catch(() => false);
      
      if (!outputDirExists) {
        console.log(`No output directory for ${mallName}, skipping...`);
        continue;
      }

      // Look for analysis files in output directory
      const analysisFiles = [
        `${mallName}-analysis.json`,
        `${mallName}-structure-analysis.json`,
        `${mallName}-detailed-analysis.json`,
        `${mallName}-main-analysis.json`,
        `${mallName}-comprehensive-analysis.json`,
        `${mallName}-categories-analysis.json`,
        `${mallName}-price-structure-analysis.json`,
        `${mallName}-product-analysis.json`,
        `${mallName}-simple-analysis.json`
      ];

      // Special cases
      if (mallName === 'ejeju') {
        analysisFiles.push('jeju-mall-analysis.json');
      }
      if (mallName === 'sclocal') {
        analysisFiles.push('sjlocal-product-analysis.json', 'sjlocal-simple-analysis.json');
      }

      for (const fileName of analysisFiles) {
        const sourcePath = path.join(mallOutputDir, fileName);
        
        try {
          await fs.access(sourcePath);
          
          // Determine target filename
          let targetFileName = 'analysis.json';
          if (fileName.includes('structure-analysis')) {
            targetFileName = 'structure-analysis.json';
          } else if (fileName.includes('detailed-analysis')) {
            targetFileName = 'detailed-analysis.json';
          } else if (fileName.includes('main-analysis')) {
            targetFileName = 'main-analysis.json';
          } else if (fileName.includes('comprehensive-analysis')) {
            targetFileName = 'comprehensive-analysis.json';
          } else if (fileName.includes('categories-analysis')) {
            targetFileName = 'categories-analysis.json';
          } else if (fileName.includes('price-structure-analysis')) {
            targetFileName = 'price-structure-analysis.json';
          } else if (fileName.includes('product-analysis')) {
            targetFileName = 'product-analysis.json';
          } else if (fileName.includes('simple-analysis')) {
            targetFileName = 'simple-analysis.json';
          }
          
          const targetPath = path.join(mallAnalysisDir, targetFileName);
          
          // Check if target already exists
          const targetExists = await fs.access(targetPath).then(() => true).catch(() => false);
          
          if (targetExists) {
            console.log(`Target already exists: ${targetPath}, skipping ${fileName}`);
            continue;
          }
          
          // Copy file (not move, to be safe)
          await fs.copyFile(sourcePath, targetPath);
          console.log(`Copied: ${sourcePath} -> ${targetPath}`);
          
          results.push({
            mall: mallName,
            source: fileName,
            target: targetFileName,
            status: 'success'
          });
          
          movedCount++;
        } catch (error) {
          // File doesn't exist or other error
          if (error.code !== 'ENOENT') {
            console.error(`Error processing ${fileName} for ${mallName}:`, error.message);
            errorCount++;
            results.push({
              mall: mallName,
              source: fileName,
              target: null,
              status: 'error',
              error: error.message
            });
          }
        }
      }
    }

    // Save results summary
    await fs.writeFile(
      'analysis-organization-summary.json',
      JSON.stringify({
        timestamp: new Date().toISOString(),
        totalMalls: mallDirs.length,
        filesProcessed: movedCount,
        errors: errorCount,
        results: results
      }, null, 2)
    );

    console.log(`\nSummary:`);
    console.log(`- Total mall directories: ${mallDirs.length}`);
    console.log(`- Files copied: ${movedCount}`);
    console.log(`- Errors: ${errorCount}`);
    console.log(`\nResults saved to analysis-organization-summary.json`);

  } catch (error) {
    console.error('Error organizing analysis files:', error);
  }
}

// Run the organization
organizeAnalysisFiles();