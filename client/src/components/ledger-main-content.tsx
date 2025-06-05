import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  ChevronDown, 
  Download,
  CheckCircle,
  Settings,
  Bell,
  Eye,
  HelpCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

// Icônes pour les services de récupération
const WalletRecoveryIcon = () => (
  <div className="w-10 h-10 rounded-full bg-[#00D4AA] flex items-center justify-center">
    <Settings size={20} className="text-white" />
  </div>
);

const SeedPhraseIcon = () => (
  <div className="w-10 h-10 rounded-full bg-[#FF6B00] flex items-center justify-center">
    <Download size={20} className="text-white" />
  </div>
);

const PasswordRecoveryIcon = () => (
  <div className="w-10 h-10 rounded-full bg-[#6C5CE7] flex items-center justify-center">
    <HelpCircle size={20} className="text-white" />
  </div>
);

const recoveryServices = [
  {
    name: "Récupération de wallet",
    description: "Récupération de portefeuilles corrompus ou inaccessibles",
    icon: WalletRecoveryIcon,
    price: "À partir de 150€",
    success: "95%"
  },
  {
    name: "Restauration de phrase de récupération", 
    description: "Récupération de seed phrases partielles ou endommagées",
    icon: SeedPhraseIcon,
    price: "À partir de 200€",
    success: "88%"
  },
  {
    name: "Récupération de mot de passe",
    description: "Craquage de mots de passe oubliés ou perdus",
    icon: PasswordRecoveryIcon,
    price: "À partir de 100€", 
    success: "92%"
  }
];

export function LedgerMainContent() {
  return (
    <div className="flex-1 bg-[hsl(var(--ledger-bg-main))] flex flex-col">
      {/* Window header avec controls macOS exactement comme dans l'image */}
      <div className="flex justify-between items-center p-4 bg-[hsl(var(--ledger-bg-main))] border-b border-[hsl(var(--ledger-border))]">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#FF5F57]"></div>
          <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
          <div className="w-3 h-3 rounded-full bg-[#28CA42]"></div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="text-[hsl(var(--ledger-text-muted))] hover:text-[hsl(var(--ledger-text-primary))] w-8 h-8">
            <Bell size={16} />
          </Button>
          <Button variant="ghost" size="icon" className="text-[hsl(var(--ledger-text-muted))] hover:text-[hsl(var(--ledger-text-primary))] w-8 h-8">
            <Eye size={16} />
          </Button>
          <Button variant="ghost" size="icon" className="text-[hsl(var(--ledger-text-muted))] hover:text-[hsl(var(--ledger-text-primary))] w-8 h-8">
            <HelpCircle size={16} />
          </Button>
          <Button variant="ghost" size="icon" className="text-[hsl(var(--ledger-text-muted))] hover:text-[hsl(var(--ledger-text-primary))] w-8 h-8">
            <Settings size={16} />
          </Button>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 p-6 overflow-auto">
        {/* Section Récupération de Données Crypto */}
        <div className="mb-8">
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-[hsl(var(--ledger-text-primary))] mb-4">
              Centre de Récupération Crypto
            </h1>
            <p className="text-[hsl(var(--ledger-text-secondary))] mb-8">
              Récupérez vos cryptomonnaies perdues ou inaccessibles de manière sécurisée et professionnelle.
            </p>
            
            {/* Statistiques de récupération */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="bg-[hsl(var(--ledger-bg-secondary))] p-6 rounded-lg border border-[hsl(var(--ledger-border))]">
                <div className="text-2xl font-bold text-[hsl(var(--ledger-orange))]">98.5%</div>
                <div className="text-sm text-[hsl(var(--ledger-text-muted))]">Taux de succès</div>
              </div>
              <div className="bg-[hsl(var(--ledger-bg-secondary))] p-6 rounded-lg border border-[hsl(var(--ledger-border))]">
                <div className="text-2xl font-bold text-[hsl(var(--ledger-orange))]">24-72h</div>
                <div className="text-sm text-[hsl(var(--ledger-text-muted))]">Délai moyen</div>
              </div>
              <div className="bg-[hsl(var(--ledger-bg-secondary))] p-6 rounded-lg border border-[hsl(var(--ledger-border))]">
                <div className="text-2xl font-bold text-[hsl(var(--ledger-orange))]">2500+</div>
                <div className="text-sm text-[hsl(var(--ledger-text-muted))]">Clients satisfaits</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Services de récupération */}
        <div className="mb-6">
          <div className="flex border-b border-[hsl(var(--ledger-border))]">
            <button className="px-4 py-3 text-[hsl(var(--ledger-text-primary))] border-b-2 border-[hsl(var(--ledger-text-primary))] font-medium">
              Services de récupération
            </button>
            <button className="px-4 py-3 text-[hsl(var(--ledger-text-muted))] hover:text-[hsl(var(--ledger-text-primary))]">
              Historique des demandes
            </button>
          </div>
        </div>

        {/* Barre de recherche et filtres */}
        <div className="flex items-center justify-between mb-6">
          <div className="relative flex-1 max-w-md">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[hsl(var(--ledger-text-muted))]" />
            <Input
              placeholder="Rechercher un service de récupération..."
              className="pl-10 bg-[hsl(var(--ledger-bg-secondary))] border-[hsl(var(--ledger-border))] text-[hsl(var(--ledger-text-primary))]"
            />
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" className="text-[hsl(var(--ledger-text-muted))] hover:text-[hsl(var(--ledger-text-primary))]">
              Tout afficher
              <ChevronDown size={16} className="ml-2" />
            </Button>
            <Button variant="ghost" className="text-[hsl(var(--ledger-text-muted))] hover:text-[hsl(var(--ledger-text-primary))]">
              Trier par popularité
              <ChevronDown size={16} className="ml-2" />
            </Button>
          </div>
        </div>

        {/* Liste des services de récupération */}
        <div className="space-y-3">
          {recoveryServices.map((service, index) => (
            <Card key={index} className="bg-[hsl(var(--ledger-bg-secondary))] border-[hsl(var(--ledger-border))] p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <service.icon />
                  <div>
                    <h3 className="font-medium text-[hsl(var(--ledger-text-primary))]">
                      {service.name}
                    </h3>
                    <p className="text-sm text-[hsl(var(--ledger-text-muted))] mb-2">
                      {service.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-[hsl(var(--ledger-orange))]">{service.price}</span>
                      <Badge 
                        variant="secondary" 
                        className="bg-[hsl(var(--ledger-green))] text-white border-none"
                      >
                        <CheckCircle size={12} className="mr-1" />
                        {service.success} de succès
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <Button 
                  variant="secondary" 
                  className="bg-[hsl(var(--ledger-orange))] hover:bg-[hsl(var(--ledger-orange))]/80 text-white border-none"
                >
                  Commencer
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}