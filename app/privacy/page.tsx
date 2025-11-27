/**
 * @file privacy/page.tsx
 * @description 개인정보처리방침 페이지
 *
 * 주요 기능:
 * 1. 개인정보 수집 및 이용 목적
 * 2. 수집하는 개인정보의 항목
 * 3. 개인정보의 보유 및 이용기간
 * 4. 개인정보의 제3자 제공
 * 5. 개인정보 처리 위탁
 * 6. 이용자의 권리 및 행사방법
 */

import { Section } from "@/components/section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "개인정보처리방침 | 맛의 아카이브",
  description: "맛의 아카이브 개인정보처리방침",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Section className="py-12">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-8 text-4xl font-bold">개인정보처리방침</h1>
          <p className="mb-8 text-sm text-muted-foreground">
            최종 수정일: {new Date().toLocaleDateString("ko-KR")}
          </p>

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>제1조 (개인정보의 처리 목적)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-relaxed">
                <p>
                  맛의 아카이브(Flavor Archive, 이하 &quot;회사&quot;)는 다음의 목적을 위하여
                  개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의
                  용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 개인정보
                  보호법 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할
                  예정입니다.
                </p>
                <ol className="list-decimal space-y-2 pl-5">
                  <li>
                    <strong>회원 가입 및 관리</strong>
                    <ul className="mt-1 list-disc space-y-1 pl-5">
                      <li>회원 가입의사 확인, 회원제 서비스 제공에 따른 본인 식별·인증</li>
                      <li>회원자격 유지·관리, 서비스 부정이용 방지</li>
                      <li>각종 고지·통지, 고충처리 등을 목적으로 개인정보를 처리합니다.</li>
                    </ul>
                  </li>
                  <li>
                    <strong>서비스 제공</strong>
                    <ul className="mt-1 list-disc space-y-1 pl-5">
                      <li>레거시 아카이브 콘텐츠 제공</li>
                      <li>레시피 검색 및 추천 서비스 제공</li>
                      <li>AI 기반 맞춤 식단 추천 서비스 제공</li>
                      <li>식자재 구매 연동 서비스 제공</li>
                    </ul>
                  </li>
                  <li>
                    <strong>건강 정보 처리</strong>
                    <ul className="mt-1 list-disc space-y-1 pl-5">
                      <li>알레르기, 질병 정보 등 건강 정보 수집 및 처리</li>
                      <li>개인 맞춤 식단 추천을 위한 건강 정보 활용</li>
                      <li>
                        <strong>건강 정보는 암호화하여 저장</strong>되며, 식단 추천
                        목적으로만 사용됩니다.
                      </li>
                    </ul>
                  </li>
                </ol>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>제2조 (개인정보의 처리 및 보유기간)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-relaxed">
                <ol className="list-decimal space-y-2 pl-5">
                  <li>
                    회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터
                    개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서
                    개인정보를 처리·보유합니다.
                  </li>
                  <li>
                    각각의 개인정보 처리 및 보유 기간은 다음과 같습니다:
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                      <li>
                        <strong>회원 가입 및 관리:</strong> 회원 탈퇴 시까지 (단, 관계
                        법령 위반에 따른 수사·조사 등이 진행중인 경우에는 해당
                        수사·조사 종료 시까지)
                      </li>
                      <li>
                        <strong>건강 정보:</strong> 회원 탈퇴 시까지 (단, 법령에 따라
                        보존이 필요한 경우 해당 기간 동안 보관)
                      </li>
                      <li>
                        <strong>서비스 이용 기록:</strong> 3년 (통신비밀보호법)
                      </li>
                    </ul>
                  </li>
                </ol>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>제3조 (처리하는 개인정보의 항목)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-relaxed">
                <p>회사는 다음의 개인정보 항목을 처리하고 있습니다:</p>
                <ol className="list-decimal space-y-2 pl-5">
                  <li>
                    <strong>회원 가입 시 수집 항목:</strong>
                    <ul className="mt-1 list-disc space-y-1 pl-5">
                      <li>필수: 이메일 주소, 이름 (또는 닉네임)</li>
                      <li>선택: 프로필 이미지</li>
                    </ul>
                  </li>
                  <li>
                    <strong>건강 정보 입력 시 수집 항목 (선택):</strong>
                    <ul className="mt-1 list-disc space-y-1 pl-5">
                      <li>알레르기 정보</li>
                      <li>질병 정보 (당뇨, 고혈압 등)</li>
                      <li>선호/비선호 식재료</li>
                      <li>기타 건강 관련 정보</li>
                    </ul>
                  </li>
                  <li>
                    <strong>서비스 이용 과정에서 자동 수집되는 정보:</strong>
                    <ul className="mt-1 list-disc space-y-1 pl-5">
                      <li>IP 주소, 쿠키, 접속 로그, 기기 정보</li>
                      <li>서비스 이용 기록, 검색 기록</li>
                    </ul>
                  </li>
                </ol>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>제4조 (개인정보의 제3자 제공)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-relaxed">
                <ol className="list-decimal space-y-2 pl-5">
                  <li>
                    회사는 정보주체의 개인정보를 제1조(개인정보의 처리 목적)에서
                    명시한 범위 내에서만 처리하며, 정보주체의 동의, 법률의 특별한
                    규정 등 개인정보 보호법 제17조 및 제18조에 해당하는 경우에만
                    개인정보를 제3자에게 제공합니다.
                  </li>
                  <li>
                    회사는 원칙적으로 정보주체의 개인정보를 제3자에게 제공하지
                    않습니다. 다만, 다음의 경우에는 예외로 합니다:
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                      <li>정보주체가 사전에 동의한 경우</li>
                      <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
                    </ul>
                  </li>
                  <li>
                    <strong>식자재 구매 연동 서비스:</strong> 식자재 구매를 위해
                    외부 마켓플레이스로 이동할 경우, 해당 서비스의 개인정보처리방침이
                    적용됩니다.
                  </li>
                </ol>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>제5조 (개인정보처리의 위탁)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-relaxed">
                <ol className="list-decimal space-y-2 pl-5">
                  <li>
                    회사는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보
                    처리업무를 위탁하고 있습니다:
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                      <li>
                        <strong>인증 서비스:</strong> Clerk (사용자 인증 및 관리)
                      </li>
                      <li>
                        <strong>데이터베이스 및 스토리지:</strong> Supabase (데이터
                        저장 및 관리)
                      </li>
                    </ul>
                  </li>
                  <li>
                    회사는 위탁계약 체결 시 개인정보 보호법 제26조에 따라 위탁업무
                    수행목적 외 개인정보 처리금지, 기술적·관리적 보호조치, 재위탁
                    제한, 수탁자에 대한 관리·감독, 손해배상 등 책임에 관한 사항을
                    계약서 등 문서에 명시하고, 수탁자가 개인정보를 안전하게
                    처리하는지를 감독하고 있습니다.
                  </li>
                </ol>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>제6조 (정보주체의 권리·의무 및 그 행사방법)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-relaxed">
                <ol className="list-decimal space-y-2 pl-5">
                  <li>
                    정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련
                    권리를 행사할 수 있습니다:
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                      <li>개인정보 처리정지 요구권</li>
                      <li>개인정보 열람요구권</li>
                      <li>개인정보 정정·삭제요구권</li>
                      <li>개인정보 처리정지 요구권</li>
                    </ul>
                  </li>
                  <li>
                    제1항에 따른 권리 행사는 회사에 대해 서면, 전자우편, 모사전송(FAX)
                    등을 통하여 하실 수 있으며 회사는 이에 대해 지체 없이
                    조치하겠습니다.
                  </li>
                  <li>
                    정보주체가 개인정보의 오류 등에 대한 정정 또는 삭제를 요구한
                    경우에는 회사는 지체 없이 그 오류를 정정하거나 삭제하여야 합니다.
                  </li>
                </ol>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>제7조 (개인정보의 파기)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-relaxed">
                <ol className="list-decimal space-y-2 pl-5">
                  <li>
                    회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가
                    불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.
                  </li>
                  <li>
                    개인정보 파기의 절차 및 방법은 다음과 같습니다:
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                      <li>
                        <strong>파기절차:</strong> 회사는 파기 사유가 발생한 개인정보를
                        선정하고, 회사의 개인정보 보호책임자의 승인을 받아 개인정보를
                        파기합니다.
                      </li>
                      <li>
                        <strong>파기방법:</strong> 전자적 파일 형태의 정보는 기록을
                        재생할 수 없는 기술적 방법을 사용합니다. 종이에 출력된
                        개인정보는 분쇄기로 분쇄하거나 소각을 통하여 파기합니다.
                      </li>
                    </ul>
                  </li>
                </ol>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>제8조 (개인정보 보호책임자)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-relaxed">
                <p>
                  회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보
                  처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와
                  같이 개인정보 보호책임자를 지정하고 있습니다.
                </p>
                <div className="mt-4 rounded-lg border border-border bg-gray-50 p-4">
                  <p className="font-semibold">개인정보 보호책임자</p>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>이메일: hello@flavor-archive.com</li>
                    <li>전화: (문의 시 제공)</li>
                  </ul>
                </div>
                <p className="mt-4 text-sm">
                  정보주체께서는 회사의 서비스를 이용하시면서 발생한 모든 개인정보
                  보호 관련 문의, 불만처리, 피해구제 등에 관한 사항을 개인정보
                  보호책임자에게 문의하실 수 있습니다.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>제9조 (개인정보의 안전성 확보조치)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-relaxed">
                <p>
                  회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고
                  있습니다:
                </p>
                <ol className="list-decimal space-y-2 pl-5">
                  <li>
                    <strong>관리적 조치:</strong> 내부관리계획 수립·시행, 정기적
                    직원 교육 등
                  </li>
                  <li>
                    <strong>기술적 조치:</strong> 개인정보처리시스템 등의 접근권한
                    관리, 접근통제시스템 설치, 고유식별정보 등의 암호화, 보안프로그램
                    설치
                  </li>
                  <li>
                    <strong>물리적 조치:</strong> 전산실, 자료보관실 등의 접근통제
                  </li>
                  <li>
                    <strong>건강 정보 특별 보호:</strong> 건강 정보는 별도의
                    암호화 저장소에 저장되며, 식단 추천 목적으로만 사용됩니다.
                  </li>
                </ol>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>제10조 (개인정보 처리방침 변경)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-relaxed">
                <p>
                  이 개인정보처리방침은 {new Date().getFullYear()}년{" "}
                  {new Date().getMonth() + 1}월 {new Date().getDate()}일부터
                  적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이
                  있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여
                  고지할 것입니다.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12 rounded-lg border border-border bg-white p-6">
            <p className="text-sm text-muted-foreground">
              본 개인정보처리방침에 대한 문의사항이 있으시면{" "}
              <a
                href="mailto:hello@flavor-archive.com"
                className="text-orange-600 hover:underline"
              >
                hello@flavor-archive.com
              </a>
              으로 연락주시기 바랍니다.
            </p>
          </div>
        </div>
      </Section>
    </div>
  );
}

