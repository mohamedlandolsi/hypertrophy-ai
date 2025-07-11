'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Crown, MessageSquare, TrendingUp, Zap } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function CheckoutSuccessPage() {
  const [userEmail, setUserEmail] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUserInfo = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user?.email) {
        setUserEmail(user.email);
      }
      setLoading(false);
    };

    getUserInfo();
  }, []);

  const proFeatures = [
    {
      icon: MessageSquare,
      title: 'Unlimited Messages',
      description: 'Chat with your AI coach without daily limits'
    },
    {
      icon: TrendingUp,
      title: 'Progress Tracking',
      description: 'Advanced analytics and workout history'
    },
    {
      icon: Zap,
      title: 'Priority Support',
      description: 'Get faster responses and premium assistance'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl border-0">
        <CardHeader className="text-center bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-t-lg py-12">
          <div className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-10 w-10 text-white" />
          </div>
          <CardTitle className="text-3xl md:text-4xl font-bold mb-2">
            Welcome to HypertroQ Pro! 🎉
          </CardTitle>
          <CardDescription className="text-green-100 text-lg">
            Your subscription is now active and ready to use
          </CardDescription>
        </CardHeader>

        <CardContent className="p-8 space-y-8">
          {/* Success Message */}
          <div className="text-center space-y-4">
            <Badge className="bg-green-100 text-green-800 text-base px-4 py-2">
              <Crown className="mr-2 h-4 w-4" />
              Pro Member
            </Badge>
            
            {!loading && userEmail && (
              <p className="text-gray-600">
                A confirmation email has been sent to <strong>{userEmail}</strong>
              </p>
            )}
          </div>

          {/* Pro Features */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-center text-gray-900">
              You now have access to:
            </h3>
            
            <div className="grid gap-4">
              {proFeatures.map((feature, index) => (
                <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <feature.icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{feature.title}</h4>
                    <p className="text-gray-600 text-sm">{feature.description}</p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
                </div>
              ))}
            </div>
          </div>

          {/* Next Steps */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">What&apos;s Next?</h3>
            <div className="space-y-3 text-gray-600">
              <p className="flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">1</span>
                Start unlimited conversations with your AI fitness coach
              </p>
              <p className="flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">2</span>
                Set up your personalized fitness goals and preferences
              </p>
              <p className="flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">3</span>
                Track your progress with advanced analytics
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/chat" className="flex-1">
              <Button className="w-full bg-blue-600 hover:bg-blue-700" size="lg">
                <MessageSquare className="mr-2 h-4 w-4" />
                Start Chatting Now
              </Button>
            </Link>
            <Link href="/profile" className="flex-1">
              <Button variant="outline" className="w-full" size="lg">
                Manage Account
              </Button>
            </Link>
          </div>

          {/* Support */}
          <div className="text-center pt-4 border-t">
            <p className="text-sm text-gray-500 mb-2">
              Need help getting started?
            </p>
            <Link href="/chat">
              <Button variant="link" className="text-blue-600 hover:text-blue-700 p-0">
                Ask your AI coach anything →
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
