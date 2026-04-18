import type { ServiceContext, ServiceModule } from "./types";
import oracledb from 'oracledb';

const OPERATION_CENTER_CODE = "TAMPA";
const PLAN_LEVEL_CD = "1";
const FIXED_PLAN_ID = "16706";
const FIXED_INS_PAT_ID = "TESTTEST05";
const MAX_RETRIES = 50;

const PATIENT_DATA_QUERY = `
SELECT tp.ZIP, tp.DOB, tp.FIRSTNAME, tp.LASTNAME, tpip.INSPHONE, tpip.SUBSCRIBERID
FROM TBLPATIENT tp
JOIN TBLPATINTAKEPLAN tpip
ON tp.PATIENTNUMBER = tpip.PATIENTNUMBER
WHERE tp.ZIP IS NOT NULL
AND tp.DOB IS NOT NULL
AND tp.FIRSTNAME IS NOT NULL
AND tp.LASTNAME IS NOT NULL
AND tpip.INSPHONE IS NOT NULL
AND tpip.SUBSCRIBERID IS NOT NULL
ORDER BY tp.DOB DESC
FETCH FIRST 1 ROW ONLY`;


const mod: ServiceModule = {
    serviceType: "patient-rest-services",
    label: "Patient Rest Services",
    capabilities: { retrieve: true, create: true, delete: true },

    getSchema: async (req, res, ctx) => {
        const { environment, serviceType, mode } = req.query;
        try {
            // If mode is create-intake, return ONLY intake-specific fields
            if (mode === 'create-intake') {
                const intakeSpecificFields = [
                    {
                        id: `intake-firstname`,
                        type: 'text',
                        propertyName: 'firstname',
                        option: "",
                        checked: true,
                        example: "Text (e.g., John)",
                    },
                    {
                        id: `intake-lastname`,
                        type: 'text',
                        propertyName: 'lastname',
                        option: "",
                        checked: true,
                        example: "Text (e.g., Doe)",
                    },
                    {
                        id: `intake-dob`,
                        type: 'date',
                        propertyName: 'dob',
                        option: "",
                        checked: true,
                        example: "Date (e.g., 15-JAN-90)",
                    },
                    {
                        id: `intake-insphone`,
                        type: 'text',
                        propertyName: 'insphone',
                        option: "",
                        checked: true,
                        example: "Phone (e.g., 8135551234)",
                    },
                    {
                        id: `intake-zip`,
                        type: 'text',
                        propertyName: 'zip',
                        option: "",
                        checked: true,
                        example: "Zip (e.g., 33602)",
                    },
                    {
                        id: `intake-subscriberid`,
                        type: 'text',
                        propertyName: 'subscriberid',
                        option: "",
                        checked: true,
                        example: "Text (e.g., 123456789)",
                    },
                    {
                        id: `intake-intakeid`,
                        type: 'text',
                        propertyName: 'intakeid',
                        option: "",
                        checked: true,
                        example: "7-digit number (e.g., 1234567)",
                    },
                    {
                        id: `intake-operationcentercode`,
                        type: 'text',
                        propertyName: 'operationcentercode',
                        option: "",
                        checked: true,
                        example: "Text (e.g., TAMPA)",
                    },
                    {
                        id: `intake-planlevelcd`,
                        type: 'number',
                        propertyName: 'planlevelcd',
                        option: "",
                        checked: true,
                        example: "Number (e.g., 1)",
                    },
                    {
                        id: `intake-planid`,
                        type: 'number',
                        propertyName: 'planid',
                        option: "",
                        checked: true,
                        example: "Number (e.g., 16706)",
                    },
                    {
                        id: `intake-inspatid`,
                        type: 'text',
                        propertyName: 'inspatid',
                        option: "",
                        checked: true,
                        example: "Text (e.g., TESTTEST05)",
                    },
                ];
    
                res.json({
                    environment,
                    serviceType,
                    schema: intakeSpecificFields,
                });
                return;
            }
    
            // For query mode, return columns from database query
            const result = await ctx.executeWithConnection(async (connection) => {
                return await connection.execute(PATIENT_DATA_QUERY, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
            }, environment as string);
    
            let schemaFields = result.metaData?.map((col: oracledb.Metadata<any>, index: number) => ({
                id: `${index}-${col.name}`,
                type: ctx.getColumnType(col.name),
                propertyName: ctx.snakeToCamel(col.name),
                option: "",
                checked: true,
                example: "",
            })) || [];
    
            res.json({
                environment,
                serviceType,
                schema: schemaFields || [],
            });
            return;
    
        } catch (err) {
            return ctx.errorResponse(res, 500, 'Failed to fetch service schema from database.', (err as Error).message);
        }
    },

    retrieve: async (req, res, ctx) => {
        const env = req.body.environment;
        const service = req.body.serviceType;
        const cols = req.body.selectedColumnNames;
        const filters = req.body.filters || req.body.data || {};
        const rowCountRaw = req.body.rowCount;
        const limit = Math.min(Math.max(parseInt(String(rowCountRaw), 10) || 1, 1), 1000);

        try {
            const tpipCols = [
                "INSPHONE",
                "SUBSCRIBERID",
                "INTAKEID",
                "OPERATIONCENTERCODE",
                "PLANLEVELCD",
                "INSFIRSTNAME",
                "INSLASTNAME",
                "INSDOB",
                "PLANID",
                "INSPATID",
            ];

            // Filter rules
            const LIKE_COLS = new Set(["FIRSTNAME", "LASTNAME", "INSFIRSTNAME", "INSLASTNAME"]);
            const DATE_COLS = new Set(["DOB", "INSDOB"]);
            const NUMERIC_COLS = new Set(["INTAKEID", "PATIENTNUMBER"]);
            const CASE_INSENSITIVE_STRING_COLS = new Set([
                "ZIP",
                "SUBSCRIBERID",
                "OPERATIONCENTERCODE",
                "PLANLEVELCD",
                "PLANID",
                "INSPHONE",
            ]);

            // Build SELECT
            let selectStr = "";
            for (let i = 0; i < cols.length; i++) {
                const colUpper = String(cols[i]).toUpperCase();
                const prefix = tpipCols.includes(colUpper) ? "tpip." : "tp.";
                selectStr += prefix + colUpper;
                if (i < cols.length - 1) selectStr += ", ";
            }

            // Base SQL (without filters)
            let sql =
                "SELECT " +
                selectStr +
                " FROM TBLPATIENT tp " +
                "JOIN TBLPATINTAKEPLAN tpip ON tp.PATIENTNUMBER = tpip.PATIENTNUMBER " +
                "WHERE 1=1";

            const bindParams: any[] = [];
            const filterKeys = Object.keys(filters);

            // Add filters (WHERE)
            for (const key of filterKeys) {
                let val = filters[key];

                // Skip null/empty values
                if (val == null || String(val).trim() === "") continue;

                const col = String(key).toUpperCase();

                // Decide which table alias
                const prefix = tpipCols.includes(col) ? "tpip." : "tp.";
                const bindIndex = bindParams.length + 1;

                // Normalize values
                if (col === "INSPHONE") val = ctx.normalizeUsPhone(val);
                if (col === "DOB" || col === "INSDOB") val = ctx.normalizeDob(val);

                // DATE columns: exact compare
                if (DATE_COLS.has(col)) {
                    sql += " AND TRUNC(" + prefix + col + ") = TO_DATE(:" + bindIndex + ", 'DD-MON-YYYY')";
                    bindParams.push(String(val).trim());
                    continue;
                }

                // LIKE columns: case-insensitive prefix search
                if (LIKE_COLS.has(col)) {
                    sql += " AND UPPER(" + prefix + col + ") LIKE UPPER(:" + bindIndex + ")";
                    bindParams.push(String(val).trim() + "%");
                    continue;
                }

                // Numeric columns: strict equality
                if (NUMERIC_COLS.has(col)) {
                    const num = Number(String(val).trim());
                    if (Number.isNaN(num)) {
                        throw new Error('Invalid numeric filter for ' + col + ': "' + val + '"');
                    }
                    sql += " AND " + prefix + col + " = :" + bindIndex;
                    bindParams.push(num);
                    continue;
                }

                // Other string columns: case-insensitive equality
                if (CASE_INSENSITIVE_STRING_COLS.has(col)) {
                    sql += " AND UPPER(" + prefix + col + ") = UPPER(:" + bindIndex + ")";
                    bindParams.push(String(val).trim());
                    continue;
                }

                // Fallback
                sql += " AND " + prefix + col + " = :" + bindIndex;
                bindParams.push(val);
            }

            // Limit rows
            sql += " FETCH FIRST " + limit + " ROWS ONLY";

            // Execute
            const result = await ctx.executeWithConnection(
                async (connection) => {
                    return await connection.execute(sql, bindParams, {
                        outFormat: oracledb.OUT_FORMAT_OBJECT,
                    });
                },
                env
            );

            const data = result.rows && result.rows.length > 0
                ? result.rows.map((row: any) => ctx.serializeOracleRow(row))
                : [];

            res.json({
                environment: env,
                serviceType: service,
                selectedColumns: cols,
                data: data,
            });
            return;
        } catch (err) {
            return ctx.errorResponse(res, 500, "Failed to execute query.", (err as Error).message);
        }
    },

    create: async (req, res, ctx) => {
        const { environment, serviceType, dataFields } = req.body;

        const userData =
            dataFields && typeof dataFields === 'object' && !Array.isArray(dataFields)
                ? dataFields
                : {};

        try {
            const result = await ctx.executeWithConnection(
                (connection) => createIntakeDataWithRetry(connection, MAX_RETRIES, userData, ctx),
                environment
            );

            if (!result.success) {
                return ctx.errorResponse(res, 500, 'Failed to create intake data after ' + MAX_RETRIES + ' attempts.');
            }

            res.json({
                message: 'Intake data created and verified successfully.',
                data: result.verificationData,
            });
            return;
        } catch (err) {
            console.error('ERROR in create intake:', err);
            return ctx.errorResponse(res, 500, 'Failed to process intake creation.', (err as Error).message);
        }

        
        
    },

    delete: async (req, res, ctx) => {
        const { environment, serviceType, patientNumber } = req.body;

        try {
            const result = await ctx.executeWithConnection(async (connection) => {
                return await deleteData(connection, patientNumber);
            }, environment);

            if (result.success) {
                res.json({
                    message: 'Data deleted successfully',
                    data: result.success,
                });
            } else {
                ctx.errorResponse(res, 500, result.message);
            }

        } catch (err) {
            console.error('ERROR in deleting data:', err);
            ctx.errorResponse(res, 500, 'Failed to delete data.', (err as Error).message);
        }
    }
};

const createIntakeDataWithRetry = async (
    connection: oracledb.Connection,
    maxRetries: number = MAX_RETRIES,
    userData: Record<string, any> = {},
    ctx: ServiceContext
): Promise<{ success: boolean; verificationData: any }> => {

    // Helper: get a value from userData using multiple possible keys
    const getFieldValue = (keys: string[]): string => {
        for (const key of keys) {
            const raw = userData[key];
            if (raw !== undefined && raw !== null) {
                const val = String(raw).trim();
                if (val) return val;
            }
        }
        return "";
    };

    // Helper: run a SELECT and return rows as serialized objects
    const selectRows = async (sql: string, binds: any[]) => {
        const r = await connection.execute(sql, binds, { outFormat: oracledb.OUT_FORMAT_OBJECT });
        return r.rows?.map((row) => ctx.serializeOracleRow(row)) || [];
    };

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            // Use user-provided data or generate random data as fallback
            const patientNumber = ctx.generatePatientNumber();

            const firstName = getFieldValue(["FIRSTNAME", "firstname"]) || ctx.generateRandomName("FIRST");
            const lastName = getFieldValue(["LASTNAME", "lastname"]) || ctx.generateRandomName("LAST");

            const rawPhone = getFieldValue(["INSPHONE", "insphone"]) || ctx.generatePhoneNumber();
            const phone = ctx.normalizeUsPhone(rawPhone);

            const rawDob = getFieldValue(["DOB", "dob"]) || ctx.generateDob();
            const dob = ctx.normalizeDob(rawDob); // should return DD-MON-YYYY (recommended)

            const zip = getFieldValue(["ZIP", "zip"]) || ctx.generateZipCode();
            const intakeId = getFieldValue(["INTAKEID", "intakeid"]) || String(Math.floor(Math.random() * 9000000) + 1000000);
            const subscriberId = getFieldValue(["SUBSCRIBERID", "subscriberid"]) || ctx.generateSubscriberId();

            const operationCenterCode = getFieldValue(["OPERATIONCENTERCODE", "operationcentercode"]) || OPERATION_CENTER_CODE;
            const planLevelCd = getFieldValue(["PLANLEVELCD", "planlevelcd"]) || PLAN_LEVEL_CD;
            const planId = getFieldValue(["PLANID", "planid"]) || FIXED_PLAN_ID;
            const insPatId = getFieldValue(["INSPATID", "inspatid"]) || FIXED_INS_PAT_ID;

            // Insert into the 3 tables
            await connection.execute(
                "INSERT INTO TBLPATINTAKE (PATIENTNUMBER, INTAKEID, OPERATIONCENTERCODE) VALUES (:1, :2, :3)",
                [patientNumber, intakeId, operationCenterCode],
                { autoCommit: true }
            );

            await connection.execute(
                "INSERT INTO TBLPATINTAKEPLAN " +
                "(PATIENTNUMBER, INTAKEID, OPERATIONCENTERCODE, PLANLEVELCD, INSFIRSTNAME, INSLASTNAME, INSPHONE, INSDOB, PLANID, INSPATID, SUBSCRIBERID) " +
                "VALUES (:1, :2, :3, :4, :5, :6, :7, TO_DATE(:8, 'DD-MON-YYYY'), :9, :10, :11)",
                [patientNumber, intakeId, operationCenterCode, planLevelCd, firstName, lastName, phone, dob, planId, insPatId, subscriberId],
                { autoCommit: true }
            );

            await connection.execute(
                "INSERT INTO TBLPATIENT (PATIENTNUMBER, FIRSTNAME, LASTNAME, PHONE, DOB, ZIP) " +
                "VALUES (:1, :2, :3, :4, TO_DATE(:5, 'DD-MON-YYYY'), :6)",
                [patientNumber, firstName, lastName, phone, dob, zip],
                { autoCommit: true }
            );

            // Verify insertion
            const verificationData = await selectRows(
                "SELECT * FROM TBLPATINTAKEPLAN WHERE PATIENTNUMBER = :1",
                [patientNumber]
            );

            return { success: true, verificationData };

        } catch (err: unknown) {
            if ((err as oracledb.DBError).errorNum === 1) {
                if (attempt === maxRetries) throw err;
            } else {
                throw err;
            }
        }
    }

    // Should only reach here if retry limit reached
    return { success: false, verificationData: null };
};


