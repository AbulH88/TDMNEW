import { API_ENDPOINTS } from "@/constants";
import { ResultsPayload } from "@/pages/Tests";

// basic api service for the app
// this is just to wrap our fetch calls in one place
export const apiService = {

    // Auth methods
    login: async (username: string, password: string) => {
        const response = await fetch(API_ENDPOINTS.LOGIN, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Login failed");
        }
        return await response.json();
    },

    logout: async () => {
        const response = await fetch(API_ENDPOINTS.LOGOUT, { method: "POST" });
        if (!response.ok) {
            throw new Error("Logout failed");
        }
        return await response.json();
    },

    me: async () => {
        const response = await fetch(API_ENDPOINTS.ME);
        if (!response.ok) {
            throw new Error("Not authenticated");
        }
        return await response.json();
    },

    // User management (Admin only)
    fetchUsers: async () => {
        const response = await fetch(API_ENDPOINTS.USERS);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to fetch users");
        }
        return await response.json();
    },

    createUser: async (userData: any) => {
        const response = await fetch(API_ENDPOINTS.USERS, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to create user");
        }
        return await response.json();
    },

    updateUser: async (id: string, userData: any) => {
        const response = await fetch(`${API_ENDPOINTS.USERS}/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to update user");
        }
        return await response.json();
    },

    deleteUser: async (id: string) => {
        const response = await fetch(`${API_ENDPOINTS.USERS}/${id}`, {
            method: "DELETE",
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to delete user");
        }
        return await response.json();
    },

    // get columns/schema for different services
    fetchSchema: async (environment: string, serviceType: string, mode?: string, queryId?: string) => {
        let url = API_ENDPOINTS.SCHEMA + "?environment=" + environment + "&serviceType=" + serviceType;

        if (mode) url += "&mode=" + mode;
        if (queryId) url += "&queryId=" + queryId;

        const response = await fetch(url);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to fetch schema");
        }
        return await response.json();
    },


    // run a query based on selected columns and filters
    executeQuery: async (environment: string, serviceType: string, selectedColumnNames: string[], filters?: any, rowCount?: number, queryId?: string) => {
        const response = await fetch(API_ENDPOINTS.EXECUTE, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                environment: environment,
                serviceType: serviceType,
                selectedColumnNames: selectedColumnNames,
                filters: filters || {},
                rowCount: rowCount || 1,
                queryId: queryId,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Query failed");
        }
        return await response.json();
    },

  // old create data call (generic)
  createData: async (environment: string, serviceType: string, dataFields: any[]) => {
    try {
        const response = await fetch(API_ENDPOINTS.CREATE, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ environment, serviceType, dataFields }),
        });
        
        const text = await response.text();
        
        let data;
        try {
            data = JSON.parse(text);
        } catch (parseError) {
            console.error("Failed to parse JSON. Response text:", text.substring(0, 500));
            throw new Error(`Received non-JSON response (Status: ${response.status}). Body: ${text.substring(0, 100)}...`);
        }

        if (!response.ok) {
            throw new Error(data.error || `Server error: ${response.status}`);
        }
        return data;
    } catch (err) {
        throw err;
    }
  },

  // intake specific creation
  createIntakeData: async (environment: string, serviceType: string, dataFields?: any) => {
    try {
        const body: any = { 
            environment: environment, 
            serviceType: serviceType 
        };
        if (dataFields) {
            body.dataFields = dataFields;
        }

        const response = await fetch(API_ENDPOINTS.CREATE_INTAKE, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        
        const text = await response.text();
        
        let data;
        try {
            data = JSON.parse(text);
        } catch (parseError) {
            console.error("Failed to parse JSON. Response text:", text.substring(0, 500));
            throw new Error(`Received non-JSON response (Status: ${response.status}). Body: ${text.substring(0, 100)}...`);
        }

        if (!response.ok) {
            throw new Error(data.error || `Server error: ${response.status}`);
        }
        return data;
    } catch (err) {
        throw err;
    }
  },

  deleteData: async (environment: string, serviceType: string, patientNumber: string) => {
    try {
        const response = await fetch(API_ENDPOINTS.DELETE_DATA, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                environment: environment, 
                serviceType: serviceType, 
                patientNumber: patientNumber 
            }),
        });
        
        const text = await response.text();
        
        let data;
        try {
            data = JSON.parse(text);
        } catch (parseError) {
            console.error("Failed to parse JSON. Response text:", text.substring(0, 500));
            throw new Error(`Received non-JSON response (Status: ${response.status}). Body: ${text.substring(0, 100)}...`);
        }

        if (!response.ok) {
            throw new Error(data.error || `Server error: ${response.status}`);
        }
        return data;
    } catch (err) {
        throw err;
    }
  },

    getTestResults: async (): Promise<ResultsPayload> => {
        try {
            const response = await fetch(API_ENDPOINTS.TEST_RESULTS);
            const text = await response.text();
            
            let data;
            try {
                data = JSON.parse(text);
            } catch (parseError) {
                console.error("Failed to parse JSON. Response text:", text.substring(0, 500));
                throw new Error(`Received non-JSON response (Status: ${response.status}). Body: ${text.substring(0, 100)}...`);
            }

            if (!response.ok) {
                throw new Error(data.error || `Server error: ${response.status}`);
            }
            return data;
        } catch (err) {
            throw err;
        }
    },

    runTests: async () => {
        try {
            const response = await fetch(API_ENDPOINTS.RUN_TESTS, { method: "POST" });
            const text = await response.text();
            
            let data;
            try {
                data = JSON.parse(text);
            } catch (parseError) {
                console.error("Failed to parse JSON. Response text:", text.substring(0, 500));
                throw new Error(`Received non-JSON response (Status: ${response.status}). Body: ${text.substring(0, 100)}...`);
            }
            
            return data;
        } catch (err) {
            throw err;
        }
    },


};
