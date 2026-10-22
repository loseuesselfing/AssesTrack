const { Client } = require('pg');
const bcrypt = require('bcryptjs');

exports.handler = async (event, context) => {
  const client = new Client({
    connectionString: process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const path = event.path.replace(/\/\.netlify\/functions\/api\/?/, '');
    const method = event.httpMethod;
    const body = event.body ? JSON.parse(event.body) : {};

    // 1. Admin Sign-In Handler
    if (path === 'login' && method === 'POST') {
      const { username, email, password } = body;

      // Admin Bypass check from Netlify Environment Variables
      if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_INITIAL_PASSWORD) {
        await client.end();
        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: "admin-session-token",
            user: { id: 0, full_name: "Admin", role: "admin" }
          })
        };
      }

      // Standard User Sign-In
      const res = await client.query('SELECT * FROM users WHERE email = $1', [email]);
      if (res.rows.length === 0) {
        await client.end();
        return { statusCode: 401, body: JSON.stringify({ message: "Invalid credentials" }) };
      }

      const user = res.rows[0];
      const valid = await bcrypt.compare(password, user.password_hash);
      await client.end();

      if (!valid) {
        return { statusCode: 401, body: JSON.stringify({ message: "Invalid credentials" }) };
      }

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: `token-${user.id}`, user })
      };
    }

    // 2. Scholar/Teacher Sign-Up Handler
    if (path === 'signup' && method === 'POST') {
      const { full_name, email, password } = body;

      if (!email.endsWith('@zrc.pshs.edu.ph')) {
        await client.end();
        return { statusCode: 400, body: JSON.stringify({ message: "Only @zrc.pshs.edu.ph emails are allowed." }) };
      }

      const hash = await bcrypt.hash(password, 10);
      const res = await client.query(
        'INSERT INTO users (full_name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, full_name, email, role',
        [full_name, email, hash]
      );

      await client.end();
      return {
        statusCode: 201,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: res.rows[0] })
      };
    }

    // Default Fallback
    await client.end();
    return { statusCode: 404, body: JSON.stringify({ message: "Endpoint not found" }) };

  } catch (err) {
    if (client) await client.end();
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: err.message })
    };
  }
};