import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { 
  TrendingUp, 
  MapPin,
  DollarSign,
  Truck,
  CheckCircle,
  ArrowRight,
  BarChart3,
  Clock,
  Shield,
  Eye,
  FileText,
  Calendar
} from "lucide-react";
import { useTranslation } from "react-i18next";
import logoPath from "@assets/image_1759264185138.png";

export default function Landing() {
  const { t, i18n } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      {/* Simple Navigation */}
      <nav className="fixed top-0 w-full bg-card/95 backdrop-blur-xl border-b border-border z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <div className="flex items-center gap-3 sm:gap-4">
              <img 
                src={logoPath} 
                alt="Opus Rental Capital" 
                className="h-10 w-10 sm:h-14 sm:w-14 rounded-xl shadow-md object-cover"
              />
              <div className="flex flex-col">
                <h1 className="text-base sm:text-xl font-bold text-foreground tracking-tight leading-tight">
                  Opus Rental Capital
                </h1>
                <p className="text-[10px] sm:text-xs text-muted-foreground font-semibold">
                  {t('landing.nav.tagline', 'Investimentos Garantidos por Ativos Reais')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const newLang = i18n.language.startsWith("en") ? "pt-BR" : "en-US";
                  i18n.changeLanguage(newLang);
                  localStorage.setItem('language', newLang);
                }}
                className="h-8 px-3 text-xs font-bold text-muted-foreground hover:text-foreground border border-border rounded-lg"
                data-testid="button-toggle-language"
              >
                {i18n.language.startsWith("en") ? "🇧🇷 PT" : "🇺🇸 EN"}
              </Button>
              <Link href="/login">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-9 sm:h-10 text-xs sm:text-sm font-semibold" 
                  data-testid="button-login"
                >
                  {t('landing.nav.clientPortal', 'Área do Cliente')}
                </Button>
              </Link>
              <Link href="/register">
                <Button 
                  size="sm" 
                  className="h-9 sm:h-10 px-4 sm:px-6 text-xs sm:text-sm font-bold bg-accent hover:bg-accent/90 shadow-lg" 
                  data-testid="button-get-started"
                >
                  {t('landing.nav.openAccount', 'Investir Agora')}
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 sm:pt-40 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-background to-background"></div>
        
        <div className="max-w-7xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-foreground mb-4 sm:mb-6 leading-[1.1] tracking-tight">
              {t('landing.hero.headline', 'Invista em Trailers Comerciais')}
              <br />
              <span className="text-accent">{t('landing.hero.headlineAccent', 'com Garantia Real')}</span>
            </h1>

            <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-muted-foreground mb-6">
              {t('landing.hero.headlineSubtitle', 'Retorno Fixo de 2% ao Mês')}
            </div>

            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-4xl mx-auto mb-4 leading-relaxed">
              {t('landing.hero.description', 'Cada cota de USD 28.000 representa 1 trailer comercial. Retorno mensal garantido de USD 560 (2%).')}
            </p>
            <p className="text-sm sm:text-base text-muted-foreground max-w-3xl mx-auto mb-10 sm:mb-12">
              {t('landing.hero.descriptionExtended', 'Ativos rastreados 24/7 por GPS. Contratos de aluguel de 3 a 12 meses. Transparência total em tempo real.')}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-16">
              <Link href="/register">
                <Button 
                  size="lg" 
                  className="h-13 sm:h-14 px-8 sm:px-10 text-base sm:text-lg font-bold bg-accent hover:bg-accent/90 shadow-xl w-full sm:w-auto group" 
                  data-testid="button-hero-register"
                >
                  {t('landing.hero.ctaRegister', 'Começar a Investir')}
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/login">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="h-13 sm:h-14 px-8 sm:px-10 text-base sm:text-lg font-bold border-2 w-full sm:w-auto" 
                  data-testid="button-hero-login"
                >
                  {t('landing.hero.ctaLogin', 'Acessar Minha Conta')}
                </Button>
              </Link>
            </div>

            {/* Stats Grid - Real Numbers */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {[
                { 
                  value: "USD 28.000", 
                  label: t('landing.stats.investmentLabel', 'Valor por Cota'),
                  sublabel: t('landing.stats.investmentSub', '1 cota = 1 trailer'),
                  icon: DollarSign
                },
                { 
                  value: "USD 560", 
                  label: t('landing.stats.returnLabel', 'Retorno Mensal Fixo'),
                  sublabel: t('landing.stats.returnSub', '2% ao mês garantido'),
                  icon: TrendingUp
                },
                { 
                  value: "USD 1.500", 
                  label: t('landing.stats.rentalLabel', 'Receita de Aluguel'),
                  sublabel: t('landing.stats.rentalSub', 'Por trailer/mês'),
                  icon: BarChart3
                },
                { 
                  value: "100%", 
                  label: t('landing.stats.trackingLabel', 'Rastreamento GPS'),
                  sublabel: t('landing.stats.trackingSub', 'Todos os ativos 24/7'),
                  icon: MapPin
                }
              ].map((stat, index) => (
                <Card key={index} className="border-2 border-border hover:border-accent/50 transition-all hover:shadow-xl bg-card">
                  <CardContent className="p-5 sm:p-6 text-center">
                    <stat.icon className="h-8 w-8 mx-auto mb-4 text-accent" />
                    <div className="text-3xl sm:text-4xl font-extrabold text-foreground mb-2">{stat.value}</div>
                    <div className="text-xs sm:text-sm text-foreground font-bold mb-1">{stat.label}</div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground font-medium">{stat.sublabel}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Banner CTA Estilo Azul Escuro */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[hsl(210,70%,15%)] via-[hsl(210,60%,20%)] to-[hsl(210,50%,25%)] p-6 sm:p-8 lg:p-10 shadow-2xl"
          >
            {/* Efeito de brilho/overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
            
            {/* Conteúdo */}
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
              <div className="flex-1 text-center sm:text-left">
                <p className="text-base sm:text-lg md:text-xl text-white font-medium max-w-3xl">
                  {t('landing.hero.description', 'Cada cota de USD 28.000 representa 1 trailer comercial. Retorno mensal garantido de USD 560 (2%).')}
                </p>
              </div>
              
              <div className="flex-shrink-0">
                <Link href="/register">
                  <Button 
                    className="bg-accent hover:bg-accent/90 text-white font-bold gap-2 h-11 px-6 shadow-lg hover:shadow-xl transition-all"
                  >
                    {t('landing.cta.buttonRegister', 'Abrir Minha Conta')}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Como Funciona */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground mb-4">
              {t('landing.howItWorks.title', 'Como Funciona')}
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('landing.howItWorks.description', 'Processo simples e transparente do início ao recebimento mensal')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: "1",
                icon: FileText,
                title: t('landing.howItWorks.step1', 'Você Investe'),
                desc: t('landing.howItWorks.step1Desc', 'Adquire 1 cota de USD 28.000 = 1 trailer comercial específico')
              },
              {
                step: "2",
                icon: Truck,
                title: t('landing.howItWorks.step2', 'Trailer Trabalha'),
                desc: t('landing.howItWorks.step2Desc', 'Alugado para transportadoras por 3-12 meses gerando USD 1.500/mês')
              },
              {
                step: "3",
                icon: DollarSign,
                title: t('landing.howItWorks.step3', 'Você Recebe'),
                desc: t('landing.howItWorks.step3Desc', 'USD 560 todo mês (2% fixo) na sua conta')
              },
              {
                step: "4",
                icon: Eye,
                title: t('landing.howItWorks.step4', 'Acompanhe Tudo'),
                desc: t('landing.howItWorks.step4Desc', 'Veja localização GPS, status e relatórios em tempo real')
              }
            ].map((item, i) => (
              <Card key={i} className="border-2 border-border hover:border-accent/50 transition-all relative">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xl font-black mb-4 mx-auto">
                    {item.step}
                  </div>
                  <item.icon className="h-10 w-10 text-accent mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Transparência Total */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-4">
              {t('landing.transparency.title', 'Transparência Total')}
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('landing.transparency.description', 'Veja tudo sobre seu investimento em tempo real')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: MapPin,
                title: t('landing.transparency.gps', 'Rastreamento GPS'),
                items: [
                  t('landing.transparency.gps1', 'Localização exata do seu trailer'),
                  t('landing.transparency.gps2', 'Histórico de rotas e movimentação'),
                  t('landing.transparency.gps3', 'Alertas de movimento suspeito')
                ]
              },
              {
                icon: BarChart3,
                title: t('landing.transparency.status', 'Status do Ativo'),
                items: [
                  t('landing.transparency.status1', 'Sistema de farol: Verde/Amarelo/Vermelho'),
                  t('landing.transparency.status2', 'Idade do trailer e depreciação'),
                  t('landing.transparency.status3', 'Valor atual atualizado')
                ]
              },
              {
                icon: FileText,
                title: t('landing.transparency.financial', 'Financeiro Completo'),
                items: [
                  t('landing.transparency.financial1', 'Extrato de todos os pagamentos'),
                  t('landing.transparency.financial2', 'Contratos de aluguel vigentes'),
                  t('landing.transparency.financial3', 'Relatórios mensais detalhados')
                ]
              }
            ].map((feature, i) => (
              <Card key={i} className="border-2 border-border hover:border-accent/50 transition-all">
                <CardHeader>
                  <feature.icon className="h-12 w-12 text-accent mb-3" />
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {feature.items.map((item, j) => (
                      <div key={j} className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{item}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-6">
            {t('landing.cta.title', 'Pronto para Começar?')}
          </h2>
          <p className="text-lg sm:text-xl text-primary-foreground/90 mb-10 max-w-3xl mx-auto">
            {t('landing.cta.description', 'Comece a investir em trailers comerciais com garantia real e retorno fixo de 2% ao mês')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/register">
              <Button 
                size="lg" 
                className="h-14 sm:h-16 px-10 text-base sm:text-lg font-bold bg-accent text-accent-foreground hover:bg-accent/90 shadow-2xl w-full sm:w-auto group" 
                data-testid="button-cta-register"
              >
                {t('landing.cta.buttonRegister', 'Abrir Minha Conta')}
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer Simples */}
      <footer className="border-t border-border bg-muted/30 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img 
              src={logoPath} 
              alt="Opus Rental Capital" 
              className="h-12 w-12 rounded-xl shadow-md object-cover"
            />
            <div className="text-left">
              <div className="font-bold text-lg text-foreground">Opus Rental Capital</div>
              <div className="text-xs text-muted-foreground">{t('landing.footer.tagline', 'Investimentos Garantidos por Ativos Reais')}</div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {t('landing.footer.copyright', '© 2025 Opus Rental Capital. Todos os direitos reservados.')}
          </p>
        </div>
      </footer>
    </div>
  );
}
