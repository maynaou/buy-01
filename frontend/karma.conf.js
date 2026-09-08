module.exports = function (config) {
  config.set({
    basePath: '',

    frameworks: ['jasmine'],

    plugins: [
      'karma-jasmine',
      'karma-chrome-launcher',
      'karma-jasmine-html-reporter'
    ],

    customLaunchers: {
      ChromeHeadlessNoSandbox: {
        base: 'ChromeHeadless',
        flags: [
          '--no-sandbox',
          '--disable-gpu',
          '--disable-dev-shm-usage'
        ]
      }
    },

    browsers: ['ChromeHeadlessNoSandbox'],

    reporters: ['progress', 'kjhtml'],

    restartOnFileChange: true
  });
};