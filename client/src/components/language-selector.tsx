import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-2">
      <Globe className="w-4 h-4 text-gray-400" />
      <div className="flex border border-gray-600 rounded-md overflow-hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLanguage('fr')}
          className={`px-3 py-1 text-xs rounded-none ${
            language === 'fr'
              ? 'bg-orange-500 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          FR
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLanguage('en')}
          className={`px-3 py-1 text-xs rounded-none ${
            language === 'en'
              ? 'bg-orange-500 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
        >
          EN
        </Button>
      </div>
    </div>
  );
}