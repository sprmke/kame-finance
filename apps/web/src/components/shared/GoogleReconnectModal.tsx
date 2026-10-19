"use client";

import { useSyncExternalStore } from "react";
import { Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useReconnectGoogle } from "@/hooks/use-reconnect-google";
import { formatGoogleReconnectReason } from "@/lib/auth/google-reconnect-message";
import {
  dismissGoogleReconnectModal,
  getGoogleReconnectServerSnapshot,
  getGoogleReconnectSnapshot,
  subscribeGoogleReconnect,
} from "@/lib/auth/google-reconnect-store";

export function GoogleReconnectModal() {
  const snapshot = useSyncExternalStore(
    subscribeGoogleReconnect,
    getGoogleReconnectSnapshot,
    getGoogleReconnectServerSnapshot,
  );
  const { reconnectGoogle, isReconnectPending } = useReconnectGoogle();
  const reason = formatGoogleReconnectReason(snapshot.message);

  return (
    <Dialog
      open={snapshot.open}
      onOpenChange={(open) => {
        if (!open) dismissGoogleReconnectModal();
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            <DialogTitle>Reconnect Gmail</DialogTitle>
          </div>
          <DialogDescription>{reason}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Button
            className="h-11 w-full"
            onClick={() => reconnectGoogle()}
            disabled={isReconnectPending}
          >
            Reconnect Gmail
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full"
            onClick={dismissGoogleReconnectModal}
          >
            Not now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
