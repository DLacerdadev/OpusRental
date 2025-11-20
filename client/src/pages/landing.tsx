import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { 
  TrendingUp, MapPin, DollarSign, Truck, CheckCircle, ArrowRight,
  BarChart3, Shield, Eye, FileText, Lock, Award, Users, Clock,
  Zap, Target, PieChart, Briefcase, Search, Headphones, Check, Sparkles
} from "lucide-react";
import { useTranslation } from "react-i18next";
import logoPath from "@assets/image_1759264185138.png";

export default function Landing() {
  const { t, i18n } = useTranslation();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Background Gradient Orbs */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl"></div>
      </div>

      {/* Glassmorphic Navigation */}
      <nav className="fixed top-0 w-full bg-background/60 backdrop-blur-3xl border-b border-white/10 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-24">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <img src={logoPath} alt="Opus" className="h-16 w-16 rounded-2xl relative z-10 border-2 border-white/20" />
              </div>
              <div>
                <h1 className="text-2xl font-black bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Opus Rental Capital
                </h1>
                <p className="text-sm text-muted-foreground font-semibold">
                  {t('landing.nav.tagline', 'Next-Gen Asset Platform')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => {
                const newLang = i18n.language.startsWith("en") ? "pt-BR" : "en-US";
                i18n.changeLanguage(newLang);
                localStorage.setItem('language', newLang);
              }} className="font-semibold">
                {i18n.language.startsWith("en") ? "🇧🇷 PT" : "🇺🇸 EN"}
              </Button>
              <Link href="/login">
                <Button variant="ghost" size="default" className="font-semibold">
                  {t('landing.nav.login', 'Sign In')}
                </Button>
              </Link>
              <Link href="/register">
                <Button size="default" className="font-bold bg-gradient-to-r from-primary via-primary/90 to-accent hover:shadow-2xl hover:shadow-primary/30 transition-all">
                  {t('landing.nav.getStarted', 'Get Started')} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Ultra Modern */}
      <section className="pt-48 pb-32 px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }} className="text-center max-w-6xl mx-auto">
            
            {/* Floating Badge */}
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, duration: 0.6 }}>
              <Badge className="mb-8 px-8 py-3 text-base font-bold bg-gradient-to-r from-primary/20 to-accent/20 border-2 border-primary/30 backdrop-blur-sm">
                <Sparkles className="h-5 w-5 mr-3 text-primary" />
                {t('landing.hero.badge', 'Institutional-Grade Investment Platform')}
              </Badge>
            </motion.div>

            {/* Main Headline - Huge & Bold */}
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.8 }}
              className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black mb-10 leading-[0.9] tracking-tight"
            >
              <span className="bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
                {t('landing.hero.title1', 'Invest in')}
              </span>
              <br />
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-pulse">
                {t('landing.hero.title2', 'Real Assets')}
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.8 }}
              className="text-2xl md:text-3xl text-muted-foreground max-w-4xl mx-auto mb-8 font-light leading-relaxed"
            >
              {t('landing.hero.subtitle', '24% annual returns backed by GPS-tracked commercial trailers. Transparent, secure, guaranteed.')}
            </motion.p>

            {/* Mega Stats Grid */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.8 }}
              className="grid grid-cols-4 gap-8 max-w-5xl mx-auto mb-16"
            >
              {[
                { value: "24%", label: "Annual ROI", icon: TrendingUp },
                { value: "USD 28K", label: "Per Share", icon: DollarSign },
                { value: "100%", label: "Asset Backed", icon: Shield },
                { value: "24/7", label: "GPS Tracked", icon: MapPin }
              ].map((stat, i) => (
                <div key={i} className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative bg-background/40 backdrop-blur-xl border-2 border-white/10 rounded-3xl p-8 hover:border-primary/50 transition-all">
                    <stat.icon className="h-10 w-10 mb-4 text-primary mx-auto" />
                    <div className="text-5xl font-black mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{stat.value}</div>
                    <div className="text-sm font-bold text-muted-foreground">{stat.label}</div>
                  </div>
                </div>
              ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1, duration: 0.8 }}
              className="flex flex-col sm:flex-row gap-6 justify-center items-center"
            >
              <Link href="/register">
                <Button size="lg" className="h-20 px-16 text-xl font-black bg-gradient-to-r from-primary via-primary/90 to-accent hover:shadow-[0_0_80px_rgba(59,130,246,0.5)] transition-all group">
                  {t('landing.cta.start', 'Start Investing Now')}
                  <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-2 transition-transform" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="h-20 px-16 text-xl font-black border-4 backdrop-blur-xl hover:bg-white/5">
                  {t('landing.cta.portal', 'Access Portal')}
                </Button>
              </Link>
            </motion.div>

          </motion.div>
        </div>
      </section>

      {/* Features Grid - Modern Cards */}
      <section className="py-32 px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <Badge className="mb-6 px-6 py-2 text-sm font-bold bg-primary/10 border-2 border-primary/30">
              {t('landing.features.badge', 'Platform Features')}
            </Badge>
            <h2 className="text-6xl md:text-7xl font-black mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              {t('landing.features.title', 'Why Choose Opus')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Target,
                title: t('landing.features.fixed.title', 'Fixed Returns'),
                desc: t('landing.features.fixed.desc', 'Guaranteed 2% monthly. No volatility, no surprises. Pure predictability.'),
                gradient: "from-blue-500/20 to-cyan-500/20"
              },
              {
                icon: Shield,
                title: t('landing.features.backed.title', 'Asset Backed'),
                desc: t('landing.features.backed.desc', 'Every dollar backed by physical trailers you can see and track 24/7.'),
                gradient: "from-purple-500/20 to-pink-500/20"
              },
              {
                icon: Eye,
                title: t('landing.features.transparency.title', 'Full Transparency'),
                desc: t('landing.features.transparency.desc', 'Real-time GPS, financials, contracts. Complete visibility.'),
                gradient: "from-orange-500/20 to-red-500/20"
              },
              {
                icon: Zap,
                title: t('landing.features.passive.title', 'Passive Income'),
                desc: t('landing.features.passive.desc', 'Automated monthly payments. Zero management required.'),
                gradient: "from-green-500/20 to-emerald-500/20"
              },
              {
                icon: Lock,
                title: t('landing.features.security.title', 'Bank Security'),
                desc: t('landing.features.security.desc', '256-bit encryption. SOC 2 certified. Multi-factor authentication.'),
                gradient: "from-indigo-500/20 to-blue-500/20"
              },
              {
                icon: PieChart,
                title: t('landing.features.diversification.title', 'Diversification'),
                desc: t('landing.features.diversification.desc', 'Alternative assets uncorrelated with traditional markets.'),
                gradient: "from-pink-500/20 to-rose-500/20"
              }
            ].map((feature, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
              >
                <Card className={`group relative h-full bg-gradient-to-br ${feature.gradient} border-2 border-white/10 hover:border-primary/50 transition-all overflow-hidden`}>
                  <div className="absolute inset-0 bg-gradient-to-br from-background/80 to-background/60 backdrop-blur-xl"></div>
                  <CardContent className="relative p-10">
                    <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                      <feature.icon className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="text-3xl font-black mb-4">{feature.title}</h3>
                    <p className="text-lg text-muted-foreground leading-relaxed">{feature.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Timeline */}
      <section className="py-32 px-6 lg:px-8 bg-muted/30 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <Badge className="mb-6 px-6 py-2 text-sm font-bold bg-accent/10 border-2 border-accent/30">
              {t('landing.process.badge', 'Investment Process')}
            </Badge>
            <h2 className="text-6xl md:text-7xl font-black mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              {t('landing.process.title', 'Start in 4 Steps')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: "01", icon: FileText, title: t('landing.process.step1', 'Create Account'), desc: t('landing.process.step1Desc', '5-min KYC verification') },
              { step: "02", icon: Search, title: t('landing.process.step2', 'Browse Assets'), desc: t('landing.process.step2Desc', 'Select your trailers') },
              { step: "03", icon: DollarSign, title: t('landing.process.step3', 'Invest Funds'), desc: t('landing.process.step3Desc', 'Secure payment transfer') },
              { step: "04", icon: TrendingUp, title: t('landing.process.step4', 'Earn Monthly'), desc: t('landing.process.step4Desc', 'Automated returns') }
            ].map((step, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="relative"
              >
                <div className="bg-background border-4 border-primary/20 rounded-3xl p-10 text-center hover:border-primary/50 transition-all">
                  <div className="text-7xl font-black text-primary/20 mb-6">{step.step}</div>
                  <div className="h-16 w-16 mx-auto rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6">
                    <step.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-black mb-3">{step.title}</h3>
                  <p className="text-lg text-muted-foreground">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Investment Breakdown */}
      <section className="py-32 px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <Badge className="mb-6 px-6 py-2 text-sm font-bold bg-primary/10 border-2 border-primary/30">
              {t('landing.breakdown.badge', 'Investment Structure')}
            </Badge>
            <h2 className="text-6xl md:text-7xl font-black mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              {t('landing.breakdown.title', 'Simple & Transparent')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: DollarSign,
                title: "USD 28,000",
                subtitle: t('landing.breakdown.share', 'Per Share'),
                points: [
                  t('landing.breakdown.p1', '1 share = 1 trailer'),
                  t('landing.breakdown.p2', 'USD 560 monthly return'),
                  t('landing.breakdown.p3', '2% fixed monthly rate'),
                  t('landing.breakdown.p4', 'Ownership certificate')
                ]
              },
              {
                icon: Truck,
                title: "USD 1,500",
                subtitle: t('landing.breakdown.rental', 'Monthly Rental'),
                points: [
                  t('landing.breakdown.p5', 'Verified carriers'),
                  t('landing.breakdown.p6', '3-12 month contracts'),
                  t('landing.breakdown.p7', 'Insurance backed'),
                  t('landing.breakdown.p8', 'Pro fleet management')
                ]
              },
              {
                icon: MapPin,
                title: "24/7",
                subtitle: t('landing.breakdown.tracking', 'GPS Tracking'),
                points: [
                  t('landing.breakdown.p9', 'Live location'),
                  t('landing.breakdown.p10', 'Movement alerts'),
                  t('landing.breakdown.p11', 'Health monitoring'),
                  t('landing.breakdown.p12', 'Value tracking')
                ]
              }
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
              >
                <Card className="border-4 border-primary/20 hover:border-primary/50 transition-all h-full bg-gradient-to-br from-background to-muted/30">
                  <CardContent className="p-10">
                    <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-8">
                      <item.icon className="h-10 w-10 text-white" />
                    </div>
                    <div className="text-5xl font-black mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{item.title}</div>
                    <div className="text-lg font-bold text-muted-foreground mb-8">{item.subtitle}</div>
                    <div className="space-y-4">
                      {item.points.map((point, j) => (
                        <div key={j} className="flex items-start gap-3">
                          <Check className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                          <span className="text-lg text-muted-foreground">{point}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-32 px-6 lg:px-8 bg-gradient-to-br from-primary/5 to-accent/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.1),transparent_50%)]"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <Badge className="mb-6 px-6 py-2 text-sm font-bold bg-primary/20 border-2 border-primary/30">
              {t('landing.security.badge', 'Enterprise Security')}
            </Badge>
            <h2 className="text-6xl md:text-7xl font-black mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              {t('landing.security.title', 'Bank-Level Protection')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                icon: Lock,
                title: t('landing.security.data', 'Data Security'),
                items: [
                  { text: "256-bit SSL/TLS Encryption", desc: "Military-grade security" },
                  { text: "SOC 2 Type II Certified", desc: "Audited controls" },
                  { text: "Multi-Factor Authentication", desc: "Extra protection layer" },
                  { text: "Regular Security Audits", desc: "Quarterly pen-testing" }
                ],
                gradient: "from-blue-500/20 to-cyan-500/20"
              },
              {
                icon: Shield,
                title: t('landing.security.compliance', 'Regulatory Compliance'),
                items: [
                  { text: "Independent Asset Audits", desc: "Third-party verification" },
                  { text: "Legal Documentation", desc: "Attorney-reviewed contracts" },
                  { text: "Financial Transparency", desc: "Monthly & annual reports" },
                  { text: "Regulatory Filings", desc: "Full securities compliance" }
                ],
                gradient: "from-green-500/20 to-emerald-500/20"
              }
            ].map((section, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: i === 0 ? -30 : 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <Card className={`border-4 border-white/10 h-full bg-gradient-to-br ${section.gradient}`}>
                  <div className="absolute inset-0 bg-gradient-to-br from-background/90 to-background/70 backdrop-blur-xl"></div>
                  <CardContent className="relative p-10">
                    <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-8">
                      <section.icon className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="text-4xl font-black mb-8">{section.title}</h3>
                    <div className="space-y-6">
                      {section.items.map((item, j) => (
                        <div key={j} className="bg-background/50 backdrop-blur-sm rounded-2xl p-6 border-2 border-white/10">
                          <div className="flex items-start gap-4">
                            <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                            <div>
                              <div className="text-lg font-bold mb-1">{item.text}</div>
                              <div className="text-sm text-muted-foreground">{item.desc}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA - Mega */}
      <section className="py-48 px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-accent"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            <h2 className="text-6xl md:text-7xl lg:text-8xl font-black text-white mb-8 leading-tight">
              {t('landing.final.title', 'Ready to Start Earning?')}
            </h2>
            <p className="text-3xl text-white/90 mb-16 font-light">
              {t('landing.final.subtitle', 'Join 2,500+ investors earning guaranteed monthly returns')}
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link href="/register">
                <Button size="lg" className="h-24 px-20 text-2xl font-black bg-white text-primary hover:bg-white/90 shadow-2xl group">
                  {t('landing.final.cta', 'Open Your Account')}
                  <ArrowRight className="ml-3 h-7 w-7 group-hover:translate-x-2 transition-transform" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="h-24 px-20 text-2xl font-black border-4 border-white/30 text-white hover:bg-white/10 backdrop-blur-xl">
                <Headphones className="mr-3 h-7 w-7" />
                {t('landing.final.talk', 'Talk to Advisor')}
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-background/50 backdrop-blur-xl py-20 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="md:col-span-2">
              <div className="flex items-center gap-4 mb-6">
                <img src={logoPath} alt="Opus" className="h-14 w-14 rounded-2xl" />
                <div>
                  <div className="text-xl font-black">Opus Rental Capital</div>
                  <div className="text-sm text-muted-foreground">{t('landing.footer.tagline', 'Asset Management Platform')}</div>
                </div>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                {t('landing.footer.description', 'Leading platform for asset-backed investments with guaranteed returns since 2020.')}
              </p>
            </div>

            {[
              {
                title: t('landing.footer.company', 'Company'),
                links: ['About', 'Careers', 'Press', 'Blog']
              },
              {
                title: t('landing.footer.legal', 'Legal'),
                links: ['Terms', 'Privacy', 'Cookies', 'Compliance']
              }
            ].map((section, i) => (
              <div key={i}>
                <h3 className="text-lg font-black mb-4">{section.title}</h3>
                <ul className="space-y-3">
                  {section.links.map((link, j) => (
                    <li key={j}>
                      <a href="#" className="text-base text-muted-foreground hover:text-foreground transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-base text-muted-foreground">
              {t('landing.footer.copyright', '© 2025 Opus Rental Capital. All rights reserved.')}
            </p>
            <p className="text-sm text-muted-foreground">
              {t('landing.footer.disclaimer', 'Past performance does not guarantee future results.')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
