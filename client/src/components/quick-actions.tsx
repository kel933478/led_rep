import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface QuickAction {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary';
  badge?: string | number;
  disabled?: boolean;
}

interface QuickActionsProps {
  actions: QuickAction[];
  orientation?: 'horizontal' | 'vertical';
}

export default function QuickActions({ actions, orientation = 'horizontal' }: QuickActionsProps) {
  const containerClass = orientation === 'horizontal' 
    ? 'flex items-center space-x-2' 
    : 'flex flex-col space-y-2';

  return (
    <TooltipProvider>
      <div className={containerClass}>
        {actions.map((action, index) => (
          <Tooltip key={index}>
            <TooltipTrigger asChild>
              <Button
                variant={action.variant || 'outline'}
                size="sm"
                onClick={action.onClick}
                disabled={action.disabled}
                className="relative"
              >
                {action.icon}
                {orientation === 'vertical' && (
                  <span className="ml-2">{action.label}</span>
                )}
                {action.badge && (
                  <Badge className="absolute -top-1 -right-1 w-5 h-5 text-xs p-0 flex items-center justify-center">
                    {action.badge}
                  </Badge>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{action.label}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}