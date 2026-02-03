/* assets/js/id-generator.js */
// THE TITAN SERIAL GENERATOR (5-CLASS SYSTEM)
// STATUS: RECONFIGURED FOR ADMN / CON / OPS / FRE / STD

// 1. JORDANIAN UNIVERSITY CODES
const UNI_CODES = {
    "Middle East University": "MEU",
    "University of Jordan": "UJ",
    "Jordan University of Science and Technology": "JUST",
    "Hashemite University": "HU",
    "Yarmouk University": "YU",
    "Mutah University": "MUT",
    "Al-Balqa Applied University": "BAU",
    "Al-Zarqa University": "ZU",
    "Princess Sumaya University": "PSUT",
    "German Jordanian University": "GJU",
    "Al-Ahliyya Amman University": "AAU",
    "Petra University": "UOP",
    "Applied Science Private University": "ASU",
    "Philadelphia University": "PU",
    "Isra University": "IU",
    "Jadara University": "JAD",
    "Jerash University": "JER",
    "Ajloun National University": "ANU",
    "Irbid National University": "INU",
    "Aqaba University of Technology": "AUT",
    "Hussein Bin Talal University": "AHU",
    "Tafila Technical University": "TTU",
    "World Islamic Sciences": "WISE",
    "Headquarters": "HQ", // For Admin
    "Corporate": "CORP",  // For Contractors
    "Other": "EXT"
};

// 2. NATIONALITY CODES
const NAT_CODES = {
    "Jordan": "JO", "Palestine": "PS", "Lebanon": "LB", "Israel": "IL",
    "Egypt": "EG", "Saudi Arabia": "SA", "Oman": "OM", "Kuwait": "KU",
    "UAE": "UAE", "Yemen": "YMN", "Syria": "SYR", "Iraq": "IRQ",
    "Bahrain": "BHR", "Qatar": "QTR", "Iran": "IRN", "Other": "INT"
};

// 3. THE GENERATOR FUNCTION
export function generateTitanID(data) {
    
    // A. MEMBER TYPE (The Hierarchy)
    let typeCode = "STD"; // Default
    
    switch(data.role) {
        case 'admin': 
            typeCode = "ADMN"; 
            break;
        case 'contractor': 
            typeCode = "CON"; 
            break;
        case 'operative': 
            typeCode = "OPS"; 
            break;
        case 'freelancer': 
            typeCode = "FRE"; 
            break;
        case 'student': 
        default:
            typeCode = "STD"; 
            break;
    }

    // B. DATE (DDMMYY)
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    const dateCode = `${day}${month}${year}`;

    // C. INITIATE NUMBER (6 Digits)
    // Admin gets a low number priority if generating via script
    const initNum = data.role === 'admin' 
        ? '000001' 
        : Math.floor(100000 + Math.random() * 900000);

    // D. GENDER (M/F)
    const gender = (data.gender === 'Female') ? 'F' : 'M';

    // E. NATIONALITY
    const nat = NAT_CODES[data.nationality] || "JO";

    // F. ACADEMY / ORG TYPE
    let acadType = "UNI"; // Default
    if (data.role === 'admin') acadType = "HQ";
    if (data.role === 'contractor') acadType = "COMP"; // Company
    if (data.role === 'operative') acadType = "SPEC";  // Special Ops
    if (data.education_level === "Highschool") acadType = "HS";
    if (data.education_level === "Academy") acadType = "ACAD";
    
    // G. ACADEMY NAME / BRANCH
    let uniCode = UNI_CODES[data.university] || "EXT";
    if (data.role === 'admin') uniCode = "CMD"; // Command
    if (data.role === 'contractor') uniCode = "BIZ"; // Business

    // --- ASSEMBLY ---
    // Example Admin: ADMN-020226-000001-M-JO-HQ-CMD
    return `${typeCode}-${dateCode}-${initNum}-${gender}-${nat}-${acadType}-${uniCode}`;
}