const deleteData = async (
    connection: oracledb.Connection,
    patientNumber?: string
): Promise<{ success: boolean, message: string; }> => {
    let success = false;
    let message = "";
    try {
        // Validations for patientnumber (null, empty, only digits/numeric)
        patientNumber = patientNumber?.toString();
        success = !(patientNumber == null || patientNumber.trim().length === 0) && Number.isFinite(+patientNumber);
        if (!success) {
            message = "Unable to delete data - Validations for patientnumber failed (null, empty, or contains non-numeric values)";
            return { success, message };
        }

        // Verify data exists - check all three tables
        const verify_TBLPATINTAKEPLAN_before = await connection.execute(
            `SELECT * FROM TBLPATINTAKEPLAN WHERE PATIENTNUMBER = :1`,
            [patientNumber],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        const verify_TBLPATINTAKE_before = await connection.execute(
            `SELECT * FROM TBLPATINTAKE WHERE PATIENTNUMBER = :1`,
            [patientNumber],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        const verify_TBLPATIENT_before = await connection.execute(
            `SELECT * FROM TBLPATIENT WHERE PATIENTNUMBER = :1`,
            [patientNumber],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        success = verify_TBLPATINTAKEPLAN_before.rows?.length == 1 && verify_TBLPATINTAKE_before.rows?.length == 1 && verify_TBLPATIENT_before.rows?.length == 1;
        if (!success) {
            message = "Unable to delete data - Record does not exist, unable to find with patient number";
            return { success, message };
        }

        // Delete patient from all three tables
        await connection.execute(
            `DELETE FROM TBLPATINTAKEPLAN WHERE PATIENTNUMBER = :1`,
            [patientNumber],
            { autoCommit: true }
        );
        await connection.execute(
            `DELETE FROM TBLPATINTAKE WHERE PATIENTNUMBER = :1`,
            [patientNumber],
            { autoCommit: true }
        );
        await connection.execute(
            `DELETE FROM TBLPATIENT WHERE PATIENTNUMBER = :1`,
            [patientNumber],
            { autoCommit: true }
        );

        // Verify data was deleted - check all three tables
        const verify_TBLPATINTAKEPLAN = await connection.execute(
            `SELECT * FROM TBLPATINTAKEPLAN WHERE PATIENTNUMBER = :1`,
            [patientNumber],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        const verify_TBLPATINTAKE = await connection.execute(
            `SELECT * FROM TBLPATINTAKE WHERE PATIENTNUMBER = :1`,
            [patientNumber],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        const verify_TBLPATIENT = await connection.execute(
            `SELECT * FROM TBLPATIENT WHERE PATIENTNUMBER = :1`,
            [patientNumber],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        success = verify_TBLPATINTAKEPLAN.rows?.length == 0 && verify_TBLPATINTAKE.rows?.length == 0 && verify_TBLPATIENT.rows?.length == 0;
        if (!success) {
            message = "Unable to delete data - rows existed after delete attempted";
        }
    } catch (err: unknown) {
        throw err;
    }

    return { success, message };
};
export default mod;