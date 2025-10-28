import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { 
  ArrowRight, 
  Shield, 
  Lock,
  FileCheck,
  Fingerprint,
  ShieldCheck,
  Database,
  Eye,
  Landmark,
  TrendingUp,
  MapPin,
  BarChart3,
  Truck,
  DollarSign,
  CheckCircle2,
  Award,
  Users,
  Clock,
  Zap,
  Building2,
  Globe2,
  FileText,
  Bell,
  Activity,
  Server,
  AlertTriangle,
  CheckCircle,
  Target,
  Briefcase,
  LineChart,
  PieChart,
  Calendar,
  Download,
  Upload,
  Phone,
  Mail,
  MapPinned,
  MessageSquare,
  ChevronRight,
  Star
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/hooks/useTheme";
import logoPath from "@assets/image_1759264185138.png";

export default function Landing() {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06,
        delayChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Advanced Navigation Bar - Investment Bank Style */}
      <nav className="fixed top-0 w-full bg-card/95 backdrop-blur-xl border-b border-border z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Trust Bar */}
          <div className="flex justify-between items-center py-2 sm:py-2.5 border-b border-border/50">
            <div className="flex items-center gap-3 sm:gap-6 text-xs">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Shield className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-accent" />
                <span className="hidden sm:inline font-medium">{t('landing.trustBar.secRegistered')}</span>
                <span className="sm:hidden font-medium">SEC</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Lock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-accent" />
                <span className="hidden md:inline font-medium">{t('landing.trustBar.bankSecurity')}</span>
                <span className="md:hidden font-medium">{t('landing.trustBar.bankSecurity').split('-')[0]}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Award className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-accent" />
                <span className="hidden sm:inline font-medium">{t('landing.trustBar.fdic')}</span>
                <span className="sm:hidden font-medium">FDIC</span>
              </div>
              <div className="hidden lg:flex items-center gap-1.5 text-muted-foreground">
                <CheckCircle className="h-3.5 w-3.5 text-accent" />
                <span className="font-medium">{t('landing.trustBar.soc2')}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                data-testid="button-toggle-theme"
              >
                {theme === "dark" ? "☀️" : "🌙"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => i18n.changeLanguage(i18n.language === "en" ? "pt" : "en")}
                className="h-7 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
                data-testid="button-toggle-language"
              >
                {i18n.language === "en" ? "PT" : "EN"}
              </Button>
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
                <Phone className="h-3 w-3" />
                <span className="font-medium">{t('landing.trustBar.phone')}</span>
              </div>
            </div>
          </div>

          {/* Main Navigation */}
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
                  {t('landing.nav.tagline')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              <Link href="/login">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-9 sm:h-10 text-xs sm:text-sm font-semibold" 
                  data-testid="button-login"
                >
                  {t('landing.nav.clientPortal')}
                </Button>
              </Link>
              <Link href="/register">
                <Button 
                  size="sm" 
                  className="h-9 sm:h-10 px-4 sm:px-6 text-xs sm:text-sm font-bold bg-accent hover:bg-accent/90 shadow-lg" 
                  data-testid="button-get-started"
                >
                  {t('landing.nav.openAccount')}
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Enhanced with Background Pattern */}
      <section className="pt-32 sm:pt-40 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-background to-background"></div>
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25"></div>
        
        <div className="max-w-7xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-6 sm:mb-8"
            >
              <Landmark className="h-4 w-4 text-accent" />
              <span className="text-xs sm:text-sm font-bold text-accent">
                {t('landing.hero.badge')}
              </span>
            </motion.div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-foreground mb-6 sm:mb-8 leading-[1.1] tracking-tight">
              {t('landing.hero.headline')}
              <br />
              <span className="text-accent">{t('landing.hero.headlineAccent')}</span>
              <br className="hidden sm:block" />
              <span className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-muted-foreground">
                {t('landing.hero.headlineSubtitle')}
              </span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-4xl mx-auto mb-10 sm:mb-12 leading-relaxed">
              {t('landing.hero.description')}
              <br className="hidden sm:block" />
              {t('landing.hero.descriptionExtended')}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-12 sm:mb-16">
              <Link href="/register">
                <Button 
                  size="lg" 
                  className="h-13 sm:h-14 px-8 sm:px-10 text-base sm:text-lg font-bold bg-accent hover:bg-accent/90 shadow-xl hover:shadow-2xl transition-all w-full sm:w-auto group" 
                  data-testid="button-hero-register"
                >
                  {t('landing.hero.ctaRegister')}
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
                  {t('landing.hero.ctaLogin')}
                </Button>
              </Link>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap justify-center items-center gap-4 sm:gap-8 pt-8 sm:pt-10 border-t border-border"
            >
              <div className="flex items-center gap-2 text-muted-foreground">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
                <span className="text-xs sm:text-sm font-bold">{t('landing.hero.certSec')}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Award className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
                <span className="text-xs sm:text-sm font-bold">{t('landing.hero.certFinra')}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
                <span className="text-xs sm:text-sm font-bold">{t('landing.hero.certFdic')}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <FileCheck className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
                <span className="text-xs sm:text-sm font-bold">{t('landing.hero.certSoc2')}</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-16 sm:mt-20"
          >
            {[
              { value: t('landing.stats.aum'), label: t('landing.stats.aumLabel'), icon: Landmark, sublabel: t('landing.stats.aumSub') },
              { value: t('landing.stats.trailers'), label: t('landing.stats.trailersLabel'), icon: Truck, sublabel: t('landing.stats.trailersSub') },
              { value: t('landing.stats.uptime'), label: t('landing.stats.uptimeLabel'), icon: Zap, sublabel: t('landing.stats.uptimeSub') },
              { value: t('landing.stats.investors'), label: t('landing.stats.investorsLabel'), icon: Users, sublabel: t('landing.stats.investorsSub') }
            ].map((stat, index) => (
              <motion.div key={index} variants={item}>
                <Card className="border-2 border-border hover:border-accent/50 transition-all hover:shadow-xl bg-card">
                  <CardContent className="p-5 sm:p-6 text-center">
                    <stat.icon className="h-8 w-8 mx-auto mb-4 text-accent" />
                    <div className="text-3xl sm:text-4xl font-extrabold text-foreground mb-2">{stat.value}</div>
                    <div className="text-xs sm:text-sm text-foreground font-bold mb-1">{stat.label}</div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground font-medium">{stat.sublabel}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Security Architecture Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 sm:mb-16"
          >
            <Badge variant="secondary" className="mb-4 text-xs sm:text-sm font-bold px-4 py-1.5">
              <Shield className="h-3.5 w-3.5 mr-1.5 inline" />
              {t('landing.security.badge')}
            </Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground mb-4 sm:mb-6">
              {t('landing.security.title')}
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-6">
              {t('landing.security.description')}
            </p>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
              <Badge variant="outline" className="text-xs font-semibold">
                <Lock className="h-3 w-3 mr-1" />
                {t('landing.security.badgeAes')}
              </Badge>
              <Badge variant="outline" className="text-xs font-semibold">
                <Server className="h-3 w-3 mr-1" />
                {t('landing.security.badgeRedundancy')}
              </Badge>
              <Badge variant="outline" className="text-xs font-semibold">
                <Eye className="h-3 w-3 mr-1" />
                {t('landing.security.badgeSoc')}
              </Badge>
              <Badge variant="outline" className="text-xs font-semibold">
                <FileCheck className="h-3 w-3 mr-1" />
                {t('landing.security.badgeAudit')}
              </Badge>
            </div>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-12"
          >
            {[
              {
                icon: ShieldCheck,
                title: t('landing.security.encryption.title'),
                description: t('landing.security.encryption.description'),
                badge: t('landing.security.encryption.badge'),
                features: [
                  t('landing.security.encryption.feature1'),
                  t('landing.security.encryption.feature2'),
                  t('landing.security.encryption.feature3')
                ]
              },
              {
                icon: Fingerprint,
                title: t('landing.security.mfa.title'),
                description: t('landing.security.mfa.description'),
                badge: t('landing.security.mfa.badge'),
                features: [
                  t('landing.security.mfa.feature1'),
                  t('landing.security.mfa.feature2'),
                  t('landing.security.mfa.feature3')
                ]
              },
              {
                icon: Database,
                title: t('landing.security.redundancy.title'),
                description: t('landing.security.redundancy.description'),
                badge: t('landing.security.redundancy.badge'),
                features: [
                  t('landing.security.redundancy.feature1'),
                  t('landing.security.redundancy.feature2'),
                  t('landing.security.redundancy.feature3')
                ]
              },
              {
                icon: FileCheck,
                title: t('landing.security.compliance.title'),
                description: t('landing.security.compliance.description'),
                badge: t('landing.security.compliance.badge'),
                features: [
                  t('landing.security.compliance.feature1'),
                  t('landing.security.compliance.feature2'),
                  t('landing.security.compliance.feature3')
                ]
              },
              {
                icon: Eye,
                title: t('landing.security.soc.title'),
                description: t('landing.security.soc.description'),
                badge: t('landing.security.soc.badge'),
                features: [
                  t('landing.security.soc.feature1'),
                  t('landing.security.soc.feature2'),
                  t('landing.security.soc.feature3')
                ]
              },
              {
                icon: Lock,
                title: t('landing.security.custody.title'),
                description: t('landing.security.custody.description'),
                badge: t('landing.security.custody.badge'),
                features: [
                  t('landing.security.custody.feature1'),
                  t('landing.security.custody.feature2'),
                  t('landing.security.custody.feature3')
                ]
              }
            ].map((feature, index) => (
              <motion.div key={index} variants={item}>
                <Card className="h-full border-2 border-border hover:border-accent/50 transition-all hover:shadow-xl bg-card group">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <feature.icon className="h-6 w-6 text-accent" />
                      </div>
                      <Badge className="text-[10px] font-bold bg-accent/20 text-accent border-accent/30">
                        {feature.badge}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg sm:text-xl font-bold">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                    <div className="space-y-1.5 pt-2 border-t border-border">
                      {feature.features.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <CheckCircle className="h-3.5 w-3.5 text-accent flex-shrink-0" />
                          <span className="text-muted-foreground font-medium">{item}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Security Timeline */}
          <Card className="border-2 border-accent/20 bg-gradient-to-br from-accent/5 to-background">
            <CardContent className="p-6 sm:p-10">
              <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-6 text-center">
                {t('landing.security.process.title')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
                {[
                  { step: "1", title: t('landing.security.process.step1'), desc: t('landing.security.process.step1Desc') },
                  { step: "2", title: t('landing.security.process.step2'), desc: t('landing.security.process.step2Desc') },
                  { step: "3", title: t('landing.security.process.step3'), desc: t('landing.security.process.step3Desc') },
                  { step: "4", title: t('landing.security.process.step4'), desc: t('landing.security.process.step4Desc') }
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center text-center relative">
                    {i < 3 && (
                      <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-accent/30"></div>
                    )}
                    <div className="w-16 h-16 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-2xl font-black mb-3 relative z-10 shadow-lg">
                      {item.step}
                    </div>
                    <h4 className="font-bold text-foreground mb-1 text-sm sm:text-base">{item.title}</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Investment Performance Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 sm:mb-16"
          >
            <Badge variant="secondary" className="mb-4 text-xs sm:text-sm font-bold px-4 py-1.5">
              <TrendingUp className="h-3.5 w-3.5 mr-1.5 inline" />
              {t('landing.investment.badge')}
            </Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground mb-4 sm:mb-6">
              {t('landing.investment.title')}
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              {t('landing.investment.description')}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 mb-12">
            {/* Performance Card */}
            <Card className="border-2 border-border hover:shadow-2xl transition-all">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
                  <LineChart className="h-6 w-6 text-accent" />
                  {t('landing.investment.performance.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center p-6 bg-accent/5 rounded-xl border border-accent/20">
                  <div className="text-5xl font-black text-accent mb-2">{t('landing.investment.performance.rate')}</div>
                  <div className="text-sm font-bold text-foreground mb-1">{t('landing.investment.performance.rateLabel')}</div>
                  <div className="text-xs text-muted-foreground">{t('landing.investment.performance.rateSub')}</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-foreground">{t('landing.investment.performance.minimum')}</div>
                    <div className="text-xs text-muted-foreground mt-1">{t('landing.investment.performance.minimumLabel')}</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-foreground">{t('landing.investment.performance.monthly')}</div>
                    <div className="text-xs text-muted-foreground mt-1">{t('landing.investment.performance.monthlyLabel')}</div>
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    { label: t('landing.investment.performance.feature1'), icon: Truck },
                    { label: t('landing.investment.performance.feature2'), icon: Calendar },
                    { label: t('landing.investment.performance.feature3'), icon: CheckCircle },
                    { label: t('landing.investment.performance.feature4'), icon: Upload }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <item.icon className="h-4 w-4 text-accent" />
                      <span className="text-muted-foreground font-medium">{item.label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Asset Details Card */}
            <Card className="border-2 border-border hover:shadow-2xl transition-all">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
                  <Truck className="h-6 w-6 text-accent" />
                  {t('landing.investment.assets.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: t('landing.investment.assets.totalAssets'), value: t('landing.investment.assets.totalValue'), icon: DollarSign },
                    { label: t('landing.investment.assets.activeTrailers'), value: t('landing.investment.assets.trailersValue'), icon: Truck },
                    { label: t('landing.investment.assets.avgValue'), value: t('landing.investment.assets.avgAmount'), icon: Target },
                    { label: t('landing.investment.assets.occupancy'), value: t('landing.investment.assets.occupancyRate'), icon: Activity }
                  ].map((stat, i) => (
                    <div key={i} className="p-4 bg-muted rounded-lg">
                      <stat.icon className="h-5 w-5 text-accent mb-2" />
                      <div className="text-xl font-bold text-foreground">{stat.value}</div>
                      <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                    </div>
                  ))}
                </div>
                <div className="space-y-3 pt-4 border-t border-border">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-bold text-sm text-foreground mb-1">{t('landing.investment.assets.gpsTitle')}</div>
                      <div className="text-xs text-muted-foreground">{t('landing.investment.assets.gpsDesc')}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <BarChart3 className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-bold text-sm text-foreground mb-1">{t('landing.investment.assets.transparencyTitle')}</div>
                      <div className="text-xs text-muted-foreground">{t('landing.investment.assets.transparencyDesc')}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-bold text-sm text-foreground mb-1">{t('landing.investment.assets.insuranceTitle')}</div>
                      <div className="text-xs text-muted-foreground">{t('landing.investment.assets.insuranceDesc')}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Investment Process */}
          <Card className="border-2 border-accent/20 bg-gradient-to-br from-card to-muted/20">
            <CardContent className="p-6 sm:p-10">
              <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-8 text-center">
                {t('landing.investment.process.title')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 sm:gap-8">
                {[
                  { icon: FileText, title: t('landing.investment.process.step1'), desc: t('landing.investment.process.step1Desc') },
                  { icon: Target, title: t('landing.investment.process.step2'), desc: t('landing.investment.process.step2Desc') },
                  { icon: DollarSign, title: t('landing.investment.process.step3'), desc: t('landing.investment.process.step3Desc') },
                  { icon: TrendingUp, title: t('landing.investment.process.step4'), desc: t('landing.investment.process.step4Desc') }
                ].map((step, i) => (
                  <div key={i} className="relative">
                    {i < 3 && (
                      <div className="hidden md:block absolute top-10 left-[65%] w-[70%] border-t-2 border-dashed border-accent/30"></div>
                    )}
                    <div className="flex flex-col items-center text-center relative z-10">
                      <div className="w-20 h-20 rounded-2xl bg-accent text-accent-foreground flex items-center justify-center mb-4 shadow-xl">
                        <step.icon className="h-10 w-10" />
                      </div>
                      <h4 className="font-bold text-foreground mb-2">{step.title}</h4>
                      <p className="text-sm text-muted-foreground">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Compliance & Regulation Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge variant="secondary" className="mb-4 text-xs sm:text-sm font-bold px-4 py-1.5">
              <Landmark className="h-3.5 w-3.5 mr-1.5 inline" />
              {t('landing.compliance.badge')}
            </Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground mb-4">
              {t('landing.compliance.title')}
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('landing.compliance.description')}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {[
              {
                icon: Shield,
                title: t('landing.compliance.sec.title'),
                desc: t('landing.compliance.sec.description'),
                details: [
                  t('landing.compliance.sec.feature1'),
                  t('landing.compliance.sec.feature2'),
                  t('landing.compliance.sec.feature3')
                ]
              },
              {
                icon: Building2,
                title: t('landing.compliance.finra.title'),
                desc: t('landing.compliance.finra.description'),
                details: [
                  t('landing.compliance.finra.feature1'),
                  t('landing.compliance.finra.feature2'),
                  t('landing.compliance.finra.feature3')
                ]
              },
              {
                icon: Lock,
                title: t('landing.compliance.fdic.title'),
                desc: t('landing.compliance.fdic.description'),
                details: [
                  t('landing.compliance.fdic.feature1'),
                  t('landing.compliance.fdic.feature2'),
                  t('landing.compliance.fdic.feature3')
                ]
              }
            ].map((item, i) => (
              <Card key={i} className="border-2 border-border hover:border-accent/50 transition-all">
                <CardContent className="p-6">
                  <item.icon className="h-12 w-12 text-accent mb-4" />
                  <h3 className="text-xl font-bold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{item.desc}</p>
                  <div className="space-y-2">
                    {item.details.map((detail, j) => (
                      <div key={j} className="flex items-center gap-2 text-xs">
                        <CheckCircle className="h-3.5 w-3.5 text-accent" />
                        <span className="text-muted-foreground font-medium">{detail}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-2 border-accent/30 bg-accent/5">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col md:flex-row items-start gap-4">
                <AlertTriangle className="h-8 w-8 text-accent flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-foreground mb-2">{t('landing.compliance.risk.title')}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t('landing.compliance.risk.description')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))]"></div>
        <div className="max-w-5xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-6">
              {t('landing.cta.title')}
            </h2>
            <p className="text-lg sm:text-xl text-primary-foreground/90 mb-10 max-w-3xl mx-auto leading-relaxed">
              {t('landing.cta.description')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link href="/register">
                <Button 
                  size="lg" 
                  className="h-14 sm:h-16 px-10 text-base sm:text-lg font-bold bg-accent text-accent-foreground hover:bg-accent/90 shadow-2xl w-full sm:w-auto group" 
                  data-testid="button-cta-register"
                >
                  {t('landing.cta.buttonRegister')}
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/login">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="h-14 sm:h-16 px-10 text-base sm:text-lg font-bold border-2 border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 w-full sm:w-auto backdrop-blur-sm" 
                  data-testid="button-cta-login"
                >
                  {t('landing.cta.buttonLogin')}
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 pt-12 border-t border-primary-foreground/20">
              {[
                { icon: Shield, text: t('landing.cta.trustFdic') },
                { icon: Lock, text: t('landing.cta.trustEncryption') },
                { icon: FileCheck, text: t('landing.cta.trustSec') },
                { icon: Award, text: t('landing.cta.trustSoc2') }
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <item.icon className="h-6 w-6 text-primary-foreground/80" />
                  <span className="text-xs sm:text-sm font-bold text-primary-foreground/90">{item.text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 sm:gap-12 mb-12">
            {/* Company Info */}
            <div className="lg:col-span-2">
              <div className="flex items-start gap-3 mb-4">
                <img 
                  src={logoPath} 
                  alt="Opus Rental Capital" 
                  className="h-14 w-14 rounded-xl shadow-md object-cover flex-shrink-0"
                />
                <div>
                  <div className="font-bold text-lg text-foreground mb-1">Opus Rental Capital</div>
                  <div className="text-xs text-muted-foreground font-semibold mb-2">{t('landing.footer.tagline')}</div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4 max-w-md">
                {t('landing.footer.description')}
              </p>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4 text-accent" />
                  <span className="font-semibold">{t('landing.footer.phone')}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4 text-accent" />
                  <span className="font-semibold">{t('landing.footer.email')}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPinned className="h-4 w-4 text-accent" />
                  <span className="font-semibold">{t('landing.footer.location')}</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <div className="font-bold text-foreground mb-4">{t('landing.footer.company')}</div>
              <div className="space-y-2.5 text-sm">
                {[
                  t('landing.footer.aboutUs'),
                  t('landing.footer.leadership'),
                  t('landing.footer.careers'),
                  t('landing.footer.press'),
                  t('landing.footer.investorRelations'),
                  t('landing.footer.contactUs')
                ].map((item, i) => (
                  <div key={i} className="text-muted-foreground hover:text-accent cursor-pointer transition-colors font-medium">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Legal */}
            <div>
              <div className="font-bold text-foreground mb-4">{t('landing.footer.legal')}</div>
              <div className="space-y-2.5 text-sm">
                {[
                  t('landing.footer.terms'),
                  t('landing.footer.privacy'),
                  t('landing.footer.riskDisclosure'),
                  t('landing.footer.prospectus'),
                  t('landing.footer.helpCenter'),
                  t('landing.footer.security')
                ].map((item, i) => (
                  <div key={i} className="text-muted-foreground hover:text-accent cursor-pointer transition-colors font-medium">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Bottom Bar */}
          <div className="pt-8 border-t border-border">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
              <div className="text-sm text-muted-foreground text-center md:text-left">
                {t('landing.footer.copyright')}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground font-semibold">
                <span>{t('landing.footer.memberFinra')}</span>
                <span>•</span>
                <span>{t('landing.footer.memberSipc')}</span>
                <span>•</span>
                <span>{t('landing.footer.fdic')}</span>
                <span>•</span>
                <span>{t('landing.footer.sec')}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-5xl mx-auto text-center">
              {t('landing.footer.disclaimer')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
