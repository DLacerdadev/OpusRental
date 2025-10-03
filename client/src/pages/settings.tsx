import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { User, Bell, Shield, Palette, Globe } from "lucide-react";

export default function Settings() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-1">Gerencie suas preferências e configurações</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg border-l-4 border-l-accent">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="bg-accent/10 p-3 rounded-2xl">
                <User className="h-6 w-6 text-accent" />
              </div>
              <CardTitle className="text-lg font-bold">Perfil do Usuário</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input id="name" placeholder="Seu nome" data-testid="input-name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="seu@email.com" data-testid="input-email" />
            </div>
            <Button className="bg-accent hover:bg-accent/90 w-full" data-testid="button-save-profile">
              Salvar Alterações
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-l-4 border-l-primary">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-3 rounded-2xl">
                <Bell className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg font-bold">Notificações</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
              <div>
                <p className="font-semibold text-foreground">Email de Pagamentos</p>
                <p className="text-sm text-muted-foreground">Receber notificações de pagamentos</p>
              </div>
              <Switch data-testid="switch-email-payments" />
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
              <div>
                <p className="font-semibold text-foreground">Relatórios Mensais</p>
                <p className="text-sm text-muted-foreground">Resumo mensal por email</p>
              </div>
              <Switch data-testid="switch-monthly-reports" />
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
              <div>
                <p className="font-semibold text-foreground">Alertas de GPS</p>
                <p className="text-sm text-muted-foreground">Notificações de rastreamento</p>
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
              <CardTitle className="text-lg font-bold">Segurança</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Senha Atual</Label>
              <Input id="current-password" type="password" data-testid="input-current-password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova Senha</Label>
              <Input id="new-password" type="password" data-testid="input-new-password" />
            </div>
            <Button className="bg-secondary hover:bg-secondary/90 w-full" data-testid="button-change-password">
              Alterar Senha
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-l-4 border-l-green-500">
          <CardHeader className="border-b bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="bg-green-50 p-3 rounded-2xl">
                <Palette className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-lg font-bold">Preferências</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
              <div>
                <p className="font-semibold text-foreground">Tema Escuro</p>
                <p className="text-sm text-muted-foreground">Alternar modo escuro</p>
              </div>
              <Switch data-testid="switch-dark-mode" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">Idioma</Label>
              <select 
                id="language" 
                className="w-full px-3 py-2 border border-border rounded-xl bg-background"
                data-testid="select-language"
              >
                <option value="pt-BR">Português (Brasil)</option>
                <option value="en-US">English (US)</option>
                <option value="es-ES">Español</option>
              </select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
