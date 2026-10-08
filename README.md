# CalorieTracker v6.2.11

Persoonlijke calorie- en voedingsregistratie voor iPhone/Safari. Gegevens worden lokaal opgeslagen; een account is niet nodig.

## Release notes — v6.2.11

### Datumselectie op het dashboard
- De datum van het dashboard is nu rechtstreeks op het dashboard aanklikbaar.
- Standaard staat de datum op vandaag.
- Tik op de datum om de iOS-datumkiezer te openen en een andere dag te selecteren.
- De geselecteerde datum wordt direct gebruikt voor het dashboard en de bijbehorende maaltijdregistraties.
- De datum in het maaltijdformulier blijft gesynchroniseerd met de dashboarddatum.
- Ook de datum voor het gewichtsoverzicht volgt de geselecteerde dag.
- Teruggaan naar vandaag kan door in de datumkiezer opnieuw de datum van vandaag te selecteren.
- Bij historische dagen worden teksten op het dashboard niet onterecht als "vandaag" aangeduid.

### Technisch
- Applicatieversie bijgewerkt naar **v6.2.11**.
- Service-workercache bijgewerkt naar **6.2.11** zodat de nieuwe interface direct wordt geladen.

## Deployment
Upload `CalorieTracker-iPhone-v6.2.11.zip` naar de repository en commit de ZIP. De bestaande GitHub Actions-workflow installeert de release, maakt de releasecommit en tag `v6.2.11`.
