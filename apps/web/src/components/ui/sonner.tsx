"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      closeButton
      visibleToasts={4}
      expand={false}
      gap={12}
      offset={16}
      toastOptions={{
        classNames: {
          toast:
            "group toast kame-toast !bg-card !text-card-foreground !border !border-border !rounded-lg !px-4 !py-3",
          title: "!text-sm !font-semibold !leading-snug",
          description: "!text-13 !text-muted-foreground !leading-snug",
          actionButton:
            "!bg-primary !text-primary-foreground !text-xs !font-semibold !rounded-md !px-3 !py-1.5",
          cancelButton:
            "!bg-muted !text-foreground !text-xs !font-semibold !rounded-md !px-3 !py-1.5",
          closeButton: "kame-toast-close",
          success: "kame-toast-success",
          error: "kame-toast-error",
          warning: "kame-toast-warning",
          info: "kame-toast-info",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
