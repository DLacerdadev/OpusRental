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
  const { i18n } = useTranslation();
  
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
    <header className="sticky top-0 z-40 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 border-b border-border">
      <div className="flex items-center justify-between p-3 md:p-4">
        <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden shrink-0 h-9 w-9"
            onClick={onMenuClick}
            data-testid="button-menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h2 className="text-base md:text-xl font-semibold truncate" data-testid="text-page-title">{title}</h2>
        </div>

        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 h-9"
                data-testid="button-language"
              >
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline text-xs">{getCurrentLanguageLabel()}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => changeLanguage('pt-BR')}
                data-testid="menu-item-pt-BR"
              >
                🇧🇷 Português (BR)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => changeLanguage('en-US')}
                data-testid="menu-item-en-US"
              >
                🇺🇸 English (US)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="text-right hidden md:block">
            <p className="text-xs text-muted-foreground">
              {i18n.language === 'en-US' ? 'Last access' : 'Último acesso'}
            </p>
            <p className="text-xs font-medium" data-testid="text-last-access">{formatLastAccess()}</p>
          </div>

          <Avatar className="h-8 w-8 md:h-10 md:w-10" data-testid="avatar-user">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs md:text-sm">
              {getInitials(user?.firstName, user?.lastName)}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
