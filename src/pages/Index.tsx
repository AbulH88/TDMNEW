import { useState } from "react";
import { Plus, Sparkles, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Header from "@/components/Header";
import StepCard from "@/components/StepCard";
import DataRow, { DataField } from "@/components/DataRow";
import FormatSelector from "@/components/FormatSelector";
import GeneratedOutput from "@/components/GeneratedOutput";
import { DATA_TYPES } from "@/components/DataTypeSelector";
import { generateData } from "@/lib/dataGenerator";
import { useToast } from "../hooks/use-toast";
import { API_ENDPOINTS } from "@/constants";

const ENVIRONMENTS = ["Q1", "Q2", "Q3", "Q4", "Q5"];

// main page for the data generator tool
function Index() {
  const { toast } = useToast();
  
  // state for the form
  const [fields, setFields] = useState<DataField[]>([]);
  const [format, setFormat] = useState("json");
  const [rowCount, setRowCount] = useState(10);
  const [generatedData, setGeneratedData] = useState<string | null>(null);
  const [newFieldType, setNewFieldType] = useState("names");
  const [environment, setEnvironment] = useState<string>("Q1");
  const [tableName, setTableName] = useState<string>("tblpatintakeplan");

  // get the table columns from the backend
  const handleFetchSchema = async () => {
    if (!tableName || tableName.trim() === "") {
      toast({ title: "Error", description: "Enter a table name first.", variant: "destructive" });
      return;
    }

    try {
      const url = `${API_ENDPOINTS.SCHEMA_GEN}?environment=${environment}&tableName=${tableName}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error("Failed to get schema");
      }
      
      const result = await response.json();
      
      // map backend columns to our field objects
      const newFields = result.schema.map((col: any, index: number) => {
        let type = 'text';
        const colName = col.column_name.toLowerCase();
        const colType = col.data_type.toLowerCase();

        if (colType.includes('date')) type = 'date';
        else if (colType.includes('number')) type = 'number';
        else if (colName.includes('name')) type = 'names';
        else if (colName.includes('email')) type = 'email';

        return {
          id: Date.now() + "-" + index,
          type: type,
          propertyName: colName, // keep it simple, just use column name
          option: "",
          checked: true,
        };
      });

      setFields(newFields);
      toast({ title: "Success", description: "Schema loaded for " + result.tableName });
      
    } catch (error) {
      toast({ title: "Fetch Failed", description: "Could not load schema from db.", variant: "destructive" });
    }
  };

  // helper functions for managing the list of fields
  const updateField = (id: string, updates: any) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const deleteField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const duplicateField = (id: string) => {
    const field = fields.find(f => f.id === id);
    if (field) {
        const index = fields.findIndex(f => f.id === id);
        const newField = { ...field, id: Date.now().toString() };
        const updated = [...fields];
        updated.splice(index + 1, 0, newField);
        setFields(updated);
    }
  };

  const addField = () => {
    const field: DataField = {
      id: Date.now().toString(),
      type: newFieldType,
      propertyName: newFieldType,
      option: "",
      checked: true,
      value: "",
    };
    setFields([...fields, field]);
  };

  const toggleAll = (val: boolean) => {
    setFields(fields.map(f => {
        return { ...f, checked: val };
    }));
  };

  // actual generation logic
  const handleGenerate = () => {
    if (fields.length === 0) {
        toast({ title: "No fields", description: "Add some fields first." });
        return;
    }
    const data = generateData(fields, rowCount, format);
    setGeneratedData(data);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-6xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold text-center mb-10">Data Management Tool</h1>
        
        <div className="space-y-8">
          {/* Step 1: Database and Fields */}
          <StepCard step={1} title="Configure Data Fields">
            <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-white border rounded shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-sm">Env:</span>
                <Select value={environment} onValueChange={setEnvironment}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ENVIRONMENTS.map(env => <SelectItem key={env} value={env}>{env}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              
              <Input
                placeholder="Table Name"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                className="w-48"
              />
              
              <Button onClick={handleFetchSchema} variant="outline" className="flex gap-2">
                <Database className="h-4 w-4" /> Fetch DB Columns
              </Button>
            </div>

            <div className="bg-gray-800 text-white flex items-center gap-4 px-4 py-3 rounded-t text-sm font-bold">
              <div className="w-4" />
              <Checkbox
                checked={fields.length > 0 && fields.every(f => f.checked)}
                onCheckedChange={(val) => toggleAll(!!val)}
              />
              <span className="w-8">All</span>
              <span className="w-[180px]">Type</span>
              <span className="w-[140px]">Property</span>
              <span className="w-[160px]">Value</span>
              <span className="ml-auto">Actions</span>
            </div>
            
            <div className="border border-t-0 rounded-b bg-white">
              {fields.length === 0 ? (
                  <div className="p-10 text-center text-gray-400">No fields added yet. Load from DB or add manually below.</div>
              ) : (
                  fields.map((f, i) => (
                    <DataRow
                      key={f.id}
                      field={f}
                      index={i}
                      onUpdate={updateField}
                      onDelete={deleteField}
                      onDuplicate={duplicateField}
                    />
                  ))
              )}
            </div>
            
            <div className="flex items-center gap-4 mt-6">
              <span className="text-sm font-bold">Add Manual Field:</span>
              <Select value={newFieldType} onValueChange={setNewFieldType}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DATA_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={addField} variant="secondary">
                <Plus className="h-4 w-4 mr-2" /> Add
              </Button>
            </div>
          </StepCard>

          {/* Step 2: Format */}
          <StepCard step={2} title="Choose Output Format">
            <FormatSelector value={format} onChange={setFormat} />
          </StepCard>

          {/* Step 3: Count and Generate */}
          <StepCard step={3} title="Row Count & Generate">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm">Rows:</span>
                <Input
                  type="number"
                  value={rowCount}
                  onChange={(e) => setRowCount(parseInt(e.target.value) || 1)}
                  className="w-24"
                  min={1}
                />
              </div>
              <Button onClick={handleGenerate} className="bg-blue-600 hover:bg-blue-700 gap-2">
                <Sparkles className="h-4 w-4" /> Create Data
              </Button>
            </div>
          </StepCard>

          {/* Result Section */}
          {generatedData && (
            <GeneratedOutput data={generatedData} format={format} />
          )}
        </div>
      </main>
      
      <footer className="bg-white border-t py-10 mt-20">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-400 text-xs">
          <p>&copy; 2026 TestDataManagement Tool. Internal Use Only.</p>
        </div>
      </footer>
    </div>
  );
}

export default Index;
