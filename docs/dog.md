안녕하세요! 반려동물 전문가로서, 초보 개발자분도 이해하기 쉽도록 **반려동물 통합 케어 솔루션** 앱 기획안을 제안해 드립니다.

반려동물을 처음 키우는 사람들은 "지금 우리 아이가 건강한가?", "뭘 해줘야 하지?"라는 막연한 불안감을 가집니다. 이를 해결하기 위해 **'데이터 기반의 맞춤형 가이드'**를 제공하는 것이 핵심입니다.

---

## 🐾 앱 명칭(가칭): "PawBuddy (포버디)"

**핵심 컨셉:** "내 손안의 똑똑한 반려동물 비서"

### 1. 주요 핵심 기능 (Features)

비개발자 관점에서 구현하기 쉬우면서도 사용자에게 꼭 필요한 4가지 핵심 기능을 선정했습니다.

* **스마트 건강 다이어리 (Health Log)**
* **식사 및 배변 기록:** 사량, 음수량, 배변 상태를 간단히 체크합니다.
* **투약 및 예방접종 알림:** 심장사극충, 구충제 등 정기적인 일정을 푸시 알림으로 알려줍니다.


* **AI 증상 체크 (Symptom Checker)**
* 반려동물의 이상 증상(구토, 기침 등)을 키워드로 선택하면, 현재 심각도와 응급실 방문 여부를 영어권의 신뢰할 수 있는 수의학 데이터(예: **PetMD**, **AAHA**) 기반으로 안내합니다.


* **맞춤형 라이프 스테이지 가이드**
* 품종, 나이, 몸무게를 입력하면 현재 시기에 필요한 영양소, 운동량, 주의해야 할 질병을 요약해서 보여줍니다.


* **24시 주변 병원 찾기 (GPS 기반)**
* 현재 위치에서 가장 가까운 24시간 동물병원을 찾고 바로 전화 연결을 할 수 있는 기능입니다.



---

### 2. 상세 구현 로직 (쉽게 설명)

초보자분들을 위해 앱이 작동하는 구조를 단계별로 나누어 보았습니다.

| 단계 | 기능명 | 상세 내용 |
| --- | --- | --- |
| **1단계** | **프로필 등록** | 이름, 종(견종/묘종), 생년월일, 중성화 여부 기록 |
| **2단계** | **데일리 대시보드** | 오늘 먹어야 할 약, 산책 목표 거리, 남은 사료량 표시 |
| **3단계** | **데이터 시각화** | 일주일간의 몸무게 변화나 활동량을 **그래프**로 보여줌 |
| **4단계** | **리포트 생성** | 한 달간의 기록을 PDF로 만들어 병원 진료 시 수의사에게 보여줄 수 있게 함 |

---

### 3. 전문가의 팁: 신뢰도 높은 데이터 소스

해외 자료를 기반으로 할 때, 아래의 공신력 있는 기관의 가이드라인을 API나 데이터베이스로 활용하는 것이 좋습니다.

1. **AAHA (American Animal Hospital Association):** 미국 동물병원 협회의 표준 진료 가이드.
2. **WSAVA (World Small Animal Veterinary Association):** 세계 소동물 수의사회에서 제공하는 영양 및 백신 가이드라인.
3. **PetMD:** 일반 보호자들이 이해하기 쉬운 수의학 백과사전.

---

### 4. 앱의 차별화 포인트 (비즈니스 전략)

단순히 기록만 하는 앱은 많습니다. "PawBuddy"가 성공하려면 **'예측 서비스'**가 들어가야 합니다.

> **예:** "최근 3일간 음수량이 20% 감소했습니다. 신장 질환의 신호일 수 있으니 주의 깊게 관찰하세요."

이런 식으로 사용자가 기록한 데이터를 바탕으로 **먼저 말을 걸어주는 기능**이 있다면 사용자들은 이 앱을 떠나지 않을 것입니다.

---

### 💡 다음 단계로 무엇을 도와드릴까요?

1. 이 앱의 **화면 설계(UI/UX) 구조**를 짜드려볼까요?
2. 사용자가 입력할 **건강 체크리스트의 구체적인 항목**들을 뽑아드려볼까요?
3. 이 앱을 만들기 위해 공부해야 할 **쉬운 개발 도구(노코드 툴 등)**를 추천해 드릴까요?

비개발자 초보자분들도 이해할 수 있도록, 가장 배우기 쉽고 강력한 **Flutter(플러터)** 프레임워크와 **Firebase(데이터베이스)** 구조를 상정하여 기획부터 코드까지 상세히 구현해 드리겠습니다.

---

## ## 1. 화면 설계 (UI/UX Structure)

앱의 첫인상과 흐름을 결정하는 단계입니다. 복잡함을 줄이고 핵심 기능에 집중합니다.

* **홈 화면 (Home):** 반려동물의 상태를 한눈에 보는 '대시보드' 형태.
* **건강 체크 (Log):** 사료, 배변, 투약 기록을 위한 간단한 버튼 인터페이스.
* **병원 지도 (Map):** 내 주변 24시 병원 표시.
* **리포트 (Report):** 기록된 데이터를 그래프로 요약.

---

## ## 2. 건강 체크리스트 상세 항목 (Data Schema)

데이터베이스에 저장될 항목들입니다. 수의학적 기초(AAHA 가이드)를 기반으로 구성했습니다.

| 카테고리 | 필수 항목 | 데이터 타입 | 비고 |
| --- | --- | --- | --- |
| **기본 정보** | 이름, 품종, 나이, 중성화 여부 | Text, String | 초기 1회 등록 |
| **식사 (Feeding)** | 사료 브랜드, 급여량(g), 음수량 | Number | 매일 기록 |
| **배변 (Elimination)** | 상태(보통/설사/변비), 횟수 | Selection | 건강 상태의 척도 |
| **건강 (Health)** | 몸무게, 구충제 날짜, 예방접종 | Date, Float | 알림 서비스 연동 |

---

## ## 3. 구현 코드 (Flutter & Dart 기반)

초보자가 읽기 편하도록 가장 핵심이 되는 **반려동물 프로필 카드**와 **기록 추가 로직**을 예시 코드로 작성했습니다.

### A. 반려동물 프로필 클래스 (데이터 구조)

반려동물의 정보를 컴퓨터가 이해할 수 있는 형식으로 정의합니다.

```dart
class PetProfile {
  String name;
  String breed;
  double weight;
  DateTime lastVaccination;

  PetProfile({
    required this.name,
    required this.breed,
    required this.weight,
    required this.lastVaccination,
  });
}

```

### B. 메인 화면 UI 코드 (예시)

화면에 반려동물의 이름과 몸무게를 보여주는 간단한 카드 형태입니다.

