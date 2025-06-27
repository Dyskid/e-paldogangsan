import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '이용약관 | 모두의팔도장터',
  description: '모두의팔도장터 서비스 이용약관을 확인하세요.',
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
              시행일: 2025년 6월 27일
            </p>
          </div>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">제1조 (목적)</h2>
              <p className="text-gray-700 leading-relaxed">
                이 약관은 모두의팔도장터(이하 "회사")가 운영하는 웹사이트(이하 "플랫폼")에서 제공하는 
                지방자치단체 온라인 쇼핑몰 정보 제공 및 연결 서비스(이하 "서비스")의 이용조건 및 절차, 
                회사와 이용자의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">제2조 (정의)</h2>
              <div className="space-y-4">
                <p className="text-gray-700">
                  이 약관에서 사용하는 용어의 정의는 다음과 같습니다:
                </p>
                <ul className="list-decimal pl-6 space-y-2 text-gray-700">
                  <li>"플랫폼"이란 회사가 운영하는 모두의팔도장터 웹사이트(www.e-paldogangsan.kr)를 말합니다.</li>
                  <li>"서비스"란 플랫폼을 통해 제공되는 정보 검색, 쇼핑몰 연결, 상품 정보 제공 등 일체의 서비스를 말합니다.</li>
                  <li>"이용자"란 플랫폼에 접속하여 이 약관에 따라 회사가 제공하는 서비스를 받는 자를 말합니다.</li>
                  <li>"판매자"란 플랫폼에 연결된 개별 지방자치단체 운영 쇼핑몰을 말합니다.</li>
                  <li>"연결서비스"란 플랫폼에서 판매자의 웹사이트로 이동할 수 있도록 제공하는 링크 서비스를 말합니다.</li>
                  <li>"콘텐츠"란 플랫폼에서 제공하는 상품 정보, 이미지, 텍스트 등 모든 정보를 말합니다.</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">제3조 (약관의 게시와 개정)</h2>
              <div className="space-y-4">
                <p className="text-gray-700">
                  ① 회사는 이 약관의 내용을 이용자가 쉽게 알 수 있도록 플랫폼 초기 화면 또는 연결화면을 통해 게시합니다.
                </p>
                <p className="text-gray-700">
                  ② 회사는 「전자상거래 등에서의 소비자보호에 관한 법률」, 「약관의 규제에 관한 법률」, 
                  「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 등 관련 법령을 위배하지 않는 범위에서 
                  이 약관을 개정할 수 있습니다.
                </p>
                <p className="text-gray-700">
                  ③ 회사가 약관을 개정할 경우에는 적용일자 및 개정사유를 명시하여 현행약관과 함께 
                  플랫폼의 초기화면에 그 적용일자 7일 이전부터 적용일자 전일까지 공지합니다.
                </p>
                <p className="text-gray-700">
                  ④ 이용자가 개정약관의 적용에 동의하지 않는 경우, 서비스 이용을 중단하고 탈퇴할 수 있습니다. 
                  약관 개정 공지 후 서비스를 계속 이용하는 경우 개정약관에 동의한 것으로 간주합니다.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">제4조 (서비스의 제공 및 변경)</h2>
              <div className="space-y-4">
                <p className="text-gray-700">
                  ① 회사는 다음과 같은 서비스를 제공합니다:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>전국 지방자치단체 운영 온라인 쇼핑몰 정보 제공</li>
                  <li>쇼핑몰 및 상품 검색 서비스</li>
                  <li>지역별, 카테고리별 분류 서비스</li>
                  <li>판매자 웹사이트로의 연결 서비스</li>
                  <li>상품 정보 업데이트 및 관리 서비스</li>
                  <li>기타 회사가 추가 개발하거나 제휴를 통해 제공하는 서비스</li>
                </ul>
                <p className="text-gray-700">
                  ② 서비스는 연중무휴, 1일 24시간 제공함을 원칙으로 합니다. 다만, 회사의 업무상 또는 
                  기술상의 이유로 서비스가 일시 중지될 수 있으며, 이 경우 회사는 사전 또는 사후에 이를 공지합니다.
                </p>
                <p className="text-gray-700">
                  ③ 회사는 서비스의 내용을 변경할 경우에는 변경사유 및 내용을 플랫폼에 공지합니다.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">제5조 (서비스 이용계약의 성립)</h2>
              <div className="space-y-4">
                <p className="text-gray-700">
                  ① 서비스 이용계약은 이용자가 플랫폼에 접속하여 서비스를 이용함으로써 성립됩니다.
                </p>
                <p className="text-gray-700">
                  ② 회사는 다음 각 호에 해당하는 경우 서비스 이용을 제한할 수 있습니다:
                </p>
                <ul className="list-decimal pl-6 space-y-2 text-gray-700">
                  <li>서비스 관련 설비의 여유가 없는 경우</li>
                  <li>기술상 지장이 있는 경우</li>
                  <li>기타 회사의 사정상 서비스 제공이 곤란한 경우</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">제6조 (이용자의 의무)</h2>
              <div className="space-y-4">
                <p className="text-gray-700">
                  ① 이용자는 다음 행위를 하여서는 안 됩니다:
                </p>
                <ul className="list-decimal pl-6 space-y-2 text-gray-700">
                  <li>타인의 정보를 도용하는 행위</li>
                  <li>회사가 게시한 정보를 변경하는 행위</li>
                  <li>회사가 정한 정보 이외의 정보(컴퓨터 프로그램 등) 등의 송신 또는 게시하는 행위</li>
                  <li>회사와 기타 제3자의 저작권 등 지적재산권을 침해하는 행위</li>
                  <li>회사 및 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위</li>
                  <li>외설 또는 폭력적인 메시지, 화상, 음성, 기타 공서양속에 반하는 정보를 플랫폼에 공개 또는 게시하는 행위</li>
                  <li>서비스의 안정적인 운영을 방해할 수 있는 정보를 전송하거나 수신을 방해하는 행위</li>
                  <li>기타 불법적이거나 부당한 행위</li>
                </ul>
                <p className="text-gray-700">
                  ② 이용자는 관계법령, 이 약관의 규정, 이용안내 및 서비스와 관련하여 공지한 주의사항, 
                  회사가 통지하는 사항 등을 준수하여야 하며, 기타 회사의 업무에 방해되는 행위를 하여서는 안 됩니다.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">제7조 (개인정보보호)</h2>
              <div className="space-y-4">
                <p className="text-gray-700">
                  ① 회사는 이용자의 개인정보를 보호하기 위하여 「개인정보 보호법」, 
                  「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 등 관련 법령에서 정하는 바를 준수합니다.
                </p>
                <p className="text-gray-700">
                  ② 회사는 이용자의 개인정보를 보호하기 위한 개인정보처리방침을 수립하여 
                  플랫폼에 게시합니다.
                </p>
                <p className="text-gray-700">
                  ③ 회사는 이용자의 귀책사유로 인해 노출된 개인정보에 대해서는 책임을 지지 않습니다.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">제8조 (회사의 의무)</h2>
              <div className="space-y-4">
                <p className="text-gray-700">
                  ① 회사는 법령과 이 약관이 금지하거나 공서양속에 반하는 행위를 하지 않으며, 
                  계속적이고 안정적으로 서비스를 제공하기 위하여 최선을 다하여 노력합니다.
                </p>
                <p className="text-gray-700">
                  ② 회사는 이용자가 안전하게 서비스를 이용할 수 있도록 개인정보보호를 위한 
                  보안시스템을 구축하며 개인정보처리방침을 공시하고 준수합니다.
                </p>
                <p className="text-gray-700">
                  ③ 회사는 서비스 이용과 관련하여 이용자로부터 제기된 의견이나 불만이 정당하다고 
                  인정할 경우에는 이를 처리하기 위해 노력합니다.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">제9조 (연결서비스와 관련한 회사의 책임)</h2>
              <div className="space-y-4">
                <p className="text-gray-700">
                  ① 회사는 이용자에게 판매자가 운영하는 쇼핑몰로의 연결서비스만을 제공하며, 
                  판매자와 이용자 간의 상품거래에 대해서는 어떠한 책임도 지지 않습니다.
                </p>
                <p className="text-gray-700">
                  ② 회사는 판매자가 게재한 상품정보, 거래조건, 거래의 이행 등에 대해 
                  어떠한 보증이나 대리를 하지 않습니다.
                </p>
                <p className="text-gray-700">
                  ③ 이용자는 판매자의 쇼핑몰에서 상품을 구매하기 전에 반드시 판매자의 
                  판매조건, 배송정책, 환불규정 등을 확인해야 합니다.
                </p>
                <p className="text-gray-700">
                  ④ 판매자가 독자적으로 제공하는 서비스 및 콘텐츠에 대한 모든 책임은 
                  각 판매자에게 있으며, 회사는 이에 대한 책임을 지지 않습니다.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">제10조 (저작권의 귀속 및 이용제한)</h2>
              <div className="space-y-4">
                <p className="text-gray-700">
                  ① 회사가 작성한 저작물에 대한 저작권 기타 지적재산권은 회사에 귀속합니다.
                </p>
                <p className="text-gray-700">
                  ② 이용자는 플랫폼을 이용함으로써 얻은 정보 중 회사에게 지적재산권이 귀속된 정보를 
                  회사의 사전 승낙 없이 복제, 송신, 출판, 배포, 방송 기타 방법에 의하여 영리목적으로 
                  이용하거나 제3자에게 이용하게 하여서는 안 됩니다.
                </p>
                <p className="text-gray-700">
                  ③ 회사는 약정에 따라 이용자에게 귀속된 저작권을 사용하는 경우 당해 이용자에게 통보하여야 합니다.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">제11조 (면책조항)</h2>
              <div className="space-y-4">
                <p className="text-gray-700">
                  ① 회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 
                  서비스 제공에 관한 책임이 면제됩니다.
                </p>
                <p className="text-gray-700">
                  ② 회사는 이용자의 귀책사유로 인한 서비스 이용의 장애에 대하여는 책임을 지지 않습니다.
                </p>
                <p className="text-gray-700">
                  ③ 회사는 이용자가 서비스와 관련하여 게재한 정보, 자료, 사실의 신뢰도, 정확성 등의 
                  내용에 관하여는 책임을 지지 않습니다.
                </p>
                <p className="text-gray-700">
                  ④ 회사는 이용자 간 또는 이용자와 제3자 상호간에 서비스를 매개로 하여 거래 등을 한 경우에는 
                  책임이 면제됩니다.
                </p>
                <p className="text-gray-700">
                  ⑤ 회사는 무료로 제공되는 서비스 이용과 관련하여 관련법령에 특별한 규정이 없는 한 
                  책임을 지지 않습니다.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">제12조 (분쟁해결)</h2>
              <div className="space-y-4">
                <p className="text-gray-700">
                  ① 회사는 이용자가 제기하는 정당한 의견이나 불만을 반영하고 그 피해를 보상처리하기 위하여 
                  피해보상처리기구를 설치·운영합니다.
                </p>
                <p className="text-gray-700">
                  ② 회사는 이용자로부터 제출되는 불만사항 및 의견은 우선적으로 그 사항을 처리합니다. 
                  다만, 신속한 처리가 곤란한 경우에는 이용자에게 그 사유와 처리일정을 즉시 통보합니다.
                </p>
                <p className="text-gray-700">
                  ③ 회사와 이용자 간에 발생한 전자상거래 분쟁과 관련하여 이용자의 피해구제신청이 있는 경우에는 
                  공정거래위원회 또는 시·도지사가 의뢰하는 분쟁조정기관의 조정에 따를 수 있습니다.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">제13조 (재판권 및 준거법)</h2>
              <div className="space-y-4">
                <p className="text-gray-700">
                  ① 회사와 이용자 간에 발생한 분쟁에 관한 소송은 제소 당시 이용자의 주소에 의하고, 
                  주소가 없는 경우에는 거소를 관할하는 지방법원의 전속관할로 합니다. 다만, 제소 당시 
                  이용자의 주소 또는 거소가 분명하지 않거나 외국 거주자의 경우에는 민사소송법상의 
                  관할법원에 제기합니다.
                </p>
                <p className="text-gray-700">
                  ② 회사와 이용자 간에 제기된 소송에는 대한민국법을 적용합니다.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">부칙</h2>
              <div className="space-y-4">
                <p className="text-gray-700">
                  제1조 (시행일) 이 약관은 2025년 6월 27일부터 시행합니다.
                </p>
                <p className="text-gray-700">
                  제2조 (기존 이용자에 대한 경과조치) 이 약관 시행 이전에 서비스를 이용하고 있던 
                  이용자에게도 이 약관의 규정이 적용됩니다.
                </p>
              </div>
            </section>

            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200 mt-12">
              <h3 className="font-bold text-gray-800 mb-4">관련 법령</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 text-sm">
                <li>전자상거래 등에서의 소비자보호에 관한 법률</li>
                <li>정보통신망 이용촉진 및 정보보호 등에 관한 법률</li>
                <li>개인정보 보호법</li>
                <li>약관의 규제에 관한 법률</li>
                <li>콘텐츠산업 진흥법</li>
                <li>전자문서 및 전자거래 기본법</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 mt-8">
              <h3 className="font-bold text-gray-800 mb-2">문의사항</h3>
              <p className="text-gray-700">
                본 약관에 대한 문의사항이 있으시면 
                <a href="/contact" className="text-primary hover:underline ml-1">문의하기</a>를 
                통해 연락해주세요.
              </p>
              <p className="text-gray-600 text-sm mt-2">
                이메일: rkdsim90@gmail.com
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}