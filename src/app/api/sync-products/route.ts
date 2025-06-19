import { NextResponse } from 'next/server';
import { ProductSyncService } from '@/lib/product-sync';
import { headers } from 'next/headers';

// This should be called by a cron job or scheduled task
export async function POST(request: Request) {
  try {
    // Simple auth check - in production, use proper authentication
    const headersList = headers();
    const authHeader = headersList.get('authorization');
    
    if (authHeader !== `Bearer ${process.env.SYNC_API_KEY}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // For now, sync only malls with scraper configurations
    const mallsToSync = [
      { id: 'mall_1_온서울마켓', name: '온서울마켓' },
      { id: 'mall_2_부산브랜드몰', name: '부산브랜드몰' },
      { id: 'mall_15_강원더몰', name: '강원더몰' },
      { id: 'mall_51_남도장터', name: '남도장터' },
      { id: 'mall_68_사이소_경북몰_', name: '사이소(경북몰)' },
      { id: 'mall_99_제주몰', name: '제주몰' }
      // Add more as scrapers are configured
    ];

    const syncService = new ProductSyncService();
    await syncService.syncAllMalls(mallsToSync);

    return NextResponse.json({
      success: true,
      message: `Synced ${mallsToSync.length} malls`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Product sync error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}