import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Shield, TrendingUp, MapPin, DollarSign, CheckCircle, ArrowRight, 
  Award, Zap, Lock, BarChart3, Clock, Globe2
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
                <a href="#" className="text-foreground/80 hover:text-foreground transition-colors">Investimentos</a>
                <a href="#" className="text-foreground/80 hover:text-foreground transition-colors">Condições</a>
                <a href="#" className="text-foreground/80 hover:text-foreground transition-colors">Ferramentas</a>
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
                  Abrir Conta
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
                Invista com confiança em ativos reais
              </h1>
              
              <p className="text-lg text-muted-foreground leading-relaxed max-w-xl" data-testid="text-hero-description">
                Plataforma institucional de investimento em trailers comerciais. 
                Retornos garantidos de 24% ao ano com total transparência e rastreamento GPS em tempo real.
              </p>

              <div className="flex flex-wrap gap-4">
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

              {/* Trust Indicators - CLEAN */}
              <div className="flex flex-wrap gap-6 text-sm text-muted-foreground pt-6 border-t border-border/40">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-foreground" />
                  <span className="font-medium text-foreground">Regulamentado</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-foreground" />
                  <span className="font-medium text-foreground">Suporte premium</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-foreground" />
                  <span className="font-medium text-foreground">Fundos protegidos</span>
                </div>
              </div>
            </div>

            {/* Right: Instrument Widget - MODERN CARD */}
            <div className="lg:pt-0">
              <div className="bg-muted/40 rounded-2xl border border-border/40 p-8 min-h-[520px]">
                <div className="flex justify-between items-center mb-8 pb-6 border-b border-border/40">
                  <h3 className="font-semibold text-foreground">Instrumento</h3>
                  <h3 className="font-semibold text-foreground">Movimento</h3>
                </div>

                <div className="grid gap-6">
                  {[
                    {
                      symbol: "TRAILER-BR",
                      name: "Trailer Comercial Brasil",
                      color: "bg-red-500/10 border-red-500/20"
                    },
                    {
                      symbol: "RBRL",
                      name: "Real Brasileiro",
                      color: "bg-green-500/10 border-green-500/20"
                    },
                    {
                      symbol: "IBOV",
                      name: "Índice Bovespa",
                      color: "bg-blue-500/10 border-blue-500/20"
                    },
                    {
                      symbol: "DIESEL",
                      name: "Diesel Futuros",
                      color: "bg-amber-500/10 border-amber-500/20"
                    }
                  ].map((item, i) => (
                    <div 
                      key={i} 
                      className={`flex items-center justify-between p-5 rounded-xl ${item.color} border transition-all hover:shadow-md cursor-pointer`}
                      data-testid={`instrument-${i}`}
                    >
                      <div>
                        <div className="font-bold text-foreground">{item.symbol}</div>
                        <div className="text-sm text-muted-foreground">{item.name}</div>
                      </div>
                      <div className="text-2xl font-bold text-muted-foreground">–</div>
                    </div>
                  ))}
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
              { value: "R$ 42M", label: "Ativos sob gestão" },
              { value: "2.847", label: "Trailers ativos" },
              { value: "2.500+", label: "Investidores" },
              { value: "100%", label: "No prazo" }
            ].map((stat, i) => (
              <div key={i} className="text-center" data-testid={`stat-${i}`}>
                <div className="text-5xl font-bold text-foreground mb-3 tracking-tight">{stat.value}</div>
                <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits - CLEAN LAYOUT */}
      <section className="py-28 lg:py-32 px-10">
        <div className="max-w-[1440px] mx-auto space-y-16">
          <div className="max-w-3xl">
            <h2 className="text-4xl font-bold text-foreground mb-6 tracking-tight">
              Acesse mercados globais com termos flexíveis
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Condições transparentes, execução rápida e suporte premium para investidores profissionais.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-10">
            {[
              {
                icon: DollarSign,
                title: "Preços justos",
                desc: "Spread zero, negociação sem comissão e sem custos ocultos",
                items: ["Execução rápida", "Preços transparentes", "Sem taxas ocultas"]
              },
              {
                icon: TrendingUp,
                title: "Cobertura total",
                desc: "Todos os mercados e produtos de negociação ao seu alcance",
                items: ["Múltiplos ativos", "Acesso global", "Diversificação"]
              },
              {
                icon: Zap,
                title: "Plataforma avançada",
                desc: "Ferramentas construídas para precisão e velocidade",
                items: ["Interface moderna", "Tempo real", "Mobile & Desktop"]
              },
              {
                icon: Shield,
                title: "Regulamentação",
                desc: "Protegendo capital em jurisdições-chave",
                items: ["Fundos segregados", "Auditoria", "Compliance"]
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

      {/* Account Types - MODERN CARDS */}
      <section className="py-28 lg:py-32 px-10 bg-muted/10">
        <div className="max-w-[1440px] mx-auto space-y-16">
          <div className="max-w-3xl">
            <h2 className="text-4xl font-bold text-foreground mb-6 tracking-tight">
              Opções de conta para todos os níveis
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              De novos traders a profissionais experientes, nossas contas oferecem as condições certas
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Plus",
                price: "R$ 100",
                desc: "Para começar",
                features: [
                  "Trading sem comissão",
                  "Acesso completo",
                  "Suporte educacional"
                ]
              },
              {
                name: "Prime",
                price: "R$ 1.000",
                desc: "Mais popular",
                features: [
                  "Execução STP/ECN",
                  "Condições premium",
                  "Análise de mercado"
                ]
              },
              {
                name: "Elite",
                price: "R$ 5.000",
                desc: "Profissional",
                features: [
                  "Spread zero",
                  "Liquidez profunda",
                  "Suporte dedicado"
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
                  <ul className="space-y-4">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                        <span className="text-foreground text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/register">
                    <Button className="w-full" size="lg">Abrir Conta</Button>
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
              Por que investidores escolhem Opus
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Construído sobre força regulatória, infraestrutura avançada e execução centrada no cliente
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-12">
            {[
              { icon: Zap, title: "Saques rápidos", desc: "Processamento em 24h" },
              { icon: Lock, title: "Fundos segregados", desc: "Capital protegido" },
              { icon: BarChart3, title: "Preços transparentes", desc: "Sem custos ocultos" },
              { icon: Shield, title: "Execução institucional", desc: "Nível profissional" }
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
            Pronto para começar a investir?
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Junte-se a milhares de investidores ganhando retornos garantidos
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
            Conta institucional? <a href="#" className="font-semibold text-accent hover:underline">Clique aqui</a>
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
                Plataforma profissional de gestão de ativos entregando retornos garantidos desde 2020.
              </p>
            </div>

            {[
              { title: "Empresa", links: ["Sobre", "Carreiras", "Blog"] },
              { title: "Legal", links: ["Termos", "Privacidade", "Compliance"] },
              { title: "Suporte", links: ["Central de Ajuda", "Contato", "FAQ"] }
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
