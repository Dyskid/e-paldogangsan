import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

const execAsync = promisify(exec);

// Mapping of mall IDs to their scraper script names
const scraperMapping: Record<string, string | null> = {
  // 서울특별시
  mall_1: null, // 온서울마켓 - Not implemented
  
  // 부산광역시
  mall_2: null, // 부산브랜드몰 - Not implemented
  
  // 대구광역시
  mall_3: 'scrape-wemall-comprehensive',
  mall_4: 'scrape-chamds-comprehensive',
  
  // 인천광역시
  mall_5: null, // 인천e몰 - Not implemented
  
  // 광주광역시
  mall_6: 'scrape-kkimchi-comprehensive',
  
  // 대전광역시
  mall_7: 'scrape-ontongdaejeon-comprehensive',
  
  // 울산광역시
  mall_8: null, // 울산몰 - Not implemented
  
  // 세종특별자치시
  mall_9: 'scrape-sjlocal-products',
  
  // 경기도
  mall_10: 'scrape-chack3-products',
  mall_11: 'scrape-osansemall-real',
  mall_12: 'scrape-gmsocial-comprehensive',
  mall_13: 'scrape-yangju-comprehensive',
  mall_14: null, // 마켓경기 - Not implemented
  
  // 강원도
  mall_15: 'scrape-gwdmall-comprehensive',
  mall_16: 'scrape-wonju-comprehensive',
  mall_17: 'scrape-gangneung-comprehensive',
  mall_18: 'scrape-goseong-comprehensive',
  mall_19: 'scrape-donghae-comprehensive',
  mall_20: 'scrape-samcheok-comprehensive',
  mall_21: 'scrape-yanggu-comprehensive',
  
  // Remaining 강원도 malls - Not implemented
  mall_22: 'scrape-yangyang-final', // 양양몰 - Implemented
  mall_23: 'scrape-yeongwol-comprehensive', // 영월몰 - Implemented
  mall_24: 'scrape-inje-comprehensive', // 인제몰 - Implemented
  mall_25: 'scrape-cheorwon-comprehensive', // 철원몰 - Implemented
  mall_26: 'scrape-jeongseon-comprehensive', // 정선몰 - Implemented
  mall_27: 'scrape-taebaek-comprehensive', // 태백몰 - Implemented
  mall_28: 'scrape-hoengseong-comprehensive', // 횡성몰 - Implemented
  mall_29: null, // 춘천몰
  mall_30: null, // 홍천몰
  mall_31: null, // 평창몰
  
  // 충청북도 - Not implemented
  mall_32: null, // 제천로컬푸드
  mall_33: null, // 음성장터
  mall_34: null, // 진천몰
  mall_35: null, // 괴산장터
  
  // 충청남도 - Not implemented
  mall_36: null, // 농사랑
  mall_37: null, // 당진팜
  mall_38: null, // e홍성장터
  mall_39: null, // 서산뜨레
  
  // 전라북도 - Not implemented
  mall_40: null, // 부안 텃밭할매
  mall_41: null, // 단풍미인
  mall_42: null, // 지평선몰
  mall_43: null, // 전북생생장터
  mall_44: null, // 익산몰
  mall_45: null, // 진안고원몰
  mall_46: null, // 장수몰
  mall_47: null, // 고창마켓
  mall_48: null, // 임실몰
  mall_49: null, // 순창로컬푸드쇼핑몰
  mall_50: null, // 해가람
  
  // 전라남도 - Not implemented (mall_51 to mall_67)
  mall_51: null, mall_52: null, mall_53: null, mall_54: null, mall_55: null,
  mall_56: null, mall_57: null, mall_58: null, mall_59: null, mall_60: null,
  mall_61: null, mall_62: null, mall_63: null, mall_64: null, mall_65: null,
  mall_66: null, mall_67: null,
  
  // 경상북도 - Not implemented (mall_68 to mall_89)
  mall_68: null, mall_69: null, mall_70: null, mall_71: null, mall_72: null,
  mall_73: null, mall_74: null, mall_75: null, mall_76: null, mall_77: null,
  mall_78: null, mall_79: null, mall_80: null, mall_81: null, mall_82: null,
  mall_83: null, mall_84: null, mall_85: null, mall_86: null, mall_87: null,
  mall_88: null, mall_89: null,
  
  // 경상남도 - Not implemented (mall_90 to mall_97)
  mall_90: null, mall_91: null, mall_92: null, mall_93: null, mall_94: null,
  mall_95: null, mall_96: null, mall_97: null,
  
  // 경상남도 - Implemented
  mall_98: 'scrape-gimhaemall-comprehensive',
  
  // 제주특별자치도
  mall_99: 'scrape-ejeju-mall-comprehensive',
};

export async function POST(request: NextRequest) {
  try {
    const { mallId, mallName, mallUrl } = await request.json();

    if (!mallId || !mallName || !mallUrl) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const scraperScript = scraperMapping[mallId];

    if (!scraperScript) {
      // For malls without implemented scrapers, return a placeholder response
      return NextResponse.json({
        message: `Scraper for ${mallName} is not yet implemented`,
        mallId,
        mallName,
        mallUrl,
        productCount: 0,
        status: 'not_implemented'
      });
    }

    // Execute the scraper script
    const scriptPath = path.join(process.cwd(), 'scripts', `${scraperScript}.ts`);
    
    try {
      const { stdout, stderr } = await execAsync(
        `npx tsx "${scriptPath}"`,
        {
          cwd: process.cwd(),
          env: { ...process.env, NODE_ENV: 'development' }
        }
      );

      // Parse the output to extract product count
      let productCount = 0;
      const countMatch = stdout.match(/scraped (\d+) products/i) || 
                         stdout.match(/found (\d+) products/i) ||
                         stdout.match(/total.*?(\d+)/i);
      
      if (countMatch) {
        productCount = parseInt(countMatch[1], 10);
      }

      return NextResponse.json({
        message: `Successfully scraped ${productCount} products from ${mallName}`,
        mallId,
        mallName,
        mallUrl,
        productCount,
        status: 'success',
        stdout: stdout.substring(0, 500), // Include partial output for debugging
      });
    } catch (execError: any) {
      console.error(`Error executing scraper for ${mallName}:`, execError);
      
      return NextResponse.json({
        message: `Failed to execute scraper for ${mallName}`,
        mallId,
        mallName,
        mallUrl,
        productCount: 0,
        status: 'error',
        error: execError.message,
        stderr: execError.stderr?.substring(0, 500),
      });
    }
  } catch (error: any) {
    console.error('Error in scrape-mall API:', error);
    
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}