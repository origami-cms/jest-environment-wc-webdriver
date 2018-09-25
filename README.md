# Jest Test Environment - Web Components & Selenium Web Driver

This project contains a test environment for testing Web Components with Selenium and Jest.
It also provides coverage from istanbul and a file server for running HTML files injected with the Web Components polyfill.

## Motivation

Polymer CLI has some great testing, however there was motivation to use Jest for testing. Additionally, all Jest DOM testers don't support Web Components (JSDOM, etc).

## Installation

Install `jest-environment-wc-webdriver` with npm or yarn:

```bash
yarn add -D jest-environment-wc-webdriver
```

```bash
npm i --save-dev jest-environment-wc-webdriver
```

Then, in your `jest.config.js` (or whever you're configuring Jest), add:

```js
module.exports = {
    "testEnvironment": "jest-environment-wc-webdriver"
}
```

---

## Usage

This test environment automatically exposes some functions and objects to drive browsers.

### `browsers`

By default `browsers` is:

```js
{
    'chrome': ChromeDriver
}
```

Where `ChromeDriver` is the WebDriver created by `selenium-webdriver`. If you want to test more than one browser, you can configue the `testEnvironmentOptions` in your `jest.config.js` like so:

```js
module.exports = {
    "testEnvironment": "jest-environment-wc-webdriver",
    "testEnvironmentOptions": {
        "browsers": ["chrome", "firefox", "safari"]
    }
}
```

Then in your `__tests__/myComponent.js` file:

```js
const url = `${URL}/myComponent.spec.html`

Object.entries(browsers).forEach(([browserName, browser]) => {

    describe(`${browserName}: <my-component>`, () => {
        test('it renders', async () => {
            await browser.get(url) // Here, the URL is created by the test environment
            const component = await browser.findElement(by.tagName('my-component'));
            expect(component).toBeDefined();
        })
    })
});
```

This will test the component exists in each browser specified in the `testEnvironmentOptions.browsers`


## Serving HTML files and instrumented JS files (via istanbul)

This test environment serves HTMl files from the `__tests__` directory. It automatically injects a `webcomponents-bundle.js` javascript file for browsers that need it. Additionally, any JS files configured in the `testEnvironmentOptions.js` directory will be instrumented with Istanbul.


## Configuration

The `testEnvironmentOptions` in your `jest.config.js` takes the following options:

| option | type | default | description |
|-|-|-|-|
| `browsers` | `string[]` | `['chrome']` | Browsers to test |
| `js` |  `string` | `'lib'` | Javascript directory to serve instrumented JS files from |
| `reports` | `string[]` | `['html', 'json']` | Istanbul report types |
| `host` | `string` | `'localhost'` | Server host |
| `coverageDir` | `string` | `'coverage'` | Server port |
