import express from "express";
import bodyParser from "body-parser";
import * as dotenv from "dotenv";
import UserRoute from "./routes/users";
import PlanRoute from "./routes/plans";
import TransactionRoute from "./routes/transactions";
import GoalRoute from "./routes/goals";
import CategoryRoute from "./routes/categories";
import SubcategoryRoute from "./routes/subcategories";
import IncomeSourceRoute from "./routes/incomeSources";
import { setupSwagger } from "./swagger";
import { exceptionMiddleware } from "./services/apiService";
import TagRoute from "./routes/tags";

dotenv.config();

if (!process.env.PORT) {
  console.log(`No port value specified...`);
}

// To add example values in your postgresql db, uncomment the lines below
// import {dbMock} from "./db/dbMock";
// import {db} from "./db/index";
// dbMock(db);

const PORT = parseInt(process.env.PORT as string, 10);

const app = express();

app.use(
  bodyParser.urlencoded({
    extended: true,
  }),
);

app.use(express.json());
// Setup Swagger
setupSwagger(app);
// initializeStorage();

app.use((req, res, next) => {
  const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(",").map((o) => o.trim())
    : ["http://localhost:3000"];

  const requestOrigin = req.headers.origin;

  if (
    requestOrigin &&
    (allowedOrigins.includes(requestOrigin) ||
      allowedOrigins.includes("*") ||
      requestOrigin.endsWith(".github.io") ||
      requestOrigin.endsWith(".onrender.com") ||
      requestOrigin.startsWith("http://localhost:"))
  ) {
    res.setHeader("Access-Control-Allow-Origin", requestOrigin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", allowedOrigins[0] ?? "*");
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  // Respond immediately to preflight requests
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

app.use("/users", UserRoute);
app.use("/plans", PlanRoute);
app.use("/transactions", TransactionRoute);
app.use("/goals", GoalRoute);
app.use("/categories", CategoryRoute);
app.use("/subcategories", SubcategoryRoute);
app.use("/income-sources", IncomeSourceRoute);
app.use("/tags", TagRoute);
// app.use("/" + staticServerUrl, express.static(storagePath));
app.use(exceptionMiddleware);

app.listen(PORT, () => {
  console.log(`WorkDeck API running on port ${PORT}`);
});
