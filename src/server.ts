import express from 'express';
import path from 'path';
import fs from 'fs';
import im from 'istanbul-middleware';

import 'colors';


export default (opts = {}) => {
    const settings = {
        ...{
            port: 8000,
            dirTests: path.resolve(process.cwd(), '__tests__'),
            dirJS: path.resolve(process.cwd(), 'lib'),
        },
        ...opts
    };

    try {
        fs.statSync(settings.dirTests);
    } catch (e) {
        return console.log('\nSupplied test directory'.red,
            settings.dirTests.yellow,
            ' does not exist\n'.red
        );
    }

    const app = express();

    im.hookLoader(settings.dirJS);
    app.use('/coverage', im.createHandler());
    app.use(im.createClientHandler(settings.dirJS));

    // Serve web components polyfill
    app.use(
        '/webcomponents-bundle.js',
        (req, res) => res.sendFile(path.resolve(
            __dirname, 'node_modules/@webcomponents/webcomponentsjs/webcomponents-bundle.js'
        ))
    );

    // Serve the html files from the directory, and inject the webcomponents bundle
    app.use('/*.html', (req, res, next) => {
        let file = fs.readFileSync(path.join(settings.dirTests, req.originalUrl)).toString();
        file = file.replace(/<head>/, '<head><script src="/webcomponents-bundle.js"></script>');
        res.send(file);
    });

    return app.listen(settings.port);
};
