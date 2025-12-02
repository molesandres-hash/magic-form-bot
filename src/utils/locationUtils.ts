/**
 * Utility functions for handling address and location logic.
 * 
 * Rules:
 * 1. SEDE_INDIRIZZO:
 *    - Must always contain full address + city.
 *    - Format: "Via/Piazza + number, CAP (if available), City"
 *    - If city is missing in input, deduce it from context or standard locations.
 * 
 * 2. VERBALE_LUOGO:
 *    - Must contain ONLY the city name.
 *    - No address, street, CAP, or neighborhood.
 * 
 * 3. STANDARD LOCATIONS:
 *    - "Porta Venezia" -> City: "Milano"
 *    - "Porta Romana" -> City: "Milano"
 */

export const STANDARD_LOCATIONS: Record<string, string> = {
    'porta venezia': 'Milano',
    'porta romana': 'Milano',
    'milano': 'Milano',
    'roma': 'Roma',
    'torino': 'Torino',
    'napoli': 'Napoli'
};

/**
 * Deduce city from address string or explicit city input.
 */
export function deduceCity(address: string, explicitCity?: string): string | null {
    if (explicitCity) return explicitCity;
    if (!address) return null;

    const lowerAddr = address.toLowerCase();

    // Check standard locations
    for (const [key, city] of Object.entries(STANDARD_LOCATIONS)) {
        if (lowerAddr.includes(key)) {
            return city;
        }
    }

    // Simple heuristic: check if address ends with a city name (common format)
    // This is a basic fallback and might need refinement
    // For now, we rely mostly on explicit city or standard locations
    return null;
}

/**
 * Formats the full address for SEDE_INDIRIZZO.
 * @param address The raw address string (e.g., "Via Roma 1", "Porta Venezia")
 * @param explicitCity Optional city name if known from other fields
 */
export function formatSedeIndirizzo(address: string, explicitCity?: string): string {
    if (!address) return '';

    const city = deduceCity(address, explicitCity);

    // If we have a city, ensure it's in the string
    if (city) {
        // If address already contains the city (case-insensitive check), return as is (maybe just fix casing?)
        // But user wants "Via ..., City".

        // Check if address is JUST a standard location name (e.g. "Porta Venezia")
        const lowerAddr = address.toLowerCase();
        const isStandardLocationOnly = Object.keys(STANDARD_LOCATIONS).some(k => k === lowerAddr && k !== city.toLowerCase());

        if (isStandardLocationOnly) {
            return `${address}, ${city}`;
        }

        if (!lowerAddr.includes(city.toLowerCase())) {
            return `${address}, ${city}`;
        }
    }

    return address;
}

/**
 * Gets the city name for VERBALE_LUOGO.
 * @param address The raw address string
 * @param explicitCity Optional city name if known
 */
export function getVerbaleLuogo(address: string, explicitCity?: string): string {
    const city = deduceCity(address, explicitCity);
    return city || ''; // Return empty if unknown, user said "NON inventare una città" if really unknown, but for verbale_luogo we need just city.
}
