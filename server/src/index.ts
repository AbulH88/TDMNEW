import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import oracledb from 'oracledb';
oracledb.fetchAsString = [oracledb.CLOB]; // ensures we can return CLOB columns as normal strings
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';

// Modular services
import { getService, allowedServiceTypes } from "./services/registry";
import type { ServiceContext } from "./services/types";
import { authMiddleware, requireAdmin, requirePermission, AuthenticatedRequest, encrypt } from './middleware/auth';

const xorMask = (text: string, key: string): string => {
    return text.split('').map((char, i) => 
        String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length))
    ).join('');
};

const MASK_KEY = "tdm-portal-secure-mask";
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

// ================================================================
//                          AUTHENTICATION
// ================================================================
// app.post('/api/auth/login', async (req: Request, res: Response) => {
//     console.log(`[AUTH] SQL Login attempt for: ${req.body?.username}`);
//     const { username, password, environment } = req.body;
    
//     if (!username || !password || !environment) {
//         return res.status(400).json({ error: 'Username, password, and environment are required.' });
//     }

//     if (!isAllowedEnvironment(environment)) {
//         return res.status(400).json({ error: 'Invalid environment.' });
//     }

//     let connection;
//     try {
//         // Attempt to connect to Oracle to verify credentials
//         const connectionString = getOracleConnectionString(environment);
//         connection = await oracledb.getConnection({
//             user: username,
//             password: password,
//             connectString: connectionString
//         });
        
//         console.log(`[AUTH] Success SQL login for: ${username}`);
        
//         // Encrypt password for storage in JWT
//         const dbPassEnc = encrypt(password);
        
//         const token = jwt.sign({ 
//             username: username, 
//             dbUser: username, 
//             dbPassEnc: dbPassEnc,
//             environment: environment
//         }, JWT_SECRET, { expiresIn: '8h' });
        
//         res.cookie('token', token, { 
//             httpOnly: true, 
//             secure: process.env.NODE_ENV === 'production',
//             sameSite: 'lax',
//             maxAge: 8 * 60 * 60 * 1000 // 8 hours
//         });
        
//         res.json({ 
//             username: username, 
//             role: 'admin', 
//             permissions: ['read_only', 'create', 'delete'],
//             environment: environment
//         });
//     } catch (err) {
//         console.error(`[AUTH] Oracle Login Failed for ${username}:`, err);
//         res.status(401).json({ error: 'Invalid SQL credentials or database connection issue.', details: (err as Error).message });
//     } finally {
//         if (connection) {
//             try { await connection.close(); } catch (e) {}
//         }
//     }
// });


app.post('/api/auth/login', async (req: Request, res: Response) => {
    let { username, password, environment } = req.body;
    
    if (req.body.payload) {
        try {
            // 1. Decode Base64
            const decodedBase64 = Buffer.from(req.body.payload, 'base64').toString();
            
            // 2. Reverse XOR
            const unmaskedJson = xorMask(decodedBase64, MASK_KEY);
            
            // 3. Parse JSON
            const decoded = JSON.parse(unmaskedJson);
            
            username = decoded.username;
            password = decoded.password;
            environment = decoded.environment;
        } catch (e) {
            console.error('[AUTH] Failed to decode masked payload:', e);
            return res.status(400).json({ error: 'Invalid payload format.' });
        }
    }
    
    // ... continue with your existing authentication logic
});


app.get('/api/auth/me', authMiddleware, (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ error: 'Not authenticated' });
    
    res.json({ 
        username: user.username, 
        role: user.role, 
        permissions: user.permissions 
    });
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
});

// ================================================================
//                          GLOBAL INTERCEPTOR
// ================================================================

// Request logging middleware for debugging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Health check to verify backend is running latest code
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', version: 'active', timestamp: new Date().toISOString() });
});

const API_USER_ID = process.env.API_USER_ID;
const API_PASSWORD = process.env.API_PASSWORD;
const EXTERNAL_API_DOMAIN_CORE = process.env.EXTERNAL_API_DOMAIN_CORE || 'localhost:8081';
const ALLOWED_ENVIRONMENTS = ["Q1", "Q2"] as const;

