import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
      <div className="border-b border-border bg-muted/20">
        <div className="max-w-[1400px] mx-auto px-6 py-2 flex justify-end items-center gap-6 text-sm">
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Suporte</a>
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Para Institucionais</a>
        </div>
      </div>

      {/* Navigation */}
      <nav className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-12">
              <div className="flex items-center gap-2">
                <img src={logoPath} alt="Opus" className="h-7 w-7" />
                <span className="text-lg font-bold text-foreground tracking-tight">opusrentalcapital</span>
              </div>
              
              <div className="hidden lg:flex items-center gap-8 text-sm">
                <a href="#" className="text-foreground hover:text-accent transition-colors font-medium">Investimentos</a>
                <a href="#" className="text-foreground hover:text-accent transition-colors font-medium">Condições</a>
                <a href="#" className="text-foreground hover:text-accent transition-colors font-medium">Ferramentas</a>
                <a href="#" className="text-foreground hover:text-accent transition-colors font-medium">Sobre</a>
                <a href="#" className="text-foreground hover:text-accent transition-colors font-medium">Parceiros</a>
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
                className="text-foreground"
              >
                <Globe2 className="h-4 w-4" />
              </Button>
              <Link href="/register">
                <Button 
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
                  <Lock className="h-3.5 w-3.5 mr-1.5" />
                  Portal do Cliente
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-24 px-6 bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-start">
            {/* Left Content */}
            <div className="pt-12">
              <div className="inline-block mb-8">
                <Badge variant="secondary" className="px-4 py-2 text-sm font-medium">
                  Confiável para acesso institucional
                </Badge>
              </div>
              
              <h1 className="text-6xl lg:text-7xl font-bold text-foreground mb-8 leading-[1.1]" data-testid="text-hero-title">
                Invista com confiança<br />
                em uma plataforma<br />
                feita para profissionais
              </h1>
              
              <p className="text-xl text-muted-foreground mb-12 leading-relaxed max-w-xl" data-testid="text-hero-description">
                Invista em trailers comerciais com precisão institucional, 
                condições transparentes e retornos garantidos de 24% ao ano.
              </p>

              <div className="flex gap-4 mb-16">
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

              {/* Awards */}
              <div className="flex flex-wrap gap-4 mb-12">
                {[
                  { title: "UF Awards LATAM", subtitle: "Melhor Corretora Multi-Ativos LATAM 2025" },
                  { title: "Forex Expo Dubai", subtitle: "Corretora Mais Transparente 2024" },
                  { title: "Int. Business Magazine", subtitle: "Melhor Plataforma de Trading 2024" }
                ].map((award, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card">
                    <Award className="h-8 w-8 text-accent flex-shrink-0" />
                    <div>
                      <div className="font-bold text-sm text-foreground">{award.title}</div>
                      <div className="text-xs text-muted-foreground">{award.subtitle}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Trustpilot */}
              <div className="flex items-center gap-4 mb-8">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-green-500 text-xl">★</span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="font-bold text-foreground">Excelente</div>
                  <div className="text-sm text-muted-foreground">4.6 de 5 no Trustpilot</div>
                </div>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap gap-6 text-sm">
                {[
                  { icon: Shield, text: "Regulamentado globalmente" },
                  { icon: Zap, text: "Suporte premium" },
                  { icon: Lock, text: "Proteção de fundos" }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <item.icon className="h-4 w-4 text-foreground" />
                    <span className="text-foreground font-medium">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Investment Instruments */}
            <div className="lg:pt-12">
              <Card className="border border-border shadow-lg bg-card">
                <CardContent className="p-8">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="font-semibold text-foreground text-lg">Instrumento</h3>
                    <h3 className="font-semibold text-foreground text-lg">Movimento de preço</h3>
                  </div>

                  <div className="space-y-4">
                    {[
                      {
                        icon: "🚛",
                        name: "TRAILER-BR",
                        desc: "Trailer Comercial Brasil",
                        color: "from-red-500/20 to-red-600/20 border-red-200"
                      },
                      {
                        icon: "💰",
                        name: "RBRL",
                        desc: "Real Brasileiro",
                        color: "from-green-500/20 to-green-600/20 border-green-200"
                      },
                      {
                        icon: "📊",
                        name: "IBOV",
                        desc: "Índice Bovespa",
                        color: "from-blue-500/20 to-blue-600/20 border-blue-200"
                      },
                      {
                        icon: "⛽",
                        name: "DIESEL",
                        desc: "Diesel Futuros",
                        color: "from-amber-500/20 to-amber-600/20 border-amber-200"
                      }
                    ].map((item, i) => (
                      <div 
                        key={i} 
                        className={`flex items-center justify-between p-5 rounded-xl bg-gradient-to-br ${item.color} border transition-all hover:shadow-md cursor-pointer`}
                        data-testid={`instrument-${i}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-3xl">{item.icon}</div>
                          <div>
                            <div className="font-bold text-foreground text-lg">{item.name}</div>
                            <div className="text-sm text-muted-foreground">{item.desc}</div>
                          </div>
                        </div>
                        <div className="text-3xl font-bold text-muted-foreground">–</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-16 px-6 border-y border-border bg-muted/10">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            {[
              { value: "R$ 42M", label: "Ativos sob gestão" },
              { value: "2.847", label: "Trailers ativos" },
              { value: "2.500+", label: "Investidores ativos" },
              { value: "100%", label: "Pagamentos no prazo" }
            ].map((stat, i) => (
              <div key={i} className="text-center" data-testid={`stat-${i}`}>
                <div className="text-5xl font-bold text-foreground mb-3">{stat.value}</div>
                <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32 px-6">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-foreground mb-6">
              Acesse mercados globais com termos flexíveis
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Condições transparentes, execução rápida e suporte premium
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: "Preços justos",
                desc: "Spread zero, negociação sem comissão e sem custos ocultos",
                features: ["Execução rápida", "Preços transparentes", "Sem taxas escondidas"]
              },
              {
                title: "Cobertura total de mercado",
                desc: "Todos os mercados globais e produtos de negociação ao seu alcance",
                features: ["Forex", "Metais preciosos", "Índices"]
              },
              {
                title: "Plataformas avançadas",
                desc: "Ferramentas construídas para precisão e velocidade",
                features: ["MT4/MT5", "Trading em 1 clique", "Gráficos avançados"]
              },
              {
                title: "Regulamentação global",
                desc: "Protegendo capital de investidores em jurisdições-chave",
                features: ["Fundos segregados", "Proteção de saldo", "Auditoria"]
              }
            ].map((feature, i) => (
              <Card key={i} className="border border-border group hover:shadow-xl transition-all">
                <CardContent className="p-10">
                  <h3 className="text-2xl font-bold text-foreground mb-4">{feature.title}</h3>
                  <p className="text-muted-foreground mb-6 text-lg">{feature.desc}</p>
                  <ul className="space-y-3">
                    {feature.features.map((item, j) => (
                      <li key={j} className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-accent" />
                        <span className="text-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Account Types */}
      <section className="py-32 px-6 bg-muted/10">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-foreground mb-6">
              Opções de conta para todos os níveis
            </h2>
            <p className="text-xl text-muted-foreground">
              De novos traders a profissionais experientes
            </p>
          </div>

          <Tabs defaultValue="individual" className="max-w-5xl mx-auto">
            <TabsList className="grid w-full grid-cols-2 mb-12">
              <TabsTrigger value="individual" className="text-lg py-4">Individuais</TabsTrigger>
              <TabsTrigger value="pro" className="text-lg py-4">Pro Traders</TabsTrigger>
            </TabsList>
            
            <TabsContent value="individual" className="space-y-8">
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  {
                    name: "Plus",
                    price: "R$ 100",
                    features: [
                      "Trading sem comissão",
                      "Acesso completo ao mercado",
                      "Suporte educacional"
                    ]
                  },
                  {
                    name: "Prime",
                    price: "R$ 1.000",
                    features: [
                      "Execução STP/ECN",
                      "Condições mais apertadas",
                      "Análise de trading"
                    ]
                  },
                  {
                    name: "Elite",
                    price: "R$ 5.000",
                    features: [
                      "Trading com spread zero",
                      "Liquidez profunda",
                      "Suporte personalizado"
                    ]
                  }
                ].map((plan, i) => (
                  <Card key={i} className="border-2 border-border hover:border-accent transition-all">
                    <CardContent className="p-8">
                      <h3 className="text-2xl font-bold text-foreground mb-2">{plan.name}</h3>
                      <div className="text-4xl font-bold text-accent mb-6">{plan.price}</div>
                      <ul className="space-y-4 mb-8">
                        {plan.features.map((feature, j) => (
                          <li key={j} className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                            <span className="text-muted-foreground">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Link href="/register">
                        <Button className="w-full" size="lg">Abrir Conta</Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="pro">
              <Card className="border-2 border-accent">
                <CardContent className="p-12 text-center">
                  <h3 className="text-3xl font-bold text-foreground mb-4">
                    Soluções para clientes institucionais
                  </h3>
                  <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                    Condições de nível profissional com liquidez profunda, 
                    preços adaptativos e suporte de conta totalmente personalizado
                  </p>
                  <Button size="lg" variant="outline">
                    Mais detalhes
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-32 px-6">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-foreground mb-6">
              Por que traders escolhem Opus
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Construído sobre força regulatória, infraestrutura avançada 
              e execução centrada no cliente
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                icon: Zap,
                title: "Saques rápidos",
                desc: "Processamento em até 24 horas"
              },
              {
                icon: Lock,
                title: "Fundos segregados",
                desc: "Capital do cliente protegido"
              },
              {
                icon: BarChart3,
                title: "Preços transparentes",
                desc: "Sem custos ocultos"
              },
              {
                icon: Shield,
                title: "Execução institucional",
                desc: "Infraestrutura de nível profissional"
              }
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-accent/10 mb-6">
                  <item.icon className="h-8 w-8 text-accent" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 bg-gradient-to-br from-accent/5 to-accent/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-6xl font-bold text-foreground mb-8">
            Pronto para começar a investir?
          </h2>
          <p className="text-2xl text-muted-foreground mb-12">
            Junte-se a milhares de investidores ganhando retornos garantidos
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button 
                size="lg"
                className="font-bold text-lg h-14 px-12"
                data-testid="button-cta-register"
              >
                Começar a Investir
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button 
                variant="outline"
                size="lg"
                className="font-bold text-lg h-14 px-12"
                data-testid="button-cta-login"
              >
                Acessar Portal
              </Button>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground mt-8">
            Conta institucional? <a href="#" className="font-bold text-accent hover:underline">Clique aqui</a>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 border-t border-border">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid md:grid-cols-5 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <img src={logoPath} alt="Opus" className="h-8 w-8" />
                <span className="font-bold text-foreground text-xl">Opus Rental Capital</span>
              </div>
              <p className="text-muted-foreground mb-6 max-w-md">
                Plataforma profissional de gestão de ativos entregando 
                retornos garantidos desde 2020.
              </p>
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-green-500">★</span>
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">4.6/5 no Trustpilot</span>
              </div>
            </div>

            {[
              { title: "Empresa", links: ["Sobre", "Carreiras", "Imprensa", "Blog"] },
              { title: "Legal", links: ["Termos", "Privacidade", "Conformidade", "Cookies"] },
              { title: "Suporte", links: ["Central de Ajuda", "Contato", "FAQ", "Status"] }
            ].map((section, i) => (
              <div key={i}>
                <h3 className="font-bold text-foreground mb-4">{section.title}</h3>
                <ul className="space-y-3">
                  {section.links.map((link, j) => (
                    <li key={j}>
                      <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-muted-foreground text-sm">
              © 2025 Opus Rental Capital. Todos os direitos reservados.
            </p>
            <p className="text-muted-foreground text-sm">
              Investimentos envolvem risco. O desempenho passado não garante resultados futuros.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
