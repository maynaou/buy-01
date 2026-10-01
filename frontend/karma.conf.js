module.exports = function (config) {
  config.set({
    basePath: '',

    frameworks: ['jasmine'],

    plugins: [
      'karma-jasmine',
      'karma-chrome-launcher',
      'karma-junit-reporter',
      'karma-coverage'
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

    reporters: ['progress', 'junit', 'coverage'],

    junitReporter: {
      outputDir: 'test-results',
      outputFile: 'karma-results.xml',
      useBrowserName: false
    },

    coverageReporter: {
      dir: require('path').join(__dirname, './coverage'),
      subdir: '.',
      reporters: [
        { type: 'html' },
        { type: 'lcovonly' },
        { type: 'text-summary' }
      ]
    },

    restartOnFileChange: true
  });
};