import { useState } from "react";
import Header from "@/components/Header";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, CheckCircle2, Database, FileJson, ListChecks, Server, Settings2, ShieldAlert } from "lucide-react";

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
  {
    title: "Choose environment and service operation",
    details:
      "Open Services page, select the environment, and choose Retrieve Data so the screen is in search mode.",
  },
  {
    title: "Load the service schema",
    details:
      "Click the schema load action to fetch available fields. Wait until all selectable columns are visible.",
  },
  {
    title: "Pick return columns",
    details:
      "Select only the fields you need in the result. Fewer columns make output easier to inspect and reuse.",
  },
  {
    title: "Add filters carefully",
    details:
      "Set filter values for key fields (such as IDs, status, or date criteria) to avoid broad or empty results.",
  },
  {
    title: "Preview API payload",
    details:
      "Use View API Request to confirm selected columns and filters before executing.",
  },
  {
    title: "Execute and validate results",
    details:
      "Run the retrieve action, then verify row count and data correctness in the output pane.",
  },
  {
    title: "Switch output format",
    details:
      "Change to JSON/CSV/Plain Text if needed, then copy or download for downstream testing.",
  },
];

const serviceCreateSteps = [
  {
    title: "Choose Create Data mode",
    details:
      "In Services page, switch to Create Data to open intake schema and value entry options.",
  },
  {
    title: "Load intake schema",
    details:
      "Fetch schema so all required and optional fields are shown before entering values.",
  },
  {
    title: "Provide field values",
    details:
      "Fill required fields first, then optional fields. Keep values realistic for the target test case.",
  },
  {
    title: "Set row count",
    details:
      "Choose how many rows to generate when bulk intake creation is needed.",
  },
  {
    title: "Review API request",
    details:
      "Use View API Request to verify payload structure and values before submitting.",
  },
  {
    title: "Create and verify",
    details:
      "Submit create action, validate response IDs/status, and confirm data appears in expected format.",
  },
  {
    title: "Export for reuse",
    details:
      "Copy or download generated output so it can be reused in API or integration tests.",
  },
];

const outputFormatGuide = [
  "Table: best for visual review in the app.",
  "JSON: best for API automation and payload chaining.",
  "CSV: best for spreadsheet checks and sharing with QA/analysts.",
  "Plain Text: best for quick copy/paste into notes and tickets.",
];

const commonIssues = [
  {
    title: "Schema is not loading",
    fix: "Confirm environment, backend availability, and endpoint access. Retry after refreshing page.",
  },
  {
    title: "Retrieve Data returns empty output",
    fix: "Relax filters, verify selected columns, and confirm records exist for the filter values.",
  },
  {
    title: "Create Data request fails",
    fix: "Review payload in View API Request and validate required fields, data types, and value formats.",
  },
  {
    title: "Unexpected API error",
    fix: "Check backend logs, endpoint configuration, and request body shape for missing or invalid keys.",
  },
];