const ORACLE_CONFIG: Record<string, { hostName: string; host: string }> = {
    Q1: { hostName: "ccxqat_adhoc", host: "qa1dbccx-scan" },
    Q2: { hostName: "ccxsup_adhoc", host: "ccxsup_adhoc.world" }
};

const isAllowedEnvironment = (environment: string): boolean => {
    return ALLOWED_ENVIRONMENTS.includes(environment.toUpperCase() as (typeof ALLOWED_ENVIRONMENTS)[number]);
};

const validateEnvironment = (res: Response, environment: unknown): environment is string => {
    if (typeof environment !== 'string' || !isAllowedEnvironment(environment)) {
        errorResponse(res, 400, `Invalid environment. Allowed values: ${ALLOWED_ENVIRONMENTS.join(', ')}.`);
        return false;
    }
    return true;
};

const validateServiceType = (res: Response, serviceType: unknown): serviceType is string => {
    if (typeof serviceType !== "string" || !getService(serviceType)) {
        errorResponse(res, 400, "Invalid serviceType. Allowed values: " + allowedServiceTypes().join(", ") + ".");
        return false;
    }
    return true;
};

const getExternalApiBaseUrl = (env: string): string => {
    const envPrefix = env.toLowerCase();
    return `https://${envPrefix}-${EXTERNAL_API_DOMAIN_CORE}`;
};

const getOracleConnectionString = (env: string): string => {
    const config = ORACLE_CONFIG[env.toUpperCase()];
    if (!config) {
        console.error("Unable to get configuration for Oracle environment:", env);
        return "Invalid Environment";
    }
    const { hostName, host } = config;
    return `(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=${host})(PORT=1521))(CONNECT_DATA=(SERVICE_NAME=${hostName})))`;
};

const executeWithConnection = async <T>(
    callback: (connection: oracledb.Connection) => Promise<T>,
    environment: string,
    req?: Request
): Promise<T> => {
    let connection: oracledb.Connection | undefined;
    try {
        const connectionString = getOracleConnectionString(environment);
        
        // Use credentials from request if available
        const user = (req as AuthenticatedRequest)?.user;
        const dbUser = user?.dbUser || process.env.DB_USER;
        const dbPass = user?.dbPass || process.env.DB_PASSWORD;

        if (!dbUser || !dbPass) {
            throw new Error("No database credentials provided.");
        }

        connection = await oracledb.getConnection({
            user: dbUser,
            password: dbPass,
            connectString: connectionString
        });
        return await callback(connection);
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error closing database connection:', err);
            }
        }
    }
};

const errorResponse = (res: Response, statusCode: number, error: string, details?: string) => {
    res.status(statusCode).json({
        error,
        ...(details && { details })
    });
};

const serializeOracleRow = (row: any): Record<string, any> => {
    if (row === null || row === undefined) return row;

    const serialized: Record<string, any> = {};
    const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

    for (const key in row) {
        const value = row[key];
        if (value === null || value === undefined) {
            serialized[key] = value;
        } else if (value instanceof Date) {
            const day = String(value.getDate()).padStart(2, '0');
            const month = monthNames[value.getMonth()];
            const year = String(value.getFullYear()).slice(-2);
            serialized[key] = `${day}-${month}-${year}`;
        } else if (typeof value === 'object') {
            const constructorName = value.constructor?.name.toLowerCase();
            if (constructorName?.includes('lob') || constructorName?.includes('cursor')) {
                serialized[key] = String(value);
            } else if (Buffer && value instanceof Buffer) {
                serialized[key] = value.toString('utf-8');
            } else {
                try {
                    serialized[key] = String(value).includes('[object') ? JSON.stringify(value) : String(value);
                } catch {
                    serialized[key] = String(value);
                }
            }
        } else {
            serialized[key] = value;
        }
    }
    return serialized;
};

