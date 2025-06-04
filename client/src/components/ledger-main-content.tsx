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

// Icônes crypto spécifiques
const BitcoinIcon = () => (
  <div className="w-10 h-10 rounded-full bg-[#F7931A] flex items-center justify-center">
    <span className="text-white font-bold text-lg">₿</span>
  </div>
);

const EthereumIcon = () => (
  <div className="w-10 h-10 rounded-full bg-[#627EEA] flex items-center justify-center">
    <span className="text-white font-bold text-lg">Ξ</span>
  </div>
);

const BinanceIcon = () => (
  <div className="w-10 h-10 rounded-full bg-[#F3BA2F] flex items-center justify-center">
    <span className="text-black font-bold text-lg">B</span>
  </div>
);

const apps = [
  {
    name: "Bitcoin (BTC)",
    version: "Version 2.0.3 • 62 Kb",
    icon: BitcoinIcon,
    supported: true
  },
  {
    name: "Ethereum (ETH)",
    version: "Version 1.9.17 • 48 Kb",
    icon: EthereumIcon,
    supported: true
  },
  {
    name: "Binance Smart Chain (BNB)",
    version: "Version 1.9.17 • 2 Kb",
    icon: BinanceIcon,
    supported: true
  }
];

export function LedgerMainContent() {
  return (
    <div className="flex-1 bg-[hsl(var(--ledger-bg-main))] p-6">
      {/* Header avec icônes de navigation */}
      <div className="flex justify-end items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" className="text-[hsl(var(--ledger-text-muted))] hover:text-[hsl(var(--ledger-text-primary))]">
          <Bell size={20} />
        </Button>
        <Button variant="ghost" size="icon" className="text-[hsl(var(--ledger-text-muted))] hover:text-[hsl(var(--ledger-text-primary))]">
          <Eye size={20} />
        </Button>
        <Button variant="ghost" size="icon" className="text-[hsl(var(--ledger-text-muted))] hover:text-[hsl(var(--ledger-text-primary))]">
          <HelpCircle size={20} />
        </Button>
        <Button variant="ghost" size="icon" className="text-[hsl(var(--ledger-text-muted))] hover:text-[hsl(var(--ledger-text-primary))]">
          <Settings size={20} />
        </Button>
      </div>

      {/* Section Device Ledger Nano S */}
      <div className="mb-8">
        <div className="flex items-start gap-8">
          {/* Image du Ledger Nano S */}
          <div className="flex-shrink-0">
            <div className="relative">
              <div className="w-48 h-64 bg-gradient-to-b from-[#2A2B2F] to-[#1A1B1F] rounded-2xl border border-[hsl(var(--ledger-border))] p-6 flex flex-col items-center justify-center">
                {/* Simulation Ledger Nano S */}
                <div className="w-20 h-32 bg-gradient-to-b from-[#4A4B4F] to-[#3A3B3F] rounded-lg border border-[#5A5B5F] relative overflow-hidden">
                  {/* Écran */}
                  <div className="w-16 h-8 bg-[#000] rounded-sm mt-4 mx-auto flex items-center justify-center">
                    <div className="text-[#00FF00] text-xs font-mono">LEDGER</div>
                  </div>
                  {/* Boutons */}
                  <div className="absolute bottom-4 left-2 w-3 h-3 bg-[#6A6B6F] rounded-full"></div>
                  <div className="absolute bottom-4 right-2 w-3 h-3 bg-[#6A6B6F] rounded-full"></div>
                  {/* Port USB */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-6 h-2 bg-[#2A2B2F] rounded-b"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Informations Device */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <h1 className="text-2xl font-semibold text-[hsl(var(--ledger-text-primary))]">
                Ledger Nano S
              </h1>
              <Badge 
                variant="secondary" 
                className="bg-[hsl(var(--ledger-blue))] text-white border-none"
              >
                <CheckCircle size={14} className="mr-1" />
                Verified
              </Badge>
            </div>
            
            <p className="text-[hsl(var(--ledger-text-secondary))] mb-6">
              Firmware is up to date: <span className="text-[hsl(var(--ledger-blue))]">2.1.0</span>
            </p>

            {/* Statistiques de stockage */}
            <div className="grid grid-cols-3 gap-6 mb-6">
              <div>
                <div className="text-sm text-[hsl(var(--ledger-text-muted))]">Used</div>
                <div className="text-lg font-medium text-[hsl(var(--ledger-text-primary))]">-</div>
              </div>
              <div>
                <div className="text-sm text-[hsl(var(--ledger-text-muted))]">Capacity</div>
                <div className="text-lg font-medium text-[hsl(var(--ledger-text-primary))]">138 Kb</div>
              </div>
              <div>
                <div className="text-sm text-[hsl(var(--ledger-text-muted))]">Apps</div>
                <div className="text-lg font-medium text-[hsl(var(--ledger-text-primary))]">0</div>
              </div>
            </div>

            {/* Barre de progression */}
            <div className="mb-6">
              <div className="w-full bg-[hsl(var(--ledger-bg-tertiary))] rounded-full h-2">
                <div className="bg-[hsl(var(--ledger-orange))] h-2 rounded-full w-0"></div>
              </div>
              <div className="text-right text-sm text-[hsl(var(--ledger-text-muted))] mt-2">
                138 Kb free
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs App catalog / Apps installed */}
      <div className="mb-6">
        <div className="flex border-b border-[hsl(var(--ledger-border))]">
          <button className="px-4 py-3 text-[hsl(var(--ledger-text-primary))] border-b-2 border-[hsl(var(--ledger-text-primary))] font-medium">
            App catalog
          </button>
          <button className="px-4 py-3 text-[hsl(var(--ledger-text-muted))] hover:text-[hsl(var(--ledger-text-primary))]">
            Apps installed
          </button>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="flex items-center justify-between mb-6">
        <div className="relative flex-1 max-w-md">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[hsl(var(--ledger-text-muted))]" />
          <Input
            placeholder="Search app in catalog..."
            className="pl-10 bg-[hsl(var(--ledger-bg-secondary))] border-[hsl(var(--ledger-border))] text-[hsl(var(--ledger-text-primary))]"
          />
        </div>
        
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="text-[hsl(var(--ledger-text-muted))] hover:text-[hsl(var(--ledger-text-primary))]">
            Show All
            <ChevronDown size={16} className="ml-2" />
          </Button>
          <Button variant="ghost" className="text-[hsl(var(--ledger-text-muted))] hover:text-[hsl(var(--ledger-text-primary))]">
            Sort Market cap
            <ChevronDown size={16} className="ml-2" />
          </Button>
        </div>
      </div>

      {/* Liste des applications */}
      <div className="space-y-3">
        {apps.map((app, index) => (
          <Card key={index} className="bg-[hsl(var(--ledger-bg-secondary))] border-[hsl(var(--ledger-border))] p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <app.icon />
                <div>
                  <h3 className="font-medium text-[hsl(var(--ledger-text-primary))]">
                    {app.name}
                  </h3>
                  <p className="text-sm text-[hsl(var(--ledger-text-muted))]">
                    {app.version}
                  </p>
                </div>
                {app.supported && (
                  <Badge 
                    variant="secondary" 
                    className="bg-[hsl(var(--ledger-blue))] text-white border-none ml-4"
                  >
                    <CheckCircle size={14} className="mr-1" />
                    Ledger Live supported
                  </Badge>
                )}
              </div>
              
              <Button 
                variant="secondary" 
                className="bg-[hsl(var(--ledger-bg-tertiary))] hover:bg-[hsl(var(--ledger-hover))] text-[hsl(var(--ledger-text-primary))] border-none"
              >
                <Download size={16} className="mr-2" />
                Install
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}