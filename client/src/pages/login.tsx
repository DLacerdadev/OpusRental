import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe, Lock, Mail, Shield, CheckCircle2, ArrowLeft } from "lucide-react";
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
      {/* Animated grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#2196F308_1px,transparent_1px),linear-gradient(to_bottom,#2196F308_1px,transparent_1px)] bg-[size:60px_60px]"></div>
      
      {/* Gradient orbs */}
      <div className="absolute top-0 left-0 w-[700px] h-[700px] bg-gradient-to-br from-[#2196F3]/15 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-[700px] h-[700px] bg-gradient-to-tl from-[#2196F3]/15 to-transparent rounded-full blur-3xl"></div>
      
      {/* Back to Landing */}
      <div className="absolute top-6 left-6 z-20">
        <Link href="/">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 bg-[#0D2847]/80 hover:bg-[#0D2847] text-white border-[#2196F3]/40 backdrop-blur-xl shadow-lg"
            data-testid="button-back-to-landing"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="font-semibold">Início</span>
          </Button>
        </Link>
      </div>

      {/* Language Selector */}
      <div className="absolute top-6 right-6 z-20">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 bg-[#0D2847]/80 hover:bg-[#0D2847] text-white border-[#2196F3]/40 backdrop-blur-xl shadow-lg"
              data-testid="button-language-login"
            >
              <Globe className="h-4 w-4" />
              <span className="font-semibold">{getCurrentLanguageLabel()}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-[#0D2847] border-[#2196F3]/30 backdrop-blur-xl">
            <DropdownMenuItem
              onClick={() => changeLanguage('pt-BR')}
              className="text-white hover:bg-[#2196F3]/20 cursor-pointer"
              data-testid="menu-item-pt-BR-login"
            >
              🇧🇷 Português (BR)
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => changeLanguage('en-US')}
              className="text-white hover:bg-[#2196F3]/20 cursor-pointer"
              data-testid="menu-item-en-US-login"
            >
              🇺🇸 English (US)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Card className="w-full max-w-md shadow-2xl shadow-[#2196F3]/30 relative z-10 border-2 border-[#2196F3]/30 bg-white overflow-hidden">
        {/* Borda superior animada */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#2196F3] via-[#0D2847] to-[#2196F3]" />

        <div className="p-10">
          {/* Logo section */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-[#2196F3]/20 rounded-xl blur-lg"></div>
                <div className="relative bg-gradient-to-br from-[#2196F3]/10 to-[#0D2847]/10 p-3 rounded-xl border-2 border-[#2196F3]/20">
                  <img src={logoPath} alt="Opus Rental Capital" className="h-12 w-12" />
                </div>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-[#0D2847] mb-1">
              {t('login.title')}
            </h1>
            <p className="text-[#0D2847]/70 text-sm font-medium">
              {t('login.subtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Email field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-bold text-[#0D2847] flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#2196F3]" />
                {t('login.email')}
              </Label>
              <Input
                id="email"
                type="email"
                data-testid="input-email"
                placeholder={t('login.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 border-2 border-[#2196F3]/20 focus:border-[#2196F3] focus:ring-2 focus:ring-[#2196F3]/20 rounded-lg text-base bg-white"
              />
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-bold text-[#0D2847] flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#2196F3]" />
                {t('login.password')}
              </Label>
              <Input
                id="password"
                type="password"
                data-testid="input-password"
                placeholder={t('login.passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 border-2 border-[#2196F3]/20 focus:border-[#2196F3] focus:ring-2 focus:ring-[#2196F3]/20 rounded-lg text-base bg-white"
              />
            </div>

            {/* Login button */}
            <Button
              type="submit"
              data-testid="button-login"
              className="w-full h-13 bg-gradient-to-r from-[#2196F3] to-[#0D2847] hover:from-[#1976D2] hover:to-[#0a1f38] text-white font-bold text-base shadow-xl shadow-[#2196F3]/30 rounded-lg transition-all mt-6"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  {t('login.loggingIn')}
                </div>
              ) : (
                t('login.loginButton')
              )}
            </Button>

            {/* Links */}
            <div className="flex justify-between items-center text-sm pt-1">
              <a href="#" className="text-[#2196F3] hover:text-[#1976D2] font-semibold hover:underline transition-colors">
                {t('login.forgotPassword')}
              </a>
              <Link href="/register" className="text-[#2196F3] hover:text-[#1976D2] font-semibold hover:underline transition-colors" data-testid="link-register">
                {t('login.createAccount')}
              </Link>
            </div>
          </form>

          {/* Badges de Segurança */}
          <div className="mt-8 pt-6 border-t-2 border-[#2196F3]/10">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-full bg-[#2196F3]/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-[#2196F3]" />
                </div>
                <span className="text-xs font-semibold text-[#0D2847]/60">SSL</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-full bg-[#2196F3]/10 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-[#2196F3]" />
                </div>
                <span className="text-xs font-semibold text-[#0D2847]/60">Criptografia</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-full bg-[#2196F3]/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-[#2196F3]" />
                </div>
                <span className="text-xs font-semibold text-[#0D2847]/60">LGPD</span>
              </div>
            </div>
            <p className="text-xs text-[#0D2847]/50 font-medium text-center mt-4 leading-relaxed">
              {t('login.footer')}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
