import FTPClient from "ftp";
import type { FSServer } from "#typings";
import { stringifyStream } from "#util";

export class FTPActions extends FTPClient {
    public constructor(private config: FSServer["ftp"]) {
        super();
    }

    private async login() {
        super.connect(this.config);

        await new Promise<void>(res => this.on("ready", res));
    }

    public async get(path: string) {
        await this.login();

        const data = await new Promise<string>((res, rej) => super.get(
            this.config.path + path,
            async (err, stream) => err ? rej(err) : res(await stringifyStream(stream))
        ));

        super.end();

        return data;
    }

    public async put(data: NodeJS.ReadableStream | string | Buffer, path: string) {
        await this.login();

        await new Promise<void>((res, rej) => super.put(
            data,
            this.config.path + path,
            (err) => err ? rej(err) : res()
        ));

        super.end();
    }

    public async delete(path: string) {
        await this.login();

        await new Promise<void>((res, rej) => super.delete(
            this.config.path + path,
            (err) => err ? rej(err) : res()
        ));

        super.end();
    }
}