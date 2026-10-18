# CalorieTracker v6.2.20

Persoonlijke calorie- en voedingsregistratie voor iPhone/Safari. Gegevens worden lokaal op dit apparaat opgeslagen; een account is niet nodig.

## Release notes — v6.2.20

### Zelf zoeken in de productdatabase vanuit fotoanalyse
- Bij ieder AI-herkend voedingsmiddel kan de gebruiker rechtstreeks in de bestaande productdatabase zoeken.
- Zoekresultaten tonen de productnaam en kcal per 100 g; een resultaat kiezen koppelt het product aan de herkende hoeveelheid.
- Zoeken werkt ook wanneer de AI de naam verkeerd heeft herkend of een ongeschikte suggestie geeft.
- De bestaande barcodezoekfunctie en het handmatig toevoegen van producten blijven beschikbaar.

### Betere matching
- De suggesties gebruiken geen willekeurige gedeeltelijke woordmatches meer. Zo wordt bijvoorbeeld 'aardappel' niet alleen vanwege een toevallige substring gekoppeld aan 'appel'.
- Alleen een gekozen databaseproduct levert de voedingswaarden voor registratie; AI-geschatte voedingswaarden worden niet gebruikt.

### Technisch
- Applicatieversie bijgewerkt naar **v6.2.20**.
- Service-workercache bijgewerkt naar **6.2.20**.
- Alle bestaande functies uit v6.2.19 blijven behouden.

## Deployment
Upload `CalorieTracker-iPhone-v6.2.20.zip` naar de repository en commit de ZIP. De bestaande GitHub Actions-workflow installeert de release, maakt de releasecommit en tag `v6.2.20`.
