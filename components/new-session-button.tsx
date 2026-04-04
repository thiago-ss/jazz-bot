"use client";

import { useRouter } from "next/navigation";
import { startTransition } from "react";
import { SquarePenIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

interface NewSessionButtonProps {
  compact?: boolean;
  className?: string;
}

export function NewSessionButton({
  compact = false,
  className,
}: NewSessionButtonProps) {
  const router = useRouter();
  const { isMobile, toggleSidebar } = useSidebar();

  const handleClick = () => {
    if (isMobile) {
      toggleSidebar();
    }

    startTransition(() => {
      router.push("/chat");
    });
  };

  return compact ? (
    <Button
      type="button"
      variant="outline"
      onClick={handleClick}
      title="New session"
      className={cn(
        "h-8 w-8 rounded-lg border-border/70 bg-background p-0 text-muted-foreground",
        "hover:bg-sidebar-accent hover:text-foreground",
        className,
      )}
    >
      <SquarePenIcon className="h-4 w-4 shrink-0" />
    </Button>
  ) : (
    <Button
      type="button"
      variant="outline"
      onClick={handleClick}
      className={cn(
        "h-8 w-full gap-1.5 rounded-lg border-border/70 bg-background px-3 text-xs text-muted-foreground",
        "hover:bg-sidebar-accent hover:text-foreground",
        className,
      )}
    >
      <SquarePenIcon className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">New session</span>
    </Button>
  );
}
