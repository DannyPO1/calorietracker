# CalorieTracker v6.2.10

Persoonlijke calorie- en voedingsregistratie voor iPhone/Safari. Gegevens worden lokaal opgeslagen; een account is niet nodig.

## Release notes — v6.2.10

### Dashboardiconen
- De iconen voor **eiwit** en **koolhydraten/vet** zijn vervangen door de gecorrigeerde assets uit de goedgekeurde dashboard-mock-up.
- De volledige cirkels zijn nu correct binnen het 120×120 px canvas gecentreerd.
- De iconen zijn verticaal gecentreerd binnen de cirkels.
- De bestaande vormgeving, kleuren en stijl van de mock-up zijn behouden; de iconen zijn niet opnieuw geïnterpreteerd of nagetekend.
- De iconen voor **dagdoel** en **registraties** uit v6.2.9 blijven ongewijzigd.

### Technisch
- Applicatieversie bijgewerkt naar **v6.2.10**.
- Service-workercache bijgewerkt naar **6.2.10** zodat de nieuwe dashboard-assets correct worden geladen.

## Deployment
Upload `CalorieTracker-iPhone-v6.2.10.zip` naar de repository en commit de ZIP. De bestaande GitHub Actions-workflow installeert de release, maakt de releasecommit en tag `v6.2.10`.