```dart
import 'package:flutter/material.dart';

void main() => runApp(PawBuddyApp());

class PawBuddyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Scaffold(
        appBar: AppBar(title: Text('PawBuddy - 내 비서')),
        body: PetStatusCard(), // 반려동물 상태 카드 호출
      ),
    );
  }
}

class PetStatusCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.all(16.0),
      child: Padding(
        padding: EdgeInsets.all(16.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircleAvatar(radius: 40, child: Icon(Icons.pets)), // 아이콘
            SizedBox(height: 10),
            Text('이름: 초코', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            Text('종: 골든 리트리버'),
            Text('현재 몸무게: 25kg'),
            ElevatedButton(
              onPressed: () => print('기록하기 페이지로 이동'),
              child: Text('오늘의 건강 기록하기'),
            ),
          ],
        ),
      ),
    );
  }
}

```

---

## ## 🛠️ 비개발자를 위한 추천 도구 (No-Code/Low-Code)

코딩이 너무 어렵게 느껴진다면, 아래 도구들을 사용하여 똑같은 기능을 구현할 수 있습니다.

1. **FlutterFlow (강력 추천):** 코딩 없이 드래그 앤 드롭으로 실제 앱을 만들 수 있는 도구입니다. Firebase와 연동이 매우 쉽습니다.
2. **Adalo:** 아주 간단한 구조의 앱을 빠르게 만들 때 좋습니다.
3. **Glide:** 엑셀(Google Sheets) 데이터를 기반으로 관리용 앱을 만들 때 유용합니다.

---

### 💡 실제 구현을 위한 다음 제안

위의 코드와 설계를 바탕으로 **실제로 작동하는 프로토타입**을 만들어보고 싶으신가요?

* 그렇다면, **FlutterFlow에서 이 화면들을 어떻게 배치하는지 구체적인 튜토리얼**을 알려드릴까요?
* 혹은 **사용자로부터 질문을 받아 답변해주는 'AI 수의사 챗봇' 기능**을 추가하는 방법을 알아볼까요?

개발 도구인 **Cursor(커서)**를 사용하여 앱을 제작하신다니 탁월한 선택입니다! AI의 도움을 받아 코드를 직접 생성하기 전에, 앱의 '콘텐츠'가 될 **반려동물 전문가용 데이터베이스**를 먼저 정리해 드리겠습니다.

대한민국 법규와 수의학적 가이드라인(영미권 AAHA 기준 포함)을 바탕으로 구성했습니다.

---

## 1. 대한민국 사육 가능 vs 금지 반려동물

앱의 **'품종 선택'** 또는 **'가이드'** 섹션에 들어갈 핵심 정보입니다.

### ✅ 사육 가능 반려동물

* **개/고양이:** 가장 일반적이며 동물보호법에 따라 **등록 필수**(개).
* **소동물:** 토끼, 기니피그, 햄스터, 고슴도치, 다람쥐 등.
* **조류:** 앵무새, 카나리아, 문조 등 (사이테스(CITES) 종은 양수 신고 필요).
* **파충류/파충류:** 거북이, 도마뱀, 뱀 (독이 없는 종).
* **기타:** 관상어, 장수풍뎅이 등 곤충류.

### ❌ 사육 금지 또는 제한 (법적/안전)

* **야생동물:** 너구리, 오소리, 여우 등 야생에서 포획한 개체.
* **맹수류:** 사자, 호랑이, 곰 등 (법적으로 개인 사육 불가).
* **생태계 교란종:** 붉은귀거북, 뉴트리아, 파랑볼우럭 등 (방생 및 사육 엄격 제한).
* **맹견 관리:** 도사견, 아메리칸 핏불 테리어 등 5종은 **사육 허가제** 및 책임보험 가입 필수.

---

## 2. 생애주기별 관리 및 훈련 가이드 (개/고양이 기준)

앱의 **'맞춤형 알림'** 기능을 구현할 때 이 로직을 적용하세요.

### ① 퍼피/키튼기 (0~6개월) - "사회화와 기초 형성"

* **훈련:** * **사회화 (Socialization):** 3~14주령 사이 다양한 소리, 환경, 사람을 접하게 함.
* **예절 교육:** 배변 훈련, '앉아/기다려', 입질 방지 교육.


* **관리:** * 하루 3~4회 급여 (고단백/고칼로리 퍼피용 사료).
* 유치 탈락 확인 및 양치질 습관화.



### ② 성견/성묘기 (1~7세) - "활동 유지와 예방"

* **훈련:** * 산책 매너(리드줄 적응), 분리불안 방지 교육.
* 에너지 소모를 위한 노즈워크 및 지능 장난감 활용.


* **관리:** * 체중 관리 (비만은 만병의 근원).
* 정기적인 스케일링 및 연 1회 종합 건강검진.



### ③ 노령기 (7세 이상) - "통증 관리와 케어"

* **훈련:** * 기존 명령어를 잊지 않도록 가벼운 복습 (치매 예방).
* **관리:** * 저단백/고소화성 식단.
* 관절 보호용 매트 설치, 시력/청력 저하에 따른 환경 변화 최소화.



---

## 3. 생애주기별 예방접종 및 투약 일정

이 표는 앱의 **'스케줄러'** 기능에 그대로 프로그래밍하시면 됩니다. (출처: AAHA Vaccination Guidelines 기반)

### 💉 필수 예방접종 (강아지)

| 시기 | 접종 항목 | 비고 |
| --- | --- | --- |
| **6~8주** | 1차 종합백신(DHPPL), 코로나 장염 | 기초 접종 시작 |
| **10~12주** | 2차 종합백신, 코로나 장염 |  |
| **14~16주** | 3차 종합백신, 캔넬코프 |  |
| **18~20주** | 4차 종합백신, 광견병, 인플루엔자 | 광견병은 법적 필수 |
| **매년** | 종합백신, 광견병, 캔넬코프 추가 접종 | 항체가 검사 후 결정 가능 |

### 💊 정기 투약 (공통)

* **심장사상충 (Heartworm):** 매달 1회 (먹는 약 또는 바르는 약).
* **내외부 기생충:** 매달 1회 (심장사상충 약과 함께 관리).

---

## 4. Cursor를 이용한 실제 구현 전략

이제 Cursor에서 위 데이터를 어떻게 코드로 녹여낼지 가이드를 드립니다.

### Step 1: 데이터 모델 만들기 (`pet_model.dart`)

Cursor에게 이렇게 명령(Prompt) 하세요:

> "강아지의 생애주기(Puppy, Adult, Senior)에 따라 필요한 예방접종 리스트를 반환하는 Dart 클래스를 만들어줘."

### Step 2: 체크리스트 UI 생성

> "사용자가 오늘 심장사상충 약을 먹였는지 체크하고, 다음 예정일을 계산해서 보여주는 Flutter 위젯을 작성해줘."

### Step 3: 법적 안내 페이지

