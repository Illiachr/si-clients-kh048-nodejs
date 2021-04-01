const { v4: uuid } = require('uuid');
const crypto = require('crypto');
const { Pool } = require('pg');

class Users {
  constructor() {
    this.usersTable = process.env.DB_USERS_TABLE;
    this.rolesTable = process.env.DB_ROLE_TABLE;
  }

  init() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
    // this.pool = new Pool({
    //   user: 'postgres',
    //   password: 'postgres',
    //   host: 'localhost',
    //   port: 5432,
    //   database: this.db
    // });
  }

  getAll() {
    return this.pool.query('SELECT * FROM users');
  }

  getUserByLogin(login) {
    return this.pool.query('SELECT id, hash, salt FROM users WHERE login=$1', [login]);
  }

  getUserJoin(id) {
    const sql = 'SELECT roles.role, users.id FROM roles LEFT JOIN users ON users.role_id = roles.id WHERE users.id=$1;';
    return this.pool.query(sql, [id]);
  }

  addUser({ login, password }) {
    const { hash, salt } = this.setHash(password);

    const user = {
      id: this.setUserId(),
      role: 'User',
      login,
      hash,
      salt
    };
    const params = [user.id, 2, login, hash, salt];
    return this.pool.query('INSERT INTO users(id, role_id, login, hash, salt) values($1, $2, $3, $4, $5) RETURNING id', params);
  }

  setUserId() {
    return uuid();
  }

  // Method to set salt for a user
  generateSalt() {
    // Creating a unique salt for a particular user
    return crypto.randomBytes(16).toString('hex');
  }

  // Method to set hash the password for a user
  setHash(password) {
    // Hashing user's salt and password with 1000 iterations,
    const salt = this.generateSalt();
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return { hash, salt };
  };
}

const users = new Users();
users.init();

module.exports = users;
