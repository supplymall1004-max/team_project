/**
 * @file components/games/codebreaker-game-info.tsx
 * @description 코드 브레이커 게임 정보 섹션
 * 
 * 게임 방법, 소개, 게임의 이점 등을 표시하는 컴포넌트입니다.
 */

"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, Lightbulb, Brain, Target, Zap, 
  TrendingUp, Users, Award, ChevronDown, ChevronUp
} from 'lucide-react';

export function CodebreakerGameInfo() {
  const [expandedSection, setExpandedSection] = useState<string | null>('how-to-play');

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const sections = [
    {
      id: 'how-to-play',
      title: '게임 방법',
      icon: BookOpen,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-lg mb-2">1. 목표</h4>
            <p className="text-gray-700">
              주어진 힌트를 조합하여 비밀번호를 찾아내세요! 각 레벨마다 다른 자릿수의 비밀번호가 주어집니다.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-lg mb-2">2. 힌트 활용</h4>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li><strong>합계 힌트:</strong> 모든 숫자의 합을 알려줍니다.</li>
              <li><strong>홀짝 힌트:</strong> 짝수의 개수를 알려줍니다.</li>
              <li><strong>비교 힌트:</strong> 숫자 간의 크기 관계를 알려줍니다.</li>
              <li><strong>위치 힌트:</strong> 특정 자리의 숫자를 알려줍니다.</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-lg mb-2">3. 숫자 야구 피드백</h4>
            <p className="text-gray-700 mb-2">
              틀렸을 때 숫자 야구 방식의 피드백을 받을 수 있습니다:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li><strong>Strike (S):</strong> 숫자와 위치가 모두 맞습니다.</li>
              <li><strong>Ball (B):</strong> 숫자는 맞지만 위치가 틀렸습니다.</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-lg mb-2">4. 레벨 시스템</h4>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li><strong>Level 1:</strong> 3자리 숫자, 10회 시도, 2분 제한</li>
              <li><strong>Level 2:</strong> 4자리 숫자, 10회 시도, 3분 제한</li>
              <li><strong>Level 3:</strong> 5자리 숫자, 7회 시도, 4분 제한</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'introduction',
      title: '게임 소개',
      icon: Lightbulb,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-lg mb-2">비밀번호 탈출 작전</h4>
            <p className="text-gray-700">
              코드 브레이커는 논리적 추론과 수리 능력을 기르는 교육용 퍼즐 게임입니다. 
              매번 새로운 비밀번호와 힌트가 생성되어 무한히 즐길 수 있습니다.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-lg mb-2">게임의 특징</h4>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>단계별 난이도 조절로 초보자부터 고수까지 즐길 수 있습니다.</li>
              <li>힌트를 조합하여 논리적으로 추론하는 능력을 기릅니다.</li>
              <li>숫자 야구 피드백으로 전략적 사고를 자극합니다.</li>
              <li>시간 제한으로 집중력과 처리 속도를 향상시킵니다.</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-lg mb-2">등급 시스템</h4>
            <p className="text-gray-700">
              점수에 따라 등급이 부여됩니다: 브론즈 → 실버 → 골드 → 플래티넘 → 다이아몬드 → 아인슈타인
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'benefits',
      title: '게임의 이점',
      icon: Brain,
      content: (
        <div className="space-y-6">
          <div className="bg-purple-50 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Zap className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-lg mb-2 text-purple-900">유동성 지능 발달</h4>
                <p className="text-gray-700">
                  이전에 배운 적 없는 새로운 문제를 해결하는 능력이 향상됩니다. 
                  매번 바뀌는 암호와 힌트를 분석하면서 논리적 추론만으로 정답을 찾아내는 사고의 유연성이 길러집니다.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Target className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-lg mb-2 text-blue-900">작업 기억력 확장</h4>
                <p className="text-gray-700">
                  정보를 뇌에 잠시 머물게 하면서 동시에 그것을 조작하는 능력이 향상됩니다. 
                  여러 힌트를 동시에 기억하고 조합하여 정답을 찾는 과정에서 작업 기억력이 확장됩니다.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-lg mb-2 text-green-900">메타인지 및 전략적 사고</h4>
                <p className="text-gray-700">
                  자신이 무엇을 알고 무엇을 모르는지 파악하는 능력이 향상됩니다. 
                  숫자 야구 피드백을 통해 가설을 검증하고 전략을 수정하는 과정에서 메타인지 능력이 발달합니다.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-pink-50 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Award className="w-6 h-6 text-pink-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-lg mb-2 text-pink-900">스트레스 하에서의 의사결정 능력</h4>
                <p className="text-gray-700">
                  시간 제한 속에서도 논리적 계산을 포기하지 않고 끝까지 수행하는 능력이 향상됩니다. 
                  긴장되는 상황에서도 냉철함을 유지할 수 있는 회복 탄력성이 형성됩니다.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Users className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-lg mb-2 text-yellow-900">실생활 적용</h4>
                <p className="text-gray-700">
                  이러한 훈련은 일상생활에서도 도움이 됩니다:
                </p>
                <ul className="list-disc list-inside space-y-1 text-gray-700 mt-2">
                  <li>갑작스러운 업무상의 문제 해결</li>
                  <li>여러 업무를 동시에 처리하는 능력</li>
                  <li>자신의 실수 패턴을 빠르게 파악하고 수정</li>
                  <li>마감 기한이 임박한 상황에서의 냉철함</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-6 mt-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {sections.map((section) => {
          const Icon = section.icon;
          const isExpanded = expandedSection === section.id;

          return (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden"
            >
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg">
                    <Icon className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800">{section.title}</h3>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 pt-2 border-t border-gray-100">
                      {section.content}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </motion.div>

      {/* 추가 정보 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-lg p-6 text-center"
      >
        <Brain className="w-12 h-12 text-purple-600 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-800 mb-2">뇌 훈련의 효과</h3>
        <p className="text-gray-700 mb-4">
          매일 10분씩만 이 게임을 하면 뇌는 더 젊고 예리해집니다.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white rounded-xl p-4">
            <div className="text-2xl font-bold text-purple-600 mb-1">정보 처리</div>
            <div className="text-sm text-gray-600">논리적 연결고리 파악</div>
          </div>
          <div className="bg-white rounded-xl p-4">
            <div className="text-2xl font-bold text-blue-600 mb-1">집중력</div>
            <div className="text-sm text-gray-600">고도의 몰입 유지</div>
          </div>
          <div className="bg-white rounded-xl p-4">
            <div className="text-2xl font-bold text-green-600 mb-1">수리 감각</div>
            <div className="text-sm text-gray-600">직관적 이해</div>
          </div>
          <div className="bg-white rounded-xl p-4">
            <div className="text-2xl font-bold text-pink-600 mb-1">전략적 사고</div>
            <div className="text-sm text-gray-600">효율적 문제 해결</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

