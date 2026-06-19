const BEREINIGEN = {
    Tabs: ["Alle", "Redundanz", "Ballast", "Struktur"],
    Name: "Bereinigen"
    }

const KRITISCH = 
    {Tabs: ["Alle", "CWE-20", "CWE-532", "CWE-284"], Name: "Kritisch"};

const HOCH = {Tabs: ["Alle", "CWE-89", "CWE-78", "CWE-200"], Name: "Hoch"};

const MITTEL = {Tabs: ["Alle", "CWE-79", "CWE-22", "CWE-287"], Name: "Mittel"};

const NIEDRIG = {Tabs: ["Alle", "CWE-94", "CWE-502", "CWE-400"], Name: "Niedrig"};

const OPTIMIEREN = {Tabs: ["Alle", "Bundle", "Performance", "Architektur", "API-Effizienz"], Name: "Optimieren"};

const TABS = {
    B: BEREINIGEN,
    K: KRITISCH,
    H: HOCH,
    M: MITTEL,
    N: NIEDRIG,
    O: OPTIMIEREN
}

export default TABS;