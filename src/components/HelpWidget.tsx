import { useState } from "react";
import { HelpCircle, X, BookOpen, Database, Server, Settings2, FileJson, ShieldAlert, CheckCircle2, ListChecks } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

/* ── data ────────────────────────────────────────────────────── */

const prerequisites = [
  "Frontend app is running and reachable in browser.",
  "Backend server is running with correct configuration.",
  "You selected the intended environment before calling any action.",
  "You verified required fields before executing requests.",
];

const quickStart = [
  "Open Generator when you need sample test data quickly.",
  "Open API Calls when you need request/response validation.",
  "Open Services when you need retrieve or create operations from service schemas.",
  "Always review payload in View API Request before execution.",
  "Select final output format and copy/download results.",
];

const generatorSteps = [
  "Go to Generator page and choose the environment.",
  "Enter table name and click Fetch DB Columns.",
  "Review columns and adjust property names/types if needed.",
  "Provide custom values for fields where defaults are not enough.",
  "Set row count for required number of test records.",
  "Pick output format (Table, JSON, CSV, Plain Text).",
  "Click Generate and verify output before reusing data.",
];

const apiStandardSteps = [
  "Open API Calls page and choose target environment.",
  "Use Standard Data mode for form-based request entry.",
  "Fill required business fields first, then optional fields.",
  "Submit the request and validate response status/body.",
  "Copy the response payload when needed for downstream tests.",
];

const apiCustomSteps = [
  "Switch to Custom JSON mode in API Calls page.",
  "Paste a valid JSON payload with required keys.",
  "Check the payload shape against expected API schema.",
  "Submit request and inspect errors/success messages.",
  "Refine payload and retry if business validations fail.",
];

const serviceRetrieveSteps = [
  { title: "Choose environment and service operation", details: "Open Services page, select the environment, and choose Retrieve Data so the screen is in search mode." },
  { title: "Load the service schema", details: "Click the schema load action to fetch available fields. Wait until all selectable columns are visible." },
  { title: "Pick return columns", details: "Select only the fields you need in the result. Fewer columns make output easier to inspect and reuse." },
  { title: "Add filters carefully", details: "Set filter values for key fields (such as IDs, status, or date criteria) to avoid broad or empty results." },
  { title: "Preview API payload", details: "Use View API Request to confirm selected columns and filters before executing." },
  { title: "Execute and validate results", details: "Run the retrieve action, then verify row count and data correctness in the output pane." },
  { title: "Switch output format", details: "Change to JSON/CSV/Plain Text if needed, then copy or download for downstream testing." },
];

const serviceCreateSteps = [
  { title: "Choose Create Data mode", details: "In Services page, switch to Create Data to open intake schema and value entry options." },
  { title: "Load intake schema", details: "Fetch schema so all required and optional fields are shown before entering values." },
  { title: "Provide field values", details: "Fill required fields first, then optional fields. Keep values realistic for the target test case." },
  { title: "Set row count", details: "Choose how many rows to generate when bulk intake creation is needed." },
  { title: "Review API request", details: "Use View API Request to verify payload structure and values before submitting." },
  { title: "Create and verify", details: "Submit create action, validate response IDs/status, and confirm data appears in expected format." },
  { title: "Export for reuse", details: "Copy or download generated output so it can be reused in API or integration tests." },
];

const serviceDeleteSteps = [
  { title: "Choose Delete Data mode", details: "In Services page, switch to Delete Data to open the delete search and confirmation workflow." },
  { title: "Select the environment", details: "Pick the target environment (Q1–Q5) where the record you want to delete exists." },
  { title: "Search for the record", details: "Enter the required identifier (such as patient ID or case number) and run the search to find matching records." },
  { title: "Review search results", details: "Inspect the returned records carefully to make sure you are selecting the correct one for deletion." },
  { title: "Select the target record", details: "Click on the specific record you want to delete from the search results list." },
  { title: "Confirm deletion", details: "Review the confirmation dialog showing record details, then confirm to execute the delete operation." },
  { title: "Verify deletion", details: "Check the response status to confirm the record was successfully deleted. Re-search if needed to verify it no longer appears." },
];

const outputFormatGuide = [
  "Table: best for visual review in the app.",
  "JSON: best for API automation and payload chaining.",
  "CSV: best for spreadsheet checks and sharing with QA/analysts.",
  "Plain Text: best for quick copy/paste into notes and tickets.",
];

const commonIssues = [
  { title: "Schema is not loading", fix: "Confirm environment, backend availability, and endpoint access. Retry after refreshing page." },
  { title: "Retrieve Data returns empty output", fix: "Relax filters, verify selected columns, and confirm records exist for the filter values." },
  { title: "Create Data request fails", fix: "Review payload in View API Request and validate required fields, data types, and value formats." },
  { title: "Unexpected API error", fix: "Check backend logs, endpoint configuration, and request body shape for missing or invalid keys." },
];

/* ── component ───────────────────────────────────────────────── */

