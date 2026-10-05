import { app } from "./app";
import { config } from "./config";
import { log } from "./lib/logger";

app.listen(config.PORT, () => log.server(`API running on http://localhost:${config.PORT}`));
