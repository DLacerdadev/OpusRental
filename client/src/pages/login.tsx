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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary/98 to-primary/95 p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px]"></div>
      
      <Card className="w-full max-w-lg shadow-2xl relative z-10 border-0">
        <CardContent className="p-10">
          <div className="text-center mb-10">
            <div className="flex justify-center mb-6">
              <div className="bg-white p-3 rounded-2xl shadow-xl">
                <img src={logoPath} alt="Opus Rental Capital" className="h-20 w-20" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Opus Rental Capital</h1>
            <p className="text-muted-foreground">Plataforma de Investimentos</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-foreground">E-mail</Label>
              <Input
                id="email"
                type="email"
                data-testid="input-email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 border-2 focus:border-accent focus:ring-accent rounded-xl"
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
                className="h-12 border-2 focus:border-accent focus:ring-accent rounded-xl"
              />
            </div>

            <Button
              type="submit"
              data-testid="button-login"
              className="w-full h-12 bg-accent hover:bg-accent/90 text-white font-bold text-base shadow-lg rounded-xl"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Entrando..." : "Acessar Plataforma"}
            </Button>

            <div className="text-center">
              <a href="#" className="text-sm text-accent hover:underline font-medium">
                Esqueci minha senha
              </a>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              Investimentos em trailers de carga • Mercado norte-americano
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
