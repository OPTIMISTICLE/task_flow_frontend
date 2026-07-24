# Frontend

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.2.19.

## Development server

Start the Spring Boot backend on `http://localhost:8080`, then start Angular with either command:

```bash
npm start
```

```bash
npx ng serve
```

The Angular dev-server configuration automatically proxies `/api` to the backend through
`proxy.conf.json`, including when `ng serve` is launched directly from an IDE. Once the server is
running, open `http://localhost:4200/`. The application automatically reloads when source files
change.

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

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
