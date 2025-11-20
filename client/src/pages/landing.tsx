import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Shield, TrendingUp, MapPin, DollarSign, CheckCircle, ArrowRight, 
  Award, Zap, Lock, BarChart3, Clock, Globe2, Percent
} from "lucide-react";
import { useTranslation } from "react-i18next";
import logoPath from "@assets/image_1759264185138.png";

export default function Landing() {
  const { t, i18n } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <div className="border-b border-border/40">
        <div className="max-w-[1440px] mx-auto px-10 py-2 flex justify-end items-center gap-8 text-sm">
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Suporte</a>
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Para Institucionais</a>
        </div>
      </div>

      {/* Navigation - CLEAN and MINIMAL */}
      <nav className="border-b border-border/40 bg-background/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-[1440px] mx-auto px-10">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-16">
              <div className="flex items-center gap-3">
                <img src={logoPath} alt="Opus" className="h-10 w-10" />
                <span className="text-xl font-bold text-foreground tracking-tight">opusrentalcapital</span>
              </div>
              
              <div className="hidden lg:flex items-center gap-10 text-sm font-medium">
                <a href="#" className="text-foreground/80 hover:text-foreground transition-colors">Portfólio</a>
                <a href="#" className="text-foreground/80 hover:text-foreground transition-colors">Rastreamento</a>
                <a href="#" className="text-foreground/80 hover:text-foreground transition-colors">Relatórios</a>
                <a href="#" className="text-foreground/80 hover:text-foreground transition-colors">Sobre</a>
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
                <Globe2 className="h-4 w-4" />
              </Button>
              <Link href="/register">
                <Button 
                  size="default"
                  className="font-semibold"
                  data-testid="button-open-account"
                >
                  Começar a Investir
                </Button>
              </Link>
              <Link href="/login">
                <Button 
                  variant="outline"
                  size="default"
                  className="font-semibold"
                  data-testid="button-client-portal"
                >
                  Portal do Cliente
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - MODERN TWO COLUMN */}
      <section className="py-28 lg:py-32 px-10">
        <div className="max-w-[1440px] mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-start">
            {/* Left: Hero Text */}
            <div className="space-y-10">
              <h1 
                className="font-bold text-foreground leading-[1.1] tracking-tight"
                style={{ fontSize: 'clamp(3.5rem, 5vw, 5.5rem)' }}
                data-testid="text-hero-title"
              >
                Investimentos em trailers comerciais com retorno garantido
              </h1>
              
              <p className="text-lg text-muted-foreground leading-relaxed max-w-xl" data-testid="text-hero-description">
                Invista em ativos reais com rentabilidade de 24% ao ano. Acompanhe seus trailers em tempo real via GPS e receba pagamentos mensais garantidos.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link href="/register">
                  <Button 
                    size="lg"
                    className="font-semibold text-base h-12 px-8"
                    data-testid="button-start-investing"
                  >
                    Começar a Investir
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  size="lg"
                  className="font-semibold text-base h-12 px-6"
                  data-testid="button-explore-conditions"
                >
                  Ver como funciona
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              {/* Trust Indicators - CLEAN */}
              <div className="flex flex-wrap gap-6 text-sm text-muted-foreground pt-6 border-t border-border/40">
                <div className="flex items-center gap-2">
                  <Percent className="h-4 w-4 text-foreground" />
                  <span className="font-medium text-foreground">24% ao ano</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-foreground" />
                  <span className="font-medium text-foreground">GPS em tempo real</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-foreground" />
                  <span className="font-medium text-foreground">Contratos garantidos</span>
                </div>
              </div>
            </div>

            {/* Right: Stats Widget - MODERN CARD */}
            <div className="lg:pt-0">
              <div className="bg-muted/40 rounded-2xl border border-border/40 p-8 min-h-[520px]">
                <h3 className="font-semibold text-foreground mb-8 pb-6 border-b border-border/40">
                  Desempenho da Plataforma
                </h3>

                <div className="grid gap-8">
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Ativos Sob Gestão</div>
                    <div className="text-4xl font-bold text-foreground tracking-tight">R$ 42M</div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Trailers Ativos</div>
                    <div className="text-4xl font-bold text-foreground tracking-tight">2.847</div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Investidores Ativos</div>
                    <div className="text-4xl font-bold text-foreground tracking-tight">2.500+</div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Taxa de Retorno</div>
                    <div className="text-4xl font-bold text-accent tracking-tight">24% a.a.</div>
                  </div>

                  <div className="pt-6 border-t border-border/40">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-foreground font-medium">100% dos pagamentos no prazo</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar - CLEAN */}
      <section className="py-16 px-10 border-y border-border/40 bg-muted/10">
        <div className="max-w-[1440px] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-16">
            {[
              { value: "2%", label: "Retorno mensal garantido" },
              { value: "R$ 500", label: "Investimento mínimo" },
              { value: "GPS", label: "Rastreamento em tempo real" },
              { value: "24h", label: "Suporte disponível" }
            ].map((stat, i) => (
              <div key={i} className="text-center" data-testid={`stat-${i}`}>
                <div className="text-5xl font-bold text-foreground mb-3 tracking-tight">{stat.value}</div>
                <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - CLEAN LAYOUT */}
      <section className="py-28 lg:py-32 px-10">
        <div className="max-w-[1440px] mx-auto space-y-16">
          <div className="max-w-3xl">
            <h2 className="text-4xl font-bold text-foreground mb-6 tracking-tight">
              Como funciona o investimento em trailers
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Processo simples e transparente para você começar a investir em ativos reais com retorno garantido.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-10">
            {[
              {
                icon: DollarSign,
                title: "Compre cotas",
                desc: "Invista a partir de R$ 500 e adquira cotas de trailers comerciais",
                items: ["Investimento mínimo baixo", "Diversificação automática", "Sem taxas ocultas"]
              },
              {
                icon: MapPin,
                title: "Acompanhe em tempo real",
                desc: "Rastreie seus trailers via GPS e monitore contratos de locação",
                items: ["GPS em tempo real", "Dashboards completos", "Relatórios mensais"]
              },
              {
                icon: TrendingUp,
                title: "Receba rendimentos",
                desc: "Ganhe 2% ao mês (24% ao ano) com pagamentos pontuais",
                items: ["Pagamentos mensais", "Rentabilidade garantida", "100% no prazo"]
              },
              {
                icon: Shield,
                title: "Segurança total",
                desc: "Contratos registrados, seguro completo e compliance regulatório",
                items: ["Contratos legais", "Seguro dos ativos", "Auditoria externa"]
              }
            ].map((feature, i) => (
              <div key={i} className="space-y-6">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-accent/10">
                  <feature.icon className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-3 tracking-tight">{feature.title}</h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed">{feature.desc}</p>
                  <ul className="space-y-3">
                    {feature.items.map((item, j) => (
                      <li key={j} className="flex items-center gap-3 text-sm">
                        <CheckCircle className="h-4 w-4 text-accent flex-shrink-0" />
                        <span className="text-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Investment Options - MODERN CARDS */}
      <section className="py-28 lg:py-32 px-10 bg-muted/10">
        <div className="max-w-[1440px] mx-auto space-y-16">
          <div className="max-w-3xl">
            <h2 className="text-4xl font-bold text-foreground mb-6 tracking-tight">
              Opções de investimento
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Escolha o plano ideal para começar a construir seu patrimônio em ativos reais
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Starter",
                price: "R$ 500",
                desc: "Para começar",
                features: [
                  "1-5 cotas de trailers",
                  "Rastreamento GPS",
                  "Relatórios mensais",
                  "Suporte por email"
                ]
              },
              {
                name: "Growth",
                price: "R$ 5.000",
                desc: "Mais popular",
                features: [
                  "6-20 cotas de trailers",
                  "Dashboard avançado",
                  "Relatórios detalhados",
                  "Suporte prioritário",
                  "Análises personalizadas"
                ]
              },
              {
                name: "Premium",
                price: "R$ 50.000",
                desc: "Investidor institucional",
                features: [
                  "20+ cotas de trailers",
                  "Gestão dedicada",
                  "Relatórios customizados",
                  "Suporte 24/7",
                  "Consultoria exclusiva"
                ]
              }
            ].map((plan, i) => (
              <Card key={i} className="bg-muted/40 border-border/40 p-8 rounded-2xl hover:shadow-lg transition-all">
                <div className="space-y-6">
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">{plan.desc}</div>
                    <h3 className="text-2xl font-bold text-foreground tracking-tight">{plan.name}</h3>
                  </div>
                  <div className="text-4xl font-bold text-accent tracking-tight">{plan.price}</div>
                  <div className="text-sm text-muted-foreground">Investimento inicial mínimo</div>
                  <ul className="space-y-4">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                        <span className="text-foreground text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/register">
                    <Button className="w-full" size="lg">Começar Agora</Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose - CLEAN GRID */}
      <section className="py-28 lg:py-32 px-10">
        <div className="max-w-[1440px] mx-auto space-y-16">
          <div className="max-w-3xl">
            <h2 className="text-4xl font-bold text-foreground mb-6 tracking-tight">
              Por que escolher a Opus Rental Capital
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Plataforma profissional com tecnologia de ponta e compromisso com transparência total
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-12">
            {[
              { icon: Percent, title: "Retorno garantido", desc: "24% ao ano com pagamentos mensais" },
              { icon: MapPin, title: "GPS em tempo real", desc: "Acompanhe todos os seus ativos" },
              { icon: BarChart3, title: "Transparência total", desc: "Relatórios detalhados mensais" },
              { icon: Shield, title: "Segurança jurídica", desc: "Contratos registrados e seguros" }
            ].map((item, i) => (
              <div key={i} className="space-y-4">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-accent/10">
                  <item.icon className="h-6 w-6 text-accent" />
                </div>
                <h3 className="text-xl font-bold text-foreground tracking-tight">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA - MINIMAL */}
      <section className="py-28 lg:py-32 px-10 bg-muted/10">
        <div className="max-w-4xl mx-auto text-center space-y-10">
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground tracking-tight">
            Comece a investir em ativos reais hoje
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Junte-se a mais de 2.500 investidores que já estão construindo patrimônio com trailers comerciais
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button 
                size="lg"
                className="font-semibold text-base h-12 px-10"
                data-testid="button-cta-register"
              >
                Começar a Investir
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button 
                variant="outline"
                size="lg"
                className="font-semibold text-base h-12 px-10"
                data-testid="button-cta-login"
              >
                Acessar Portal
              </Button>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground">
            Investidor institucional? <a href="#" className="font-semibold text-accent hover:underline">Fale conosco</a>
          </p>
        </div>
      </section>

      {/* Footer - CLEAN */}
      <footer className="py-16 px-10 border-t border-border/40">
        <div className="max-w-[1440px] mx-auto">
          <div className="grid md:grid-cols-5 gap-12 mb-12">
            <div className="md:col-span-2 space-y-6">
              <div className="flex items-center gap-3">
                <img src={logoPath} alt="Opus" className="h-8 w-8" />
                <span className="font-bold text-foreground text-lg">Opus Rental Capital</span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-md">
                Plataforma de investimento em trailers comerciais com retornos garantidos. 
                Transparência, tecnologia e segurança para o seu patrimônio.
              </p>
            </div>

            {[
              { title: "Plataforma", links: ["Como Funciona", "Portfólio", "Rastreamento", "Relatórios"] },
              { title: "Legal", links: ["Termos de Uso", "Privacidade", "Contratos", "Compliance"] },
              { title: "Suporte", links: ["Central de Ajuda", "Contato", "FAQ", "Status"] }
            ].map((section, i) => (
              <div key={i} className="space-y-4">
                <h3 className="font-semibold text-foreground text-sm">{section.title}</h3>
                <ul className="space-y-3">
                  {section.links.map((link, j) => (
                    <li key={j}>
                      <a href="#" className="text-muted-foreground text-sm hover:text-foreground transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="pt-8 border-t border-border/40 text-center">
            <p className="text-muted-foreground text-sm">
              © 2025 Opus Rental Capital. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
