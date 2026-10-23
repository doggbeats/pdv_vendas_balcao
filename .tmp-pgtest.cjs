const { Client } = require("pg");

const senhas = ["postgres", "123456", "admin", "root", "senha", "postgres123", "code_ph_gestao", "1234", "password"];

(async () => {
  for (const password of senhas) {
    const client = new Client({ connectionString: `postgresql://postgres:${password}@localhost:5432/postgres` });
    try {
      await client.connect();
      const r = await client.query("select current_user");
      console.log("OK", password, r.rows[0]);
      await client.end();
      return;
    } catch (e) {
      console.log("FAIL", password, e.message);
      try { await client.end(); } catch {}
    }
  }
})();
