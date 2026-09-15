# hellojussy-pricing-precify

CRUD for precify domain.

- Database: MongoDB
- URL: https://hellojussy-pricing-precify.vercel.app
- Host: Vercel

## Running Locally

```sh
$ npm install
$ export MONGODB_URI="mongodb://localhost:27017/pricing_precify"
$ npm start
```

Your app should now be running on [localhost:3000](http://localhost:3000/).

## API Overview

Base URLs:

- Production: `https://hellojussy-pricing-precify.vercel.app`
- Local: `http://localhost:3000`

All requests and responses use JSON. CORS is open (`Access-Control-Allow-Origin: *`).

## Authentication

Every route, including `GET /`, requires an `Authorization` header. Without it the API returns `403`:

```json
{ "error": "No credentials sent!" }
```

Usage:

```sh
Authorization: Bearer <userId>
```

Current behavior (documented as-is):

- The bearer token **is** the `userId`. There is no JWT verification; the token is used directly to scope queries (`db.js:extractToken`).
- As a fallback, `GET` routes also accept `?token=<userId>`.
- `POST /api/product/delete` is an exception: any header value passes the `403` gate, but `body.userId` decides what gets deleted.

> Security note: because the token equals the user id, anyone holding a user id can read and mutate that user's products. Do not expose these endpoints publicly without an additional auth layer.

## Quickstart

```sh
BASE="http://localhost:3000"
TOKEN="3DtXXvgec9SBYtgT3whh1fsfaTC3"

# Health check (header still required)
curl -H "Authorization: Bearer $TOKEN" "$BASE/"

# List all products for the token user
curl -H "Authorization: Bearer $TOKEN" "$BASE/api/products"

# Recalculate all products for the token user
curl -X POST -H "Authorization: Bearer $TOKEN" "$BASE/api/products/recalculate"
```

Create example (truncated — see `collection.postman_collection.json` for the full shape):

```sh
curl -X POST "$BASE/api/products/create" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "hhhg",
    "userId": "3DtXXvgec9SBYtgT3whh1fsfaTC3",
    "prof": 60,
    "price": 9.0,
    "supplies": [
      { "id": "j23jdhskhdsud", "name": "Embalagem", "value": 1, "qt": 5, "qtValue": 1.0, "unit": "UN" }
    ],
    "recipes": []
  }'
```

Success response:

```json
{ "status": "OK", "productId": "<ObjectId>" }
```

## Endpoints

| Method | Path | Purpose |
| ------ | ---- | ------- |
| GET | `/` | Health check, returns `I am working` |
| GET | `/api/products` | List products for the token user |
| GET | `/api/product/:id` | Get one product (`:id` is a Mongo `ObjectId`) |
| POST | `/api/products/create` | Create a product with embedded supplies and recipes |
| PUT | `/api/products/save/:id` | Replace a product (`:id` is a Mongo `ObjectId`) |
| DELETE | `/api/product/:id` | Delete one product |
| POST | `/api/products/recalculate` | Recalculate all products for the token user |
| POST | `/api/product/update/recipe` | Webhook: update one recipe by `{ id }`, then recalculate |
| POST | `/api/product/delete/recipe` | Webhook: remove one recipe by `{ id }`, then recalculate |
| POST | `/api/product/update/supply` | Webhook: update one supply by `{ id, ...fields }`, then recalculate |
| POST | `/api/product/delete/supply` | Webhook: remove one supply by `{ id }`, then recalculate |
| POST | `/api/product/delete` | Delete all products for `{ "userId": "..." }` |

Mutations return `200 { "status": "OK" }` on success.

### `GET /api/products` — sample response

Returns `200` with an array of products for the token user. Embedded `supplies` and `recipes` are excluded from this list view (see `repositories/mongo/ProductRepository.js:findAllByUserId`) — fetch `GET /api/product/:id` for the full document.

```json
[
  {
    "_id": "65a1b2c3d4e5f6789012345",
    "id": "65a1b2c3d4e5f6789012345",
    "userid": "3DtXXvgec9SBYtgT3whh1fsfaTC3",
    "product_name": "Bolo de Chocolate Premium",
    "profit_percentage": "35",
    "price": 55.0,
    "product_cost": 28.5,
    "product_cost_with_tax": 32.78,
    "product_cost_with_markup": 38.48,
    "product_cost_with_markup_tax": 44.25,
    "total_fichas": 15.3,
    "total_extras": 13.2,
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-20T14:45:00.000Z",
    "version": 12
  }
]
```

Data-layer hint (TypeScript):

```typescript
interface ProductListItem {
  id: string; // mirrors _id (hex ObjectId)
  _id: string;
  userid: string;
  product_name: string;
  profit_percentage: string;
  price: number;
  product_cost: number;
  product_cost_with_tax: number;
  product_cost_with_markup: number;
  product_cost_with_markup_tax: number;
  total_fichas: number;
  total_extras: number;
  created_at: string;
  updated_at: string;
  version: number;
  // supplies/recipes are NOT present here — use GET /api/product/:id
}

type ListProductsResponse = ProductListItem[];
```

Webhook bodies:

```json
// update/delete recipe or supply
{ "id": "61b49f58dc7bf733df1906b4" }

// delete-all
{ "userId": "3DtXXvgec9SBYtgT3whh1fsfaTC3" }
```

## Models

Field lists only; cost fields are computed server-side on recalculation.

- Product: `{ name, userId, prof, price, supplies[], recipes[] }`
- Supply: `{ id, name, value, qt, qtValue, unit }` — `unit` e.g. `KG`, `G`, `L`, `ML`, `UN`
- Recipe: `{ id, name, quantity, total, products[] }` — `products[]` are ingredients with the same shape as Supply

Products store supplies and recipes as embedded documents in the `products` collection.

## Errors

| Status | Meaning |
| ------ | ------- |
| `403 { error: "No credentials sent!" }` | Missing `Authorization` header |
| `400 { status: "NOK", message: "invalid product id" }` | Malformed `:id` on delete |
| `404 { status: "NOK", message: "product not found" }` | No product for `:id` |
| `200 { status: "NOK", message: "missing ..." }` | Webhook or recalculate called without `id`/`user` |
| `500 { status: "NOK", message: "Internal error" }` | Unexpected server or MongoDB failure |

`GET /api/product/:id` returns `200 null` when not found instead of a `404`.

## Further Reading

- `collection.postman_collection.json` — full request examples and assertions
- `MONGODB_SCHEMA_PROPOSAL.md` — embedded document design and indexes
- `index.js`, `db.js` — route and handler source of truth

## Deploy

- Create a PR
- Vercel will deploy when the changes are merged
