const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/bodyforge.db', (err) => {
  if (err) console.error(err);
});
db.all('SELECT name, gif_url, image_uri FROM exercises LIMIT 5', [], (err, rows) => {
  console.log(rows);
});
