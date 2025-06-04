import { useLanguage } from "@/hooks/use-language";
import { Button } from "@/components/ui/button";

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center space-x-1 bg-muted rounded-lg p-1">
      <Button
        variant={language === 'fr' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setLanguage('fr')}
        className="px-3 py-1 text-xs font-medium"
      >
        🇫🇷 FR
      </Button>
      <Button
        variant={language === 'en' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setLanguage('en')}
        className="px-3 py-1 text-xs font-medium"
      >
        🇬🇧 EN
      </Button>
    </div>
  );
}