function HelpWidget() {
  const [open, setOpen] = useState(false);
  const [openSections, setOpenSections] = useState<string[]>([]);

  return (
    <>
      {/* floating button - top right corner */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 text-white text-sm font-medium shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl hover:scale-105 active:scale-95"
          aria-label="Open help"
        >
          <HelpCircle className="h-4 w-4" />
          Need Help
        </button>
      )}

      {/* slide-out panel */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
          <SheetHeader className="px-5 pt-5 pb-3 border-b bg-slate-50 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-blue-100 p-1.5">
                  <BookOpen className="h-4 w-4 text-blue-700" />
                </div>
                <SheetTitle className="text-lg font-bold text-slate-900">Help Center</SheetTitle>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-1">Step-by-step guides for every feature</p>
          </SheetHeader>

          <ScrollArea className="flex-1 px-5 py-4">
            {/* quick nav badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                { label: "Overview", value: "overview" },
                { label: "Generator", value: "generator" },
                { label: "API Calls", value: "api-calls" },
                { label: "Services", value: "services" },
                { label: "Formats", value: "formats" },
                { label: "Troubleshooting", value: "troubleshooting" },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() =>
                    setOpenSections((prev) =>
                      prev.includes(item.value) ? prev : [...prev, item.value]
                    )
                  }
                  className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* accordion sections */}
            <Accordion type="multiple" className="w-full" value={openSections} onValueChange={setOpenSections}>
              {/* Overview */}
              <AccordionItem value="overview">
                <AccordionTrigger className="text-sm">
                  <span className="flex items-center gap-2 text-left">
                    <BookOpen className="h-4 w-4 text-slate-500" /> Overview &amp; Quick Start
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-slate-900">Before you begin</p>
                    {prerequisites.map((item, i) => (
                      <div key={i} className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-700">
                        {i + 1}. {item}
                      </div>
                    ))}
                    <p className="text-xs font-semibold text-slate-900 pt-2">Quick start path</p>
                    {quickStart.map((item, i) => (
                      <div key={i} className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-700">
                        Step {i + 1}: {item}
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Generator */}
              <AccordionItem value="generator">
                <AccordionTrigger className="text-sm">
                  <span className="flex items-center gap-2 text-left">
                    <Database className="h-4 w-4 text-slate-500" /> Generator Page
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    {generatorSteps.map((step, i) => (
                      <div key={i} className="rounded-lg border border-slate-200 p-2.5 text-xs text-slate-700">
                        Step {i + 1}: {step}
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* API Calls */}
              <AccordionItem value="api-calls">
                <AccordionTrigger className="text-sm">
                  <span className="flex items-center gap-2 text-left">
                    <Server className="h-4 w-4 text-slate-500" /> API Calls
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-slate-900">Standard Data mode</p>
                    {apiStandardSteps.map((step, i) => (
                      <div key={i} className="rounded-lg border border-slate-200 p-2.5 text-xs text-slate-700">
                        Step {i + 1}: {step}
                      </div>
                    ))}
                    <p className="text-xs font-semibold text-slate-900 pt-2">Custom JSON mode</p>
                    {apiCustomSteps.map((step, i) => (
                      <div key={i} className="rounded-lg border border-slate-200 p-2.5 text-xs text-slate-700">
                        Step {i + 1}: {step}
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Services */}
              <AccordionItem value="services">
                <AccordionTrigger className="text-sm">
                  <span className="flex items-center gap-2 text-left">
                    <Settings2 className="h-4 w-4 text-slate-500" /> Services Page
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-slate-900">Retrieve Data workflow</p>
                    {serviceRetrieveSteps.map((step, i) => (
                      <div key={i} className="rounded-lg border border-slate-200 p-2.5 text-xs text-slate-700">
                        <span className="font-semibold text-slate-900">Step {i + 1}: {step.title}</span>
                        <p className="mt-1">{step.details}</p>
                      </div>
                    ))}
                    <p className="text-xs font-semibold text-slate-900 pt-2">Create Data workflow</p>
                    {serviceCreateSteps.map((step, i) => (
                      <div key={i} className="rounded-lg border border-slate-200 p-2.5 text-xs text-slate-700">
                        <span className="font-semibold text-slate-900">Step {i + 1}: {step.title}</span>
                        <p className="mt-1">{step.details}</p>
                      </div>
                    ))}
                    <p className="text-xs font-semibold text-slate-900 pt-2">Delete Data workflow</p>
                    {serviceDeleteSteps.map((step, i) => (
                      <div key={i} className="rounded-lg border border-slate-200 p-2.5 text-xs text-slate-700">
                        <span className="font-semibold text-slate-900">Step {i + 1}: {step.title}</span>
                        <p className="mt-1">{step.details}</p>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Output Formats */}
              <AccordionItem value="formats">
                <AccordionTrigger className="text-sm">
                  <span className="flex items-center gap-2 text-left">
                    <FileJson className="h-4 w-4 text-slate-500" /> Output Formats
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    {outputFormatGuide.map((item, i) => (
                      <div key={i} className="rounded-lg border border-slate-200 p-2.5 text-xs text-slate-700">
                        {i + 1}. {item}
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Troubleshooting */}
              <AccordionItem value="troubleshooting">
                <AccordionTrigger className="text-sm">
                  <span className="flex items-center gap-2 text-left">
                    <ShieldAlert className="h-4 w-4 text-slate-500" /> Troubleshooting &amp; FAQ
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    {commonIssues.map((issue, i) => (
                      <div key={i} className="rounded-lg border border-slate-200 p-2.5 text-xs text-slate-700">
                        <p className="font-semibold text-slate-900">{i + 1}. {issue.title}</p>
                        <p className="mt-1">Fix: {issue.fix}</p>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* checklist at bottom */}
            <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="flex items-center gap-2 text-xs font-semibold text-emerald-900">
                <CheckCircle2 className="h-3.5 w-3.5" /> Services Execution Checklist
              </p>
              <div className="mt-2 space-y-1.5 text-xs text-emerald-900">
                {[
                  "Environment selected correctly",
                  "Service operation chosen (Retrieve, Create, or Delete)",
                  "Schema loaded and required fields validated",
                  "Payload reviewed in View API Request",
                  "For Delete: search results reviewed and correct record selected",
                  "Output checked and copied/exported",
                ].map((item, i) => (
                  <div key={i} className="rounded-lg border border-emerald-200 bg-white p-2">
                    {i + 1}. {item}
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
}

export default HelpWidget;
