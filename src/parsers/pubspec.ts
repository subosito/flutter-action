import {promises as fs} from "fs";
import * as core from "@actions/core";
import * as yaml from "js-yaml";

export async function parse() : Promise<IFlutterVersion> {
    const pubspecContent = await fs.readFile('pubspec.yaml', 'utf8');
    const pubspec = yaml.load(pubspecContent) as any;
    const pubspecVersion = pubspec['environment']['flutter'];
    core.info(`Read Flutter version ${pubspecVersion} from pubspec.yaml`)
    return {
        version: pubspecVersion,
        channel: 'any',
    };
}