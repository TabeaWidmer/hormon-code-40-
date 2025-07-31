

import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import LanguageProvider, { useLanguage } from "./components/i18n/LanguageProvider";
import { AppProvider } from "./components/context/AppContext";
import LanguageSwitcher from "./components/ui/LanguageSwitcher";
import { 
  Heart, 
  LayoutDashboard, 
  ClipboardList, 
  BookOpen, 
  Calendar,
  MessageCircle,
  User,
  Settings,
  ChefHat,
  Shield // Added for Admin
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

function InternalLayout({ children, currentPageName }) {
  const { t } = useLanguage();
  const location = useLocation();

  const navigationItems = [
    {
      title: t("dashboard"),
      url: createPageUrl("Dashboard"),
      icon: LayoutDashboard,
    },
    {
      title: t("diary"),
      url: createPageUrl("Diary"),
      icon: BookOpen,
    },
    {
      title: t("plans"),
      url: createPageUrl("Plans"),
      icon: Calendar,
    },
    {
      title: "Rezepte",
      url: createPageUrl("Recipes"),
      icon: ChefHat,
    },
    {
      title: t("coach"),
      url: createPageUrl("Coach"),
      icon: MessageCircle,
    },
    {
      title: t("knowledge"),
      url: createPageUrl("Knowledge"),
      icon: BookOpen,
    },
    {
      title: t("questionnaire"),
      url: createPageUrl("Questionnaire"),
      icon: ClipboardList,
    },
  ];

  const adminNavigationItems = [
    {
      title: "Rezept-Admin",
      url: createPageUrl("AdminRecipes"),
      icon: Shield
    }
  ]

  return (
    <AppProvider>
      <SidebarProvider>
        <style>{`
          :root {
            --rose-pastel: #F8E8EA;
            --sage-pastel: #E8F3E1;
            --lavender-pastel: #F0E8F8;
            --peach-pastel: #FFF0E8;
            --mint-pastel: #E8F8F0;
            --cream-base: #FEFCFB;
            --rose-accent: #E91E63;
            --sage-accent: #4CAF50;
            --text-primary: #2D3748;
            --text-secondary: #718096;
            --text-muted: #A0AEC0;
          }
          
          .gradient-rose-modern {
            background: linear-gradient(135deg, #FDA4AF 0%, #F472B6 100%);
          }
          
          .gradient-sage-modern {
            background: linear-gradient(135deg, #86EFAC 0%, #4ADE80 100%);
          }
          
          .gradient-lavender-modern {
            background: linear-gradient(135deg, #C4B5FD 0%, #A78BFA 100%);
          }
          
          .glass-effect {
            background: rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.2);
          }
          
          .shadow-soft {
            box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.08), 0 2px 8px -2px rgba(0, 0, 0, 0.04);
          }
          
          .shadow-medium {
            box-shadow: 0 8px 30px -4px rgba(0, 0, 0, 0.12), 0 4px 16px -4px rgba(0, 0, 0, 0.08);
          }

          .shadow-text-heavy {
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
          }

          .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
        `}</style>
        
        <div className="min-h-screen flex w-full bg-gradient-to-br from-cream-base via-rose-pastel/30 to-sage-pastel/30">
          <Sidebar className="border-r-0 glass-effect shadow-medium">
            <SidebarHeader className="border-b border-white/20 p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 gradient-rose-modern rounded-2xl flex items-center justify-center shadow-soft">
                  <Heart className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-text-primary text-xl tracking-tight">{t("app_name")}</h2>
                  <p className="text-sm text-text-secondary font-medium">Hormone Balance Guide</p>
                </div>
              </div>
            </SidebarHeader>
            
            <SidebarContent className="p-4">
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-2">
                    {navigationItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton 
                          asChild 
                          className={`rounded-2xl transition-all duration-300 hover:shadow-soft ${
                            location.pathname === item.url 
                              ? 'gradient-sage-modern text-white shadow-medium transform translate-y-[-1px]' 
                              : 'hover:bg-white/60 hover:text-text-primary text-text-secondary'
                          }`}
                        >
                          <Link to={item.url} className="flex items-center gap-4 px-4 py-4">
                            <item.icon className="w-5 h-5" />
                            <span className="font-semibold text-base">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
              
              {/* Admin Section */}
              <SidebarGroup className="mt-6">
                 <p className="px-4 py-2 text-xs font-semibold text-text-muted uppercase">Admin</p>
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-2">
                    {adminNavigationItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton 
                          asChild 
                          className={`rounded-2xl transition-all duration-300 hover:shadow-soft ${
                            location.pathname === item.url 
                              ? 'gradient-sage-modern text-white shadow-medium transform translate-y-[-1px]' 
                              : 'hover:bg-white/60 hover:text-text-primary text-text-secondary'
                          }`}
                        >
                          <Link to={item.url} className="flex items-center gap-4 px-4 py-4">
                            <item.icon className="w-5 h-5" />
                            <span className="font-semibold text-base">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>

            </SidebarContent>

            <SidebarFooter className="border-t border-white/20 p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 gradient-lavender-modern rounded-2xl flex items-center justify-center shadow-soft">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-text-primary text-base">Wellness Journey</p>
                    <p className="text-sm text-text-muted">Your personal guide</p>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <LanguageSwitcher />
                  <Button variant="ghost" size="icon" className="rounded-2xl hover:bg-white/60">
                    <Settings className="w-5 h-5 text-text-secondary" />
                  </Button>
                </div>
              </div>
            </SidebarFooter>
          </Sidebar>

          <main className="flex-1 flex flex-col min-w-0">
            <header className="glass-effect border-b border-white/20 px-6 py-4 md:hidden shadow-soft">
              <div className="flex items-center justify-between">
                <SidebarTrigger className="hover:bg-white/60 p-3 rounded-2xl transition-all duration-200" />
                <h1 className="text-xl font-bold text-text-primary">{t("app_name")}</h1>
                <LanguageSwitcher />
              </div>
            </header>

            <div className="flex-1 overflow-auto">
              {children}
            </div>
          </main>
        </div>
      </SidebarProvider>
    </AppProvider>
  );
}

export default function Layout({ children, currentPageName }) {
  return (
    <LanguageProvider>
      <InternalLayout currentPageName={currentPageName}>
        {children}
      </InternalLayout>
    </LanguageProvider>
  );
}

