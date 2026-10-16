"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api/client";

export function SoaWorkflowSettings() {
  const utils = api.useUtils();
  const { data, isLoading } = api.settings.getWorkflow.useQuery();
  const [day, setDay] = useState("20");

  useEffect(() => {
    if (data?.soaAdvancePromptDay != null) {
      setDay(String(data.soaAdvancePromptDay));
    }
  }, [data?.soaAdvancePromptDay]);

  const save = api.settings.updateSoaAdvancePromptDay.useMutation({
    onSuccess: () => {
      toast.success("Saved");
      void utils.settings.getWorkflow.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const parsed = Number(day);
  const valid = Number.isInteger(parsed) && parsed >= 1 && parsed <= 31;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">SOA</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 max-w-xs">
          <Label htmlFor="soa-advance-prompt-day">
            Early run reminder (day of month)
          </Label>
          <Input
            id="soa-advance-prompt-day"
            type="number"
            min={1}
            max={31}
            inputMode="numeric"
            disabled={isLoading || save.isPending}
            value={day}
            onChange={(e) => setDay(e.target.value)}
          />
        </div>
        <Button
          type="button"
          disabled={!valid || isLoading || save.isPending}
          onClick={() => save.mutate({ day: parsed })}
        >
          Save
        </Button>
      </CardContent>
    </Card>
  );
}
