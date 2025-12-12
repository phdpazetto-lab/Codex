# Deploying the scaffold to Google Apps Script

The Apps Script editor lets you create **HTML** and **GS** files. You can still keep your CSS and JS separated by storing them in dedicated HTML partials and including them in the main page. Below is a step‑by‑step guide that mirrors the files in this repo.

## 1) Create your Apps Script project
1. In Google Drive, click **New → More → Google Apps Script**.
2. Name the project (e.g., `StarPay WebApp`).
3. In the left sidebar you will see the default `Code.gs` file and a blank `Untitled.html`.

## 2) Add the server bootstrap (`Code.gs`)
Replace the contents of `Code.gs` with:

```gs
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function doGet() {
  return HtmlService.createTemplateFromFile('Index').evaluate()
    .setTitle('StarPay')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
```

* `include` lets you pull in other HTML partials (CSS/JS) as raw text.
* `doGet` serves the page when the WebApp URL is opened.

## 3) Create HTML partials for CSS and JS
Apps Script cannot store standalone `.css` or `.js` files, but you can create HTML files to hold them.

### Styles partial
1. Click **New File → HTML** and name it `Styles`.
2. Paste the contents of [`webapp/styles.css`](../webapp/styles.css) inside a `<style>` tag:

```html
<style>
/* paste styles.css here */
</style>
```

### Script partial
1. Click **New File → HTML** and name it `App`.
2. Paste the contents of [`webapp/app.js`](../webapp/app.js) inside a `<script>` tag. Apps Script’s HTML service supports modules, but exporting isn’t necessary for a single page, so you can remove the last line `export { init };`.

```html
<script type="module">
// paste app.js here (remove the final export)
</script>
```

## 4) Create the main page (`Index`)
1. Click **New File → HTML** and name it `Index`.
2. Copy the contents of [`webapp/index.html`](../webapp/index.html), then:
   * Replace the `<link rel="stylesheet" href="styles.css">` line with `<?!= include('Styles'); ?>`.
   * Replace the `<script type="module" src="app.js"></script>` line with `<?!= include('App'); ?>`.

Your `Index` file should end with the CSS and JS injected inline by those include calls.

## 5) Deploy as a WebApp
1. Click **Deploy → New deployment → Web app**.
2. Set **Execute as** to **Me** and **Who has access** to **Anyone with the link** (or your preferred scope).
3. Click **Deploy**, authorize the script, and copy the WebApp URL.

## 6) Test locally in Apps Script
* Open the WebApp URL in a new tab. You should see the same shell as `webapp/index.html` in this repo.
* Open **View → Logs** in the Apps Script editor to see the `console.info` output from the sample button handler.

## 7) When you update the repo
* Re‑paste changes from `webapp/styles.css`, `webapp/app.js`, and `webapp/index.html` into their respective Apps Script files.
* If you add new HTML partials, call `<?!= include('PartialName'); ?>` from `Index` to inject them.

## Quick reference (Apps Script file mapping)
| Repo file | Apps Script file | Notes |
| --- | --- | --- |
| `webapp/index.html` | `Index` | Replace CSS/JS links with `include` calls. |
| `webapp/styles.css` | `Styles` | Wrap in `<style>...</style>`. |
| `webapp/app.js` | `App` | Wrap in `<script type="module">...</script>`; remove the trailing `export`. |
| n/a | `Code.gs` | Contains `include` and `doGet`. |

Following these steps, you can keep editing CSS and JS locally while still deploying through the Apps Script interface.

## How to confirm the deployment worked
Use this quick checklist to ensure your setup matches the screenshots you shared:

1. In the **Deployments** panel, the latest run should show **Tipo: App da Web** and **Status: Concluído** (finished) with `doGet` listed as the entry point.
2. When you open the WebApp URL in a browser, you should see the `StarPay` heading and the welcome text from `webapp/index.html`.
3. Inside the Apps Script editor, your project tree should list four files:
   * `Code.gs` containing `include` and `doGet`.
   * `Index.html` with the `<?!= include('Styles'); ?>` and `<?!= include('App'); ?>` injections.
   * `Styles.html` wrapping the CSS in a `<style>` tag.
   * `App.html` wrapping the JS in a `<script type="module">` tag.

If these items match, the scaffold is correctly deployed in Apps Script.

## Ready for the next step?
Once the shell is working, you can proceed to wire up real behavior:

* **Connect to Google Sheets**: add read/write helper functions in `Code.gs` that call `SpreadsheetApp` and expose them to the client with `google.script.run` in `app.js`.
* **Handle user actions**: replace the sample click handler in `app.js` with calls to those helpers, then display results in the DOM.
* **Lock down permissions**: after testing, re‑deploy the WebApp with the minimum access your team needs (e.g., your domain instead of “Anyone with the link”).
* **Iterate locally**: keep editing the files under `webapp/`, then re‑paste them into `App`, `Styles`, and `Index` whenever you change the UI.
