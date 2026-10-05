import createDebug from "debug";

// All logging goes through `debug`, so nothing is printed unless enabled: DEBUG=arca:* npm run dev
export const log = {
  server: createDebug("arca:server"),
  error: createDebug("arca:error"),
};
