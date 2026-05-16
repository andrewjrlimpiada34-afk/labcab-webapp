# **App Name**: LabKiosk Pro

## Core Features:

- Borrower Dashboard: Authenticated view for users to monitor their personal transaction history, real-time status of active borrows, and countdowns to return deadlines.
- Admin Control Hub: Secure dashboard using pre-configured credentials for laboratory facilitators to monitor all cabinet activity and live transaction feeds.
- AI Anomaly Detection Tool: A feature that uses a reasoning tool to analyze transaction logs and identify suspicious patterns, such as potential inventory discrepancies or unreturned high-value items.
- Remote Cabinet Unlock: Administrative trigger that logs remote unlock events in Firestore, providing laboratory access control without physical kiosk interaction.
- Live Inventory Tracker: Real-time sync with the 'apparatus' collection to monitor stock levels across laboratory compartments and prevent negative stock occurrences.
- Automated Report Engine: Generate and export summary reports in CSV or JSON formats based on daily or weekly transaction frequencies.
- Secure Firestore Ruleset: Updated database rules ensuring borrowers can only read their own data while admins maintain granular global access control over 'apparatus' and 'transactions' collections.

## Style Guidelines:

- Primary Color: Atomic Blue (#1AA3FF) representing laboratory precision and high-tech digital systems.
- Background Color: Obsidian Deep Blue (#0D1117) providing a high-contrast dark-mode professional dashboard aesthetic.
- Accent Color: Cyan Frost (#00F2FF) used for interactive states, badges, and important status indicators like 'In Stock'.
- Headline font: 'Space Grotesk' (sans-serif) for its technical, computerized feel; Body font: 'Inter' (sans-serif) for high legibility across dense data tables.
- Thin-line glyphs and outline-style laboratory icons representing equipment types (beakers, goggles, electronics).
- Card-based grid for the dashboard view with responsive sticky headers in tables to maintain usability across tablets and desktop workstations.
- Subtle status pulse on active borrowings and smooth transitions between admin dashboard tabs to maintain the professional interface feel.