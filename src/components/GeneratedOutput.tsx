import { useState } from "react";
import { Copy, Check, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

// this component shows the code block after we generate data
function GeneratedOutput(props: any) {
  const data = props.data;
  const format = props.format;
  
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  // copy the text to clipboard
  async function handleCopy() {
    try {
        await navigator.clipboard.writeText(data);
        setIsCopied(true);
        toast({ title: "Copied!" });
        
        // reset the button after 2 seconds
        setTimeout(function() {
            setIsCopied(false);
        }, 2000);
    } catch (err) {
        console.error("Failed to copy", err);
    }
  }

  // trigger a file download
  function handleDownload() {
    // figure out the file extension
    let ext = "txt";
    if (format === "json") ext = "json";
    else if (format === "xml") ext = "xml";
    else if (format === "csv") ext = "csv";
    else if (format === "sql") ext = "sql";
    else if (format === "python") ext = "py";
    else if (format === "javascript") ext = "js";
    else if (format === "php") ext = "php";

    const blob = new Blob([data], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "test_data_" + Date.now() + "." + ext;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({ title: "File downloaded" });
  }

  return (
    <Card className="shadow-md border border-gray-200">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg font-bold">Generated Output</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {isCopied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
            {isCopied ? "Done" : "Copy All"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download File
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-100 rounded-lg p-4 overflow-auto max-h-[500px]">
            <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap">
                {data}
            </pre>
        </div>
      </CardContent>
    </Card>
  );
}

export default GeneratedOutput;
