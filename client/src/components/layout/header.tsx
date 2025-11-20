import { Menu, Globe, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  title: string;
  user: any;
  onMenuClick?: () => void;
}

export function Header({ title, user, onMenuClick }: HeaderProps) {
  const { t, i18n } = useTranslation();
  
  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return "U";
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  const formatLastAccess = () => {
    const locale = i18n.language === 'en-US' ? 'en-US' : 'pt-BR';
    return new Date().toLocaleString(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  const getCurrentLanguageLabel = () => {
    return i18n.language === 'en-US' ? '🇺🇸 EN' : '🇧🇷 PT';
  };

  return (
    <header className="sticky top-0 z-40 border-b-2 border-[#2196F3]/20 bg-white/95 backdrop-blur-xl supports-[backdrop-filter]:bg-white/80 shadow-lg shadow-[#2196F3]/5">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Mobile Menu Button - MODERN */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden shrink-0 h-11 w-11 hover:bg-[#2196F3]/10 hover:shadow-lg hover:shadow-[#2196F3]/20 transition-all rounded-xl border-2 border-transparent hover:border-[#2196F3]/30"
            onClick={onMenuClick}
            data-testid="button-menu"
          >
            <Menu className="h-5 w-5 text-[#0D2847]" />
          </Button>
          
          {/* Page Title - PREMIUM */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-1 bg-gradient-to-b from-[#2196F3] to-[#0D2847] rounded-full shadow-lg shadow-[#2196F3]/50"></div>
            <h2 className="text-xl md:text-2xl font-black text-[#0D2847] truncate tracking-tight" data-testid="text-page-title">
              {title}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Language Selector - PREMIUM DESIGN */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2.5 h-11 px-4 border-2 border-[#2196F3]/20 hover:border-[#2196F3]/50 bg-white hover:bg-[#2196F3]/5 hover:shadow-lg hover:shadow-[#2196F3]/20 transition-all rounded-xl font-bold"
                data-testid="button-language"
              >
                <Globe className="h-4 w-4 text-[#2196F3]" />
                <span className="hidden sm:inline text-sm text-[#0D2847]">{getCurrentLanguageLabel()}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="bg-white border-2 border-[#2196F3]/20 shadow-2xl shadow-[#2196F3]/20 rounded-xl p-2 backdrop-blur-xl"
            >
              <DropdownMenuItem
                onClick={() => changeLanguage('pt-BR')}
                className="cursor-pointer rounded-lg hover:bg-[#2196F3]/10 font-semibold text-[#0D2847] px-4 py-2.5"
                data-testid="menu-item-pt-BR"
              >
                🇧🇷 Português (BR)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => changeLanguage('en-US')}
                className="cursor-pointer rounded-lg hover:bg-[#2196F3]/10 font-semibold text-[#0D2847] px-4 py-2.5"
                data-testid="menu-item-en-US"
              >
                🇺🇸 English (US)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Last Access - PREMIUM CARD */}
          <div className="hidden md:block">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-[#2196F3]/10 to-[#0D2847]/10 rounded-xl blur-sm group-hover:blur-md transition-all"></div>
              <div className="relative bg-gradient-to-br from-[#2196F3]/5 to-white/50 border-2 border-[#2196F3]/20 rounded-xl px-4 py-2.5 backdrop-blur-xl shadow-lg">
                <div className="flex items-center gap-2 mb-0.5">
                  <Activity className="h-3 w-3 text-[#2196F3] animate-pulse" />
                  <p className="text-xs text-[#0D2847]/60 font-black uppercase tracking-wide">
                    {t('header.lastAccess')}
                  </p>
                </div>
                <p className="text-sm font-bold text-[#0D2847]" data-testid="text-last-access">
                  {formatLastAccess()}
                </p>
              </div>
            </div>
          </div>

          {/* User Avatar - PREMIUM BANKING STYLE */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-[#2196F3] to-[#0D2847] rounded-full blur-md group-hover:blur-lg transition-all animate-pulse"></div>
            <Avatar 
              className="relative h-11 w-11 md:h-12 md:w-12 ring-2 ring-white shadow-2xl shadow-[#2196F3]/50 group-hover:ring-4 group-hover:ring-[#2196F3]/30 transition-all" 
              data-testid="avatar-user"
            >
              <AvatarFallback className="bg-gradient-to-br from-[#2196F3] to-[#0D2847] text-white text-base md:text-lg font-black">
                {getInitials(user?.firstName, user?.lastName)}
              </AvatarFallback>
            </Avatar>
            {/* Online indicator */}
            <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-[#2196F3] border-2 border-white shadow-lg shadow-[#2196F3]/50 animate-pulse"></div>
          </div>
        </div>
      </div>
    </header>
  );
}
