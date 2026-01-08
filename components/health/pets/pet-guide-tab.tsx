/**
 * @file components/health/pets/pet-guide-tab.tsx
 * @description 반려동물 알아두면 좋은 정보 탭 컴포넌트
 * 
 * 주요 기능:
 * 1. 사육 가능/금지 동물 안내
 * 2. 생애주기별 관리 가이드
 * 3. 예방접종 가이드
 * 4. 훈련 가이드
 * 5. 법규 안내
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Shield, 
  Heart, 
  Syringe, 
  GraduationCap, 
  Scale,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  AlertCircle,
  Sun,
  Snowflake,
  UtensilsCrossed,
  Activity
} from 'lucide-react';

export function PetGuideTab() {
  const [activeSubTab, setActiveSubTab] = useState('breeding');

  return (
    <div className="space-y-6">
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
        <div className="mb-6">
          <TabsList className="grid grid-cols-2 gap-2 h-auto p-1 w-full">
          <TabsTrigger value="breeding" className="flex items-center justify-center gap-2 text-sm">
            <Shield className="w-4 h-4 flex-shrink-0" />
            <span>사육 가능/금지</span>
          </TabsTrigger>
          <TabsTrigger value="lifecycle" className="flex items-center justify-center gap-2 text-sm">
            <Heart className="w-4 h-4 flex-shrink-0" />
            <span>생애주기 관리</span>
          </TabsTrigger>
          <TabsTrigger value="vaccination" className="flex items-center justify-center gap-2 text-sm">
            <Syringe className="w-4 h-4 flex-shrink-0" />
            <span>예방접종</span>
          </TabsTrigger>
          <TabsTrigger value="training" className="flex items-center justify-center gap-2 text-sm">
            <GraduationCap className="w-4 h-4 flex-shrink-0" />
            <span>훈련 가이드</span>
          </TabsTrigger>
          <TabsTrigger value="daily" className="flex items-center justify-center gap-2 text-sm">
            <Activity className="w-4 h-4 flex-shrink-0" />
            <span>일상 관리</span>
          </TabsTrigger>
          <TabsTrigger value="emergency" className="flex items-center justify-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>응급 상황</span>
          </TabsTrigger>
          <TabsTrigger value="seasonal" className="flex items-center justify-center gap-2 text-sm">
            <Sun className="w-4 h-4 flex-shrink-0" />
            <span>계절별 관리</span>
          </TabsTrigger>
          <TabsTrigger value="legal" className="flex items-center justify-center gap-2 text-sm">
            <Scale className="w-4 h-4 flex-shrink-0" />
            <span>법규 안내</span>
          </TabsTrigger>
          </TabsList>
        </div>

        {/* 사육 가능/금지 */}
        <TabsContent value="breeding" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                사육 가능 반려동물
              </CardTitle>
              <CardDescription>
                대한민국에서 합법적으로 사육할 수 있는 반려동물입니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  개/고양이
                </h4>
                <p className="text-sm text-muted-foreground mb-2">
                  가장 일반적이며 동물보호법에 따라 <strong>등록 필수</strong>(개)
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">소동물</h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• 토끼, 기니피그, 햄스터, 고슴도치, 다람쥐 등</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">조류</h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• 앵무새, 카나리아, 문조 등</li>
                  <li>• 사이테스(CITES) 종은 양수 신고 필요</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">파충류/양서류</h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• 거북이, 도마뱀, 뱀 (독이 없는 종)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">기타</h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• 관상어, 장수풍뎅이 등 곤충류</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                사육 금지 또는 제한 동물
              </CardTitle>
              <CardDescription>
                법적 또는 안전상의 이유로 사육이 금지되거나 제한되는 동물입니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>야생동물</AlertTitle>
                <AlertDescription>
                  너구리, 오소리, 여우 등 야생에서 포획한 개체는 사육이 금지됩니다.
                </AlertDescription>
              </Alert>

              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>맹수류</AlertTitle>
                <AlertDescription>
                  사자, 호랑이, 곰 등은 법적으로 개인 사육이 불가능합니다.
                </AlertDescription>
              </Alert>

              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>생태계 교란종</AlertTitle>
                <AlertDescription>
                  붉은귀거북, 뉴트리아, 파랑볼우럭 등은 방생 및 사육이 엄격히 제한됩니다.
                </AlertDescription>
              </Alert>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>맹견 관리 (사육 허가제)</AlertTitle>
                <AlertDescription>
                  도사견, 아메리칸 핏불 테리어 등 5종은 <strong>사육 허가제</strong> 및 책임보험 가입이 필수입니다.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 생애주기별 관리 */}
        <TabsContent value="lifecycle" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>퍼피/키튼기 (0~6개월)</CardTitle>
              <CardDescription>사회화와 기초 형성 시기</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">훈련</h4>
                <ul className="text-sm text-muted-foreground space-y-2 ml-4">
                  <li>• <strong>사회화:</strong> 3~14주령 사이 다양한 소리, 환경, 사람을 접하게 함</li>
                  <li>• <strong>예절 교육:</strong> 배변 훈련, '앉아/기다려', 입질 방지 교육</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">관리</h4>
                <ul className="text-sm text-muted-foreground space-y-2 ml-4">
                  <li>• 하루 3~4회 급여 (고단백/고칼로리 퍼피용 사료)</li>
                  <li>• 유치 탈락 확인 및 양치질 습관화</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>성견/성묘기 (1~7세)</CardTitle>
              <CardDescription>활동 유지와 예방 시기</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">훈련</h4>
                <ul className="text-sm text-muted-foreground space-y-2 ml-4">
                  <li>• 산책 매너(리드줄 적응), 분리불안 방지 교육</li>
                  <li>• 에너지 소모를 위한 노즈워크 및 지능 장난감 활용</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">관리</h4>
                <ul className="text-sm text-muted-foreground space-y-2 ml-4">
                  <li>• 체중 관리 (비만은 만병의 근원)</li>
                  <li>• 정기적인 스케일링 및 연 1회 종합 건강검진</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>노령기 (7세 이상)</CardTitle>
              <CardDescription>통증 관리와 케어 시기</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">훈련</h4>
                <ul className="text-sm text-muted-foreground space-y-2 ml-4">
                  <li>• 기존 명령어를 잊지 않도록 가벼운 복습 (치매 예방)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">관리</h4>
                <ul className="text-sm text-muted-foreground space-y-2 ml-4">
                  <li>• 저단백/고소화성 식단</li>
                  <li>• 관절 보호용 매트 설치, 시력/청력 저하에 따른 환경 변화 최소화</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 예방접종 가이드 */}
        <TabsContent value="vaccination" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>강아지 기초 예방접종</CardTitle>
              <CardDescription>생후 6주 ~ 20주 기초 접종 일정</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">회차</th>
                      <th className="text-left p-2">시기 (생후)</th>
                      <th className="text-left p-2">접종 항목</th>
                      <th className="text-left p-2">비고</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2 font-medium">1차</td>
                      <td className="p-2">6~8주</td>
                      <td className="p-2">종합백신(DHPPL) 1차, 코로나 장염 1차</td>
                      <td className="p-2">기초 접종 시작</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">2차</td>
                      <td className="p-2">8~10주</td>
                      <td className="p-2">종합백신 2차, 코로나 장염 2차</td>
                      <td className="p-2">면역 형성을 위한 중첩 접종</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">3차</td>
                      <td className="p-2">10~12주</td>
                      <td className="p-2">종합백신 3차, 캔넬코프 1차</td>
                      <td className="p-2">전염성 기관지염 예방</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">4차</td>
                      <td className="p-2">12~14주</td>
                      <td className="p-2">종합백신 4차, 캔넬코프 2차</td>
                      <td className="p-2">-</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">5차</td>
                      <td className="p-2">14~16주</td>
                      <td className="p-2">종합백신 5차, 인플루엔자 1차</td>
                      <td className="p-2">신종 플루 예방</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">6차</td>
                      <td className="p-2">16~18주</td>
                      <td className="p-2">광견병(Rabies), 인플루엔자 2차</td>
                      <td className="p-2">
                        <Badge variant="destructive">법적 필수</Badge>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <Alert className="mt-4">
                <Info className="h-4 w-4" />
                <AlertTitle>정기 관리 (성견기 이후)</AlertTitle>
                <AlertDescription>
                  매년 1회 추가 접종: 종합백신, 코로나, 캔넬코프, 인플루엔자, 광견병
                  <br />
                  항체가 검사 후 보강 접종 여부 결정 가능
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>고양이 기초 예방접종</CardTitle>
              <CardDescription>생후 8주 ~ 16주 기초 접종 일정</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">회차</th>
                      <th className="text-left p-2">시기 (생후)</th>
                      <th className="text-left p-2">접종 항목</th>
                      <th className="text-left p-2">비고</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2 font-medium">1차</td>
                      <td className="p-2">8주</td>
                      <td className="p-2">종합백신(FVRCP) 1차</td>
                      <td className="p-2">고양이 범백, 허피스, 칼리시 바이러스 예방</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">2차</td>
                      <td className="p-2">11주</td>
                      <td className="p-2">종합백신 2차, 고양이 백혈병(FeLV)</td>
                      <td className="p-2">외출냥이/다묘가정 필수</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">3차</td>
                      <td className="p-2">14주</td>
                      <td className="p-2">종합백신 3차, 광견병</td>
                      <td className="p-2">고양이도 광견병 접종 권장</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <Alert className="mt-4">
                <Info className="h-4 w-4" />
                <AlertTitle>정기 관리</AlertTitle>
                <AlertDescription>
                  매년 1회 추가 접종: 종합백신(FVRCP)
                  <br />
                  고양이는 강아지보다 감염 확률은 낮으나, 감염 시 치료법이 없으므로 예방이 매우 중요합니다.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>정기 투약 가이드</CardTitle>
              <CardDescription>매달 필수 투약 일정</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>심장사상충 (Heartworm)</AlertTitle>
                <AlertDescription>
                  매달 1회 필수 (먹는 약 또는 바르는 약)
                  <br />
                  <strong>여름뿐만 아니라 1년 내내 권장</strong>
                </AlertDescription>
              </Alert>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>내외부 기생충</AlertTitle>
                <AlertDescription>
                  매달 1회 (심장사상충 약과 함께 관리)
                </AlertDescription>
              </Alert>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-900">
                  <strong>💡 팁:</strong> 마지막 투약일 + 30일로 다음 투약일을 설정하면 알림으로 받을 수 있습니다.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 훈련 가이드 */}
        <TabsContent value="training" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>퍼피/키튼기 필수 훈련</CardTitle>
              <CardDescription>0~6개월 시기</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">사회화 (Socialization)</h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• 다양한 소리 경험 (청소기, 전화벨, 자동차 소리 등)</li>
                  <li>• 다양한 환경 경험 (공원, 카페, 다른 집 등)</li>
                  <li>• 다양한 사람과의 접촉 (어린이, 노인, 남녀 등)</li>
                  <li>• 다른 반려동물과의 접촉 (안전한 환경에서)</li>
                  <li>• <strong>목표:</strong> 3~14주령 사이에 완료</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">예절 교육</h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• 배변 훈련 (배변 패드 또는 외출 배변)</li>
                  <li>• '앉아' 명령어</li>
                  <li>• '기다려' 명령어</li>
                  <li>• 입질 방지 교육 (장난감 사용, 금지 명령)</li>
                  <li>• 이름 부르기 반응</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">기본 관리 적응</h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• 목욕 적응</li>
                  <li>• 브러싱 적응</li>
                  <li>• 발톱 깎기 적응</li>
                  <li>• 양치질 습관화</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>성견/성묘기 필수 훈련</CardTitle>
              <CardDescription>1~7세 시기</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">산책 및 외출 매너</h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• 리드줄 적응 (2m 이내 유지)</li>
                  <li>• 다른 개와의 인사 매너</li>
                  <li>• 사람에게 짖지 않기</li>
                  <li>• 쓰레기나 음식 줍기 방지</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">분리불안 방지</h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• 혼자 두기 훈련 (점진적 시간 증가)</li>
                  <li>• 장난감으로 독립 놀이 유도</li>
                  <li>• 과도한 애착 방지</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">에너지 소모 활동</h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• 노즈워크 (냄새 찾기 놀이)</li>
                  <li>• 지능 장난감 활용</li>
                  <li>• 산책 및 운동 루틴</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>노령기 케어</CardTitle>
              <CardDescription>7세 이상 시기</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">두뇌 자극 놀이</h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• 퍼즐 장난감</li>
                  <li>• 간단한 명령어 복습</li>
                  <li>• 새로운 장난감 도입</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">치매 예방</h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• 기존 명령어 복습</li>
                  <li>• 일상 루틴 유지</li>
                  <li>• 환경 변화 최소화</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 법규 안내 */}
        <TabsContent value="legal" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                동물등록제
              </CardTitle>
              <CardDescription>
                개를 키우는 경우 등록이 법적으로 필수입니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>등록 방법</AlertTitle>
                <AlertDescription>
                  <ol className="list-decimal list-inside space-y-1 mt-2">
                    <li>수의사에게 마이크로칩 시술 받기 (15자리 등록번호 발급)</li>
                    <li>관할 지자체에 등록 신청</li>
                    <li>등록증 발급</li>
                  </ol>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                맹견 사육 허가제
              </CardTitle>
              <CardDescription>
                다음 5종은 맹견으로 분류되어 허가제가 필요합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">맹견 종류</h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• 도사견 (Tosa)</li>
                  <li>• 아메리칸 핏불 테리어 (American Pit Bull Terrier)</li>
                  <li>• 아메리칸 스태퍼드셔 테리어 (American Staffordshire Terrier)</li>
                  <li>• 스태퍼드셔 불 테리어 (Staffordshire Bull Terrier)</li>
                  <li>• 로트와일러 (Rottweiler)</li>
                </ul>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>필수 사항</AlertTitle>
                <AlertDescription>
                  <ol className="list-decimal list-inside space-y-1 mt-2">
                    <li>관할 지자체에 허가 신청</li>
                    <li>책임보험 가입 (필수)</li>
                    <li>사육 시설 기준 충족</li>
                    <li>허가증 발급</li>
                  </ol>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>산책 시 준수사항</CardTitle>
              <CardDescription>
                과태료 방지를 위한 필수 준수사항
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">체크리스트</h4>
                <ul className="text-sm text-muted-foreground space-y-2 ml-4">
                  <li>• 인식표 착용 (이름, 전화번호 포함)</li>
                  <li>• 리드줄 착용 (2m 이내)</li>
                  <li>• 배변봉투 지참</li>
                  <li>• 공원 등 지정 장소에서만 풀어주기</li>
                  <li>• 다른 사람이나 동물에게 피해 주지 않기</li>
                </ul>
              </div>

              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>과태료 안내</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    <li>리드줄 미착용: 10만원 이하 과태료</li>
                    <li>배변 처리 안 함: 10만원 이하 과태료</li>
                    <li>맹견 허가 없이 사육: 100만원 이하 과태료</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 일상 관리 */}
        <TabsContent value="daily" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-orange-500" />
                건강 체크리스트
              </CardTitle>
              <CardDescription>
                반려동물은 아프다고 표현하지 못하므로 보호자의 세심한 관찰이 중요합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">매일 확인 사항</h4>
                <ul className="text-sm text-muted-foreground space-y-2 ml-4">
                  <li>• 식사량과 음수량 확인</li>
                  <li>• 배변 횟수 및 상태 (설사, 변비 여부)</li>
                  <li>• 활동량과 에너지 수준</li>
                  <li>• 코, 눈, 귀 분비물 확인</li>
                  <li>• 피부 상태 (발적, 상처, 벗겨짐)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">주간 확인 사항</h4>
                <ul className="text-sm text-muted-foreground space-y-2 ml-4">
                  <li>• 체중 측정 (비만 조기 발견)</li>
                  <li>• 털 상태 확인 (털 빠짐, 건조함)</li>
                  <li>• 발톱 길이 확인 및 관리</li>
                  <li>• 구강 건강 (냄새, 치석, 잇몸 상태)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">정기 관리</h4>
                <ul className="text-sm text-muted-foreground space-y-2 ml-4">
                  <li>• <strong>연 1회 종합 건강검진:</strong> 혈액 검사, 심장 청진 등</li>
                  <li>• <strong>구강 관리:</strong> 정기적인 스케일링 (1년 1~2회)</li>
                  <li>• <strong>미용 관리:</strong> 전문 미용 서비스 또는 집에서 정기 관리</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5 text-orange-500" />
                식사 관리 가이드
              </CardTitle>
              <CardDescription>
                적절한 영양 공급은 건강의 기초입니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>급여량 계산</AlertTitle>
                <AlertDescription>
                  반려동물의 나이, 크기, 활동량에 맞는 균형 잡힌 식단을 제공해야 합니다.
                  <br />
                  사료 포장지에 표시된 급여량을 기준으로 체중과 활동량에 따라 조절하세요.
                </AlertDescription>
              </Alert>

              <div>
                <h4 className="font-semibold mb-2">급여 원칙</h4>
                <ul className="text-sm text-muted-foreground space-y-2 ml-4">
                  <li>• <strong>규칙적인 시간:</strong> 매일 같은 시간에 급여</li>
                  <li>• <strong>적절한 양:</strong> 비만 예방을 위한 급여량 관리</li>
                  <li>• <strong>신선한 물:</strong> 깨끗한 물을 항상 공급</li>
                  <li>• <strong>사람 음식 금지:</strong> 인체에 해로운 음식 피하기</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">주의사항</h4>
                <ul className="text-sm text-muted-foreground space-y-2 ml-4">
                  <li>• 초콜릿, 양파, 마늘, 포도, 건포도 등은 중독 위험이 있어 금지</li>
                  <li>• 간식은 하루 칼로리의 10% 이내로 제한</li>
                  <li>• 급여량 변경 시 서서히 진행 (급격한 변경은 소화 장애 유발)</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 응급 상황 */}
        <TabsContent value="emergency" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                즉시 병원 방문 필요 상황
              </CardTitle>
              <CardDescription>
                다음 증상이 나타나면 즉시 24시 동물병원으로 가세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>응급 상황 (즉시 병원)</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    <li><strong>호흡 곤란:</strong> 숨을 헐떡이거나 호흡이 가쁨</li>
                    <li><strong>경련:</strong> 몸이 떨리거나 경련 발작</li>
                    <li><strong>대량 출혈:</strong> 심한 출혈이 지속됨</li>
                    <li><strong>의식 불명:</strong> 반응이 없거나 기절</li>
                    <li><strong>중독 의심:</strong> 독성 물질 섭취 확인</li>
                    <li><strong>배뇨 불가:</strong> 배뇨 시도하지만 소변을 보지 못함</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>24시간 이내 병원 방문 권장</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    <li><strong>지속적인 구토:</strong> 24시간 이상 구토가 계속됨</li>
                    <li><strong>심한 설사:</strong> 혈변 포함 또는 심한 설사</li>
                    <li><strong>고열:</strong> 체온이 40도 이상</li>
                    <li><strong>식욕 부진:</strong> 24시간 이상 음식을 거부</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>응급 상황 대처법</CardTitle>
              <CardDescription>
                병원으로 가기 전 즉시 조치할 사항
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">출혈 시</h4>
                <ul className="text-sm text-muted-foreground space-y-2 ml-4">
                  <li>• 깨끗한 천으로 출혈 부위를 누르고 압박</li>
                  <li>• 가능하면 상처보다 심장에 가까운 부위 압박</li>
                  <li>• 골절 의심 시 움직이지 않도록 고정</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">중독 의심 시</h4>
                <ul className="text-sm text-muted-foreground space-y-2 ml-4">
                  <li>• <strong>자극하여 구토 유발 금지:</strong> 수의사 지시 없이는 함부로 구토시키지 마세요</li>
                  <li>• 섭취한 물질과 양을 확인하고 병원에 알리기</li>
                  <li>• 물질 포장지나 라벨을 병원에 가져가기</li>
                  <li>• 가능하면 중독물질 관리센터에 연락</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">경련 발작 시</h4>
                <ul className="text-sm text-muted-foreground space-y-2 ml-4">
                  <li>• 주변 위험한 물건 제거</li>
                  <li>• 입에 손이나 물건을 넣지 말기 (물리지 않도록 주의)</li>
                  <li>• 발작 시간을 기록하고 병원에 알리기</li>
                  <li>• 발작 후 안전한 장소에서 휴식하도록 배치</li>
                </ul>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>응급 상황 대비</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    <li>가까운 24시 동물병원 전화번호를 미리 준비해두세요</li>
                    <li>응급 시 사용할 수 있는 펫 케리어나 이동 장비를 준비하세요</li>
                    <li>반려동물의 기본 건강 정보(약물 복용 여부, 알레르기 등)를 기록해두세요</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 계절별 관리 */}
        <TabsContent value="seasonal" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sun className="w-5 h-5 text-orange-500" />
                여름철 관리
              </CardTitle>
              <CardDescription>
                무더운 여름철에는 반려동물의 건강 관리에 특별한 주의가 필요합니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>열사병 주의</AlertTitle>
                <AlertDescription>
                  여름철 가장 위험한 질환입니다. 호흡 곤란, 과도한 침 흘림, 어지러움 등의 증상이 나타나면 즉시 병원으로 가세요.
                </AlertDescription>
              </Alert>

              <div>
                <h4 className="font-semibold mb-2">여름철 필수 관리</h4>
                <ul className="text-sm text-muted-foreground space-y-2 ml-4">
                  <li>• <strong>충분한 수분 공급:</strong> 항상 깨끗한 물을 제공하고 보충</li>
                  <li>• <strong>산책 시간 조절:</strong> 새벽이나 저녁 시간대에 산책 (낮 시간 피하기)</li>
                  <li>• <strong>차량 내 방치 금지:</strong> 짧은 시간이라도 차 안에 혼자 두지 마세요</li>
                  <li>• <strong>시원한 환경:</strong> 실내 온도 조절 및 통풍 유지</li>
                  <li>• <strong>털 관리 주의:</strong> 털을 너무 짧게 밀면 피부 질환이나 햇볕 화상 위험</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">피해야 할 행동</h4>
                <ul className="text-sm text-muted-foreground space-y-2 ml-4">
                  <li>• 뜨거운 아스팔트 위 산책 (발가락 화상 위험)</li>
                  <li>• 직사광선 아래 장시간 노출</li>
                  <li>• 과도한 운동 (열사병 위험 증가)</li>
                  <li>• 수영 후 귀 관리 소홀 (외이염 위험)</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Snowflake className="w-5 h-5 text-blue-500" />
                겨울철 관리
              </CardTitle>
              <CardDescription>
                추운 겨울철에도 반려동물의 건강을 지켜주세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">겨울철 필수 관리</h4>
                <ul className="text-sm text-muted-foreground space-y-2 ml-4">
                  <li>• <strong>보온 관리:</strong> 실내 온도 유지 및 보온 장비 사용 (노령견/단모견 주의)</li>
                  <li>• <strong>피부 관리:</strong> 건조한 실내 환경으로 인한 피부 건조 예방</li>
                  <li>• <strong>발 관리:</strong> 산책 후 발가락 사이 눈/얼음 제거 및 발 씻기</li>
                  <li>• <strong>적절한 운동:</strong> 실내 운동으로 운동량 유지</li>
                  <li>• <strong>관절 관리:</strong> 추운 날씨에 관절염 악화 가능성 (노령견 주의)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">주의사항</h4>
                <ul className="text-sm text-muted-foreground space-y-2 ml-4">
                  <li>• 난방기기와의 접촉 주의 (화상 위험)</li>
                  <li>• 결빙된 도로 위 보행 주의 (미끄럼 사고)</li>
                  <li>• 난방으로 인한 실내 공기 건조 (가습기 사용 권장)</li>
                  <li>• 급격한 온도 변화 피하기 (실내외 온도 차이 관리)</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