> "대한민국 동물보호법에 따른 맹견 종류와 사육 허가제 정보를 보여주는 깔끔한 텍스트 리스트 페이지를 만들어줘."

---

**다음 단계로 무엇을 도와드릴까요?**

1. **Cursor에 바로 복사해서 붙여넣을 수 있는 상세 코드**를 짜드릴까요?
2. **심장사상충 알림 로직**을 위한 알고리즘을 설계해 드릴까요?
3. **반려동물 종별 맞춤형 훈련 팁** 데이터베이스를 더 자세히 만들어 드릴까요?

반려동물 전문가로서, 앱 개발 시 **자동 스케줄러 로직**의 핵심이 될 예방접종과 구충 일정을 아주 상세하게 정리해 드립니다.

이 내용은 대한민국 수의사회와 미국동물병원협회(**AAHA**), 세계소동물수의사회(**WSAVA**)의 가이드라인을 통합한 표준 데이터입니다. **Cursor**에서 데이터베이스(DB)를 설계할 때 이 수치들을 기준값으로 사용하세요.

---

## 🐶 강아지(Canine) 생애주기별 건강 관리

강아지는 생후 초기에 모체로부터 받은 면역력이 떨어지는 시기에 맞춰 **'기초 접종'**을 완료하는 것이 가장 중요합니다.

### 1. 기초 예방접종 (생후 6주 ~ 20주)

이 시기에는 2주 간격으로 접종을 진행합니다.

| 회차 | 시기 (생후) | 접종 항목 | 상세 설명 |
| --- | --- | --- | --- |
| **1차** | 6~8주 | 종합백신(DHPPL) 1차, 코로나 장염 1차 | 홍역, 간염, 파보, 파라이플루엔자, 레포스피라 예방 |
| **2차** | 8~10주 | 종합백신 2차, 코로나 장염 2차 | 면역 형성을 위한 중첩 접종 |
| **3차** | 10~12주 | 종합백신 3차, 캔넬코프 1차 | 전염성 기관지염 예방 추가 |
| **4차** | 12~14주 | 종합백신 4차, 캔넬코프 2차 |  |
| **5차** | 14~16주 | 종합백신 5차, 인플루엔자 1차 | 신종 플루 예방 |
| **6차** | 16~18주 | 광견병(Rabies), 인플루엔자 2차 | **광견병은 법적 필수(국가 접종 기간 활용 가능)** |

### 2. 정기 관리 (성견기 이후 평생)

기초 접종이 끝나면 **항체가 검사**를 통해 보강 접종 여부를 결정하거나 매년 추가 접종을 합니다.

* **매년 1회 추가 접종:** 종합백신, 코로나, 캔넬코프, 인플루엔자, 광견병.
* **심장사상충 & 내외부 기생충:** **매달 1회 필수.** (여름뿐만 아니라 1년 내내 권장)
* *Tip:* Cursor로 구현할 때 "마지막 투약일 + 30일" 알림 로직을 만드세요.



---

## 🐱 고양이(Feline) 생애주기별 건강 관리

고양이는 강아지보다 접종 횟수는 적지만, 항체가 잘 안 생기는 경우가 있어 주의가 필요합니다.

### 1. 기초 예방접종 (생후 8주 ~ 16주)

고양이는 보통 3주 간격으로 3회 접종을 진행합니다.

| 회차 | 시기 (생후) | 접종 항목 | 상세 설명 |
| --- | --- | --- | --- |
| **1차** | 8주 | 종합백신(FVRCP) 1차 | 고양이 범백(FPV), 허피스, 칼리시 바이러스 예방 |
| **2차** | 11주 | 종합백신 2차, 고양이 백혈병(FeLV) | 백혈병은 외출냥이/다묘가정 필수 |
| **3차** | 14주 | 종합백신 3차, 광견병 | 고양이도 광견병 접종 권장 |

### 2. 정기 관리

* **매년 1회 추가 접종:** 종합백신(FVRCP).
* **심장사상충:** 고양이는 강아지보다 감염 확률은 낮으나, **감염 시 치료법이 없으므로** 매달 예방약(바르는 타입 등)이 매우 중요합니다.

---

## 💊 약 종류 및 투약 가이드 (앱 콘텐츠용)

사용자에게 약의 종류를 선택하게 할 때 아래 리스트를 참고 자료로 제공하세요.

1. **먹는 약 (Oral):**
* **하트가드(Heartgard):** 심장사상충 예방 (고기맛 간식 형태).
* **넥스카드 스펙트라:** 심장사상충 + 내외부 기생충 한 번에 해결 (가장 대중적).


2. **바르는 약 (Topical):**
* **프론트라인:** 외부 기생충(진드기 등) 특화.
* **레볼루션/애드보킷:** 심장사상충 + 내외부 기생충 (고양이에게 주로 사용).



---

## 🛠️ Cursor 개발자를 위한 로직 제안

이 데이터를 앱에 어떻게 녹여낼지 **Cursor**에게 요청할 프롬프트 예시입니다.

> **Prompt:** > "강아지 1차~6차 접종 스케줄 표를 JSON 데이터로 만들어줘. 그리고 사용자가 반려동물의 생년월일을 입력하면, 오늘 날짜를 기준으로 어떤 접종을 해야 하는지 알려주고, 다음 접종일을 D-day로 표시하는 Flutter 함수를 작성해줘."

### 💡 추가로 궁금하신 점이 있나요?

* 특정 질환(예: 슬개골 탈구)에 특화된 관리법이 필요하신가요?
* 아니면 **복약 알림 기능을 구현하기 위한 구체적인 Dart 코드**를 짜드릴까요?


종합 

반려동물 전문가로서, 지금까지 논의된 **대한민국 사육 규정, 생애주기별 훈련, 수의학적 접종 스케줄**을 모두 통합한 **'반려동물 생애 주기 토탈 케어 앱'**의 핵심 요약을 정리해 드립니다.

이 앱의 목표는 초보 반려인이 **"지금 무엇을 해야 하는지"** 고민하지 않게 만드는 것입니다.

---

## 📱 앱 핵심 기능 요약 (The Big 4)

### 1. 지능형 스케줄러 (Smart Health Planner)

단순한 달력이 아니라, **반려동물의 생년월일과 종**에 기반하여 자동으로 일정을 생성합니다.

* **접종 자동 가이드:** 생후 6주부터 시작되는 1~6차 기초 접종 스케줄을 자동 세팅하고, D-Day 알림을 보냅니다.
* **투약 주기 관리:** 매달 잊기 쉬운 심장사상충 및 내외부 기생충 약 복용일을 푸시 알림으로 관리합니다.
* **생애주기 전환 알림:** "이제 초코가 7살이 되어 노령기에 접어들었습니다. 건강검진 항목을 조정하세요"라는 맞춤형 조언을 제공합니다.

