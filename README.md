# CalorieTracker v6.2.7

## Release notes — v6.2.7

**Datum:** 7 oktober 2026

### Dashboard – dark theme
- Het dashboard op **Vandaag** is in dark mode visueel donkerder en consistenter gemaakt.
- Het frame van het dashboard sluit beter aan op de donkere achtergrond.
- De macro-/statistieksectie heeft een donkere achtergrond gekregen in plaats van een lichte/grijze vlakverdeling.
- De scheidingslijnen zijn subtieler gemaakt.
- De sectie **Dagvoortgang** onderaan het dashboard gebruikt nu eveneens een donkere achtergrond.
- De groene voortgangsbalk en belangrijkste accentkleuren zijn behouden voor voldoende contrast.
- De lichte modus is niet gewijzigd.
- De gekleurde maaltijdkaarten blijven hun eigen kleurstelling behouden.

## Huidige AI-fotoscan
- Voedingsherkenning via **Gemini 3.1 Flash-Lite**.
- Foto's worden niet lokaal door CalorieTracker opgeslagen.
- De gebruiker controleert zelf de herkenning, koppeling, hoeveelheid en registratie.
- Een mislukte analyse kan opnieuw worden uitgevoerd met dezelfde foto.
- Voedingswaarden worden berekend vanuit de eigen voedingsdatabase; AI-voedingswaarden worden niet gebruikt.

## Voedingsdatabase
- Producten kunnen een optioneel **stukgewicht** hebben, bijvoorbeeld `1 stuk = 110 g`.
- Stukgewichten kunnen voor standaardproducten worden ingesteld en voor eigen producten worden opgeslagen.
- Bij de AI-scan kan, wanneer een stukgewicht beschikbaar is, een hoeveelheid in **stuks** worden gebruikt.

## Registratie
- Herkennen, koppelen en registreren zijn afzonderlijke stappen.
- Niet alle herkende producten hoeven te worden geregistreerd; de gebruiker bepaalt zelf wat daadwerkelijk is gegeten.
- Ongekoppelde producten kunnen worden gekoppeld aan een bestaand product of als eigen product worden toegevoegd.

## Installatie en deployment
- Geschikt voor gebruik als webapp/PWA op iPhone.
- GitHub Pages blijft ondersteund voor de frontend.
- Voor de AI-fotoscan is een Vercel deployment met de environment variable `GEMINI_API_KEY` vereist.

## Privacy
De gekozen foto wordt voor analyse naar Google Gemini gestuurd. CalorieTracker slaat de foto niet lokaal op. Voedingswaarden worden na controle berekend vanuit de voedingsdatabase van de app.
