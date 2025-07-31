import React, { useState, useMemo } from 'react';
import { useLanguage } from '../i18n/LanguageProvider';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ShoppingCart, 
  Download, 
  FileText,
  ArrowLeft,
  Check,
  Leaf,
  Beef,
  Droplets,
  Wheat,
  Apple,
  Cookie
} from 'lucide-react';

export default function ShoppingListModal({ 
  isOpen, 
  onClose, 
  weeklyPlan 
}) {
  const { t, language } = useLanguage();
  const [checkedItems, setCheckedItems] = useState(new Set());

  // Process and aggregate ingredients
  const aggregatedIngredients = useMemo(() => {
    if (!weeklyPlan?.meals) return {};

    const ingredientMap = {};
    
    weeklyPlan.meals.forEach(meal => {
      if (meal.recipe?.ingredients) {
        meal.recipe.ingredients.forEach(ingredient => {
          const name = ingredient.name?.[language] || ingredient.name?.de || 'Unbekannt';
          const unit = ingredient.unit || '';
          const amount = (ingredient.amount || 0) * (meal.portions || 1);
          const key = `${name.toLowerCase()}-${unit}`;
          
          if (ingredientMap[key]) {
            ingredientMap[key].totalAmount += amount;
          } else {
            ingredientMap[key] = {
              name,
              unit,
              totalAmount: amount,
              category: categorizeIngredient(name)
            };
          }
        });
      }
    });

    // Group by category
    const categorized = {};
    Object.values(ingredientMap).forEach(ingredient => {
      const category = ingredient.category;
      if (!categorized[category]) {
        categorized[category] = [];
      }
      categorized[category].push(ingredient);
    });

    // Sort ingredients within each category
    Object.keys(categorized).forEach(category => {
      categorized[category].sort((a, b) => a.name.localeCompare(b.name));
    });

    return categorized;
  }, [weeklyPlan, language]);

  // Categorize ingredients based on name
  function categorizeIngredient(name) {
    const nameLower = name.toLowerCase();
    
    const categories = {
      'Gemüse & Salat': ['spinat', 'grünkohl', 'rucola', 'brokkoli', 'blumenkohl', 'karotten', 'rote bete', 'süßkartoffeln', 'zucchini', 'paprika', 'tomaten', 'gurken', 'zwiebeln', 'knoblauch', 'lauch', 'sellerie'],
      'Obst': ['äpfel', 'bananen', 'beeren', 'heidelbeeren', 'himbeeren', 'erdbeeren', 'zitronen', 'limetten', 'orangen', 'avocado', 'mango', 'ananas'],
      'Proteine': ['hähnchen', 'rindfleisch', 'lachs', 'thunfisch', 'eier', 'tofu', 'tempeh', 'linsen', 'kichererbsen', 'bohnen', 'quinoa'],
      'Milchprodukte': ['milch', 'joghurt', 'käse', 'quark', 'sahne', 'butter', 'mozzarella', 'parmesan', 'feta'],
      'Getreide & Kohlenhydrate': ['reis', 'pasta', 'brot', 'haferflocken', 'bulgur', 'couscous', 'kartoffeln', 'mehl'],
      'Nüsse & Samen': ['mandeln', 'walnüsse', 'haselnüsse', 'sonnenblumenkerne', 'kürbiskerne', 'leinsamen', 'chia', 'sesam'],
      'Öle & Fette': ['olivenöl', 'kokosöl', 'avocadoöl', 'butter', 'ghee', 'leinöl'],
      'Gewürze & Kräuter': ['salz', 'pfeffer', 'kurkuma', 'ingwer', 'zimt', 'paprika', 'oregano', 'basilikum', 'petersilie', 'dill', 'thymian'],
      'Pantry': ['essig', 'senf', 'honig', 'ahornsirup', 'vanille', 'backpulver', 'natron', 'gemüsebrühe', 'kokosmilch']
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => nameLower.includes(keyword))) {
        return category;
      }
    }
    
    return 'Sonstiges';
  }

  const categoryIcons = {
    'Gemüse & Salat': Leaf,
    'Obst': Apple,
    'Proteine': Beef,
    'Milchprodukte': Droplets,
    'Getreide & Kohlenhydrate': Wheat,
    'Nüsse & Samen': Cookie,
    'Öle & Fette': Droplets,
    'Gewürze & Kräuter': Leaf,
    'Pantry': Cookie,
    'Sonstiges': Cookie
  };

  const handleItemCheck = (categoryName, itemName) => {
    const key = `${categoryName}-${itemName}`;
    const newChecked = new Set(checkedItems);
    
    if (checkedItems.has(key)) {
      newChecked.delete(key);
    } else {
      newChecked.add(key);
    }
    
    setCheckedItems(newChecked);
  };

  const generateTextList = () => {
    let text = `EINKAUFSLISTE - WOCHENPLAN\n`;
    text += `Generiert am: ${new Date().toLocaleDateString('de-DE')}\n\n`;

    Object.entries(aggregatedIngredients).forEach(([category, items]) => {
      text += `${category.toUpperCase()}\n`;
      text += `${'='.repeat(category.length)}\n`;
      
      items.forEach(item => {
        const amount = item.totalAmount % 1 === 0 ? 
          item.totalAmount.toString() : 
          item.totalAmount.toFixed(1);
        text += `□ ${item.name} - ${amount} ${item.unit}\n`;
      });
      
      text += `\n`;
    });

    return text;
  };

  const downloadTextFile = () => {
    const text = generateTextList();
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `einkaufsliste-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalItems = Object.values(aggregatedIngredients).reduce((sum, items) => sum + items.length, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 sm:p-6 pb-4 border-b">
          <div className="flex items-start justify-between gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Zurück</span>
            </Button>
            
            <Badge className="bg-sage-100 text-sage-800 gap-2">
              <ShoppingCart className="w-3 h-3" />
              {totalItems} Artikel
            </Badge>
          </div>
          
          <div className="text-left mt-4">
            <DialogTitle className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 leading-tight flex items-center gap-3">
              <ShoppingCart className="w-8 h-8 text-rose-500"/>
              Einkaufsliste - Wochenplan
            </DialogTitle>
            <p className="text-gray-600 mt-2">
              Alle Zutaten aus deinem Wochenplan, intelligent zusammengefasst und kategorisiert
            </p>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            {Object.entries(aggregatedIngredients).map(([category, items]) => {
              const IconComponent = categoryIcons[category];
              
              return (
                <Card key={category} className="border-rose-100">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-gray-800 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center">
                        <IconComponent className="w-5 h-5 text-rose-600" />
                      </div>
                      {category}
                      <Badge variant="outline" className="text-xs">
                        {items.length} {items.length === 1 ? 'Artikel' : 'Artikel'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {items.map((item, index) => {
                        const key = `${category}-${item.name}`;
                        const isChecked = checkedItems.has(key);
                        const amount = item.totalAmount % 1 === 0 ? 
                          item.totalAmount.toString() : 
                          item.totalAmount.toFixed(1);

                        return (
                          <div 
                            key={index}
                            className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer hover:bg-gray-50 ${
                              isChecked 
                                ? 'bg-green-50 border-green-200' 
                                : 'bg-white border-gray-200'
                            }`}
                            onClick={() => handleItemCheck(category, item.name)}
                          >
                            <Checkbox
                              id={key}
                              checked={isChecked}
                              onCheckedChange={() => handleItemCheck(category, item.name)}
                              className="h-4 w-4"
                            />
                            <div className={`flex-1 ${isChecked ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                              <div className="font-medium">{item.name}</div>
                              <div className="text-sm text-gray-600">
                                {amount} {item.unit}
                              </div>
                            </div>
                            {isChecked && (
                              <Check className="w-4 h-4 text-green-600" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {totalItems === 0 && (
              <div className="text-center py-12">
                <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  Keine Zutaten gefunden
                </h3>
                <p className="text-gray-500">
                  Erstelle zuerst einen Wochenplan, um eine Einkaufsliste zu generieren.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Fixed bottom action buttons */}
        <div className="p-4 sm:p-6 border-t bg-white">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 text-center sm:text-left text-sm text-gray-600">
              {checkedItems.size > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Check className="w-4 h-4 text-green-600" />
                  {checkedItems.size} von {totalItems} Artikeln erledigt
                </span>
              )}
            </div>
            
            <div className="flex gap-3">
              <Button 
                onClick={downloadTextFile}
                variant="outline"
                className="gap-2 flex-1 sm:flex-none"
                disabled={totalItems === 0}
              >
                <Download className="w-4 h-4" />
                Als Textdatei
              </Button>
              
              <Button 
                onClick={downloadTextFile}
                className="gradient-sage-modern text-white gap-2 flex-1 sm:flex-none"
                disabled={totalItems === 0}
              >
                <FileText className="w-4 h-4" />
                Herunterladen
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}