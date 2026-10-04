import express from "express"
import bodyParser from "body-parser"
import * as dotenv from "dotenv"
import UserRoute from "./routes/users";
import {setupSwagger} from "./swagger";
import {exceptionMiddleware} from "./services/apiService";

dotenv.config()

if (!process.env.PORT) {
    console.log(`No port value specified...`)
}

// To add example values in your postgresql db, uncomment the lines below
// import {dbMock} from "./db/dbMock";
// import {db} from "./db/index";
// dbMock(db);

const PORT = parseInt(process.env.PORT as string, 10)

const app = express();

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(express.json());
// Setup Swagger
setupSwagger(app);
// initializeStorage();

// CORS: only the frontend origin may call the API from a browser
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:3000";

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', CORS_ORIGIN);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Vary', 'Origin');

    // Answer preflight requests directly
    if (req.method === 'OPTIONS') {
        res.sendStatus(204);
        return;
    }
    next();
});

app.use("/users", UserRoute);
// app.use("/" + staticServerUrl, express.static(storagePath));
app.use(exceptionMiddleware);


app.listen(PORT, () => {
    console.log(`API running on port ${PORT}`)
})

