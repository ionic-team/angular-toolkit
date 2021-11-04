## [5.0.3](https://github.com/ionic-team/angular-toolkit/compare/v5.0.2...v5.0.3) (2021-11-04)


### Bug Fixes

* **deps:** use the correct version range ([83cd638](https://github.com/ionic-team/angular-toolkit/commit/83cd638dd0c70e0869d10ddc8e9bb97b3cd6e372))

## [5.0.2](https://github.com/ionic-team/angular-toolkit/compare/v5.0.1...v5.0.2) (2021-11-04)


### Bug Fixes

* **deps:** move peer deps to hard deps ([d389cd3](https://github.com/ionic-team/angular-toolkit/commit/d389cd38c9e4834acba0cbfaa8c71e1c346bb872))

## [5.0.1](https://github.com/ionic-team/angular-toolkit/compare/v5.0.0...v5.0.1) (2021-11-04)


### Bug Fixes

* **deps:** remove peer dep on devkit/architect ([eb46e23](https://github.com/ionic-team/angular-toolkit/commit/eb46e231fd68dec26c168776379a8ed45be99dd4)), closes [#460](https://github.com/ionic-team/angular-toolkit/issues/460)

# [5.0.0](https://github.com/ionic-team/angular-toolkit/compare/v4.0.0...v5.0.0) (2021-10-28)


### Bug Fixes

* bump cheerio to rc4 ([905cff2](https://github.com/ionic-team/angular-toolkit/commit/905cff2f48d001fbfe304ab8b786ef1c8ba8eccd)), closes [#456](https://github.com/ionic-team/angular-toolkit/issues/456)
* update deps to match latest angular ([0100b8b](https://github.com/ionic-team/angular-toolkit/commit/0100b8b98ebcad8d1ad572d7042aaf9e49f30886)), closes [#455](https://github.com/ionic-team/angular-toolkit/issues/455) [#452](https://github.com/ionic-team/angular-toolkit/issues/452)


### Features

* update to support angular 12.0 ([671bfba](https://github.com/ionic-team/angular-toolkit/commit/671bfba7349768c80dc4cfe02fe8c91616927cf1)), closes [#459](https://github.com/ionic-team/angular-toolkit/issues/459) [#460](https://github.com/ionic-team/angular-toolkit/issues/460)


### BREAKING CHANGES

* Apps must use Angular 12.0

# [4.0.0](https://github.com/ionic-team/angular-toolkit/compare/v3.1.1...v4.0.0) (2021-05-25)


### Features

* **package:** update to angular12 ([707175d](https://github.com/ionic-team/angular-toolkit/commit/707175df21762b0c35d8c9cb1d20e881c7b83fbf)), closes [#447](https://github.com/ionic-team/angular-toolkit/issues/447) [#448](https://github.com/ionic-team/angular-toolkit/issues/448)


### BREAKING CHANGES

* **package:** Users will need to upgrade to 12.0.0 of Angular/Angular CLI in order to use this.
In order to migrate, please see https://update.angular.io

## [3.1.1](https://github.com/ionic-team/angular-toolkit/compare/v3.1.0...v3.1.1) (2021-03-16)


### Bug Fixes

* **deps:** rebuild lock file for new versions ([f2a48fe](https://github.com/ionic-team/angular-toolkit/commit/f2a48fe9ca23788b0b01a66c8c6f02431e687dac))

# [3.1.0](https://github.com/ionic-team/angular-toolkit/compare/v3.0.0...v3.1.0) (2021-02-12)


### Features

* **package:** update to Angular11.1 ([71b9800](https://github.com/ionic-team/angular-toolkit/commit/71b9800203db630a64a06e7b6cb60b7925c49743)), closes [#438](https://github.com/ionic-team/angular-toolkit/issues/438)
* **test:** update async to waitForAsync ([#434](https://github.com/ionic-team/angular-toolkit/issues/434)) ([2185e50](https://github.com/ionic-team/angular-toolkit/commit/2185e50aa3e9bdc11115b71045f3ecd6c0e199a7))

# [3.0.0](https://github.com/ionic-team/angular-toolkit/compare/v2.3.3...v3.0.0) (2020-11-17)


### Features

* **deps:** update deps in packages.json ([e56c93e](https://github.com/ionic-team/angular-toolkit/commit/e56c93e29f024a82fe6dfe8573c5d6e3b7b01550))
* update to support angular 11 ([afe9848](https://github.com/ionic-team/angular-toolkit/commit/afe9848974f72553a37e990b8d6b3410977b16f0)), closes [#388](https://github.com/ionic-team/angular-toolkit/issues/388)


### BREAKING CHANGES

* **deps:** Users are required to update to 11.0.0 of Angular/Angular CLI in order to use this.
In order to migrate, please see https://update.angular.io

## [2.3.3](https://github.com/ionic-team/angular-toolkit/compare/v2.3.2...v2.3.3) (2020-08-24)


### Bug Fixes

* **generators:** update path builder ([#275](https://github.com/ionic-team/angular-toolkit/issues/275)) ([1393e8c](https://github.com/ionic-team/angular-toolkit/commit/1393e8c088c93d2a505d1ac96c68f03e32a815ac)), closes [#274](https://github.com/ionic-team/angular-toolkit/issues/274)

## [2.3.2](https://github.com/ionic-team/angular-toolkit/compare/v2.3.1...v2.3.2) (2020-08-21)


### Bug Fixes

* **cordovaserve:** update copy-webpack to new format ([#272](https://github.com/ionic-team/angular-toolkit/issues/272)) ([c1e66b5](https://github.com/ionic-team/angular-toolkit/commit/c1e66b554a80665eed77ad3adfd1117b49bc73ab)), closes [#265](https://github.com/ionic-team/angular-toolkit/issues/265)

## [2.3.1](https://github.com/ionic-team/angular-toolkit/compare/v2.3.0...v2.3.1) (2020-08-19)


### Bug Fixes

* **deps:** update deps for security vulnerabilities ([#263](https://github.com/ionic-team/angular-toolkit/issues/263)) ([f0e514d](https://github.com/ionic-team/angular-toolkit/commit/f0e514d6140d929e521ff4f77844642424cfe7cb)), closes [#261](https://github.com/ionic-team/angular-toolkit/issues/261)

# [2.3.0](https://github.com/ionic-team/angular-toolkit/compare/v2.2.0...v2.3.0) (2020-07-20)


### Features

* update schematics to support ng10 ([#251](https://github.com/ionic-team/angular-toolkit/issues/251)) ([7c9a245](https://github.com/ionic-team/angular-toolkit/commit/7c9a24560088163547369ad67f6d3d98e752bdca))

# [2.2.0](https://github.com/ionic-team/angular-toolkit/compare/v2.1.2...v2.2.0) (2020-02-24)


### Features

* **deps:** bump deps to support angular 9 ([5b80c04](https://github.com/ionic-team/angular-toolkit/commit/5b80c04de6c00b06339c183bbd30efeff5f51dc3))

## [2.1.2](https://github.com/ionic-team/angular-toolkit/compare/v2.1.1...v2.1.2) (2020-01-13)


### Bug Fixes

* **cordova:** add cordova.js to index.html even without scripts array ([c8bb37b](https://github.com/ionic-team/angular-toolkit/commit/c8bb37bd1f817f762720b0e3a5c89b4d6a7464e0)), closes [#188](https://github.com/ionic-team/angular-toolkit/issues/188)

## [2.1.1](https://github.com/ionic-team/angular-toolkit/compare/v2.1.0...v2.1.1) (2019-10-22)


### Bug Fixes

* **build:** handle no scripts in angular ([#182](https://github.com/ionic-team/angular-toolkit/issues/182)) ([388e1ad](https://github.com/ionic-team/angular-toolkit/commit/388e1ad3dec5004ceaa8030acf7a248c121be94c)), closes [#179](https://github.com/ionic-team/angular-toolkit/issues/179)

# [2.1.0](https://github.com/ionic-team/angular-toolkit/compare/v2.0.0...v2.1.0) (2019-10-22)


### Bug Fixes

* **routing:** split out routes into routing module ([#181](https://github.com/ionic-team/angular-toolkit/issues/181)) ([b13b823](https://github.com/ionic-team/angular-toolkit/commit/b13b8233c1b693be7a845494b3d98cda2c8fe1da))
* **unit-tests:** allow the components to hydrate ([#173](https://github.com/ionic-team/angular-toolkit/issues/173)) ([4159e59](https://github.com/ionic-team/angular-toolkit/commit/4159e598a43bdedaaaa4d179dd7c3fabc2618d42))


### Features

* **router:** change to dynamic import ([#176](https://github.com/ionic-team/angular-toolkit/issues/176)) ([fbf3627](https://github.com/ionic-team/angular-toolkit/commit/fbf3627f8a182b48bdacd6ca601d2c9411cf3fda))

# [2.0.0](https://github.com/ionic-team/angular-toolkit/compare/v1.5.1...v2.0.0) (2019-06-25)


### Features

* support Angular 8 ([#132](https://github.com/ionic-team/angular-toolkit/issues/132)) ([166d547](https://github.com/ionic-team/angular-toolkit/commit/166d547))


### BREAKING CHANGES

* this updates dependencies for Angular 8. Users are
    required to update to 8.0.0 of Angular/Angular CLI in order to use
    this. In order to migrate, please see https://update.angular.io

## [1.5.1](https://github.com/ionic-team/angular-toolkit/compare/v1.5.0...v1.5.1) (2019-04-09)


### Bug Fixes

* **cordova-build:** only set sourceMap if specified ([#107](https://github.com/ionic-team/angular-toolkit/issues/107)) ([2a99ac0](https://github.com/ionic-team/angular-toolkit/commit/2a99ac0))

# [1.5.0](https://github.com/ionic-team/angular-toolkit/compare/v1.4.1...v1.5.0) (2019-03-21)


### Bug Fixes

* **cordova:** obey `--source-map` for production builds ([23481bd](https://github.com/ionic-team/angular-toolkit/commit/23481bd))


### Features

* **cordova-serve:** support --consolelogs option ([#100](https://github.com/ionic-team/angular-toolkit/issues/100)) ([07af906](https://github.com/ionic-team/angular-toolkit/commit/07af906))

## [1.4.1](https://github.com/ionic-team/angular-toolkit/compare/v1.4.0...v1.4.1) (2019-03-19)


### Bug Fixes

* **page:** remove padding attribute in ion-content template ([#106](https://github.com/ionic-team/angular-toolkit/issues/106)) ([c33f932](https://github.com/ionic-team/angular-toolkit/commit/c33f932))
* **schematics:** update component spec ([#88](https://github.com/ionic-team/angular-toolkit/issues/88)) ([f19e6d8](https://github.com/ionic-team/angular-toolkit/commit/f19e6d8))

# [1.4.0](https://github.com/ionic-team/angular-toolkit/compare/v1.3.0...v1.4.0) (2019-02-13)


### Features

* **component:** add custom component schematic ([#68](https://github.com/ionic-team/angular-toolkit/issues/68)) ([527f54e](https://github.com/ionic-team/angular-toolkit/commit/527f54e))

# [1.3.0](https://github.com/ionic-team/angular-toolkit/compare/v1.2.3...v1.3.0) (2019-01-29)


### Bug Fixes

* **serve:** pass `cordovaBasePath` to cordova-build builder ([#57](https://github.com/ionic-team/angular-toolkit/issues/57)) ([93e3bbe](https://github.com/ionic-team/angular-toolkit/commit/93e3bbe))


### Features

* **build:** add `--cordova-mock` option ([#63](https://github.com/ionic-team/angular-toolkit/issues/63)) ([a659636](https://github.com/ionic-team/angular-toolkit/commit/a659636))

## [1.2.3](https://github.com/ionic-team/angular-toolkit/compare/v1.2.2...v1.2.3) (2019-01-24)


### Bug Fixes

* **application:** add e2e schematics to fulfill `ng g app` ([fc1421e](https://github.com/ionic-team/angular-toolkit/commit/fc1421e))
* **build:** never delete output path ([b614db9](https://github.com/ionic-team/angular-toolkit/commit/b614db9))
* **serve:** use proxyConfig option from serve ([859ce96](https://github.com/ionic-team/angular-toolkit/commit/859ce96))

## [1.2.2](https://github.com/ionic-team/angular-toolkit/compare/v1.2.1...v1.2.2) (2018-12-21)


### Bug Fixes

* **page:** properly handle project selection ([4875aa7](https://github.com/ionic-team/angular-toolkit/commit/4875aa7))

## [1.2.1](https://github.com/ionic-team/angular-toolkit/compare/v1.2.0...v1.2.1) (2018-12-19)


### Bug Fixes

* **build:** respect browserTarget setting ([3a9adfa](https://github.com/ionic-team/angular-toolkit/commit/3a9adfa))
* **page:** dasherize route path ([e32e77b](https://github.com/ionic-team/angular-toolkit/commit/e32e77b))

# [1.2.0](https://github.com/ionic-team/angular-toolkit/compare/v1.1.0...v1.2.0) (2018-11-15)


### Bug Fixes

* **changelog:** correctly link to commits ([#33](https://github.com/ionic-team/angular-toolkit/issues/33)) ([be96104](https://github.com/ionic-team/angular-toolkit/commit/be96104))


### Features

* **serve:** support `--ssl` for dev-server ([9d65915](https://github.com/ionic-team/angular-toolkit/commit/9d65915))

# [1.1.0](https://github.com/ionic-team/angular-toolkit.git/compare/v1.0.0...v1.1.0) (2018-10-31)


### Bug Fixes

* **serve:** validate cordova-build options to provide defaults ([98d6a63](https://github.com/ionic-team/angular-toolkit/commit/98d6a63))


### Features

* support Angular 7 ([3d1172b](https://github.com/ionic-team/angular-toolkit/commit/3d1172b))

# 1.0.0 (2018-10-05)


### Features

* Initial release ([2a5fab5](https://github.com/ionic-team/angular-toolkit/commit/2a5fab5))
