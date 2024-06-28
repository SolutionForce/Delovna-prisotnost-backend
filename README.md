# Delovna-prisotnost-backend
Backend informacijskega sistema Solution force, ki deluje serverless na Firebase Functions.

Podrobna dokumentacija celotnega projekta dostopna na https://solutionforce.gitbook.io/solution-force

## Navodila vzpostavitve

### Predpogoji
- Nameščen NodeJS (verzija: v20.14.0)
- Ustvarjen Firebase račun in izbran plačljiv paket "Blaze"
- Ustvarjen Twilio SendGrid račun

### Lokalna vzpostavitev
1. cd Delovna-prisotnost-backend\functions
2. npm install
3. npm start
4. Strežnik dostopen na "http://127.0.0.1:5001/rvir-1e34e/us-central1/api/"
5. Ob posodobitvi datoteke se strežnik avtomatsko posodobi (v roku nekaj sekund)

### Vzpostavitev na Firebase strežniku
1. cd Delovna-prisotnost-backend\functions
2. npm install
3. npm run deploy
4. API dostopen na "https://us-central1-rvir-1e34e.cloudfunctions.net/api/"