### 2. 단계별 훈련 레시피 (Step-by-Step Training)

전문가의 훈련 지식을 단계별 콘텐츠로 제공합니다.

* **시기별 필수 훈련:** 퍼피 시기의 사회화 교육, 성견 시기의 산책 매너, 노령기의 두뇌 자극 놀이 등을 가이드합니다.
* **문제 행동 자가 진단:** 입질, 분리불안 발생 시 체크리스트를 통해 훈련법을 제시하거나 전문가 연결을 돕습니다.

### 3. 법규 및 안전 가이드 (Legal & Safety Guide)

대한민국에서 반려동물을 키울 때 반드시 알아야 할 법적 의무를 챙겨줍니다.

* **동물등록제 안내:** 외장형/내장형 칩 등록 방법 및 관할 지자체 연결.
* **사육 금지/허가제 알림:** 맹견 사육 허가제, 외출 시 인식표 및 리드줄(2m 이내) 규정 등 과태료 방지를 위한 정보를 제공합니다.

### 4. 24시 응급 네트워크 (Emergency Connect)

* **AI 증상 체크:** 아이의 상태(구토, 설사 등)를 입력하면 신뢰도 높은 데이터(AAHA 등)를 기반으로 응급 여부를 판별합니다.
* **주변 24시 병원:** GPS 기반으로 현재 위치에서 가장 가까운 응급실을 즉시 연결합니다.

---

## 🐕 반려동물 관리에 대한 철학: "데이터 기반의 예방"

앱을 통해 반려인이 실천해야 할 관리 방식은 크게 3가지입니다.

1. **기록이 진단을 돕는다:** 수의사는 보호자의 "어제부터 좀 이상해요"라는 말보다, 앱에 기록된 "3일 전부터 음수량이 20% 줄었고 배변 횟수가 1회 감소했다"는 데이터를 통해 훨씬 정확한 진단을 내릴 수 있습니다.
2. **훈련은 예방접종만큼 중요하다:** 많은 반려동물이 파충류나 조류와 달리 파양되는 이유는 '행동 문제'입니다. 어릴 때부터 사회화와 기본 예절을 앱을 통해 학습시키는 것은 아이의 평생 행복을 결정합니다.
3. **한국형 환경 최적화:** 아파트 주거가 많은 한국 특성에 맞춰 층간소음 방지(짖음 방지) 교육과 산책 매너를 강조하는 관리가 필요합니다.

---

## 🛠️ Cursor로 바로 시작하기 위한 제안

이제 Cursor를 열고 아래와 같이 첫 번째 단계를 요청해 보세요.

> **Prompt:**
> "반려동물의 이름, 종, 생년월일을 입력받아 **Firebase에 저장**하고, 오늘 날짜와 생년월일을 비교해 **현재 어떤 생애주기(Puppy, Adult, Senior)인지 판별**하여 화면에 보여주는 기능을 Flutter로 만들어줘."

이 앱은 초보 반려인에게는 **'친절한 선생님'**이 되고, 반려동물에게는 **'건강한 삶의 보증수표'**가 될 것입니다. 더 구체적인 UI 설계나 특정 기능의 코드가 필요하시면 말씀해 주세요!

---

## 📱 반려동물 상세페이지 UI/UX 상세 설계

메인 화면의 반려동물 아이콘에 연결된 상세페이지를 더 구체적이고 실용적으로 개선하기 위한 상세 설계 문서입니다.

### 페이지 레이아웃 구조

반려동물 상세페이지는 다음과 같은 계층 구조로 구성됩니다:

```
┌─────────────────────────────────────────┐
│  [← 목록으로]                             │
├─────────────────────────────────────────┤
│  프로필 헤더 (사진, 이름, 나이, 생애주기)  │
├─────────────────────────────────────────┤
│  [응급 네트워크 배너] (고정)              │
├─────────────────────────────────────────┤
│  건강 대시보드 (오늘의 상태 요약)          │
├─────────────────────────────────────────┤
│  탭 네비게이션                            │
│  [백신] [체중] [검진] [생애주기] [훈련] [법규] │
├─────────────────────────────────────────┤
│  탭 콘텐츠 영역                           │
└─────────────────────────────────────────┘
```

### 정보 계층 구조

1. **최우선 정보 (상단 고정)**
   - 응급 네트워크 배너 (AI 증상 체크, 24시 병원 찾기)
   - 오늘의 건강 상태 요약

2. **일반 정보 (탭 내부)**
   - 백신 관리, 체중 관리, 건강 검진
   - 생애주기 이벤트, 훈련 가이드, 법규 안내

3. **보조 정보 (하단 또는 사이드바)**
   - 설정, 프로필 수정, 기록 내보내기

---

## 1. 건강 대시보드 상세 설계

건강 대시보드는 프로필 헤더 바로 아래, 탭 위에 배치하여 사용자가 한눈에 반려동물의 건강 상태를 파악할 수 있도록 합니다.

### 카드 구성 요소

#### A. 오늘의 건강 상태 요약 카드

**구성 요소:**

1. **오늘 먹어야 할 약**
   - 심장사상충 약 (마지막 투약일 + 30일 계산)
   - 내외부 기생충 약
   - 상태 표시: ✅ 완료 / ⏰ 오늘 / ⚠️ 지연

2. **다음 예방접종 D-Day**
   - 다음 접종 항목명
   - D-Day 표시 (예: "D-7", "오늘", "지연 3일")
   - 색상 코딩: 초록색(7일 이상), 주황색(3-6일), 빨간색(2일 이내/지연)

3. **최근 체중 변화 추이 (미니 차트)**
   - 최근 7일 또는 30일 체중 변화 라인 차트
   - Recharts 라이브러리 활용
   - 증감 표시 (예: "+0.3kg", "-0.5kg")

4. **오늘의 건강 점수 (100점 만점)**
   - 계산 기준:
     - 백신 완료율: 30점
     - 투약 완료율: 25점
     - 체중 관리: 20점
     - 건강 검진 최신성: 15점
     - 기록 완성도: 10점
   - 점수에 따른 색상: 80점 이상(초록), 60-79점(주황), 60점 미만(빨강)

**데이터 소스:**
- `user_vaccination_records` 테이블: 다음 접종일 계산
- `weight_logs` 테이블: 체중 변화 추이
- `user_health_checkup_records` 테이블: 최근 검진일
- 투약 기록 (새로운 테이블 또는 `pet_metadata` JSONB 필드 활용)

#### B. 건강 알림 카드

**예측성 알림 예시:**

1. **데이터 기반 알림**
   - "최근 3일간 음수량이 20% 감소했습니다. 신장 질환의 신호일 수 있으니 주의 깊게 관찰하세요."
   - "체중이 지난달 대비 5% 증가했습니다. 비만 예방을 위해 운동량을 늘려보세요."
   - "다음 예방접종까지 7일 남았습니다. 미리 병원 예약을 잡아보세요."

