import type { ServiceModule } from "./types";
import oracledb from "oracledb";

// Column map for dhs_referral
const DHS_REFERRAL_COLUMN_MAP: Record<string, { expr: string; alias: string; type: string }> = {
    refRequestId: { expr: "RS.REF_REQUEST_ID", alias: "REF_REQUEST_ID", type: "text" },
    caseId: { expr: "RS.PLCHLDR_PARENTAUTHID", alias: "CASEID", type: "text" },
    caseline: { expr: "RS.REF_REQUEST_ID || '-' || RS.REF_REQUEST_SERVICE_ID || '-' || 'Ref'", alias: "CASELINE", type: "text" },
    eventCorlId: { expr: "SRFSVC.EVENT_CORL_ID", alias: "EVENT_CORL_ID", type: "text" },
    providerGdfId: { expr: "SRFSVC.PROVIDER_GDF_ID", alias: "PROVIDER_GDF_ID", type: "text" },
    providerNpi: { expr: "SRFSVC.PROVIDER_NPI", alias: "PROVIDER_NPI", type: "text" },
    memFirstName: { expr: "SRFSVC.MEM_FIRST_NAME", alias: "MEM_FIRST_NAME", type: "text" },
    memLastName: { expr: "SRFSVC.MEM_LAST_NAME", alias: "MEM_LAST_NAME", type: "text" },
    memDob: { expr: "SRFSVC.MEM_DOB", alias: "MEM_DOB", type: "date" },
    memSubId: { expr: "SRFSVC.MEM_SUB_ID", alias: "MEM_SUB_ID", type: "text" },
    hpName: { expr: "SRFSVC.HP_NAME", alias: "HP_NAME", type: "text" },
    caseReferralType: { expr: "SRFSVC.CASE_REFERRAL_TYPE", alias: "CASE_REFERRAL_TYPE", type: "text" },
    refAuthEditType: { expr: "RS.REF_AUTH_EDIT_TYPE", alias: "REF_AUTH_EDIT_TYPE", type: "text" },
    createdBy: { expr: "RS.CREATED_BY", alias: "CREATED_BY", type: "text" },
    txnStatCd: { expr: "EVTHE.TXN_STAT_CD", alias: "TXN_STAT_CD", type: "text" },
    payloadIncmgObj: { expr: "EVTHE.PAYLOAD_INCMG_OBJ", alias: "PAYLOAD_INCMG_OBJ", type: "text" },
};

// Column map for dhs_auth
const DHS_AUTH_COLUMN_MAP: Record<string, { expr: string; alias: string; type: string }> = {
    intakeId: { expr: "A.INTAKEID", alias: "INTAKEID", type: "text" },
    patientNumber: { expr: "A.PATIENTNUMBER", alias: "PATIENTNUMBER", type: "text" },
};

// Column map for dhs_documentid
const DHS_DOCUMENT_COLUMN_MAP: Record<string, { expr: string; alias: string; type: string }> = {
    caseId: { expr: "RS.PLCHLDR_PARENTAUTHID", alias: "CASEID", type: "text" },
    documentId: { expr: "QMA.ID", alias: "DOCUMENTID", type: "text" },
    hpName: { expr: "SRFSVC.HP_NAME", alias: "HP_NAME", type: "text" },
    caseline: { expr: "RS.REF_REQUEST_ID || '-' || RS.REF_REQUEST_SERVICE_ID || '-Ref'", alias: "CASELINE", type: "text" },
};



