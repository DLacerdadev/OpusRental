import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Bell, Shield, Palette, Globe, CreditCard, Mail, Settings as SettingsIcon, Wallet } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type TenantBillingConfig = {
  pixKey: string | null;
  pixBeneficiary: string | null;
  bankName: string | null;
  bankAgency: string | null;
  bankAccount: string | null;
  bankAccountHolder: string | null;
  bankAccountType: string | null;
};

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();

  const isManager = user?.role === "manager";

  const { data: tenant } = useQuery<TenantBillingConfig & { id: string }>({
    queryKey: ["/api/tenant"],
    enabled: isManager,
  });

  const [billing, setBilling] = useState<TenantBillingConfig>({
    pixKey: "",
    pixBeneficiary: "",
    bankName: "",
    bankAgency: "",
    bankAccount: "",
    bankAccountHolder: "",
    bankAccountType: "",
  });

  useEffect(() => {
    if (tenant) {
      setBilling({
        pixKey: tenant.pixKey ?? "",
        pixBeneficiary: tenant.pixBeneficiary ?? "",
        bankName: tenant.bankName ?? "",
        bankAgency: tenant.bankAgency ?? "",
        bankAccount: tenant.bankAccount ?? "",
        bankAccountHolder: tenant.bankAccountHolder ?? "",
        bankAccountType: tenant.bankAccountType ?? "",
      });
    }
  }, [tenant]);

  const saveBillingMutation = useMutation({
    mutationFn: async (data: TenantBillingConfig) => {
      const payload: Record<string, string | null> = {};
      (Object.keys(data) as Array<keyof TenantBillingConfig>).forEach((key) => {
        const value = data[key];
        if (key === "bankAccountType") {
          payload[key] = value && value !== "" ? value : null;
        } else {
          payload[key] = value && value.trim() !== "" ? value.trim() : null;
        }
      });
      const res = await apiRequest("PUT", "/api/tenant", payload);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to save billing configuration");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenant"] });
      toast({
        title: t("settings.billingSaveSuccessTitle"),
        description: t("settings.billingSaveSuccessDescription"),
      });
    },
    onError: (error: any) => {
      toast({
        title: t("settings.billingSaveErrorTitle"),
        description: error?.message || t("settings.billingSaveErrorDescription"),
        variant: "destructive",
      });
    },
  });

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const updateBillingField = (key: keyof TenantBillingConfig, value: string) => {
    setBilling((prev) => ({ ...prev, [key]: value }));
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
              <div className="bg-green-50 dark:bg-green-950 p-3 rounded-2xl">
                <Palette className="h-6 w-6 text-green-600 dark:text-green-400" />
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

        {isManager && (
          <Card
            className="shadow-lg border-l-4 border-l-emerald-500 lg:col-span-2"
            data-testid="card-billing-config"
          >
            <CardHeader className="border-b bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-50 dark:bg-emerald-950 p-3 rounded-2xl">
                  <Wallet className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">{t("settings.billingConfigTitle")}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{t("settings.billingConfigDescription")}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* PIX Section */}
                <div className="p-4 bg-muted/30 rounded-xl space-y-4 border border-border">
                  <div>
                    <h3 className="font-semibold text-foreground">{t("settings.billingPixTitle")}</h3>
                    <p className="text-xs text-muted-foreground">{t("settings.billingPixDescription")}</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billing-pix-key" className="text-xs">{t("settings.billingPixKey")}</Label>
                    <Input
                      id="billing-pix-key"
                      value={billing.pixKey ?? ""}
                      onChange={(e) => updateBillingField("pixKey", e.target.value)}
                      placeholder={t("settings.billingPixKeyPlaceholder")}
                      data-testid="input-billing-pix-key"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billing-pix-beneficiary" className="text-xs">{t("settings.billingPixBeneficiary")}</Label>
                    <Input
                      id="billing-pix-beneficiary"
                      value={billing.pixBeneficiary ?? ""}
                      onChange={(e) => updateBillingField("pixBeneficiary", e.target.value)}
                      placeholder={t("settings.billingPixBeneficiaryPlaceholder")}
                      data-testid="input-billing-pix-beneficiary"
                    />
                  </div>
                </div>

                {/* Bank Transfer Section */}
                <div className="p-4 bg-muted/30 rounded-xl space-y-4 border border-border">
                  <div>
                    <h3 className="font-semibold text-foreground">{t("settings.billingBankTitle")}</h3>
                    <p className="text-xs text-muted-foreground">{t("settings.billingBankDescription")}</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billing-bank-name" className="text-xs">{t("settings.billingBankName")}</Label>
                    <Input
                      id="billing-bank-name"
                      value={billing.bankName ?? ""}
                      onChange={(e) => updateBillingField("bankName", e.target.value)}
                      data-testid="input-billing-bank-name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="billing-bank-agency" className="text-xs">{t("settings.billingBankAgency")}</Label>
                      <Input
                        id="billing-bank-agency"
                        value={billing.bankAgency ?? ""}
                        onChange={(e) => updateBillingField("bankAgency", e.target.value)}
                        data-testid="input-billing-bank-agency"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="billing-bank-account" className="text-xs">{t("settings.billingBankAccount")}</Label>
                      <Input
                        id="billing-bank-account"
                        value={billing.bankAccount ?? ""}
                        onChange={(e) => updateBillingField("bankAccount", e.target.value)}
                        data-testid="input-billing-bank-account"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billing-bank-holder" className="text-xs">{t("settings.billingBankHolder")}</Label>
                    <Input
                      id="billing-bank-holder"
                      value={billing.bankAccountHolder ?? ""}
                      onChange={(e) => updateBillingField("bankAccountHolder", e.target.value)}
                      data-testid="input-billing-bank-holder"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">{t("settings.billingBankType")}</Label>
                    <Select
                      value={billing.bankAccountType ?? ""}
                      onValueChange={(v) => updateBillingField("bankAccountType", v)}
                    >
                      <SelectTrigger data-testid="select-billing-bank-type">
                        <SelectValue placeholder={t("settings.billingBankTypePlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="checking">{t("settings.billingBankTypeChecking")}</SelectItem>
                        <SelectItem value="savings">{t("settings.billingBankTypeSavings")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => saveBillingMutation.mutate(billing)}
                  disabled={saveBillingMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  data-testid="button-save-billing"
                >
                  {saveBillingMutation.isPending
                    ? t("settings.billingSaving")
                    : t("settings.billingSave")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isManager && (
          <Card className="shadow-lg border-l-4 border-l-blue-500 lg:col-span-2">
            <CardHeader className="border-b bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-2xl">
                  <SettingsIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">{t('settings.systemIntegrations')}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{t('settings.systemIntegrationsDesc')}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Stripe Configuration */}
                <div className="p-4 bg-muted/30 rounded-xl space-y-4 border border-border">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-50 dark:bg-purple-950 p-2 rounded-lg">
                      <CreditCard className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{t('settings.stripeTitle')}</h3>
                      <p className="text-xs text-muted-foreground">{t('settings.stripeDesc')}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="stripe-public-key" className="text-xs">{t('settings.publishableKey')}</Label>
                      <Input 
                        id="stripe-public-key" 
                        placeholder="pk_live_..." 
                        data-testid="input-stripe-public-key"
                        className="font-mono text-xs"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stripe-secret-key" className="text-xs">{t('settings.secretKey')}</Label>
                      <Input 
                        id="stripe-secret-key" 
                        type="password" 
                        placeholder="sk_live_..." 
                        data-testid="input-stripe-secret-key"
                        className="font-mono text-xs"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stripe-webhook-secret" className="text-xs">{t('settings.webhookSecret')}</Label>
                      <Input 
                        id="stripe-webhook-secret" 
                        type="password" 
                        placeholder="whsec_..." 
                        data-testid="input-stripe-webhook-secret"
                        className="font-mono text-xs"
                      />
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2">
                        <Switch data-testid="switch-stripe-test-mode" />
                        <span className="text-xs text-muted-foreground">{t('settings.testMode')}</span>
                      </div>
                      <Button size="sm" variant="outline" data-testid="button-save-stripe">
                        {t('settings.saveConfiguration')}
                      </Button>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-border">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{t('settings.status')}</span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-green-600 dark:text-green-400 font-medium">{t('settings.connected')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SMTP Configuration */}
                <div className="p-4 bg-muted/30 rounded-xl space-y-4 border border-border">
                  <div className="flex items-center gap-3">
                    <div className="bg-orange-50 dark:bg-orange-950 p-2 rounded-lg">
                      <Mail className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{t('settings.emailServiceTitle')}</h3>
                      <p className="text-xs text-muted-foreground">{t('settings.emailServiceDesc')}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="smtp-host" className="text-xs">{t('settings.smtpHost')}</Label>
                      <Input 
                        id="smtp-host" 
                        placeholder="smtp.example.com" 
                        data-testid="input-smtp-host"
                        className="text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="smtp-port" className="text-xs">{t('settings.port')}</Label>
                        <Input 
                          id="smtp-port" 
                          placeholder="587" 
                          data-testid="input-smtp-port"
                          className="text-xs"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smtp-from" className="text-xs">{t('settings.fromAddress')}</Label>
                        <Input 
                          id="smtp-from" 
                          placeholder="noreply@..." 
                          data-testid="input-smtp-from"
                          className="text-xs"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtp-user" className="text-xs">{t('settings.username')}</Label>
                      <Input 
                        id="smtp-user" 
                        placeholder="smtp-username" 
                        data-testid="input-smtp-user"
                        className="text-xs"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtp-pass" className="text-xs">{t('settings.password')}</Label>
                      <Input 
                        id="smtp-pass" 
                        type="password" 
                        placeholder="••••••••" 
                        data-testid="input-smtp-pass"
                        className="text-xs"
                      />
                    </div>
                    <div className="flex justify-end pt-2">
                      <Button size="sm" variant="outline" data-testid="button-save-smtp">
                        {t('settings.saveConfiguration')}
                      </Button>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-border">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{t('settings.status')}</span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-yellow-500" />
                        <span className="text-yellow-600 dark:text-yellow-400 font-medium">{t('settings.usingDevMock')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-900">
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                      <SettingsIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 text-sm">{t('settings.configurationNote')}</h4>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      {t('settings.configurationNoteDesc')}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" variant="outline" className="text-xs h-8" data-testid="button-view-docs">
                        {t('settings.viewDocumentation')}
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs h-8" data-testid="button-test-connection">
                        {t('settings.testConnection')}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
