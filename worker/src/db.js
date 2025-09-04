// Lightweight helpers for D1 queries

export function getDb(env) {
	return env.DB;
}

export async function dbGet(env, sql, bindings = []) {
	const stmt = getDb(env).prepare(sql).bind(...bindings);
	return await stmt.first();
}

export async function dbAll(env, sql, bindings = []) {
	const stmt = getDb(env).prepare(sql).bind(...bindings);
	const res = await stmt.all();
	return res?.results || [];
}

export async function dbRun(env, sql, bindings = []) {
	const stmt = getDb(env).prepare(sql).bind(...bindings);
	return await stmt.run();
}

export async function dbBatch(env, statements) {
	// statements: array of { sql, bindings }
	const prepared = statements.map(s => getDb(env).prepare(s.sql).bind(...(s.bindings || [])));
	return await getDb(env).batch(prepared);
}


