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
              시행일: 2025년 6월 27일
            </p>
          </div>

          <div className="prose prose-lg max-w-none">
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200 mb-8">
              <p className="text-gray-700">
                모두의팔도장터(이하 "회사")는 개인정보보호법 제30조에 따라 정보주체의 개인정보를 보호하고 
                이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 하기 위하여 다음과 같이 개인정보 처리방침을 수립·공개합니다.
              </p>
            </div>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">제1조 (개인정보의 처리목적)</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 
                다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 
                개인정보보호법 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
              </p>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h3 className="font-medium text-gray-800 mb-2">1. 홈페이지 회원가입 및 관리</h3>
                <ul className="text-gray-700 space-y-1 text-sm">
                  <li>• 서비스 이용에 따른 본인확인, 개인식별</li>
                  <li>• 부정이용 방지, 비인가 사용방지</li>
                  <li>• 서비스 제공 및 개선</li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h3 className="font-medium text-gray-800 mb-2">2. 민원사무 처리</h3>
                <ul className="text-gray-700 space-y-1 text-sm">
                  <li>• 민원인의 신원 확인, 민원사항 확인</li>
                  <li>• 사실조사를 위한 연락·통지</li>
                  <li>• 처리결과 통보</li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h3 className="font-medium text-gray-800 mb-2">3. 재화 또는 서비스 제공</h3>
                <ul className="text-gray-700 space-y-1 text-sm">
                  <li>• 정보제공 서비스 제공</li>
                  <li>• 콘텐츠 제공, 맞춤서비스 제공</li>
                  <li>• 본인인증, 연령확인</li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-800 mb-2">4. 마케팅 및 광고에의 활용</h3>
                <ul className="text-gray-700 space-y-1 text-sm">
                  <li>• 신규 서비스(제품) 개발 및 맞춤 서비스 제공</li>
                  <li>• 이벤트 및 광고성 정보 제공 및 참여기회 제공</li>
                  <li>• 인구통계학적 특성에 따른 서비스 제공 및 광고 게재</li>
                  <li>• 서비스의 유효성 확인, 접속빈도 파악 또는 회원의 서비스 이용에 대한 통계</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">제2조 (개인정보의 처리 및 보유기간)</h2>
              <div className="space-y-4">
                <p className="text-gray-700">
                  ① 회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 
                  수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.
                </p>
                <p className="text-gray-700">
                  ② 각각의 개인정보 처리 및 보유 기간은 다음과 같습니다.
                </p>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h3 className="font-medium text-gray-800 mb-2">1. 서비스 이용 기록</h3>
                  <ul className="text-gray-700 space-y-1 text-sm">
                    <li>• 보유근거: 정보주체의 동의</li>
                    <li>• 보유기간: 동의철회 시까지</li>
                    <li>• 관련법령: 개인정보보호법</li>
                  </ul>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h3 className="font-medium text-gray-800 mb-2">2. 문의 접수 및 처리</h3>
                  <ul className="text-gray-700 space-y-1 text-sm">
                    <li>• 보유근거: 정보주체의 동의</li>
                    <li>• 보유기간: 문의 처리 완료 후 3년</li>
                    <li>• 관련법령: 전자상거래 등에서의 소비자보호에 관한 법률</li>
                  </ul>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-800 mb-2">3. 웹사이트 방문기록</h3>
                  <ul className="text-gray-700 space-y-1 text-sm">
                    <li>• 보유근거: 통신비밀보호법</li>
                    <li>• 보유기간: 3개월</li>
                    <li>• 관련법령: 통신비밀보호법</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">제3조 (개인정보의 제3자 제공)</h2>
              <div className="space-y-4">
                <p className="text-gray-700">
                  ① 회사는 정보주체의 개인정보를 제1조(개인정보의 처리목적)에서 명시한 범위 내에서만 
                  처리하며, 정보주체의 동의, 법률의 특별한 규정 등 개인정보보호법 제17조 및 제18조에 
                  해당하는 경우에만 개인정보를 제3자에게 제공합니다.
                </p>
                <p className="text-gray-700">
                  ② 회사는 다음과 같이 개인정보를 제3자에게 제공하고 있습니다.
                </p>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-800 mb-2">현재 제3자 제공 현황</h3>
                  <p className="text-gray-700 text-sm">
                    회사는 현재 이용자의 개인정보를 외부 제3자에게 제공하지 않습니다.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">제4조 (개인정보처리 위탁)</h2>
              <div className="space-y-4">
                <p className="text-gray-700">
                  ① 회사는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다.
                </p>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h3 className="font-medium text-gray-800 mb-2">1. 웹사이트 호스팅</h3>
                  <ul className="text-gray-700 space-y-1 text-sm">
                    <li>• 위탁받는 자(수탁자): Vercel Inc.</li>
                    <li>• 위탁하는 업무의 내용: 웹사이트 호스팅 및 관리</li>
                    <li>• 위탁기간: 서비스 계약 기간</li>
                  </ul>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-800 mb-2">2. 이메일 서비스</h3>
                  <ul className="text-gray-700 space-y-1 text-sm">
                    <li>• 위탁받는 자(수탁자): Google LLC</li>
                    <li>• 위탁하는 업무의 내용: 이메일 문의 접수 및 발송</li>
                    <li>• 위탁기간: 서비스 계약 기간</li>
                  </ul>
                </div>

                <p className="text-gray-700">
                  ② 회사는 위탁계약 체결시 개인정보보호법 제26조에 따라 위탁업무 수행목적 외 
                  개인정보 처리금지, 기술적·관리적 보호조치, 재위탁 제한, 수탁자에 대한 관리·감독, 
                  손해배상 등 책임에 관한 사항을 계약서 등 문서에 명시하고, 수탁자가 개인정보를 
                  안전하게 처리하는지를 감독하고 있습니다.
                </p>
                <p className="text-gray-700">
                  ③ 위탁업무의 내용이나 수탁자가 변경될 경우에는 지체없이 본 개인정보 처리방침을 
                  통하여 공개하겠습니다.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">제5조 (정보주체와 법정대리인의 권리·의무 및 그 행사방법)</h2>
              <div className="space-y-4">
                <p className="text-gray-700">
                  ① 정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다.
                </p>
                <ul className="list-decimal pl-6 space-y-2 text-gray-700">
                  <li>개인정보 처리현황 통지요구</li>
                  <li>개인정보 열람요구</li>
                  <li>개인정보 정정·삭제요구</li>
                  <li>개인정보 처리정지요구</li>
                </ul>
                <p className="text-gray-700">
                  ② 제1항에 따른 권리 행사는 개인정보보호법 시행령 제41조제1항에 따라 서면, 전자우편, 
                  모사전송(FAX) 등을 통하여 하실 수 있으며 회사는 이에 대해 지체없이 조치하겠습니다.
                </p>
                <p className="text-gray-700">
                  ③ 정보주체가 개인정보의 오류 등에 대한 정정 또는 삭제를 요구한 경우에는 
                  회사는 정정 또는 삭제를 완료할 때까지 당해 개인정보를 이용하거나 제공하지 않습니다.
                </p>
                <p className="text-gray-700">
                  ④ 제1항에 따른 권리 행사는 정보주체의 법정대리인이나 위임을 받은 자 등 
                  대리인을 통하여 하실 수 있습니다. 이 경우 개인정보보호법 시행규칙 별지 제11호 
                  서식에 따른 위임장을 제출하셔야 합니다.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">제6조 (처리하는 개인정보의 항목)</h2>
              <div className="space-y-4">
                <p className="text-gray-700">
                  ① 회사는 다음의 개인정보 항목을 처리하고 있습니다.
                </p>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h3 className="font-medium text-gray-800 mb-2">1. 문의 접수</h3>
                  <ul className="text-gray-700 space-y-1 text-sm">
                    <li>• 필수항목: 이름, 이메일주소, 문의내용</li>
                    <li>• 선택항목: 소속기관</li>
                    <li>• 수집방법: 홈페이지 문의양식</li>
                  </ul>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-800 mb-2">2. 인터넷 서비스 이용과정에서 자동 생성되는 정보</h3>
                  <ul className="text-gray-700 space-y-1 text-sm">
                    <li>• IP주소, 쿠키, MAC주소, 서비스 이용기록</li>
                    <li>• 방문기록, 불량 이용기록 등</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">제7조 (개인정보의 파기)</h2>
              <div className="space-y-4">
                <p className="text-gray-700">
                  ① 회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 
                  지체없이 해당 개인정보를 파기합니다.
                </p>
                <p className="text-gray-700">
                  ② 정보주체로부터 동의받은 개인정보 보유기간이 경과하거나 처리목적이 달성되었음에도 
                  불구하고 다른 법령에 따라 개인정보를 계속 보존하여야 하는 경우에는, 
                  해당 개인정보를 별도의 데이터베이스(DB)로 옮기거나 보관장소를 달리하여 보존합니다.
                </p>
                <p className="text-gray-700">
                  ③ 개인정보 파기의 절차 및 방법은 다음과 같습니다.
                </p>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h3 className="font-medium text-gray-800 mb-2">파기절차</h3>
                  <p className="text-gray-700 text-sm">
                    회사는 파기 사유가 발생한 개인정보를 선정하고, 회사의 개인정보 보호책임자의 
                    승인을 받아 개인정보를 파기합니다.
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-800 mb-2">파기방법</h3>
                  <ul className="text-gray-700 space-y-1 text-sm">
                    <li>• 전자적 파일형태: 기록을 재생할 수 없도록 로우레벨포맷 등의 방법을 이용하여 파기</li>
                    <li>• 종이문서: 분쇄기로 분쇄하거나 소각하여 파기</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">제8조 (개인정보의 안전성 확보조치)</h2>
              <p className="text-gray-700 mb-4">
                회사는 개인정보보호법 제29조에 따라 다음과 같이 안전성 확보에 필요한 
                기술적/관리적 및 물리적 조치를 하고 있습니다.
              </p>
              
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-800 mb-2">1. 개인정보 취급 직원의 최소화 및 교육</h3>
                  <p className="text-gray-700 text-sm">
                    개인정보를 취급하는 직원을 지정하고 담당자에 한정시켜 최소화하여 개인정보를 관리하는 대책을 시행하고 있습니다.
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-800 mb-2">2. 정기적인 자체 감사 실시</h3>
                  <p className="text-gray-700 text-sm">
                    개인정보 취급 관련 안정성 확보를 위해 정기적(분기 1회)으로 자체 감사를 실시하고 있습니다.
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-800 mb-2">3. 개인정보에 대한 접근 제한</h3>
                  <p className="text-gray-700 text-sm">
                    개인정보를 처리하는 데이터베이스시스템에 대한 접근권한의 부여,변경,말소를 통하여 
                    개인정보에 대한 접근통제를 위하여 필요한 조치를 하고 있으며 침입차단시스템을 이용하여 
                    외부로부터의 무단 접근을 통제하고 있습니다.
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-800 mb-2">4. 개인정보의 암호화</h3>
                  <p className="text-gray-700 text-sm">
                    이용자의 개인정보는 비밀번호는 암호화 되어 저장 및 관리되고 있어, 본인만이 알 수 있으며 
                    중요한 데이터는 파일 및 전송 데이터를 암호화 하거나 파일 잠금 기능을 사용하는 등의 별도 
                    보안기능을 사용하고 있습니다.
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-800 mb-2">5. 해킹 등에 대비한 기술적 대책</h3>
                  <p className="text-gray-700 text-sm">
                    회사는 해킹이나 컴퓨터 바이러스 등에 의한 개인정보 유출 및 훼손을 막기 위하여 
                    보안프로그램을 설치하고 주기적인 갱신·점검을 하며 외부로부터 접근이 통제된 구역에 
                    시스템을 설치하고 기술적/물리적으로 감시 및 차단하고 있습니다.
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-800 mb-2">6. 개인정보 취급기록의 보관 및 위변조 방지</h3>
                  <p className="text-gray-700 text-sm">
                    개인정보 처리시스템 접속기록을 최소 6개월 이상 보관, 관리하고 있으며, 
                    접속기록이 위변조 및 도난, 분실되지 않도록 보안기능 사용하고 있습니다.
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-800 mb-2">7. 개인정보에 대한 접근 통제</h3>
                  <p className="text-gray-700 text-sm">
                    개인정보를 처리하는 시스템에 대한 접근권한을 업무 수행에 필요한 최소한으로 제한하고, 
                    개인정보 처리 담당자에 대한 출입통제 및 개인정보 처리시스템에 대한 접근권한 관리를 시행하고 있습니다.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">제9조 (개인정보 자동 수집 장치의 설치•운영 및 거부에 관한 사항)</h2>
              <div className="space-y-4">
                <p className="text-gray-700">
                  ① 회사는 이용자에게 개별적인 맞춤서비스를 제공하기 위해 이용정보를 저장하고 수시로 
                  불러오는 '쿠키(cookie)'를 사용합니다.
                </p>
                <p className="text-gray-700">
                  ② 쿠키는 웹사이트를 운영하는데 이용되는 서버(http)가 이용자의 컴퓨터 브라우저에게 
                  보내는 소량의 정보이며 이용자들의 PC 컴퓨터내의 하드디스크에 저장되기도 합니다.
                </p>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h3 className="font-medium text-gray-800 mb-2">가. 쿠키의 사용 목적</h3>
                  <ul className="text-gray-700 space-y-1 text-sm">
                    <li>• 이용자가 방문한 각 서비스와 웹 사이트들에 대한 방문 및 이용형태</li>
                    <li>• 인기 검색어, 보안접속 여부 등을 파악하여 이용자에게 최적화된 정보 제공</li>
                  </ul>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-800 mb-2">나. 쿠키의 설치•운영 및 거부</h3>
                  <ul className="text-gray-700 space-y-1 text-sm">
                    <li>• 웹브라우저 상단의 도구 > 인터넷 옵션 > 개인정보 메뉴의 옵션 설정을 통해 쿠키 저장을 거부할 수 있습니다.</li>
                    <li>• 쿠키 저장을 거부할 경우 맞춤형 서비스 이용에 어려움이 발생할 수 있습니다.</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">제10조 (개인정보 보호책임자)</h2>
              <div className="space-y-4">
                <p className="text-gray-700">
                  ① 회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 
                  정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 
                  지정하고 있습니다.
                </p>
                
                <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                  <h3 className="font-medium text-gray-800 mb-4">▶ 개인정보 보호책임자</h3>
                  <div className="space-y-2">
                    <p className="text-gray-700"><span className="font-medium">성명:</span> 모두의팔도장터 운영자</p>
                    <p className="text-gray-700"><span className="font-medium">직책:</span> 대표</p>
                    <p className="text-gray-700"><span className="font-medium">연락처:</span> rkdsim90@gmail.com</p>
                  </div>
                  
                  <h3 className="font-medium text-gray-800 mb-2 mt-6">▶ 개인정보 보호 담당부서</h3>
                  <div className="space-y-2">
                    <p className="text-gray-700"><span className="font-medium">부서명:</span> 운영팀</p>
                    <p className="text-gray-700"><span className="font-medium">담당자:</span> 모두의팔도장터 운영자</p>
                    <p className="text-gray-700"><span className="font-medium">연락처:</span> rkdsim90@gmail.com</p>
                  </div>
                </div>

                <p className="text-gray-700">
                  ② 정보주체께서는 회사의 서비스(또는 사업)을 이용하시면서 발생한 모든 개인정보 보호 
                  관련 문의, 불만처리, 피해구제 등에 관한 사항을 개인정보 보호책임자 및 담당부서로 
                  문의하실 수 있습니다. 회사는 정보주체의 문의에 대해 지체없이 답변 및 처리해드릴 것입니다.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">제11조 (개인정보 열람청구)</h2>
              <div className="space-y-4">
                <p className="text-gray-700">
                  정보주체는 개인정보보호법 제35조에 따른 개인정보의 열람 청구를 아래의 부서에 
                  할 수 있습니다. 회사는 정보주체의 개인정보 열람청구가 신속하게 처리되도록 노력하겠습니다.
                </p>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-800 mb-2">▶ 개인정보 열람청구 접수·처리 부서</h3>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-700"><span className="font-medium">부서명:</span> 운영팀</p>
                    <p className="text-gray-700"><span className="font-medium">담당자:</span> 모두의팔도장터 운영자</p>
                    <p className="text-gray-700"><span className="font-medium">연락처:</span> rkdsim90@gmail.com</p>
                  </div>
                </div>

                <p className="text-gray-700">
                  정보주체께서는 제1항의 열람청구 접수․처리부서 이외에, 행정안전부의 
                  '개인정보보호 종합지원 포털' 웹사이트(www.privacy.go.kr)를 통하여서도 개인정보 
                  열람청구를 하실 수 있습니다.
                </p>
                <p className="text-gray-700">
                  ▶ 행정안전부 개인정보보호 종합지원 포털 → 개인정보 민원 → 개인정보 열람등 요구
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">제12조 (권익침해 구제방법)</h2>
              <div className="space-y-4">
                <p className="text-gray-700">
                  정보주체는 아래의 기관에 대해 개인정보 침해에 대한 피해구제, 상담 등을 문의하실 수 있습니다.
                </p>
                <p className="text-gray-700">
                  아래의 기관은 회사와는 별개의 기관으로서, 회사의 자체적인 개인정보 불만처리, 
                  피해구제 결과에 만족하지 못하시거나 보다 자세한 도움이 필요하시면 문의하여 주시기 바랍니다.
                </p>
                
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-800 mb-2">▶ 개인정보 침해신고센터 (한국인터넷진흥원 운영)</h3>
                    <ul className="text-gray-700 space-y-1 text-sm">
                      <li>• 소관업무: 개인정보 침해신고 접수 및 처리, 피해구제 신청 접수 및 처리</li>
                      <li>• 홈페이지: privacy.go.kr</li>
                      <li>• 전화: (국번없이) 182</li>
                      <li>• 주소: (58324) 전남 나주시 진흥길 9(빛가람동 301-2) 3층 개인정보침해신고센터</li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-800 mb-2">▶ 개인정보 분쟁조정위원회</h3>
                    <ul className="text-gray-700 space-y-1 text-sm">
                      <li>• 소관업무: 개인정보 분쟁조정신청, 집단분쟁조정 (민사상 배상)</li>
                      <li>• 홈페이지: www.kopico.go.kr</li>
                      <li>• 전화: (국번없이) 1833-6972</li>
                      <li>• 주소: (03171)서울특별시 종로구 세종대로 209 정부서울청사 4층</li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-800 mb-2">▶ 대검찰청 사이버범죄수사단</h3>
                    <ul className="text-gray-700 space-y-1 text-sm">
                      <li>• 홈페이지: www.spo.go.kr</li>
                      <li>• 전화: 02-3480-3573</li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-800 mb-2">▶ 경찰청 사이버테러대응센터</h3>
                    <ul className="text-gray-700 space-y-1 text-sm">
                      <li>• 홈페이지: www.netan.go.kr</li>
                      <li>• 전화: (국번없이) 182</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">제13조 (개인정보 처리방침 변경)</h2>
              <div className="space-y-4">
                <p className="text-gray-700">
                  ① 이 개인정보처리방침은 2025년 6월 27일부터 적용됩니다.
                </p>
                <p className="text-gray-700">
                  ② 이전의 개인정보 처리방침은 아래에서 확인하실 수 있습니다.
                </p>
                <p className="text-gray-700">
                  예시) - 20XX. X. X ~ 20XX. X. X 적용 (클릭)
                </p>
              </div>
            </section>

            <div className="bg-amber-50 rounded-lg p-6 border border-amber-200 mt-12">
              <h3 className="font-bold text-gray-800 mb-4">📞 개인정보 관련 문의</h3>
              <div className="space-y-2 text-gray-700">
                <p><span className="font-medium">이메일:</span> rkdsim90@gmail.com</p>
                <p><span className="font-medium">처리시간:</span> 접수 후 7일 이내 답변</p>
                <p className="text-sm text-gray-600 mt-4">
                  개인정보 처리와 관련한 문의사항이나 불만처리, 피해구제가 필요하신 경우 
                  위 연락처로 연락해주시기 바랍니다.
                </p>
              </div>
            </div>

            <div className="bg-red-50 rounded-lg p-6 border border-red-200 mt-8">
              <h3 className="font-bold text-gray-800 mb-4">⚠️ 중요 안내사항</h3>
              <div className="space-y-2 text-gray-700 text-sm">
                <p>
                  • 본 개인정보처리방침은 개인정보보호법, 정보통신망 이용촉진 및 정보보호 등에 관한 법률, 
                  통신비밀보호법, 전자상거래 등에서의 소비자보호에 관한 법률 등 관련 법령을 준수하여 작성되었습니다.
                </p>
                <p>
                  • 개인정보 처리방침 내용 추가, 삭제 및 수정이 있을 시에는 개정 최소 7일 전부터 
                  홈페이지의 '공지사항'을 통해 고지할 것입니다.
                </p>
                <p>
                  • 본 방침은 2025년 6월 27일부터 시행됩니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}