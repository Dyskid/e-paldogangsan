import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '문의하기 | 모두의팔도장터',
  description: '모두의팔도장터 서비스에 대한 문의사항이 있으시면 언제든 연락해주세요.',
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {/* Header */}
          <div className="bg-primary text-white text-center py-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">문의하기</h1>
            <p className="text-lg text-blue-100">
              모두의팔도장터 서비스에 대해 궁금한 점이 있으시면 언제든 연락해주세요
            </p>
          </div>

          <div className="p-8 md:p-12">
            {/* Quick Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">이메일</h3>
                <p className="text-gray-600">rkdsim90@gmail.com</p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">운영시간</h3>
                <p className="text-gray-600">평일 10:00 - 16:00</p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">응답시간</h3>
                <p className="text-gray-600">1-2 영업일 내</p>
              </div>
            </div>

            {/* Contact Form */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">문의 양식</h2>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      이름 *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      placeholder="홍길동"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      이메일 *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      placeholder="example@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    문의 유형 *
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="">선택해주세요</option>
                    <option value="service">서비스 이용 문의</option>
                    <option value="technical">기술적 문제</option>
                    <option value="partnership">파트너십 문의</option>
                    <option value="suggestion">개선 제안</option>
                    <option value="other">기타</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="organization" className="block text-sm font-medium text-gray-700 mb-2">
                    소속 기관 (선택사항)
                  </label>
                  <input
                    type="text"
                    id="organization"
                    name="organization"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="예: 서울시청, ABC 농협 등"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    문의 내용 *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="문의하실 내용을 자세히 작성해주세요..."
                  ></textarea>
                </div>

                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="privacy"
                    name="privacy"
                    required
                    className="mt-1 text-primary focus:ring-primary"
                  />
                  <label htmlFor="privacy" className="ml-2 text-sm text-gray-600">
                    개인정보 수집 및 이용에 동의합니다. 
                    <a href="/privacy" className="text-primary hover:underline ml-1">
                      (개인정보처리방침 보기)
                    </a>
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full md:w-auto px-8 py-3 bg-primary text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  문의 보내기
                </button>
              </form>
            </section>

            {/* FAQ Section */}
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">자주 묻는 질문</h2>
              <div className="space-y-4">
                <details className="bg-gray-50 rounded-lg p-4">
                  <summary className="font-medium text-gray-800 cursor-pointer">
                    모두의팔도장터는 어떤 서비스인가요?
                  </summary>
                  <p className="mt-3 text-gray-600">
                    전국 지방자치단체가 운영하는 농수산물 및 특산품 온라인 쇼핑몰을 한 곳에서 찾을 수 있는 포털 서비스입니다.
                  </p>
                </details>

                <details className="bg-gray-50 rounded-lg p-4">
                  <summary className="font-medium text-gray-800 cursor-pointer">
                    쇼핑몰 등록은 어떻게 하나요?
                  </summary>
                  <p className="mt-3 text-gray-600">
                    지방자치단체에서 운영하는 공식 쇼핑몰만 등록 가능합니다. 등록을 원하시면 문의 양식을 통해 연락해주세요.
                  </p>
                </details>

                <details className="bg-gray-50 rounded-lg p-4">
                  <summary className="font-medium text-gray-800 cursor-pointer">
                    서비스 이용료가 있나요?
                  </summary>
                  <p className="mt-3 text-gray-600">
                    모두의팔도장터 포털 서비스는 완전 무료로 제공됩니다. 실제 상품 구매는 각 쇼핑몰에서 진행됩니다.
                  </p>
                </details>

                <details className="bg-gray-50 rounded-lg p-4">
                  <summary className="font-medium text-gray-800 cursor-pointer">
                    쇼핑몰 링크가 작동하지 않아요.
                  </summary>
                  <p className="mt-3 text-gray-600">
                    정기적으로 링크를 검증하고 있지만, 문제가 있다면 즉시 문의해주세요. 빠르게 확인하여 수정하겠습니다.
                  </p>
                </details>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}