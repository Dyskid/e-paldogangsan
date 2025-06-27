'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Mall {
  id: string;
  name: string;
  url: string;
  region: string;
  hasProducts?: boolean;
}

const malls: Mall[] = [
  // 서울특별시
  { id: 'mall_1', name: '온서울마켓', url: 'https://on.seoul.go.kr', region: '서울특별시' },
  
  // 부산광역시
  { id: 'mall_2', name: '부산브랜드몰', url: 'https://busanbrand.kr', region: '부산광역시' },
  
  // 대구광역시
  { id: 'mall_3', name: '우리몰', url: 'https://wemall.kr', region: '대구광역시', hasProducts: true },
  { id: 'mall_4', name: '참달성 (달성군)', url: 'https://smartstore.naver.com/chamdalseong', region: '대구광역시', hasProducts: true },
  
  // 인천광역시
  { id: 'mall_5', name: '인천e몰', url: 'https://www.incheone-mall.kr', region: '인천광역시' },
  
  // 광주광역시
  { id: 'mall_6', name: '광주김치몰', url: 'https://www.k-kimchi.kr', region: '광주광역시', hasProducts: true },
  
  // 대전광역시
  { id: 'mall_7', name: '대전사랑몰', url: 'https://ontongdaejeon.ezwel.com/onnuri/main', region: '대전광역시', hasProducts: true },
  
  // 울산광역시
  { id: 'mall_8', name: '울산몰', url: 'https://www.ulsanmall.kr', region: '울산광역시' },
  
  // 세종특별자치시
  { id: 'mall_9', name: '세종로컬푸드', url: 'https://www.sjlocal.or.kr/', region: '세종특별자치시', hasProducts: true },
  
  // 경기도
  { id: 'mall_10', name: '착착착', url: 'https://www.chack3.com/', region: '경기도', hasProducts: true },
  { id: 'mall_11', name: '오산함께장터', url: 'http://www.osansemall.com/', region: '경기도', hasProducts: true },
  { id: 'mall_12', name: '광명가치몰', url: 'https://gmsocial.or.kr/mall/', region: '경기도', hasProducts: true },
  { id: 'mall_13', name: '양주농부마켓', url: 'https://market.yangju.go.kr/', region: '경기도', hasProducts: true },
  { id: 'mall_14', name: '마켓경기', url: 'https://smartstore.naver.com/marketgyeonggi', region: '경기도' },
  
  // 강원도
  { id: 'mall_15', name: '강원더몰', url: 'https://gwdmall.kr/', region: '강원도', hasProducts: true },
  { id: 'mall_16', name: '원주몰', url: 'https://wonju-mall.co.kr/', region: '강원도', hasProducts: true },
  { id: 'mall_17', name: '강릉몰', url: 'https://gangneung-mall.com/', region: '강원도', hasProducts: true },
  { id: 'mall_18', name: '고성몰', url: 'https://gwgoseong-mall.com/', region: '강원도', hasProducts: true },
  { id: 'mall_19', name: '동해몰', url: 'https://donghae-mall.com/', region: '강원도', hasProducts: true },
  { id: 'mall_20', name: '삼척몰', url: 'https://samcheok-mall.com/', region: '강원도', hasProducts: true },
  { id: 'mall_21', name: '양구몰', url: 'https://yanggu-mall.com/', region: '강원도', hasProducts: true },
  { id: 'mall_22', name: '양양몰', url: 'https://yangyang-mall.com/', region: '강원도', hasProducts: true },
  { id: 'mall_23', name: '영월몰', url: 'https://yeongwol-mall.com/', region: '강원도', hasProducts: true },
  { id: 'mall_24', name: '인제몰', url: 'https://inje-mall.com/', region: '강원도', hasProducts: true },
  { id: 'mall_25', name: '철원몰', url: 'https://cheorwon-mall.com/', region: '강원도', hasProducts: true },
  { id: 'mall_26', name: '정선몰', url: 'https://jeongseon-mall.com/', region: '강원도', hasProducts: true },
  { id: 'mall_27', name: '태백몰', url: 'https://taebaek-mall.com/', region: '강원도', hasProducts: true },
  { id: 'mall_28', name: '횡성몰', url: 'https://hoengseong-mall.com/', region: '강원도', hasProducts: true },
  { id: 'mall_29', name: '춘천몰', url: 'https://gwch-mall.com/', region: '강원도' },
  { id: 'mall_30', name: '홍천몰', url: 'https://hongcheon-mall.com/', region: '강원도', hasProducts: true },
  { id: 'mall_31', name: '평창몰', url: 'https://gwpc-mall.com/', region: '강원도', hasProducts: true },
  
  // 충청북도
  { id: 'mall_32', name: '제천로컬푸드', url: 'https://www.jclocal.co.kr', region: '충청북도' },
  { id: 'mall_33', name: '음성장터', url: 'https://www.esjang.go.kr/', region: '충청북도', hasProducts: true },
  { id: 'mall_34', name: '진천몰', url: 'https://jcmall.net/', region: '충청북도', hasProducts: true },
  { id: 'mall_35', name: '괴산장터', url: 'https://www.gsjangter.go.kr/', region: '충청북도', hasProducts: true },
  
  // 충청남도
  { id: 'mall_36', name: '농사랑', url: 'https://nongsarang.co.kr/', region: '충청남도', hasProducts: true },
  { id: 'mall_37', name: '당진팜', url: 'https://dangjinfarm.com/', region: '충청남도', hasProducts: true },
  { id: 'mall_38', name: 'e홍성장터', url: 'https://ehongseong.com/', region: '충청남도', hasProducts: true },
  { id: 'mall_39', name: '서산뜨레', url: 'https://seosanttre.com', region: '충청남도', hasProducts: true },
  
  // 전라북도
  { id: 'mall_40', name: '부안 텃밭할매', url: 'https://www.xn--9z2bv5bx25anyd.kr/', region: '전라북도', hasProducts: true },
  { id: 'mall_41', name: '단풍미인 (정읍)', url: 'https://www.danpoongmall.kr/', region: '전라북도', hasProducts: true },
  { id: 'mall_42', name: '지평선몰(김제)', url: 'https://www.jpsmall.com/', region: '전라북도' },
  { id: 'mall_43', name: '전북생생장터', url: 'https://freshjb.com/', region: '전라북도', hasProducts: true },
  { id: 'mall_44', name: '익산몰', url: 'https://iksanmall.com/', region: '전라북도', hasProducts: true },
  { id: 'mall_45', name: '진안고원몰', url: 'https://xn--299az5xoii3qb66f.com/', region: '전라북도' },
  { id: 'mall_46', name: '장수몰', url: 'https://www.장수몰.com/', region: '전라북도', hasProducts: true },
  { id: 'mall_47', name: '고창마켓', url: 'https://noblegochang.com/', region: '전라북도', hasProducts: true },
  { id: 'mall_48', name: '임실몰', url: 'https://www.imsilin.kr', region: '전라북도' },
  { id: 'mall_49', name: '순창로컬푸드쇼핑몰', url: 'https://smartstore.naver.com/schfarm', region: '전라북도' },
  { id: 'mall_50', name: '해가람', url: 'https://haegaram.com', region: '전라북도' },
  
  // 전라남도
  { id: 'mall_51', name: '남도장터', url: 'https://jnmall.kr/', region: '전라남도' },
  { id: 'mall_52', name: '여수몰', url: 'http://www.yeosumall.co.kr/', region: '전라남도' },
  { id: 'mall_53', name: '해피굿팜', url: 'https://smartstore.naver.com/hgoodfarm', region: '전라남도' },
  { id: 'mall_54', name: '보성몰', url: 'https://boseongmall.co.kr/', region: '전라남도' },
  { id: 'mall_55', name: '나주몰', url: 'https://najumall.kr/', region: '전라남도' },
  { id: 'mall_56', name: '순천로컬푸드함께가게', url: 'https://sclocal.kr/', region: '전라남도' },
  { id: 'mall_57', name: '신안1004몰', url: 'https://shinan1004mall.kr/', region: '전라남도' },
  { id: 'mall_58', name: '장흥몰', url: 'https://okjmall.com/', region: '전라남도' },
  { id: 'mall_59', name: '기찬들영암몰', url: 'https://yeongammall.co.kr/', region: '전라남도' },
  { id: 'mall_60', name: '진도아리랑몰', url: 'https://jindoarirangmall.com/', region: '전라남도' },
  { id: 'mall_61', name: '완도군이숍', url: 'https://wandofood.go.kr/', region: '전라남도' },
  { id: 'mall_62', name: '함평천지몰', url: 'https://함평천지몰.kr/', region: '전라남도' },
  { id: 'mall_63', name: '해남미소', url: 'https://www.hnmiso.com', region: '전라남도' },
  { id: 'mall_64', name: '담양장터', url: 'https://damyangmk.kr/', region: '전라남도' },
  { id: 'mall_65', name: '초록믿음(강진)', url: 'https://greengj.com/', region: '전라남도' },
  { id: 'mall_66', name: '화순팜', url: 'https://www.hwasunfarm.com/', region: '전라남도' },
  { id: 'mall_67', name: '곡성몰', url: 'https://gokseongmall.com/', region: '전라남도' },
  
  // 경상북도
  { id: 'mall_68', name: '사이소(경북몰)', url: 'https://www.cyso.co.kr/', region: '경상북도' },
  { id: 'mall_69', name: '상주 명실상주몰', url: 'https://sjmall.cyso.co.kr/', region: '경상북도' },
  { id: 'mall_70', name: '청도 청리브', url: 'https://cdmall.cyso.co.kr', region: '경상북도' },
  { id: 'mall_71', name: '영주장날', url: 'https://yjmarket.cyso.co.kr/', region: '경상북도' },
  { id: 'mall_72', name: '안동장터', url: 'https://andongjang.andong.go.kr/', region: '경상북도' },
  { id: 'mall_73', name: '청송몰', url: 'https://csmall.cyso.co.kr/', region: '경상북도' },
  { id: 'mall_74', name: '영양온심마켓', url: 'https://onsim.cyso.co.kr/', region: '경상북도' },
  { id: 'mall_75', name: '울릉도', url: 'https://ulmall.cyso.co.kr', region: '경상북도' },
  { id: 'mall_76', name: '봉화장터', url: 'https://bmall.cyso.co.kr/', region: '경상북도' },
  { id: 'mall_77', name: '고령몰', url: 'https://grmall.cyso.co.kr/', region: '경상북도' },
  { id: 'mall_78', name: '김천노다지장터', url: 'https://www.gcnodaji.com/', region: '경상북도' },
  { id: 'mall_79', name: '예천장터', url: 'https://ycjang.cyso.co.kr/', region: '경상북도' },
  { id: 'mall_80', name: '문경 새제의아침', url: 'https://mgmall.cyso.co.kr/', region: '경상북도' },
  { id: 'mall_81', name: '칠곡몰', url: 'https://cgmall.cyso.co.kr/', region: '경상북도' },
  { id: 'mall_82', name: '의성장날', url: 'https://esmall.cyso.co.kr/', region: '경상북도' },
  { id: 'mall_83', name: '울진몰', url: 'https://ujmall.cyso.co.kr/', region: '경상북도' },
  { id: 'mall_84', name: '영덕장터', url: 'https://ydmall.cyso.co.kr/', region: '경상북도' },
  { id: 'mall_85', name: '경산몰', url: 'https://gsmall.cyso.co.kr/', region: '경상북도' },
  { id: 'mall_86', name: '경주몰', url: 'https://gjmall.cyso.co.kr/', region: '경상북도' },
  { id: 'mall_87', name: '구미팜', url: 'https://gmmall.cyso.co.kr/', region: '경상북도' },
  { id: 'mall_88', name: '별빛촌장터(영천)', url: 'https://01000.cyso.co.kr/', region: '경상북도' },
  { id: 'mall_89', name: '포항마켓', url: 'https://pohangmarket.cyso.co.kr/', region: '경상북도' },
  
  // 경상남도
  { id: 'mall_90', name: 'e경남몰', url: 'https://egnmall.kr', region: '경상남도' },
  { id: 'mall_91', name: '토요애 (의령)', url: 'https://toyoae.com/', region: '경상남도' },
  { id: 'mall_92', name: '남해몰', url: 'https://enamhae.co.kr/', region: '경상남도' },
  { id: 'mall_93', name: '산엔청 (산청)', url: 'https://sanencheong.com/', region: '경상남도' },
  { id: 'mall_94', name: '공룡나라 (고성)', url: 'https://www.edinomall.com', region: '경상남도' },
  { id: 'mall_95', name: '함양몰', url: 'https://2900.co.kr/', region: '경상남도' },
  { id: 'mall_96', name: '진주드림', url: 'https://jinjudream.com/', region: '경상남도' },
  { id: 'mall_97', name: '함안몰', url: 'https://hamanmall.com', region: '경상남도' },
  { id: 'mall_98', name: '김해온몰', url: 'https://gimhaemall.kr', region: '경상남도', hasProducts: true },
  
  // 제주특별자치도
  { id: 'mall_99', name: '이제주몰', url: 'https://mall.ejeju.net', region: '제주특별자치도', hasProducts: true },
];

