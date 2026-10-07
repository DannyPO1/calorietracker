# CalorieTracker v6.2.1

AI-fotoscan met Google Gemini en database-first voedingsregistratie.

## v6.2.1
- AI-scan ondersteunt naast gram ook een hoeveelheid in stuks wanneer het gekoppelde product een betrouwbare stuk-portie heeft.
- De app toont en gebruikt het gewicht per stuk; dit is aanpasbaar.
- Calorieën en macro’s blijven volledig gebaseerd op het gekoppelde product uit de voedingsdatabase.
- Bij registratie wordt bij stuks de gekozen hoeveelheid als `stuks` opgeslagen en het omgerekende gewicht apart bewaard.

## AI-fotoscan
- Gebruikt Gemini 3.1 Flash-Lite als AI-model.
- Foto wordt niet lokaal opgeslagen.
- De gebruiker controleert altijd herkenning, productkoppeling en hoeveelheid.
- Dezelfde foto kan na een fout opnieuw worden geprobeerd.

## Vercel
- Deploy this repository on Vercel.
- In Vercel Production Environment Variables, set `GEMINI_API_KEY`.
- The frontend calls `/api/analyze-food` on the Vercel deployment when opened on the Vercel domain, and calls the configured production Vercel endpoint from GitHub Pages.

## GitHub Pages
The existing GitHub Pages frontend remains supported.

## Privacy
The photo is sent to Google Gemini for analysis. CalorieTracker does not store the photo locally. Nutrition values are calculated from the app's own food database after the user reviews and confirms the detected products.

## Release
Version 6.2.1 — 7 October 2026