2. **생애주기 전환 알림**
   - "이제 초코가 7살이 되어 노령기에 접어들었습니다. 건강검진 항목을 조정하고 저단백 식단을 고려해보세요."
   - "퍼피기를 마치고 성견기가 되었습니다. 이제 매년 1회 추가 접종으로 전환됩니다."

**알림 로직:**
- 일일 배치 작업으로 데이터 분석
- 이상 징후 감지 시 즉시 알림
- 생애주기 전환은 생일 기준 자동 계산

---

## 2. 훈련 가이드 상세 설계

훈련 가이드는 새로운 탭으로 추가하여 생애주기별 필수 훈련을 체계적으로 관리할 수 있도록 합니다.

### 생애주기별 필수 훈련 체크리스트

#### 퍼피/키튼기 (0~6개월)

**사회화 (Socialization)**
- [ ] 다양한 소리 경험 (청소기, 전화벨, 자동차 소리 등)
- [ ] 다양한 환경 경험 (공원, 카페, 다른 집 등)
- [ ] 다양한 사람과의 접촉 (어린이, 노인, 남녀 등)
- [ ] 다른 반려동물과의 접촉 (안전한 환경에서)
- **목표:** 3~14주령 사이에 완료

**예절 교육**
- [ ] 배변 훈련 (배변 패드 또는 외출 배변)
- [ ] '앉아' 명령어
- [ ] '기다려' 명령어
- [ ] 입질 방지 교육 (장난감 사용, 금지 명령)
- [ ] 이름 부르기 반응

**기본 관리**
- [ ] 목욕 적응
- [ ] 브러싱 적응
- [ ] 발톱 깎기 적응
- [ ] 양치질 습관화

#### 성견/성묘기 (1~7세)

**산책 및 외출 매너**
- [ ] 리드줄 적응 (2m 이내 유지)
- [ ] 다른 개와의 인사 매너
- [ ] 사람에게 짖지 않기
- [ ] 쓰레기나 음식 줍기 방지

**분리불안 방지**
- [ ] 혼자 두기 훈련 (점진적 시간 증가)
- [ ] 장난감으로 독립 놀이 유도
- [ ] 과도한 애착 방지

**에너지 소모 활동**
- [ ] 노즈워크 (냄새 찾기 놀이)
- [ ] 지능 장난감 활용
- [ ] 산책 및 운동 루틴

#### 노령기 (7세 이상)

**두뇌 자극 놀이**
- [ ] 퍼즐 장난감
- [ ] 간단한 명령어 복습
- [ ] 새로운 장난감 도입

**치매 예방**
- [ ] 기존 명령어 복습
- [ ] 일상 루틴 유지
- [ ] 환경 변화 최소화

### 훈련 진행도 시각화

**진행도 표시:**
- 전체 훈련 항목 수 vs 완료 항목 수
- 생애주기별 진행률 (퍼피: 60%, 성견: 30%, 노령: 10%)
- 원형 차트 또는 진행 바로 시각화

**단계별 상세 가이드:**
- 각 훈련 항목 클릭 시 상세 가이드 표시
- 텍스트 설명 + 이미지/동영상 링크
- 예상 소요 시간 및 난이도 표시

### 문제 행동 자가 진단

**체크리스트 항목:**

1. **입질 문제**
   - [ ] 사람 손이나 발을 물려고 함
   - [ ] 장난감이 아닌 가구나 옷을 물어뜯음
   - [ ] 과도한 입질로 상처가 남음

2. **분리불안**
   - [ ] 혼자 두면 과도하게 짖음
   - [ ] 집에 혼자 두면 집 안을 망가뜨림
   - [ ] 보호자가 떠나면 불안해함

3. **과도한 짖음**
   - [ ] 문고리 소리만 나도 짖음
   - [ ] 다른 개를 보면 과도하게 짖음
   - [ ] 밤에 자꾸 짖어서 이웃 민원 발생

4. **배변 문제**
   - [ ] 배변 훈련이 안 됨
   - [ ] 스트레스 받으면 실내 배변
   - [ ] 특정 장소에만 배변

**맞춤형 훈련법 제시:**
- 문제 행동 선택 시 해당 행동의 원인 설명
- 단계별 해결 방법 제시
- 전문가 연결 옵션 제공

**데이터 구조:**
```typescript
interface PetTrainingRecord {
  id: string;
  pet_id: string;
  training_item: string; // 훈련 항목명
  lifecycle_stage: 'puppy' | 'adult' | 'senior';
  status: 'not_started' | 'in_progress' | 'completed';
  completed_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface ProblemBehavior {
  id: string;
  pet_id: string;
  behavior_type: 'biting' | 'separation_anxiety' | 'excessive_barking' | 'potty_issues';
  severity: 'mild' | 'moderate' | 'severe';
  first_noticed_date: string;
  frequency: 'daily' | 'weekly' | 'occasional';
  notes?: string;
  created_at: string;
}
```

---

## 3. 법규 및 안전 가이드 상세 설계

법규 및 안전 가이드는 새로운 탭으로 추가하거나 사이드바/하단 고정 배너로 제공하여 사용자가 법적 의무를 쉽게 확인할 수 있도록 합니다.

### 동물등록제 체크리스트

**등록 완료 여부 표시:**
- ✅ 등록 완료 / ⚠️ 미등록 / ❓ 확인 필요
- 등록 번호 입력 필드 (선택)
- 등록일 입력 필드 (선택)

**등록 방법 안내:**
1. **외장형 칩 (마이크로칩)**
   - 수의사에게 시술 받기
   - 15자리 등록번호 발급
   - 관할 지자체에 등록 신청

2. **내장형 칩 (RFID 칩)**
   - 수의사에게 시술 받기
   - 칩 번호 확인 후 등록

**관할 지자체 연결:**
- 사용자 위치 기반 관할 지자체 자동 감지
- 해당 지자체 동물등록 신청 페이지 링크
- 전화 상담 번호 제공

### 맹견 사육 허가제 안내

**맹견 종류 확인:**
- 도사견 (Tosa)
- 아메리칸 핏불 테리어 (American Pit Bull Terrier)
- 아메리칸 스태퍼드셔 테리어 (American Staffordshire Terrier)
- 스태퍼드셔 불 테리어 (Staffordshire Bull Terrier)
- 로트와일러 (Rottweiler)

**품종 선택 시 자동 안내:**
- 위 5종 중 하나 선택 시 즉시 허가제 안내 표시
- 허가제 신청 방법 안내
- 책임보험 가입 필수 안내

**허가제 신청 방법:**
1. 관할 지자체에 신청서 제출
2. 책임보험 가입 증명서 첨부
3. 사육 시설 기준 충족 확인
4. 허가증 발급

