# Hvem vinder valget?

Dette projekt implementerer en Bayesiansk prediction model for det kommende folketingsvalg. Jeg startede med en model for kommunalvalget d. 18 november 2025, men formåede ikke at producere resultater der var pålidelige. Der kommer en lille analyse af forskellen mellem de resultater og det faktiske valgresultat.

## Projekt struktur

### Backend

Selve modellen og projektets backend består primært af R (og en smule STAN), der leveres med en `{plumber2}` api. Api'en vil være tilgængelig på [api.hvemvindervalget.dk](https://api.hvemvindervalget.dk)
Koden til dette lever i [`backend/`](backend).

### Frontend

Websiden der præsenterer valgdata, modelresultater, scenarieanalyser og andre indsigter er produceret med [Next JS](https://nextjs.org/).
Koden til dette lever i [`frontend/`](frontend).

## Datakilder

- [valg.dk](https://valg.dk/) under Creative Commons CC BY 4.0.
- Danmarks Statistik
- Meningsmålinger
  - Verian (1953-nu)
  - Epinion (2008-nu)
