import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '이용약관 | e-팔도강산',
  description: 'e-팔도강산 서비스 이용약관을 확인하세요.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border p-8 md:p-12">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              이용약관
            </h1>
            <p className="text-gray-600">
              최종 개정일: 2024년 1월 1일
            </p>
          </div>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">제1조 (목적)</h2>
              <p className="text-gray-700 leading-relaxed">
                이 약관은 e-팔도강산(이하 "서비스")이 제공하는 인터넷 관련 서비스(이하 "서비스")를 
                이용함에 있어 서비스 제공자와 이용자의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">제2조 (정의)</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-700">
                    <span className="font-medium">1. "서비스"</span>란 e-팔도강산이 제공하는 
                    지방자치단체 온라인 쇼핑몰 정보 제공 및 연결 서비스를 의미합니다.
                  </p>
                </div>
                <div>
                  <p className="text-gray-700">
                    <span className="font-medium">2. "이용자"</span>란 본 약관에 따라 
                    서비스를 이용하는 개인 또는 법인을 말합니다.
                  </p>
                </div>
                <div>
                  <p className="text-gray-700">
                    <span className="font-medium">3. "연결서비스"</span>란 서비스와 연결된 
                    지방자치단체 운영 온라인 쇼핑몰을 의미합니다.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">제3조 (약관의 효력 및 변경)</h2>
              <div className="space-y-4">
                <p className="text-gray-700">
                  1. 이 약관은 서비스를 이용하고자 하는 모든 이용자에 대하여 그 효력을 발생합니다.
                </p>
                <p className="text-gray-700">
                  2. 서비스는 필요하다고 인정되는 경우 이 약관을 변경할 수 있으며, 
                  변경된 약관은 서비스 내 공지를 통해 공지됩니다.
                </p>
                <p className="text-gray-700">
                  3. 이용자가 변경된 약관에 동의하지 않는 경우, 서비스 이용을 중단할 수 있습니다.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">제4조 (서비스의 제공)</h2>
              <div className="space-y-4">
                <p className="text-gray-700">
                  1. 서비스는 다음과 같은 업무를 수행합니다:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>지방자치단체 운영 온라인 쇼핑몰 정보 제공</li>
                  <li>쇼핑몰 검색 및 카테고리별 분류 서비스</li>
                  <li>지역별 특산품 정보 제공</li>
                  <li>외부 쇼핑몰로의 연결 서비스</li>
                </ul>
                <p className="text-gray-700">
                  2. 서비스는 연중무휴, 1일 24시간 제공됩니다. 단, 시스템 점검 등의 
                  필요에 의해 서비스가 일시 중단될 수 있습니다.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">제5조 (이용자의 의무)</h2>
              <div className="space-y-4">
                <p className="text-gray-700">
                  이용자는 다음 행위를 하여서는 안 됩니다:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>서비스의 정상적인 운영을 방해하는 행위</li>
                  <li>다른 이용자의 서비스 이용을 방해하는 행위</li>
                  <li>타인의 명예를 손상시키거나 불이익을 주는 행위</li>
                  <li>공공질서 및 미풍양속에 반하는 내용의 정보 등을 타인에게 유포하는 행위</li>
                  <li>서비스와 관련된 설비의 오동작이나 정보 등의 파괴 및 혼란을 유발시키는 행위</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">제6조 (개인정보보호)</h2>
              <p className="text-gray-700">
                서비스는 이용자의 개인정보를 보호하기 위하여 개인정보처리방침을 수립하고 
                시행하고 있습니다. 자세한 내용은 개인정보처리방침을 참조하시기 바랍니다.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">제7조 (연결서비스에 대한 면책)</h2>
              <div className="space-y-4">
                <p className="text-gray-700">
                  1. 서비스는 연결서비스의 내용, 품질, 거래과정 등에 대해 어떠한 보증도 하지 않습니다.
                </p>
                <p className="text-gray-700">
                  2. 이용자가 연결서비스를 통해 진행한 거래나 이용과 관련하여 발생한 손해에 대해 
                  서비스는 책임을 지지 않습니다.
                </p>
                <p className="text-gray-700">
                  3. 연결서비스의 장애, 중단, 오류 등으로 인한 손해에 대해 서비스는 책임을 지지 않습니다.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">제8조 (손해배상)</h2>
              <p className="text-gray-700">
                서비스는 무료로 제공되는 정보 제공 서비스로서, 서비스 이용과 관련하여 
                이용자에게 발생한 어떠한 손해에 대해서도 책임을 지지 않습니다. 
                단, 서비스의 고의 또는 중과실로 인한 손해의 경우에는 그러하지 아니합니다.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">제9조 (분쟁해결)</h2>
              <div className="space-y-4">
                <p className="text-gray-700">
                  1. 서비스와 이용자 간에 발생한 분쟁에 관한 소송은 민사소송법상의 관할법원에 제기합니다.
                </p>
                <p className="text-gray-700">
                  2. 서비스와 이용자 간에 제기된 소송에는 한국법을 적용합니다.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">제10조 (기타)</h2>
              <p className="text-gray-700">
                이 약관에 명시되지 않은 사항에 대해서는 관련 법령이나 상관례에 따릅니다.
              </p>
            </section>

            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200 mt-12">
              <h3 className="font-bold text-gray-800 mb-2">문의사항</h3>
              <p className="text-gray-700">
                본 약관에 대한 문의사항이 있으시면 
                <a href="/contact" className="text-primary hover:underline ml-1">문의하기</a>를 
                통해 연락해주세요.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}