export default function MallsPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const sessionToken = localStorage.getItem('adminSession');
      
      if (!sessionToken) {
        router.push('/admin');
        return;
      }

      try {
        const response = await fetch('/api/admin/login', {
          headers: {
            'Authorization': `Bearer ${sessionToken}`
          }
        });

        if (response.ok) {
          setAuthenticated(true);
        } else {
          localStorage.removeItem('adminSession');
          router.push('/admin');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('adminSession');
        router.push('/admin');
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">인증 확인 중...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mb-6">
            <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h2 className="text-xl font-bold text-gray-800 mb-2">접근 권한이 필요합니다</h2>
            <p className="text-gray-600 mb-6">
              이 페이지는 관리자 전용입니다.<br />
              관리자 로그인 후 이용해주세요.
            </p>
          </div>
          <div className="space-y-3">
            <a
              href="/admin"
              className="block w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              관리자 로그인
            </a>
            <a
              href="/"
              className="block w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
            >
              홈으로 돌아가기
            </a>
          </div>
        </div>
      </div>
    );
  }

  const handleScrapeMall = async (mall: Mall) => {
    setLoading(mall.id);
    setMessage(null);

    try {
      const response = await fetch('/api/scrape-mall', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mallId: mall.id,
          mallName: mall.name,
          mallUrl: mall.url,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`Successfully scraped ${data.productCount} products from ${mall.name}`);
      } else {
        setMessage(`Error scraping ${mall.name}: ${data.error}`);
      }
    } catch (error) {
      setMessage(`Failed to scrape ${mall.name}: ${error}`);
    } finally {
      setLoading(null);
    }
  };

  const regions = [...new Set(malls.map(mall => mall.region))];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">전체 쇼핑몰 목록 (관리자 전용)</h1>
          <div className="flex space-x-4">
            <Link 
              href="/admin/dashboard"
              className="bg-primary text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              관리자 대시보드
            </Link>
            <button
              onClick={() => {
                localStorage.removeItem('adminSession');
                router.push('/admin');
              }}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>
        
        <Link 
          href="/"
          className="inline-block mb-6 text-blue-600 hover:text-blue-800 transition-colors"
        >
          ← 홈으로 돌아가기
        </Link>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('Error') || message.includes('Failed') 
              ? 'bg-red-100 text-red-700' 
              : 'bg-green-100 text-green-700'
          }`}>
            {message}
          </div>
        )}

        {regions.map(region => (
          <div key={region} className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">{region}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {malls
                .filter(mall => mall.region === region)
                .map(mall => (
                  <div 
                    key={mall.id} 
                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                  >
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {mall.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      <a 
                        href={mall.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        {mall.url}
                      </a>
                    </p>
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => handleScrapeMall(mall)}
                        disabled={loading === mall.id}
                        className={`px-4 py-2 rounded-md text-white font-medium transition-colors ${
                          loading === mall.id
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        {loading === mall.id ? '스크래핑 중...' : '스크래핑 시작'}
                      </button>
                      {mall.hasProducts && (
                        <span className="text-green-600 text-sm font-medium">
                          ✓ 제품 등록됨
                        </span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}