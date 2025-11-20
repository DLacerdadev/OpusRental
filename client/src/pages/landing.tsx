import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, TrendingUp, MapPin, DollarSign, CheckCircle, ArrowRight, 
  Award, Zap, Lock, BarChart3, Clock, Globe2, Percent, Users, 
  LineChart, FileText, Bell, Star, ChevronRight, PlayCircle,
  Smartphone, Laptop, Activity
} from "lucide-react";
import { useTranslation } from "react-i18next";
import logoPath from "@assets/image_1759264185138.png";

export default function Landing() {
  const { t, i18n } = useTranslation();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Gradient */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_#0D2847_0%,_#020817_50%,_#000000_100%)] opacity-40 pointer-events-none" />
      
      {/* Top Bar */}
      <div className="border-b border-border/40 bg-background/80 backdrop-blur-sm relative z-40">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-2 flex justify-between items-center text-sm">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Activity className="h-3 w-3 text-green-500" />
              <span className="text-muted-foreground">Sistema operacional 24/7</span>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <Shield className="h-3 w-3 text-accent" />
              <span className="text-muted-foreground">Regulamentado e auditado</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Suporte</a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Para Institucionais</a>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="border-b border-border/40 bg-background/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-12">
              <div className="flex items-center gap-3">
                <img src={logoPath} alt="Opus" className="h-10 w-10" />
                <span className="text-xl font-bold text-foreground tracking-tight">opusrentalcapital</span>
              </div>
              
              <div className="hidden lg:flex items-center gap-8 text-sm font-medium">
                <a href="#portfolio" className="text-foreground/80 hover:text-accent transition-colors">Portfólio</a>
                <a href="#tracking" className="text-foreground/80 hover:text-accent transition-colors">Rastreamento</a>
                <a href="#reports" className="text-foreground/80 hover:text-accent transition-colors">Relatórios</a>
                <a href="#pricing" className="text-foreground/80 hover:text-accent transition-colors">Planos</a>
                <a href="#about" className="text-foreground/80 hover:text-accent transition-colors">Sobre</a>
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

      {/* Hero Section - Rich and Integrated */}
      <section className="relative py-20 lg:py-28 px-6 lg:px-12 overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-secondary/5 pointer-events-none" />
        <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-[1600px] mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Hero Content */}
            <div className="space-y-8">
              {/* Trust Badge */}
              <div className="flex flex-wrap gap-3">
                <Badge variant="secondary" className="px-4 py-2 text-sm font-medium bg-accent/10 text-accent border-accent/20">
                  <Award className="h-3 w-3 mr-2" />
                  Premiado 2024
                </Badge>
                <Badge variant="secondary" className="px-4 py-2 text-sm font-medium bg-green-500/10 text-green-500 border-green-500/20">
                  <CheckCircle className="h-3 w-3 mr-2" />
                  100% Pagamentos no Prazo
                </Badge>
              </div>

              <h1 
                className="font-bold text-foreground leading-[1.1] tracking-tight"
                style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)' }}
                data-testid="text-hero-title"
              >
                Investimentos em <span className="text-accent">trailers comerciais</span> com retorno garantido de 24% a.a.
              </h1>
              
              <p className="text-lg text-muted-foreground leading-relaxed" data-testid="text-hero-description">
                Plataforma institucional para investir em ativos reais. Acompanhe seus trailers em tempo real via GPS, 
                receba pagamentos mensais pontuais e construa patrimônio com transparência total.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4">
                <Link href="/register">
                  <Button 
                    size="lg"
                    className="font-semibold text-base h-12 px-8 shadow-lg shadow-accent/20"
                    data-testid="button-start-investing"
                  >
                    Começar a Investir
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="font-semibold text-base h-12 px-6"
                  data-testid="button-watch-video"
                >
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Ver como funciona
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap gap-8 pt-6 border-t border-border/40">
                {[
                  { icon: Percent, label: "24% a.a.", sublabel: "Rentabilidade" },
                  { icon: MapPin, label: "GPS Real-Time", sublabel: "Rastreamento" },
                  { icon: Users, label: "2.500+", sublabel: "Investidores" }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center">
                      <item.icon className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <div className="font-bold text-foreground">{item.label}</div>
                      <div className="text-sm text-muted-foreground">{item.sublabel}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Dashboard Preview Card */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-accent/20 to-secondary/20 rounded-3xl blur-2xl opacity-50" />
              <Card className="relative bg-gradient-to-br from-card/95 to-card/80 backdrop-blur-xl border-border/40 p-8 rounded-2xl shadow-2xl">
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-border/40">
                    <h3 className="font-semibold text-foreground text-lg">Desempenho em Tempo Real</h3>
                    <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">
                      <Activity className="h-3 w-3 mr-1" />
                      Ao vivo
                    </Badge>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-6">
                    {[
                      { label: "Ativos Sob Gestão", value: "R$ 42M", trend: "+12%", color: "text-accent" },
                      { label: "Trailers Ativos", value: "2.847", trend: "+8%", color: "text-accent" },
                      { label: "Investidores", value: "2.500+", trend: "+15%", color: "text-accent" },
                      { label: "Taxa de Retorno", value: "24% a.a.", trend: "Garantido", color: "text-green-500" }
                    ].map((stat, i) => (
                      <div key={i} className="space-y-2 p-4 rounded-xl bg-muted/40 border border-border/40">
                        <div className="text-xs text-muted-foreground">{stat.label}</div>
                        <div className={`text-2xl font-bold ${stat.color} tracking-tight`}>{stat.value}</div>
                        <div className="flex items-center gap-1 text-xs text-green-500">
                          <TrendingUp className="h-3 w-3" />
                          {stat.trend}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Recent Activity */}
                  <div className="space-y-3 pt-4 border-t border-border/40">
                    <div className="text-sm font-semibold text-foreground">Atividade Recente</div>
                    {[
                      { action: "Pagamento processado", value: "R$ 12.500", time: "há 2 min" },
                      { action: "Novo investimento", value: "R$ 5.000", time: "há 15 min" },
                      { action: "GPS atualizado", value: "Trailer #2847", time: "há 32 min" }
                    ].map((activity, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/20">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center">
                            <CheckCircle className="h-4 w-4 text-accent" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-foreground">{activity.action}</div>
                            <div className="text-xs text-muted-foreground">{activity.time}</div>
                          </div>
                        </div>
                        <div className="text-sm font-bold text-foreground">{activity.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Ticker - Full Width */}
      <section className="relative py-12 px-6 lg:px-12 bg-gradient-to-r from-accent/5 via-accent/10 to-secondary/5 border-y border-border/40">
        <div className="max-w-[1600px] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: DollarSign, value: "R$ 42M+", label: "Ativos sob gestão", color: "text-accent" },
              { icon: TrendingUp, value: "2.847", label: "Trailers ativos", color: "text-green-500" },
              { icon: Users, value: "2.500+", label: "Investidores ativos", color: "text-blue-500" },
              { icon: CheckCircle, value: "100%", label: "Pagamentos no prazo", color: "text-green-500" }
            ].map((stat, i) => (
              <div key={i} className="text-center" data-testid={`stat-${i}`}>
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-background/80 backdrop-blur-sm border border-border/40 mb-4">
                  <stat.icon className={`h-7 w-7 ${stat.color}`} />
                </div>
                <div className="text-4xl font-bold text-foreground mb-2 tracking-tight">{stat.value}</div>
                <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Visual Process */}
      <section className="relative py-24 px-6 lg:px-12">
        <div className="max-w-[1600px] mx-auto">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-6 bg-accent/10 text-accent border-accent/20">
              Processo Simplificado
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6 tracking-tight">
              Como funciona seu investimento
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Em 4 passos simples você começa a receber rendimentos mensais de 24% ao ano
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                icon: Users,
                title: "Cadastre-se",
                desc: "Crie sua conta em 2 minutos com verificação digital",
                color: "from-blue-500/20 to-blue-600/20",
                border: "border-blue-500/30"
              },
              {
                step: "02",
                icon: DollarSign,
                title: "Invista",
                desc: "A partir de R$ 500 em cotas de trailers comerciais",
                color: "from-accent/20 to-accent/30",
                border: "border-accent/30"
              },
              {
                step: "03",
                icon: MapPin,
                title: "Acompanhe",
                desc: "Rastreie seus trailers em tempo real via GPS",
                color: "from-green-500/20 to-green-600/20",
                border: "border-green-500/30"
              },
              {
                step: "04",
                icon: TrendingUp,
                title: "Receba",
                desc: "2% ao mês direto na sua conta todo dia 5",
                color: "from-secondary/20 to-secondary/30",
                border: "border-secondary/30"
              }
            ].map((item, i) => (
              <div key={i} className="relative group">
                {i < 3 && (
                  <div className="hidden lg:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-border/60 to-transparent z-0" />
                )}
                <Card className={`relative bg-gradient-to-br ${item.color} backdrop-blur-sm border ${item.border} p-8 rounded-2xl hover:shadow-xl transition-all group-hover:-translate-y-1 z-10`}>
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="h-14 w-14 rounded-2xl bg-background/80 backdrop-blur-sm flex items-center justify-center border border-border/40">
                        <item.icon className="h-7 w-7 text-accent" />
                      </div>
                      <div className="text-5xl font-bold text-muted-foreground/20">{item.step}</div>
                    </div>
                    <h3 className="text-xl font-bold text-foreground">{item.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid - Rich Content */}
      <section className="relative py-24 px-6 lg:px-12 bg-gradient-to-b from-muted/20 to-background">
        <div className="max-w-[1600px] mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left: Feature List */}
            <div className="space-y-8">
              <div>
                <Badge variant="secondary" className="mb-6 bg-accent/10 text-accent border-accent/20">
                  Tecnologia de Ponta
                </Badge>
                <h2 className="text-4xl font-bold text-foreground mb-6 tracking-tight">
                  Plataforma completa para gestão de investimentos
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Todas as ferramentas que você precisa para investir, acompanhar e maximizar seus retornos em um só lugar.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  {
                    icon: MapPin,
                    title: "Rastreamento GPS em Tempo Real",
                    desc: "Monitore a localização e status de cada trailer 24/7",
                    badge: "GPS Live"
                  },
                  {
                    icon: BarChart3,
                    title: "Relatórios Financeiros Completos",
                    desc: "Análises detalhadas, extratos e dashboards interativos",
                    badge: "Analytics"
                  },
                  {
                    icon: FileText,
                    title: "Contratos Digitais Seguros",
                    desc: "Todos documentos registrados e auditados externamente",
                    badge: "Blockchain"
                  },
                  {
                    icon: Bell,
                    title: "Notificações Inteligentes",
                    desc: "Alertas sobre pagamentos, atualizações e oportunidades",
                    badge: "Real-Time"
                  }
                ].map((feature, i) => (
                  <Card key={i} className="bg-card/60 backdrop-blur-sm border-border/40 p-6 rounded-xl hover:shadow-lg transition-all group">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                        <feature.icon className="h-6 w-6 text-accent" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-bold text-foreground">{feature.title}</h3>
                          <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20 text-xs">
                            {feature.badge}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all" />
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Right: Platform Preview */}
            <div className="relative">
              <div className="absolute -inset-8 bg-gradient-to-br from-accent/10 via-transparent to-secondary/10 rounded-3xl blur-3xl" />
              <Card className="relative bg-gradient-to-br from-card/95 to-card/80 backdrop-blur-xl border-border/40 p-8 rounded-2xl shadow-2xl">
                <div className="space-y-6">
                  {/* Platform Header */}
                  <div className="flex items-center justify-between pb-6 border-b border-border/40">
                    <div>
                      <h3 className="font-bold text-foreground text-lg mb-1">Meu Portfólio</h3>
                      <p className="text-sm text-muted-foreground">Atualizado em tempo real</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-accent" />
                      <Laptop className="h-4 w-4 text-accent" />
                    </div>
                  </div>

                  {/* Portfolio Value */}
                  <div className="p-6 rounded-xl bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20">
                    <div className="text-sm text-muted-foreground mb-2">Valor Total Investido</div>
                    <div className="text-4xl font-bold text-foreground mb-2 tracking-tight">R$ 127.450,00</div>
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +24% este ano
                      </Badge>
                    </div>
                  </div>

                  {/* Assets List */}
                  <div className="space-y-3">
                    <div className="text-sm font-semibold text-foreground flex items-center justify-between">
                      <span>Seus Trailers</span>
                      <span className="text-muted-foreground">8 ativos</span>
                    </div>
                    {[
                      { id: "TR-2847", status: "Locado", location: "SP - Capital", value: "R$ 15.930" },
                      { id: "TR-2848", status: "Locado", location: "RJ - Porto", value: "R$ 15.930" },
                      { id: "TR-2849", status: "Locado", location: "MG - BH", value: "R$ 15.930" }
                    ].map((asset, i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-muted/40 border border-border/40 hover:border-accent/40 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                            <MapPin className="h-5 w-5 text-accent" />
                          </div>
                          <div>
                            <div className="font-medium text-foreground text-sm">{asset.id}</div>
                            <div className="text-xs text-muted-foreground">{asset.location}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-foreground">{asset.value}</div>
                          <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20 text-xs mt-1">
                            {asset.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Plans - Modern Cards */}
      <section id="pricing" className="relative py-24 px-6 lg:px-12">
        <div className="max-w-[1600px] mx-auto">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-6 bg-accent/10 text-accent border-accent/20">
              Planos Flexíveis
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6 tracking-tight">
              Escolha seu plano de investimento
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Todos os planos oferecem a mesma rentabilidade de 24% ao ano. Escolha o investimento inicial ideal para você.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Starter",
                price: "R$ 500",
                popular: false,
                desc: "Ideal para começar",
                features: [
                  "1-5 cotas de trailers",
                  "Rastreamento GPS básico",
                  "Relatórios mensais",
                  "Suporte por email",
                  "Dashboard web"
                ],
                cta: "Começar Agora"
              },
              {
                name: "Growth",
                price: "R$ 5.000",
                popular: true,
                desc: "Mais escolhido",
                features: [
                  "6-20 cotas de trailers",
                  "Rastreamento GPS avançado",
                  "Relatórios detalhados",
                  "Suporte prioritário",
                  "App mobile completo",
                  "Análises personalizadas"
                ],
                cta: "Investir Agora"
              },
              {
                name: "Premium",
                price: "R$ 50.000",
                popular: false,
                desc: "Investidor institucional",
                features: [
                  "20+ cotas de trailers",
                  "Gestor dedicado",
                  "Relatórios customizados",
                  "Suporte 24/7",
                  "API de integração",
                  "Consultoria exclusiva",
                  "Visitas aos ativos"
                ],
                cta: "Falar com Consultor"
              }
            ].map((plan, i) => (
              <div key={i} className="relative">
                {plan.popular && (
                  <div className="absolute -top-4 left-0 right-0 flex justify-center z-20">
                    <Badge className="bg-accent text-white border-accent shadow-lg shadow-accent/20">
                      <Star className="h-3 w-3 mr-1 fill-current" />
                      Mais Popular
                    </Badge>
                  </div>
                )}
                <Card className={`relative h-full bg-gradient-to-br ${
                  plan.popular 
                    ? 'from-accent/10 to-accent/5 border-accent/40 shadow-xl shadow-accent/10' 
                    : 'from-card/95 to-card/80 border-border/40'
                } backdrop-blur-sm p-8 rounded-2xl ${plan.popular ? 'scale-105' : ''} transition-all hover:shadow-2xl`}>
                  <div className="space-y-6">
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">{plan.desc}</div>
                      <h3 className="text-2xl font-bold text-foreground tracking-tight mb-1">{plan.name}</h3>
                      <div className="flex items-baseline gap-2">
                        <div className="text-4xl font-bold text-accent tracking-tight">{plan.price}</div>
                        <div className="text-sm text-muted-foreground">inicial</div>
                      </div>
                    </div>

                    <div className="pt-6 pb-6 border-y border-border/40">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm text-muted-foreground">Retorno Anual</div>
                        <div className="text-2xl font-bold text-green-500">24%</div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">Retorno Mensal</div>
                        <div className="text-xl font-bold text-accent">2%</div>
                      </div>
                    </div>

                    <ul className="space-y-3">
                      {plan.features.map((feature, j) => (
                        <li key={j} className="flex items-start gap-3">
                          <CheckCircle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${plan.popular ? 'text-accent' : 'text-green-500'}`} />
                          <span className="text-sm text-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Link href="/register">
                      <Button 
                        className={`w-full ${plan.popular ? 'shadow-lg shadow-accent/20' : ''}`}
                        variant={plan.popular ? 'default' : 'outline'}
                        size="lg"
                      >
                        {plan.cta}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section - Social Proof */}
      <section className="relative py-24 px-6 lg:px-12 bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-[1600px] mx-auto">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-6 bg-green-500/10 text-green-500 border-green-500/20">
              <Shield className="h-3 w-3 mr-2" />
              Segurança e Confiança
            </Badge>
            <h2 className="text-4xl font-bold text-foreground mb-6 tracking-tight">
              Por que investidores confiam na Opus
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Shield,
                title: "Contratos Registrados",
                desc: "Todos os contratos registrados em cartório e auditados",
                color: "from-blue-500/10 to-blue-600/10",
                iconColor: "text-blue-500"
              },
              {
                icon: Lock,
                title: "Fundos Segregados",
                desc: "Seu capital protegido em contas segregadas",
                color: "from-green-500/10 to-green-600/10",
                iconColor: "text-green-500"
              },
              {
                icon: CheckCircle,
                title: "100% Compliance",
                desc: "Auditoria externa trimestral por Big Four",
                color: "from-accent/10 to-accent/20",
                iconColor: "text-accent"
              },
              {
                icon: Award,
                title: "Premiado 2024",
                desc: "Melhor plataforma de investimentos alternativos",
                color: "from-secondary/10 to-secondary/20",
                iconColor: "text-secondary"
              }
            ].map((item, i) => (
              <Card key={i} className={`bg-gradient-to-br ${item.color} backdrop-blur-sm border-border/40 p-8 rounded-2xl text-center hover:shadow-xl transition-all group`}>
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-background/80 backdrop-blur-sm border border-border/40 mb-6 group-hover:scale-110 transition-transform">
                  <item.icon className={`h-8 w-8 ${item.iconColor}`} />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Strong Call to Action */}
      <section className="relative py-28 px-6 lg:px-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-accent/10 to-secondary/20" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-8">
          <Badge variant="secondary" className="bg-white/10 text-white border-white/20 backdrop-blur-sm">
            Comece em 2 minutos
          </Badge>
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground tracking-tight">
            Pronto para ganhar <span className="text-accent">24% ao ano</span> com seus investimentos?
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Junte-se a mais de 2.500 investidores que já estão construindo patrimônio com trailers comerciais
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/register">
              <Button 
                size="lg"
                className="font-bold text-lg h-14 px-12 shadow-2xl shadow-accent/30"
                data-testid="button-cta-register"
              >
                Começar a Investir Agora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button 
                variant="outline"
                size="lg"
                className="font-bold text-lg h-14 px-12 bg-background/50 backdrop-blur-sm"
                data-testid="button-cta-login"
              >
                Já sou Investidor
              </Button>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground pt-4">
            💼 Investidor institucional? <a href="#" className="font-bold text-accent hover:underline">Fale com nossa equipe</a>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-16 px-6 lg:px-12 border-t border-border/40 bg-background/95 backdrop-blur-sm">
        <div className="max-w-[1600px] mx-auto">
          <div className="grid md:grid-cols-5 gap-12 mb-12">
            <div className="md:col-span-2 space-y-6">
              <div className="flex items-center gap-3">
                <img src={logoPath} alt="Opus" className="h-10 w-10" />
                <span className="font-bold text-foreground text-xl">Opus Rental Capital</span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-md">
                Plataforma de investimento em trailers comerciais com retornos garantidos. 
                Transparência, tecnologia e segurança para o seu patrimônio.
              </p>
              <div className="flex items-center gap-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-500 fill-current" />
                ))}
                <span className="text-sm text-muted-foreground ml-2">4.9/5 (500+ avaliações)</span>
              </div>
            </div>

            {[
              { 
                title: "Plataforma", 
                links: ["Como Funciona", "Portfólio", "Rastreamento", "Relatórios", "Planos"] 
              },
              { 
                title: "Empresa", 
                links: ["Sobre Nós", "Blog", "Imprensa", "Carreiras"] 
              },
              { 
                title: "Legal", 
                links: ["Termos de Uso", "Privacidade", "Contratos", "Compliance"] 
              }
            ].map((section, i) => (
              <div key={i} className="space-y-4">
                <h3 className="font-bold text-foreground text-sm">{section.title}</h3>
                <ul className="space-y-3">
                  {section.links.map((link, j) => (
                    <li key={j}>
                      <a href="#" className="text-muted-foreground text-sm hover:text-accent transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="pt-8 border-t border-border/40 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-muted-foreground text-sm">
              © 2025 Opus Rental Capital. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-accent transition-colors">Status do Sistema</a>
              <a href="#" className="hover:text-accent transition-colors">API</a>
              <a href="#" className="hover:text-accent transition-colors">Suporte</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
