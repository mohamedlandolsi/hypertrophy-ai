/**
 * Utility functions for handling article links in chat messages
 */

export interface ArticleLink {
  id: string;
  title: string;
  url: string;
}

/**
 * Extracts article links from message content and returns clean content + links
 */
export function extractArticleLinks(content: string): {
  cleanContent: string;
  articleLinks: ArticleLink[];
} {
  const articleLinksMap = new Map<string, ArticleLink>();
  
  // Regex to find markdown links with article: protocol
  // Matches: [Article Title](article:article-id)
  const articleLinkRegex = /\[([^\]]+)\]\(article:([^)]+)\)/g;
  
  let match;
  while ((match = articleLinkRegex.exec(content)) !== null) {
    const [, title, articleId] = match;
    
    // Use Map to automatically deduplicate by article ID
    if (!articleLinksMap.has(articleId)) {
      articleLinksMap.set(articleId, {
        id: articleId,
        title: title,
        url: `/knowledge/${articleId}`
      });
    }
  }
  
  // Remove article links from content, leaving clean text
  const cleanContent = content.replace(articleLinkRegex, '$1');
  
  return {
    cleanContent,
    articleLinks: Array.from(articleLinksMap.values())
  };
}

/**
 * Process message content to separate article links
 */
export function processMessageContent(content: string | null | undefined) {
  const safeContent = content || '';
  const { cleanContent, articleLinks } = extractArticleLinks(safeContent);
  
  return {
    content: cleanContent,
    articleLinks: articleLinks.length > 0 ? articleLinks : null
  };
}