**사용자 입력:**
- 허가증 보유 여부 (예/아니오)
- 허가증 번호 (선택)
- 보험 가입 여부 (예/아니오)

### 산책 시 준수사항

**체크리스트:**
- [ ] 인식표 착용 (이름, 전화번호 포함)
- [ ] 리드줄 착용 (2m 이내)
- [ ] 배변봉투 지참
- [ ] 공원 등 지정 장소에서만 풀어주기
- [ ] 다른 사람이나 동물에게 피해 주지 않기

**과태료 방지 정보:**
- 리드줄 미착용: 10만원 이하 과태료
- 배변 처리 안 함: 10만원 이하 과태료
- 맹견 허가 없이 사육: 100만원 이하 과태료

**데이터 구조:**
```typescript
interface PetLegalCompliance {
  id: string;
  pet_id: string;
  registration_status: 'registered' | 'not_registered' | 'unknown';
  registration_number?: string;
  registration_date?: string;
  is_dangerous_breed: boolean;
  permit_status?: 'permitted' | 'not_permitted' | 'not_applicable';
  permit_number?: string;
  insurance_status: 'insured' | 'not_insured' | 'unknown';
  insurance_company?: string;
  created_at: string;
  updated_at: string;
}
```

---

## 4. 응급 네트워크 상세 설계

응급 네트워크는 상단 고정 배너 또는 빠른 액세스 버튼으로 제공하여 언제든지 쉽게 접근할 수 있도록 합니다.

### AI 증상 체크 플로우

**증상 선택 화면:**
- 구토
- 설사
- 기침
- 발열
- 식욕 부진
- 무기력
- 호흡 곤란
- 경련
- 출혈
- 배뇨 이상
- 기타 (직접 입력)

**심각도 판별 로직:**

1. **응급 (빨간색) - 즉시 병원 방문 필요**
   - 호흡 곤란
   - 경련
   - 대량 출혈
   - 의식 불명
   - 중독 의심

2. **주의 (주황색) - 24시간 이내 병원 방문 권장**
   - 지속적인 구토 (24시간 이상)
   - 심한 설사 (혈변 포함)
   - 발열 (40도 이상)
   - 배뇨 불가

3. **관찰 (초록색) - 가정에서 관찰 후 필요시 병원 방문**
   - 가벼운 구토 (1-2회)
   - 가벼운 설사
   - 식욕 부진 (1일 이내)
   - 가벼운 기침

**AAHA/PetMD 기반 권장 조치:**

각 증상별로 다음 정보 제공:
- 원인 가능성
- 즉시 조치 사항
- 병원 방문 시기
- 주의사항

**데이터 구조:**
```typescript
interface SymptomCheckResult {
  symptoms: string[];
  severity: 'emergency' | 'urgent' | 'monitor';
  recommended_action: string;
  hospital_visit_required: boolean;
  immediate_care: string[];
  warning_signs: string[];
  aaha_reference?: string;
  petmd_reference?: string;
}
```

### 주변 24시 병원 찾기

**GPS 기반 병원 검색:**
- 네이버 로컬 검색 API 활용 (`lib/naver/` 기존 코드 참고)
- 검색 키워드: "24시 동물병원", "응급 동물병원"
- 현재 위치 기반 반경 10km 내 검색

**병원 정보 표시:**
- 병원명
- 거리 (km)
- 주소
- 전화번호
- 운영 시간 (24시간 여부)
- 별점 (있는 경우)

**기능:**
- 거리순 정렬
- 바로 전화 연결 버튼 (`tel:` 링크)
- 네이버 지도 연동 (길찾기)
- 즐겨찾기 추가

**UI 구성:**
```
┌─────────────────────────────────────┐
│  🔴 응급 상황이신가요?                │
│  [AI 증상 체크] [24시 병원 찾기]     │
└─────────────────────────────────────┘
```

---

## 5. 데이터 시각화 가이드

데이터 시각화는 Recharts 라이브러리를 활용하여 각 탭 내부에 차트를 배치합니다.

### 차트 타입별 사용 사례

#### 1. 라인 차트 (Line Chart)
**사용 위치:** 체중 관리 탭, 건강 대시보드
**표시 데이터:**
- 체중 변화 추이 (일별, 주별, 월별)
- 건강 점수 추이
- 투약 완료율 추이

**구현 예시:**
```typescript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

<ResponsiveContainer width="100%" height={300}>
  <LineChart data={weightData}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="date" />
    <YAxis />
    <Tooltip />
    <Line type="monotone" dataKey="weight" stroke="#f97316" strokeWidth={2} />
  </LineChart>
</ResponsiveContainer>
```

#### 2. 타임라인 뷰 (Timeline)
**사용 위치:** 백신 관리 탭, 건강 검진 탭
**표시 데이터:**
- 예방접종 일정 및 완료 여부
- 건강 검진 이력
- 생애주기 이벤트

**구현 방법:**
- 커스텀 컴포넌트로 구현 (Recharts의 Timeline은 없음)
- 수직 타임라인 형태로 날짜별 이벤트 표시

#### 3. 원형 차트 (Pie Chart)
**사용 위치:** 훈련 가이드 탭
**표시 데이터:**
- 훈련 진행률 (완료/진행중/미시작)
- 생애주기별 훈련 분포

#### 4. 막대 차트 (Bar Chart)
**사용 위치:** 건강 대시보드
**표시 데이터:**
- 최근 7일 건강 점수
- 월별 투약 완료 횟수

### 데이터 집계 방법

**체중 데이터 집계:**
```typescript
// 일별 평균 체중 계산
const dailyWeight = weightLogs.reduce((acc, log) => {
  const date = log.date.split('T')[0];
  if (!acc[date]) {
    acc[date] = { date, weights: [] };
  }
  acc[date].weights.push(log.weight_kg);
  return acc;
}, {});

const aggregatedData = Object.values(dailyWeight).map(item => ({
  date: item.date,
  weight: item.weights.reduce((a, b) => a + b, 0) / item.weights.length
}));
```

