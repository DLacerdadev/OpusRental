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
import { Globe, Lock, Mail, Sparkles } from "lucide-react";
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
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#2196F310_1px,transparent_1px),linear-gradient(to_bottom,#2196F310_1px,transparent_1px)] bg-[size:40px_40px] animate-pulse" style={{ animationDuration: '3s' }}></div>
      
      {/* Gradient orbs - larger and more vibrant */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-gradient-to-br from-[#2196F3]/20 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }}></div>
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-gradient-to-tl from-[#2196F3]/20 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }}></div>
      
      {/* Floating particles effect */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-[#2196F3] rounded-full opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${5 + Math.random() * 10}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
      
      {/* Language Selector */}
      <div className="absolute top-6 right-6 z-20">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 bg-white/10 hover:bg-white/20 text-white border-[#2196F3]/40 backdrop-blur-md shadow-lg shadow-[#2196F3]/20 transition-all"
              data-testid="button-language-login"
            >
              <Globe className="h-4 w-4" />
              <span className="font-medium">{getCurrentLanguageLabel()}</span>
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

      <Card className="w-full max-w-md shadow-2xl shadow-[#2196F3]/30 relative z-10 border-2 border-[#2196F3]/30 bg-white/95 backdrop-blur-xl overflow-hidden">
        {/* Animated top border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#2196F3] via-[#0D2847] to-[#2196F3] animate-pulse" style={{ animationDuration: '2s' }} />
        
        {/* Sparkle effect in corner */}
        <div className="absolute top-4 right-4 text-[#2196F3]/20">
          <Sparkles className="w-6 h-6 animate-pulse" style={{ animationDuration: '3s' }} />
        </div>

        <div className="p-10">
          {/* Logo section */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6 relative">
              <div className="absolute inset-0 bg-[#2196F3]/20 rounded-3xl blur-2xl"></div>
              <div className="relative bg-gradient-to-br from-[#2196F3]/15 to-[#0D2847]/15 p-5 rounded-3xl shadow-2xl border-2 border-[#2196F3]/30">
                <img src={logoPath} alt="Opus Rental Capital" className="h-24 w-24" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-[#0D2847] mb-2 tracking-tight">
              {t('login.title')}
            </h1>
            <p className="text-[#0D2847]/70 text-base font-medium">
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
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  data-testid="input-email"
                  placeholder={t('login.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 border-2 border-[#2196F3]/30 focus:border-[#2196F3] focus:ring-2 focus:ring-[#2196F3]/20 rounded-xl pl-4 pr-4 text-base transition-all bg-white/80"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-bold text-[#0D2847] flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#2196F3]" />
                {t('login.password')}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type="password"
                  data-testid="input-password"
                  placeholder={t('login.passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 border-2 border-[#2196F3]/30 focus:border-[#2196F3] focus:ring-2 focus:ring-[#2196F3]/20 rounded-xl pl-4 pr-4 text-base transition-all bg-white/80"
                />
              </div>
            </div>

            {/* Login button */}
            <Button
              type="submit"
              data-testid="button-login"
              className="w-full h-14 bg-gradient-to-r from-[#2196F3] to-[#0D2847] hover:from-[#1976D2] hover:to-[#0a1f38] text-white font-bold text-lg shadow-xl shadow-[#2196F3]/40 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] mt-2"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                  {t('login.loggingIn')}
                </div>
              ) : (
                t('login.loginButton')
              )}
            </Button>

            {/* Links */}
            <div className="flex justify-between items-center text-sm pt-2">
              <a href="#" className="text-[#2196F3] hover:text-[#1976D2] font-semibold hover:underline transition-colors">
                {t('login.forgotPassword')}
              </a>
              <Link href="/register" className="text-[#2196F3] hover:text-[#1976D2] font-semibold hover:underline transition-colors" data-testid="link-register">
                {t('login.createAccount')}
              </Link>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t-2 border-[#2196F3]/20 text-center">
            <p className="text-xs text-[#0D2847]/60 font-medium leading-relaxed">
              {t('login.footer')}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
