// Lightweight helpers for D1 queries

/**
 * Get the D1 database instance from environment
 * @param {Object} env - Cloudflare Worker environment with DB binding
 * @returns {D1Database} D1 database instance
 */
export function getDb(env) {
	return env.DB;
}

/**
 * Execute a SQL query and return the first result row
 * @param {Object} env - Cloudflare Worker environment
 * @param {string} sql - SQL query string
 * @param {Array} bindings - Query parameter bindings
 * @returns {Promise<Object|null>} First result row or null if no results
 */
export async function dbGet(env, sql, bindings = []) {
	const stmt = getDb(env).prepare(sql).bind(...bindings);
	return await stmt.first();
}

/**
 * Execute a SQL query and return all result rows
 * @param {Object} env - Cloudflare Worker environment
 * @param {string} sql - SQL query string
 * @param {Array} bindings - Query parameter bindings
 * @returns {Promise<Array>} Array of result rows (empty array if no results)
 */
export async function dbAll(env, sql, bindings = []) {
	const stmt = getDb(env).prepare(sql).bind(...bindings);
	const res = await stmt.all();
	return res?.results || [];
}

/**
 * Execute a SQL statement without returning results
 * @param {Object} env - Cloudflare Worker environment
 * @param {string} sql - SQL statement string
 * @param {Array} bindings - Statement parameter bindings
 * @returns {Promise<Object>} Statement execution result
 */
export async function dbRun(env, sql, bindings = []) {
	const stmt = getDb(env).prepare(sql).bind(...bindings);
	return await stmt.run();
}

/**
 * Execute multiple SQL statements in a single atomic transaction
 * @param {Object} env - Cloudflare Worker environment
 * @param {Array<{sql: string, bindings: Array}>} statements - Array of statement objects
 * @returns {Promise<Array>} Array of results for each statement
 */
export async function dbBatch(env, statements) {
	const prepared = statements.map(s => getDb(env).prepare(s.sql).bind(...(s.bindings || [])));
	return await getDb(env).batch(prepared);
}


