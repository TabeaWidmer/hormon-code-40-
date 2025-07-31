import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Bookmark, MoveRight } from 'lucide-react';

export default function ArticleCard({ article, isFavorite, onFavoriteToggle, onSelect, language, categories, user }) {
  const categoryInfo = categories.find(cat => cat.key === article.category) || {};
  const IconComponent = categoryInfo.icon;

  return (
    <Card 
      className="border-0 shadow-soft rounded-2xl glass-effect hover:shadow-medium transition-all duration-300 group h-full flex flex-col cursor-pointer transform hover:translate-y-[-2px]" 
      onClick={() => onSelect(article)}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(article)}
      tabIndex={0}
      role="button"
      aria-label={`Read article: ${article.title?.[language] || article.title?.de}`}
    >
      <CardHeader className="pb-4 flex-shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg text-text-primary group-hover:text-rose-600 transition-colors line-clamp-2 mb-3 font-bold leading-tight">
              {article.title?.[language] || article.title?.de || 'Untitled'}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              {IconComponent && 
                <Badge className={`${categoryInfo.color} text-xs rounded-xl px-3 py-1 font-semibold`}>
                  <IconComponent className="w-3 h-3 mr-1.5" />
                  <span className="hidden sm:inline">{categoryInfo.label}</span>
                </Badge>
              }
              {article.reading_time && (
                <Badge variant="outline" className="flex items-center gap-1.5 text-xs rounded-xl px-3 py-1 border-white/20 bg-white/40">
                  <Clock className="w-3 h-3" />
                  <span>{article.reading_time} Min</span>
                </Badge>
              )}
            </div>
          </div>
          {article.image_url && (
            <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 shadow-soft">
              <img 
                src={article.image_url} 
                alt={article.title?.[language] || ''}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-text-secondary text-base line-clamp-3 leading-relaxed">
          {article.content?.[language]?.substring(0, 120) || 
           article.content?.de?.substring(0, 120) || ''}...
        </p>
      </CardContent>
      <CardFooter className="pt-4 flex justify-between items-center">
        <span className="text-rose-600 font-semibold text-base flex items-center gap-2 group-hover:gap-3 transition-all">
          Artikel lesen <MoveRight className="w-4 h-4" />
        </span>
         {user && (
          <Button
            size="icon"
            variant="ghost"
            className="h-10 w-10 rounded-2xl z-10"
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            onClick={(e) => {
                e.stopPropagation();
                onFavoriteToggle(article);
            }}
          >
            <Bookmark className={`w-4 h-4 transition-colors ${isFavorite ? 'text-yellow-500 fill-yellow-400' : 'text-text-muted'}`} />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}