import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { 
  TrendingUp, 
  MapPin,
  DollarSign,
  Truck,
  CheckCircle,
  ArrowRight,
  BarChart3,
  Shield,
  Eye,
  FileText,
  Lock,
  Award,
  Users,
  Building2,
  Clock,
  ChevronRight,
  Zap,
  Globe,
  Target,
  PieChart,
  Briefcase,
  Search,
  Headphones
} from "lucide-react";
import { useTranslation } from "react-i18next";
import logoPath from "@assets/image_1759264185138.png";

export default function Landing() {
  const { t, i18n } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      {/* Premium Navigation */}
      <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-xl border-b border-border/40 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-4">
              <img 
                src={logoPath} 
                alt="Opus Rental Capital" 
                className="h-12 w-12 rounded-lg shadow-sm object-cover"
              />
              <div className="flex flex-col">
                <h1 className="text-xl font-bold text-foreground tracking-tight">
                  Opus Rental Capital
                </h1>
                <p className="text-xs text-muted-foreground font-medium">
                  {t('landing.nav.tagline', 'Asset-Backed Investment Platform')}
                </p>
              </div>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                {t('landing.nav.howItWorks', 'How it Works')}
              </a>
              <a href="#benefits" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                {t('landing.nav.benefits', 'Benefits')}
              </a>
              <a href="#security" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                {t('landing.nav.security', 'Security')}
              </a>
              <a href="#faq" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                {t('landing.nav.faq', 'FAQ')}
              </a>
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
                className="h-9 px-3 text-xs font-semibold"
                data-testid="button-toggle-language"
              >
                {i18n.language.startsWith("en") ? "🇧🇷 PT" : "🇺🇸 EN"}
              </Button>
              <Link href="/login">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-9 text-sm font-medium" 
                  data-testid="button-login"
                >
                  {t('landing.nav.clientPortal', 'Sign In')}
                </Button>
              </Link>
              <Link href="/register">
                <Button 
                  size="sm" 
                  className="h-9 px-6 text-sm font-semibold bg-primary hover:bg-primary/90" 
                  data-testid="button-get-started"
                >
                  {t('landing.nav.openAccount', 'Get Started')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Premium & Corporate */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-b from-muted/20 via-background to-background">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.05),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,hsl(var(--accent)/0.03),transparent_50%)]"></div>
        
        <div className="max-w-7xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-5xl mx-auto"
          >
            {/* Trust Badge */}
            <Badge variant="outline" className="mb-6 px-4 py-1.5 text-xs font-semibold">
              <Shield className="h-3.5 w-3.5 mr-1.5" />
              {t('landing.hero.badge', 'Institutional Grade Asset Management')}
            </Badge>

            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-foreground mb-6 leading-[1.1] tracking-tight">
              {t('landing.hero.headline1', 'Enterprise-Grade')}
              <br />
              <span className="bg-gradient-to-r from-primary via-primary/90 to-primary/80 bg-clip-text text-transparent">
                {t('landing.hero.headline2', 'Asset-Backed Returns')}
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed font-light">
              {t('landing.hero.description', 'Invest in commercial trailers with guaranteed 2% monthly returns. Fully transparent, GPS-tracked assets with institutional-grade security.')}
            </p>

            {/* Key Stats Row */}
            <div className="flex flex-wrap justify-center items-center gap-8 mb-10">
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground">24%</div>
                <div className="text-sm text-muted-foreground">{t('landing.hero.stat1', 'Annual Return')}</div>
              </div>
              <div className="h-12 w-px bg-border"></div>
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground">100%</div>
                <div className="text-sm text-muted-foreground">{t('landing.hero.stat2', 'Asset Backed')}</div>
              </div>
              <div className="h-12 w-px bg-border"></div>
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground">24/7</div>
                <div className="text-sm text-muted-foreground">{t('landing.hero.stat3', 'GPS Tracking')}</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/register">
                <Button 
                  size="lg" 
                  className="h-14 px-8 text-base font-semibold bg-primary hover:bg-primary/90 shadow-lg group" 
                  data-testid="button-hero-register"
                >
                  {t('landing.hero.ctaRegister', 'Start Investing')}
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/login">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="h-14 px-8 text-base font-semibold" 
                  data-testid="button-hero-login"
                >
                  {t('landing.hero.ctaLogin', 'Access Portal')}
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-y border-border bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Shield, label: t('landing.trust.compliance', 'Regulatory Compliance'), value: "100%" },
              { icon: Lock, label: t('landing.trust.security', 'Bank-Level Security'), value: "256-bit" },
              { icon: Award, label: t('landing.trust.transparency', 'Full Transparency'), value: "Real-Time" },
              { icon: Users, label: t('landing.trust.support', 'Dedicated Support'), value: "24/7" }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <item.icon className="h-8 w-8 mx-auto mb-3 text-primary" />
                <div className="text-sm font-semibold text-foreground mb-1">{item.value}</div>
                <div className="text-xs text-muted-foreground">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Investment Details */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              {t('landing.investment.title', 'Investment Structure')}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('landing.investment.subtitle', 'Simple, transparent, and backed by real assets')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-primary/50 transition-all">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">{t('landing.investment.card1Title', 'USD 28,000')}</CardTitle>
                <p className="text-sm text-muted-foreground">{t('landing.investment.card1Sub', 'Per Share')}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground">{t('landing.investment.card1Point1', '1 share = 1 commercial trailer')}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground">{t('landing.investment.card1Point2', 'Fixed monthly return of USD 560')}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground">{t('landing.investment.card1Point3', 'Guaranteed 2% monthly (24% annual)')}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all bg-primary/5">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Truck className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">{t('landing.investment.card2Title', 'USD 1,500')}</CardTitle>
                <p className="text-sm text-muted-foreground">{t('landing.investment.card2Sub', 'Monthly Rental Income')}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground">{t('landing.investment.card2Point1', 'Leased to verified carriers')}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground">{t('landing.investment.card2Point2', '3-12 month rental contracts')}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground">{t('landing.investment.card2Point3', 'Continuous revenue generation')}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">{t('landing.investment.card3Title', 'Real-Time')}</CardTitle>
                <p className="text-sm text-muted-foreground">{t('landing.investment.card3Sub', 'GPS Tracking')}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground">{t('landing.investment.card3Point1', 'Live location tracking 24/7')}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground">{t('landing.investment.card3Point2', 'Movement history and alerts')}</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground">{t('landing.investment.card3Point3', 'Complete asset visibility')}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              {t('landing.howItWorks.title', 'How It Works')}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('landing.howItWorks.subtitle', 'Four simple steps to start earning')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                icon: FileText,
                title: t('landing.howItWorks.step1', 'Open Account'),
                desc: t('landing.howItWorks.step1Desc', 'Register and complete verification in minutes')
              },
              {
                step: "02",
                icon: DollarSign,
                title: t('landing.howItWorks.step2', 'Invest'),
                desc: t('landing.howItWorks.step2Desc', 'Purchase shares starting at USD 28,000 per trailer')
              },
              {
                step: "03",
                icon: Truck,
                title: t('landing.howItWorks.step3', 'Assets Work'),
                desc: t('landing.howItWorks.step3Desc', 'Trailers generate rental income automatically')
              },
              {
                step: "04",
                icon: TrendingUp,
                title: t('landing.howItWorks.step4', 'Earn Returns'),
                desc: t('landing.howItWorks.step4Desc', 'Receive 2% monthly payments directly')
              }
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="bg-background border-2 border-border rounded-xl p-6 hover:border-primary/50 transition-all h-full">
                  <div className="text-6xl font-bold text-muted-foreground/10 mb-4">{item.step}</div>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
                {i < 3 && (
                  <ChevronRight className="hidden lg:block absolute -right-3 top-1/2 transform -translate-y-1/2 h-6 w-6 text-muted-foreground/30" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              {t('landing.benefits.title', 'Why Opus Rental Capital')}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('landing.benefits.subtitle', 'Institutional-grade investment platform with retail accessibility')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Target,
                title: t('landing.benefits.fixed.title', 'Fixed Returns'),
                desc: t('landing.benefits.fixed.desc', 'Guaranteed 2% monthly return, 24% annually. No market volatility exposure.')
              },
              {
                icon: Shield,
                title: t('landing.benefits.backed.title', 'Asset-Backed Security'),
                desc: t('landing.benefits.backed.desc', 'Every investment is backed by physical commercial trailers you can track.')
              },
              {
                icon: Eye,
                title: t('landing.benefits.transparency.title', 'Full Transparency'),
                desc: t('landing.benefits.transparency.desc', 'Real-time GPS tracking, financial reports, and contract visibility.')
              },
              {
                icon: Zap,
                title: t('landing.benefits.liquidity.title', 'Passive Income'),
                desc: t('landing.benefits.liquidity.desc', 'Receive monthly payments automatically. No active management required.')
              },
              {
                icon: Building2,
                title: t('landing.benefits.professional.title', 'Professional Management'),
                desc: t('landing.benefits.professional.desc', 'Expert team handles all operations, maintenance, and client relationships.')
              },
              {
                icon: PieChart,
                title: t('landing.benefits.diversification.title', 'Portfolio Diversification'),
                desc: t('landing.benefits.diversification.desc', 'Add alternative assets to your investment portfolio for better risk distribution.')
              }
            ].map((benefit, i) => (
              <Card key={i} className="border hover:border-primary/50 transition-all">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <benefit.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{benefit.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Security & Compliance */}
      <section id="security" className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              {t('landing.security.title', 'Security & Compliance')}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('landing.security.subtitle', 'Enterprise-grade security protecting your investments')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-2">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>{t('landing.security.dataTitle', 'Data Security')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold text-foreground">256-bit Encryption</div>
                    <div className="text-xs text-muted-foreground">Bank-level SSL/TLS security</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold text-foreground">Secure Infrastructure</div>
                    <div className="text-xs text-muted-foreground">SOC 2 compliant data centers</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold text-foreground">Multi-Factor Authentication</div>
                    <div className="text-xs text-muted-foreground">Additional account protection</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>{t('landing.security.complianceTitle', 'Regulatory Compliance')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold text-foreground">Asset Verification</div>
                    <div className="text-xs text-muted-foreground">Independent third-party audits</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold text-foreground">Legal Documentation</div>
                    <div className="text-xs text-muted-foreground">All contracts reviewed by legal team</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold text-foreground">Regulatory Reporting</div>
                    <div className="text-xs text-muted-foreground">Full compliance with financial regulations</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              {t('landing.faq.title', 'Frequently Asked Questions')}
            </h2>
            <p className="text-lg text-muted-foreground">
              {t('landing.faq.subtitle', 'Everything you need to know about investing with us')}
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: t('landing.faq.q1', 'What is the minimum investment?'),
                a: t('landing.faq.a1', 'The minimum investment is USD 28,000, which represents one share equal to one commercial trailer.')
              },
              {
                q: t('landing.faq.q2', 'How are returns calculated?'),
                a: t('landing.faq.a2', 'Returns are fixed at 2% per month (24% annually) of your investment. For a USD 28,000 investment, you receive USD 560 monthly.')
              },
              {
                q: t('landing.faq.q3', 'Are the assets really tracked by GPS?'),
                a: t('landing.faq.a3', 'Yes. Every trailer has GPS tracking that you can monitor in real-time through your investor portal, including location history and movement alerts.')
              },
              {
                q: t('landing.faq.q4', 'What happens if a trailer needs maintenance?'),
                a: t('landing.faq.a4', 'All maintenance is handled by our operations team and is factored into the financial model. Your returns remain guaranteed regardless of maintenance needs.')
              },
              {
                q: t('landing.faq.q5', 'Can I withdraw my investment?'),
                a: t('landing.faq.a5', 'Investment terms are typically 12-36 months. Early withdrawal may be possible subject to availability of buyers and applicable fees. Contact support for details.')
              },
              {
                q: t('landing.faq.q6', 'How do I receive my monthly returns?'),
                a: t('landing.faq.a6', 'Returns are automatically deposited to your registered bank account on the same day each month, with full transaction details in your portal.')
              }
            ].map((faq, i) => (
              <Card key={i} className="border hover:border-primary/50 transition-all">
                <CardHeader>
                  <CardTitle className="text-lg flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary">Q</span>
                    </div>
                    {faq.q}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed pl-9">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary via-primary/95 to-primary/90 text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_50%)]"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            {t('landing.cta.title', 'Ready to Start Earning?')}
          </h2>
          <p className="text-xl text-primary-foreground/90 mb-10 max-w-2xl mx-auto">
            {t('landing.cta.description', 'Join institutional investors earning guaranteed returns on asset-backed investments.')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/register">
              <Button 
                size="lg" 
                className="h-14 px-10 text-base font-semibold bg-background text-foreground hover:bg-background/90 shadow-xl group" 
                data-testid="button-cta-register"
              >
                {t('landing.cta.buttonRegister', 'Open Your Account')}
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="lg" 
              className="h-14 px-10 text-base font-semibold border-2 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Headphones className="mr-2 h-5 w-5" />
              {t('landing.cta.buttonContact', 'Speak with Advisor')}
            </Button>
          </div>
        </div>
      </section>

      {/* Corporate Footer */}
      <footer className="border-t border-border bg-muted/30 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Company */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img 
                  src={logoPath} 
                  alt="Opus Rental Capital" 
                  className="h-10 w-10 rounded-lg shadow-sm object-cover"
                />
                <div>
                  <div className="font-bold text-foreground">Opus Rental Capital</div>
                  <div className="text-xs text-muted-foreground">{t('landing.footer.tagline', 'Asset Management')}</div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('landing.footer.description', 'Institutional-grade asset-backed investment platform delivering guaranteed returns.')}
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">{t('landing.footer.quickLinks', 'Quick Links')}</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">{t('landing.footer.howItWorks', 'How It Works')}</a></li>
                <li><a href="#benefits" className="text-muted-foreground hover:text-foreground transition-colors">{t('landing.footer.benefits', 'Benefits')}</a></li>
                <li><a href="#security" className="text-muted-foreground hover:text-foreground transition-colors">{t('landing.footer.security', 'Security')}</a></li>
                <li><a href="#faq" className="text-muted-foreground hover:text-foreground transition-colors">{t('landing.footer.faq', 'FAQ')}</a></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">{t('landing.footer.resources', 'Resources')}</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">{t('landing.footer.documentation', 'Documentation')}</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">{t('landing.footer.reports', 'Reports')}</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">{t('landing.footer.legal', 'Legal')}</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">{t('landing.footer.terms', 'Terms of Service')}</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">{t('landing.footer.contact', 'Contact')}</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <span>www.opusrentalcapital.com</span>
                </li>
                <li className="flex items-center gap-2">
                  <Headphones className="h-4 w-4" />
                  <span>+1 (555) 123-4567</span>
                </li>
                <li className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  <span>support@opusrc.com</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground text-center md:text-left">
              {t('landing.footer.copyright', '© 2025 Opus Rental Capital. All rights reserved.')}
            </p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">{t('landing.footer.privacy', 'Privacy Policy')}</a>
              <a href="#" className="hover:text-foreground transition-colors">{t('landing.footer.cookies', 'Cookies')}</a>
              <a href="#" className="hover:text-foreground transition-colors">{t('landing.footer.compliance', 'Compliance')}</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
