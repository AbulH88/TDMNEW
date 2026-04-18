import type { ServiceModule } from "./types";
import patientRestServices from "./patient-rest-services";
import dhs from "./dhs-webservices";

export const SERVICE_REGISTRY: Record<string, ServiceModule> = {
  [patientRestServices.serviceType]: patientRestServices,
  [dhs.serviceType]: dhs,
};

export const isKnownServiceType = (serviceType: string) => !!SERVICE_REGISTRY[serviceType];
export const getService = (serviceType: string) => SERVICE_REGISTRY[serviceType];
export const allowedServiceTypes = () => Object.keys(SERVICE_REGISTRY);
