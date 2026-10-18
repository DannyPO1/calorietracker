# CalorieTracker v6.2.21

Persoonlijke calorie- en voedingsregistratie voor iPhone/Safari. Gegevens worden lokaal op dit apparaat opgeslagen; een account is niet nodig.

## Release notes — v6.2.21

### Productnamen met speciale tekens
- Zoeken en selecteren werkt betrouwbaarder voor productnamen met apostrofs, typografische apostrofs, accenten en andere leestekens, zoals `g’woon` en `côte d’or`.
- De zoekmatching normaliseert hoofdletters, diakritische tekens, apostrofs en leestekens, zodat kleine schrijfverschillen minder snel tot geen resultaten leiden.
- Productnamen worden veilig als JavaScript-argument doorgegeven aan acties voor selecteren, bewerken en verwijderen, zodat apostrofs de bediening niet meer breken.

### Functionaliteit uit v6.2.20 behouden

### Zelf zoeken in de productdatabase vanuit fotoanalyse
- Bij ieder AI-herkend voedingsmiddel kan de gebruiker rechtstreeks in de bestaande productdatabase zoeken.
- Zoekresultaten tonen de productnaam en kcal per 100 g; een resultaat kiezen koppelt het product aan de herkende hoeveelheid.
- Zoeken werkt ook wanneer de AI de naam verkeerd heeft herkend of een ongeschikte suggestie geeft.
- De bestaande barcodezoekfunctie en het handmatig toevoegen van producten blijven beschikbaar.

### Betere matching
- De suggesties gebruiken geen willekeurige gedeeltelijke woordmatches meer. Zo wordt bijvoorbeeld 'aardappel' niet alleen vanwege een toevallige substring gekoppeld aan 'appel'.
- Alleen een gekozen databaseproduct levert de voedingswaarden voor registratie; AI-geschatte voedingswaarden worden niet gebruikt.

### Technisch
- Applicatieversie bijgewerkt naar **v6.2.21**.
- Service-workercache bijgewerkt naar **6.2.21**.
- Alle bestaande functies uit v6.2.19 blijven behouden.

## Deployment
Upload `CalorieTracker-iPhone-v6.2.21.zip` naar de repository en commit de ZIP. De bestaande GitHub Actions-workflow installeert de release, maakt de releasecommit en tag `v6.2.21`.
