import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ptBR from './locales/pt-BR.json';
import enUS from './locales/en-US.json';

const resources = {
  'pt-BR': {
    translation: ptBR
  },
  'en-US': {
    translation: enUS
  }
};

const getSavedLanguage = () => {
  try {
    return localStorage.getItem('language') || 'pt-BR';
  } catch {
    return 'pt-BR';
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getSavedLanguage(),
    fallbackLng: 'pt-BR',
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false,
    }
  });

i18n.on('languageChanged', (lng) => {
  try {
    localStorage.setItem('language', lng);
  } catch (e) {
    console.error('Failed to save language preference:', e);
  }
});

export default i18n;
