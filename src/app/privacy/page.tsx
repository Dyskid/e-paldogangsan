import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '개인정보처리방침 | 모두의팔도장터',
  description: '모두의팔도장터 개인정보처리방침을 확인하세요.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border p-8 md:p-12">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              개인정보처리방침
            </h1>
            <p className="text-gray-600">
              최종 개정일: 2024년 1월 1일 | 시행일: 2024년 1월 1일
            </p>
          </div>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">제1조 (개인정보의 처리목적)</h2>
              <p className="text-gray-700 leading-relaxed">
                모두의팔도장터(이하 "서비스")는 다음의 목적을 위하여 개인정보를 처리합니다. 
                처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 
                이용 목적이 변경되는 경우에는 개인정보보호법 제18조에 따라 별도의 동의를 받는 등 
                필요한 조치를 이행할 예정입니다.
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mt-4">
                <li>서비스 제공 및 운영</li>
                <li>이용자 문의 및 고객상담 대응</li>
                <li>서비스 이용 통계 분석 및 개선</li>
                <li>공지사항 전달</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">제2조 (개인정보의 처리 및 보유기간)</h2>
              <div className="space-y-4">
                <p className="text-gray-700">
                  서비스는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 
                  수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.
                </p>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-800 mb-2">문의 접수 정보</h3>
                  <ul className="text-gray-700 space-y-1">
                    <li>• 처리목적: 이용자 문의 대응</li>
                    <li>• 보유기간: 문의 처리 완료 후 1년</li>
                    <li>• 처리항목: 이름, 이메일, 문의내용</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">제3조 (개인정보의 제3자 제공)</h2>
              <p className="text-gray-700">
                서비스는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다. 
                다만, 아래의 경우에는 예외로 합니다:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mt-4">
                <li>이용자가 사전에 동의한 경우</li>
                <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">제4조 (개인정보처리 위탁)</h2>
              <p className="text-gray-700">
                현재 서비스는 개인정보 처리업무를 외부에 위탁하지 않습니다. 
                향후 처리업무 위탁이 필요한 경우, 위탁계약 체결 시 개인정보보호법 제26조에 따라 
                위탁업무 수행목적 외 개인정보 처리금지, 기술적·관리적 보호조치, 재위탁 제한, 
                수탁자에 대한 관리·감독, 손해배상 등 책임에 관한 사항을 계약서 등 문서에 명시하고, 
                수탁자가 개인정보를 안전하게 처리하는지를 감독하겠습니다.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">제5조 (정보주체의 권리·의무 및 행사방법)</h2>
              <div className="space-y-4">
                <p className="text-gray-700">
                  이용자는 개인정보주체로서 다음과 같은 권리를 행사할 수 있습니다:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>개인정보 처리현황 통지요구</li>
                  <li>개인정보 열람요구</li>
                  <li>개인정보 정정·삭제요구</li>
                  <li>개인정보 처리정지요구</li>
                </ul>
                <p className="text-gray-700">
                  위의 권리 행사는 개인정보보호법 시행령 제41조제1항에 따라 서면, 전자우편, 
                  모사전송(FAX) 등을 통하여 하실 수 있으며 서비스는 이에 대해 지체없이 조치하겠습니다.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">제6조 (개인정보의 파기)</h2>
              <div className="space-y-4">
                <p className="text-gray-700">
                  서비스는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 
                  지체없이 해당 개인정보를 파기합니다.
                </p>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-800 mb-2">파기절차</h3>
                  <ul className="text-gray-700 space-y-1">
                    <li>• 전자적 파일형태: 기록을 재생할 수 없도록 로우레벨포맷 등의 방법을 이용하여 파기</li>
                    <li>• 종이문서: 분쇄기로 분쇄하거나 소각하여 파기</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">제7조 (개인정보의 안전성 확보조치)</h2>
              <p className="text-gray-700">
                서비스는 개인정보보호법 제29조에 따라 다음과 같이 안전성 확보에 필요한 기술적/관리적 및 
                물리적 조치를 하고 있습니다:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mt-4">
                <li>개인정보에 대한 접근 제한</li>
                <li>개인정보를 처리하는 데이터베이스시스템에 대한 접근권한의 부여, 변경, 말소를 통하여 개인정보에 대한 접근통제를 위하여 필요한 조치</li>
                <li>개인정보의 안전한 저장을 위한 보안시스템 구축</li>
                <li>개인정보 취급 직원의 최소화 및 교육</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">제8조 (쿠키의 사용)</h2>
              <div className="space-y-4">
                <p className="text-gray-700">
                  서비스는 이용자에게 최적화된 서비스를 제공하기 위해 쿠키를 사용할 수 있습니다.
                </p>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-800 mb-2">쿠키 사용 목적</h3>
                  <ul className="text-gray-700 space-y-1">
                    <li>• 서비스 이용 분석 및 개선</li>
                    <li>• 이용자 맞춤형 서비스 제공</li>
                    <li>• 웹사이트 트래픽 분석</li>
                  </ul>
                </div>
                <p className="text-gray-700">
                  이용자는 웹브라우저 설정을 통해 쿠키 허용, 차단 등의 설정을 할 수 있습니다.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">제9조 (개인정보 보호책임자)</h2>
              <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                <p className="text-gray-700 mb-4">
                  서비스는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 
                  정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
                </p>
                <div className="space-y-2">
                  <p className="text-gray-700"><span className="font-medium">책임자:</span> 모두의팔도장터 운영팀</p>
                  <p className="text-gray-700"><span className="font-medium">연락처:</span> contact@e-paldogangsan.kr</p>
                  <p className="text-gray-700 text-sm">
                    개인정보 처리와 관련하여 문의사항이나 불만처리, 피해구제가 필요하신 경우 위 연락처로 연락해주시기 바랍니다.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">제10조 (개인정보 처리방침 변경)</h2>
              <p className="text-gray-700">
                이 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 
                삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.
              </p>
            </section>

            <div className="bg-green-50 rounded-lg p-6 border border-green-200 mt-12">
              <h3 className="font-bold text-gray-800 mb-2">개인정보 침해신고센터</h3>
              <p className="text-gray-700 mb-4">
                개인정보 침해로 인한 신고나 상담이 필요하신 경우 아래 기관에 문의하실 수 있습니다.
              </p>
              <div className="space-y-2 text-sm text-gray-700">
                <p>• 개인정보 침해신고센터 (privacy.go.kr / 국번없이 182)</p>
                <p>• 개인정보 분쟁조정위원회 (www.kopico.go.kr / 1833-6972)</p>
                <p>• 대검찰청 사이버범죄수사단 (www.spo.go.kr / 국번없이 1301)</p>
                <p>• 경찰청 사이버테러대응센터 (www.netan.go.kr / 국번없이 182)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}