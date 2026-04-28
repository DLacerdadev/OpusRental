import { Menu, Globe, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/hooks/useTheme";

interface HeaderProps {
  title: string;
  user: any;
  onMenuClick?: () => void;
}

export function Header({ title, user, onMenuClick }: HeaderProps) {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return "U";
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  const formatLastAccess = () => {
    const locale = i18n.language === "en-US" ? "en-US" : "pt-BR";
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
    return i18n.language === "en-US" ? "🇺🇸 EN" : "🇧🇷 PT";
  };

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden shrink-0 h-10 w-10 rounded-lg"
            onClick={onMenuClick}
            data-testid="button-menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Page Title */}
          <h2
            className="text-lg sm:text-xl md:text-2xl font-bold text-foreground tracking-tight truncate"
            data-testid="text-page-title"
          >
            {title}
          </h2>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Theme Toggle */}
          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            className="h-10 w-10 rounded-lg border-border"
            aria-label={isDark ? t("header.switchToLight", "Tema claro") : t("header.switchToDark", "Tema escuro")}
            title={isDark ? t("header.switchToLight", "Tema claro") : t("header.switchToDark", "Tema escuro")}
            data-testid="button-theme-toggle"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {/* Language Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 h-10 px-3 rounded-lg font-semibold border-border"
                data-testid="button-language"
              >
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="hidden sm:inline text-sm text-foreground">{getCurrentLanguageLabel()}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-lg p-1">
              <DropdownMenuItem
                onClick={() => changeLanguage("pt-BR")}
                className="cursor-pointer rounded-md font-semibold px-3 py-2"
                data-testid="menu-item-pt-BR"
              >
                🇧🇷 Português (BR)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => changeLanguage("en-US")}
                className="cursor-pointer rounded-md font-semibold px-3 py-2"
                data-testid="menu-item-en-US"
              >
                🇺🇸 English (US)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Last Access */}
          <div className="hidden md:block bg-muted/40 border border-border rounded-lg px-4 py-2">
            <p className="text-xs text-muted-foreground font-medium mb-0.5">{t("header.lastAccess")}</p>
            <p className="text-sm font-semibold text-foreground" data-testid="text-last-access">
              {formatLastAccess()}
            </p>
          </div>

          {/* User Avatar */}
          <Avatar
            className="h-10 w-10 md:h-11 md:w-11 ring-2 ring-border"
            data-testid="avatar-user"
          >
            <AvatarFallback className="bg-gradient-to-br from-accent to-primary text-primary-foreground text-sm md:text-base font-bold">
              {getInitials(user?.firstName, user?.lastName)}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
