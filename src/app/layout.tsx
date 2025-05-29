import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'e-팔도강산 | 대한민국 지역 특산품 쇼핑몰 포털',
  description: '전국 지방자치단체 운영 온라인 쇼핑몰을 한 곳에서 만나보세요. 신선한 농수산물과 지역 특산품을 산지직송으로 구매하세요.',
  keywords: ['지역특산품', '농수산물', '산지직송', '로컬푸드', '정부인증', '전국특산품'],
  openGraph: {
    title: 'e-팔도강산 | 대한민국 지역 특산품 쇼핑몰 포털',
    description: '전국 지방자치단체 운영 온라인 쇼핑몰을 한 곳에서 만나보세요.',
    type: 'website',
    locale: 'ko_KR',
  },
  robots: 'index, follow',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <a href="/" className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">e팔</span>
                  </div>
                  <span className="text-xl font-bold text-gray-800">팔도강산</span>
                </a>
              </div>
              
              <div className="hidden md:flex items-center space-x-8">
                <a href="/search" className="text-gray-600 hover:text-primary transition-colors duration-200">
                  쇼핑몰 검색
                </a>
                <a href="/about" className="text-gray-600 hover:text-primary transition-colors duration-200">
                  소개
                </a>
                <a href="/contact" className="text-gray-600 hover:text-primary transition-colors duration-200">
                  문의
                </a>
              </div>

              <div className="md:hidden">
                <button className="text-gray-600 hover:text-primary transition-colors duration-200">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </nav>
        </header>

        <main>
          {children}
        </main>

        <footer className="bg-gray-800 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                    <span className="text-primary font-bold text-sm">e팔</span>
                  </div>
                  <span className="text-xl font-bold">팔도강산</span>
                </div>
                <p className="text-gray-300 mb-4">
                  전국 지방자치단체가 운영하는 농수산물 및 특산품 온라인 쇼핑몰을 한 곳에서 만나보세요.
                </p>
                <p className="text-sm text-gray-400">
                  신선한 산지직송 상품으로 건강한 식탁을 만들어보세요.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">빠른 링크</h3>
                <ul className="space-y-2 text-sm">
                  <li><a href="/search" className="text-gray-300 hover:text-white transition-colors duration-200">쇼핑몰 검색</a></li>
                  <li><a href="/about" className="text-gray-300 hover:text-white transition-colors duration-200">서비스 소개</a></li>
                  <li><a href="/contact" className="text-gray-300 hover:text-white transition-colors duration-200">문의하기</a></li>
                  <li><a href="/terms" className="text-gray-300 hover:text-white transition-colors duration-200">이용약관</a></li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">고객지원</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>운영시간: 평일 09:00 - 18:00</li>
                  <li>점심시간: 12:00 - 13:00</li>
                  <li>주말 및 공휴일 휴무</li>
                </ul>
              </div>
            </div>
            
            <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-400">
              <p>&copy; 2024 e-팔도강산. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}