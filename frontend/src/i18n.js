import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import ar from "./locales/ar.json";

const storedLang = localStorage.getItem('language') || 'en';
document.documentElement.lang = storedLang;
document.documentElement.dir = storedLang === 'ar' ? 'rtl' : 'ltr';

i18n
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            ar: { translation: ar },
        },
        lng: storedLang, // Use stored language
        fallbackLng: "en",
        interpolation: {
            escapeValue: false,
        },
    });

export default i18n;
