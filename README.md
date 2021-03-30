# Kinopio to SQLite

Pulls all data from [Kinopio](kinopio.club) and inserts into a SQLite database for use in [Datasette](datasette.io).

## Install

**Prerequisites**

- node
- datasette
- sqlite-utils

On macOS, `brew install datasette sqlite-utils`.

## Usage

Create `config.json` with your Kinopio `apiKey`:

```json
{
  "apiKey": "<in console, `JSON.parse(localStorage.user).apiKey`"
}
```

Run the script.

```bash
% ./kinopio-to-sqlite.js
```

This creates (or updates) `kinopio.db`. Now you can explore with Datasette:

```bash
% datasette kinopio.db --reload --plugins-dir=plugins/
```

---

## Notes

### Publish to Vercel

```bash
datasette publish vercel public.db --project=kinopio-public --plugins-dir=plugins/
```
