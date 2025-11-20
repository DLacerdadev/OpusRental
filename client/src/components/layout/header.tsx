import { Menu, Globe } from "lucide-react";
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
  };

  const getCurrentLanguageLabel = () => {
    return i18n.language === 'en-US' ? '🇺🇸 EN' : '🇧🇷 PT';
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden shrink-0 h-10 w-10 hover:bg-slate-100 rounded-lg"
            onClick={onMenuClick}
            data-testid="button-menu"
          >
            <Menu className="h-5 w-5 text-slate-700" />
          </Button>
          
          {/* Page Title */}
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 truncate" data-testid="text-page-title">
            {title}
          </h2>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Language Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 h-10 px-3 border-slate-200 hover:bg-slate-50 rounded-lg font-semibold"
                data-testid="button-language"
              >
                <Globe className="h-4 w-4 text-slate-600" />
                <span className="hidden sm:inline text-sm text-slate-700">{getCurrentLanguageLabel()}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="bg-white border border-slate-200 shadow-lg rounded-lg p-1"
            >
              <DropdownMenuItem
                onClick={() => changeLanguage('pt-BR')}
                className="cursor-pointer rounded-md hover:bg-slate-50 font-semibold text-slate-700 px-3 py-2"
                data-testid="menu-item-pt-BR"
              >
                🇧🇷 Português (BR)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => changeLanguage('en-US')}
                className="cursor-pointer rounded-md hover:bg-slate-50 font-semibold text-slate-700 px-3 py-2"
                data-testid="menu-item-en-US"
              >
                🇺🇸 English (US)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Last Access */}
          <div className="hidden md:block bg-slate-50 border border-slate-200 rounded-lg px-4 py-2">
            <p className="text-xs text-slate-500 font-medium mb-0.5">
              {t('header.lastAccess')}
            </p>
            <p className="text-sm font-semibold text-slate-900" data-testid="text-last-access">
              {formatLastAccess()}
            </p>
          </div>

          {/* User Avatar */}
          <Avatar 
            className="h-10 w-10 md:h-11 md:w-11 ring-2 ring-slate-200" 
            data-testid="avatar-user"
          >
            <AvatarFallback className="bg-gradient-to-br from-[#2196F3] to-[#0D2847] text-white text-sm md:text-base font-bold">
              {getInitials(user?.firstName, user?.lastName)}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