**건강 점수 계산:**
```typescript
function calculateHealthScore(pet: PetProfile, records: {
  vaccinations: VaccinationRecord[],
  medications: MedicationRecord[],
  weightLogs: WeightRecord[],
  checkups: CheckupRecord[]
}): number {
  let score = 0;
  
  // 백신 완료율 (30점)
  const nextVaccine = getNextVaccineDate(pet, records.vaccinations);
  const daysUntilVaccine = getDaysUntil(nextVaccine);
  if (daysUntilVaccine > 30) score += 30;
  else if (daysUntilVaccine > 7) score += 20;
  else if (daysUntilVaccine >= 0) score += 10;
  
  // 투약 완료율 (25점)
  const lastMedication = getLastMedicationDate(records.medications);
  const daysSinceMedication = getDaysSince(lastMedication);
  if (daysSinceMedication <= 30) score += 25;
  else if (daysSinceMedication <= 60) score += 15;
  else score += 5;
  
  // 체중 관리 (20점)
  const weightTrend = calculateWeightTrend(records.weightLogs);
  if (weightTrend.isHealthy) score += 20;
  else if (weightTrend.isWarning) score += 10;
  
  // 건강 검진 최신성 (15점)
  const lastCheckup = getLastCheckupDate(records.checkups);
  const monthsSinceCheckup = getMonthsSince(lastCheckup);
  if (monthsSinceCheckup <= 12) score += 15;
  else if (monthsSinceCheckup <= 24) score += 8;
  
  // 기록 완성도 (10점)
  const completeness = calculateRecordCompleteness(records);
  score += completeness * 10;
  
  return Math.min(100, Math.max(0, score));
}
```

### 실시간 업데이트 전략

1. **클라이언트 사이드 캐싱**
   - React Query 또는 SWR 사용
   - 5분마다 자동 리프레시
   - 수동 새로고침 버튼 제공

2. **서버 사이드 배치 작업**
   - 건강 점수 계산: 매일 자정 실행
   - 알림 생성: 매일 오전 9시 실행
   - 데이터 집계: 매주 일요일 실행

---

## 6. Next.js 구현 예시 코드

### 건강 대시보드 컴포넌트 예시

```typescript
// components/health/pets/pet-detail-dashboard.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PetProfile } from '@/types/pet';
import { calculateHealthScore } from '@/lib/health/pet-health-calculator';
import { PetWeightChart } from './pet-weight-chart';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Pill, Syringe, TrendingUp, AlertTriangle } from 'lucide-react';

interface PetDetailDashboardProps {
  pet: PetProfile;
  vaccinations: any[];
  medications: any[];
  weightLogs: any[];
  checkups: any[];
}

export function PetDetailDashboard({
  pet,
  vaccinations,
  medications,
  weightLogs,
  checkups
}: PetDetailDashboardProps) {
  const [healthScore, setHealthScore] = useState(0);
  const [alerts, setAlerts] = useState<string[]>([]);

  useEffect(() => {
    const score = calculateHealthScore(pet, {
      vaccinations,
      medications,
      weightLogs,
      checkups
    });
    setHealthScore(score);
    
    // 알림 생성
    const newAlerts = generateHealthAlerts(pet, {
      vaccinations,
      medications,
      weightLogs
    });
    setAlerts(newAlerts);
  }, [pet, vaccinations, medications, weightLogs, checkups]);

  const nextVaccine = getNextVaccine(vaccinations);
  const nextMedication = getNextMedication(medications);
  const recentWeight = weightLogs[weightLogs.length - 1];

  return (
    <div className="space-y-4">
      {/* 건강 점수 카드 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            오늘의 건강 점수
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold" style={{
              color: healthScore >= 80 ? '#10b981' : healthScore >= 60 ? '#f97316' : '#ef4444'
            }}>
              {healthScore}
            </div>
            <div className="text-sm text-muted-foreground">
              <Badge variant={healthScore >= 80 ? 'default' : healthScore >= 60 ? 'secondary' : 'destructive'}>
                {healthScore >= 80 ? '양호' : healthScore >= 60 ? '주의' : '개선 필요'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 오늘의 할 일 카드 */}
      <Card>
        <CardHeader>
          <CardTitle>오늘의 할 일</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* 투약 알림 */}
          {nextMedication && (
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Pill className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="font-medium">{nextMedication.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {getDaysUntil(nextMedication.date) === 0 
                      ? '오늘 복용' 
                      : `D-${getDaysUntil(nextMedication.date)}`}
                  </p>
                </div>
              </div>
              <Badge variant={getDaysUntil(nextMedication.date) === 0 ? 'default' : 'secondary'}>
                {getDaysUntil(nextMedication.date) === 0 ? '완료' : '예정'}
              </Badge>
            </div>
          )}

          {/* 백신 알림 */}
          {nextVaccine && (
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Syringe className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="font-medium">{nextVaccine.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {getDaysUntil(nextVaccine.date) === 0 
                      ? '오늘 접종' 
                      : `D-${getDaysUntil(nextVaccine.date)}`}
                  </p>
                </div>
              </div>
              <Badge variant={getDaysUntil(nextVaccine.date) <= 7 ? 'destructive' : 'secondary'}>
                {getDaysUntil(nextVaccine.date) === 0 ? '오늘' : `${getDaysUntil(nextVaccine.date)}일 후`}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 체중 변화 추이 */}
      {weightLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>체중 변화 추이</CardTitle>
            <CardDescription>최근 30일</CardDescription>
          </CardHeader>
          <CardContent>
            <PetWeightChart weightLogs={weightLogs.slice(-30)} />
          </CardContent>
        </Card>
      )}

      {/* 건강 알림 */}
      {alerts.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {alerts.map((alert, index) => (
                <li key={index}>{alert}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

function getNextVaccine(vaccinations: any[]) {
  // 다음 접종일 계산 로직
  return vaccinations
    .filter(v => !v.completed_date)
    .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime())[0];
}

function getNextMedication(medications: any[]) {
  // 다음 투약일 계산 로직 (마지막 투약일 + 30일)
  return medications
    .sort((a, b) => new Date(b.last_date).getTime() - new Date(a.last_date).getTime())[0];
}

function getDaysUntil(date: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function generateHealthAlerts(pet: PetProfile, records: any): string[] {
  const alerts: string[] = [];
  
  // 체중 변화 알림
  if (records.weightLogs.length >= 3) {
    const recent = records.weightLogs.slice(-3);
    const trend = (recent[recent.length - 1].weight_kg - recent[0].weight_kg) / recent[0].weight_kg;
    if (Math.abs(trend) > 0.05) {
      alerts.push(`최근 체중이 ${trend > 0 ? '증가' : '감소'}했습니다. 주의 깊게 관찰하세요.`);
    }
  }
  
  // 생애주기 전환 알림
  const lifecycleInfo = calculatePetLifecycle(pet.pet_type, pet.birth_date);
  if (lifecycleInfo.stage === 'senior' && !pet.lifecycle_stage) {
    alerts.push(`${pet.name}가 노령기에 접어들었습니다. 건강검진 항목을 조정하세요.`);
  }
  
  return alerts;
}
```

### 훈련 가이드 탭 예시

