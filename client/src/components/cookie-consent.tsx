import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Cookie } from "lucide-react";
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
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:max-w-md z-50"
        >
          <Card className="p-6 bg-card/95 backdrop-blur-sm border-border shadow-lg">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <Cookie className="w-6 h-6 text-accent" />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="font-semibold text-base mb-1">
                    {t('cookies.title')}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t('cookies.description')}
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    onClick={acceptCookies}
                    size="sm"
                    variant="default"
                    data-testid="button-accept-cookies"
                  >
                    {t('cookies.accept')}
                  </Button>
                  <Button
                    onClick={rejectCookies}
                    size="sm"
                    variant="outline"
                    data-testid="button-reject-cookies"
                  >
                    {t('cookies.reject')}
                  </Button>
                </div>
              </div>
              <Button
                onClick={rejectCookies}
                size="icon"
                variant="ghost"
                className="flex-shrink-0 -mt-1 -mr-1"
                data-testid="button-close-cookies"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
