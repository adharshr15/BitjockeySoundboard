import mysql from "mysql2/promise"

export async function query({ query, values = [] }) {
    const connection = await mysql.createConnection({
        host: 'HOST',
        user: 'ROOT',
        password: 'PASSWORD',
        database: 'DATABASE'
    });

    try {
        const [results] = await connection.execute(query, values);
        connection.end();
        return results;
    } catch (e) {
        throw (e.message);
    }
}
