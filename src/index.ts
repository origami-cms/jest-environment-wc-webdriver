// @ts-ignore
import FFP from 'find-free-port';
import { Server } from 'http';
// @ts-ignore
import NodeEnvironment from 'jest-environment-node';
import { Builder, By, until, WebDriver } from 'selenium-webdriver';
import { promisify } from 'util';
import * as coverage from './coverage';
import server from './server';
const ffp = promisify(FFP);

type Browser =  'chrome' | 'edge' | 'firefox' | 'ie' | 'opera' | 'safari';


interface Options {
    browsers: string[];
    seleniumAddress?: string;
    js: string;
    reports: string[];
    host: string;
    coverageDir: string;
}

const DEFAULT_OPTIONS: Options = {
    browsers: ['chrome'],
    js: 'lib',
    reports: ['html', 'json'],
    host: 'localhost',
    coverageDir: 'coverage'
};

const DEFAULT_PORT = 3000;


declare module NodeJS {
    interface Global {
        __coverage__: object;
    }
}

module.exports = class WCWebDriverEnvironment extends NodeEnvironment {
    options: Options;
    drivers: {[browser in Browser]?: WebDriver} = {};
    port?: number;
    app?: Server;
    // @ts-ignore Set by super
    global: {[key: string]: any};

    constructor(config: jest.ProjectConfig) {
        super(config);

        this.options = {
            ...DEFAULT_OPTIONS,
            ...config.testEnvironmentOptions
        };

        // Cast options from string to array
        if (typeof this.options.browsers === 'string') {
            this.options.browsers = [this.options.browsers];
        }
        if (typeof this.options.reports === 'string') {
            this.options.reports = [this.options.reports];
        }
    }


    async setup() {
        await super.setup();

        // Setup the URL to send coverage reports to, serve the
        // polyfill and instrumented JS files

        this.port = await ffp(DEFAULT_PORT);
        this.global.URL = `http://${this.options.host}:${this.port}`;


        // Setup the express server with the istanbul-middleware and file serving
        this.app = server({
            port: this.port,
            dirJS: this.options.js
        }) as Server;


        // Generate the WebDriver's for each browser
        await Promise.all((this.options.browsers as Browser[]).map(async b => {
            let builder = new Builder();
            let driver;

            if (this.options.seleniumAddress) {
                builder = builder.usingServer(this.options.seleniumAddress);
            }

            try {
                driver = await builder.forBrowser(b).build();
            } catch (e) {
                console.log(e);
            }

            this.drivers[b] = driver;
        }));


        // Expose some functions from WebDriver to use in the test files
        this.global.by = By;
        this.global.until = until;
        this.global.browsers = this.drivers;
    }


    async teardown() {
        try {
            // Before the test finishes, send the coverage to the server
            await coverage.sendCoverage(
                this.options.host,
                this.port!,
                // @ts-ignore
                this.drivers[this.options.browsers[0]]
            );

            // Generate a report and write to disk
            await coverage.generateReport(
                // @ts-ignore
                global.__coverage__,
                this.options.reports,
                this.options.coverageDir
            );
        } catch (e) {
            console.log(e.toString().red);
        }

        try {
            // Quit each browser driver
            Object.values(this.drivers).forEach(async d => {
                await d!.quit();
            });
        } catch (e) {
            console.log(e.toString().red);
        }

        // Stop the server
        await this.app!.close();

        // Complete teardown
        await super.teardown();
    }
};
