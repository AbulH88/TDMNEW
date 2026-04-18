import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// all the data types we support in the tool
const DATA_TYPES = [
  { value: "names", label: "Names", icon: "👤" },
  { value: "phone", label: "Phone", icon: "📞" },
  { value: "email", label: "Email", icon: "✉️" },
  { value: "text", label: "Text", icon: "📝" },
  { value: "address", label: "Street Address", icon: "🏠" },
  { value: "postal", label: "Postal / Zip", icon: "📮" },
  { value: "region", label: "Region", icon: "🗺️" },
  { value: "country", label: "Country", icon: "🌍" },
  { value: "alphanumeric", label: "Alphanumeric", icon: "🔤" },
  { value: "subscriber_id", label: "Subscriber ID", icon: "🛂" },
  { value: "number", label: "Number Range", icon: "🔢" },
  { value: "currency", label: "Currency", icon: "💰" },
  { value: "date", label: "Date", icon: "📅" },
  { value: "constant", label: "Constant Value", icon: "📌" },
  { value: "creditcard", label: "Credit Card", icon: "💳" },
  { value: "password", label: "Password", icon: "🔒" },
];

// simple selector to pick the data type for a row
function DataTypeSelector(props: any) {
  const { value, onChange } = props;
  
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select type" />
      </SelectTrigger>
      <SelectContent>
        {DATA_TYPES.map(function(type) {
            return (
              <SelectItem key={type.value} value={type.value}>
                <span className="flex items-center gap-2">
                  <span>{type.icon}</span>
                  <span>{type.label}</span>
                </span>
              </SelectItem>
            );
        })}
      </SelectContent>
    </Select>
  );
}

export default DataTypeSelector;
export { DATA_TYPES };
