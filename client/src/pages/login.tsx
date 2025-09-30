import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import logoPath from "@assets/image_1759264185138.png";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/login", credentials);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Login Successful",
        description: "Welcome to Opus Rental Capital",
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      
      <Card className="w-full max-w-md shadow-2xl relative z-10 border-accent/20">
        <CardContent className="p-10">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="bg-accent p-2 rounded-2xl shadow-lg">
                <img src={logoPath} alt="Opus Rental Capital" className="h-20 w-20" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Opus Rental Capital</h1>
            <p className="text-sm text-muted-foreground">Sistema de Gestão de Investimentos</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                data-testid="input-email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 border-2 focus:border-accent focus:ring-accent"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-foreground">Senha</Label>
              <Input
                id="password"
                type="password"
                data-testid="input-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 border-2 focus:border-accent focus:ring-accent"
              />
            </div>

            <Button
              type="submit"
              data-testid="button-login"
              className="w-full h-12 bg-accent hover:bg-accent/90 text-primary font-bold text-base mt-6 shadow-lg"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Entrando..." : "Acessar Plataforma"}
            </Button>

            <div className="text-center pt-2">
              <a href="#" className="text-sm text-accent hover:underline font-medium">
                Esqueci minha senha
              </a>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              Investimentos em trailers de carga nos EUA
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