const snakeToCamel = (str: string) => str.toLowerCase().replace(/_([a-z])/g, (_, l) => l.toUpperCase());
const generateRandom = (length: number): string => Array(length).fill(0).map(() => Math.floor(Math.random() * 10)).join('');
const generatePatientNumber = () => generateRandom(10);
const generateZipCode = () => generateRandom(5);
const generateSubscriberId = () => generateRandom(10);
const generateIntakeId = () => Date.now().toString().slice(-7) + generateRandom(4);
const generatePhoneNumber = () => normalizeUsPhone(generateRandom(10));
const generateRandomName = (prefix: string): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = prefix;
    for (let i = 0; i < 5; i++) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
};
const generateDob = (): string => {
    const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
    const month = monthNames[Math.floor(Math.random() * 12)];
    const year = String(Math.floor(Math.random() * 30) + 70);
    return `${day}-${month}-${year}`;
};

const getColumnType = (columnName: string): string => {
    const lowerName = columnName.toLowerCase();
    if (lowerName.includes('date') || lowerName.includes('dob')) return 'date';
    if (lowerName.includes('name')) return 'names';
    return 'text';
};

// Normalizes US phone inputs to "(###) ###-####"
export function normalizeUsPhone(input: unknown): string {
    if (input == null) return "";

    const s = String(input).trim();
    if (!s) return "";

    // Keep digits only
    let digits = s.replace(/\D/g, "");

    // Require exactly 10 digits now
    if (digits.length !== 10) {
        throw new Error('Invalid phone number format: ' + s);
    }

    const area = digits.slice(0, 3);
    const prefix = digits.slice(3, 6);
    const line = digits.slice(6);

    return "(" + area + ") " + prefix + "-" + line;
}

export function normalizeDob(input: unknown): string {
    if (input == null) return "";
    const raw = String(input).trim();
    if (!raw) return "";
    const upper = raw.toUpperCase();

    // If already like "01-MAR-1958" or "01-MAR-58"
    const monMatch = upper.match(/^(\d{2})-([A-Z]{3})-(\d{2}|\d{4})$/);
    if (monMatch) {
        const dd = monMatch[1];
        const mon = monMatch[2];
        const y = monMatch[3];
        const yyyy = y.length === 4 ? y : String(toDobYear(Number(y)));
        return dd + "-" + mon + "-" + yyyy;
    }

    // Format like: YYYY-MM-DD, MM-DD-YY, MM/DD/YYYY (numeric and split by - and /)
    let date: Date | null = null;

    // Split by "-" or "/"
    const parts = raw.split(/[-\/]/).map(p => p.trim());

    // Only handle numeric formats (all 3 parts must be digits)
    const isThreeParts = parts.length === 3;
    const allNumbers = isThreeParts && parts.every(p => /^\d+$/.test(p))
    if (allNumbers) {
        const firstPartIsYear = parts[0].length === 4;
        let year: number;
        let month: number;
        let day: number;

        // YYYY-MM-DD
        if (firstPartIsYear) {
            year = Number(parts[0]);
            month = Number(parts[1]);
            day = Number(parts[2]);
        }
        // MM-DD-YY or MM-DD-YYYY
        else {
            month = Number(parts[0]);
            day = Number(parts[1]);
            const yearText = parts[2];
            year = yearText.length === 2 ? toDobYear(Number(yearText)) : Number(yearText);
        }

        // javascript months are 0-based, so subtract 1
        date = new Date(year, month - 1, day);
    }

    // if numeric parsing didn't work, try JavaScript's built-in parser
    if (!date || isNaN(date.getTime())) {
        const parsed = new Date(raw);
        if (!isNaN(parsed.getTime())) {
            date = parsed;
        }
    }

    // Error if invalid DOB
    if (!date || isNaN(date.getTime())) {
        throw new Error('Invalid DOB format: "' + raw + '"');
    }

    // Error if future DOB
    if (date > new Date()) {
        throw new Error('DOB cannot be in the future: "' + raw + '"');
    }

    return formatDob(date);
}

