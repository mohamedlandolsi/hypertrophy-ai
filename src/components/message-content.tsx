import React from 'react';
import { getTextFormatting, formatBidirectionalText } from '@/lib/text-formatting';

interface MessageContentProps {
  content: string;
  role: 'user' | 'assistant';
}

export const MessageContent: React.FC<MessageContentProps> = ({ content }) => {
  const formatting = getTextFormatting(content);
  const formattedContent = formatBidirectionalText(content);
  
  return (
    <div
      dir={formatting.dir}
      lang={formatting.lang}
      style={formatting.style}
      className={`message-content ${formatting.className}`}
    >
      <p 
        className="text-sm leading-relaxed whitespace-pre-wrap"
        style={{
          // Enhanced styling for better text rendering
          lineHeight: formatting.lang === 'ar' ? '1.8' : '1.7',
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
          // Better font rendering
          textRendering: 'optimizeLegibility',
          fontFeatureSettings: '"liga" 1, "calt" 1',
          // Better spacing for mixed content
          wordSpacing: formatting.dir === 'auto' ? '0.1em' : 'normal',
        }}
      >
        {formattedContent}
      </p>
    </div>
  );
};
