import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

// simple list of formats for the data
const FORMATS = [
  { value: "table", label: "Table" },
  { value: "json", label: "JSON" },
  { value: "csv", label: "CSV" },
];

// component to let user pick the output format
function FormatSelector(props: any) {
  const value = props.value;
  const onChange = props.onChange;
  
  return (
    <RadioGroup
      value={value}
      onValueChange={onChange}
      className="flex flex-wrap gap-3"
    >
      {FORMATS.map(function(format) {
        // check if this one is selected
        const isSelected = value === format.value;
        
        return (
          <div key={format.value} className="flex items-center">
            <RadioGroupItem
              value={format.value}
              id={format.value}
              className="peer sr-only"
            />
            <Label
              htmlFor={format.value}
              className={`format-chip ${
                isSelected ? "format-chip-selected" : "format-chip-unselected"
              }`}
            >
              {format.label}
            </Label>
          </div>
        );
      })}
    </RadioGroup>
  );
}

export default FormatSelector;
