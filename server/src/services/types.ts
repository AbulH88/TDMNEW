import type { Request, Response } from "express";
import type oracledb from "oracledb";

export type SchemaMode = "query" | "create-intake";

export type ServiceContext = {
  executeWithConnection: <T>(cb: (c: oracledb.Connection) => Promise<T>, env: string) => Promise<T>;
  errorResponse: (res: Response, status: number, error: string, details?: string) => void;
  serializeOracleRow: (row: any) => Record<string, any>;
  normalizeDob: (x: unknown) => string;
  normalizeUsPhone: (x: unknown) => string;
  snakeToCamel: (str: string) => string;
  generateRandom: (length: number) => string;
  generatePatientNumber: () => string;
  generateZipCode: () => string;
  generateSubscriberId: () => string;
  generateIntakeId: () => string;
  generatePhoneNumber: () => string;
  generateRandomName: (prefix: string) => string;
  generateDob: () => string;
  getColumnType: (columnName: string) => string;
};

export type ServiceCapabilities = {
  retrieve: boolean;
  create: boolean;
  delete: boolean;
};

export type ServiceModule = {
  serviceType: string;
  label: string;
  capabilities: ServiceCapabilities;

  getSchema: (req: Request, res: Response, ctx: ServiceContext) => Promise<void> | void;
  retrieve: (req: Request, res: Response, ctx: ServiceContext) => Promise<void> | void;
  create: (req: Request, res: Response, ctx: ServiceContext) => Promise<void> | void;
  delete: (req: Request, res: Response, ctx: ServiceContext) => Promise<void> | void;
};