import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, Lock, TrendingUp, MapPin, DollarSign, 
  CheckCircle, ArrowRight, Award, BarChart3, FileText
} from "lucide-react";
import { useTranslation } from "react-i18next";
import logoPath from "@assets/image_1759264185138.png";

export default function Landing() {
  const { t, i18n } = useTranslation();

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white border-b border-gray-200 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img src={logoPath} alt="Opus" className="h-10 w-10" />
              <span className="text-xl font-bold text-gray-900">Opus Rental Capital</span>
            </div>
            
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  const newLang = i18n.language.startsWith("en") ? "pt-BR" : "en-US";
                  i18n.changeLanguage(newLang);
                  localStorage.setItem('language', newLang);
                }}
                className="text-gray-700 font-semibold"
                data-testid="button-language-toggle"
              >
                {i18n.language.startsWith("en") ? "PT" : "EN"}
              </Button>
              <Link href="/login">
                <Button 
                  variant="ghost" 
                  className="text-gray-700 font-semibold"
                  data-testid="button-login"
                >
                  {t('landing.nav.login', 'Login')}
                </Button>
              </Link>
              <Link href="/register">
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                  data-testid="button-register"
                >
                  {t('landing.nav.getStarted', 'Criar Conta')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-6 bg-blue-50 text-blue-700 border-blue-200 px-6 py-2 text-sm font-bold" data-testid="badge-security">
              <Shield className="h-4 w-4 mr-2" />
              Regulamentado • Auditado • Seguro
            </Badge>
            
            <h1 className="text-5xl lg:text-7xl font-black text-gray-900 mb-6" data-testid="text-hero-title">
              Investimentos em Trailers
              <br />
              <span className="text-blue-600">Com Retorno Garantido</span>
            </h1>
            
            <p className="text-2xl text-gray-600 max-w-4xl mx-auto mb-10 font-medium" data-testid="text-hero-description">
              24% ao ano. R$ 28.000 por cota. Rastreamento GPS 24/7. 
              Transparência total.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link href="/register">
                <Button 
                  size="lg" 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-black text-lg px-12 h-14"
                  data-testid="button-start-investing"
                >
                  Começar a Investir
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-2 border-gray-900 text-gray-900 hover:bg-gray-50 font-black text-lg px-12 h-14"
                  data-testid="button-client-portal"
                >
                  Área do Cliente
                </Button>
              </Link>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {[
                { icon: TrendingUp, value: "24%", label: "Retorno Anual", color: "bg-green-50 border-green-200 text-green-700" },
                { icon: DollarSign, value: "R$ 28K", label: "Por Cota", color: "bg-blue-50 border-blue-200 text-blue-700" },
                { icon: Shield, value: "100%", label: "Asset-Backed", color: "bg-purple-50 border-purple-200 text-purple-700" },
                { icon: MapPin, value: "24/7", label: "Rastreamento GPS", color: "bg-orange-50 border-orange-200 text-orange-700" }
              ].map((metric, i) => (
                <Card key={i} className={`${metric.color} border-2`} data-testid={`card-metric-${i}`}>
                  <CardContent className="pt-6 pb-6 text-center">
                    <metric.icon className="h-8 w-8 mx-auto mb-3" />
                    <div className="text-3xl font-black mb-1">{metric.value}</div>
                    <div className="text-sm font-bold">{metric.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "R$ 42M", label: "Ativos Sob Gestão" },
              { value: "2.847", label: "Trailers Ativos" },
              { value: "2.500+", label: "Investidores" },
              { value: "100%", label: "Pagamentos em Dia" }
            ].map((stat, i) => (
              <div key={i} data-testid={`stat-${i}`}>
                <div className="text-4xl font-black text-gray-900 mb-2">{stat.value}</div>
                <div className="text-sm font-semibold text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-gray-900 mb-4" data-testid="text-security-title">
              Segurança Institucional
            </h2>
            <p className="text-xl text-gray-600 font-medium">
              Proteção em cada etapa do seu investimento
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-2 border-gray-200" data-testid="card-data-protection">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Lock className="h-6 w-6 text-blue-600" />
                  </div>
                  <span className="text-gray-900 font-black">Proteção de Dados</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  "Criptografia 256-bit SSL/TLS",
                  "Certificação SOC 2 Type II",
                  "Autenticação Multi-Fator",
                  "Auditorias Trimestrais"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3" data-testid={`security-item-${i}`}>
                    <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <span className="text-gray-700 font-medium">{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-200" data-testid="card-compliance">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                    <Shield className="h-6 w-6 text-green-600" />
                  </div>
                  <span className="text-gray-900 font-black">Conformidade Legal</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  "Auditorias Independentes",
                  "Contratos Revisados por Advogados",
                  "Relatórios Financeiros Mensais",
                  "Conformidade Regulatória"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3" data-testid={`compliance-item-${i}`}>
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700 font-medium">{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-gray-900 mb-4" data-testid="text-how-title">
              Como Funciona
            </h2>
            <p className="text-xl text-gray-600 font-medium">
              Comece a investir em 4 passos simples
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { num: "01", icon: FileText, title: "Cadastro", desc: "Verificação KYC em 5 minutos" },
              { num: "02", icon: BarChart3, title: "Escolha Ativos", desc: "Navegue pelos trailers disponíveis" },
              { num: "03", icon: DollarSign, title: "Invista", desc: "Transferência segura" },
              { num: "04", icon: TrendingUp, title: "Receba Mensalmente", desc: "Retornos automatizados" }
            ].map((step, i) => (
              <Card key={i} className="border-2 border-gray-200 text-center" data-testid={`step-${i}`}>
                <CardContent className="pt-8 pb-6">
                  <div className="text-5xl font-black text-gray-200 mb-4">{step.num}</div>
                  <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center mx-auto mb-4">
                    <step.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-gray-600 font-medium">{step.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Investment Details */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-gray-900 mb-4" data-testid="text-details-title">
              Estrutura do Investimento
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "R$ 28.000",
                subtitle: "Investimento por Cota",
                points: [
                  "1 cota = 1 trailer comercial",
                  "R$ 560 retorno mensal garantido",
                  "Taxa fixa de 2% ao mês (24% a.a.)",
                  "Certificado de propriedade direta"
                ]
              },
              {
                title: "R$ 1.500",
                subtitle: "Receita Mensal de Aluguel",
                points: [
                  "Locados para transportadoras verificadas",
                  "Contratos de 3-12 meses",
                  "Operações com seguro",
                  "Gestão profissional da frota"
                ]
              },
              {
                title: "24/7",
                subtitle: "Rastreamento GPS em Tempo Real",
                points: [
                  "Monitoramento de localização ao vivo",
                  "Alertas e histórico de movimento",
                  "Rastreamento de saúde do ativo",
                  "Monitoramento de depreciação"
                ]
              }
            ].map((item, i) => (
              <Card key={i} className="border-2 border-gray-200" data-testid={`detail-card-${i}`}>
                <CardContent className="pt-8 pb-6">
                  <div className="text-4xl font-black text-gray-900 mb-2">{item.title}</div>
                  <div className="text-lg font-semibold text-gray-600 mb-6">{item.subtitle}</div>
                  <div className="space-y-3">
                    {item.points.map((point, j) => (
                      <div key={j} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 font-medium">{point}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-black text-white mb-6" data-testid="text-cta-title">
            Pronto para Começar?
          </h2>
          <p className="text-2xl text-blue-100 mb-10 font-medium" data-testid="text-cta-description">
            Junte-se a milhares de investidores ganhando retornos garantidos
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button 
                size="lg"
                className="bg-white hover:bg-gray-100 text-blue-600 font-black text-xl px-12 h-16"
                data-testid="button-cta-register"
              >
                Abrir Sua Conta
                <ArrowRight className="ml-2 h-6 w-6" />
              </Button>
            </Link>
            <Link href="/login">
              <Button 
                variant="outline" 
                size="lg"
                className="border-2 border-white text-white hover:bg-blue-700 font-black text-xl px-12 h-16"
                data-testid="button-cta-login"
              >
                Acessar Portal do Cliente
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <img src={logoPath} alt="Opus" className="h-8 w-8" />
                <span className="font-black text-white text-lg">Opus Rental Capital</span>
              </div>
              <p className="text-gray-400 font-medium">
                Gestão profissional de ativos entregando retornos garantidos desde 2020.
              </p>
            </div>

            <div>
              <h3 className="font-black text-white mb-4">Empresa</h3>
              <ul className="space-y-2">
                {["Sobre", "Carreiras", "Imprensa"].map((link, i) => (
                  <li key={i}>
                    <a href="#" className="text-gray-400 hover:text-white font-medium">{link}</a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-black text-white mb-4">Legal</h3>
              <ul className="space-y-2">
                {["Termos", "Privacidade", "Conformidade"].map((link, i) => (
                  <li key={i}>
                    <a href="#" className="text-gray-400 hover:text-white font-medium">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 font-medium">
              © 2025 Opus Rental Capital. Todos os direitos reservados.
            </p>
            <p className="text-sm text-gray-500">
              Investimentos envolvem risco. O desempenho passado não garante resultados futuros.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
