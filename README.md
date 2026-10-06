# CalorieTracker v6.0.9

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
6.0.9 — 6 October 2026

## AI fallback
- Primary: `gemini-3.8-flash`
- Fallback: `gemini-3.7-flash`
- Final fallback: `gemini-3.1-flash-lite`
- Each model is attempted once per scan to limit latency during temporary service-capacity issues.


## v6.0.8
- Database-first AI matching: generic visual labels no longer silently map to a specific product.
- Added AH Oatmeal cookie as a concrete database product using current Albert Heijn nutrition data.
- Added practical portion: 1 stuk = 110 g.
- Added oatmeal/havermout aliases for stronger database matching.
- AI prompt now asks for concrete food descriptions such as havermoutkoek when visible.
- Added a one-tap practical-portion weight suggestion in the AI result editor.


## v6.0.9
- Added a one-tap “Opnieuw proberen met deze foto” action after AI analysis errors. The selected photo is kept only in memory and is not stored locally.
- Refactored AI analysis so retrying reuses the same photo without reopening the iOS photo/camera picker.
- Clarified the meal-entry modal with distinct Product and Recept section headings and descriptions.
