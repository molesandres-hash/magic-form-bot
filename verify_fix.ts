
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

function splitSessionByShift(start: string, end: string, spanDuration: number): { ora_mattina: string; ora_pomeriggio: string; workHours: number } {
    if (!start || !end) return { ora_mattina: '-', ora_pomeriggio: '-', workHours: 0 };

    const startH = parseInt(start.split(':')[0], 10);
    const endH = parseInt(end.split(':')[0], 10);

    if (startH < 13 && endH >= 14) {
        const morningEnd = '13:00';
        const afternoonStart = '14:00';

        const morningDur = calculateDurationHours(start, morningEnd);
        const afternoonDur = calculateDurationHours(afternoonStart, end);

        return {
            ora_mattina: `${start}-${morningEnd}`,
            ora_pomeriggio: `${afternoonStart}-${end}`,
            workHours: Number((morningDur + afternoonDur).toFixed(2))
        };
    }

    if (startH >= 14) {
        return { ora_mattina: '-', ora_pomeriggio: `${start}-${end}`, workHours: spanDuration };
    }

    return { ora_mattina: `${start}-${end}`, ora_pomeriggio: '-', workHours: spanDuration };
}

const cases = [
    { start: '09:00', end: '17:00' }, // Expect 7h work, 9-13, 14-17
    { start: '09:00', end: '18:00' }, // Expect 8h work, 9-13, 14-18
    { start: '09:00', end: '13:00' }, // Expect 4h work, 9-13, -
    { start: '14:00', end: '18:00' }, // Expect 4h work, -, 14-18
    { start: '12:00', end: '15:00' }, // Expect 2h work, 12-13, 14-15
];

cases.forEach(({ start, end }) => {
    const span = calculateDurationHours(start, end);
    const res = splitSessionByShift(start, end, span);
    console.log(`Start: ${start}, End: ${end} -> Work: ${res.workHours}h`);
    console.log(`  Split: ${res.ora_mattina} / ${res.ora_pomeriggio}`);
});
