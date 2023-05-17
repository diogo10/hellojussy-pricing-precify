# hellojussy-pricing-precify

CRUD for precify domain.

- Database: Postgres
- URL: 

## Running Locally

```sh
$ npm install
$ brew services start postgresql@14
$ npm start
```

## Google Cloud

`
gcloud functions deploy hellopricing --entry-point hellopricing --runtime nodejs16 --trigger-http --project hellojussypricingcloud --allow-unauthenticated
gcloud functions describe hellopricing
`

Your app should now be running on [localhost:3000](http://localhost:3000/).