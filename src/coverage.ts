import path from 'path';
import http from 'http';
import fs from 'fs';
import * as istanbul from 'istanbul';

const Report = istanbul.Report;
const Collector = istanbul.Collector;
const utils = istanbul.utils;


// Retrieve the __coverage__ object from the WebDriver window and post to the
// Istanbul middleware handler
export const sendCoverage = (host: string, port: number, driver: any) =>
    new Promise(async res => {
        await driver.switchTo().defaultContent();
        const obj = await driver.executeScript('return window.__coverage__;');

        const str = JSON.stringify(obj);
        const options = {
            port,
            host,
            path: '/coverage/client',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        };

        const req = http.request(options, (resp: any) => {
            let data = '';
            // you *must* listen to data event
            // so that the end event will fire...
            resp.on('data', (d: string) => data += d);

            // Finished sending coverage data
            resp.once('end', () => res());
        });

        req.write(str);
        req.end();
    });


// Writes a report from the coverage object and stores to
export const generateReport = async (coverageObject: object, reports: string[], dir: string) => {
    const coverageDir = path.resolve(process.cwd(), dir);

    try {
        fs.statSync(coverageDir);
    } catch (e) {
        fs.mkdirSync(coverageDir);
    }

    const collector = new Collector();
    const reporters = reports.map(r =>
        // @ts-ignore
        Report.create(r, {dir: coverageDir})
    );

    // @ts-ignore
    utils.removeDerivedInfo(coverageObject);
    collector.add(coverageObject);

    reporters.forEach(r => r.writeReport(collector));
};
