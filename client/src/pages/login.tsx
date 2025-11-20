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
import { Globe } from "lucide-react";
import logoPath from "@assets/image_1759264185138.png";
import { Link } from "wouter";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  const getCurrentLanguageLabel = () => {
    return i18n.language === 'en-US' ? '🇺🇸 EN' : '🇧🇷 PT';
  };

  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/login", credentials);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: t('login.successTitle'),
        description: t('login.successDescription'),
      });
      setLocation("/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: t('login.errorTitle'),
        description: error.message || t('login.errorDescription'),
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0D2847] via-[#0a1f38] to-[#0D2847] p-4 relative overflow-hidden">
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#2196F308_1px,transparent_1px),linear-gradient(to_bottom,#2196F308_1px,transparent_1px)] bg-[size:32px_32px]"></div>
      
      {/* Gradient orbs */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#2196F3]/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#2196F3]/10 rounded-full blur-3xl"></div>
      
      {/* Language Selector */}
      <div className="absolute top-6 right-6 z-20">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 bg-white/10 hover:bg-white/20 text-white border-[#2196F3]/30 backdrop-blur-sm"
              data-testid="button-language-login"
            >
              <Globe className="h-4 w-4" />
              <span>{getCurrentLanguageLabel()}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-[#0D2847] border-[#2196F3]/30">
            <DropdownMenuItem
              onClick={() => changeLanguage('pt-BR')}
              className="text-white hover:bg-[#2196F3]/20"
              data-testid="menu-item-pt-BR-login"
            >
              🇧🇷 Português (BR)
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => changeLanguage('en-US')}
              className="text-white hover:bg-[#2196F3]/20"
              data-testid="menu-item-en-US-login"
            >
              🇺🇸 English (US)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card className="w-full max-w-lg shadow-2xl shadow-[#2196F3]/20 relative z-10 border border-[#2196F3]/20 bg-white">
        <CardContent className="p-10">
          {/* Borda superior azul */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#2196F3] to-transparent" />
          
          <div className="text-center mb-10">
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-br from-[#2196F3]/10 to-[#0D2847]/10 p-4 rounded-2xl shadow-xl border border-[#2196F3]/20">
                <img src={logoPath} alt="Opus Rental Capital" className="h-20 w-20" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-[#0D2847] mb-2">{t('login.title')}</h1>
            <p className="text-[#0D2847]/60">{t('login.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-[#0D2847]">{t('login.email')}</Label>
              <Input
                id="email"
                type="email"
                data-testid="input-email"
                placeholder={t('login.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 border-2 border-[#2196F3]/20 focus:border-[#2196F3] focus:ring-[#2196F3]/20 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-[#0D2847]">{t('login.password')}</Label>
              <Input
                id="password"
                type="password"
                data-testid="input-password"
                placeholder={t('login.passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 border-2 border-[#2196F3]/20 focus:border-[#2196F3] focus:ring-[#2196F3]/20 rounded-xl"
              />
            </div>

            <Button
              type="submit"
              data-testid="button-login"
              className="w-full h-12 bg-[#2196F3] hover:bg-[#2196F3]/90 text-white font-bold text-base shadow-lg shadow-[#2196F3]/30 rounded-xl border border-[#2196F3]/50"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? t('login.loggingIn') : t('login.loginButton')}
            </Button>

            <div className="flex justify-between items-center text-sm">
              <a href="#" className="text-[#2196F3] hover:underline font-medium">
                {t('login.forgotPassword')}
              </a>
              <Link href="/register" className="text-[#2196F3] hover:underline font-medium" data-testid="link-register">
                {t('login.createAccount')}
              </Link>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-[#2196F3]/20 text-center">
            <p className="text-xs text-[#0D2847]/50">
              {t('login.footer')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
