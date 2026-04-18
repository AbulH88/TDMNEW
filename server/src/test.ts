import { test, describe} from "node:test";
import assert from "node:assert/strict";
import request from "supertest";

import { app } from "./index";

const env = "Q1";
const serviceType = "patient-rest-services";


describe("Data Retrieval - POST /api/retrieve-data", () => {
    
    test("Returns 400 when required params are missing", async () => {
        const res = await request(app)
            .post("/api/retrieve-data")
            .send({});
        assert.equal(res.status, 400);
        assert.equal(res.body.error, "missing required params.");
    });

    test("Retrieves data given lastname contains 'LAST'", async () => {
        // Mock up payload
        const reqBody = {
            environment: env,
            serviceType: serviceType,
            selectedColumnNames: ["zip", "dob", "firstname", "lastname", "insphone", "subscriberid"],
            filters: {
                lastname: "LAST"
            }
        };

        // Send request
        const res = await request(app)
            .post("/api/retrieve-data")
            .send(reqBody);

        // Validate response fields and data from db
        assert.equal(res.status, 200);
        assert.equal(res.body.environment, env);
        assert.equal(res.body.serviceType, serviceType);
        assert.deepEqual(res.body.selectedColumns, ["zip", "dob", "firstname", "lastname", "insphone", "subscriberid"]);
        assert.ok(res.body.data);
        assert.ok(res.body.data.length >= 1);
        assert.ok(res.body.data[0].LASTNAME.includes("LAST"));
    });

    test("Negative scenario - assumes no data will be retrieved with firstname 'negativeScenarioNoData'", async () => {
        // Mock up payload
        const reqBody = {
            environment: env,
            serviceType: serviceType,
            selectedColumnNames: ["zip", "dob", "firstname", "lastname", "insphone", "subscriberid"],
            filters: {
                firstname: "negativeScenarioNoData"
            }
        };

        // Send request
        const res = await request(app)
            .post("/api/retrieve-data")
            .send(reqBody);

        // Validate response fields and data from db
        assert.equal(res.status, 200);
        assert.equal(res.body.environment, env);
        assert.equal(res.body.serviceType, serviceType);
        assert.deepEqual(res.body.selectedColumns, ["zip", "dob", "firstname", "lastname", "insphone", "subscriberid"]);
        assert.deepStrictEqual(res.body.data, []);
    });
});

describe("Data Create - POST /api/create-data", () => {

    test("Returns 400 when required params are missing", async () => {
        const res = await request(app)
            .post("/api/create-data")
            .send({});
        assert.equal(res.status, 400);
        assert.equal(res.body.error, "environment and serviceType are required.");
    });

    test("Creates intake data using basic sample payload", async () => {
        const reqBody = {
            environment: env,
            serviceType: serviceType
        };

        const res = await request(app)
            .post("/api/create-data")
            .send(reqBody);

        assert.equal(res.status, 200);
        assert.ok(res.body.data);
    });

    test("Creates intake data using payload with parameters", async () => {
        const reqBody = {
            environment: env,
            serviceType: serviceType,
            dataFields: { firstname: "TESTSAMPLE" }
        };

        const res = await request(app)
            .post("/api/create-data")
            .send(reqBody);

        assert.equal(res.status, 200);
        assert.ok(res.body.data);
        assert.equal(res.body.data[0].INSFIRSTNAME?.toUpperCase(), "TESTSAMPLE");
    });
});

