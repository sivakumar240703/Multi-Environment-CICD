const http = require("http");
const mysql = require("mysql2/promise");

const PORT = process.env.PORT || 8080;

const ENVIRONMENT = process.env.ENVIRONMENT || "LOCAL";
const APP_VERSION = process.env.APP_VERSION || "1.0.0";

const DB_HOST = process.env.DB_HOST || "localhost";
const DB_NAME = process.env.DB_NAME || "customerdb";
const DB_USER = process.env.DB_USER || "root";
const DB_PASSWORD = process.env.DB_PASSWORD || "";

async function checkDatabase() {
    try {
        const connection = await mysql.createConnection({
            host: DB_HOST,
            user: DB_USER,
            password: DB_PASSWORD,
            database: DB_NAME
        });

        await connection.query("SELECT 1");

        await connection.end();

        return true;

    } catch (error) {

        console.error("Database connection failed:", error.message);

        return false;
    }
}

const server = http.createServer(async (req, res) => {

    res.setHeader("Content-Type", "application/json");

    // =========================
    // HOME
    // =========================
    if (req.url === "/") {

        const dbConnected = await checkDatabase();

        res.writeHead(dbConnected ? 200 : 500);

        res.end(JSON.stringify({
            message: "Customer Application is running",
            environment: ENVIRONMENT,
            version: APP_VERSION,
            databaseHost: DB_HOST,
            databaseName: DB_NAME,
            databaseConnected: dbConnected
        }));

    // =========================
    // HEALTH CHECK
    // =========================
    } else if (req.url === "/health") {

        const dbConnected = await checkDatabase();

        const status = dbConnected ? "UP" : "DOWN";

        res.writeHead(dbConnected ? 200 : 500);

        res.end(JSON.stringify({
            status: status,
            environment: ENVIRONMENT,
            version: APP_VERSION,
            databaseHost: DB_HOST,
            databaseConnected: dbConnected
        }));

    // =========================
    // CUSTOMER SEARCH
    // =========================
    } else if (req.url.startsWith("/customers")) {

        try {

            const connection = await mysql.createConnection({
                host: DB_HOST,
                user: DB_USER,
                password: DB_PASSWORD,
                database: DB_NAME
            });

            const url = new URL(req.url, `http://localhost:${PORT}`);

            const search = url.searchParams.get("search");

            let query = "SELECT id, name, email FROM customers";

            let params = [];

            // Case-insensitive customer search
            if (search) {

                query +=
                    " WHERE LOWER(name) LIKE LOWER(?) OR LOWER(email) LIKE LOWER(?)";

                params = [
                    `%${search}%`,
                    `%${search}%`
                ];
            }

            const [rows] = await connection.query(query, params);

            await connection.end();

            res.writeHead(200);

            res.end(JSON.stringify({
                environment: ENVIRONMENT,
                search: search || null,
                resultCount: rows.length,
                customers: rows
            }));

        } catch (error) {

            res.writeHead(500);

            res.end(JSON.stringify({
                error: "Database query failed",
                details: error.message
            }));
        }

    // =========================
    // VERSION
    // =========================
    } else if (req.url === "/version") {

        res.writeHead(200);

        res.end(JSON.stringify({
            application: "customer-app",
            version: APP_VERSION,
            environment: ENVIRONMENT
        }));

    // =========================
    // INVALID ENDPOINT
    // =========================
    } else {

        res.writeHead(404);

        res.end(JSON.stringify({
            error: "Endpoint not found"
        }));
    }
});

// =========================
// START SERVER
// =========================
server.listen(PORT, () => {

    console.log("------------------------------------");
    console.log("Customer Application Started");
    console.log("------------------------------------");
    console.log(`Environment : ${ENVIRONMENT}`);
    console.log(`Version     : ${APP_VERSION}`);
    console.log(`Port        : ${PORT}`);
    console.log(`Database    : ${DB_HOST}`);
    console.log(`DB Name     : ${DB_NAME}`);
    console.log("------------------------------------");

});
