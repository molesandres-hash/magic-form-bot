import { CourseData, Modulo, Sessione } from "@/types/courseData";

export const getStudentTaxCodes = (data: CourseData): string => {
    if (!data.partecipanti || data.partecipanti.length === 0) return "";
    return data.partecipanti
        .map((p) => p.codice_fiscale)
        .filter((cf) => cf) // Filter out empty ones
        .join("\n");
};

export const getTeacherEmail = (data: CourseData): string => {
    if (!data.trainer) return "nome.cognome@akgitalia.it";
    const nome = data.trainer.nome?.toLowerCase().replace(/\s+/g, '') || "nome";
    const cognome = data.trainer.cognome?.toLowerCase().replace(/\s+/g, '') || "cognome";
    return `${nome}.${cognome}@akgitalia.it`;
};

export const getStudentEmails = (data: CourseData): string => {
    if (!data.partecipanti || data.partecipanti.length === 0) return "";
    return data.partecipanti
        .map((p) => p.email)
        .filter((e) => e)
        .join(";");
};

export const getZoomDetails = (data: CourseData): string => {
    const link = data.calendario_fad?.piattaforma || "Link non disponibile";
    const meetingId = data.calendario_fad?.id_riunione ? `ID Riunione: ${data.calendario_fad.id_riunione}` : "";
    const passcode = data.calendario_fad?.passcode ? `Passcode: ${data.calendario_fad.passcode}` : "";

    let details = `Link Zoom: ${link}`;
    if (meetingId) details += `\n${meetingId}`;
    if (passcode) details += `\n${passcode}`;

    return details;
};

export const generateEmailData = (data: CourseData) => {
    const to = getTeacherEmail(data);
    const bcc = getStudentEmails(data);
    const subject = "LINK LEZIONE";
    const zoomDetails = getZoomDetails(data);
    const body = `Buongiorno,\n\nIl link alla lezione è:\n${zoomDetails}\n\nCordiali saluti.`;

    return { to, bcc, subject, body };
};

export const generateICSContent = (data: CourseData): string => {
    const events: { date: Date; title: string; description: string }[] = [];

    // Helper to parse date dd/mm/yyyy
    const parseDate = (dateStr: string): Date | null => {
        if (!dateStr) return null;
        const parts = dateStr.split('/');
        if (parts.length !== 3) return null;
        // Month is 0-indexed in JS
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    };

    // Helper to find last Thursday in a list of sessions
    const findLastThursday = (sessions: Sessione[]): Sessione | null => {
        if (!sessions || sessions.length === 0) return null;

        // Filter for Thursdays
        // Assuming giorno_settimana is like "Giovedì" or "Thursday"
        // Better to check the date object to be safe, but let's use the string first if reliable
        // Or just parse the date and check getDay() === 4 (Thursday)

        const thursdays = sessions.filter(s => {
            const d = parseDate(s.data_completa);
            return d && d.getDay() === 4;
        });

        if (thursdays.length === 0) return null;

        // Sort by date descending to get the last one
        thursdays.sort((a, b) => {
            const da = parseDate(a.data_completa);
            const db = parseDate(b.data_completa);
            return (db?.getTime() || 0) - (da?.getTime() || 0);
        });

        return thursdays[0];
    };

    // Logic to find relevant sessions
    let relevantSessions: Sessione[] = [];

    if (data.moduli && data.moduli.length > 0) {
        // If modules exist, find last Thursday for EACH module
        data.moduli.forEach(modulo => {
            const lastThursday = findLastThursday(modulo.sessioni);
            if (lastThursday) {
                // Create event
                const date = parseDate(lastThursday.data_completa);
                if (date) {
                    // Set time to 10:15
                    date.setHours(10, 15, 0, 0);
                    events.push({
                        date,
                        title: "INSERIRE PRESENZE SAUL 360",
                        description: `Ricordati di inserire le presenze per il modulo ${modulo.titolo || ''}`
                    });
                }
            }
        });
    } else {
        // Single course, find last Thursday of all sessions
        const lastThursday = findLastThursday(data.sessioni);
        if (lastThursday) {
            const date = parseDate(lastThursday.data_completa);
            if (date) {
                date.setHours(10, 15, 0, 0);
                events.push({
                    date,
                    title: "INSERIRE PRESENZE SAUL 360",
                    description: "Ricordati di inserire le presenze su SAUL 360"
                });
            }
        }
    }

    // Generate ICS content
    let ics = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Magic Form Bot//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH"
    ].join("\r\n");

    events.forEach(event => {
        const formatDate = (d: Date) => {
            return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        };

        // End time 15 mins later? Or just an instant? Let's make it 15 mins.
        const endDate = new Date(event.date);
        endDate.setMinutes(endDate.getMinutes() + 15);

        const eventBlock = [
            "BEGIN:VEVENT",
            `DTSTART:${formatDate(event.date)}`,
            `DTEND:${formatDate(endDate)}`,
            `SUMMARY:${event.title}`,
            `DESCRIPTION:${event.description}`,
            "STATUS:CONFIRMED",
            "END:VEVENT"
        ].join("\r\n");

        ics += "\r\n" + eventBlock;
    });

    ics += "\r\nEND:VCALENDAR";

    return ics;
};
