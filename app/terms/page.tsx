/**
 * @file terms/page.tsx
 * @description 이용약관 페이지
 *
 * 주요 기능:
 * 1. 서비스 이용약관 표시
 * 2. 의료 면책 조항 포함
 * 3. 통신판매 중개자 고지 포함
 */

import { Section } from "@/components/section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "이용약관 | 맛의 아카이브",
  description: "맛의 아카이브 서비스 이용약관",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Section className="py-12">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-8 text-4xl font-bold">이용약관</h1>
          <p className="mb-8 text-sm text-muted-foreground">
            최종 수정일: {new Date().toLocaleDateString("ko-KR")}
          </p>

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>제1조 (목적)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-relaxed">
                <p>
                  본 약관은 맛의 아카이브(Flavor Archive, 이하 &quot;회사&quot;)가 제공하는
                  온라인 서비스(이하 &quot;서비스&quot;)의 이용과 관련하여 회사와 이용자 간의
                  권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로
                  합니다.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>제2조 (정의)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-relaxed">
                <ol className="list-decimal space-y-2 pl-5">
                  <li>
                    &quot;서비스&quot;란 회사가 제공하는 레거시 아카이브, 현대 레시피 북, AI
                    기반 식단 큐레이션 등 모든 온라인 서비스를 의미합니다.
                  </li>
                  <li>
                    &quot;이용자&quot;란 본 약관에 따라 회사가 제공하는 서비스를 받는 회원 및
                    비회원을 말합니다.
                  </li>
                  <li>
                    &quot;회원&quot;이란 회사에 개인정보를 제공하여 회원등록을 한 자로서,
                    회사의 정보를 지속적으로 제공받으며, 회사가 제공하는 서비스를
                    계속적으로 이용할 수 있는 자를 말합니다.
                  </li>
                  <li>
                    &quot;콘텐츠&quot;란 서비스를 통해 제공되는 모든 정보, 데이터, 텍스트,
                    이미지, 영상, 음성 등을 의미합니다.
                  </li>
                </ol>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>제3조 (약관의 게시와 개정)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-relaxed">
                <ol className="list-decimal space-y-2 pl-5">
                  <li>
                    회사는 본 약관의 내용을 이용자가 쉽게 알 수 있도록 서비스
                    초기 화면에 게시합니다.
                  </li>
                  <li>
                    회사는 필요한 경우 관련 법령을 위배하지 않는 범위에서 본
                    약관을 개정할 수 있습니다.
                  </li>
                  <li>
                    회사가 약관을 개정할 경우에는 적용일자 및 개정사유를 명시하여
                    현행약관과 함께 서비스의 초기화면에 그 적용일자 7일 이전부터
                    적용일자 전일까지 공지합니다.
                  </li>
                </ol>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>제4조 (서비스의 제공 및 변경)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-relaxed">
                <ol className="list-decimal space-y-2 pl-5">
                  <li>
                    회사는 다음과 같은 서비스를 제공합니다:
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                      <li>레거시 아카이브: 명인 인터뷰 영상 및 전문 문서화 기록</li>
                      <li>현대 레시피 북: 단계별 레시피 및 커뮤니티 기능</li>
                      <li>
                        AI 기반 식단 큐레이션: 개인 맞춤 식단 추천 및 영양 정보
                      </li>
                      <li>식자재 구매 연동 서비스</li>
                    </ul>
                  </li>
                  <li>
                    회사는 서비스의 내용, 이용방법, 이용시간을 변경할 수 있으며,
                    변경사항은 사전에 공지합니다.
                  </li>
                </ol>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>제5조 (서비스의 중단)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-relaxed">
                <ol className="list-decimal space-y-2 pl-5">
                  <li>
                    회사는 컴퓨터 등 정보통신설비의 보수점검, 교체 및 고장,
                    통신의 두절 등의 사유가 발생한 경우에는 서비스의 제공을
                    일시적으로 중단할 수 있습니다.
                  </li>
                  <li>
                    회사는 제1항의 사유로 서비스의 제공이 일시적으로 중단됨으로
                    인하여 이용자 또는 제3자가 입은 손해에 대하여 배상합니다.
                    단, 회사가 고의 또는 과실이 없음을 입증하는 경우에는 그러하지
                    아니합니다.
                  </li>
                </ol>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>제6조 (회원가입)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-relaxed">
                <ol className="list-decimal space-y-2 pl-5">
                  <li>
                    이용자는 회사가 정한 가입 양식에 따라 회원정보를 기입한 후 본
                    약관에 동의한다는 의사표시를 함으로서 회원가입을 신청합니다.
                  </li>
                  <li>
                    회사는 제1항과 같이 회원가입을 신청한 이용자 중 다음 각 호에
                    해당하지 않는 한 회원으로 등록합니다:
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                      <li>가입신청자가 본 약관에 의하여 이전에 회원자격을 상실한 적이 있는 경우</li>
                      <li>등록 내용에 허위, 기재누락, 오기가 있는 경우</li>
                      <li>기타 회원으로 등록하는 것이 회사의 기술상 현저히 지장이 있다고 판단되는 경우</li>
                    </ul>
                  </li>
                </ol>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>제7조 (의료 면책 조항)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-relaxed">
                <div className="rounded-lg border-2 border-amber-200 bg-amber-50 p-4">
                  <p className="font-semibold text-amber-900">
                    ⚠️ 중요: 의료 면책 조항
                  </p>
                  <p className="mt-2 text-sm text-amber-800">
                    본 서비스는 <strong>건강 관리 보조 수단</strong>이며, 전문적인
                    진료 및 치료 행위를 대신하지 않습니다. 본 서비스에서 제공하는
                    식단 추천, 영양 정보, 건강 관련 콘텐츠는 참고용이며, 질병 관련
                    내용은 반드시 의사 또는 전문 영양사와 상담하시기 바랍니다.
                  </p>
                  <p className="mt-2 text-sm text-amber-800">
                    회사는 본 서비스를 통해 제공되는 정보의 정확성, 완전성, 신뢰성
                    등을 보장하지 않으며, 이용자가 본 서비스의 정보를 기반으로
                    취한 조치로 인해 발생한 어떠한 손해에 대해서도 책임을 지지
                    않습니다.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>제8조 (통신판매 중개자 고지)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-relaxed">
                <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
                  <p className="font-semibold text-blue-900">
                    📦 통신판매 중개자 고지
                  </p>
                  <p className="mt-2 text-sm text-blue-800">
                    회사는 통신판매 중개자로서 상품 판매의 당사자가 아니며, 판매자가
                    등록한 상품 정보 및 거래에 대해 책임을 지지 않습니다. 식품의
                    위생, 품질, 제조/생산에 대한 <strong>1차적인 법적 책임은 판매자/생산자에게</strong> 있습니다.
                  </p>
                  <p className="mt-2 text-sm text-blue-800">
                    회사는 통신판매 중개자로서 이용자와 판매자 간의 자유로운 상품
                    거래를 위한 시스템을 운영 및 관리할 뿐이며, 거래의 당사자가
                    아니므로 거래와 관련하여 발생한 분쟁에 대해서는 책임을 지지
                    않습니다.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>제9조 (콘텐츠의 저작권)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-relaxed">
                <ol className="list-decimal space-y-2 pl-5">
                  <li>
                    회사가 작성한 저작물에 대한 저작권 및 기타 지적재산권은 회사에
                    귀속합니다.
                  </li>
                  <li>
                    이용자가 서비스 내에 게시한 게시물의 저작권은 해당 게시물의
                    저작자에게 귀속됩니다.
                  </li>
                  <li>
                    이용자는 서비스를 이용하면서 취득한 정보를 회사의 사전 승낙
                    없이 복제, 송신, 출판, 배포, 방송 기타 방법에 의하여 영리목적으로
                    이용하거나 제3자에게 이용하게 하여서는 안 됩니다.
                  </li>
                </ol>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>제10조 (면책사항)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-relaxed">
                <ol className="list-decimal space-y-2 pl-5">
                  <li>
                    회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를
                    제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.
                  </li>
                  <li>
                    회사는 회원의 귀책사유로 인한 서비스 이용의 장애에 대하여는
                    책임을 지지 않습니다.
                  </li>
                  <li>
                    회사는 회원이 서비스를 이용하여 기대하는 수익을 상실한 것에
                    대하여 책임을 지지 않으며, 그 밖의 서비스를 통하여 얻은 자료로
                    인한 손해에 관하여 책임을 지지 않습니다.
                  </li>
                </ol>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>제11조 (준거법 및 관할법원)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-relaxed">
                <ol className="list-decimal space-y-2 pl-5">
                  <li>
                    회사와 이용자 간에 발생한 전자상거래 분쟁에 관한 소송은
                    제소 당시의 이용자의 주소에 의하고, 주소가 없는 경우에는
                    거소를 관할하는 지방법원의 전속관할로 합니다.
                  </li>
                  <li>
                    회사와 이용자 간에 제기된 전자상거래 소송에는 한국법을
                    적용합니다.
                  </li>
                </ol>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12 rounded-lg border border-border bg-white p-6">
            <p className="text-sm text-muted-foreground">
              본 약관에 대한 문의사항이 있으시면{" "}
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

