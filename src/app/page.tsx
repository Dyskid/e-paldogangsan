'use client';

import InteractiveMap from '@/components/InteractiveMap';
import FeaturedMalls from '@/components/FeaturedMalls';
import { getMalls, getRegions } from '@/lib/data';

export default function HomePage() {
  const malls = getMalls();
  const regions = getRegions();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-6">
              <span className="text-primary">모두의팔도장터</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              전국 지방자치단체 운영 온라인 쇼핑몰을 한 곳에서 만나보세요
            </p>
            <p className="text-lg text-gray-500">
              신선한 농수산물과 지역 특산품을 산지직송으로 구매하세요
            </p>
          </div>
        </div>
      </section>

      {/* Featured Malls Section - Moved above map */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FeaturedMalls 
            malls={malls}
            regions={regions}
            autoScroll={true}
            autoScrollInterval={5000}
          />
        </div>
      </section>

      {/* Interactive Map Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <InteractiveMap regions={regions} malls={malls} />
        </div>
      </section>

      {/* Products Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">전국 특산품 한눈에</h2>
            <p className="text-lg text-gray-600 mb-8">
              각 지역 쇼핑몰의 모든 상품을 카테고리별로 모아보세요
            </p>
            <a
              href="/products"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              전체 상품 보기
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
          </div>
        </div>
      </section>


      {/* Statistics Section */}
      <section className="py-16 bg-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">모두의팔도장터와 함께하는 로컬푸드</h2>
            <p className="text-blue-100 text-lg">
              전국 지방자치단체와 함께 만들어가는 건강한 먹거리 생태계
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">{malls.length}+</div>
              <div className="text-blue-100">등록된 쇼핑몰</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">{regions.length}</div>
              <div className="text-blue-100">참여 지역</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">100%</div>
              <div className="text-blue-100">정부 인증</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">24시간</div>
              <div className="text-blue-100">온라인 서비스</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}