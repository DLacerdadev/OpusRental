import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Shield, X, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";

export function CookieConsent() {
  const { t } = useTranslation();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      setTimeout(() => setShowBanner(true), 1000);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setShowBanner(false);
  };

  const rejectCookies = () => {
    localStorage.setItem("cookie-consent", "rejected");
    setShowBanner(false);
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <>
          {/* Overlay escuro bloqueando tudo */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[999]"
            onClick={rejectCookies}
          />

          {/* Modal centralizado */}
          <div className="fixed inset-0 flex items-center justify-center z-[1000] p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-lg"
            >
              <div className="relative bg-gradient-to-br from-[#0D2847] to-[#0a1f38] rounded-3xl shadow-2xl shadow-[#2196F3]/50 border-2 border-[#2196F3]/30 overflow-hidden">
                {/* Borda animada no topo */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#2196F3] to-transparent animate-pulse" style={{ animationDuration: '2s' }} />
                
                {/* Background pattern sutil */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute inset-0" style={{
                    backgroundImage: `radial-gradient(circle at 20% 50%, #2196F3 1px, transparent 1px), radial-gradient(circle at 80% 80%, #2196F3 1px, transparent 1px)`,
                    backgroundSize: '50px 50px'
                  }} />
                </div>

                <div className="relative p-8">
                  {/* Botão X no canto */}
                  <button
                    onClick={rejectCookies}
                    className="absolute top-4 right-4 text-white/40 hover:text-white/90 transition-colors p-2 hover:bg-white/10 rounded-lg"
                    data-testid="button-close-cookies"
                  >
                    <X className="h-5 w-5" />
                  </button>

                  {/* Header com ícone */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2196F3]/30 to-[#2196F3]/10 border-2 border-[#2196F3]/40 flex items-center justify-center shadow-lg shadow-[#2196F3]/30">
                      <Shield className="w-8 h-8 text-[#2196F3]" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">
                        {t('cookies.title')}
                      </h3>
                      <p className="text-sm text-white/60 mt-1 font-medium">
                        Conforme LGPD e GDPR
                      </p>
                    </div>
                  </div>

                  {/* Descrição com texto GRANDE */}
                  <p className="text-base text-white/90 leading-relaxed mb-6 font-medium">
                    {t('cookies.description')}
                  </p>

                  {/* Features com checkmarks - TEXTO MAIOR */}
                  <div className="space-y-3 mb-8">
                    {[
                      t('cookies.feature1'),
                      t('cookies.feature2'),
                      t('cookies.feature3')
                    ].map((feature, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          <div className="w-5 h-5 rounded-full bg-[#2196F3]/30 border-2 border-[#2196F3]/60 flex items-center justify-center">
                            <Check className="w-3 h-3 text-[#2196F3]" strokeWidth={3} />
                          </div>
                        </div>
                        <p className="text-sm text-white/80 leading-relaxed font-medium">
                          {feature}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Botões GRANDES */}
                  <div className="flex gap-4">
                    <Button
                      onClick={acceptCookies}
                      className="flex-1 bg-gradient-to-r from-[#2196F3] to-[#1976D2] hover:from-[#1976D2] hover:to-[#0D47A1] text-white font-bold h-14 text-base shadow-xl shadow-[#2196F3]/50 border-2 border-[#2196F3]/50 rounded-xl transition-all transform hover:scale-[1.02]"
                      data-testid="button-accept-cookies"
                    >
                      {t('cookies.accept')}
                    </Button>
                    <Button
                      onClick={rejectCookies}
                      variant="outline"
                      className="flex-1 border-2 border-white/30 text-white/90 hover:bg-white/10 h-14 text-base font-bold rounded-xl hover:border-white/50 transition-all"
                      data-testid="button-reject-cookies"
                    >
                      {t('cookies.reject')}
                    </Button>
                  </div>
                </div>

                {/* Glow effect no bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#2196F3]/50 to-transparent" />
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
