import config from "#config" with { type: "json" };
import { FSServers } from "#structures";

export const fsServers = new FSServers(config.fs);