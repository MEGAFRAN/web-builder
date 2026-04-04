"use client";
import { useState } from "react";

interface CheckboxProps {
  label: string;
  checked?: boolean | null;
}

export function Checkbox({ label, checked: initialChecked }: CheckboxProps) {
  const [checked, setChecked] = useState<boolean>(initialChecked ?? false);
  return (
    <label data-component="checkbox" className="flex cursor-pointer items-center gap-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => setChecked(e.target.checked)}
        className="rounded border-border text-primary focus:ring-primary"
      />
      <span className="text-sm text-foreground">{label}</span>
    </label>
  );
}
