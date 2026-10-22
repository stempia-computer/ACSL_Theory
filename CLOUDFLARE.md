# Cloudflare Workers deployment

This Next.js app runs on Workers through OpenNext (not a static Pages upload).
Use Node.js 22 for builds. Google Sheets remains the data store. This configuration
does not provision R2 or a database; it does not persist Next.js incremental caches.

## Connect GitHub

In Cloudflare **Workers & Pages**, create a Worker using the GitHub repository
`stempia-computer/ACSL_Theory`, branch `main`.

- Worker name: `acsl-theory`
- Build command: `npm run build:cloudflare`
- Deploy command: `npm run deploy:cloudflare`
- Root directory: repository root

The first deployment supplies a `https://acsl-theory.<account>.workers.dev` URL.
The URL is not known until Cloudflare creates the Worker.

## Runtime settings

Under the Worker's **Settings → Variables and Secrets**, configure the following
and deploy the changes. These are runtime settings, not only build variables.

| Name | Type | Value |
| --- | --- | --- |
| AUTH_URL | Text | The exact public HTTPS URL, without a trailing slash |
| AUTH_TRUST_HOST | Text | `true` |
| AUTH_SECRET | Secret | A new random secret of at least 32 characters |
| ACSL_SHEETS_WEBHOOK_URL | Secret | Existing deployed Apps Script `/exec` URL |
| ACSL_SHEETS_TOKEN | Secret | Token matching the Apps Script properties |

Generate AUTH_SECRET locally with:

```sh
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Do not put secrets in GitHub, wrangler.jsonc, or chat. A previously shared token
should be replaced in both Apps Script properties and the Worker secret.

Email OTP requires no Google OAuth client. If enabling Google login, also set
`AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` and register
`https://<public-host>/api/auth/callback/google` in Google Cloud.

## Verify before giving the URL to students

1. Open the public URL and switch between English and Korean; reload.
2. Sign in using a registered teacher's email OTP.
3. Open Students and Question Bank; confirm PDFs load.
4. Sign in as a registered test student, submit homework, and confirm the score
   and answer review appear in the teacher dashboard and Google Sheets.
5. Confirm another student cannot access that student's results.

Cloudflare plan limits still apply. Check the deployment's compressed Worker size
and account limits before accepting any paid upgrade.

## Local Worker preview

```sh
npm ci
npm run preview:cloudflare
```

For local runtime secrets use an ignored `.dev.vars` file, in KEY=value format.
Set AUTH_URL to the local preview origin for OTP origin checks.

## Custom domain later

The initial deployment does not change stempia.com or its DNS. Serving this app
at `stempia.com/acsl` needs separate path-routing and base-path configuration;
do not point the existing domain at this Worker without that work. A subdomain
such as `acsl.stempia.com` can instead use a Worker custom domain once DNS is ready.
