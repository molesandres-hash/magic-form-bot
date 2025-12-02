
function calculateDurationHours(start: string, end: string): number {
    if (!start || !end) return 0;
    const [h1, m1] = start.split(':').map(Number);
    const [h2, m2] = end.split(':').map(Number);
    if (Number.isNaN(h1) || Number.isNaN(h2)) return 0;

    const startHours = h1 + (Number.isNaN(m1) ? 0 : m1 / 60);
    const endHours = h2 + (Number.isNaN(m2) ? 0 : m2 / 60);
    const diff = endHours - startHours;
    return diff > 0 ? Number(diff.toFixed(2)) : 0;
}

function splitSessionByShift(start: string, end: string, duration: number): { ora_mattina: string; ora_pomeriggio: string } {
    if (duration >= 8) {
        return { ora_mattina: '9:00-13:00', ora_pomeriggio: '14:00-18:00' };
    }

    const range = `${start}-${end}`;

    const startHour = parseInt((start || '0').split(':')[0] || '0', 10);
    if (!Number.isNaN(startHour) && startHour < 14) {
        return { ora_mattina: range, ora_pomeriggio: '-' };
    }

    return { ora_mattina: '-', ora_pomeriggio: range };
}

// Test cases
const cases = [
    { start: '09:00', end: '18:00' }, // 9h span -> Expect 8h work? Current code: >=8 -> 9-13, 14-18 (8h)
    { start: '09:00', end: '17:00' }, // 8h span -> Expect 7h work? Current code: >=8 -> 9-13, 14-18 (8h) - THIS IS THE BUG
    { start: '09:00', end: '13:00' }, // 4h span
    { start: '14:00', end: '18:00' }, // 4h span
];

cases.forEach(({ start, end }) => {
    const duration = calculateDurationHours(start, end);
    const split = splitSessionByShift(start, end, duration);
    console.log(`Start: ${start}, End: ${end} -> Duration (Span): ${duration}`);
    console.log(`  Split: Morning=${split.ora_mattina}, Afternoon=${split.ora_pomeriggio}`);
});
