# Frontend

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.1.4.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

The E2E tests cover complete browser-to-backend flows using a real browser and
real API services (without mocked HTTP requests): a client can register, log in,
and view their backend profile; a seller can register, log in, and create a
product, then a client can register, add that product to their cart, and place
an order that the seller confirms, ships, and marks as delivered.

```bash
# Install the browser once
npx playwright install chromium

# Start the backend and frontend in separate terminals
docker compose -f ../backend/docker-compose.yml up --build -d
docker compose up --build -d

# Run the test
npm run e2e
```

The test expects the frontend at `https://localhost:4200` and the API Gateway at
`https://localhost:8888`. Playwright accepts the local development certificates.
To use another frontend URL, set `E2E_BASE_URL`, for example:

```bash
E2E_BASE_URL=https://localhost:4200 npm run e2e
```

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
