/* assets/js/task-id-generator.js */

// Generates IDs like: TSK-2025-DEV-A921
export function generateTaskID(category) {
    const year = new Date().getFullYear();
    
    // Map Categories to Short Codes
    const catMap = {
        "Programming": "DEV",
        "Graphic Design": "ART",
        "Video Editing": "VID",
        "Translation": "TRN",
        "Audio": "SFX",
        "General": "GEN"
    };

    const catCode = catMap[category] || "OPS";
    
    // Generate 4-char crypto-random string
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    
    return `TSK-${year}-${catCode}-${random}`;
}