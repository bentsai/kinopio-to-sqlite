# Kinopio to Datasette

Pulls all data from [Kinopio](kinopio.club) and inserts into a SQLite database for use in [Datasette](datasette.io).

## Usage

Create `config.json` with your Kinopio `apiKey`:

```json
{
  apiKey: "<in console, `JSON.parse(localStorage.user).apiKey`"
}
```

Run the script.
