# Express + DynamoDB backend (Lambda + API Gateway)

A minimal CRUD backend in Node.js 20 + Express that connects to Amazon DynamoDB using the AWS SDK v3. 
Deploy on **AWS Lambda** behind **API Gateway (HTTP API)**. No CDK required.

## Endpoints
- `GET /health` → service check
- `GET /items` → list all items
- `GET /items/:id` → get one
- `POST /items` → create `{ name: string, quantity?: number }`
- `PUT /items/:id/stock` → update stock by `{ delta: number }` **or** set `{ quantity: number }`
- `DELETE /items/:id` → delete

## DynamoDB Table
Create a table named **Items** (or any name, then set env var `DDB_TABLE`):
- **Partition key**: `id` (String)
- Billing mode: **On‑demand** (pay‑per‑request)
- (No sort key needed)

## Local run (optional)
```bash
npm install
cp .env.example .env   # set DDB_TABLE and AWS_REGION
npm run start          # http://localhost:3000/health
```

## Deploy to AWS Lambda (Console)
1) **Create a Lambda function**
- Runtime: **Node.js 20.x**
- Architecture: x86_64
- Handler: `lambda.handler`
- Create or select an **execution role** with DynamoDB access (see policy below).

2) **Set environment variables** in Lambda → Configuration → Environment variables:
- `DDB_TABLE` = your table name (e.g., `Items`)
- (Region is auto from function; optional: `AWS_REGION`)

3) **Upload code**
- On your machine:
  ```bash
  npm install --omit=dev
  zip -r backend.zip .
  ```
- In Lambda → Code → Upload from → `.zip file` → choose `backend.zip`.

4) **Create API Gateway (HTTP API)**
- API Gateway → **Create API** → **HTTP API**.
- **Integrations**: Add integration → **Lambda** → select your function.
- **Routes**:
  - Add route: `ANY /` → Integration = your Lambda.
  - Add route: `ANY /{proxy+}` → Integration = your Lambda.
- **CORS**: Enable CORS for `*` (or set your frontend origin).
- **Deployments/Stages**: Use `$default` with **Auto‑deploy** ON.
- Copy the **Invoke URL**.

5) **Test with curl**
```bash
# health
curl -s ${API_URL}/health

# create
curl -s -X POST ${API_URL}/items -H "Content-Type: application/json"       -d '{ "name": "Apples", "quantity": 5 }'

# list
curl -s ${API_URL}/items

# get
curl -s ${API_URL}/items/<id>

# increment by +2
curl -s -X PUT ${API_URL}/items/<id>/stock -H "Content-Type: application/json"       -d '{ "delta": 2 }'

# set absolute quantity
curl -s -X PUT ${API_URL}/items/<id>/stock -H "Content-Type: application/json"       -d '{ "quantity": 42 }'

# delete
curl -s -X DELETE ${API_URL}/items/<id>
```

## Minimal IAM policy for the Lambda role
Replace REGION/ACCOUNT_ID/TABLE_NAME as needed.
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Scan"
      ],
      "Resource": "arn:aws:dynamodb:REGION:ACCOUNT_ID:table/TABLE_NAME"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "*"
    }
  ]
}
```

## Notes
- API Gateway routes use **Lambda proxy integration** so Express handles all routing.
- For production, restrict CORS to your exact frontend origin.
- DynamoDB **On‑demand** billing keeps costs simple for low traffic.
- To add auth (Cognito), protect the API with a JWT authorizer and validate in Express middleware.