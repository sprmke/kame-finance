"use client";

import { Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

type StatementPayNowButtonProps = {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "default";
  fullWidth?: boolean;
};

export function StatementPayNowButton({
  onClick,
  disabled,
  className,
  size = "sm",
  fullWidth,
}: StatementPayNowButtonProps) {
  return (
    <Button
      type="button"
      size={size}
      className={cn(fullWidth && "w-full", className)}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        event.preventDefault();
        onClick();
      }}
    >
      <Upload className="mr-1.5 h-3.5 w-3.5" />
      Pay now
    </Button>
  );
}
