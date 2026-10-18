# CalorieTracker v6.2.22

Persoonlijke calorie- en voedingsregistratie voor iPhone/Safari. Gegevens worden lokaal op dit apparaat opgeslagen; een account is niet nodig.

## Release notes — v6.2.22

### Eigen producten makkelijker beheren
- Zoekveld toegevoegd aan de lijst met eigen producten.
- Standaard maximaal 30 resultaten, met een knop om meer producten te laden.
- Aantal gevonden en getoonde producten wordt vermeld.

### Dagtotaal overzichtelijk houden
- Standaard maximaal 14 geregistreerde dagen tegelijk zichtbaar.
- Datumvelden toegevoegd om een eigen periode te kiezen.
- Snelle filters voor 7, 30, 90 dagen of alle dagen.
- Met 'Toon meer dagen' kunnen oudere resultaten binnen de gekozen periode stapsgewijs worden geladen.
- Bestaande dagregistraties blijven behouden.

### Functionaliteit uit v6.2.21 behouden

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
- Applicatieversie bijgewerkt naar **v6.2.22**.
- Service-workercache bijgewerkt naar **6.2.22**.
- Alle bestaande functies uit v6.2.19 blijven behouden.

## Deployment
Upload `CalorieTracker-iPhone-v6.2.22.zip` naar de repository en commit de ZIP. De bestaande GitHub Actions-workflow installeert de release, maakt de releasecommit en tag `v6.2.22`.
