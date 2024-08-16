import config from "#config" assert { type: "json" };
import { FSServers } from "#structures";

export const fsServers = new FSServers(config.fs);
