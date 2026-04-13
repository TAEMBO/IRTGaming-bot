import config from "#config" with { type: "json" };
import { FSServers } from "#structures";
<<<<<<< HEAD

export const fsServers = new FSServers(config.fs);
=======
import { normalizeConfig } from "./config.js";

export const fsServers = new FSServers(normalizeConfig(config).fs);
>>>>>>> e0ae159 (clean: config validation + crash fixes)
