import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe, ArrowLeft } from "lucide-react";
import logoPath from "@assets/image_1759264185138.png";
import { Link } from "wouter";

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  const getCurrentLanguageLabel = () => {
    return i18n.language === 'en-US' ? '🇺🇸 EN' : '🇧🇷 PT';
  };

  const registerMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (data.password !== data.confirmPassword) {
        throw new Error(t('register.passwordMismatch'));
      }

      const response = await apiRequest("POST", "/api/auth/register", {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        username: data.username,
        password: data.password,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: t('register.successTitle'),
        description: t('register.successDescription'),
      });
      setLocation("/");
    },
    onError: (error: any) => {
      const translatedError = error.message ? t(`register.${error.message}`, { defaultValue: error.message }) : t('register.errorDescription');
      toast({
        title: t('register.errorTitle'),
        description: translatedError,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary/98 to-primary/95 p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px]"></div>
      
      {/* Language Selector */}
      <div className="absolute top-6 right-6 z-20">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 bg-white/10 hover:bg-white/20 text-white border-white/20"
              data-testid="button-language-register"
            >
              <Globe className="h-4 w-4" />
              <span>{getCurrentLanguageLabel()}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => changeLanguage('pt-BR')}
              data-testid="menu-item-pt-BR-register"
            >
              🇧🇷 Português (BR)
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => changeLanguage('en-US')}
              data-testid="menu-item-en-US-register"
            >
              🇺🇸 English (US)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card className="w-full max-w-2xl shadow-2xl relative z-10 border-0">
        <CardContent className="p-10">
          <div className="mb-6">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground" data-testid="button-back-login">
                <ArrowLeft className="h-4 w-4" />
                {t('register.backToLogin')}
              </Button>
            </Link>
          </div>

          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="bg-white p-3 rounded-2xl shadow-xl">
                <img src={logoPath} alt="Opus Rental Capital" className="h-20 w-20" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">{t('register.title')}</h1>
            <p className="text-muted-foreground">{t('register.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm font-semibold text-foreground">{t('register.firstName')}</Label>
                <Input
                  id="firstName"
                  type="text"
                  data-testid="input-firstName"
                  placeholder={t('register.firstNamePlaceholder')}
                  value={formData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  required
                  className="h-11 border-2 focus:border-accent focus:ring-accent rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm font-semibold text-foreground">{t('register.lastName')}</Label>
                <Input
                  id="lastName"
                  type="text"
                  data-testid="input-lastName"
                  placeholder={t('register.lastNamePlaceholder')}
                  value={formData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  required
                  className="h-11 border-2 focus:border-accent focus:ring-accent rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-foreground">{t('register.email')}</Label>
              <Input
                id="email"
                type="email"
                data-testid="input-email"
                placeholder={t('register.emailPlaceholder')}
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                required
                className="h-11 border-2 focus:border-accent focus:ring-accent rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-semibold text-foreground">{t('register.username')}</Label>
              <Input
                id="username"
                type="text"
                data-testid="input-username"
                placeholder={t('register.usernamePlaceholder')}
                value={formData.username}
                onChange={(e) => handleChange('username', e.target.value)}
                required
                className="h-11 border-2 focus:border-accent focus:ring-accent rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-foreground">{t('register.password')}</Label>
                <Input
                  id="password"
                  type="password"
                  data-testid="input-password"
                  placeholder={t('register.passwordPlaceholder')}
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  required
                  minLength={6}
                  className="h-11 border-2 focus:border-accent focus:ring-accent rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-semibold text-foreground">{t('register.confirmPassword')}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  data-testid="input-confirmPassword"
                  placeholder={t('register.confirmPasswordPlaceholder')}
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  required
                  minLength={6}
                  className="h-11 border-2 focus:border-accent focus:ring-accent rounded-xl"
                />
              </div>
            </div>

            <Button
              type="submit"
              data-testid="button-register"
              className="w-full h-12 bg-accent hover:bg-accent/90 text-white font-bold text-base shadow-lg rounded-xl mt-6"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? t('register.registering') : t('register.registerButton')}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              {t('register.footer')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
