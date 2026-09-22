"use client";

import { Fragment } from "react";

import {
  BANK_ISSUER_GROUP_LABELS,
  BANK_ISSUER_GROUP_ORDER,
  formatBankIssuer,
  issuersByGroup,
  normalizeBankIssuer,
  type BankIssuer,
} from "@/lib/db/schema/credit-cards";
import { cn } from "@/lib/utils/cn";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type BankIssuerSelectProps = {
  id?: string;
  value: BankIssuer;
  disabled?: boolean;
  onValueChange: (value: BankIssuer) => void;
};

const GROUP_HEADER_CLASS =
  "sticky top-0 z-10 border-b border-border/50 bg-popover/95 px-3 py-2 pl-3 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground backdrop-blur-sm";

export function BankIssuerSelect({
  id,
  value,
  disabled = false,
  onValueChange,
}: BankIssuerSelectProps) {
  return (
    <Select
      key={value}
      value={value}
      disabled={disabled}
      onValueChange={(next) => onValueChange(normalizeBankIssuer(next))}
    >
      <SelectTrigger id={id} className="min-h-[44px] w-full">
        <SelectValue placeholder="Select bank">
          {formatBankIssuer(value)}
        </SelectValue>
      </SelectTrigger>
      <SelectContent
        className={cn(
          "max-h-[min(60vh,22rem)] max-w-[calc(100vw-24px)] p-0 [&>div]:p-0",
        )}
        position="popper"
      >
        {BANK_ISSUER_GROUP_ORDER.map((group, groupIndex) => {
          const options = issuersByGroup(group);
          if (options.length === 0) return null;

          return (
            <Fragment key={group}>
              {groupIndex > 0 ? (
                <SelectSeparator className="my-0 h-px bg-border/60" />
              ) : null}
              <SelectGroup className="py-1">
                <SelectLabel className={GROUP_HEADER_CLASS}>
                  {BANK_ISSUER_GROUP_LABELS[group]}
                </SelectLabel>
                {options.map((option) => (
                  <SelectItem
                    key={option.id}
                    value={option.id}
                    className="min-h-[44px] rounded-md pl-9 pr-3"
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </Fragment>
          );
        })}
      </SelectContent>
    </Select>
  );
}
