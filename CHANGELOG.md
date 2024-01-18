# [1.18.0](https://github.com/technologiestiftung/parla-api/compare/v1.17.0...v1.18.0) (2024-01-18)


### Features

* rate limiting ([#59](https://github.com/technologiestiftung/parla-api/issues/59)) ([af5c77c](https://github.com/technologiestiftung/parla-api/commit/af5c77ce7a8a66d0cb41b610329af8f34c4d1dec))

# [1.17.0](https://github.com/technologiestiftung/parla-api/compare/v1.16.0...v1.17.0) (2024-01-16)


### Features

* add external resources table ([#58](https://github.com/technologiestiftung/parla-api/issues/58)) ([b208d53](https://github.com/technologiestiftung/parla-api/commit/b208d534a220205e2fb65308ceba3ad73dc675ce))

# [1.16.0](https://github.com/technologiestiftung/parla-api/compare/v1.15.0...v1.16.0) (2024-01-10)


### Features

* **database:** Enable pg_cron via migration ([7e59e67](https://github.com/technologiestiftung/parla-api/commit/7e59e67e65ad0e02bbd9fe8b237197264d177fb0))

# [1.15.0](https://github.com/technologiestiftung/parla-api/compare/v1.14.0...v1.15.0) (2024-01-09)


### Features

* streaming answer ([#52](https://github.com/technologiestiftung/parla-api/issues/52)) ([92539e7](https://github.com/technologiestiftung/parla-api/commit/92539e7ca01dc33e5ac612dcafdf5772eab0498f))

# [1.14.0](https://github.com/technologiestiftung/parla-api/compare/v1.13.1...v1.14.0) (2024-01-04)


### Features

* better prompt ([#51](https://github.com/technologiestiftung/parla-api/issues/51)) ([0b85b3b](https://github.com/technologiestiftung/parla-api/commit/0b85b3baa09c34e748e2f87a88c3f8fff9bdfc24))

## [1.13.1](https://github.com/technologiestiftung/parla-api/compare/v1.13.0...v1.13.1) (2023-12-14)


### Bug Fixes

* **CORS:** Allow parla.citylab-berlin.org ([989df48](https://github.com/technologiestiftung/parla-api/commit/989df48a4eda89cb1892fced7d087d12fdeed518))

# [1.13.0](https://github.com/technologiestiftung/parla-api/compare/v1.12.1...v1.13.0) (2023-12-11)


### Bug Fixes

* **DB:** Pull remote state of DB into migrations ([09efadb](https://github.com/technologiestiftung/parla-api/commit/09efadb961f958ac435eb13615ccc42313e6d87e))
* Initial index list size ([020e9da](https://github.com/technologiestiftung/parla-api/commit/020e9daf96f6228f73df7d02860c97693388ab20))
* **migrations:** Drop function before creation ([7417528](https://github.com/technologiestiftung/parla-api/commit/74175287309c0cb3452490d13b2cbf4835ca24d9))
* **migrations:** pgFormatter killed the <#> operator ([9efbdda](https://github.com/technologiestiftung/parla-api/commit/9efbdda0093df37f433d9c26309af24006b5fabe))
* Types on api_test ([7ec02cd](https://github.com/technologiestiftung/parla-api/commit/7ec02cd0f32d4ed1587aa3a11790137b0342f9f6))


### Features

* Better logging in dev ([4bc5079](https://github.com/technologiestiftung/parla-api/commit/4bc50795d0ab01f5cb2036272892f8e6febca74c))
* **schema:** Use enum in schema ([63eab60](https://github.com/technologiestiftung/parla-api/commit/63eab604775c7ea615ab929389dd4d15e49231f6))

## [1.12.1](https://github.com/technologiestiftung/parla-api/compare/v1.12.0...v1.12.1) (2023-11-29)


### Bug Fixes

* cleanup db function params ([#40](https://github.com/technologiestiftung/parla-api/issues/40)) ([2279a25](https://github.com/technologiestiftung/parla-api/commit/2279a256fb5f5629ef1408cef9c13e15778d39aa))

# [1.12.0](https://github.com/technologiestiftung/parla-api/compare/v1.11.0...v1.12.0) (2023-11-27)


### Features

* refactoring into separate routes ([#38](https://github.com/technologiestiftung/parla-api/issues/38)) ([cb4b501](https://github.com/technologiestiftung/parla-api/commit/cb4b501609f69c132107db515df78f30f5856f2a))

# [1.11.0](https://github.com/technologiestiftung/parla-api/compare/v1.10.0...v1.11.0) (2023-11-23)


### Features

* functional tests with a set of predefined questions + route for counting docs ([#37](https://github.com/technologiestiftung/parla-api/issues/37)) ([9c0019c](https://github.com/technologiestiftung/parla-api/commit/9c0019cc83f237ed5ba578384bd5cc03ad01f9f0))

# [1.10.0](https://github.com/technologiestiftung/parla-api/compare/v1.9.0...v1.10.0) (2023-11-20)


### Features

* frontend can decide which search algorithm to use ([#32](https://github.com/technologiestiftung/parla-api/issues/32)) ([512d008](https://github.com/technologiestiftung/parla-api/commit/512d00806b096fbfe4f011c1a46e5479607a5faa))

# [1.9.0](https://github.com/technologiestiftung/parla-api/compare/v1.8.0...v1.9.0) (2023-11-16)


### Features

* add summary to prompt ([#31](https://github.com/technologiestiftung/parla-api/issues/31)) ([8ccf872](https://github.com/technologiestiftung/parla-api/commit/8ccf872fb2d1c7de7ef62dd56ca2228f52c1f4cb))

# [1.8.0](https://github.com/technologiestiftung/parla-api/compare/v1.7.0...v1.8.0) (2023-11-14)


### Features

* search in summary embeddings ([#30](https://github.com/technologiestiftung/parla-api/issues/30)) ([2cdd8d8](https://github.com/technologiestiftung/parla-api/commit/2cdd8d82ee9ff794bfa652d1c14305362c384083))

# [1.7.0](https://github.com/technologiestiftung/parla-api/compare/v1.6.0...v1.7.0) (2023-11-13)


### Features

* init supabase for new schema ([#28](https://github.com/technologiestiftung/parla-api/issues/28)) ([753ecc0](https://github.com/technologiestiftung/parla-api/commit/753ecc0684d94541dd9f68503e3109cf8be64df4))

# [1.6.0](https://github.com/technologiestiftung/parla-api/compare/v1.5.0...v1.6.0) (2023-11-02)


### Features

* search also in red number reports ([#26](https://github.com/technologiestiftung/parla-api/issues/26)) ([5d45e8d](https://github.com/technologiestiftung/parla-api/commit/5d45e8d2edb9bc51c811ee23750984065fcc7c24))

# [1.5.0](https://github.com/technologiestiftung/parla-api/compare/v1.4.1...v1.5.0) (2023-09-12)


### Bug Fixes

* **json schema:** Remove respone schema ([9af8ffd](https://github.com/technologiestiftung/parla-api/commit/9af8ffdc7d64a795cca8a7c10cfad09ff38c9011))


### Features

* **schema:** This adds a reponse schema ([3171cda](https://github.com/technologiestiftung/parla-api/commit/3171cdac5b66d4ebfc32725a268425ad367bb00a))

## [1.4.1](https://github.com/technologiestiftung/parla-api/compare/v1.4.0...v1.4.1) (2023-09-01)


### Bug Fixes

* **logging:** Logging needs first the object ([794680f](https://github.com/technologiestiftung/parla-api/commit/794680f9e0200e8fcd63ac16641ed6ba15fe08db))

# [1.4.0](https://github.com/technologiestiftung/parla-api/compare/v1.3.0...v1.4.0) (2023-08-30)


### Features

* **response:** add more detail to response ([fc29f16](https://github.com/technologiestiftung/parla-api/commit/fc29f16d71e6743d22f83d71598b482b4507376a))

# [1.3.0](https://github.com/technologiestiftung/parla-api/compare/v1.2.0...v1.3.0) (2023-08-29)


### Features

* **body schema:** Extend schema with params ([e7095af](https://github.com/technologiestiftung/parla-api/commit/e7095afc0ce68a3fffbb31222901e5245cbee9eb))
* **search parameters:** Add opts to tweak request ([cf26f9e](https://github.com/technologiestiftung/parla-api/commit/cf26f9e5fc1d2bd1925873e5dba10e8ad9b880ac))

# [1.2.0](https://github.com/technologiestiftung/parla-api/compare/v1.1.0...v1.2.0) (2023-08-28)


### Bug Fixes

* **cors:** allow cors for / and /health ([c3b85e8](https://github.com/technologiestiftung/parla-api/commit/c3b85e83988278862fc2363ba703679bcdc2916e))
* **cors:** Allow locahost only in development ([ffa7f89](https://github.com/technologiestiftung/parla-api/commit/ffa7f8995eb0d8fbe6bca0e5a78be6c7856120b7))
* **cors:** Configure cors only for vector-search ([1f9b4cd](https://github.com/technologiestiftung/parla-api/commit/1f9b4cd33ccf5fe743cc451f4ea38e4ed476996a))
* **cors:** Don't allow request without origin ([b3626f7](https://github.com/technologiestiftung/parla-api/commit/b3626f72de8d69f718ee85caf2c92a2bc0d7bbc0))
* **origin:** pass if origin is undefined ([5f83e16](https://github.com/technologiestiftung/parla-api/commit/5f83e16a2a010cd565bd76d817be65987c717178))
* **test:** Allow tests to pass CORS ([32d4822](https://github.com/technologiestiftung/parla-api/commit/32d4822035d4739c43eed792ecea2ea927762127))
* **timeouts:** Move to Service role key ([e2789c1](https://github.com/technologiestiftung/parla-api/commit/e2789c14fe91f858a51133953eb628625215f764))
* **timeouts:** Move to Service role key ([e060f71](https://github.com/technologiestiftung/parla-api/commit/e060f71b37f3e78c0a30a811b7bdece469f95d93))


### Features

* **CORS:** Configure CORS based on regex ([778aa41](https://github.com/technologiestiftung/parla-api/commit/778aa4145a1725eefea3464f9259e5c82424d1e8))
* More control over logging ([61bde37](https://github.com/technologiestiftung/parla-api/commit/61bde3793b1fbb7d6f0bb4974b6d1eaf4863d3df))
* **prompt:** Fix wording in prompt ([c819e89](https://github.com/technologiestiftung/parla-api/commit/c819e89a2e630fbbb5160bb286b84b2ce513d3ce))

# [1.1.0](https://github.com/technologiestiftung/parla-api/compare/v1.0.0...v1.1.0) (2023-08-24)


### Bug Fixes

* **buildserver:** function is async now ([e066ee7](https://github.com/technologiestiftung/parla-api/commit/e066ee7f106d4b8885cc743b6bcf37f327cadea6))


### Features

* **CORS:** Allow cors ([c17bd14](https://github.com/technologiestiftung/parla-api/commit/c17bd1471dccd180749ebdbec354066d4033b995))

# 1.0.0 (2023-08-24)


### Features

* Docker setup ([c069eaf](https://github.com/technologiestiftung/parla-api/commit/c069eafda24ef248f233c3f450d8f7ebc4bc1f32))
* First working version ([8d61233](https://github.com/technologiestiftung/parla-api/commit/8d61233980584951100e4609a48eedb46c92d877))
