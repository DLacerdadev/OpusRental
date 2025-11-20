import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, TrendingUp, MapPin, DollarSign, CheckCircle, ArrowRight, Award
} from "lucide-react";
import { useTranslation } from "react-i18next";
import logoPath from "@assets/image_1759264185138.png";

export default function Landing() {
  const { t, i18n } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <div className="border-b border-border bg-muted/30">
        <div className="max-w-7xl mx-auto px-6 py-2 flex justify-end items-center gap-6 text-sm">
          <span className="text-muted-foreground">Suporte</span>
          <span className="text-muted-foreground">Para Institucionais</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="border-b border-border bg-background sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-12">
              <div className="flex items-center gap-2">
                <img src={logoPath} alt="Opus" className="h-8 w-8" />
                <span className="text-xl font-bold text-foreground">opusrentalcapital</span>
              </div>
              
              <div className="hidden md:flex items-center gap-6 text-sm">
                <button className="text-foreground hover:text-foreground/80">Investimentos</button>
                <button className="text-foreground hover:text-foreground/80">Condições</button>
                <button className="text-foreground hover:text-foreground/80">Ferramentas</button>
                <button className="text-foreground hover:text-foreground/80">Sobre</button>
                <button className="text-foreground hover:text-foreground/80">Parceiros</button>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  const newLang = i18n.language.startsWith("en") ? "pt-BR" : "en-US";
                  i18n.changeLanguage(newLang);
                  localStorage.setItem('language', newLang);
                }}
                data-testid="button-language-toggle"
              >
                🌐
              </Button>
              <Link href="/register">
                <Button 
                  variant="default"
                  size="sm"
                  className="font-semibold"
                  data-testid="button-open-account"
                >
                  Abrir Conta
                </Button>
              </Link>
              <Link href="/login">
                <Button 
                  variant="outline"
                  size="sm"
                  className="font-semibold"
                  data-testid="button-client-portal"
                >
                  🔒 Portal do Cliente
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Left Content */}
            <div className="pt-8">
              <h1 className="text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight" data-testid="text-hero-title">
                Investimentos institucionais<br />
                acessíveis para todos
              </h1>
              
              <p className="text-xl text-muted-foreground mb-10 leading-relaxed max-w-xl" data-testid="text-hero-description">
                Invista em trailers comerciais com precisão institucional, 
                condições transparentes e uma plataforma desenvolvida para 
                investidores sérios.
              </p>

              <div className="flex gap-4 mb-12">
                <Link href="/register">
                  <Button 
                    size="lg"
                    className="font-semibold text-base h-12 px-8"
                    data-testid="button-start-investing"
                  >
                    Abrir Conta
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  size="lg"
                  className="font-semibold text-base h-12 px-6"
                  data-testid="button-explore-conditions"
                >
                  Explorar condições
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              {/* Award Badge */}
              <div className="flex items-center gap-3 mb-8">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <Award className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <div className="font-bold text-foreground">UF Awards LATAM</div>
                  <div className="text-sm text-muted-foreground">Melhor Corretora Multi-Ativos Institucional LATAM 2025</div>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-foreground" />
                  <span className="text-foreground font-medium">Regulamentado globalmente</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-foreground" />
                  <span className="text-foreground font-medium">Suporte premium</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-foreground" />
                  <span className="text-foreground font-medium">Proteção de fundos</span>
                </div>
              </div>
            </div>

            {/* Right: Investment Instruments */}
            <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold text-foreground">Instrumento</h3>
                <h3 className="font-semibold text-foreground">Movimento de preço de mercado</h3>
              </div>

              <div className="space-y-4">
                {[
                  {
                    icon: "🚛",
                    name: "TRAILER-BR",
                    desc: "Trailer Comercial Brasil",
                    color: "bg-chart-2"
                  },
                  {
                    icon: "💰",
                    name: "RBRL",
                    desc: "Real Brasileiro",
                    color: "bg-chart-3"
                  },
                  {
                    icon: "📊",
                    name: "IBOV",
                    desc: "Índice Bovespa",
                    color: "bg-chart-1"
                  },
                  {
                    icon: "⛽",
                    name: "DIESEL",
                    desc: "Diesel Futuros",
                    color: "bg-chart-4"
                  }
                ].map((item, i) => (
                  <div 
                    key={i} 
                    className="flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    data-testid={`instrument-${i}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-lg ${item.color} flex items-center justify-center text-2xl`}>
                        {item.icon}
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">{item.name}</div>
                        <div className="text-sm text-muted-foreground">{item.desc}</div>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-muted-foreground">–</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6 bg-muted/30 border-y border-border">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "R$ 42M", label: "Ativos sob gestão" },
              { value: "2.847", label: "Trailers ativos" },
              { value: "2.500+", label: "Investidores ativos" },
              { value: "100%", label: "Pagamentos no prazo (48 meses)" }
            ].map((stat, i) => (
              <div key={i} className="text-center" data-testid={`stat-${i}`}>
                <div className="text-3xl md:text-4xl font-bold text-foreground mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Por que escolher Opus Rental Capital
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Segurança, transparência e retornos consistentes
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: TrendingUp,
                title: "24% a.a.",
                subtitle: "Retorno Garantido",
                desc: "Taxa fixa de 2% ao mês sobre investimento de R$ 28.000 por cota",
                color: "text-chart-3"
              },
              {
                icon: Shield,
                title: "100%",
                subtitle: "Asset-Backed",
                desc: "Cada cota representa 1 trailer comercial físico rastreado por GPS",
                color: "text-chart-1"
              },
              {
                icon: MapPin,
                title: "24/7",
                subtitle: "Rastreamento GPS",
                desc: "Monitoramento em tempo real de localização e status de todos os ativos",
                color: "text-chart-4"
              }
            ].map((feature, i) => (
              <Card key={i} className="border border-border" data-testid={`feature-card-${i}`}>
                <CardContent className="pt-8 pb-6">
                  <feature.icon className={`h-12 w-12 ${feature.color} mb-6`} />
                  <div className="text-3xl font-bold text-foreground mb-1">{feature.title}</div>
                  <div className="text-lg font-semibold text-foreground mb-4">{feature.subtitle}</div>
                  <p className="text-muted-foreground">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Segurança de nível institucional
            </h2>
            <p className="text-xl text-muted-foreground">
              Proteção em cada etapa do seu investimento
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border border-border">
              <CardContent className="pt-8 pb-6">
                <h3 className="text-2xl font-bold text-foreground mb-6">Proteção de Dados</h3>
                <div className="space-y-4">
                  {[
                    "Criptografia 256-bit SSL/TLS",
                    "Certificação SOC 2 Type II",
                    "Autenticação multi-fator",
                    "Auditorias de segurança trimestrais"
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-chart-1 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardContent className="pt-8 pb-6">
                <h3 className="text-2xl font-bold text-foreground mb-6">Conformidade Legal</h3>
                <div className="space-y-4">
                  {[
                    "Auditorias independentes de ativos",
                    "Contratos revisados por advogados",
                    "Relatórios financeiros mensais e anuais",
                    "Conformidade com regulamentações de valores mobiliários"
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-chart-3 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold text-foreground mb-6">
            Pronto para começar a investir?
          </h2>
          <p className="text-xl text-muted-foreground mb-10">
            Junte-se a milhares de investidores ganhando retornos garantidos
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button 
                size="lg"
                className="font-semibold text-lg h-14 px-12"
                data-testid="button-cta-register"
              >
                Abrir sua conta
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button 
                variant="outline"
                size="lg"
                className="font-semibold text-lg h-14 px-12"
                data-testid="button-cta-login"
              >
                Acessar portal do cliente
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <img src={logoPath} alt="Opus" className="h-8 w-8" />
                <span className="font-bold text-foreground text-lg">Opus Rental Capital</span>
              </div>
              <p className="text-muted-foreground text-sm max-w-md">
                Plataforma profissional de gestão de ativos entregando retornos garantidos desde 2020.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-4">Empresa</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-muted-foreground hover:text-foreground">Sobre</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground">Carreiras</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground">Imprensa</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-muted-foreground hover:text-foreground">Termos de Uso</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground">Privacidade</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground">Conformidade</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
            <p className="text-muted-foreground">
              © 2025 Opus Rental Capital. Todos os direitos reservados.
            </p>
            <p className="text-muted-foreground">
              Investimentos envolvem risco. O desempenho passado não garante resultados futuros.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
