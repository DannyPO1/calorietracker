# CalorieTracker v6.2.16

Persoonlijke calorie- en voedingsregistratie voor iPhone/Safari. Gegevens worden lokaal op dit apparaat opgeslagen; een account is niet nodig.

## Release notes — v6.2.16

### Betrouwbaardere AI-fotoscan
- Gemini 3.1 Flash-Lite blijft de primaire provider.
- Als Gemini faalt of geen bruikbaar JSON-resultaat teruggeeft, probeert de backend OpenRouter met `google/gemma-4-26b-a4b-it:free`.
- De API-sleutels blijven uitsluitend server-side in Vercel; plaats ze nooit in de frontend of in GitHub-bestanden.
- Duidelijkere afhandeling van providerfouten, time-outs en onbruikbare antwoorden.
- De AI blijft alleen voeding en geschat gewicht herkennen; voedingswaarden blijven afkomstig uit de appdatabase.

### Vercel-configuratie
Zorg dat `GEMINI_API_KEY` en `OPENROUTER_API_KEY` in Vercel zijn ingesteld voor de juiste deployment-omgevingen. Maak daarna een nieuwe Vercel-deployment.

### Technisch
- Applicatieversie bijgewerkt naar **v6.2.16**.
- Service-workercache bijgewerkt naar **6.2.16**.

## Deployment
Upload `CalorieTracker-iPhone-v6.2.16.zip` naar de repository en commit de ZIP. De bestaande GitHub Actions-workflow installeert de release, maakt de releasecommit en tag `v6.2.16`.
