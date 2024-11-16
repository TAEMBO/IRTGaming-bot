import config from "#config" with { type: "json" };
import { FS22Servers } from "#structures";

export const fs22Servers = new FS22Servers(config.fs22);