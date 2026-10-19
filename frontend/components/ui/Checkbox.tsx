import { useEffect, useRef, type FC } from "react";

interface CheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  label: string;
  onChange: () => void;
}

export const Checkbox: FC<CheckboxProps> = ({ checked, indeterminate = false, label, onChange }) => {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate && !checked;
  }, [indeterminate, checked]);

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      aria-label={label}
      onChange={onChange}
      className="size-4 shrink-0 cursor-pointer accent-primary"
    />
  );
};
