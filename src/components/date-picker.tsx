"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { ChevronDownIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverAnchor } from "@/components/ui/popover";
import { format } from "date-fns";
import { useState } from "react";

interface DatePickerProps {
  label: string;
  value?: Date;
  onValueChange: (date: Date | undefined) => void;
}

export function DatePicker({ label, value, onValueChange }: DatePickerProps) {
  const [open, setOpen] = useState(false);

  const handleChange = (selected: Date | undefined) => {
    onValueChange(selected);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <Button
          onClick={() => {
            setOpen(true);
          }}
          variant="outline"
          data-empty={!value}
          className="w-53 justify-between text-left font-normal data-[empty=true]:text-muted-foreground"
        >
          {value ? format(value, "PPP") : <span>{label}</span>}
          <ChevronDownIcon />
        </Button>
      </PopoverAnchor>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={value} onSelect={handleChange} defaultMonth={value} />
      </PopoverContent>
    </Popover>
  );
}