// Helper func: 00-29 => 2000-2029, else 1930-1999
function toDobYear(twoDigitYear: number): number {
    return twoDigitYear <= 29 ? 2000 + twoDigitYear : 1900 + twoDigitYear;
}

function formatDob(date: Date): string {
    const dd = String(date.getDate()).padStart(2, "0");
    const mon = date.toLocaleString("en-US", { month: "short" }).toUpperCase();
    const yyyy = String(date.getFullYear());
    return dd + "-" + mon + "-" + yyyy;
}

const ctx: ServiceContext = {
    executeWithConnection,
    errorResponse,
    serializeOracleRow,
    normalizeDob,
    normalizeUsPhone,
    snakeToCamel,
    generateRandom,
    generatePatientNumber,
    generateZipCode,
    generateSubscriberId,
    generateIntakeId,
    generatePhoneNumber,
    generateRandomName,
    generateDob,
    getColumnType
};

// ================================================================
//                          ENDPOINTS 
// ================================================================

// Default
app.get('/', (req: Request, res: Response) => {
    res.send('Backend server is running!');
});

// Fetch Schema
app.get("/api/service-schema", authMiddleware, requirePermission('read_only'), async (req, res) => {
    const { environment, serviceType } = req.query;

    // Parameter validation
    if (!environment || !serviceType) return errorResponse(res, 400, 'environment and serviceType are required.');
    if (!validateEnvironment(res, environment)) return;
    if (!validateServiceType(res, serviceType)) return;

    // Call to service
    const svc = getService(String(serviceType));
    return svc.getSchema(req, res, ctx);
});

// Retrieve
app.post('/api/retrieve-data', authMiddleware, requirePermission('read_only'), async (req: Request, res: Response) => {
    const { environment, serviceType, selectedColumnNames } = req.body;

    // Parameter validation
    if (!environment || !serviceType || !Array.isArray(selectedColumnNames) || selectedColumnNames.length === 0)    return errorResponse(res, 400, "missing required params.");
    if (!validateEnvironment(res, environment)) return;
    if (!validateServiceType(res, serviceType)) return;

    // Call to service
    const svc = getService(serviceType);
    if (!svc.capabilities.retrieve || !svc.retrieve) return errorResponse(res, 400, "Service does not support retrieve.");
    return svc.retrieve(req, res, ctx);

});

app.post('/api/service-execute', authMiddleware, requirePermission('read_only'), async (req: Request, res: Response) => {
    const { environment, serviceType, selectedColumnNames } = req.body;

    // Parameter validation
    if (!environment || !serviceType || !Array.isArray(selectedColumnNames) || selectedColumnNames.length === 0)    return errorResponse(res, 400, "missing required params.");
    if (!validateEnvironment(res, environment)) return;
    if (!validateServiceType(res, serviceType)) return;

    // Call to service
    const svc = getService(serviceType);
    if (!svc.capabilities.retrieve || !svc.retrieve) return errorResponse(res, 400, "Service does not support retrieve.");
    return svc.retrieve(req, res, ctx);

});

// Create
app.post('/api/create-data', authMiddleware, requirePermission('create'), async (req: Request, res: Response) => {
    const { environment, serviceType } = req.body;

    // Parameter validation
    if (!environment || !serviceType) return errorResponse(res, 400, "environment and serviceType are required.");
    if (!validateEnvironment(res, environment)) return;
    if (!validateServiceType(res, serviceType)) return;

    // Call to service
    const svc = getService(serviceType);
    if (!svc.capabilities.create || !svc.create) return errorResponse(res, 400, "Service does not support create.");
    return svc.create(req, res, ctx);
});

app.post('/api/create-intake-data', authMiddleware, requirePermission('create'), async (req: Request, res: Response) => {
    const { environment, serviceType } = req.body;

    // Parameter validation
    if (!environment || !serviceType) return errorResponse(res, 400, "environment and serviceType are required.");
    if (!validateEnvironment(res, environment)) return;
    if (!validateServiceType(res, serviceType)) return;

    // Call to service
    const svc = getService(serviceType);
    if (!svc.capabilities.create || !svc.create) return errorResponse(res, 400, "Service does not support create.");
    return svc.create(req, res, ctx);
});

