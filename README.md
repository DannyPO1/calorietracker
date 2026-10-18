# CalorieTracker v6.2.19

Persoonlijke calorie- en voedingsregistratie voor iPhone/Safari. Gegevens worden lokaal op dit apparaat opgeslagen; een account is niet nodig.

## Release notes — v6.2.19

### Consistente bewerkknoppen
- De bewerkactie bij een voedingsmiddel in een maaltijd gebruikt nu dezelfde potloodknop en knopstijl als bewerken bij producten en recepten.
- Hoeveelheid en eenheid blijven direct wijzigbaar; voedingswaarden worden proportioneel bijgewerkt.

### Betere AI-herkenning van losse ingrediënten
- De prompt vraagt expliciet om zichtbare ingrediënten van samengestelde gerechten afzonderlijk terug te geven.
- Voorbeeld: een salade met tomaat, komkommer en rode ui wordt als drie aparte items teruggegeven.
- Het model krijgt de instructie om niet daarnaast ook de hele salade te registreren, om dubbeltelling te voorkomen.
- Onherkenbare ingrediënten mogen niet worden verzonnen.

### Technisch
- Applicatieversie bijgewerkt naar **v6.2.19**.
- Service-workercache bijgewerkt naar **6.2.19**.
- Alle bestaande functies uit v6.2.18 blijven behouden.

## Deployment
Upload `CalorieTracker-iPhone-v6.2.19.zip` naar de repository en commit de ZIP. De bestaande GitHub Actions-workflow installeert de release, maakt de releasecommit en tag `v6.2.19`.
