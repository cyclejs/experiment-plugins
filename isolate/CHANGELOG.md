<a name="3.2.0"></a>
# 3.2.0 (2017-10-24)



<a name="3.1.0"></a>
# 3.1.0 (2017-08-12)



<a name="3.0.0"></a>
# 3.0.0 (2017-06-20)


### Features

* **isolate:** support null scope to disable isolation ([2427d76](https://github.com/cyclejs/cyclejs/commit/2427d76))


### BREAKING CHANGES

* **isolate:** This is a breaking change only in case you utilized null scopes to perform isolation. Previously
null scope would enable isolation using null as the isolation name, and now null scope will just
disable isolation. It would be quite a corner case to rely on null scopes, so this will breaking
change likely not affect your project, and this new version of isolate is rather safe to upgrade.



<a name="2.1.0"></a>
# 2.1.0 (2017-03-08)


### Features

* **isolate:** allow a scopes-per-channel object as second arg ([e35b731](https://github.com/cyclejs/cyclejs/commit/e35b731))



<a name="2.0.0"></a>
# 2.0.0 (2017-02-22)

**See the changelog for all the `rc` versions of v2.0.0.**


<a name="2.0.0-rc.2"></a>
# 2.0.0-rc.2 (2017-02-08)


### Bug Fixes

* **isolate:** fix typings for isolate, accepts any sources ([ccd5ec1](https://github.com/cyclejs/cyclejs/commit/ccd5ec1))
* **isolate:** update codebase to use TypeScript 2.1 ([0ec0980](https://github.com/cyclejs/cyclejs/commit/0ec0980))


### BREAKING CHANGES

* isolate: If you use JavaScript, this will not be a breaking change. If you use TypeScript 2.0, this is a
* isolate: as we are using exclusive TypeScript 2.1 features, only supported in v2.1.



<a name="2.0.0-rc.1"></a>
# 2.0.0-rc.1 (2017-02-03)


### Bug Fixes

* **isolate:** update codebase to use TypeScript 2.1 ([0ec0980](https://github.com/cyclejs/cyclejs/commit/0ec0980))


### BREAKING CHANGES

* isolate: If you use JavaScript, this will not be a breaking change. If you use TypeScript 2.0, this is a
* isolate: as we are using exclusive TypeScript 2.1 features, only supported in v2.1.



<a name="1.4.0"></a>
# 1.4.0 (2016-07-16)



