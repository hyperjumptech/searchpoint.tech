# SearchPoint (SCSE) Web

## Getting Started

First, install the dependencies:

```bash
bun install
```

Then, run the development server:

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Building and Running with Docker

To build and run the application using Docker, make sure you have [Docker](https://docs.docker.com/get-docker/) installed on your system.

### Build the Docker Image

```bash
docker build -t scse-web-app -f Dockerfile .
```

### Run the Docker Container

```bash
docker run -p 3000:3000 scse-web-app
```

Now visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## Using `NEXT_PUBLIC_` Environment Variables in Docker

If your application requires environment variables that start with `NEXT_PUBLIC_` (for example, `NEXT_PUBLIC_API_URL`), you must map them in the Dockerfile so that Next.js can use their values _at build time_ (not just run time).

**How to map environment variables in your Dockerfile:**

1. **Add a new build argument and environment variable mapping _before_ the `RUN bun run build` step.**  
   For example, if your app needs `NEXT_PUBLIC_API_URL`, edit your Dockerfile as follows (above the build step):

   ```dockerfile
   ARG NEXT_PUBLIC_API_URL
   ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

   RUN bun run build
   ```

2. **Then, when building your image, supply the build argument:**

   ```bash
   docker build --build-arg NEXT_PUBLIC_API_URL=https://api.example.com -t scse-web-app -f Dockerfile .
   ```

**Summary:**

- For every public variable, add one `ARG ...` and one `ENV ...` line in the Dockerfile before the build.
- Pass each needed value to `docker build` via `--build-arg`.

---

**Note:**  
The provided Dockerfile already includes commented instructions where these lines should be inserted:

```dockerfile
# ARG NEXT_PUBLIC_SOMETHING=something
# ENV NEXT_PUBLIC_SOMETHING=$NEXT_PUBLIC_SOMETHING
```

Uncomment and duplicate these lines for each `NEXT_PUBLIC_` variable needed.

## End to End test

For now test run on local

Install Playwright browsers (one-time)

```
bunx playwright install
```

Run all E2E tests (headless mode)

```
bun run test:e2e
```

Run tests with visible browser window (headed mode)

```
bun run test:e2e:headed
```

Open the Playwright test UI

```
bun run test:e2e:ui
```

View the latest test report

```
bun run test:e2e:report
```
