import React, { createContext, useContext, useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// 1. Kontext für Select
const SelectContext = createContext(null);

const useSelectContext = () => {
  const context = useContext(SelectContext);
  if (!context) {
    throw new Error("Select components must be used within a SelectProvider.");
  }
  return context;
};

// 2. Hauptkomponente
const Select = ({ children, value, onValueChange, placeholder = "Auswählen...", ...props }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState("");

  const findLabel = (val) => {
    let label = "";
    React.Children.forEach(children, child => {
      if (child && child.type === SelectContent) {
        React.Children.forEach(child.props.children, item => {
          if (item && item.props && item.props.value === val) {
            const itemContent = item.props.children;
            if (typeof itemContent === 'string') {
              label = itemContent;
            } else if (React.isValidElement(itemContent)) {
              // Versucht, den Text aus einem komplexeren Kind-Element zu extrahieren
              label = itemContent.props?.children || val;
            } else {
              label = String(val);
            }
          }
        });
      }
    });
    return label;
  };

  useEffect(() => {
    if (value) {
      const newLabel = findLabel(value);
      setSelectedLabel(newLabel);
    } else {
      setSelectedLabel("");
    }
  }, [value, children]);

  const handleSelect = (val, labelRaw) => {
    let label;
    if (typeof labelRaw === 'string') {
      label = labelRaw;
    } else if (React.isValidElement(labelRaw)) {
      label = labelRaw.props?.children || val;
    } else {
      label = String(val);
    }

    setSelectedLabel(label);
    onValueChange?.(val);
    setIsOpen(false);
  };

  const triggerRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event) => {
      if (
        triggerRef.current && !triggerRef.current.contains(event.target) &&
        contentRef.current && !contentRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const contextValue = {
    isOpen,
    setIsOpen,
    selectedValue: value,
    selectedLabel,
    handleSelect,
    placeholder,
    triggerRef,
    contentRef,
  };

  return (
    <SelectContext.Provider value={contextValue}>
      <div className="relative" {...props}>
        {children}
      </div>
    </SelectContext.Provider>
  );
};

// 3. Trigger
const SelectTrigger = React.forwardRef(({ className, ...props }, ref) => {
  const { isOpen, setIsOpen, triggerRef } = useSelectContext();

  return (
    <button
      ref={triggerRef}
      type="button"
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      onClick={() => setIsOpen(prev => !prev)}
      {...props}
    >
      {props.children}
      <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform flex-shrink-0", isOpen && "rotate-180")} />
    </button>
  );
});
SelectTrigger.displayName = "SelectTrigger";

// 4. Inhalt
const SelectContent = React.forwardRef(({ className, children, ...props }, ref) => {
  const { isOpen, contentRef } = useSelectContext();
  if (!isOpen) return null;

  return (
    <div
      ref={contentRef}
      className={cn(
        "absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95",
        className
      )}
      {...props}
    >
      <div className="p-1">
        {children}
      </div>
    </div>
  );
});
SelectContent.displayName = "SelectContent";

// 5. Eintrag
const SelectItem = React.forwardRef(({ className, children, value, ...props }, ref) => {
  const { handleSelect, selectedValue } = useSelectContext();
  const isSelected = selectedValue === value;

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-2 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
        isSelected && "bg-accent text-accent-foreground",
        className
      )}
      onClick={() => handleSelect(value, children)}
      {...props}
    >
      {children}
    </div>
  );
});
SelectItem.displayName = "SelectItem";

// 6. Zusatzkomponenten
const SelectValue = () => {
  const { selectedLabel, placeholder } = useSelectContext();
  return (
    <span className="block truncate text-left">
      {selectedLabel || placeholder}
    </span>
  );
};

const SelectGroup = React.forwardRef((props, ref) => <div ref={ref} {...props} />);
SelectGroup.displayName = "SelectGroup";

const SelectLabel = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("py-1.5 pl-2 pr-2 text-sm font-semibold text-muted-foreground", className)} {...props} />
));
SelectLabel.displayName = "SelectLabel";

const SelectSeparator = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("-mx-1 my-1 h-px bg-muted", className)} {...props} />
));
SelectSeparator.displayName = "SelectSeparator";

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
};