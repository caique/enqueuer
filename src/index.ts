#!/usr/bin/env node
import './injectable-files-list';
import {EnqueuerStarter} from './enqueuer-starter';

if (!process.env.NODE_ENV_TEST) {
    new EnqueuerStarter()
        .start()
        .then((statusCode: number) => process.exit(statusCode));
}
