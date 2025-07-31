import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import ReactMarkdown from 'react-markdown';
import { Clock, Share2, BookmarkPlus, ArrowLeft } from 'lucide-react';

export default function ArticleDetailView({ article, isOpen, onClose, language, categories, relatedArticles = [], onRelatedArticleClick }) {
  if (!article) return null;

  const categoryInfo = categories.find(cat => cat.key === article.category) || {};
  const IconComponent = categoryInfo.icon;
  
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title?.[language] || article.title?.de,
          text: article.summary?.[language] || article.summary?.de,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 sm:p-6 pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Zurück</span>
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm">
                <BookmarkPlus className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="text-left">
            <DialogTitle className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 leading-tight mb-3">
              {article.title?.[language] || article.title?.de}
            </DialogTitle>
            
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
              {IconComponent && (
                <Badge className={`${categoryInfo.color} text-xs`}>
                  <IconComponent className="w-3 h-3 mr-1.5" />
                  {categoryInfo.label}
                </Badge>
              )}
              {article.reading_time && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>⏱ {article.reading_time} min Lesezeit</span>
                </div>
              )}
              {article.author && (
                <span>von {article.author}</span>
              )}
            </div>
            
            {article.summary?.[language] && (
              <p className="text-gray-600 text-base sm:text-lg mt-4 leading-relaxed">
                {article.summary[language]}
              </p>
            )}
          </div>
        </DialogHeader>
        
        <ScrollArea className="flex-1">
          {article.image_url && (
            <div className="w-full h-48 sm:h-64 lg:h-80 overflow-hidden">
              <img 
                src={article.image_url} 
                alt={article.title?.[language]} 
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="p-4 sm:p-6 lg:p-8">
            {/* Key Takeaways */}
            {article.key_takeaways?.[language] && (
              <Card className="mb-8 bg-gradient-to-r from-rose-50 to-sage-50 border-rose-200">
                <CardContent className="p-6">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="text-rose-600">🎯</span>
                    Die wichtigsten Punkte im Überblick
                  </h3>
                  <ul className="space-y-2">
                    {article.key_takeaways[language].map((takeaway, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="text-sage-600 font-bold mt-1">•</span>
                        <span className="text-gray-700">{takeaway}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Article Content */}
            <div className="prose prose-lg max-w-none prose-p:text-gray-700 prose-headings:text-gray-800 prose-headings:font-bold prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3 prose-ul:my-6 prose-li:my-2">
              <ReactMarkdown
                components={{
                  blockquote: ({ children }) => (
                    <div className="bg-purple-50 border-l-4 border-purple-400 p-6 my-8 rounded-r-lg">
                      <div className="text-purple-800 italic text-lg">
                        {children}
                      </div>
                    </div>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-xl font-bold text-gray-800 mt-8 mb-4 pb-2 border-b border-gray-200">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-lg font-bold text-gray-800 mt-6 mb-3">
                      {children}
                    </h3>
                  )
                }}
              >
                {article.content?.[language] || article.content?.de || ''}
              </ReactMarkdown>
            </div>

            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-3">Tags:</h4>
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="bg-gray-50">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Related Articles */}
            {relatedArticles.length > 0 && (
              <div className="mt-12 pt-8 border-t border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-6">
                  Das könnte dich auch interessieren
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {relatedArticles.slice(0, 3).map((relatedArticle) => (
                    <Card 
                      key={relatedArticle.id}
                      className="cursor-pointer hover:shadow-md transition-shadow border-gray-200"
                      onClick={() => onRelatedArticleClick?.(relatedArticle)}
                    >
                      <CardContent className="p-4">
                        <h4 className="font-semibold text-sm text-gray-800 line-clamp-2 mb-2">
                          {relatedArticle.title?.[language] || relatedArticle.title?.de}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>{relatedArticle.reading_time} min</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}