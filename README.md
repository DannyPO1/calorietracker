# CalorieTracker v6.2.17

Persoonlijke calorie- en voedingsregistratie voor iPhone/Safari. Gegevens worden lokaal op dit apparaat opgeslagen; een account is niet nodig.

## Release notes — v6.2.17

### Herkomst van AI-resultaten
- De AI-fotoscan toont nu of het resultaat van Gemini of Gemma via OpenRouter komt.
- Privacy-informatie verduidelijkt dat de foto wordt verwerkt door de provider die de analyse uitvoert.

### AI-analyse behouden bij product toevoegen
- De AI-analyse blijft bewaard wanneer je een niet-gekoppeld product zelf wilt toevoegen.
- Annuleren in het scherm voor een eigen product brengt je terug naar dezelfde AI-analyse, zonder opnieuw een foto te maken.

### Product koppelen via barcode
- Bij een niet-gekoppeld AI-resultaat kun je nu de barcode scannen of handmatig invoeren.
- De app zoekt het product op via Open Food Facts en laat je het gevonden product direct aan het AI-resultaat koppelen.
- Het product wordt aan je eigen productdatabase toegevoegd als het nog niet bestond.

### Technisch
- Applicatieversie bijgewerkt naar **v6.2.17**.
- Service-workercache bijgewerkt naar **6.2.17**.
- De Gemini → OpenRouter-fallback blijft behouden; API-sleutels blijven uitsluitend server-side in Vercel.

## Deployment
Upload `CalorieTracker-iPhone-v6.2.17.zip` naar de repository en commit de ZIP. De bestaande GitHub Actions-workflow installeert de release, maakt de releasecommit en tag `v6.2.17`.
