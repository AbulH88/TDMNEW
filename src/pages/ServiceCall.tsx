import Header from "@/components/Header";
import { useState, useEffect } from "react";
import { Database, Download, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import InputField from "@/components/InputField";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DataRow, { DataField } from "@/components/DataRow";
import { useToast } from "../hooks/use-toast";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ENVIRONMENTS, SERVICE_TYPES, API_ENDPOINTS } from "@/constants";
import { apiService } from "@/services/apiService";
import { SERVICE_DEFS } from "@/constants/index";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import FormatSelector from "@/components/FormatSelector";


const ServiceCall = () => {
    const { toast } = useToast();
    
    // Mode selector
    const [activeMode, setActiveMode] = useState<"retrieve" | "create" | "delete">("retrieve");
    
    // settings used across all modes
    const [environment, setEnvironment] = useState<string>("Q1");
    const [selectedService, setSelectedService] = useState("patient-rest-services");
    
    // stuff for retrieving data
    const [fields, setFields] = useState<DataField[]>([]);
    const [queryOutput, setQueryOutput] = useState<any>(null);
    const [isQueryLoading, setIsQueryLoading] = useState(false);
    const [showPayloadDialog, setShowPayloadDialog] = useState(false);
    const [queryFormat, setQueryFormat] = useState<string>("table");
    
    // stuff for creating data
    const [intakeFields, setIntakeFields] = useState<DataField[]>([]);
    const [intakeOutput, setIntakeOutput] = useState<any>(null);
    const [isCreateLoading, setIsCreateLoading] = useState(false);
    const [isCreateConfirmOpen, setCreateConfirmOpen] = useState(false);
    const [showCreatePayloadDialog, setShowCreatePayloadDialog] = useState(false);
    const [createFormat, setCreateFormat] = useState<string>("table");
    const [createRowCount, setCreateRowCount] = useState<number>(1);
    const [queryRowCount, setQueryRowCount] = useState(1);
    
    // Delete Data state
    const [patientNumber, setPatientNumber] = useState("");
    const [intakeId, setIntakeId] = useState("");
    const [lastName, setLastName] = useState("");
    const [isDeleteLoading, setIsDeleteLoading] = useState(false);
    const [isDeleteConfirmLoading, setIsDeleteConfirmLoading] = useState(false);
    const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [showDeletePayloadDialog, setShowDeletePayloadDialog] = useState(false);

    // For additional services states
    const serviceDef = SERVICE_DEFS.find(s => s.value === selectedService);
    const canCreate = !!serviceDef?.capabilities.create;
    const canDelete = !!serviceDef?.capabilities.delete;
    const canRetrieve = !!serviceDef?.capabilities.retrieve;
    const [selectedQueryId, setSelectedQueryId] = useState<string>("");
    const variants = serviceDef?.queryVariants || [];
    const showVariantSelect = variants.length > 1;




    // ============ RETRIEVE DATA HANDLERS ============
    const handleFetchQuerySchema = async () => {
        if (!selectedService) {
            toast({ title: "Service Type Required", description: "Select a Service Type first.", variant: "destructive" });
            return;
        }

        setIsQueryLoading(true);
        try {
            const res = await apiService.fetchSchema(environment, selectedService, "query", selectedQueryId);
            if (res.schema && res.schema.length > 0) {
                const mappedFields = res.schema.map((f: any) => {
                    return { ...f, value: f.value || "" };
                });
                setFields(mappedFields);
                toast({ title: "Schema Loaded", description: "Query columns loaded from " + environment });
            } else {
                toast({ title: "No Columns", description: "No columns found for this service.", variant: "destructive" });
            }
        } catch (err) {
            toast({ title: "Error", description: "Failed to load columns.", variant: "destructive" });
        }
        setIsQueryLoading(false);
    };

    const updateField = (id: string, updates: any) => {
        const newFields = fields.map(f => {
            if (f.id === id) return { ...f, ...updates };
            return f;
        });
        setFields(newFields);
    };

    const deleteField = (id: string) => {
      setFields(prev => prev.filter(f => f.id !== id));
    };

    const formatDataAsJson = (data: any): string => {
      return JSON.stringify(data, null, 2);
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

    const toggleAll = (checked: boolean) => {
        setFields(fields.map(f => {
            return { ...f, checked: checked };
        }));
    };

    // run the actual search
    const handleExecute = async () => {
        if (!selectedService) {
            toast({ title: "Service Type Required", description: "Select a service.", variant: "destructive" });
            return;
        }

        const cols = fields.filter(f => f.checked).map(f => f.propertyName);
        if (cols.length === 0) {
            toast({ title: "No Columns", description: "Select at least one column.", variant: "destructive" });
            return;
        }

        // gather filters
        const filterObj: any = {};
        for (let i = 0; i < fields.length; i++) {
            const f = fields[i];
            if (f.value && String(f.value).trim() !== "") {
                filterObj[f.propertyName] = f.value;
            }
        }

        setIsQueryLoading(true);
        setQueryOutput(null);

        try {
            const res =  await apiService.executeQuery(environment, selectedService, cols, filterObj, queryRowCount, selectedQueryId)
            
            if (res.data) {
                const data = Array.isArray(res.data) ? res.data : [res.data];
                setQueryOutput(data);
                toast({ title: "Search Complete", description: "Fetched data from " + environment });
            } else {
                setQueryOutput(res.message || "No data found.");
                toast({ title: "No results", description: "No data matched your filters.", variant: "destructive" });
            }
        } catch (err) {
            setQueryOutput("Error: " + (err as Error).message);
            toast({ title: "Error", description: "Failed to run search.", variant: "destructive" });
        }
        setIsQueryLoading(false);
    };

    // CREATING DATA FUNCTIONS

    // get fields for the intake creation form
    const handleFetchIntakeSchema = async () => {
        if (!selectedService) {
            toast({ title: "Service Type Required", description: "Select a Service Type first.", variant: "destructive" });
            return;
        }

        setIsCreateLoading(true);
        try {
            const res = await apiService.fetchSchema(environment, selectedService, "create-intake");
            if (res.schema && res.schema.length > 0) {
                const mapped = res.schema.map((f: any) => {
                    return { ...f, value: f.value || "" };
                });
                setIntakeFields(mapped);
                toast({ title: "Fields Loaded", description: "Custom fields loaded." });
            }
        } catch (err) {
            toast({ title: "Error", description: "Failed to load fields.", variant: "destructive" });
        }
        setIsCreateLoading(false);
    };

    const updateIntakeField = (id: string, updates: any) => {
        setIntakeFields(intakeFields.map(f => f.id === id ? { ...f, ...updates } : f));
    };

     // creation logic
    const handleCreateIntake = async () => {
        if (!selectedService) {
            toast({ title: "Service Type Required", description: "Select a service.", variant: "destructive" });
            return;
        }

        setIsCreateLoading(true);
        setCreateConfirmOpen(false);
        setIntakeOutput(null);

        try {
            const results: any[] = [];
            
            // loop based on row count input
            for (let i = 0; i < createRowCount; i++) {
                const dataFields: Record<string, any> = {};

                for (let j = 0; j < intakeFields.length; j++) {
                    const f = intakeFields[j];
                    if (f.checked) {
                        dataFields[f.propertyName] = f.value ?? "";
                    }
                }

                const res = await apiService.createIntakeData(
                    environment,
                    selectedService,
                    Object.keys(dataFields).length > 0 ? dataFields : undefined
                );

                if (res.data) {
                    const rowData = Array.isArray(res.data) ? res.data : [res.data];
                    for (let k = 0; k < rowData.length; k++) {
                        results.push(rowData[k]);
                    }
                }
            }

            if (results.length > 0) {
                setIntakeOutput(results);
                toast({ title: "Success", description: results.length + " rows created in " + environment });
            } else {
                toast({ title: "Issue", description: "Creation failed.", variant: "destructive" });
            }
        } catch (err) {
            toast({ title: "Error", description: "Failed to create data.", variant: "destructive" });
        }
        setIsCreateLoading(false);
    };

    // ============ DELETE DATA HANDLERS ============
    

    const [deleteSearchResults, setSearchResults] = useState<Array<{
    id: string;
    PATIENTNUMBER: string;
    INTAKEID: string;
    LASTNAME: string;
    }>>([]);

    // Used for selecting specific patient on data-delete search
    const [selectedResultId, setSelectedSearchId] = useState<string | null>(null);
    const selectedResult = deleteSearchResults.find(r => r.id === selectedResultId) || null;


    const handleDeleteDataPopup = async () => {
        // Update to allow popup to appear and to disable button
        setDeleteConfirmOpen(true)
        setIsDeleteLoading(true);
        setIsDeleteConfirmLoading(true);
        setSearchResults([]);
        setSelectedSearchId(null);

        // Show data on confirmation screen
        try {
            // If no fields are populated, throw error
            if (patientNumber.length == 0 && intakeId.length == 0 && lastName.length == 0)
            {
                resetDelete();
                throw("Error - fields not populated");
            }

            // Populate remaining data using passed data
            const selectedColumns = ["LASTNAME", "PATIENTNUMBER", "INTAKEID"];
            const filters: Record<string, string> = {};
            if (intakeId.length > 0) {filters["INTAKEID"] = intakeId;}
            if (patientNumber.length > 0) {filters["PATIENTNUMBER"] = patientNumber;}
            if (lastName.length > 0) {filters["LASTNAME"] = lastName;}
            const result = await apiService.executeQuery(environment, selectedService, selectedColumns, filters,10, selectedQueryId);
            const dataToSet = Array.isArray(result.data) ? result.data : [result.data];

            // If server returned data, update fields
            if (dataToSet.length > 0 && dataToSet[0] !== null)
            {
                // Save all fields (user will pick ne later on)
                const searchResults = dataToSet.map((row: any, i: number) => ({
                    id: {i},
                    PATIENTNUMBER: String(row.PATIENTNUMBER ?? ""),
                    INTAKEID: String(row.INTAKEID ?? ""),
                    LASTNAME: String(row.LASTNAME ?? "")
                }));
                setSearchResults(searchResults);
                setSelectedSearchId(null);
            }
            else
            {
                resetDelete();
                throw("Error - no patient found using provided details");
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            toast({ title: "Error", description: `Failed to delete data: ${errorMessage}` });
        }
        finally {
            setIsDeleteConfirmLoading(false);
            setIsDeleteLoading(false);
        }

    };


     const handleDeleteData = async () => {
        try {
            if (!selectedResult) {
                toast({ title: "Error", description: "Please select a record to delete." });
                return;
            }
            
            setIsDeleteLoading(true);

            // Get selected patient details:
            const patientNumberToDelete = selectedResult.PATIENTNUMBER;
            if (!patientNumberToDelete) {
                throw("Error - Selected record does not have a PATIENTNUMBER.");
            }

            // Try to delete data using patientNumber
            const result = await apiService.deleteData(
                environment,
                selectedService,
                patientNumberToDelete
            );

            //Toast status given api response
            if (result.data) {
                toast({ title: "Data Delete Successful", description: `Data deleted and verified in ${environment}.` });
            } else {
                console.log(result.message);
                toast({ title: "Data Delete Failed", description: result.message});
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            toast({ title: "Error", description: `Failed to delete data: ${errorMessage}`});
        } finally {
            resetDelete();
        }
    };

    const resetDelete = () => {
        setIsDeleteConfirmLoading(false);
        setDeleteConfirmOpen(false);
        setIsDeleteLoading(false);
        setSearchResults([]);
        setSelectedSearchId(null);
    };

    // PAYLOAD BUILDERS (matching original TDM UI)

    const buildQueryPayload = () => {
        const selected = fields.filter(f => f.checked).map(f => f.propertyName);
        const filters: any = {};
        for (let i = 0; i < fields.length; i++) {
            if (fields[i].value) filters[fields[i].propertyName] = fields[i].value;
        }

        const payload: any = {
            environment: environment,
            serviceType: selectedService,
            selectedColumnNames: selected,
            filters: filters,
            rowCount: queryRowCount,
        };

        // only include queryId when variants exist or when selectedQueryId is set
        if (selectedQueryId && String(selectedQueryId).trim() !== "") {
            payload.queryId = selectedQueryId;
        }

        return {
            endpoint: API_ENDPOINTS.EXECUTE,
            method: "POST",
            url: window.location.origin + API_ENDPOINTS.EXECUTE,
            payload: payload
        };
    };

    const buildCreatePayload = () => {
        const data: any[] = [];
        for (let i = 0; i < intakeFields.length; i++) {
            if (intakeFields[i].checked) {
                const o: any = {};
                o[intakeFields[i].propertyName] = intakeFields[i].value || "";
                data.push(o);
            }
        }
        return {
            endpoint: API_ENDPOINTS.CREATE,
            method: "POST",
            url: window.location.origin + API_ENDPOINTS.CREATE,
            payload: { environment, serviceType: selectedService, dataFields: data }
        };
    };

    const buildDeletePayload = () => {
            return {
                endpoint: API_ENDPOINTS.DELETE_DATA,
                method: "POST",
                url: window.location.origin + API_ENDPOINTS.DELETE_DATA,
        payload: {
          environment,
          serviceType: selectedService,
          patientNumber: patientNumber
        }
      };
    };

    // UTILITIES
    
    const copyToClipboard = (txt: string) => {
        navigator.clipboard.writeText(txt).then(() => {
            toast({ title: "Copied", description: "Text copied to clipboard." });
        });
    };

    // const downloadFile = (data: any, name: string, fmt: string) => {
    //     let content = "";
    //     if (fmt === "json") content = JSON.stringify(data, null, 2);
    //     else content = String(data); // for now just simple string
        
    //     const blob = new Blob([content], { type: "text/plain" });
    //     const url = URL.createObjectURL(blob);
    //     const a = document.createElement("a");
    //     a.href = url;
    //     a.download = name + "_" + Date.now() + "." + (fmt === "json" ? "json" : "txt");
    //     a.click();
    //     URL.revokeObjectURL(url);
    // };


const downloadFile = (data: any, name: string, fmt: string) => {
    const list = Array.isArray(data) ? data : [data];

    const toCsv = (rows: any[]) => {
        if (!rows || rows.length === 0) return "";
        const keys = Array.from(new Set(rows.flatMap((r) => Object.keys(r || {}))));
        const escapeCsv = (val: any) => {
            const str = val == null ? "" : String(val);
            if (str.includes('"') || str.includes(",") || str.includes("\n")) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };
        const header = keys.join(",");
        const body = rows.map((row) => keys.map((k) => escapeCsv(row?.[k])).join(",")).join("\n");
        return header + "\n" + body;
    };

    const toPlainText = (rows: any[]) => {
        if (!rows || rows.length === 0) return "No data.";
        return rows
            .map((row, idx) => {
                const lines = Object.entries(row || {}).map(([k, v]) => `${k}: ${v == null ? "" : String(v)}`);
                return `Row ${idx + 1}\n${lines.join("\n")}`;
            })
            .join("\n\n");
    };

    let content = "";
    let ext = "txt";
    let mime = "text/plain";

    if (fmt === "json") {
        content = JSON.stringify(data, null, 2);
        ext = "json";
        mime = "application/json";
    } else if (fmt === "csv") {
        content = toCsv(list);
        ext = "csv";
        mime = "text/csv";
    } else if (fmt === "plaintext") {
        content = toPlainText(list);
        ext = "txt";
        mime = "text/plain";
    } else {
        // table fallback -> download JSON
        content = JSON.stringify(data, null, 2);
        ext = "json";
        mime = "application/json";
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name}_${Date.now()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
};

    // DRAWING THE UI

    
    const renderJson = (data) => (
        <pre className="text-green-300 text-xs overflow-auto max-h-[500px]">
            {JSON.stringify(data, null, 2)}
        </pre>
    );

    const renderCsv = (data) => {
        if (!Array.isArray(data) || data.length === 0) {
            return <div className="text-white text-sm">No data</div>;
        }

        const headers = Object.keys(data[0]);

        const rows = data.map(row =>
            headers.map(h => `"${row[h] ?? ""}"`).join(",")
        );

        const csv = [headers.join(","), ...rows].join("\n");

        return (
            <pre className="text-yellow-200 text-xs overflow-auto max-h-[500px]">
                {csv}
            </pre>
        );
    };

    
    const renderDataTable = (data: any, color: string) => {
        if (!data || typeof data === 'string') return <div className="p-4 text-white">{String(data)}</div>;
        
        const list = Array.isArray(data) ? data : [data];
        if (list.length === 0) return <div className="p-4 text-white">No data.</div>;

        const keys = Object.keys(list[0]);
        
        return (
            <div className="mt-4 border rounded overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className={color === "blue" ? "bg-blue-700" : "bg-green-700"}>
                                {keys.map(k => (
                                    <TableHead key={k} className="text-white font-bold">{k}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {list.map((row, idx) => (
                                <TableRow key={idx} className="bg-white">
                                    {keys.map(k => (
                                        <TableCell key={k} className="text-gray-800 border-b">{String(row[k] || "")}</TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        );
    };

    const renderTable = () => renderDataTable(queryOutput, "blue");

    const renderResultByFormat = () => {
        switch (queryFormat) {
            case "json":
                return renderJson(queryOutput);
            case "csv":
                return renderCsv(queryOutput);
            case "table":
            default:
                return renderTable();
        }
    };

    const renderCreateResultByFormat = () => {
        switch (createFormat) {
            case "json":
                return renderJson(intakeOutput);
            case "csv":
                return renderCsv(intakeOutput);
            case "table":
            default:
                return renderDataTable(intakeOutput, "green");
        }
    };

    // On service change -
    // Clear cached schemas/outputs 
    useEffect(() => {
        setFields([]);
        setIntakeFields([]);
        setQueryOutput(null);
        setIntakeOutput(null);
        setPatientNumber("");
        setIntakeId("");
        setLastName("");

        // pick a default variant if one exists
        if (variants.length > 0) {
            setSelectedQueryId(variants[0].id);
        } else {
            setSelectedQueryId("");
        }
    }, [selectedService]);

    // user changed query variant -> clear old columns/filters/results
    useEffect(() => {
        setFields([]);
        setQueryOutput(null);
    }, [selectedQueryId]);




    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <Header />

            <div className="max-w-6xl mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold text-center mb-8">Service Call</h1>

                {/* Main Tabs */}
                <div className="flex justify-center gap-4 mb-10">
                    <Button 
                        onClick={() => setActiveMode("retrieve")}
                        disabled={!canRetrieve}
                        className={activeMode === "retrieve" ? "bg-blue-600" : "bg-gray-300 text-black hover:text-white"}>
                        Retrieve Data
                    </Button>
                    <Button
                        onClick={() => setActiveMode("create")}
                        disabled={!canCreate}
                        className={activeMode === "create" ? "bg-green-600" : "bg-gray-300 text-black hover:text-white"}>
                        Create Data
                    </Button>
                    <Button
                        onClick={() => setActiveMode("delete")}
                        disabled={!canDelete}
                        className={activeMode === "delete" ? "bg-red-700" : "bg-gray-300 text-black hover:text-white"}>
                        Delete Data
                    </Button>
                </div>

                {/* Settings Card */}
                <Card className="mb-6">
                    <CardHeader>
                        <h3 className="font-bold">Environment & Service</h3>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-6 items-center">
                            <div className="flex items-center gap-2">
                                <span className="text-sm">Enviroment</span>
                                <Select value={environment} onValueChange={setEnvironment}>
                                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {ENVIRONMENTS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm">Service</span>
                                <Select value={selectedService} onValueChange={setSelectedService}>
                                    <SelectTrigger className="w-64"><SelectValue placeholder="Pick a service" /></SelectTrigger>
                                    <SelectContent>
                                        {SERVICE_TYPES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            {showVariantSelect && 
                            <div className="flex items-center gap-2">
                                <span className="text-sm">Query</span>
                                <Select value={selectedQueryId} onValueChange={setSelectedQueryId} >
                                    <SelectTrigger className="w-72">
                                        <SelectValue placeholder={showVariantSelect ? "Pick a query" : "Default"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {variants.map(v => (
                                            <SelectItem key={v.id} value={v.id}>
                                                {v.label}
                                            </SelectItem>
                                        ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            }

                        </div>
                    </CardContent>
                </Card>

                {/* Retrieve Section */}
                {activeMode === "retrieve" && canRetrieve && (
                    <Card>
                        <CardHeader><h3 className="font-bold">Search and Retrieve</h3></CardHeader>
                        <CardContent>
                            <div className="text-sm text-gray-500 mb-4">
                                Click on select columns to select the columns you would like to view.
                            </div>

                            
                            
                            <Button onClick={handleFetchQuerySchema} variant="outline" className="mb-6" disabled={isQueryLoading}>
                                {isQueryLoading ? "Loading..." : "Customize Data"} <Database className="w-4 h-4 ml-2" />
                            </Button>

                            {fields.length > 0 && (
                                <div className="mb-6">
                                    <div className="flex items-center gap-2 mb-4 bg-gray-100 p-2 rounded">
                                        <Checkbox 
                                            checked={fields.every(f => f.checked)} 
                                            onCheckedChange={(val) => toggleAll(!!val)} 
                                        />
                                        <span className="text-sm font-bold">Select All</span>
                                    </div>
                                    
                                    <div className="text-xs text-gray-400 px-4 mb-2">
                                        Select columns to use in your query. Use filters to narrow results.
                                    </div>

                                    <div className="space-y-1">
                                        {fields.map((f, i) => (
                                            <DataRow 
                                                key={f.id} 
                                                field={f} 
                                                index={i} 
                                                onUpdate={updateField} 
                                                onDelete={deleteField} 
                                                onDuplicate={duplicateField} 
                                                isCreateMode={false} 
                                                isIntakeMode={false} 
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="text-sm text-gray-500 mb-4">
                                Click on search to view the data on the console
                            </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div className="p-4 border rounded bg-gray-50">
                                    <p className="text-sm font-bold mb-2">Rows to Retrieve</p>
                                    <div className="flex items-center gap-3">
                                        <Input
                                            type="number"
                                            value={queryRowCount}
                                            onChange={(e) => setQueryRowCount(parseInt(e.target.value) || 1)}
                                            className="w-24"
                                            min={1}
                                            max={1000}
                                        />
                                        <span className="text-xs text-gray-400">(Max 1000)</span>
                                    </div>
                                </div>
                                <div className="p-4 border rounded bg-gray-50">
                                    <p className="text-sm font-bold mb-2">Result Format</p>
                                    <FormatSelector value={queryFormat} onChange={setQueryFormat} />
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <Button 
                                    onClick={() => setShowPayloadDialog(true)} 
                                    variant="outline" 
                                    className="flex-1"
                                    disabled={!selectedService || fields.filter(f => f.checked).length === 0}
                                >
                                    View API Request
                                </Button>
                                <Button 
                                    onClick={handleExecute} 
                                    disabled={isQueryLoading || !selectedService || fields.filter(f => f.checked).length === 0} 
                                    className="flex-1 bg-blue-600"
                                >
                                    {isQueryLoading ? "Searching..." : "Execute Search"}
                                </Button>
                            </div>

                            {queryOutput && (
                                <div className="mt-8 bg-gray-800 rounded p-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-white font-bold">Results</h4>
                                        <Button onClick={() => downloadFile(queryOutput, "search_res", queryFormat)} size="sm" variant="secondary">
                                            <Download className="w-4 h-4 mr-2" /> Download
                                        </Button>
                                    </div>
                                    {renderResultByFormat()}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Create Section */}
                {activeMode === "create" && canCreate && (
                    <Card>
                        <CardHeader><h3 className="font-bold">Create New Data</h3></CardHeader>
                        <CardContent>
                            <div className="text-sm text-gray-500 mb-4">
                                Click on Customize Data to create customize data
                            </div>
                            
                            <Button onClick={handleFetchIntakeSchema} variant="outline" className="mb-6" disabled={isCreateLoading}>
                                {isCreateLoading ? "Loading..." : "Customize Data"} <Database className="w-4 h-4 ml-2" />
                            </Button>

                            {intakeFields.length > 0 && (
                                <div className="mb-6">
                                    <div className="text-xs text-gray-400 px-4 mb-2">
                                        Enter values for the fields you want to customize. Empty fields will use random data.
                                    </div>
                                    <div className="space-y-1">
                                        {intakeFields.map((f, i) => (
                                            <DataRow 
                                                key={f.id} 
                                                field={f} 
                                                index={i} 
                                                onUpdate={updateIntakeField} 
                                                onDelete={(id) => setIntakeFields(intakeFields.filter(x => x.id !== id))} 
                                                onDuplicate={() => {}} 
                                                isCreateMode={true} 
                                                isIntakeMode={true} 
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="text-sm text-gray-500 mb-4">
                                Click on create data to create new data in the Data Base.
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div className="p-4 border rounded bg-gray-50">
                                    <p className="text-sm font-bold mb-2">Rows to Create</p>
                                    <div className="flex items-center gap-3">
                                        <Input 
                                            type="number" 
                                            value={createRowCount} 
                                            onChange={(e) => setCreateRowCount(parseInt(e.target.value) || 1)} 
                                            className="w-24"
                                        />
                                        <span className="text-xs text-gray-400">(Max 1000)</span>
                                    </div>
                                </div>
                                <div className="p-4 border rounded bg-gray-50">
                                    <p className="text-sm font-bold mb-2">Format</p>
                                    <FormatSelector value={createFormat} onChange={setCreateFormat} />
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <Button 
                                    onClick={() => setShowCreatePayloadDialog(true)} 
                                    variant="outline" 
                                    className="flex-1"
                                    disabled={!selectedService || intakeFields.filter(f => f.checked).length === 0}
                                >
                                    View API Request
                                </Button>
                                <Button 
                                    onClick={() => setCreateConfirmOpen(true)} 
                                    disabled={isCreateLoading || !selectedService} 
                                    className="flex-1 bg-green-600 text-white"
                                >
                                    {isCreateLoading ? "Creating..." : "Create Data"}
                                </Button>
                            </div>

                            {intakeOutput && (
                                <div className="mt-8 bg-gray-800 rounded p-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-white font-bold">Generated Data</h4>
                                        <Button onClick={() => downloadFile(intakeOutput, "created_data", createFormat)} size="sm" variant="secondary">
                                            <Download className="w-4 h-4 mr-2" /> Download
                                        </Button>
                                    </div>
                                    {renderCreateResultByFormat()}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* DELETE DATA SECTION */}
                {activeMode === "delete" && canDelete && (
                    <Card className="shadow-card border-border/50 overflow-hidden">
                        <CardHeader className="pb-4">
                            <h2 className="text-lg font-semibold text-foreground">Delete Data</h2>
                        </CardHeader>

                        <CardContent>
                            <div className="text-sm text-muted-foreground">
                                Enter patient details (one field mandatory):
                            </div>

                            <div>
                                <InputField
                                    label="Patient Number:"
                                    id="patientnumber"
                                    type="number"
                                    value={patientNumber}
                                    onUpdate={setPatientNumber}
                                />
                                <InputField
                                    label="Intake ID:"
                                    id="intakeid"
                                    type="number"
                                    value={intakeId}
                                    onUpdate={setIntakeId}
                                />
                                <InputField
                                    label="Last Name:"
                                    id="lastName"
                                    type="text"
                                    value={lastName}
                                    onUpdate={setLastName}
                                />
                            </div>

                            <div className="flex gap-2 mt-4">
                                <Button
                                    onClick={() => setShowDeletePayloadDialog(true)}
                                    variant="outline"
                                    disabled={!selectedService}
                                    className="flex-1"
                                >
                                    View API Request
                                </Button>
                                <Button
                                    onClick={handleDeleteDataPopup}
                                    disabled={isDeleteLoading || !selectedService}
                                    className="flex-1 bg-blue-500 hover:bg-blue-700 text-primary-foreground py-2 rounded"
                                >
                                    {isDeleteLoading ? "Processing..." : "Search"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Dialogs for Payload inspection - Matching original TDM design */}
            <Dialog open={showPayloadDialog} onOpenChange={setShowPayloadDialog}>
                <DialogContent className="max-w-3xl max-h-96 overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>API Query Endpoint & Payload</DialogTitle>
                        <DialogDescription>
                            Full endpoint information that will be used when you click Search.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
                            <div className="font-mono text-sm">
                                <div><span className="text-green-400">Endpoint:</span> <span className="text-yellow-400">{buildQueryPayload().endpoint}</span></div>
                                <div><span className="text-green-400">Method:</span> <span className="text-yellow-400">{buildQueryPayload().method}</span></div>
                                <div><span className="text-green-400">Full URL:</span> <span className="text-yellow-400 break-all">{buildQueryPayload().url}</span></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-sm font-medium">Request Payload:</p>
                                <Button
                                    onClick={() => copyToClipboard(JSON.stringify(buildQueryPayload().payload, null, 2))}
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center gap-2 h-8"
                                >
                                    <Copy className="h-4 w-4" />
                                    Copy
                                </Button>
                            </div>
                            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                                <pre>{JSON.stringify(buildQueryPayload().payload, null, 2)}</pre>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showCreatePayloadDialog} onOpenChange={setShowCreatePayloadDialog}>
                <DialogContent className="max-w-3xl max-h-96 overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>API Create Endpoint & Payload</DialogTitle>
                        <DialogDescription>
                            Full endpoint information that will be used when you click Create.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
                            <div className="font-mono text-sm">
                                <div><span className="text-green-400">Endpoint:</span> <span className="text-yellow-400">{buildCreatePayload().endpoint}</span></div>
                                <div><span className="text-green-400">Method:</span> <span className="text-yellow-400">{buildCreatePayload().method}</span></div>
                                <div><span className="text-green-400">Full URL:</span> <span className="text-yellow-400 break-all">{buildCreatePayload().url}</span></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-sm font-medium">Request Payload:</p>
                                <Button
                                    onClick={() => copyToClipboard(JSON.stringify(buildCreatePayload().payload, null, 2))}
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center gap-2 h-8"
                                >
                                    <Copy className="h-4 w-4" />
                                    Copy
                                </Button>
                            </div>
                            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                                <pre>{JSON.stringify(buildCreatePayload().payload, null, 2)}</pre>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Dialog for Delete Payload */}
            <Dialog open={showDeletePayloadDialog} onOpenChange={setShowDeletePayloadDialog}>
                <DialogContent className="max-w-3xl max-h-200 overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>API Delete Endpoint & Payload</DialogTitle>
                        <DialogDescription>
                            Full endpoint information that will be used when you click Delete.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
                            <div className="font-mono text-sm">
                                <div><span className="text-green-400">Endpoint:</span> <span className="text-yellow-400">{buildDeletePayload().endpoint}</span></div>
                                <div><span className="text-green-400">Method:</span> <span className="text-yellow-400">{buildDeletePayload().method}</span></div>
                                <div><span className="text-green-400">Full URL:</span> <span className="text-yellow-400">{buildDeletePayload().url}</span></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-sm font-medium">Request Payload:</p>
                                <Button
                                    onClick={() => copyToClipboard(JSON.stringify(buildDeletePayload().payload, null, 2))}
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center gap-2 h-8">
                                    <Copy className="h-4 w-4" />
                                    Copy
                                </Button>
                            </div>
                            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                                <pre>{JSON.stringify(buildDeletePayload().payload, null, 2)}</pre>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* AlertDialog for "Create Data" confirmation */}
            <AlertDialog open={isCreateConfirmOpen} onOpenChange={setCreateConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will create {createRowCount} new patient records in {environment}.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCreateIntake} className="bg-green-600">Yes, Create</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* AlertDialog for "Delete Data" confirmation */}
            <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Data</AlertDialogTitle>
                        <AlertDialogDescription>
                            {`Select a patient from below to delete in the '${environment}' environment.`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {isDeleteConfirmLoading ? ( <div className="text-muted-foreground">Loading data...</div>) : deleteSearchResults.length === 0 ? ( <div>No results found</div>) :
                        (
                        <div className="border rounded max-h-[60vh] overflow-y-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/30 sticky top-0">
                                    <tr>
                                        <th className="text-left p-2"></th>
                                        <th className="text-left p-2">Patient Number</th>
                                        <th className="text-left p-2">Intake ID</th>
                                        <th className="text-left p-2">Last Name</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {deleteSearchResults.map(row => (
                                        <tr className="border-t">
                                            <td className="p-2">
                                                <input
                                                    type="radio"
                                                    name="deleteSelect"
                                                    checked={selectedResultId === row.id}
                                                    onChange={() => setSelectedSearchId(row.id)}
                                                />
                                            </td>
                                            <td className="p-2">{row.PATIENTNUMBER || "-"}</td>
                                            <td className="p-2">{row.INTAKEID || "-"}</td>
                                            <td className="p-2">{row.LASTNAME || "-"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={resetDelete}>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={handleDeleteData} disabled={isDeleteConfirmLoading || !selectedResult}>{isDeleteConfirmLoading ? "Loading Data..." : "Delete Patient"}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default ServiceCall;
