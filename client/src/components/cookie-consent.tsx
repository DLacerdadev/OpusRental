import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Shield, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";

export function CookieConsent() {
  const { t } = useTranslation();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      setTimeout(() => setShowBanner(true), 1500);
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
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            onClick={rejectCookies}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-lg z-[101]"
          >
            <div className="bg-gradient-to-br from-[#0D2847] to-[#0a1f38] rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
              {/* Header com gradiente */}
              <div className="relative px-8 pt-8 pb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-accent/20 to-transparent opacity-50" />
                <div className="relative flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                      <Shield className="w-6 h-6 text-accent" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">
                      {t('cookies.title')}
                    </h3>
                    <p className="text-sm text-white/70 leading-relaxed">
                      {t('cookies.description')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Features list */}
              <div className="px-8 pb-6 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center">
                      <Check className="w-3 h-3 text-accent" />
                    </div>
                  </div>
                  <p className="text-sm text-white/60">
                    {t('cookies.feature1')}
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center">
                      <Check className="w-3 h-3 text-accent" />
                    </div>
                  </div>
                  <p className="text-sm text-white/60">
                    {t('cookies.feature2')}
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center">
                      <Check className="w-3 h-3 text-accent" />
                    </div>
                  </div>
                  <p className="text-sm text-white/60">
                    {t('cookies.feature3')}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="px-8 pb-8 flex gap-3">
                <Button
                  onClick={acceptCookies}
                  className="flex-1 bg-accent hover:bg-accent/90 text-white font-semibold h-11 shadow-lg shadow-accent/25"
                  data-testid="button-accept-cookies"
                >
                  {t('cookies.accept')}
                </Button>
                <Button
                  onClick={rejectCookies}
                  variant="outline"
                  className="flex-1 border-white/20 text-white hover:bg-white/10 font-medium h-11"
                  data-testid="button-reject-cookies"
                >
                  {t('cookies.reject')}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
