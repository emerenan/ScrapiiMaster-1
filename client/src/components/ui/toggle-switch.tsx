import * as React from "react";
import { cn } from "@/lib/utils";

interface ToggleSwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function ToggleSwitch({
  checked = false,
  onCheckedChange,
  disabled = false,
  className,
}: ToggleSwitchProps) {
  return (
    <label 
      className={cn(
        "relative inline-block w-9 h-5",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <input 
        type="checkbox" 
        className="opacity-0 w-0 h-0"
        checked={checked}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        disabled={disabled}
      />
      <span 
        className={cn(
          "absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-gray-300 transition-all duration-300 rounded-full",
          checked && "bg-primary"
        )}
      >
        <span 
          className={cn(
            "absolute h-4 w-4 left-0.5 bottom-0.5 bg-white rounded-full transition-transform duration-300",
            checked && "transform translate-x-4"
          )}
        />
      </span>
    </label>
  );
}
