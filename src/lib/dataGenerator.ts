import type { DataField } from "@/components/DataRow";

// sample data for generation
const FIRST_NAMES = ["James", "Emma", "Michael", "Olivia", "William", "Ava", "Alexander", "Sophia", "Daniel", "Isabella", "David", "Mia", "Joseph", "Charlotte", "Andrew", "Amelia"];
const LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Wilson", "Anderson", "Thomas", "Taylor"];
const DOMAINS = ["gmail.com", "yahoo.com", "outlook.com", "example.com", "test.org", "company.io"];
const STREETS = ["Main St", "Oak Ave", "Maple Dr", "Cedar Ln", "Pine Rd", "Elm Blvd", "Park Way", "Lake View"];
const CITIES = ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego"];
const REGIONS = ["California", "Texas", "Florida", "New York", "Pennsylvania", "Illinois", "Ohio", "Georgia"];

// random helpers
const getRandomItem = (arr: any[]) => {
    return arr[Math.floor(Math.random() * arr.length)];
};

const getRandomNumber = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

const getDigits = (n: number) => {
    let res = "";
    for (let i = 0; i < n; i++) res += Math.floor(Math.random() * 10);
    return res;
};

// logic to create a random value based on field type
const createValue = (field: DataField): string => {
  const type = field.type;
  const opt = field.option;

  if (type === "names") {
    const f = getRandomItem(FIRST_NAMES);
    const l = getRandomItem(LAST_NAMES);
    if (opt === "First name") return f;
    if (opt === "Last name") return l;
    return f + " " + l;
  }

  if (type === "phone") {
    if (opt === "###-####") return getDigits(3) + "-" + getDigits(4);
    return "+1 " + getDigits(3) + "-" + getDigits(3) + "-" + getDigits(4);
  }

  if (type === "email") {
    const user = getRandomItem(FIRST_NAMES).toLowerCase() + getRandomNumber(1, 99);
    return user + "@" + getRandomItem(DOMAINS);
  }

  if (type === "address") {
    return getRandomNumber(100, 999) + " " + getRandomItem(STREETS) + ", " + getRandomItem(CITIES);
  }

  if (type === "postal") {
    return getDigits(5);
  }

  if (type === "date") {
    const d = new Date();
    d.setDate(d.getDate() - getRandomNumber(1, 2000)); // random date in last ~5 years
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    
    if (opt === "MM/DD/YYYY") return month + "/" + day + "/" + year;
    if (opt === "DD/MM/YYYY") return day + "/" + month + "/" + year;
    return year + "-" + month + "-" + day;
  }

  if (type === "subscriber_id") {
    const letters = "ABC"; // simplified
    let res = "";
    for (let i = 0; i < 3; i++) res += letters[Math.floor(Math.random() * letters.length)];
    return res + getDigits(7);
  }

  return "";
};

// main export to generate a block of data
export const generateData = (fields: DataField[], rows: number, format: string): string => {
  const activeFields = fields.filter(f => f.checked);
  const resultData = [];

  // build the rows
  for (let i = 0; i < rows; i++) {
    const row: any = {};
    for (let j = 0; j < activeFields.length; j++) {
      const f = activeFields[j];
      const key = f.propertyName || f.type;
      row[key] = f.value ? f.value : createValue(f);
    }
    resultData.push(row);
  }

  // format the output
  if (format === "json") {
    return JSON.stringify(resultData, null, 2);
  }
  
  if (format === "csv") {
    const headers = activeFields.map(f => f.propertyName || f.type);
    let csv = headers.join(",") + "\n";
    for (let i = 0; i < resultData.length; i++) {
        const vals = headers.map(h => '"' + resultData[i][h] + '"');
        csv += vals.join(",") + "\n";
    }
    return csv;
  }
  
  if (format === "pipe") {
    const headers = activeFields.map(f => f.propertyName || f.type);
    let res = headers.join("|") + "\n";
    for (let i = 0; i < resultData.length; i++) {
        const vals = headers.map(h => resultData[i][h]);
        res += vals.join("|") + "\n";
    }
    return res;
  }

  return JSON.stringify(resultData, null, 2);
};