// Delete
app.post('/api/delete-data', authMiddleware, requirePermission('delete'), async (req: Request, res: Response) => {
    const { environment, serviceType } = req.body;

    // Parameter validation
    if (!environment || !serviceType) return errorResponse(res, 400, "environment and serviceType are required.");
    if (!validateEnvironment(res, environment)) return;
    if (!validateServiceType(res, serviceType)) return;

    // Call to service
    const svc = getService(serviceType);
    if (!svc.capabilities.delete || !svc.delete) {
        return errorResponse(res, 400, "Service does not support delete.");
    }
    return svc.delete(req, res, ctx);
});


// Tests / Health status page section ===========================================================
import { readFileSync } from "node:fs";
import { exec } from "node:child_process";
import { DOMParser } from "@xmldom/xmldom";

const testResultsXML = "../test-results.xml";

// Parses test-results.xml and returns as JSON
app.get("/api/test-results", authMiddleware, requirePermission('read_only'), async (req: Request, res: Response) => {
    try {
        const xml = readFileSync(testResultsXML, "utf8");
        const doc = new DOMParser().parseFromString(xml, "text/xml");

        // Handle suites
        const suiteElements = Array.from(doc.getElementsByTagName("testsuite"));
        const suites = suiteElements.map((s: any) => {
            const suiteName = s.getAttribute("name") || "Unnamed Suite";
            const suiteTime = parseFloat(s.getAttribute("time") || "0");
            const suiteTests = parseInt(s.getAttribute("tests") || "0", 10);
            const suiteFailures = parseInt(s.getAttribute("failures") || "0", 10);
            const suiteErrors = parseInt(s.getAttribute("errors") || "0", 10);
            const suiteSkipped = parseInt(s.getAttribute("skipped") || "0", 10);

            // Handle each test case within the suite
            const testCaseElements = Array.from(s.getElementsByTagName("testcase"));
            const testcases = testCaseElements.map((t: any) => {
                const name = t.getAttribute("name") || "";
                const time = parseFloat(t.getAttribute("time") || "0");
                const failureElement = t.getElementsByTagName("failure")[0] || t.getElementsByTagName("error")?.[0];
                const status: "pass" | "fail" = failureElement ? "fail" : "pass";
                const message = failureElement ? (failureElement.textContent || "") : "";
                return { name, status, message, time };
            });

            // Finally return all suite and test case details
            return {
                name: suiteName,
                time: suiteTime,
                tests: suiteTests || testcases.length,
                failures: suiteFailures,
                errors: suiteErrors,
                skipped: suiteSkipped,
                testcases,
            };
        });

        // Summary / Stats
        const summary = { tests: 0, failures: 0, errors: 0, skipped: 0, time: 0 };
        for (const s of suites) {
            summary.tests += s.tests;
            summary.failures += s.failures;
            summary.errors += s.errors;
            summary.skipped += s.skipped;
            summary.time += s.time;
        }

        return res.json({ summary, suites });
    } catch (err: any) {
        return res.status(500).json({ error: "Could not parse test-results.xml", message: err?.message });
    }
});


// run "npm test" and return output
app.post("/api/run-tests", authMiddleware, async (req: Request, res: Response) => {
    // have to include resolve path (from server/src) to get to package.json (contains npm test command)
    exec("npm test", { cwd: path.resolve(__dirname, "../../") }, (err, stdout, stderr) => {
        const output = stdout + "\n" + stderr;
        if (err) return res.status(500).json({ success: false, output });
        return res.json({ success: true, output });
    });
});

let lastExecutedQuery: { query: string, params: any[] } | null = null;

app.get('/api/debug-query', (req: Request, res: Response) => {
    res.json(lastExecutedQuery || { message: "No query executed yet." });
});

