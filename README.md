# CalorieTracker v6.0.5

AI-fotoscan toegevoegd via Google Gemini.

## Vercel
- Deploy this repository on Vercel.
- In Vercel Production Environment Variables, set `GEMINI_API_KEY`.
- The frontend calls `/api/analyze-food` on the Vercel deployment when opened on the Vercel domain, and calls the configured production Vercel endpoint from GitHub Pages.

## GitHub Pages
The existing GitHub Pages frontend remains supported.

## Privacy
The photo is sent to Google Gemini for analysis. CalorieTracker does not store the photo locally. Nutrition values are calculated from the app's own food database after the user reviews and confirms the detected products.

## Version
6.0.0 — 6 October 2026
