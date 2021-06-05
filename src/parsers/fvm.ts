import {promises as fs} from "fs";
import * as core from "@actions/core";

export async function parse() : Promise<IFlutterVersion> {
    const content = await fs.readFile('.fvm/flutter_config.json', 'utf8');
    const json = JSON.parse(content);
    const fvmVersion = json['flutterSdkVersion'];
    core.info(`Read Flutter version ${fvmVersion} from FVM configuration`);
    // For FVM this version can also be a channel
    if (['stable', 'beta', 'dev', 'master'].includes(fvmVersion)) {
        return {
            version: '',
            channel: fvmVersion,
        };
    }
    return {
        version: fvmVersion,
        channel: 'any',
    };
}