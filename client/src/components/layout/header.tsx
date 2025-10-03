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
    <header className="bg-card border-b border-border p-4 flex justify-between items-center">
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
          data-testid="button-menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h2 className="text-xl font-semibold" data-testid="text-page-title">{title}</h2>
      </div>

      <div className="flex items-center space-x-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              data-testid="button-language"
            >
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">{getCurrentLanguageLabel()}</span>
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

        <div className="text-right hidden sm:block">
          <p className="text-sm text-muted-foreground">
            {i18n.language === 'en-US' ? 'Last access' : 'Último acesso'}
          </p>
          <p className="text-sm font-medium" data-testid="text-last-access">{formatLastAccess()}</p>
        </div>

        <Avatar data-testid="avatar-user">
          <AvatarFallback className="bg-primary text-primary-foreground">
            {getInitials(user?.firstName, user?.lastName)}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
