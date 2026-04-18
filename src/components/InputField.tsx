import React from 'react';
import { Input } from "@/components/ui/input";

interface InputFieldProps {
  label: string;
  id: string;
  value: string;
  type?: string;
  readOnly?: boolean;
  onUpdate: (newValue: string) => void;
}

const InputField = ({ label, id, type="text", readOnly=false, value, onUpdate }: InputFieldProps) => {
  return (
    <div className="data-row animate-fade-in group">
      <div className="w-[120px] text-sm text-foreground truncate" title={id}>
        {label}
      </div>

      <div className="w-[200px]">
        <Input
            id={id}
            type={type}
            value={value}
            onChange={(e) => onUpdate(e.target.value)}
            className="h-8"
            readOnly={readOnly}
        />
      </div>
    </div>
  );
};

export default InputField;
