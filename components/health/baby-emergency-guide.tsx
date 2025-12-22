/**
 * @file baby-emergency-guide.tsx
 * @description 영유아 응급처치 가이드 컴포넌트
 *
 * 영유아 응급 상황별 대처 방법을 직관적으로 제공하는 컴포넌트입니다.
 * 응급 상황 시 당황하지 않고 빠르게 필요한 정보를 찾을 수 있도록
 * 큰 아이콘과 명확한 분류로 구성되었습니다.
 *
 * 주요 기능:
 * 1. 응급 상황별 분류 (호흡/생명 위급, 사고/외상, 일상 응급, 중독/이물질, 기타)
 * 2. 각 상황별 단계별 응급처치 안내
 * 3. 영아(1세 미만)와 소아(1세 이상) 구분 안내
 * 4. 119 신고 시점 명확히 안내
 *
 * @dependencies
 * - lucide-react: 아이콘
 * - @/components/ui/tabs: 탭 UI
 * - @/components/ui/card: 카드 UI
 */

"use client";

import {
    Heart,
    AlertTriangle,
    Thermometer,
    Pill,
    Waves,
    Baby,
    Users,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface EmergencyCategory {
    id: string;
    title: string;
    icon: React.ReactNode;
    iconColor: string; // Tailwind 클래스명 직접 사용
    bgColor: string; // 비활성 상태 배경색
    activeBgColor: string; // 활성 상태 배경색
    situations: EmergencySituation[];
}

interface EmergencySituation {
    id: string;
    title: string;
    description: string;
    urgent?: boolean; // 119 신고 필요 여부
    steps: {
        title: string;
        description: string;
        warning?: string;
    }[];
    ageSpecific?: {
        infant?: string; // 1세 미만
        child?: string; // 1세 이상
    };
    warnings?: string[];
}

const emergencyCategories: EmergencyCategory[] = [
    {
        id: "breathing",
        title: "호흡/생명 위급",
        icon: <Heart className="w-8 h-8" />,
        iconColor: "text-red-600",
        bgColor: "bg-red-50",
        activeBgColor: "bg-red-100",
        situations: [
            {
                id: "choking",
                title: "목이 막혔을 때 (기도 폐쇄)",
                description: "아이가 갑자기 숨을 못 쉬거나, 얼굴이 파랗게 질리고, 소리를 내지 못할 때",
                urgent: true,
                ageSpecific: {
                    infant: "1세 미만 영아",
                    child: "1세 이상 소아",
                },
                steps: [
                    {
                        title: "[1세 미만 영아] 자세 잡기",
                        description:
                            "아이를 허벅지 위에 엎드려 눕히고, 머리가 가슴보다 낮게 위치하도록 합니다. 이때 아이의 턱을 손으로 받쳐주되 목을 누르지 않게 주의하세요.",
                    },
                    {
                        title: "[1세 미만 영아] 등 두드리기 (5회)",
                        description: "손바닥 밑부분으로 양쪽 날개뼈 사이를 강하게 5회 두드립니다.",
                    },
                    {
                        title: "[1세 미만 영아] 가슴 압박 (5회)",
                        description:
                            "아이를 뒤집어 똑바로 눕힌 뒤, 양쪽 젖꼭지 사이의 약간 아래 지점을 두 손가락으로 깊고 빠르게 5회 누릅니다.",
                    },
                    {
                        title: "[1세 이상 소아] 위치 잡기",
                        description: "아이 뒤에 무릎을 꿇고 앉아 아이의 허리를 감쌉니다.",
                    },
                    {
                        title: "[1세 이상 소아] 손 위치",
                        description: "한쪽 주먹을 쥐고 배꼽과 명치 사이에 둡니다. 다른 손으로 주먹을 감쌉니다.",
                    },
                    {
                        title: "[1세 이상 소아] 밀어 올리기",
                        description: "'J'자 모양으로 안쪽에서 위쪽으로 강하게 끌어당깁니다.",
                    },
                    {
                        title: "반복",
                        description: "이물질이 나오거나 아이가 울음을 터뜨릴 때까지 반복합니다.",
                    },
                ],
                warnings: [
                    "함부로 손을 넣어 빼지 마세요: 이물질이 눈에 확실히 보이지 않는데 손가락을 넣으면 오히려 이물질을 더 깊숙이 밀어 넣을 수 있습니다.",
                    "의식을 잃으면 즉시 CPR: 하임리히법 도중 아이가 의식을 잃고 축 늘어지면 즉시 바닥에 눕히고 심폐소생술(CPR)을 시작해야 합니다.",
                ],
            },
            {
                id: "cpr",
                title: "심폐소생술 (CPR)",
                description: "아이가 반응이 없고 숨을 쉬지 않는다면 즉시 119에 신고한 뒤 시행하세요.",
                urgent: true,
                steps: [
                    {
                        title: "119 신고",
                        description: "혼자 있다면 1분 정도 응급처치를 먼저 한 뒤 신고하고, 주변에 사람이 있다면 즉시 신고를 요청하세요.",
                    },
                    {
                        title: "[영아 1세 미만] 압박 위치",
                        description: "양쪽 젖꼭지 연결선 바로 아래",
                    },
                    {
                        title: "[영아 1세 미만] 압박 방법",
                        description: "두 손가락으로 압박",
                    },
                    {
                        title: "[소아 1세~사춘기 전] 압박 위치",
                        description: "가슴뼈 하단 1/2 지점 (명치 피함)",
                    },
                    {
                        title: "[소아 1세~사춘기 전] 압박 방법",
                        description: "한 손 또는 두 손의 뒤꿈치로 압박",
                    },
                    {
                        title: "압박 깊이",
                        description: "가슴 두께의 1/3 (영아 약 4cm, 소아 약 5cm)",
                    },
                    {
                        title: "압박 속도",
                        description: "분당 100~120회 (매우 빠르게)",
                    },
                    {
                        title: "인공호흡",
                        description:
                            "영아는 코와 입을 한꺼번에 입으로 덮고, 소아는 코를 막고 입으로만 호흡을 불어넣습니다.",
                    },
                    {
                        title: "반복",
                        description: "가슴 압박 30번과 인공호흡 2번을 한 세트로 반복합니다. 인공호흡이 어렵다면 가슴 압박만이라도 쉬지 않고 하는 것이 중요합니다.",
                    },
                ],
            },
        ],
    },
    {
        id: "accident",
        title: "사고/외상",
        icon: <AlertTriangle className="w-8 h-8" />,
        iconColor: "text-orange-600",
        bgColor: "bg-orange-50",
        activeBgColor: "bg-orange-100",
        situations: [
            {
                id: "fall",
                title: "높은 곳에서 떨어졌을 때 (낙상)",
                description: "아기는 머리가 무거워 머리부터 떨어지는 경우가 많습니다.",
                urgent: false,
                steps: [
                    {
                        title: "의식 확인",
                        description: "아기가 바로 울음을 터뜨리는지, 눈을 잘 맞추는지 확인하세요.",
                    },
                    {
                        title: "함부로 움직이지 않기",
                        description: "목이나 척추 부상 위험이 있으므로, 아기를 급하게 들어 올리지 말고 상태를 살핍니다.",
                    },
                    {
                        title: "24~48시간 관찰",
                        description:
                            "당장 괜찮아 보여도 구토를 여러 번 하거나, 심하게 처지거나, 코나 귀에서 맑은 물(액체)이 나온다면 즉시 응급실로 가야 합니다.",
                    },
                ],
                warnings: [
                    "즉시 응급실에 가야 하는 경우: 잠깐이라도 의식을 잃었을 때, 구토를 2회 이상 반복할 때, 아이의 걸음걸이가 비틀거리거나 말이 어눌해질 때, 머리에 말랑말랑한 큰 혹(혈종)이 생겼을 때",
                ],
            },
            {
                id: "burn",
                title: "화상을 입었을 때",
                description: "영유아는 성인보다 피부가 얇아 짧은 노출에도 깊은 화상을 입을 수 있습니다.",
                urgent: false,
                steps: [
                    {
                        title: "찬물로 식히기",
                        description:
                            "즉시 흐르는 찬물(얼음물 X, 미지근하지 않은 시원한 물)에 20분 이상 충분히 식혀줍니다. 통증을 줄이고 화상이 깊어지는 것을 막아줍니다.",
                    },
                    {
                        title: "옷 제거",
                        description:
                            "화상 부위의 옷을 벗기되, 피부에 옷이 달라붙었다면 억지로 떼지 말고 옷 위로 찬물을 부으며 그대로 병원에 갑니다.",
                    },
                    {
                        title: "물집 보호",
                        description: "물집을 터뜨리면 감염 위험이 큽니다. 깨끗한 거즈나 비닐 랩으로 환부를 살짝 덮어 보호하세요.",
                    },
                ],
                warnings: [
                    "연고, 버터, 소주, 된장 등은 상처를 악화시키므로 아무것도 바르지 마세요.",
                ],
            },
            {
                id: "bleeding",
                title: "상처가 나서 피가 날 때 (출혈)",
                description: "출혈이 멈추지 않거나 깊은 상처가 있을 때는 즉시 119를 불러야 합니다.",
                urgent: false,
                steps: [
                    {
                        title: "직접 압박",
                        description: "깨끗한 거즈나 수건으로 상처 부위를 꾹 누릅니다. (5~10분 이상 지속)",
                    },
                    {
                        title: "부위 높이기",
                        description: "가능하다면 출혈 부위를 심장보다 높게 위치시킵니다.",
                    },
                    {
                        title: "지혈제 자제",
                        description:
                            "가루 형태의 지혈제는 상처 확인을 방해하고 흉터를 남길 수 있으므로 병원 방문 전에는 사용하지 않는 것이 좋습니다.",
                    },
                ],
            },
            {
                id: "tooth",
                title: "치아가 빠졌을 때",
                description: "빠진 치아를 절대 버리지 마세요!",
                urgent: false,
                steps: [
                    {
                        title: "치아 보관",
                        description:
                            "치아의 뿌리 부분을 만지지 말고(머리 부분만 잡기), 우유나 생리식염수가 담긴 용기에 담아 30분 이내에 치과로 가야 살릴 수 있습니다.",
                    },
                    {
                        title: "주의",
                        description: "물에 씻으면 치근막 세포가 죽으니 주의하세요.",
                    },
                ],
            },
        ],
    },
    {
        id: "daily",
        title: "일상 응급",
        icon: <Thermometer className="w-8 h-8" />,
        iconColor: "text-blue-600",
        bgColor: "bg-blue-50",
        activeBgColor: "bg-blue-100",
        situations: [
            {
                id: "fever-seizure",
                title: "열성 경련 (자지러지듯 떨 때)",
                description: "갑작스러운 고열로 아기가 눈을 치켜뜨고 몸을 떨며 뻣뻣해질 수 있습니다.",
                urgent: false,
                steps: [
                    {
                        title: "주변 물건 치우기",
                        description: "아기가 부딪혀 다치지 않게 주변의 딱딱하거나 위험한 물건을 치웁니다.",
                    },
                    {
                        title: "옆으로 눕히기",
                        description: "침이나 구토물이 기도를 막지 않도록 고개를 옆으로 돌려주거나 몸 전체를 옆으로 눕힙니다.",
                    },
                    {
                        title: "시간 체크",
                        description: "경련이 시작된 시간을 확인하세요. (진료 시 의사에게 꼭 알려줘야 합니다.)",
                    },
                ],
                warnings: [
                    "절대 금지: 억지로 몸을 붙잡거나, 입안에 손가락/숟가락을 넣거나, 의식이 없는 상태에서 해열제를 먹이지 마세요.",
                    "경련이 5분 이상 지속될 때는 즉시 119를 불러야 합니다.",
                ],
            },
            {
                id: "nosebleed",
                title: "코피가 날 때",
                description: "흔히 고개를 뒤로 젖히는데, 피가 목구멍으로 넘어가 기도를 막거나 구토를 유발할 수 있습니다.",
                urgent: false,
                steps: [
                    {
                        title: "고개 숙이기",
                        description: "고개를 앞으로 살짝 숙이게 하세요.",
                    },
                    {
                        title: "콧볼 압박",
                        description: "콧등이 아니라 말랑말랑한 콧볼 부분을 손가락으로 5~10분간 꾹 눌러줍니다.",
                    },
                ],
            },
            {
                id: "nose-object",
                title: "코에 이물질을 넣었을 때",
                description: "아이들은 콩, 구슬, 종이 뭉치 등을 코에 넣기도 합니다.",
                urgent: false,
                steps: [
                    {
                        title: "반대쪽 콧구멍 누르기",
                        description: "반대쪽 콧구멍을 누르고 코를 세게 풀게 해보세요.",
                    },
                    {
                        title: "병원 방문",
                        description:
                            "나오지 않는다고 해서 핀셋 등으로 억지로 빼려다가는 이물질이 더 깊숙이 들어가 기도를 막을 수 있습니다. 이럴 땐 바로 이비인후과를 가는 것이 가장 안전합니다.",
                    },
                ],
            },
        ],
    },
    {
        id: "poison",
        title: "중독/이물질",
        icon: <Pill className="w-8 h-8" />,
        iconColor: "text-purple-600",
        bgColor: "bg-purple-50",
        activeBgColor: "bg-purple-100",
        situations: [
            {
                id: "swallowed",
                title: "위험한 물질을 삼켰을 때 (중독 및 이물질 삼킴)",
                description: "약 모양이 사탕 같아 보이거나 액체가 음료처럼 보여 아이들이 삼키는 경우가 많습니다.",
                urgent: false,
                steps: [
                    {
                        title: "함부로 구토시키지 마세요",
                        description:
                            "강제로 토하게 하다가 물질이 기도로 들어가 폐 손상을 일으키거나, 식도를 다시 손상시킬 수 있습니다.",
                    },
                    {
                        title: "내용물 지참",
                        description: "아이가 무엇을 먹었는지 알 수 있는 용기나 남은 물질을 가지고 즉시 응급실로 갑니다.",
                    },
                ],
                warnings: [
                    "버튼형 건전지나 자석을 삼켰을 때는 장기에 구멍을 낼 수 있는 매우 위험한 상황이므로 지체 없이 병원으로 가야 합니다.",
                ],
            },
            {
                id: "insect-bite",
                title: "벌에 쏘였을 때",
                description: "벌에 쏘였을 때의 대처법",
                urgent: false,
                steps: [
                    {
                        title: "벌침 제거",
                        description: "카드를 이용해 피부를 밀어서 벌침을 제거합니다. (손으로 짜면 독이 더 퍼질 수 있습니다.)",
                    },
                    {
                        title: "냉찜질",
                        description: "부기를 가라앉히기 위해 냉찜질을 해줍니다.",
                    },
                ],
                warnings: [
                    "호흡 곤란이나 온몸에 두드러기가 난다면 알레르기 쇼크(아나필락시스)일 수 있으니 즉시 119를 부르세요.",
                ],
            },
            {
                id: "animal-bite",
                title: "개나 고양이에게 물렸을 때",
                description: "상처가 작아 보여도 동물의 입속 세균에 의해 감염될 수 있습니다.",
                urgent: false,
                steps: [
                    {
                        title: "상처 세척",
                        description: "비누와 흐르는 물로 10~15분간 상처를 충분히 씻어냅니다.",
                    },
                    {
                        title: "병원 방문",
                        description: "병원을 방문해 소독과 항생제 처방 여부를 확인하세요.",
                    },
                ],
            },
        ],
    },
    {
        id: "other",
        title: "기타",
        icon: <Waves className="w-8 h-8" />,
        iconColor: "text-teal-600",
        bgColor: "bg-teal-50",
        activeBgColor: "bg-teal-100",
        situations: [
            {
                id: "bathroom",
                title: "욕실 사고 (미끄러짐 및 익수)",
                description: "욕실은 물기가 많아 낙상 사고가 잦고, 아주 얕은 물에서도 영유아는 익사 사고가 발생할 수 있습니다.",
                urgent: false,
                steps: [
                    {
                        title: "머리를 부딪혔을 때",
                        description:
                            "아이가 울음을 그치지 않거나, 귀나 코에서 맑은 액체 혹은 피가 나오면 즉시 응급실로 가야 합니다.",
                    },
                    {
                        title: "물을 먹었을 때 (가성 익사)",
                        description:
                            "물에 빠졌다가 구조된 후 겉으로 괜찮아 보여도, 소량의 물이 폐로 들어가 염증을 일으키는 '가성 익사'가 발생할 수 있습니다. 사고 후 기침이 심해지거나, 숨소리가 거칠어지고, 무기력해진다면 즉시 진료를 받아야 합니다.",
                    },
                ],
                warnings: [
                    "예방: 욕실 바닥에는 반드시 미끄럼 방지 매트를 깔고, 아이 혼자 욕조에 절대 두지 마세요.",
                ],
            },
        ],
    },
];

export function BabyEmergencyGuide() {
    return (
        <div className="space-y-6">
            {/* 응급 상황 분류 탭 */}
            <Tabs defaultValue="breathing" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 gap-2 h-auto p-1">
                    {emergencyCategories.map((category) => {
                        // 각 카테고리별 배경색 클래스 매핑
                        const bgClassMap: Record<string, { base: string; active: string }> = {
                            breathing: { base: "bg-red-50", active: "data-[state=active]:bg-red-100" },
                            accident: { base: "bg-orange-50", active: "data-[state=active]:bg-orange-100" },
                            daily: { base: "bg-blue-50", active: "data-[state=active]:bg-blue-100" },
                            poison: { base: "bg-purple-50", active: "data-[state=active]:bg-purple-100" },
                            other: { base: "bg-teal-50", active: "data-[state=active]:bg-teal-100" },
                        };
                        const bgClasses = bgClassMap[category.id] || { base: "bg-gray-50", active: "data-[state=active]:bg-gray-100" };

                        return (
                            <TabsTrigger
                                key={category.id}
                                value={category.id}
                                className={cn(
                                    "flex flex-col items-center gap-2 py-3 px-2 transition-colors",
                                    bgClasses.base,
                                    bgClasses.active,
                                    "data-[state=active]:shadow-md"
                                )}
                            >
                                <div className={category.iconColor}>{category.icon}</div>
                                <span className="text-xs font-medium text-center leading-tight">
                                    {category.title}
                                </span>
                            </TabsTrigger>
                        );
                    })}
                </TabsList>

                {emergencyCategories.map((category) => (
                    <TabsContent key={category.id} value={category.id} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {category.situations.map((situation) => (
                                <Card
                                    key={situation.id}
                                    className={`border-2 ${
                                        situation.urgent
                                            ? "border-red-300 bg-red-50"
                                            : "border-gray-200"
                                    }`}
                                >
                                    <CardHeader>
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <CardTitle className="text-lg">
                                                        {situation.title}
                                                    </CardTitle>
                                                    {situation.urgent && (
                                                        <Badge variant="destructive" className="text-xs">
                                                            119 신고
                                                        </Badge>
                                                    )}
                                                </div>
                                                <CardDescription>{situation.description}</CardDescription>
                                            </div>
                                        </div>
                                        {situation.ageSpecific && (
                                            <div className="flex gap-2 mt-2">
                                                {situation.ageSpecific.infant && (
                                                    <Badge variant="outline" className="text-xs">
                                                        <Baby className="w-3 h-3 mr-1" />
                                                        {situation.ageSpecific.infant}
                                                    </Badge>
                                                )}
                                                {situation.ageSpecific.child && (
                                                    <Badge variant="outline" className="text-xs">
                                                        <Users className="w-3 h-3 mr-1" />
                                                        {situation.ageSpecific.child}
                                                    </Badge>
                                                )}
                                            </div>
                                        )}
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-3">
                                            {situation.steps.map((step, index) => (
                                                <div
                                                    key={index}
                                                    className="flex gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                                                >
                                                    <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full font-bold flex-shrink-0 text-sm">
                                                        {index + 1}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold text-sm mb-1">
                                                            {step.title}
                                                        </h4>
                                                        <p className="text-sm text-gray-700">
                                                            {step.description}
                                                        </p>
                                                        {step.warning && (
                                                            <p className="text-xs text-amber-700 mt-1 bg-amber-50 p-2 rounded">
                                                                ⚠️ {step.warning}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {situation.warnings && situation.warnings.length > 0 && (
                                            <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-3 space-y-1">
                                                <p className="font-semibold text-amber-900 text-sm">
                                                    ⚠️ 주의사항:
                                                </p>
                                                <ul className="list-disc list-inside text-xs text-amber-800 space-y-1">
                                                    {situation.warnings.map((warning, index) => (
                                                        <li key={index}>{warning}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}