const API_PATHS: Record<string, string> = {
    initial: '/cases',
    cos: '/cos-path-placeholder',
    edit: '/edit-path-placeholder',
};

app.post('/api/external-call', authMiddleware, async (req: Request, res: Response) => {
    const { apiType, environment, requestBody } = req.body;

    if (!apiType || !environment) {
        return errorResponse(res, 400, 'apiType and environment are required.');
    }

    if (!validateEnvironment(res, environment)) {
        return;
    }

    if (!API_USER_ID || !API_PASSWORD) {
        return errorResponse(res, 500, 'API_USER_ID or API_PASSWORD not set in environment variables.');
    }

    const externalApiPath = API_PATHS[apiType];
    if (!externalApiPath) {
        return errorResponse(res, 400, 'Invalid apiType.');
    }

    const externalApiUrl = `${getExternalApiBaseUrl(environment)}${externalApiPath}`;

    try {
        const authHeader = `Basic ${Buffer.from(`${API_USER_ID}:${API_PASSWORD}`).toString('base64')}`;
        const externalApiResponse = await fetch(externalApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader,
            },
            body: JSON.stringify(requestBody),
        });

        const contentType = externalApiResponse.headers.get('content-type');
        const responseData = contentType?.includes('application/json')
            ? await externalApiResponse.json()
            : await externalApiResponse.text();

        if (!externalApiResponse.ok) {
            const errorMessage = (typeof responseData === 'object' && responseData && 'message' in responseData)
                ? (responseData as any).message
                : externalApiResponse.statusText;
            return errorResponse(res, externalApiResponse.status, `External API Error: ${externalApiResponse.status}`, errorMessage);
        }

        res.json(responseData);

    } catch (error) {
        errorResponse(res, 500, 'Failed to proxy external API call.', (error as Error).message);
    }
});

app.get('/api/schema', authMiddleware, async (req: Request, res: Response) => {
    const { environment, tableName } = req.query;

    if (!environment || !tableName) return errorResponse(res, 400, 'environment and tableName query parameters are required.');
    if (!validateEnvironment(res, environment)) return;

    try {
        const result = await executeWithConnection(async (connection) => {
            return await connection.execute(
                `SELECT COLUMN_NAME, DATA_TYPE, DATA_LENGTH, DATA_PRECISION, DATA_SCALE, NULLABLE
         FROM ALL_TAB_COLUMNS WHERE TABLE_NAME = :tableName`,
                [(tableName as string).toUpperCase()],
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );
        }, environment as string);

        interface OracleColumnMetadata {
            COLUMN_NAME: string;
            DATA_TYPE: string;
            DATA_LENGTH: number;
            DATA_PRECISION: number | null;
            DATA_SCALE: number | null;
            NULLABLE: 'Y' | 'N';
        }

        const schema = (result.rows as OracleColumnMetadata[])?.map((row) => ({
            column_name: row.COLUMN_NAME,
            data_type: row.DATA_TYPE,
            data_length: row.DATA_LENGTH,
            data_precision: row.DATA_PRECISION,
            is_nullable: row.NULLABLE === 'Y'
        }));

        res.json({
            environment,
            tableName,
            schema: schema || [],
        });

    } catch (err) {
        errorResponse(res, 500, 'Failed to fetch schema from database.', (err as Error).message);
    }
});

// Catch-all route for any undefined API endpoints (404)
app.use((req: Request, res: Response) => {
    console.error(`404: Route not found - ${req.method} "${req.url}" (Original: "${req.originalUrl}")`);
    
    // Debug log to see all registered routes
    const routes = (app as any)._router?.stack
        ?.filter((r: any) => r.route)
        .map((r: any) => `${Object.keys(r.route.methods).join(',').toUpperCase()} ${r.route.path}`);
    
    if (routes) {
        console.debug('Registered routes:', routes);
    }

    res.status(404).json({
        error: "Route not found",
        method: req.method,
        path: req.url,
        message: `No handler defined for ${req.method} ${req.url}. Please check your backend routes.`
    });
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on 0.0.0.0:${port}`);
});
