import { useUiStore } from '@/store/uiStore';
import { dictionaries, TranslationKey } from '@/services/localization';

export function useTranslation() {
  const language = useUiStore((state) => state.resolvedLanguage);

  return {
    language,
    isRTL: language === 'ur',
    t: (key: TranslationKey) => dictionaries[language][key] ?? dictionaries.en[key] ?? key,
  };
}