const mod: ServiceModule = {
    serviceType: "dhs-webservices",
    label: "DHS Webservices",
    capabilities: { retrieve: true, create: false, delete: false },

    getSchema: (req, res, ctx) => {
        const { environment, serviceType } = req.query;
        const queryId = String(req.query.queryId || "dhs_referral");

        if (queryId === "dhs_referral") {
            const schema = [
                {
                    id: 'TXN_STAT_CD',
                    type: 'text',
                    propertyName: 'TXN_STAT_CD',
                    option: "",
                    checked: true,
                    example: "S",
                },
                {
                    id: 'HP_NAME',
                    type: 'text',
                    propertyName: 'HP_NAME',
                    option: "",
                    checked: true,
                    example: "Horizon BCBS NJ",
                },
                {
                    id: 'CREATED_BY',
                    type: 'text',
                    propertyName: 'CREATED_BY',
                    option: "",
                    checked: true,
                    example: "ep-integration-app",
                },
            ]
            res.json({ environment, serviceType, schema });
        }
        else if (queryId === "dhs_auth") {
            const schema = [
                {
                    id: "DAYS_BACK",
                    type: "number",
                    propertyName: "DAYS_BACK",
                    option: "",
                    checked: true,
                    example: "30",
                },
            ]
            res.json({ environment, serviceType, schema });
        }
        else if (queryId === "dhs_documentid") {
            const schema = [
                {
                    id: "TXN_STAT_CD",
                    type: "text",
                    propertyName: "TXN_STAT_CD",
                    option: "",
                    checked: true,
                    example: "S",
                },
                {
                    id: "HP_NAME",
                    type: "text",
                    propertyName: "HP_NAME",
                    option: "",
                    checked: true,
                    example: "Horizon BCBS NJ",
                },
            ];
            res.json({ environment, serviceType, schema });
            return;
        }

        return;
    },

    retrieve: async (req, res, ctx) => {
        const env = req.body.environment;
        const service = req.body.serviceType;
        const cols: string[] = req.body.selectedColumnNames || [];
        const filters = req.body.filters || {};
        const rowCountRaw = req.body.rowCount;
        const limit = Math.min(Math.max(parseInt(String(rowCountRaw), 10) || 1, 1), 1000);
        const queryId = String(req.body.queryId || "dhs_referral");

        if (queryId === "dhs_referral") {
            // Load filter items or defaults
            const hpName = (filters.HP_NAME && String(filters.HP_NAME).trim()) || "Horizon BCBS NJ";
            const txnStatCd = (filters.TXN_STAT_CD && String(filters.TXN_STAT_CD).trim()) || "S";
            const createdBy = (filters.CREATED_BY && String(filters.CREATED_BY).trim()) || "ep-integration-app";

            // Build SELECT from all DHS columns
            const requested = Object.keys(DHS_REFERRAL_COLUMN_MAP);
            const selectStr = requested.map((c) => DHS_REFERRAL_COLUMN_MAP[c].expr + " AS " + DHS_REFERRAL_COLUMN_MAP[c].alias).join(", ");

            // Base DHS SQL
            let sql =
                "SELECT " + selectStr + " " +
                "FROM DHUB_ORCH.ep_event_tracking_header EVTHE " +
                "LEFT JOIN NETWORX_OWNER.REFERRAL_SERVICES RS ON EVTHE.REF_REQUEST_ID = RS.REF_REQUEST_ID " +
                "LEFT JOIN SRFSVC.DHS_SERVICE_AUTH SRFSVC ON SRFSVC.EVENT_CORL_ID = EVTHE.EVENT_CORL_GUID " +
                "WHERE RS.REF_AUTH_EDIT_TYPE IS NULL " +
                "AND SRFSVC.HP_NAME = :1 " +
                "AND EVTHE.TXN_STAT_CD = :2 " +
                "AND RS.CREATED_BY = :3 " +
                "ORDER BY EVTHE.CREATED_DATE DESC " +
                "FETCH FIRST " + limit + " ROWS ONLY";

            const bindParams = [hpName, txnStatCd, createdBy];

            try {
                const result = await ctx.executeWithConnection(async (connection) => {
                    return await connection.execute(sql, bindParams, { outFormat: oracledb.OUT_FORMAT_OBJECT });
                }, env, req);

                const data = result.rows && result.rows.length > 0
                    ? result.rows.map((row: any) => ctx.serializeOracleRow(row))
                    : [];

                res.json({
                    environment: env,
                    serviceType: service,
                    selectedColumns: requested,
                    data,
                });
                return;
            } catch (err) {
                return ctx.errorResponse(res, 500, "Failed to execute DHS query.", (err as Error).message);
            }
        }
        else if (queryId === "dhs_auth") {
            // Load filter items or defaults
            const rawDaysBack = filters.DAYS_BACK;
            let daysBack = 30;

            if (rawDaysBack !== undefined && rawDaysBack !== null && String(rawDaysBack).trim() !== "") {
                const parsed = parseInt(String(rawDaysBack).trim(), 10);
                if (Number.isNaN(parsed)) {
                    ctx.errorResponse(res, 400, "DAYS_BACK must be a number.");
                    return;
                }
                daysBack = parsed;
            }

            // Edge case
            if (daysBack < 1 || daysBack > 366) {
                ctx.errorResponse(res, 400, "DAYS_BACK must be between 1 and 366.");
                return;
            }

            // Build SELECT from all DHS columns
            const selectStr1 = Object.keys(DHS_AUTH_COLUMN_MAP).map((c) => DHS_AUTH_COLUMN_MAP[c].expr + " AS " + DHS_AUTH_COLUMN_MAP[c].alias).join(", ");

            // Base DHS SQL
            let sql =
                "SELECT " + selectStr1 + " " +
                "FROM SERVICE_HCPC H " +
                "JOIN QUEUEMANAGER.SERVICE S ON S.ID = H.QMSERVICE " +
                "JOIN QUEUEMANAGER.ACTIVITY A ON A.ID = S.ACTIVITY " +
                "WHERE H.CREATEDATE >= SYSDATE - :1 " +
                "ORDER BY H.CREATEDATE DESC " +
                "FETCH FIRST " + limit + " ROWS ONLY";

            try {
                const result = await ctx.executeWithConnection(async (connection) => {
                    return await connection.execute(sql, [daysBack], { outFormat: oracledb.OUT_FORMAT_OBJECT });
                }, env, req);

                const data = result.rows && result.rows.length > 0
                    ? result.rows.map((row: any) => ctx.serializeOracleRow(row))
                    : [];

                res.json({
                    environment: env,
                    serviceType: service,
                    selectedColumns: Object.keys(DHS_AUTH_COLUMN_MAP),
                    data,
                });
                return;
            } catch (err) {
                return ctx.errorResponse(res, 500, "Failed to execute DHS query.", (err as Error).message);
            }
        }
        else if (queryId === "dhs_documentid") {
            // Load filter items or defaults
            const hpName = (filters.HP_NAME && String(filters.HP_NAME).trim()) || "Horizon BCBS NJ";
            const txnStatCd = (filters.TXN_STAT_CD && String(filters.TXN_STAT_CD).trim()) || "S";

            // Build SELECT from all DHS columns
            const requested = Object.keys(DHS_DOCUMENT_COLUMN_MAP);
            const selectStr = requested.map((c) => DHS_DOCUMENT_COLUMN_MAP[c].expr + " AS " + DHS_DOCUMENT_COLUMN_MAP[c].alias).join(", ");

            // Base DHS SQL
            const sql =
                "SELECT " + selectStr + " " +
                "FROM DHUB_ORCH.EP_EVENT_TRACKING_HEADER EVTHE " +
                "JOIN NETWORX_OWNER.REFERRAL_SERVICES RS " +
                "  ON RS.REF_REQUEST_ID = EVTHE.REF_REQUEST_ID " +
                "JOIN SRFSVC.DHS_SERVICE_AUTH SRFSVC " +
                "  ON SRFSVC.EVENT_CORL_ID = EVTHE.EVENT_CORL_GUID " +
                "JOIN QUEUEMANAGER.ACTIVITY A " +
                "  ON A.APPTX_ID = EVTHE.REF_REQUEST_ID " +
                "OUTER APPLY ( " +
                "  SELECT Q.ID " +
                "  FROM QUEUEMANAGER.ATTACHMENT Q " +
                "  WHERE Q.ATTACHMENT_METHOD = 'Attachment' " +
                "    AND Q.ACTIVITY = A.ID " +
                "  ORDER BY Q.ID DESC " +
                "  FETCH FIRST 1 ROW ONLY " +
                ") QMA " +
                "WHERE EVTHE.TXN_STAT_CD = :1 " +
                "  AND RS.REF_AUTH_EDIT_TYPE IS NULL " +
                "  AND SRFSVC.HP_NAME = :2 " +
                "  AND QMA.ID IS NOT NULL " +
                "ORDER BY EVTHE.CREATED_DATE DESC " +
                "FETCH FIRST " + limit + " ROWS ONLY";

            try {
                const result = await ctx.executeWithConnection(async (connection) => {
                    return await connection.execute(
                        sql,
                        [txnStatCd, hpName],
                        { outFormat: oracledb.OUT_FORMAT_OBJECT }
                    );
                }, env, req);

                const data = result.rows && result.rows.length > 0
                    ? result.rows.map((row: any) => ctx.serializeOracleRow(row))
                    : [];

                res.json({
                    environment: env,
                    serviceType: service,
                    selectedColumns: requested,
                    data,
                });
                return;

            } catch (err) {
                ctx.errorResponse(res, 500, "Failed to execute DHS document query.", (err as Error).message);
                return;
            }
        }


    },

    create: async (req, res, ctx) => {
        ctx.errorResponse(res, 400, "DHS does not support create.");
        return;
    },

    delete: async (req, res, ctx) => {
        ctx.errorResponse(res, 400, "DHS does not support delete.");
        return;
    },

};

export default mod;