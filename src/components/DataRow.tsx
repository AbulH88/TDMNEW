import { GripVertical, Copy, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import DataTypeSelector from "./DataTypeSelector";

// definition for a single field in our data
export interface DataField {
  id: string;
  type: string;
  propertyName: string;
  option: string;
  checked: boolean;
  value?: string;
  example?: string;
}

// this component draws a single row in the tables
const DataRow = (props: any) => {
  const { field, index, onUpdate, onDelete, onDuplicate, isCreateMode, isIntakeMode } = props;

  // special layout for the intake creation mode
  if (isIntakeMode) {
    return (
      <div className="flex items-center gap-4 px-4 py-3 bg-white border-b hover:bg-gray-50">
        <div className="flex-1 text-sm font-bold">
          {field.propertyName}
        </div>
        
        <div className="flex-1">
          <Input
            value={field.value || ""}
            onChange={(e) => onUpdate(field.id, { value: e.target.value })}
            placeholder={field.example ? "e.g. " + field.example : "Random data if empty"}
            className="h-8"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDuplicate(field.id)}>
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(field.id)}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </div>
    );
  }

  // default layout for the query table
  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-white border-b hover:bg-gray-50">
      <div className="text-gray-400">
        <GripVertical className="h-4 w-4" />
      </div>
      
      <Checkbox
        checked={field.checked}
        onCheckedChange={(val) => onUpdate(field.id, { checked: !!val })}
      />
      
      <span className="w-8 text-xs text-blue-600 font-bold">
          {index + 1 < 10 ? "0" + (index + 1) : index + 1}
      </span>
      
      <DataTypeSelector
        value={field.type}
        onChange={(newType: string) => onUpdate(field.id, { type: newType })}
      />
      
      <div className="w-[140px] text-sm truncate">
        {field.propertyName}
      </div>

      <div className="w-[160px]">
          <Input
            value={field.value || ""}
            onChange={(e) => onUpdate(field.id, { value: e.target.value })}
            placeholder={isCreateMode ? "Value" : "Filter"}
            className="h-8"
          />
      </div>
      
      <div className="flex items-center gap-1 ml-auto">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDuplicate(field.id)}>
          <Copy className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(field.id)}>
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>
    </div>
  );
};

export default DataRow;
