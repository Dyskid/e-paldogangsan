import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '서비스 소개 | 모두의팔도장터',
  description: '모두의팔도장터는 전국 지방자치단체가 운영하는 온라인 쇼핑몰을 한 곳에서 만날 수 있는 포털 서비스입니다.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              모두의팔도장터 소개
            </h1>
            <p className="text-lg text-gray-600">
              대한민국 지역 특산품 쇼핑몰을 한 곳에서
            </p>
          </div>

          {/* Mission */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">우리의 사명</h2>
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
              <p className="text-gray-700 leading-relaxed">
                모두의팔도장터는 전국 지방자치단체가 운영하는 농수산물 및 특산품 온라인 쇼핑몰을 
                한 곳에서 쉽게 찾고 이용할 수 있도록 돕는 포털 서비스입니다. 
                지역 생산자와 소비자를 직접 연결하여 신선하고 안전한 먹거리를 제공하고, 
                지역 경제 활성화에 기여하는 것이 우리의 목표입니다.
              </p>
            </div>
          </section>

          {/* Features */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">주요 서비스</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="text-primary mb-4">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">정부 인증 쇼핑몰</h3>
                <p className="text-gray-600">
                  지방자치단체가 직접 운영하는 신뢰할 수 있는 온라인 쇼핑몰만을 엄선하여 제공합니다.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <div className="text-primary mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">통합 검색</h3>
                <p className="text-gray-600">
                  여러 쇼핑몰의 상품을 한 번에 검색하고 비교할 수 있어 원하는 상품을 쉽게 찾을 수 있습니다.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <div className="text-primary mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">지역별 탐색</h3>
                <p className="text-gray-600">
                  대한민국 지도를 통해 지역별 특산품과 쇼핑몰을 직관적으로 탐색할 수 있습니다.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <div className="text-primary mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">안전한 거래</h3>
                <p className="text-gray-600">
                  모든 등록 쇼핑몰의 링크를 정기적으로 검증하여 안전하고 신뢰할 수 있는 쇼핑 환경을 제공합니다.
                </p>
              </div>
            </div>
          </section>

          {/* Values */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">우리의 가치</h2>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-6 h-6 bg-primary rounded-full flex-shrink-0 mt-1"></div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">지역 상생</h3>
                  <p className="text-gray-600">지역 생산자의 판로 확대와 소비자의 편의를 동시에 추구합니다.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-6 h-6 bg-primary rounded-full flex-shrink-0 mt-1"></div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">투명성</h3>
                  <p className="text-gray-600">모든 정보를 투명하게 제공하여 신뢰할 수 있는 서비스를 만듭니다.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-6 h-6 bg-primary rounded-full flex-shrink-0 mt-1"></div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">편의성</h3>
                  <p className="text-gray-600">사용자가 쉽고 편리하게 원하는 상품을 찾을 수 있도록 돕습니다.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Stats */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">서비스 현황</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center bg-blue-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-primary mb-1">84</div>
                <div className="text-sm text-gray-600">등록 쇼핑몰</div>
              </div>
              <div className="text-center bg-yellow-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-yellow-600 mb-1">10</div>
                <div className="text-sm text-gray-600">상품 카테고리</div>
              </div>
              <div className="text-center bg-purple-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-600 mb-1">100%</div>
                <div className="text-sm text-gray-600">정부 인증</div>
              </div>
            </div>
          </section>

          {/* Contact CTA */}
          <section className="text-center bg-gray-50 rounded-lg p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              더 자세한 정보가 필요하신가요?
            </h2>
            <p className="text-gray-600 mb-6">
              모두의팔도장터 서비스에 대해 궁금한 점이 있으시면 언제든 문의해주세요.
            </p>
            <a
              href="/contact"
              className="inline-flex items-center px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              문의하기
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </section>
        </div>
      </div>
    </div>
  );
}