```typescript
// components/health/pets/pet-training-tab.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { PetProfile } from '@/types/pet';
import { getTrainingGuideByLifecycle } from '@/lib/health/pet-training-guide';
import { Badge } from '@/components/ui/badge';
import { BookOpen, CheckCircle2, Circle } from 'lucide-react';

interface PetTrainingTabProps {
  pet: PetProfile;
  trainingRecords: any[];
}

export function PetTrainingTab({ pet, trainingRecords }: PetTrainingTabProps) {
  const lifecycleInfo = calculatePetLifecycle(pet.pet_type, pet.birth_date);
  const trainingGuide = getTrainingGuideByLifecycle(lifecycleInfo.stage, pet.pet_type);
  
  const completedItems = trainingRecords
    .filter(r => r.status === 'completed')
    .map(r => r.training_item);
  
  const progress = (completedItems.length / trainingGuide.items.length) * 100;

  return (
    <div className="space-y-6">
      {/* 진행도 카드 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            훈련 진행도
          </CardTitle>
          <CardDescription>
            {lifecycleInfo.stageLabel} 단계 필수 훈련
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>완료: {completedItems.length} / {trainingGuide.items.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
          </div>
        </CardContent>
      </Card>

      {/* 훈련 체크리스트 */}
      <Card>
        <CardHeader>
          <CardTitle>필수 훈련 체크리스트</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {trainingGuide.categories.map((category) => (
              <div key={category.name} className="space-y-2">
                <h3 className="font-semibold">{category.name}</h3>
                <div className="space-y-2 pl-4">
                  {category.items.map((item) => {
                    const isCompleted = completedItems.includes(item.name);
                    return (
                      <div key={item.name} className="flex items-center gap-2">
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-300" />
                        )}
                        <label className="flex-1 cursor-pointer">
                          {item.name}
                        </label>
                        <Badge variant="outline" className="text-xs">
                          {item.difficulty}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 법규 안내 탭 예시

```typescript
// components/health/pets/pet-legal-guide-tab.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PetProfile } from '@/types/pet';
import { getLegalGuide } from '@/lib/health/pet-legal-guide';
import { Shield, AlertTriangle, ExternalLink } from 'lucide-react';

interface PetLegalGuideTabProps {
  pet: PetProfile;
  compliance: any;
}

export function PetLegalGuideTab({ pet, compliance }: PetLegalGuideTabProps) {
  const legalGuide = getLegalGuide(pet.pet_type);
  const isDangerousBreed = legalGuide.dangerousBreeds.includes(pet.breed || '');

  return (
    <div className="space-y-6">
      {/* 동물등록제 */}
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
          <div className="flex items-center justify-between">
            <span>등록 상태</span>
            <Badge variant={compliance.registration_status === 'registered' ? 'default' : 'destructive'}>
              {compliance.registration_status === 'registered' ? '등록 완료' : '미등록'}
            </Badge>
          </div>
          
          {pet.pet_type === 'dog' && (
            <div className="space-y-2">
              <h4 className="font-medium">등록 방법</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>수의사에게 마이크로칩 시술 받기</li>
                <li>관할 지자체에 등록 신청</li>
                <li>등록증 발급</li>
              </ul>
              <Button variant="outline" size="sm" className="mt-2">
                관할 지자체 찾기
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 맹견 사육 허가제 */}
      {isDangerousBreed && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              맹견 사육 허가제
            </CardTitle>
            <CardDescription>
              {pet.breed}는 맹견으로 분류되어 허가제가 필요합니다
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>허가증 보유</span>
              <Badge variant={compliance.permit_status === 'permitted' ? 'default' : 'destructive'}>
                {compliance.permit_status === 'permitted' ? '보유' : '미보유'}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">필수 사항</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>관할 지자체에 허가 신청</li>
                <li>책임보험 가입 (필수)</li>
                <li>사육 시설 기준 충족</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 산책 시 준수사항 */}
      <Card>
        <CardHeader>
          <CardTitle>산책 시 준수사항</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              '인식표 착용 (이름, 전화번호 포함)',
              '리드줄 착용 (2m 이내)',
              '배변봉투 지참',
              '공원 등 지정 장소에서만 풀어주기',
              '다른 사람이나 동물에게 피해 주지 않기'
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <Checkbox id={`check-${index}`} />
                <label htmlFor={`check-${index}`} className="text-sm cursor-pointer">
                  {item}
                </label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 응급 네트워크 배너 예시

```typescript
// components/health/pets/pet-emergency-banner.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PetSymptomChecker } from './pet-symptom-checker';
import { PetHospitalFinder } from './pet-hospital-finder';
import { AlertCircle, Phone, MapPin } from 'lucide-react';

export function PetEmergencyBanner() {
  const [isSymptomCheckerOpen, setIsSymptomCheckerOpen] = useState(false);
  const [isHospitalFinderOpen, setIsHospitalFinderOpen] = useState(false);

  return (
    <>
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-500" />
              <div>
                <h3 className="font-semibold text-red-900">응급 상황이신가요?</h3>
                <p className="text-sm text-red-700">증상 체크 또는 24시 병원 찾기</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSymptomCheckerOpen(true)}
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                증상 체크
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => setIsHospitalFinderOpen(true)}
                className="bg-red-600 hover:bg-red-700"
              >
                <MapPin className="w-4 h-4 mr-2" />
                24시 병원
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 증상 체크 다이얼로그 */}
      <Dialog open={isSymptomCheckerOpen} onOpenChange={setIsSymptomCheckerOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>AI 증상 체크</DialogTitle>
          </DialogHeader>
          <PetSymptomChecker />
        </DialogContent>
      </Dialog>

      {/* 병원 찾기 다이얼로그 */}
      <Dialog open={isHospitalFinderOpen} onOpenChange={setIsHospitalFinderOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>주변 24시 동물병원 찾기</DialogTitle>
          </DialogHeader>
          <PetHospitalFinder />
        </DialogContent>
      </Dialog>
    </>
  );
}
```

---

## 참고 자료 및 출처

### 수의학 가이드라인
- **AAHA (American Animal Hospital Association)**: 미국 동물병원 협회의 표준 진료 가이드
- **WSAVA (World Small Animal Veterinary Association)**: 세계 소동물 수의사회의 영양 및 백신 가이드라인
- **PetMD**: 일반 보호자용 수의학 백과사전

### 참고 앱 사례
- **TTcare**: AI 기반 건강 상태 확인 (90% 이상 정확도)
- **MyPetApp**: 건강 정보 기록 및 관리
- **'젤리야 뭐해'**: 실시간 정보 공유 및 기록

### 기술 스택
- **프레임워크**: Next.js 15 (React 19)
- **UI 라이브러리**: shadcn/ui (Radix UI 기반)
- **차트 라이브러리**: Recharts v3.5.1
- **데이터베이스**: Supabase (PostgreSQL)
- **스타일링**: Tailwind CSS v4

---

이제 반려동물 상세페이지가 더욱 구체적이고 실용적으로 개선되었습니다. 각 섹션은 사용자가 반려동물의 건강을 체계적으로 관리할 수 있도록 설계되었으며, 데이터 기반의 예측 서비스를 통해 초보 반려인도 쉽게 활용할 수 있습니다.