describe("Data Delete - POST /api/delete-data", () => {
    
    test("Returns 400 when required params are missing", async () => {
        const res = await request(app)
            .post("/api/delete-data")
            .send({});
        assert.equal(res.status, 400);
        assert.equal(res.body.error, "environment and serviceType are required.");
    });
    
    test("Returns 500 when patientnumber is null", async () => {
        const res = await request(app)
            .post("/api/delete-data")
            .send({"environment": env, "serviceType": serviceType, "patientNumber": null});
        assert.equal(res.status, 500);
        assert.equal(res.body.error, "Unable to delete data - Validations for patientnumber failed (null, empty, or contains non-numeric values)");
    });
    test("Returns 500 when patientnumber is empty", async () => {
        const res = await request(app)
            .post("/api/delete-data")
            .send({"environment": env, "serviceType": serviceType, "patientNumber": ""});
        assert.equal(res.status, 500);
        assert.equal(res.body.error, "Unable to delete data - Validations for patientnumber failed (null, empty, or contains non-numeric values)");
    });
    test("Returns 500 when patientnumber is non-numeric", async () => {
        const res = await request(app)
            .post("/api/delete-data")
            .send({"environment": env, "serviceType": serviceType, "patientNumber": "abc123"});
        assert.equal(res.status, 500);
        assert.equal(res.body.error, "Unable to delete data - Validations for patientnumber failed (null, empty, or contains non-numeric values)");
    });
    test("Returns 500 when record not found (non-existent patientnumber)", async () => {
        const res = await request(app)
            .post("/api/delete-data")
            .send({"environment": env, "serviceType": serviceType, "patientNumber": "1231232212"});
        assert.equal(res.status, 500);
        assert.equal(res.body.error, "Unable to delete data - Record does not exist, unable to find with patient number");
    });
});

describe("End-to-End Flow - create, retrieve, and delete data", () => {
    test("Creates a patient, retrieves it, and deletes it", async () => {
            // Generate name to be used throughout scenario
            const uniqueFirstName = `E2E_${Date.now()}`;

            // CREATE
            const createRes = await request(app)
                .post("/api/create-data")
                .send({
                    environment: env,
                    serviceType,
                    dataFields: { firstname: uniqueFirstName },
                });
            assert.equal(createRes.status, 200);
            assert.ok(createRes.body?.data);

            // Extract patientNumber from created data (with null checks)
            const created = createRes.body.data;
            const patientNumber = created[0]?.PATIENTNUMBER ?? null;
            assert.ok(patientNumber);
            assert.ok(/^\d+$/.test(String(patientNumber))); //regex to test patientnumber is numeric

            // RETRIEVE
            const retrieveRes = await request(app)
                .post("/api/retrieve-data")
                .send({
                    environment: env,
                    serviceType,
                    selectedColumnNames: ["patientnumber", "firstname"],
                    filters: {
                        patientnumber: String(patientNumber),
                        firstname: uniqueFirstName,
                    },
                });
            assert.equal(retrieveRes.status, 200);
            assert.equal(retrieveRes.body.environment, env);
            assert.equal(retrieveRes.body.serviceType, serviceType);
            assert.ok(retrieveRes.body.data);
            assert.ok(Array.isArray(retrieveRes.body.data) && retrieveRes.body.data.length >= 1);

            // Validate first name
            const row0 = retrieveRes.body.data[0];
            const gotFirst = row0.FIRSTNAME ?? row0.INSFIRSTNAME;
            if (gotFirst) {
                assert.equal(gotFirst.toUpperCase(), uniqueFirstName.toUpperCase());
            }

            // Validate patient number
            const gotPatientNumber = row0.PATIENTNUMBER ?? row0.patientNumber ?? row0.patientnumber;
            if (gotPatientNumber) {
                assert.equal(String(gotPatientNumber), String(patientNumber));
            }

            // DELETE
            const deleteRes = await request(app)
                .post("/api/delete-data")
                .send({
                    environment: env,
                    serviceType,
                    patientNumber: String(patientNumber),
                });
            assert.equal(deleteRes.status, 200);

            // VERIFY RECORDS DELETED
            const afterRes = await request(app)
                .post("/api/retrieve-data")
                .send({
                    environment: env,
                    serviceType,
                    selectedColumnNames: ["patientnumber"],
                    filters: { patientnumber: String(patientNumber) },
                });
            assert.equal(afterRes.status, 200);
            const noDataReturned = afterRes.body.data === null || (Array.isArray(afterRes.body.data) && afterRes.body.data.length === 0);
            assert.ok(noDataReturned);
        }
    );
});