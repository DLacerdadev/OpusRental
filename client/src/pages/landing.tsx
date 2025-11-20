import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { WorldMap } from "@/components/ui/world-map";
import RadialOrbitalTimeline from "@/components/ui/radial-orbital-timeline";
import { CookieConsent } from "@/components/cookie-consent";
import { 
  Shield, TrendingUp, MapPin, DollarSign, CheckCircle, ArrowRight, 
  Award, Lock, BarChart3, Globe2, Percent, Users, 
  FileText, Bell, Star, PlayCircle, Activity, Sparkles, Building2, Check
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import logoPath from "@assets/Design sem nome (18)_1763661820712.png";

export default function Landing() {
  const { t, i18n } = useTranslation();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Elegant Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#0D2847] via-[#0a1f38] to-black opacity-98 pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_30%_20%,_rgba(33,150,243,0.08),transparent_50%),radial-gradient(circle_at_80%_80%,_rgba(33,150,243,0.06),transparent_50%)] pointer-events-none" />
      
      {/* Ultra Modern Top Bar */}
      <div className="bg-black/30 backdrop-blur-xl border-b border-white/10 relative z-50">
        <div className="max-w-[1800px] mx-auto px-8 lg:px-16 h-10 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white/60 text-[11px] font-medium tracking-widest uppercase">{t('landing.topbar.online')}</span>
          </div>
          <div className="flex items-center gap-8">
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-7 w-7 text-white/50 hover:text-accent hover:bg-white/5 rounded"
                  data-testid="button-language-toggle"
                >
                  <Globe2 className="h-3.5 w-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-48 p-2 bg-[#0D2847]/98 backdrop-blur-xl border border-white/20 shadow-2xl" 
                align="end"
              >
                <div className="space-y-1">
                  <button
                    onClick={() => i18n.changeLanguage('pt-BR')}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm text-white/90 hover:bg-white/10 rounded transition-colors"
                    data-testid="option-language-pt"
                  >
                    <span>Português (BR)</span>
                    {i18n.language === 'pt-BR' && <Check className="h-4 w-4 text-accent" />}
                  </button>
                  <button
                    onClick={() => i18n.changeLanguage('en-US')}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm text-white/90 hover:bg-white/10 rounded transition-colors"
                    data-testid="option-language-en"
                  >
                    <span>English (US)</span>
                    {i18n.language === 'en-US' && <Check className="h-4 w-4 text-accent" />}
                  </button>
                </div>
              </PopoverContent>
            </Popover>
            <a href="#" className="text-white/50 hover:text-accent text-[11px] font-medium tracking-widest uppercase transition-colors">{t('landing.topbar.support')}</a>
            <a href="#" className="hidden md:inline text-white/50 hover:text-accent text-[11px] font-medium tracking-widest uppercase transition-colors">{t('landing.topbar.institutional')}</a>
          </div>
        </div>
      </div>

      {/* Premium Navigation */}
      <nav className="bg-gradient-to-b from-primary/98 to-primary/95 backdrop-blur-2xl sticky top-0 z-50 border-b border-white/10 shadow-2xl shadow-black/20">
        <div className="max-w-[1600px] mx-auto px-8 lg:px-16">
          <div className="flex justify-between items-center py-1">
            <div className="flex items-center gap-16">
              {/* Logo Section */}
              <div className="flex items-center">
                <img src={logoPath} alt="Opus Capital" className="h-40" />
              </div>
              
              {/* Navigation Links */}
              <div className="hidden lg:flex items-center gap-10">
                <a href="#portfolio" className="text-white/70 hover:text-white text-sm font-medium transition-colors relative group">
                  {t('landing.nav.portfolio')}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent group-hover:w-full transition-all duration-300" />
                </a>
                <a href="#tracking" className="text-white/70 hover:text-white text-sm font-medium transition-colors relative group">
                  {t('landing.nav.tracking')}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent group-hover:w-full transition-all duration-300" />
                </a>
                <a href="#reports" className="text-white/70 hover:text-white text-sm font-medium transition-colors relative group">
                  {t('landing.nav.reports')}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent group-hover:w-full transition-all duration-300" />
                </a>
                <a href="#pricing" className="text-white/70 hover:text-white text-sm font-medium transition-colors relative group">
                  {t('landing.nav.plans')}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent group-hover:w-full transition-all duration-300" />
                </a>
              </div>
            </div>
            
            {/* CTA Buttons */}
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button 
                  variant="ghost"
                  className="text-white font-semibold hover:bg-white/10 rounded-lg px-5"
                  data-testid="button-client-portal"
                >
                  {t('landing.nav.access')}
                </Button>
              </Link>
              <Link href="/register">
                <Button 
                  className="bg-accent hover:bg-accent/90 text-white font-semibold shadow-lg shadow-accent/25 rounded-lg px-6"
                  data-testid="button-open-account"
                >
                  {t('landing.nav.openAccount')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Professional Banking Style */}
      <section className="relative py-12 lg:py-16 px-6 lg:px-12 overflow-hidden">
        {/* Subtle Lighting Effects */}
        <div className="absolute top-0 right-[15%] w-[600px] h-[600px] bg-accent/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 left-[10%] w-[500px] h-[500px] bg-accent/8 rounded-full blur-[120px]" />
        
        <div className="max-w-[1600px] mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            {/* Left: Hero Content */}
            <div className="space-y-8">
              <motion.h1 
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                className="font-bold text-white leading-[1.08] tracking-tight"
                style={{ 
                  fontSize: 'clamp(2.5rem, 5.5vw, 4.5rem)',
                  letterSpacing: '-0.02em'
                }}
                data-testid="text-hero-title"
              >
                {t('landing.hero.title')}{' '}
                <span className="text-accent">{t('landing.hero.titleHighlight')}</span>{' '}
                {t('landing.hero.titleEnd')}
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="text-lg text-white/75 leading-relaxed font-light max-w-xl" 
                data-testid="text-hero-description"
              >
                {t('landing.hero.description')}
              </motion.p>

              {/* CTA Buttons */}
              <motion.div 
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-wrap gap-4 pt-2"
              >
                <Link href="/register">
                  <Button 
                    size="lg"
                    className="font-semibold text-base h-12 px-8 bg-accent hover:bg-accent/90 text-white border-0 shadow-lg shadow-accent/25"
                    data-testid="button-start-investing"
                  >
                    {t('landing.hero.startInvesting')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="font-semibold text-base h-12 px-7 border border-white/20 text-white bg-white/5 backdrop-blur-sm hover:bg-white/10"
                  data-testid="button-watch-video"
                >
                  <PlayCircle className="mr-2 h-4 w-4" />
                  {t('landing.hero.howItWorks')}
                </Button>
              </motion.div>

              {/* Key Stats - Minimal Design */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="grid grid-cols-3 gap-6 pt-8 border-t border-white/10"
              >
                {[
                  { value: "24%", label: t('landing.hero.stats.annual'), sublabel: t('landing.hero.stats.guaranteed') },
                  { value: "GPS", label: t('landing.hero.stats.tracking'), sublabel: t('landing.hero.stats.realTime') },
                  { value: "2.500+", label: t('landing.hero.stats.investors'), sublabel: t('landing.hero.stats.active') }
                ].map((item, i) => (
                  <div key={i} className="space-y-1">
                    <div className="text-2xl font-bold text-white tracking-tight">{item.value}</div>
                    <div className="text-xs text-white/60 font-medium">{item.label}</div>
                    <div className="text-xs text-white/40">{item.sublabel}</div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right: Dashboard Preview - Clean Glassmorphism */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-accent/15 rounded-3xl blur-3xl" />
              <Card className="relative bg-white/8 backdrop-blur-2xl border border-white/10 p-8 rounded-2xl shadow-2xl">
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-5 border-b border-white/10">
                    <div>
                      <h3 className="font-semibold text-white text-base mb-1">Performance em Tempo Real</h3>
                      <p className="text-xs text-white/50">Atualizado continuamente</p>
                    </div>
                    <Badge className="bg-green-500/20 text-green-400 border border-green-500/30 text-xs">
                      <Activity className="h-3 w-3 mr-1" />
                      Live
                    </Badge>
                  </div>

                  {/* Clean Stats Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: "Ativos Sob Gestão", value: "R$ 42M", trend: "+12%", icon: DollarSign },
                      { label: "Trailers Ativos", value: "2.847", trend: "+8%", icon: MapPin },
                      { label: "Investidores", value: "2.500+", trend: "+15%", icon: Users },
                      { label: "Taxa de Retorno", value: "24% a.a.", trend: "Garantido", icon: Percent }
                    ].map((stat, i) => (
                      <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/8 transition-all">
                        <div className="flex items-center justify-between mb-3">
                          <stat.icon className="h-4 w-4 text-accent" />
                          <div className="text-xs text-green-400 flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {stat.trend}
                          </div>
                        </div>
                        <div className="text-xs text-white/50 mb-1">{stat.label}</div>
                        <div className="text-2xl font-bold text-white tracking-tight">{stat.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Activity Feed */}
                  <div className="space-y-3 pt-5 border-t border-white/10">
                    <div className="text-xs font-semibold text-white/70 uppercase tracking-wide">Atividade Recente</div>
                    {[
                      { action: "Pagamento processado", value: "R$ 12.500", time: "2 min" },
                      { action: "Novo investimento", value: "R$ 5.000", time: "15 min" },
                      { action: "GPS atualizado", value: "Trailer #2847", time: "32 min" }
                    ].map((activity, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
                            <CheckCircle className="h-4 w-4 text-accent" />
                          </div>
                          <div>
                            <div className="text-xs font-medium text-white">{activity.action}</div>
                            <div className="text-xs text-white/40">há {activity.time}</div>
                          </div>
                        </div>
                        <div className="text-xs font-semibold text-white">{activity.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Bar - Minimal */}
      <section className="relative py-12 px-6 lg:px-12 bg-white/5 border-y border-white/10 backdrop-blur-sm">
        <div className="max-w-[1600px] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: DollarSign, value: "R$ 42M+", label: "Ativos sob gestão" },
              { icon: MapPin, value: "2.847", label: "Trailers ativos" },
              { icon: Users, value: "2.500+", label: "Investidores" },
              { icon: CheckCircle, value: "100%", label: "Pagamentos no prazo" }
            ].map((stat, i) => (
              <div key={i} className="text-center" data-testid={`stat-${i}`}>
                <stat.icon className="h-8 w-8 text-accent mx-auto mb-3" />
                <div className="text-3xl font-bold text-white mb-1 tracking-tight">{stat.value}</div>
                <div className="text-xs text-white/50 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Interactive Cards */}
      <section className="relative py-24 px-6 lg:px-12">
        <div className="max-w-[1600px] mx-auto">
          <div className="text-center mb-20">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-4xl lg:text-5xl font-bold text-white mb-5 tracking-tight"
            >
              Como funciona
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-lg text-white/60 font-light leading-relaxed"
            >
              Processo simples e transparente para começar a investir em ativos reais
            </motion.p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                icon: Users,
                title: "Cadastro",
                desc: "Abertura de conta digital em minutos",
                stat: "<5min",
                statLabel: "tempo médio",
                color: "from-blue-500/20 to-cyan-500/20"
              },
              {
                step: "02",
                icon: DollarSign,
                title: "Investimento",
                desc: "A partir de R$ 500 em cotas",
                stat: "R$ 500",
                statLabel: "investimento mínimo",
                color: "from-accent/20 to-blue-500/20"
              },
              {
                step: "03",
                icon: MapPin,
                title: "Acompanhamento",
                desc: "Rastreamento GPS em tempo real",
                stat: "24/7",
                statLabel: "monitoramento",
                color: "from-cyan-500/20 to-accent/20"
              },
              {
                step: "04",
                icon: TrendingUp,
                title: "Rendimentos",
                desc: "2% mensais direto na conta",
                stat: "2%",
                statLabel: "retorno mensal",
                color: "from-blue-600/20 to-cyan-400/20"
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -8 }}
                className="group relative"
              >
                {/* Glow effect on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${item.color} rounded-2xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500`} />
                
                <div className="relative h-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 group-hover:bg-white/8 group-hover:border-accent/40 transition-all duration-300">
                  {/* Icon com animação */}
                  <motion.div 
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                    className="h-16 w-16 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center mb-6 border border-accent/30 group-hover:border-accent group-hover:shadow-lg group-hover:shadow-accent/30"
                  >
                    <item.icon className="h-8 w-8 text-accent" />
                  </motion.div>

                  {/* Número do passo */}
                  <div className="absolute top-6 right-6 text-6xl font-black text-white/5 leading-none">
                    {item.step}
                  </div>

                  {/* Título */}
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-accent transition-colors">
                    {item.title}
                  </h3>
                  
                  {/* Descrição */}
                  <p className="text-sm text-white/60 leading-relaxed mb-6">
                    {item.desc}
                  </p>

                  {/* Estatística */}
                  <div className="pt-6 border-t border-white/10 group-hover:border-accent/30 transition-colors">
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.4, delay: i * 0.1 + 0.3 }}
                      viewport={{ once: true }}
                      className="space-y-1"
                    >
                      <div className="text-3xl font-black text-accent">
                        {item.stat}
                      </div>
                      <div className="text-xs text-white/50 uppercase tracking-wider font-semibold">
                        {item.statLabel}
                      </div>
                    </motion.div>
                  </div>

                  {/* Brilho sutil no canto */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-accent/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features - Radial Orbital Platform */}
      <section className="relative py-12 px-6 lg:px-12 bg-white/3">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-8">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-3xl lg:text-4xl font-bold text-white mb-3 tracking-tight"
            >
              {t('landing.features.title')}
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-base text-white/60 font-light max-w-2xl mx-auto"
            >
              {t('landing.features.subtitle')}
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <RadialOrbitalTimeline
              timelineData={[
                {
                  id: 1,
                  title: t('landing.orbital.investment.title'),
                  date: "2024",
                  content: t('landing.orbital.investment.content'),
                  category: "finance",
                  icon: DollarSign,
                  relatedIds: [2, 5],
                  status: "completed",
                  energy: 95,
                },
                {
                  id: 2,
                  title: t('landing.orbital.gps.title'),
                  date: "2024",
                  content: t('landing.orbital.gps.content'),
                  category: "tracking",
                  icon: MapPin,
                  relatedIds: [1, 3],
                  status: "completed",
                  energy: 98,
                },
                {
                  id: 3,
                  title: t('landing.orbital.analytics.title'),
                  date: "2024",
                  content: t('landing.orbital.analytics.content'),
                  category: "analytics",
                  icon: BarChart3,
                  relatedIds: [2, 4, 5],
                  status: "in-progress",
                  energy: 87,
                },
                {
                  id: 4,
                  title: t('landing.orbital.documentation.title'),
                  date: "2024",
                  content: t('landing.orbital.documentation.content'),
                  category: "legal",
                  icon: FileText,
                  relatedIds: [3, 5],
                  status: "completed",
                  energy: 100,
                },
                {
                  id: 5,
                  title: t('landing.orbital.payments.title'),
                  date: "2024",
                  content: t('landing.orbital.payments.content'),
                  category: "payments",
                  icon: TrendingUp,
                  relatedIds: [1, 3, 4],
                  status: "completed",
                  energy: 92,
                },
              ]}
            />
          </motion.div>

          {/* Stats cards abaixo */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            {[
              {
                label: t('landing.features.stats.activeTrailers'),
                value: "2.847",
                icon: MapPin,
              },
              {
                label: t('landing.features.stats.dataAccuracy'),
                value: "99.8%",
                icon: BarChart3,
              },
              {
                label: t('landing.features.stats.legalCompliance'),
                value: "100%",
                icon: FileText,
              },
              {
                label: t('landing.features.stats.responseTime'),
                value: "<2min",
                icon: Bell,
              },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:border-accent/30 transition-all"
              >
                <stat.icon className="h-6 w-6 text-accent mb-2" />
                <div className="text-2xl font-black text-white mb-1">{stat.value}</div>
                <div className="text-xs text-white/50 uppercase tracking-wider font-semibold">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Global Network Map */}
      <section className="relative py-12 px-6 lg:px-12 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-4xl lg:text-5xl font-bold text-white mb-5 tracking-tight"
            >
              {t('landing.globalNetwork.title')}{' '}
              <span className="text-accent">{t('landing.globalNetwork.titleHighlight')}</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-lg text-white/60 font-light max-w-2xl mx-auto"
            >
              {t('landing.globalNetwork.description')}
            </motion.p>
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <WorldMap
              dots={[
                // América do Norte
                {
                  start: { lat: -23.5505, lng: -46.6333 }, // São Paulo
                  end: { lat: 40.7128, lng: -74.0060 }, // Nova York
                },
                {
                  start: { lat: -23.5505, lng: -46.6333 }, // São Paulo
                  end: { lat: 25.7617, lng: -80.1918 }, // Miami
                },
                // Europa
                {
                  start: { lat: -23.5505, lng: -46.6333 }, // São Paulo
                  end: { lat: 51.5074, lng: -0.1278 }, // Londres
                },
                {
                  start: { lat: -23.5505, lng: -46.6333 }, // São Paulo
                  end: { lat: 48.8566, lng: 2.3522 }, // Paris
                },
                // América Latina
                {
                  start: { lat: -23.5505, lng: -46.6333 }, // São Paulo
                  end: { lat: -34.6037, lng: -58.3816 }, // Buenos Aires
                },
                {
                  start: { lat: -23.5505, lng: -46.6333 }, // São Paulo
                  end: { lat: 19.4326, lng: -99.1332 }, // Cidade do México
                },
              ]}
              lineColor="#2196F3"
            />
          </motion.div>
        </div>
      </section>

      {/* Pricing - Professional */}
      <section id="pricing" className="relative py-24 px-6 lg:px-12">
        <div className="max-w-[1600px] mx-auto">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-5 tracking-tight">
              Planos de investimento
            </h2>
            <p className="text-lg text-white/60 font-light">
              Todos os planos com rentabilidade garantida de 24% ao ano
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                name: "Starter",
                price: "R$ 500",
                popular: false,
                features: [
                  "1-5 cotas de trailers",
                  "Rastreamento GPS",
                  "Relatórios mensais",
                  "Suporte por email",
                  "Dashboard web"
                ]
              },
              {
                name: "Growth",
                price: "R$ 5.000",
                popular: true,
                features: [
                  "6-20 cotas de trailers",
                  "GPS com alertas",
                  "Relatórios avançados",
                  "Suporte prioritário",
                  "App mobile",
                  "Análises personalizadas"
                ]
              },
              {
                name: "Premium",
                price: "R$ 50.000",
                popular: false,
                features: [
                  "20+ cotas de trailers",
                  "Gestor dedicado",
                  "Relatórios personalizados",
                  "Suporte 24/7",
                  "API de integração",
                  "Consultoria exclusiva"
                ]
              }
            ].map((plan, i) => (
              <div key={i} className="relative">
                {plan.popular && (
                  <div className="absolute -top-4 left-0 right-0 flex justify-center z-20">
                    <Badge className="bg-accent text-white border-0 shadow-lg px-4 py-1.5 text-xs font-semibold">
                      Mais Popular
                    </Badge>
                  </div>
                )}
                <Card className={`relative h-full bg-white/5 backdrop-blur-sm border ${
                  plan.popular ? 'border-accent/50 bg-accent/5' : 'border-white/10'
                } p-8 rounded-2xl transition-all hover:border-accent/30`}>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-3">{plan.name}</h3>
                      <div className="flex items-baseline gap-2 mb-6">
                        <div className="text-4xl font-bold text-white tracking-tight">{plan.price}</div>
                        <div className="text-sm text-white/50">inicial</div>
                      </div>
                    </div>

                    <div className="py-5 border-y border-white/10 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-white/60">Retorno anual</div>
                        <div className="text-2xl font-bold text-accent">24%</div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-white/60">Retorno mensal</div>
                        <div className="text-xl font-bold text-white">2%</div>
                      </div>
                    </div>

                    <ul className="space-y-3">
                      {plan.features.map((feature, j) => (
                        <li key={j} className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5 text-accent" />
                          <span className="text-sm text-white/70">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Link href="/register">
                      <Button 
                        className={`w-full h-11 text-sm font-semibold ${
                          plan.popular 
                            ? 'bg-accent hover:bg-accent/90 text-white' 
                            : 'bg-white/10 hover:bg-white/15 text-white border border-white/20'
                        }`}
                      >
                        Começar Agora
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

      {/* Trust - Minimal */}
      <section className="relative py-24 px-6 lg:px-12 bg-white/3">
        <div className="max-w-[1600px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-5 tracking-tight">
              Confiança e segurança
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Shield,
                title: "Regulamentado",
                desc: "Contratos registrados e auditados"
              },
              {
                icon: Lock,
                title: "Fundos Protegidos",
                desc: "Capital em contas segregadas"
              },
              {
                icon: CheckCircle,
                title: "Compliance",
                desc: "Auditoria trimestral externa"
              },
              {
                icon: Award,
                title: "Premiado",
                desc: "Melhor plataforma 2024"
              }
            ].map((item, i) => (
              <Card key={i} className="bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-2xl text-center hover:bg-white/8 transition-all">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-accent/10 border border-accent/20 mb-5">
                  <item.icon className="h-8 w-8 text-accent" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">{item.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{item.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA - Professional */}
      <section className="relative py-28 px-6 lg:px-12">
        <div className="absolute inset-0 bg-gradient-to-r from-accent/20 via-accent/10 to-transparent" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-7">
          <h2 className="text-4xl lg:text-5xl font-bold text-white tracking-tight">
            Comece a investir hoje
          </h2>
          <p className="text-xl text-white/70 font-light max-w-2xl mx-auto">
            Junte-se a mais de 2.500 investidores construindo patrimônio com segurança
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/register">
              <Button 
                size="lg"
                className="font-semibold text-base h-12 px-10 bg-accent hover:bg-accent/90 text-white shadow-lg"
                data-testid="button-cta-register"
              >
                Abrir Conta Agora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button 
                variant="outline"
                size="lg"
                className="font-semibold text-base h-12 px-10 bg-white/5 backdrop-blur-sm border border-white/20 text-white hover:bg-white/10"
                data-testid="button-cta-login"
              >
                Já sou Cliente
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer - Clean */}
      <footer className="relative py-16 px-6 lg:px-12 border-t border-white/10 bg-white/3">
        <div className="max-w-[1600px] mx-auto">
          <div className="grid md:grid-cols-5 gap-12 mb-12">
            <div className="md:col-span-2 space-y-5">
              <div className="flex items-center gap-3">
                <img src={logoPath} alt="Opus" className="h-9 w-9" />
                <span className="font-semibold text-white text-lg">Opus Capital</span>
              </div>
              <p className="text-sm text-white/50 leading-relaxed max-w-md font-light">
                Plataforma institucional de investimento em ativos reais. 
                Transparência, tecnologia e segurança para o seu patrimônio.
              </p>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-accent fill-current" />
                ))}
                <span className="text-xs text-white/40 ml-2">4.9/5 (500+ avaliações)</span>
              </div>
            </div>

            {[
              { 
                title: "Plataforma", 
                links: ["Portfólio", "Rastreamento", "Relatórios", "Planos"] 
              },
              { 
                title: "Empresa", 
                links: ["Sobre", "Blog", "Carreiras"] 
              },
              { 
                title: "Legal", 
                links: ["Termos", "Privacidade", "Compliance"] 
              }
            ].map((section, i) => (
              <div key={i} className="space-y-4">
                <h3 className="font-semibold text-white text-sm">{section.title}</h3>
                <ul className="space-y-2.5">
                  {section.links.map((link, j) => (
                    <li key={j}>
                      <a href="#" className="text-sm text-white/50 hover:text-accent transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-white/40">
              © 2025 Opus Capital. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-6 text-xs text-white/40">
              <a href="#" className="hover:text-accent transition-colors">Status</a>
              <a href="#" className="hover:text-accent transition-colors">API</a>
              <a href="#" className="hover:text-accent transition-colors">Suporte</a>
            </div>
          </div>
        </div>
      </footer>

      <CookieConsent />
    </div>
  );
}
