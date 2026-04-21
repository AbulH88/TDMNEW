import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import Header from "@/components/Header";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { API_ENDPOINTS } from "@/constants";

// page for making api calls to different systems
function ApiCall() {
  const { hasPermission } = useAuth();
  // state for the form inputs
  const [requestType, setRequestType] = useState("initial");
  const [dataType, setDataType] = useState("static");
  const [selectedEnvironment, setSelectedEnvironment] = useState("Q1");

  // fields for the static data form
  const [referralRequestId, setReferralRequestId] = useState("");
  const [earliestAuthStartDate, setEarliestAuthStartDate] = useState("");
  const [requestedStartDate, setRequestedStartDate] = useState("");
  const [staticApiResponse, setStaticApiResponse] = useState("");
  const [showStaticJsonOutput, setShowStaticJsonOutput] = useState(true);

  // custom request state
  const [requestBody, setRequestBody] = useState("");
  const [apiResponse, setApiResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStatic, setIsLoadingStatic] = useState(false);

  // run a predefined api call with some manual fields
  async function handleStaticApiCall() {
    setIsLoadingStatic(true);
    setStaticApiResponse(""); 

    // giant template for the initial request
    const template = {
      "caseDetails": {
        "submitterInfo": {
          "firstName": "vijayapandian",
          "lastName": "palani",
          "email": "XYZ@mailslurp.net",
          "userType": "PROVIDER"
        },
        "referralRequestId": referralRequestId || "878e0307-a112-49ad-879c-f3a910x95421",
        "member": {
          "firstName": "NIKI",
          "lastName": "HUDDS",
          "subscriberId": "YKZ3HZN88339830",
          "dob": "1965-01-08",
          "earliestAuthStartDate": earliestAuthStartDate || "2026-02-01"
        },
        "caseServiceLine": [
          {
            "serviceCategory": "INSTAY",
            "serviceCode": "4282",
            "requestedStartDate": requestedStartDate || "2026-02-01",
            "templates": [
              {
                "templateId": "2354",
                "questionAndAnswer": [
                  {
                    "questionSourceSystemId": "25692",
                    "answer": [{ "answer": requestedStartDate || "2024-02-26" }]
                  }
                ]
              }
            ]
          }
        ]
      }
    };

    try {
      const response = await fetch(API_ENDPOINTS.EXTERNAL_CALL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiType: "initial",
          environment: selectedEnvironment,
          requestBody: template,
        }),
      });

      const data = await response.json();
      setStaticApiResponse(JSON.stringify(data, null, 2));
    } catch (error: any) {
      setStaticApiResponse("Error: " + error.message);
    }
    setIsLoadingStatic(false);
  }

  // run a completely custom api call
  async function handleApiCall() {
    setIsLoading(true);
    setApiResponse("");

    try {
        let jsonBody = {};
        try {
            jsonBody = JSON.parse(requestBody || "{}");
        } catch (e) {
            alert("Invalid JSON in request body");
            setIsLoading(false);
            return;
        }

      const response = await fetch(API_ENDPOINTS.EXTERNAL_CALL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiType: requestType,
          environment: selectedEnvironment,
          requestBody: jsonBody,
        }),
      });

      const data = await response.json();
      setApiResponse(JSON.stringify(data, null, 2));
    } catch (error: any) {
      setApiResponse("Error: " + error.message);
    }
    setIsLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-6xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold text-center mb-8">API Call Generator</h1>
        
        <div className="flex justify-center mb-10">
          <Select value={requestType} onValueChange={setRequestType}>
            <SelectTrigger className="w-[300px] bg-white">
              <SelectValue placeholder="Select Request Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="initial">Initial Request</SelectItem>
              <SelectItem value="cos">COS</SelectItem>
              <SelectItem value="edit">Edit Request</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-6">
          {requestType === "initial" && (
            <div className="space-y-6">
              <div className="flex justify-center gap-8">
                <div className="flex items-center space-x-2">
                  <RadioGroup value={dataType} onValueChange={setDataType} className="flex gap-4">
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="static" id="r1" />
                        <Label htmlFor="r1">Standard Data</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="custom" id="r2" />
                        <Label htmlFor="r2">Custom JSON</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              {dataType === "static" && (
                <div className="bg-white p-6 border rounded shadow-sm">
                  <h3 className="text-lg font-bold mb-6">Standard Fields</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="space-y-1">
                      <Label>Referral Request ID</Label>
                      <Input
                        value={referralRequestId}
                        onChange={(e) => setReferralRequestId(e.target.value)}
                        placeholder="ID..."
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <Label>Auth Start Date</Label>
                      <Input
                        type="date"
                        value={earliestAuthStartDate}
                        onChange={(e) => setEarliestAuthStartDate(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <Label>Requested Start Date</Label>
                      <Input
                        type="date"
                        value={requestedStartDate}
                        onChange={(e) => setRequestedStartDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleStaticApiCall}
                    disabled={isLoadingStatic || !hasPermission('create')}
                    className="w-full bg-blue-600 mb-8"
                  >
                    {isLoadingStatic ? "Processing..." : "Submit Static Request"}
                  </Button>

                  <div className="border-t pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold">Output Response</h4>
                      <Button variant="ghost" size="sm" onClick={() => setShowStaticJsonOutput(!showStaticJsonOutput)}>
                        {showStaticJsonOutput ? "Hide" : "Show"}
                      </Button>
                    </div>
                    
                    {showStaticJsonOutput && (
                      <div className="relative">
                        <Textarea
                          value={staticApiResponse}
                          readOnly
                          rows={15}
                          className="bg-gray-100 font-mono text-xs"
                        />
                        {staticApiResponse && (
                          <Button
                            size="sm"
                            onClick={() => navigator.clipboard.writeText(staticApiResponse)}
                            className="absolute top-2 right-2"
                          >
                            Copy
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {dataType === "custom" && (
                <div className="bg-white p-6 border rounded shadow-sm">
                  <h3 className="text-lg font-bold mb-4">Custom API Request</h3>
                  
                  <div className="mb-6">
                    <Label>Target Environment</Label>
                    <Select value={selectedEnvironment} onValueChange={setSelectedEnvironment}>
                        <SelectTrigger className="w-48 mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Q1">Q1</SelectItem>
                          <SelectItem value="Q2">Q2</SelectItem>
                          <SelectItem value="Q3">Q3</SelectItem>
                          <SelectItem value="Q4">Q4</SelectItem>
                          <SelectItem value="Q5">Q5</SelectItem>
                        </SelectContent>
                    </Select>
                  </div>

                  <Label>Request Body (Raw JSON)</Label>
                  <Textarea
                    value={requestBody}
                    onChange={(e) => setRequestBody(e.target.value)}
                    rows={12}
                    placeholder='{ "key": "value" }'
                    className="font-mono mt-1 mb-6"
                  />
                  
                  <Button
                    onClick={handleApiCall}
                    disabled={isLoading || !hasPermission('create')}
                    className="w-full bg-blue-600 mb-8"
                  >
                    {isLoading ? "Calling API..." : "Send Custom Request"}
                  </Button>

                  <h4 className="font-bold mb-2">Response</h4>
                  <Textarea
                    value={apiResponse}
                    readOnly
                    rows={12}
                    className="bg-gray-100 font-mono text-xs"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default ApiCall;
