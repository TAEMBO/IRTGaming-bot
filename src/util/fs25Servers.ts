import config from "#config" with { type: "json" };
import { FS25Servers } from "#structures";

export const fs25Servers = new FS25Servers(config.fs25);