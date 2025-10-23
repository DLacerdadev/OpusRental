import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Bell, Shield, Palette, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6 lg:space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t('settings.title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('settings.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="shadow-lg border-l-4 border-l-accent">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="bg-accent/10 p-3 rounded-2xl">
                <User className="h-6 w-6 text-accent" />
              </div>
              <CardTitle className="text-lg font-bold">{t('settings.userProfile')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('settings.fullName')}</Label>
              <Input id="name" placeholder={t('settings.namePlaceholder')} data-testid="input-name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('settings.email')}</Label>
              <Input id="email" type="email" placeholder={t('settings.emailPlaceholder')} data-testid="input-email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">{t('settings.country')}</Label>
              <Select defaultValue={user?.country || "US"}>
                <SelectTrigger data-testid="select-country">
                  <SelectValue placeholder={t('settings.selectCountry')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="US">🇺🇸 United States (USD)</SelectItem>
                  <SelectItem value="BR">🇧🇷 Brasil (BRL)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="bg-accent hover:bg-accent/90 w-full" data-testid="button-save-profile">
              {t('settings.saveChanges')}
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-l-4 border-l-primary">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-3 rounded-2xl">
                <Bell className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg font-bold">{t('settings.notifications')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
              <div>
                <p className="font-semibold text-foreground">{t('settings.paymentEmails')}</p>
                <p className="text-sm text-muted-foreground">{t('settings.paymentEmailsDesc')}</p>
              </div>
              <Switch data-testid="switch-email-payments" />
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
              <div>
                <p className="font-semibold text-foreground">{t('settings.monthlyReports')}</p>
                <p className="text-sm text-muted-foreground">{t('settings.monthlyReportsDesc')}</p>
              </div>
              <Switch data-testid="switch-monthly-reports" />
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
              <div>
                <p className="font-semibold text-foreground">{t('settings.gpsAlerts')}</p>
                <p className="text-sm text-muted-foreground">{t('settings.gpsAlertsDesc')}</p>
              </div>
              <Switch data-testid="switch-gps-alerts" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-l-4 border-l-secondary">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="bg-secondary/10 p-3 rounded-2xl">
                <Shield className="h-6 w-6 text-secondary" />
              </div>
              <CardTitle className="text-lg font-bold">{t('settings.security')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">{t('settings.currentPassword')}</Label>
              <Input id="current-password" type="password" data-testid="input-current-password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">{t('settings.newPassword')}</Label>
              <Input id="new-password" type="password" data-testid="input-new-password" />
            </div>
            <Button className="bg-secondary hover:bg-secondary/90 w-full" data-testid="button-change-password">
              {t('settings.changePassword')}
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-l-4 border-l-green-500">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="bg-green-50 p-3 rounded-2xl">
                <Palette className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-lg font-bold">{t('settings.preferences')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
              <div>
                <p className="font-semibold text-foreground">{t('settings.darkMode')}</p>
                <p className="text-sm text-muted-foreground">{t('settings.darkModeDesc')}</p>
              </div>
              <Switch 
                checked={theme === "dark"}
                onCheckedChange={toggleTheme}
                data-testid="switch-dark-mode" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">{t('settings.language')}</Label>
              <Select 
                value={i18n.language} 
                onValueChange={changeLanguage}
              >
                <SelectTrigger data-testid="select-language">
                  <SelectValue placeholder={t('settings.selectLanguage')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                  <SelectItem value="en-US">English (US)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
