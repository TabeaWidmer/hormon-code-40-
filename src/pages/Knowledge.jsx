import React, { useState, useEffect } from 'react';
import { useLanguage } from '../components/i18n/LanguageProvider';
import { useSearchParams } from 'react-router-dom';
import { Article, Favorite, User } from '@/api/entities';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  Search, 
  Star
} from 'lucide-react';
import ArticleCard from '../components/knowledge/ArticleCard';
import ArticleDetailView from '../components/knowledge/ArticleDetailView';

// Assuming these icons are used in categories, ensure they are imported if not already.
import { Utensils, Dumbbell, Heart, Moon, Brain } from 'lucide-react';

export default function KnowledgePage() {
  const { t, language } = useLanguage();
  const [articles, setArticles] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  const [searchParams, setSearchParams] = useSearchParams();
  const selectedArticleId = searchParams.get('article');

  const categories = [
    { key: 'all', label: 'Alle Artikel', icon: BookOpen, color: 'bg-gray-100 text-gray-800' },
    { key: 'favorites', label: 'Favoriten', icon: Star, color: 'bg-yellow-100 text-yellow-800' },
    { key: 'nutrition', label: 'Ernährung', icon: Utensils, color: 'bg-rose-100 text-rose-800' },
    { key: 'movement', label: 'Bewegung', icon: Dumbbell, color: 'bg-sage-100 text-sage-800' },
    { key: 'hormones', label: 'Hormone', icon: Heart, color: 'bg-purple-100 text-purple-800' },
    { key: 'sleep', label: 'Schlaf', icon: Moon, color: 'bg-indigo-100 text-indigo-800' },
    { key: 'stress', label: 'Stress', icon: Brain, color: 'bg-amber-100 text-amber-800' },
  ];
  
  const selectedArticle = selectedArticleId ? articles.find(a => a.id === selectedArticleId) : null;

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        const currentUser = await User.me();
        setUser(currentUser);
        await Promise.all([
          loadArticles(),
          loadFavorites(currentUser.id)
        ]);
      } catch (error) {
        await loadArticles();
      }
      setIsLoading(false);
    };
    init();
  }, []);

  const loadArticles = async () => {
    try {
      const fetchedArticles = await Article.list('-created_date');
      setArticles(fetchedArticles);
    } catch (error) {
      console.error('Error loading articles:', error);
    }
  };

  const loadFavorites = async (userId) => {
    try {
      const favs = await Favorite.filter({ user_id: userId, item_type: 'article' });
      setFavorites(favs);
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const handleFavoriteToggle = async (article) => {
    if (!user) return;

    const favorite = favorites.find(f => f.item_id === article.id);

    if (favorite) {
      await Favorite.delete(favorite.id);
      setFavorites(prev => prev.filter(f => f.id !== favorite.id));
    } else {
      const newFavorite = await Favorite.create({
        user_id: user.id,
        item_id: article.id,
        item_type: 'article',
        item_data: article
      });
      setFavorites(prev => [...prev, newFavorite]);
    }
  };
  
  const handleArticleSelect = (article) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('article', article.id);
    setSearchParams(newParams);
  };

  const handleArticleClose = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('article');
    setSearchParams(newParams);
  };

  const filteredArticles = articles.filter(article => {
    const isFavorited = favorites.some(f => f.item_id === article.id);

    let categoryMatch = true;
    if (selectedCategory === 'all') {
      categoryMatch = true;
    } else if (selectedCategory === 'favorites') {
      categoryMatch = isFavorited;
    } else {
      categoryMatch = article.category === selectedCategory;
    }

    const searchMatch = !searchTerm || 
      article.title?.[language]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.content?.[language]?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return categoryMatch && searchMatch;
  });

  const FeaturedSection = () => {
    const featuredArticles = articles.filter(article => article.featured).slice(0, 3);
    if (featuredArticles.length === 0) return null;

    return (
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-text-primary mb-6 tracking-tight">Empfohlene Artikel</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredArticles.map(article => (
            <ArticleCard 
              key={article.id} 
              article={article}
              isFavorite={favorites.some(f => f.item_id === article.id)}
              onFavoriteToggle={handleFavoriteToggle}
              onSelect={handleArticleSelect}
              language={language}
              categories={categories}
              user={user}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 lg:p-8 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-6">
            <div className="w-14 h-14 gradient-rose-modern rounded-2xl flex items-center justify-center flex-shrink-0 shadow-soft">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-3xl lg:text-4xl font-bold text-text-primary tracking-tight">Wissens-Hub</h1>
              <p className="text-text-secondary text-lg mt-2">
                Expertenwissen für Frauen 40+ in der Hormonwandel
              </p>
            </div>
          </div>
          
          <div className="flex flex-col gap-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-text-muted w-5 h-5" />
              <Input
                placeholder="Artikel durchsuchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 rounded-2xl border-0 shadow-soft glass-effect text-base"
              />
            </div>
            
            <div className="flex flex-wrap gap-3">
              {categories.map(category => {
                const IconComponent = category.icon;
                return (
                  <Button
                    key={category.key}
                    variant={selectedCategory === category.key ? "default" : "outline"}
                    className={`whitespace-nowrap flex-shrink-0 text-sm h-11 px-5 rounded-2xl font-semibold transition-all duration-300 ${
                      selectedCategory === category.key 
                        ? (category.key === 'favorites' ? 'bg-yellow-400 hover:bg-yellow-500 text-white shadow-soft' : 'gradient-sage-modern text-white shadow-soft')
                        : 'hover:bg-white/60 border-white/20 glass-effect text-text-secondary hover:text-text-primary'
                    }`}
                    onClick={() => setSelectedCategory(category.key)}
                  >
                    <IconComponent className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">{category.label}</span>
                    <span className="sm:hidden">
                      {category.key === 'all' ? 'Alle' : 
                       category.key === 'favorites' ? 'Fav' :
                       category.key === 'nutrition' ? 'Ernähr' :
                       category.key === 'movement' ? 'Sport' :
                       category.key === 'hormones' ? 'Hormon' :
                       category.key === 'sleep' ? 'Schlaf' : 'Stress'}
                    </span>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse h-72 rounded-2xl border-0 shadow-soft"><div className="w-full h-full bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl"></div></Card>
            ))}
          </div>
        ) : (
          <>
            {selectedCategory === 'all' && !searchTerm && <FeaturedSection />}
            
            {filteredArticles.length === 0 ? (
              <Card className="border-0 shadow-soft rounded-2xl glass-effect text-center">
                <CardContent className="p-16">
                  <BookOpen className="w-20 h-20 text-text-muted mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-text-primary mb-4">
                    Keine Artikel gefunden
                  </h3>
                  <p className="text-text-secondary text-lg">
                    Probiere einen anderen Suchbegriff oder Filter.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-text-primary">
                    <span className="hidden sm:inline">
                      {categories.find(c => c.key === selectedCategory)?.label} ({filteredArticles.length})
                    </span>
                    <span className="sm:hidden">
                      Artikel ({filteredArticles.length})
                    </span>
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredArticles.map(article => (
                    <ArticleCard 
                      key={article.id} 
                      article={article} 
                      isFavorite={favorites.some(f => f.item_id === article.id)}
                      onFavoriteToggle={handleFavoriteToggle}
                      onSelect={handleArticleSelect}
                      language={language}
                      categories={categories}
                      user={user}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      
      {selectedArticle && !isLoading && (
        <ArticleDetailView
          article={selectedArticle}
          isOpen={!!selectedArticle}
          onClose={handleArticleClose}
          language={language}
          categories={categories}
        />
      )}

      <style jsx global>{`
        .prose {
          line-height: 1.7;
        }
        .prose h2 {
          font-size: 1.5rem;
          margin-top: 2em;
          margin-bottom: 1em;
        }
        .prose p {
          margin-bottom: 1.25em;
        }
        .prose ul, .prose ol {
          margin-left: 1.5em;
          margin-bottom: 1.25em;
        }
        .prose li {
          margin-bottom: 0.5em;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}