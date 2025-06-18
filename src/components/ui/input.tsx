import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, placeholder, value, ...props }, ref) => {
  const [inputWidth, setInputWidth] = React.useState<number>(0);
  const hiddenSpanRef = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    if (hiddenSpanRef.current) {
      const contentWidth = hiddenSpanRef.current.offsetWidth;
      // Add some padding to avoid text being cut off
      setInputWidth(contentWidth + 20);
    }
  }, [value, placeholder]);

  const displayText = (value as string) || placeholder || "";

  return (
    <div className="flex flex-col items-center w-full">
      <div className="relative">
        <span
          ref={hiddenSpanRef}
          className="invisible absolute whitespace-pre text-lg px-3"
          aria-hidden="true"
        >
          {displayText}
        </span>
        <input
          type={type}
          style={{ width: inputWidth > 0 ? `${inputWidth}px` : "auto" }}
          className={cn(
            "flex h-12 bg-background text-center text-lg border-0 border-b-2 border-input active:border-black active:font-bold px-1 py-2 focus:outline-none focus:border-black ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          ref={ref}
          placeholder={placeholder as string}
          value={value}
          {...props}
        />
      </div>
    </div>
  );
});
Input.displayName = "Input";

export { Input };
