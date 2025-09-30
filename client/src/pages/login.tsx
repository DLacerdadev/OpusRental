import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import logoPath from "@assets/Imagem do WhatsApp de 2025-09-30 à(s) 11.49.20_a02dcb9b_1759262288763.jpg";

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
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="bg-primary p-3 rounded-full">
                <img src={logoPath} alt="Opus Rental Capital" className="h-16 w-16 rounded-full" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Opus Rental Capital</h1>
            <p className="text-sm text-muted-foreground">Acesso ao Sistema de Investimentos</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                data-testid="input-email"
                placeholder="investidor@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">Senha</Label>
              <Input
                id="password"
                type="password"
                data-testid="input-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-10"
              />
            </div>

            <Button
              type="submit"
              data-testid="button-login"
              className="w-full h-10 bg-primary hover:bg-primary/90 font-medium mt-6"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Entrando..." : "Entrar no Sistema"}
            </Button>

            <div className="text-center pt-2">
              <a href="#" className="text-sm text-primary hover:underline">
                Esqueci minha senha
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
