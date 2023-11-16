# [1.9.0](https://github.com/technologiestiftung/ki-anfragen-api/compare/v1.8.0...v1.9.0) (2023-11-16)


### Features

* add summary to prompt ([#31](https://github.com/technologiestiftung/ki-anfragen-api/issues/31)) ([8ccf872](https://github.com/technologiestiftung/ki-anfragen-api/commit/8ccf872fb2d1c7de7ef62dd56ca2228f52c1f4cb))

# [1.8.0](https://github.com/technologiestiftung/ki-anfragen-api/compare/v1.7.0...v1.8.0) (2023-11-14)


### Features

* search in summary embeddings ([#30](https://github.com/technologiestiftung/ki-anfragen-api/issues/30)) ([2cdd8d8](https://github.com/technologiestiftung/ki-anfragen-api/commit/2cdd8d82ee9ff794bfa652d1c14305362c384083))

# [1.7.0](https://github.com/technologiestiftung/ki-anfragen-api/compare/v1.6.0...v1.7.0) (2023-11-13)


### Features

* init supabase for new schema ([#28](https://github.com/technologiestiftung/ki-anfragen-api/issues/28)) ([753ecc0](https://github.com/technologiestiftung/ki-anfragen-api/commit/753ecc0684d94541dd9f68503e3109cf8be64df4))

# [1.6.0](https://github.com/technologiestiftung/ki-anfragen-api/compare/v1.5.0...v1.6.0) (2023-11-02)


### Features

* search also in red number reports ([#26](https://github.com/technologiestiftung/ki-anfragen-api/issues/26)) ([5d45e8d](https://github.com/technologiestiftung/ki-anfragen-api/commit/5d45e8d2edb9bc51c811ee23750984065fcc7c24))

# [1.5.0](https://github.com/technologiestiftung/ki-anfragen-api/compare/v1.4.1...v1.5.0) (2023-09-12)


### Bug Fixes

* **json schema:** Remove respone schema ([9af8ffd](https://github.com/technologiestiftung/ki-anfragen-api/commit/9af8ffdc7d64a795cca8a7c10cfad09ff38c9011))


### Features

* **schema:** This adds a reponse schema ([3171cda](https://github.com/technologiestiftung/ki-anfragen-api/commit/3171cdac5b66d4ebfc32725a268425ad367bb00a))

## [1.4.1](https://github.com/technologiestiftung/ki-anfragen-api/compare/v1.4.0...v1.4.1) (2023-09-01)


### Bug Fixes

* **logging:** Logging needs first the object ([794680f](https://github.com/technologiestiftung/ki-anfragen-api/commit/794680f9e0200e8fcd63ac16641ed6ba15fe08db))

# [1.4.0](https://github.com/technologiestiftung/ki-anfragen-api/compare/v1.3.0...v1.4.0) (2023-08-30)


### Features

* **response:** add more detail to response ([fc29f16](https://github.com/technologiestiftung/ki-anfragen-api/commit/fc29f16d71e6743d22f83d71598b482b4507376a))

# [1.3.0](https://github.com/technologiestiftung/ki-anfragen-api/compare/v1.2.0...v1.3.0) (2023-08-29)


### Features

* **body schema:** Extend schema with params ([e7095af](https://github.com/technologiestiftung/ki-anfragen-api/commit/e7095afc0ce68a3fffbb31222901e5245cbee9eb))
* **search parameters:** Add opts to tweak request ([cf26f9e](https://github.com/technologiestiftung/ki-anfragen-api/commit/cf26f9e5fc1d2bd1925873e5dba10e8ad9b880ac))

# [1.2.0](https://github.com/technologiestiftung/ki-anfragen-api/compare/v1.1.0...v1.2.0) (2023-08-28)


### Bug Fixes

* **cors:** allow cors for / and /health ([c3b85e8](https://github.com/technologiestiftung/ki-anfragen-api/commit/c3b85e83988278862fc2363ba703679bcdc2916e))
* **cors:** Allow locahost only in development ([ffa7f89](https://github.com/technologiestiftung/ki-anfragen-api/commit/ffa7f8995eb0d8fbe6bca0e5a78be6c7856120b7))
* **cors:** Configure cors only for vector-search ([1f9b4cd](https://github.com/technologiestiftung/ki-anfragen-api/commit/1f9b4cd33ccf5fe743cc451f4ea38e4ed476996a))
* **cors:** Don't allow request without origin ([b3626f7](https://github.com/technologiestiftung/ki-anfragen-api/commit/b3626f72de8d69f718ee85caf2c92a2bc0d7bbc0))
* **origin:** pass if origin is undefined ([5f83e16](https://github.com/technologiestiftung/ki-anfragen-api/commit/5f83e16a2a010cd565bd76d817be65987c717178))
* **test:** Allow tests to pass CORS ([32d4822](https://github.com/technologiestiftung/ki-anfragen-api/commit/32d4822035d4739c43eed792ecea2ea927762127))
* **timeouts:** Move to Service role key ([e2789c1](https://github.com/technologiestiftung/ki-anfragen-api/commit/e2789c14fe91f858a51133953eb628625215f764))
* **timeouts:** Move to Service role key ([e060f71](https://github.com/technologiestiftung/ki-anfragen-api/commit/e060f71b37f3e78c0a30a811b7bdece469f95d93))


### Features

* **CORS:** Configure CORS based on regex ([778aa41](https://github.com/technologiestiftung/ki-anfragen-api/commit/778aa4145a1725eefea3464f9259e5c82424d1e8))
* More control over logging ([61bde37](https://github.com/technologiestiftung/ki-anfragen-api/commit/61bde3793b1fbb7d6f0bb4974b6d1eaf4863d3df))
* **prompt:** Fix wording in prompt ([c819e89](https://github.com/technologiestiftung/ki-anfragen-api/commit/c819e89a2e630fbbb5160bb286b84b2ce513d3ce))

# [1.1.0](https://github.com/technologiestiftung/ki-anfragen-api/compare/v1.0.0...v1.1.0) (2023-08-24)


### Bug Fixes

* **buildserver:** function is async now ([e066ee7](https://github.com/technologiestiftung/ki-anfragen-api/commit/e066ee7f106d4b8885cc743b6bcf37f327cadea6))


### Features

* **CORS:** Allow cors ([c17bd14](https://github.com/technologiestiftung/ki-anfragen-api/commit/c17bd1471dccd180749ebdbec354066d4033b995))

# 1.0.0 (2023-08-24)


### Features

* Docker setup ([c069eaf](https://github.com/technologiestiftung/ki-anfragen-api/commit/c069eafda24ef248f233c3f450d8f7ebc4bc1f32))
* First working version ([8d61233](https://github.com/technologiestiftung/ki-anfragen-api/commit/8d61233980584951100e4609a48eedb46c92d877))
