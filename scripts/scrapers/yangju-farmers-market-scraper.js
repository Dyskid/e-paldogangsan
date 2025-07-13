const axios = require('axios');
const cheerio = require('cheerio');
const iconv = require('iconv-lite');

/**
 * 양주농부마켓 전용 스크래퍼
 * https://market.yangju.go.kr/
 */
async function scrapeYangjuFarmersMarket(url, options = {}) {
    console.log('양주농부마켓 스크래퍼 시작:', url);
    
    try {
        const products = [];
        let page = 1;
        const maxPages = 5; // 최대 5페이지까지만 확인
        
        while (page <= maxPages) {
            // 상품 목록 페이지 URL 구성
            const listUrl = `https://market.yangju.go.kr/shop/shopbrand.html?type=X&xcode=003&sort=&page=${page}`;
            console.log(`페이지 ${page} 스크래핑 중:`, listUrl);
            
            const response = await axios.get(listUrl, {
                timeout: 30000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                    'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1'
                },
                responseType: 'arraybuffer'
            });
            
            // EUC-KR 인코딩 처리
            let html = response.data;
            const contentTypeHeader = response.headers['content-type'] || '';
            
            if (contentTypeHeader.includes('charset=euc-kr') || contentTypeHeader.includes('charset=EUC-KR')) {
                html = iconv.decode(Buffer.from(response.data), 'EUC-KR');
            } else {
                html = response.data.toString('utf-8');
            }
            
            const $ = cheerio.load(html);
            
            // 상품 목록 찾기
            const productElements = $('.item-cont.catelist .item-list');
            
            if (productElements.length === 0) {
                console.log(`페이지 ${page}에서 상품을 찾을 수 없습니다.`);
                break;
            }
            
            productElements.each((index, element) => {
                try {
                    const $item = $(element);
                    
                    // 상품 링크와 ID
                    const linkElement = $item.find('a').first();
                    const productUrl = linkElement.attr('href');
                    if (!productUrl) return;
                    
                    const fullUrl = productUrl.startsWith('http') 
                        ? productUrl 
                        : `https://market.yangju.go.kr${productUrl}`;
                    
                    // branduid 추출
                    const branduidMatch = productUrl.match(/branduid=(\d+)/);
                    const branduid = branduidMatch ? branduidMatch[1] : '';
                    
                    // 상품명
                    const title = $item.find('.prd-name').text().trim() || 
                                 $item.find('.txt a').text().trim() ||
                                 $item.find('.name').text().trim();
                    
                    if (!title) return;
                    
                    // 가격 정보
                    let price = $item.find('.prd-price').text().trim() ||
                               $item.find('.price').text().trim() ||
                               $item.find('#s_dc').text().trim();
                    
                    // 가격에서 숫자만 추출
                    price = price.replace(/[^0-9]/g, '');
                    price = price ? parseInt(price) : 0;
                    
                    // 이미지
                    const imageElement = $item.find('img').first();
                    let image = imageElement.attr('src') || imageElement.attr('data-original');
                    if (image && !image.startsWith('http')) {
                        image = `https://market.yangju.go.kr${image}`;
                    }
                    
                    // 판매자 정보 
                    const vendor = $item.find('.brand').text().trim() || 
                                  $item.find('.vendor').text().trim() || 
                                  '';
                    
                    const product = {
                        id: branduid || `yangju_${products.length + 1}`,
                        mallId: '8',
                        mallName: '양주농부마켓',
                        title,
                        price,
                        url: fullUrl,
                        image: image || '',
                        vendor: vendor || '양주농부마켓',
                        category: '농산물',
                        deliveryFee: 0,
                        reviewCount: 0,
                        rating: 0,
                        isOutOfStock: false,
                        scrapedAt: new Date().toISOString()
                    };
                    
                    console.log(`상품 발견: ${title} - ${price}원`);
                    products.push(product);
                    
                } catch (error) {
                    console.error('상품 파싱 오류:', error.message);
                }
            });
            
            // 다음 페이지 확인
            const hasNextPage = $('.paging a').filter((i, el) => $(el).text().includes('다음')).length > 0;
            if (!hasNextPage || products.length >= 100) {
                break;
            }
            
            page++;
            
            // 페이지 간 딜레이
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        console.log(`총 ${products.length}개 상품 스크래핑 완료`);
        
        return {
            success: true,
            data: products,
            totalProducts: products.length,
            scrapedAt: new Date().toISOString()
        };
        
    } catch (error) {
        console.error('양주농부마켓 스크래핑 오류:', error);
        return {
            success: false,
            error: error.message,
            data: []
        };
    }
}

// 스크래퍼 등록
if (typeof window === 'undefined' && typeof module !== 'undefined' && module.exports) {
    module.exports = {
  scrape: scrapeYangjuFarmersMarket
};
}