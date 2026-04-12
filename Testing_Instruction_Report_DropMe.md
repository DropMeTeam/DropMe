# DropMe Testing Instruction Report

## 1. Objective
This report explains how to run and document:
- unit testing,
- integration testing,
- performance testing,
- and testing environment configuration,
as required in the assignment brief. fileciteturn0file0L17-L28

## 2. Current Project Observation
From the uploaded project structure, dedicated automated test folders and test scripts are not yet clearly defined in the root package configuration. Therefore, this report provides a practical testing blueprint that can be added to the project immediately to satisfy the coursework testing requirement.

## 3. Recommended Testing Stack

### Frontend unit testing
- **Tool:** Vitest
- **Helpers:** React Testing Library, jsdom
- **Purpose:** test React components, utility functions, formatting logic, and route rendering behavior in isolation

### Backend integration testing
- **Tool:** Jest or Vitest
- **HTTP layer:** Supertest
- **Database:** test MongoDB database or Mongo Memory Server
- **Purpose:** test Express routes, controllers, middleware, database interaction, and error scenarios

### Performance testing
- **Tool:** Artillery.io
- **Purpose:** simulate multiple concurrent requests and evaluate response behavior under load

## 4. Testing Environment Configuration

### 4.1 Frontend test dependencies
Install in `client`:
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

Add scripts to `client/package.json`:
```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run"
  }
}
```

### 4.2 Backend test dependencies
Install in `server`:
```bash
npm install -D vitest supertest mongodb-memory-server
```

Add scripts to `server/package.json`:
```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run"
  }
}
```

### 4.3 Performance test dependency
Install in `server` or project root:
```bash
npm install -D artillery
```

## 5. Unit Testing Instructions

### 5.1 What to test on frontend
Recommended unit test targets:
- formatting helpers such as fare/date/label formatting
- reusable UI components
- auth context behavior
- route guard behavior
- API wrapper behavior with mocked requests
- eco leaderboard data rendering
- bus/train card rendering logic

### 5.2 Example unit test targets
Suggested files:
- `client/src/lib/busFare.js`
- `client/src/lib/utils.js`
- `client/src/lib/ecoApi.js` using mocks
- `client/src/components/...` for rendering tests
- `client/src/state/AuthContext.jsx`

### 5.3 Run frontend unit tests
```bash
cd client
npm run test
```

For CI-style execution:
```bash
npm run test:run
```

### 5.4 Expected evidence
Capture:
- terminal output showing passing tests
- screenshots of component test results
- test file names and assertions used

## 6. Integration Testing Instructions

### 6.1 What to test on backend
Integration tests should cover:
- route + controller + database interaction
- auth middleware behavior
- request validation
- success and failure responses
- protected route access
- Stripe session creation mocking
- booking creation logic
- review creation and fetch flows
- eco leaderboard retrieval

### 6.2 Recommended integration test targets
Suggested route groups:
- `/api/auth`
- `/api/users`
- `/api/offers`
- `/api/requests`
- `/api/bookings`
- `/api/payments`
- `/api/train/*`
- `/api/bus/*`
- `/api/reviews`
- `/api/eco`

### 6.3 Example scenarios to include
- valid registration returns `201`
- duplicate registration returns `409`
- invalid login returns `401`
- protected route without token returns `401`
- rider tries driver-only endpoint and gets `403`
- booking route returns success for valid data
- non-existent resource returns `404`
- validation failure returns `400`

### 6.4 Suggested test setup pattern
Refactor backend so `buildApp()` can be imported directly in tests. Then use Supertest:

```js
import request from "supertest";
import { buildApp } from "../src/app.js";

const app = buildApp({ io: { on() {}, emit() {} } });

describe("GET /health", () => {
  it("returns ok", async () => {
    const res = await request(app).get("/health");
    expect(res.statusCode).toBe(200);
  });
});
```

### 6.5 Run backend integration tests
```bash
cd server
npm run test
```

Or:
```bash
npm run test:run
```

### 6.6 Expected evidence
Capture:
- terminal output with passing backend tests
- screenshots of API test success
- sample test files
- sample error-case assertions

## 7. Performance Testing Instructions
The assignment explicitly mentions performance testing and states that tools such as Artillery.io can be used for Express applications. fileciteturn0file0L21-L28

### 7.1 Create Artillery config
Example file: `server/performance/auth-load.yml`

```yaml
config:
  target: "http://localhost:5000"
  phases:
    - duration: 30
      arrivalRate: 5
    - duration: 30
      arrivalRate: 20
scenarios:
  - name: "Health and public route test"
    flow:
      - get:
          url: "/health"
      - get:
          url: "/api/eco/leaderboard"
```

### 7.2 Run Artillery
```bash
cd server
npx artillery run performance/auth-load.yml
```

### 7.3 Recommended performance targets
Test:
- `/health`
- `/api/eco/leaderboard`
- `/api/offers/search`
- `/api/train/search`
- `/api/bus/routes`

Avoid stressing live payment endpoints with real Stripe traffic.

### 7.4 Metrics to report
Record:
- average response time
- p95 response time
- request success rate
- error rate
- total requests completed

## 8. Postman or API Client Integration Testing
For demonstration quality, keep a Postman collection with:
- authentication requests
- happy-path booking flows
- negative/error scenarios
- role-protected endpoint tests

Recommended evidence:
- collection screenshots
- example request/response bodies
- authorization setup used

## 9. Suggested Folder Structure for Tests
```text
client/
└── src/
    └── tests/
        ├── components/
        ├── lib/
        └── state/

server/
├── tests/
│   ├── auth/
│   ├── bookings/
│   ├── bus/
│   ├── train/
│   └── reviews/
└── performance/
    └── auth-load.yml
```

## 10. Minimum Submission Checklist
To satisfy the testing report requirement, include:
- commands used to run tests
- tools used for each testing type
- screenshots of successful test runs
- test environment details
- example files or folders where tests are stored
- performance results summary

## 11. Example Testing Environment Details
Document this in your submission:
- Node.js version
- npm version
- OS used
- MongoDB Atlas test database or memory DB
- frontend test runner and browser simulation tool
- backend test runner and HTTP test library
- Artillery version

## 12. Conclusion
The project should include documented unit testing, integration testing, and performance testing to meet the final evaluation standard for testing completeness. This report provides a practical implementation path that can be added directly to the existing DropMe codebase and demonstrated during the viva. fileciteturn0file0L17-L28
