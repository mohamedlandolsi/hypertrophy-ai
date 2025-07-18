/**
 * Example: Enhanced Chat Component with next-intl + Arabic Support
 * This shows how your existing Arabic detection works with internationalization
 */

'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { InternationalInput } from '@/components/international-input';
import { isArabicText, getTextFormatting } from '@/lib/text-formatting';
import { Button } from '@/components/ui/button';

export default function EnhancedChatExample() {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{content: string, sender: 'user' | 'ai'}>>([]);
  
  const t = useTranslations('Chat');
  const locale = useLocale();

  const handleSend = () => {
    if (!message.trim()) return;
    
    // Add user message
    setChatHistory(prev => [...prev, { content: message, sender: 'user' }]);
    
    // Simulate AI response
    setTimeout(() => {
      const aiResponse = locale === 'ar' 
        ? 'مرحباً! كيف يمكنني مساعدتك في رحلتك الرياضية؟'
        : locale === 'fr' 
        ? 'Salut! Comment puis-je vous aider dans votre parcours fitness?'
        : 'Hello! How can I help you with your fitness journey?';
        
      setChatHistory(prev => [...prev, { content: aiResponse, sender: 'ai' }]);
    }, 1000);
    
    setMessage('');
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">
        {t('title', { default: 'Chat with HypertroQ' })}
      </h1>

      {/* Chat Messages */}
      <div className="space-y-3 min-h-[300px] border rounded-lg p-4">
        {chatHistory.map((msg, index) => {
          const formatting = getTextFormatting(msg.content);
          
          return (
            <div 
              key={index}
              className={`p-3 rounded-lg max-w-[80%] ${formatting.className} ${
                msg.sender === 'user' 
                  ? 'bg-blue-500 text-white ml-auto' 
                  : 'bg-gray-100 dark:bg-gray-800 mr-auto'
              }`}
              dir={formatting.dir}
              lang={formatting.lang}
              style={formatting.style}
            >
              <div className="text-sm opacity-70 mb-1">
                {msg.sender === 'user' ? t('you', { default: 'You' }) : 'HypertroQ'}
              </div>
              <div>{msg.content}</div>
            </div>
          );
        })}
        
        {chatHistory.length === 0 && (
          <div className="text-center text-gray-500 py-12">
            <p>{t('welcomeMessage', { default: 'Start a conversation with your AI fitness coach!' })}</p>
            <div className="mt-4 text-sm space-y-1">
              <p>🇺🇸 Try: &quot;Create a workout plan for me&quot;</p>
              <p>🇸🇦 جرب: &quot;اصنع لي برنامج تدريب&quot;</p>
              <p>🇫🇷 Essayez: &quot;Créez-moi un plan d&apos;entraînement&quot;</p>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="flex gap-2">
        <InternationalInput
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-1"
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          messageKey="Chat.placeholder"
        />
        <Button onClick={handleSend} disabled={!message.trim()}>
          {t('send')}
        </Button>
      </div>

      {/* Language Info */}
      <div className="text-xs text-gray-500 mt-2">
        <p>
          🌍 UI Language: {locale.toUpperCase()} | 
          🔤 Input Detection: {isArabicText(message) ? 'Arabic (RTL)' : 'Latin (LTR)'}
        </p>
      </div>
    </div>
  );
}
