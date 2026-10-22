const { Client } = require('pg');
const bcrypt = require('bcryptjs');

// Auto-creates missing tables if they don't exist yet
async function initDb(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      full_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'scholar',
      grade_level VARCHAR(50),
      section VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS assessments (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      type VARCHAR(50) NOT NULL,
      subject VARCHAR(100) NOT NULL,
      grade_level VARCHAR(50) NOT NULL,
      section VARCHAR(50) NOT NULL,
      date DATE NOT NULL,
      created_by INT REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS holidays (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      date DATE UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS exception_requests (
      id SERIAL PRIMARY KEY,
      assessment_id INT REFERENCES assessments(id),
      teacher_id INT REFERENCES users(id),
      status VARCHAR(50) DEFAULT 'pending',
      reason TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_history (
      id SERIAL PRIMARY KEY,
      user_id INT REFERENCES users(id),
      action VARCHAR(255) NOT NULL,
      details TEXT,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

exports.handler = async (event, context) => {
  const client = new Client({
    connectionString: process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    await initDb(client); // Run automatic table check/creation

    const path = event.path.replace(/\/\.netlify\/functions\/api\/?/, '').replace(/^api\/?/, '');
    const method = event.httpMethod;
    const body = event.body ? JSON.parse(event.body) : {};

    // 1. Admin / User Sign-In Handler
    if (path === 'login' && method === 'POST') {
      const { username, email, password } = body;

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