function UserManual() {
  const [openSections, setOpenSections] = useState<string[]>([]);

  const goToSection = (targetId: string, accordionValue?: string) => {
    if (accordionValue) {
      setOpenSections((prev) => (prev.includes(accordionValue) ? prev : [...prev, accordionValue]));
    }

    window.setTimeout(() => {
      const target = document.getElementById(targetId);
      if (!target) return;

      target.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.replaceState(null, "", `#${targetId}`);
    }, accordionValue ? 140 : 0);
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm md:p-8">
          <Badge className="mb-3 bg-slate-900 text-white">User Guide</Badge>
          <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">User Manual</h1>
          <p className="mt-3 max-w-4xl text-slate-600">
            This manual is organized into collapsible sections so users can focus on one workflow at a time and follow
            clear step-by-step instructions.
          </p>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="h-fit rounded-2xl border border-slate-300 bg-white p-4 shadow-sm lg:sticky lg:top-20">
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
              <BookOpen className="h-4 w-4" /> On This Page
            </p>
            <div className="space-y-2 text-sm">
              <button
                type="button"
                onClick={() => goToSection("manual-sections")}
                className="block w-full rounded-md px-3 py-2 text-left text-slate-700 hover:bg-slate-100"
              >
                Collapsible Sections
              </button>
              <button
                type="button"
                onClick={() => goToSection("services-section", "services")}
                className="block w-full rounded-md px-3 py-2 text-left text-slate-700 hover:bg-slate-100"
              >
                Services Guide
              </button>
              <button
                type="button"
                onClick={() => goToSection("services-checklist")}
                className="block w-full rounded-md px-3 py-2 text-left text-slate-700 hover:bg-slate-100"
              >
                Services Checklist
              </button>
              <button
                type="button"
                onClick={() => goToSection("troubleshooting-section", "troubleshooting")}
                className="block w-full rounded-md px-3 py-2 text-left text-slate-700 hover:bg-slate-100"
              >
                Troubleshooting
              </button>
            </div>
          </aside>

          <section className="space-y-6">
            <Card id="manual-sections" className="scroll-mt-24 border-slate-300 bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="mb-3 flex items-center gap-3">
                  <div className="rounded-lg bg-emerald-100 p-2">
                    <ListChecks className="h-5 w-5 text-emerald-700" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Collapsible User Guide Sections</h2>
                </div>

                <Accordion type="multiple" className="w-full" value={openSections} onValueChange={setOpenSections}>
                  <AccordionItem id="overview-section" value="overview" className="scroll-mt-24">
                    <AccordionTrigger>
                      <span className="flex items-center gap-2 text-left">
                        <BookOpen className="h-4 w-4 text-slate-600" /> Overview and Quick Start
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Before you begin</p>
                          <div className="mt-2 space-y-2">
                            {prerequisites.map((item, index) => (
                              <div key={item} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                                {index + 1}. {item}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Quick start path</p>
                          <div className="mt-2 space-y-2">
                            {quickStart.map((item, index) => (
                              <div key={item} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                                Step {index + 1}: {item}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem id="generator-section" value="generator" className="scroll-mt-24">
                    <AccordionTrigger>
                      <span className="flex items-center gap-2 text-left">
                        <Database className="h-4 w-4 text-slate-600" /> Generator Page Detailed Steps
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        {generatorSteps.map((step, index) => (
                          <div key={step} className="rounded-lg border border-slate-200 p-3 text-sm text-slate-700">
                            Step {index + 1}: {step}
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem id="api-calls-section" value="api-calls" className="scroll-mt-24">
                    <AccordionTrigger>
                      <span className="flex items-center gap-2 text-left">
                        <Server className="h-4 w-4 text-slate-600" /> API Calls Detailed Steps
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        <div>
                          <p className="mb-2 text-sm font-semibold text-slate-900">Standard Data mode</p>
                          <div className="space-y-2">
                            {apiStandardSteps.map((step, index) => (
                              <div key={step} className="rounded-lg border border-slate-200 p-3 text-sm text-slate-700">
                                Step {index + 1}: {step}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="mb-2 text-sm font-semibold text-slate-900">Custom JSON mode</p>
                          <div className="space-y-2">
                            {apiCustomSteps.map((step, index) => (
                              <div key={step} className="rounded-lg border border-slate-200 p-3 text-sm text-slate-700">
                                Step {index + 1}: {step}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem id="services-section" value="services" className="scroll-mt-24">
                    <AccordionTrigger>
                      <span className="flex items-center gap-2 text-left">
                        <Settings2 className="h-4 w-4 text-slate-600" /> Services Page Complete Guide
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        <div>
                          <p className="mb-2 text-sm font-semibold text-slate-900">Retrieve Data workflow</p>
                          <div className="space-y-2">
                            {serviceRetrieveSteps.map((step, index) => (
                              <div key={step.title} className="rounded-lg border border-slate-200 p-3 text-sm text-slate-700">
                                <span className="font-semibold text-slate-900">Step {index + 1}: {step.title}</span>
                                <p className="mt-1">{step.details}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="mb-2 text-sm font-semibold text-slate-900">Create Data workflow</p>
                          <div className="space-y-2">
                            {serviceCreateSteps.map((step, index) => (
                              <div key={step.title} className="rounded-lg border border-slate-200 p-3 text-sm text-slate-700">
                                <span className="font-semibold text-slate-900">Step {index + 1}: {step.title}</span>
                                <p className="mt-1">{step.details}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem id="formats-section" value="formats" className="scroll-mt-24">
                    <AccordionTrigger>
                      <span className="flex items-center gap-2 text-left">
                        <FileJson className="h-4 w-4 text-slate-600" /> Output Formats Guide
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        {outputFormatGuide.map((item, index) => (
                          <div key={item} className="rounded-lg border border-slate-200 p-3 text-sm text-slate-700">
                            {index + 1}. {item}
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem id="troubleshooting-section" value="troubleshooting" className="scroll-mt-24">
                    <AccordionTrigger>
                      <span className="flex items-center gap-2 text-left">
                        <ShieldAlert className="h-4 w-4 text-slate-600" /> Troubleshooting and FAQ
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        {commonIssues.map((issue, index) => (
                          <div key={issue.title} className="rounded-lg border border-slate-200 p-3 text-sm text-slate-700">
                            <p className="font-semibold text-slate-900">{index + 1}. {issue.title}</p>
                            <p className="mt-1">Fix: {issue.fix}</p>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            <Card id="services-checklist" className="scroll-mt-24 border-emerald-200 bg-emerald-50 shadow-sm">
              <CardContent className="p-6">
                <p className="flex items-center gap-2 font-semibold text-emerald-900">
                  <CheckCircle2 className="h-4 w-4" /> Services Execution Checklist
                </p>
                <div className="mt-3 space-y-2 text-sm text-emerald-900">
                  <div className="rounded-lg border border-emerald-200 bg-white p-3">1. Environment selected correctly</div>
                  <div className="rounded-lg border border-emerald-200 bg-white p-3">2. Service operation chosen (Retrieve or Create)</div>
                  <div className="rounded-lg border border-emerald-200 bg-white p-3">3. Schema loaded and required fields validated</div>
                  <div className="rounded-lg border border-emerald-200 bg-white p-3">4. Payload reviewed in View API Request</div>
                  <div className="rounded-lg border border-emerald-200 bg-white p-3">5. Output checked and copied/exported</div>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    </div>
  );
}

export default UserManual;