export const ENVIRONMENTS = ["Q1"];

export const API_ENDPOINTS = {
    SCHEMA: '/api/service-schema',
    SCHEMA_GEN: '/api/schema',
    EXECUTE: '/api/retrieve-data',
    CREATE: '/api/create-data',
    CREATE_INTAKE: '/api/create-data',
    DELETE_DATA: '/api/delete-data',
    EXTERNAL_CALL: '/api/external-call',
    TEST_RESULTS: '/api/test-results',
    RUN_TESTS: '/api/run-tests',
} as const;


export type ServiceDef = {
  value: string;
  label: string;
  capabilities: { retrieve: boolean; create: boolean; delete: boolean };
  schemaModes: { query: boolean; createIntake: boolean };
  queryVariants?: QueryVariant[]
};

export const SERVICE_DEFS: ServiceDef[] = [
  {
    value: "patient-rest-services",
    label: "Patient Rest Services",
    capabilities: { retrieve: true, create: true, delete: true },
    schemaModes: { query: true, createIntake: true },
  },
  {
    value: "dhs-webservices",
    label: "DHS Web Services",
    capabilities: { retrieve: true, create: false, delete: false },
    schemaModes: { query: true, createIntake: false },
    queryVariants: [
      { id: "dhs_referral", label: "Main DHS Referral", mode: "query" },
      { id: "dhs_auth", label: "IntakeID/Patient Number", mode: "query" },
      { id: "dhs_documentid", label: "Document ID", mode: "query" },
    ],

  },
];

export const SERVICE_TYPES = SERVICE_DEFS.map(s => ({ value: s.value, label: s.label }));


export type QueryVariant = {
  id: string;
  label: string;
  mode: "query";
};
