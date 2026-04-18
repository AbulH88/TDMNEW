import { useEffect, useMemo, useState, useRef } from "react";
import { Play, RefreshCcw, CheckCircle2, XCircle, FileText, ChevronDown, ChevronRight } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/services/apiService";

type Filter = "all" | "passed" | "failed";

type TestCase = {
    name: string;
    status: "pass" | "fail";
    message: string;
    time?: number;
};

type TestSuite = {
    name: string;
    time: number;
    tests: number;
    failures: number;
    errors: number;
    skipped: number;
    testcases: TestCase[];
};

export type ResultsPayload = {
    summary: { tests: number; failures: number; errors: number; skipped: number; time: number };
    suites: TestSuite[];
};


export default function TestsPage() {
    const { toast } = useToast();

    const [data, setData] = useState<ResultsPayload | null>(null);
    const [loading, setLoading] = useState(false);
    const [running, setRunning] = useState(false);
    const [output, setOutput] = useState("");

    const [filter, setFilter] = useState<Filter>("all");
    const [expandAll, setExpandAll] = useState(false);
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    const outputRef = useRef<HTMLPreElement | null>(null);
    const topRef = useRef<HTMLDivElement | null>(null);

    // Gets data.suites and
    // keeps only test cases that match filter type (pass/fail)
    // removes any suites with 0 resulting test cases
    const filteredSuites: TestSuite[] = useMemo(() => {
        if (!data) return [];
        if (filter === "all") return data.suites;
        const wantStatus = filter === "passed" ? "pass" : "fail";
        return data.suites.map(suite => ({
            ...suite,
            testcases: suite.testcases.filter(tc => tc.status === wantStatus),
        }))
            .filter(suite => suite.testcases.length > 0);
    }, [data, filter]);

    const loadResults = async () => {
        setLoading(true);
        try {
            const res = await apiService.getTestResults();
            setData(res);
        } catch (e: any) {
            toast({
                title: "Load Failed",
                description: e?.message || "Could not load test results",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const runTests = async () => {
        setRunning(true);
        setData(null);
        setOutput("Running tests...\n");
        scrollToOutput();

        try {
            const { success, output } = await apiService.runTests();
            setOutput(prev => prev + output);
            toast({
                title: success ? "Tests Complete" : "Tests Failed",
                description: success ? "Test run finished." : "See output below for details.",
                variant: success ? "default" : "destructive",
            });
            await loadResults();
        } catch (e: any) {
            setOutput("Error running tests:\n" + (e?.message || "Unknown error"));
            toast({ title: "Run Failed", description: "Could not execute npm test.", variant: "destructive" });
        } finally {
            setRunning(false);
        }
    };

    const scrollToTop = () => {
        if (topRef.current) {
            topRef.current.scrollIntoView({ behavior: "smooth" });
        }
    };

    const scrollToOutput = () => {
        if (outputRef.current) {
            outputRef.current.scrollIntoView({ behavior: "smooth" });
        }
    };

    // Loads results on initial render
    useEffect(() => {
        loadResults();
    }, []);

    // Runs any time 'filter' changes
    useEffect(() => {
        setExpanded(new Set());
        setExpandAll(false);
    }, [filter]);

    // Summary stats for all suites
    const summary = useMemo(() => {
        if (!data) return { total: 0, passed: 0, failed: 0, time: 0 };
        const total = data.summary.tests;
        const failed = data.summary.failures + data.summary.errors;
        const passed = total - failed - data.summary.skipped;
        const time = data.summary.time;
        return { total, passed, failed, time };
    }, [data]);

    // For toggling one error row
    const toggleRow = (key: string) => {
        setExpanded(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    // For toggling all failure rows (remove all if collapsing, or build expanded keys if expanding all)
    const toggleExpandAll = () => {
        if (expandAll) {
            setExpanded(new Set());
            setExpandAll(false);
            return;
        }

        // build expanding keys
        const next = new Set<string>();
        filteredSuites.forEach((suite, si) => {
            suite.testcases.forEach((t, ti) => {
                if (t.status === "fail") {
                    next.add(si + ":" + ti);
                }
            });
        });
        setExpanded(next);
        setExpandAll(true);
    };

    // When we dont have results yet, display a diff message (depending on conditions)
    const testResultsEmptyMessage = !data
        ? (running
            ? <div className="p-6 text-blue-600">Tests are running - results will appear when finished.</div>
            : <div className="p-6 text-gray-500">No results yet. Click <strong>Run Tests</strong> or <strong>Reload Results</strong>.</div>
        )
        : (filteredSuites.length === 0
            ? <div className="p-6 text-gray-500">No results match the current filter. Try switching to <strong>All</strong>.</div>
            : null
        );


    return (
        <div className="min-h-screen bg-gray-50 pb-20" ref={topRef}>
            <Header/>

            <main className="max-w-6xl mx-auto py-8 px-4">
                <h1 className="text-2xl font-bold text-center mb-8">Test Dashboard</h1>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-3 mb-6">
                    <Button onClick={runTests} disabled={running} className="bg-blue-600 hover:bg-blue-700 gap-2">
                        <Play className="h-4 w-4" />
                        {running ? "Running..." : "Run Tests"}
                    </Button>
                    <Button onClick={loadResults} variant="outline" disabled={loading || running} className="gap-2">
                        <RefreshCcw className="h-4 w-4" />
                        {loading ? "Reloadig..." : "Reload Results"}
                    </Button>

                    {/* Filters */}
                    <div className="flex ml-auto items-center gap-2">
                        <Button variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")} size="sm" >
                            All
                        </Button>
                        <Button variant={filter === "passed" ? "default" : "outline"} onClick={() => setFilter("passed")} size="sm" className="gap-1" >
                            <CheckCircle2 className="h-4 w-4 text-green-600" /> Passed
                        </Button>
                        <Button variant={filter === "failed" ? "default" : "outline"} onClick={() => setFilter("failed")} size="sm" className="gap-1" >
                            <XCircle className="h-4 w-4 text-red-600" /> Failed
                        </Button>
                        <Button variant="outline" onClick={toggleExpandAll} size="sm" className="gap-1" >
                            {expandAll ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            {expandAll ? "Collapse Errors" : "Expand Errors"}
                        </Button>
                    </div>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white border rounded p-4">
                        <div className="text-xs text-gray-500">Total</div>
                        <div className="text-2xl font-semibold">{summary.total}</div>
                    </div>
                    <div className="bg-white border rounded p-4">
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4 text-green-600" /> Passed
                        </div>
                        <div className="text-2xl font-semibold text-green-700">{summary.passed}</div>
                    </div>
                    <div className="bg-white border rounded p-4">
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                            <XCircle className="h-4 w-4 text-red-600" /> Failed
                        </div>
                        <div className="text-2xl font-semibold text-red-700">{summary.failed}</div>
                    </div>
                    <div className="bg-white border rounded p-4">
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                            <FileText className="h-4 w-4 text-gray-600" /> Time (s)
                        </div>
                        <div className="text-2xl font-semibold">{summary.time.toFixed(3)}</div>
                    </div>
                </div>

                {/* Suites & Tests */}
                <div className="bg-white border rounded">
                    <div className="bg-gray-800 text-white px-4 py-3 text-sm font-semibold rounded-t">
                        Test Results
                    </div>

                    {testResultsEmptyMessage}

                    {filteredSuites.map((suite, si) => {
                        const suiteFailed = suite.failures + suite.errors;
                        const suitePassed = suite.tests - suiteFailed - suite.skipped;

                        return (
                            <section key={suite.name + si} className="border-t">

                                {/* Suite header */}
                                <div className="px-4 py-3 flex flex-wrap items-center gap-3 bg-slate-200 border-b">
                                    <div className="font-bold text-base mr-2">
                                        {suite.name}
                                    </div>

                                    <span className="text-xs font-semibold px-2 py-1 rounded bg-white">
                                        Tests {suite.tests}
                                    </span>

                                    <span className="text-xs font-semibold px-2 py-1 rounded bg-green-100 text-green-800">
                                        Pass {suitePassed}
                                    </span>

                                    <span className="text-xs font-semibold px-2 py-1 rounded bg-red-100 text-red-800">
                                        Fail {suiteFailed}
                                    </span>

                                    <span className="text-xs font-semibold px-2 py-1 rounded bg-yellow-100 text-yellow-800">
                                        Skipped {suite.skipped}
                                    </span>

                                    <span className="ml-auto text-xs font-medium text-slate-700">
                                        {suite.time.toFixed(3)}s
                                    </span>
                                </div>

                                {/* Suite body */}
                                <div className="divide-y">
                                    {suite.testcases.map((t, ti) => {
                                        const key = si + ":" + ti;
                                        const isExpanded = expanded.has(key);
                                        const isFail = t.status === "fail";

                                        return (
                                            <div key={key} className="p-4">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className={
                                                                    "inline-flex items-center gap-1 text-sm font-semibold " +
                                                                    (isFail ? "text-red-700" : "text-green-700")}
                                                            >
                                                                {isFail ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                                                                {t.status.toUpperCase()}
                                                            </span>
                                                            <span className="font-medium">{t.name}</span>
                                                        </div>

                                                        <div className="text-xs text-gray-500 mt-1">
                                                            {typeof t.time === "number" && <span>Time: {t.time.toFixed(3)}s</span>}
                                                        </div>
                                                    </div>

                                                    {isFail && (
                                                        <Button variant="outline" size="sm" onClick={() => toggleRow(key)} className="gap-1 shrink-0">
                                                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                                            {isExpanded ? "Hide Error" : "Show Error"}
                                                        </Button>
                                                    )}
                                                </div>

                                                {isFail && isExpanded && t.message && (
                                                    <pre className="mt-3 text-sm bg-red-50 text-red-800 border border-red-200 rounded p-3 whitespace-pre-wrap">
                                                        {t.message}
                                                    </pre>
                                                )}
                                            </div>
                                        );
                                    })}



                                </div>
                            </section>
                        );
                    })}
                </div>

                {/* Run output */}
                <div className="mt-8">
                    <h2 className="text-lg font-semibold mb-2">Test Run Output</h2>
                    <pre ref={outputRef} className="bg-gray-900 text-gray-100 text-sm p-4 rounded whitespace-pre-wrap max-h-[400px] overflow-y-auto">
                        {output || "Click 'Run Tests' to execute and show output..."}
                    </pre>
                </div>

                <Button onClick={scrollToTop} variant="outline" className="fixed bottom-6 left-6 shadow-md">
                    Back to Top
                </Button>
            </main>
        
        </div>
    );
}
