import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { SubscriptionManager } from '@/components/subscription/subscription-manager';

export const metadata: Metadata = {
  title: '구독 관리 | 맛의 아카이브',
  description: '프리미엄 구독을 관리하고 결제 내역을 확인하세요.',
};

export default async function SubscriptionPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in?redirect_url=/account/subscription');
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">구독 관리</h1>
        <SubscriptionManager />
      </div>
    </div>
  );
}




















