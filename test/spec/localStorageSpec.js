'use strict';

describe('localStorageService', function () {
    var elmSpy;

    //Actions
    function getItem(key) {
        return function ($window, localStorageService) {
            elmSpy = spyOn($window.localStorage, 'getItem').and.callThrough();
            localStorageService.get(key);
        };
    }

    function addItem(key, value) {
        return function ($window, localStorageService) {
            elmSpy = spyOn($window.localStorage, 'setItem').and.callThrough();
            localStorageService.set(key, value);
        };
    }

    function removeItem(key) {
        return function ($window, localStorageService) {
            elmSpy = spyOn($window.localStorage, 'removeItem').and.callThrough();
            localStorageService.remove(key);
        };
    }

    //Expectations
    function expectGetting(key) {
        return function () {
            expect(elmSpy).toHaveBeenCalledWith(key);
        };
    }

    function expectAdding(key, value) {
        return function () {
            expect(elmSpy).toHaveBeenCalledWith(key, value);
        };
    }

    function expectRemoving(key) {
        return function () {
            expect(elmSpy).toHaveBeenCalledWith(key);
        };
    }

    function expectMatching(key, expected) {
        return function (localStorageService) {
            expect(localStorageService.get(key)).toEqual(expected);
        };
    }

    function expectStorageTyping(type) {
        return function (localStorageService) {
            expect(localStorageService.getStorageType()).toEqual(type);
        };
    }

    function expectSupporting(expected) {
        return function (localStorageService) {
            expect(localStorageService.isSupported).toEqual(expected);
        };
    }

    function expectCookieSupporting(expected) {
        return function (localStorageService) {
            expect(localStorageService.cookie.isSupported).toEqual(expected);
        };
    }

    function expectDefaultToCookieSupporting(expected) {
        return function (localStorageService) {
            expect(localStorageService.defaultToCookie).toEqual(expected);
        };
    }

    function expectDomain(domain) {
        return function ($document, localStorageService) {
            localStorageService.set('foo', 'bar'); //Should trigger first time
            expect($document.cookie.indexOf('domain=' + domain)).not.toEqual(-1);
        };
    }

    function expectCookieConfig(exp, path) {
        return function ($document, localStorageService) {
            localStorageService.set('foo', 'bar'); //Should trigger first time
            // Just compare the expiry date, not the time, because of daylight savings
            var expiryStringPartial = exp.substr(0, exp.indexOf(new Date().getFullYear()));
            expect($document.cookie.indexOf('expires=' + expiryStringPartial)).not.toEqual(-1);
            expect($document.cookie.indexOf('path=' + path)).not.toEqual(-1);
            expect($document.cookie.indexOf('secure')).toEqual(-1);
        };
    }

    function expectCookieExpiry(exp) {
        return function ($document, localStorageService) {
            localStorageService.cookie.set('foo', 'bar', 10); //Should trigger first time
            // Just compare the expiry date, not the time, because of daylight savings
            var expiryStringPartial = exp.substr(0, exp.indexOf(new Date().getFullYear()));
            expect($document.cookie.indexOf('expires=' + expiryStringPartial)).not.toEqual(-1);
        };
    }

    function expectCookieSecure() {
        return function ($document, localStorageService) {
            localStorageService.cookie.set('foo', 'bar', null, true);
            expect($document.cookie.indexOf('secure')).not.toEqual(-1);
        };
    }

    //Provider
    function setPrefix(prefix) {
        return function (localStorageServiceProvider) {
            localStorageServiceProvider.setPrefix(prefix);
        };
    }

    function setDefaultToCookie(shouldDefault) {
        return function (localStorageServiceProvider) {
            localStorageServiceProvider.setDefaultToCookie(shouldDefault);
        };
    }

    function setNotify(itemSet, itemRemove) {
        return function (localStorageServiceProvider) {
            localStorageServiceProvider.setNotify(itemSet, itemRemove);
        };
    }

    function setStorage(type) {
        return function (localStorageServiceProvider) {
            localStorageServiceProvider.setStorageType(type);
        };
    }

    function setCookieDomain(domain) {
        return function (localStorageServiceProvider) {
            localStorageServiceProvider.setStorageCookieDomain(domain);
        };
    }

    function setStorageCookie(exp, path, secure) {
        return function (localStorageServiceProvider) {
            localStorageServiceProvider.setStorageCookie(exp, path, secure);
        };
    }

    beforeEach(module('LocalStorageModule', function ($provide) {

        $provide.value('$window', {
            localStorage: localStorageMock()
        });

    }));

    it('isSupported should be true', inject(
      expectSupporting(true)
    ));

    it('typing should be "localStorage" by default, if supported', inject(
      expectStorageTyping('localStorage')
    ));

    it('should add key to localeStorage with initial prefix(ls)', inject(
      addItem('foo', 'bar'),
      expectAdding('ls.foo', '"bar"')
    ));

    it('should add key to localeStorage null if value not provided', inject(
      addItem('foo'),
      expectAdding('ls.foo', null)
    ));

    it('should support to set custom prefix', function () {
        module(setPrefix('myApp'));
        inject(
          addItem('foo', 'bar'),
          expectAdding('myApp.foo', '"bar"')
        );
    });

    it('should support to set empty prefix', function () {
        module(setPrefix(''));
        inject(
          addItem('foo', 'bar'),
          expectAdding('foo', '"bar"')
        );
    });

    it('should support changing prefix on the fly', function() {
        module(function(localStorageServiceProvider) {
            localStorageServiceProvider.setPrefix('startPrefix');
        });

        inject(function(localStorageService) {
            localStorageService.setPrefix('newPrefix');
            localStorageService.add('foo', 'bar');
            expectAdding('newPrefix.foo', 'bar');
        });
    });

    it('should be able to chain functions in the config phase', function () {
        module(function (localStorageServiceProvider) {
            localStorageServiceProvider
              .setPrefix('chain')
              .setNotify(false, true)
              .setStorageType('session');
        });
        inject(function (localStorageService) {
            expect(localStorageService.deriveKey('foo')).toEqual('chain.foo');
            expect(localStorageService.getStorageType()).toEqual('session');
        });
    });

    it('should be able to return the derive key', function () {
        module(setPrefix('myApp'));
        inject(function (localStorageService) {
            expect(localStorageService.deriveKey('foo')).toEqual('myApp.foo');
        });
    });

    it('should be able to return the underivedkey', function () {
        module(setPrefix('myApp'));
        inject(function (localStorageService) {
            expect(localStorageService.underiveKey('myApp.foo')).toEqual('foo');
        });
    });

    it('should be able to set and get arrays', function () {
        var values = ['foo', 'bar', 'baz'];
        inject(
          addItem('appKey', values),
          expectAdding('ls.appKey', angular.toJson(values)),
          expectMatching('appKey', values)
        );
    });

    it('should be able to set and get objects', function () {
        var values = { 0: 'foo', 1: 'bar', 2: 'baz' };
        inject(
          addItem('appKey', values),
          expectAdding('ls.appKey', angular.toJson(values)),
          expectMatching('appKey', values)
        );
    });

    it('should be able to set and get objects contains boolean-like strings - issue #225', function () {
        var t = { x: 'true', y: 'false' };
        inject(
          addItem('appKey', t),
          expectAdding('ls.appKey', angular.toJson(t)),
          expectMatching('appKey', t)
        );
    });

    it('should be able to set and get integers', function () {
        inject(
          addItem('appKey', 777),
          expectAdding('ls.appKey', angular.toJson(777)),
          expectMatching('appKey', 777)
        );
    });

    it('should be able to set and get float numbers', function () {
        inject(
          addItem('appKey', 123.123),
          expectAdding('ls.appKey', angular.toJson(123.123)),
          expectMatching('appKey', 123.123)
        );
    });

    it('should be able to set and get booleans', function () {
        inject(
            addItem('appKey', true),
            expectAdding('ls.appKey', angular.toJson(true)),
            expectMatching('appKey', true)
        );
    });

    it('should be able to set and get boolean-like strings', function () {
        inject(
          addItem('appKey', 'true'),
          expectAdding('ls.appKey', angular.toJson('true')),
          expectMatching('appKey', 'true')
        );
    });

    it('should be able to set and get null-like strings', function () {
        inject(
          addItem('appKey', 'null'),
          expectAdding('ls.appKey', angular.toJson('null')),
          expectMatching('appKey', 'null')
        );
    });

    it('should be able to set and get strings', function () {
        inject(
          addItem('appKey', 'string'),
          expectAdding('ls.appKey', '"string"'),
          expectMatching('appKey', 'string')
        );
    });

    it('should be able to set and get numbers as a strings', function () {
        inject(
          addItem('appKey', '777'),
          expectAdding('ls.appKey', angular.toJson('777')),
          expectMatching('appKey', '777')
        );
    });

    it('should be able to get items', inject(
      getItem('appKey'),
      expectGetting('ls.appKey')
    ));

    it('should be able to remove items', inject(
      removeItem('lorem.ipsum'),
      expectRemoving('ls.lorem.ipsum')
    ));

    it('should be able to remove multiple items', inject(function ($window, localStorageService) {
        elmSpy = spyOn($window.localStorage, 'removeItem').and.callThrough();
        localStorageService.remove('lorem.ipsum1', 'lorem.ipsum2', 'lorem.ipsum3');

        expect(elmSpy.calls.count()).toEqual(3);
        expect(elmSpy).toHaveBeenCalledWith('ls.lorem.ipsum1');
        expect(elmSpy).toHaveBeenCalledWith('ls.lorem.ipsum2');
        expect(elmSpy).toHaveBeenCalledWith('ls.lorem.ipsum3');
    }));

    it('should be able only to remove owned keys', inject(function ($window, localStorageService) {
        localStorageService.set('appKey', 'appValue');
        $window.localStorage.setItem('appKey', 'appValue');

        expect($window.localStorage.getItem('ls.appKey')).toBeDefined();
        expect($window.localStorage.getItem('appKey')).toBeDefined();

        localStorageService.remove('appKey');

        expect($window.localStorage.getItem('ls.appKey')).toBeNull();
        expect($window.localStorage.getItem('appKey')).toBeDefined();
    }));

    it('should be able only to remove keys with empty prefix', function () {
        module(setPrefix(''));
        inject(function ($window, localStorageService) {
            localStorageService.set('appKey', 'appValue');

            expect($window.localStorage.getItem('appKey')).toBeDefined();

            localStorageService.remove('appKey');

            expect($window.localStorage.getItem('appKey')).toBeNull();
        });
    });

    it('should broadcast event on settingItem', inject(function ($rootScope, localStorageService) {
        var setSpy = spyOn($rootScope, '$broadcast');
        localStorageService.set('Ariel', 'Mashraki');
        expect(setSpy).toHaveBeenCalled();
    }));

    it('should not broadcast event on removingItem', inject(function ($rootScope, localStorageService) {
        var removeSpy = spyOn($rootScope, '$broadcast');
        localStorageService.remove('Ariel', 'Mashraki');
        expect(removeSpy).not.toHaveBeenCalled();
    }));

    it('should be able to change notify/broadcasting settings', function () {
        module(setNotify(false, false));
        inject(function ($rootScope, localStorageService) {
            var spy = spyOn($rootScope, '$broadcast');
            localStorageService.set('a8m', 'foobar');
            localStorageService.remove('a8m', 'foobar');

            expect(spy).not.toHaveBeenCalled();
        });
    });

    it('should be able to notify/broadcasting if set', function () {
        module(setNotify(true, true));
        inject(function ($rootScope, localStorageService) {
            var spy = spyOn($rootScope, '$broadcast');

            localStorageService.set('a8m', 'foobar');
            localStorageService.remove('a8m');
            expect(spy.calls.count()).toEqual(2);
        });
    });

    it('should be able to bind to scope', inject(function ($rootScope, localStorageService) {

        localStorageService.set('property', 'oldValue');
        localStorageService.bind($rootScope, 'property');

        $rootScope.property = 'newValue';
        $rootScope.$digest();

        expect($rootScope.property).toEqual(localStorageService.get('property'));
    }));

    it('should be able to unbind from scope variable', inject(function ($rootScope, localStorageService) {

        localStorageService.set('property', 'oldValue');
        var lsUnbind = localStorageService.bind($rootScope, 'property');

        $rootScope.property = 'newValue';
        $rootScope.$digest();

        expect($rootScope.property).toEqual(localStorageService.get('property'));

        lsUnbind();
        $rootScope.property = 'anotherValue';
        $rootScope.$digest();

        expect($rootScope.property).not.toEqual(localStorageService.get('property'));
    }));

    it('should be able to bind to properties of objects', inject(function ($rootScope, localStorageService) {

        localStorageService.set('obj.property', 'oldValue');
        localStorageService.bind($rootScope, 'obj.property');

        expect($rootScope.obj.property).toEqual(localStorageService.get('obj.property'));

        $rootScope.obj.property = 'newValue';
        $rootScope.$digest();

        expect($rootScope.obj.property).toEqual(localStorageService.get('obj.property'));
    }));

    it('should be able to bind to scope using different key', inject(function ($rootScope, localStorageService) {

        localStorageService.set('lsProperty', 'oldValue');
        localStorageService.bind($rootScope, 'property', undefined, 'lsProperty');

        expect($rootScope.property).toEqual(localStorageService.get('lsProperty'));

        $rootScope.property = 'newValue';
        $rootScope.$digest();

        expect($rootScope.property).toEqual(localStorageService.get('lsProperty'));
    }));

    it('should $watch with deep comparison only for objects', inject(function ($rootScope, localStorageService) {
        var mocks = [{}, [], 'string', 90, false];
        var expectation = [true, true, false, false, false];
        var results = [];

        spyOn($rootScope, '$watch').and.callFake(function (key, func, eq) {
            results.push(eq);
        });

        mocks.forEach(function (elm, i) {
            localStorageService.set('mock' + i, elm);
            localStorageService.bind($rootScope, 'mock' + i);
        });

        expect(results).toEqual(expectation);
    }));

    it('should be able to return it\'s owned keys amount', inject(
      function (localStorageService, $window) {

          for (var i = 0; i < 10; i++) {
              localStorageService.set('key' + i, 'val' + i);
              $window.localStorage.setItem('key' + i, 'val' + i);
          }
          expect(localStorageService.length()).toEqual(10);
          expect($window.localStorage.length).toEqual(20);
      })
    );

    it('should be able to clear all owned keys from storage', inject(function ($window, localStorageService) {
        for (var i = 0; i < 10; i++) {
            localStorageService.set('key' + i, 'val' + i);
            $window.localStorage.setItem('key' + i, 'val' + i);
        }

        localStorageService.clearAll();
        //remove only owned keys
        for (var l = 0; l < 10; l++) {
            expect(localStorageService.get('key' + l)).toBeNull();
            expect($window.localStorage.getItem('key' + l)).toEqual('val' + l);
        }
    }));

    it('should be able to clear owned keys from storage, using RegExp', inject(function ($window, localStorageService) {
        for (var i = 0; i < 10; i++) {
            localStorageService.set('key' + i, 'val' + i);
            localStorageService.set('otherKey' + i, 'val' + i);
            $window.localStorage.setItem('key' + i, 'val' + i);
            $window.localStorage.setItem('otherKey' + i, 'val' + i);
        }
        localStorageService.set('keyAlpha', 'val');

        localStorageService.clearAll(/^key/);

        expect(localStorageService.get('keyAlpha')).toBeNull();

        //remove only owned keys that follow RegExp
        for (var l = 0; l < 10; l++) {
            expect(localStorageService.get('key' + l)).toBeNull();
            expect($window.localStorage.getItem('key' + l)).toEqual('val' + l);
            expect(localStorageService.get('otherKey' + l)).toEqual('val' + l);
            expect($window.localStorage.getItem('otherKey' + l)).toEqual('val' + l);
        }
    }));

    it('should be able to clear owned keys from storage, using RegExp when prefix is empty string', function () {
        module(setPrefix(''));
        inject(function ($window, localStorageService) {
            for (var i = 0; i < 10; i++) {
                localStorageService.set('key' + i, 'val' + i);
                localStorageService.set('otherKey' + i, 'val' + i);
            }
            localStorageService.set('keyAlpha', 'val');

            localStorageService.clearAll(/^key/);

            expect(localStorageService.get('keyAlpha')).toBeNull();
            expect($window.localStorage.getItem('keyAlpha')).toBeNull();

            for (var l = 0; l < 10; l++) {
                expect(localStorageService.get('key' + l)).toBeNull();
                expect($window.localStorage.getItem('key' + l)).toBeNull();
                expect(localStorageService.get('otherKey' + l)).toEqual('val' + l);
                expect($window.localStorage.getItem('otherKey' + l)).toEqual('"val' + l + '"');
            }
        });
    });

    it('should return array of all owned keys', inject(function ($window, localStorageService) {
        //set keys
        for (var i = 0; i < 10; i++) {
            //localStorageService
            localStorageService.set('ownKey' + i, 'val' + i);
            //window.localStorage
            $window.localStorage.setItem('windowKey' + i, 'val' + i);
        }
        localStorageService.keys().forEach(function (el, i) {
            expect(el).toEqual('ownKey' + i);
        });
    }));

    // Backward compatibility issue-#230
    it('should return the item as-is if the parsing fail', inject(function ($window, localStorageService) {
        var items = ['{', '[', 'foo'];
        //set keys
        items.forEach(function (item, i) {
            $window.localStorage.setItem('ls.' + i, item);
        });

        items.forEach(function (item, i) {
            expect(localStorageService.get(i)).toEqual(item);
        });
    }));

    //sessionStorage
    describe('SessionStorage', function () {

        beforeEach(module('LocalStorageModule', function ($provide) {
            $provide.value('$window', {
                sessionStorage: localStorageMock()
            });
        }));

        it('should be able to change storage to SessionStorage', function () {
            module(setStorage('sessionStorage'));

            inject(function ($window, localStorageService) {
                var setSpy = spyOn($window.sessionStorage, 'setItem'),
                  getSpy = spyOn($window.sessionStorage, 'getItem'),
                  removeSpy = spyOn($window.sessionStorage, 'removeItem');

                localStorageService.set('foo', 'bar');
                localStorageService.get('foo');
                localStorageService.remove('foo');

                expect(setSpy).toHaveBeenCalledWith('ls.foo', '"bar"');
                expect(getSpy).toHaveBeenCalledWith('ls.foo');
                expect(removeSpy).toHaveBeenCalledWith('ls.foo');

            });
        });

        it('type should be sessionStorage', function () {
            module(setStorage('sessionStorage'));
            inject(
              expectStorageTyping('sessionStorage')
            );
        });

        it('isSupported should be true on sessionStorage mode', function () {
            module(setStorage('sessionStorage'));
            inject(
              expectSupporting(true)
            );
        });

    });

    //cookie
    describe('Cookie', function () {

        beforeEach(module('LocalStorageModule', function ($provide) {
            $provide.value('$window', {
                localStorage: false,
                sessionStorage: false,
                navigator: {
                    cookieEnabled: true
                }
            });
            $provide.value('$document', {
                cookie: ''
            });
        }));

        it('isSupported should be false on fallback mode', inject(
          expectSupporting(false)
        ));

        it('cookie.isSupported should be true if cookies are enabled', inject(
          expectCookieSupporting(true)
        ));

        it('fallback storage type should be cookie', inject(
          expectStorageTyping('cookie')
        ));

        it('should be able to add to cookie domain', function () {
            module(setCookieDomain('.example.org'));
            inject(expectDomain('.example.org'));
        });

        it('should be able to config expiry and path', function () {
            module(setStorageCookie(60, '/path'));
            inject(expectCookieConfig(new Date().addDays(60), '/path'));
        });

        it('should be able to set and get cookie', inject(function (localStorageService) {
            localStorageService.set('cookieKey', 'cookieValue');
            expect(localStorageService.get('cookieKey')).toEqual('cookieValue');
        }));

        it('should be able to set individual cookie with expiry', function () {
            inject(expectCookieExpiry(new Date().addDays(10)));
        });

        it('should be able to set individual cookie with secure attribute', function () {
            inject(expectCookieSecure());
        });

        it('should be able to remove from cookie', inject(function (localStorageService) {
            localStorageService.set('cookieKey', 'cookieValue');
            localStorageService.remove('cookieKey');
            expect(localStorageService.get('cookieKey')).toEqual('');
        }));

        it('should be able to set and get objects from cookie', inject(function (localStorageService) {
            //use as a fallback
            localStorageService.set('cookieKey', { a: { b: 1 } });
            expect(localStorageService.get('cookieKey')).toEqual({ a: { b: 1 } });
            //use directly
            localStorageService.cookie.set('cookieKey', { a: 2 });
            expect(localStorageService.cookie.get('cookieKey')).toEqual({ a: 2 });
        }));

        it('should be able to set and get arrays from cookie', inject(function (localStorageService) {
            //use as a fallback
            localStorageService.set('cookieKey', [1, 2, 3, [1, 2, 3]]);
            expect(localStorageService.get('cookieKey')).toEqual([1, 2, 3, [1, 2, 3]]);
            //use directly
            localStorageService.cookie.set('cookieKey', ['foo', 'bar']);
            expect(localStorageService.cookie.get('cookieKey')).toEqual(['foo', 'bar']);
        }));

        it('should be able to clear all owned keys from cookie', inject(function (localStorageService, $document) {
            localStorageService.set('ownKey1', 1);
            $document.cookie = 'username=John Doe';
            localStorageService.clearAll();
            expect(localStorageService.get('ownKey1')).toBeNull();
            expect($document.cookie).not.toEqual('');
        }));

        it('should be able to return a string when a cookie exceeds max integer', inject(function (localStorageService, $document) {
            $document.cookie = 'ls.token=90071992547409919';
            var token = localStorageService.cookie.get('token');
            expect(token).toEqual('90071992547409919');
            expect(token).not.toEqual('Infinity');
        }));

        it('should be broadcast on adding item', function () {
            module(setNotify(true, false));
            inject(function ($rootScope, localStorageService) {
                var spy = spyOn($rootScope, '$broadcast');
                localStorageService.set('a8m', 'foobar');
                expect(spy).toHaveBeenCalled();
            });
        });

        it('should be broadcast on removing item', function () {
            module(setNotify(false, true));
            inject(function ($rootScope, localStorageService) {
                var spy = spyOn($rootScope, '$broadcast');
                localStorageService.remove('a8m', 'foobar');
                expect(spy).toHaveBeenCalled();
            });
        });

        Date.prototype.addDays = function (days) {
            var date = new Date(this.getTime());
            date.setDate(date.getDate() + days);
            return date.toUTCString();
        };
    });

    describe('secure cookies', function(){
        beforeEach(module('LocalStorageModule', function ($provide) {
            $provide.value('$window', {
                localStorage: false,
                sessionStorage: false,
                navigator: {
                    cookieEnabled: true
                }
            });
            $provide.value('$document', {
                cookie: ''
            });
        }));

         it('should be able to set all cookies as secure via config', function () {
            module(setStorageCookie(60, '/path', true));
            inject(function(localStorageService, $document){
                localStorageService.set('cookieKey', 'cookieValue');
                expect($document.cookie.indexOf('secure')).not.toEqual(-1);
            });
        });

        it('should be able to override secure option in config by specifying a secure flag', inject(function (localStorageService, $document) {
            localStorageService.cookie.set('foo', 'bar', null, true);
            expect($document.cookie.indexOf('secure')).not.toEqual(-1);
        }));

        it('should default to non-secure cookies', inject(function (localStorageService, $document) {
            localStorageService.set('foo', 'bar');
            expect($document.cookie.indexOf('secure')).toEqual(-1);
        }));
    });

    //cookie disabled
    describe('No Cookie', function () {

        beforeEach(module('LocalStorageModule', function ($provide) {
            $provide.value('$window', {
                navigator: {
                    cookieEnabled: false
                }
            });
            $provide.value('$document', {

            });
        }));

        it('cookie.isSupported should be false if cookies are disabled', inject(
          expectCookieSupporting(false)
        ));
    });

    //setDefaultToCookie
    describe('setDefaultToCookie', function () {

        beforeEach(module('LocalStorageModule', function ($provide) {
            $provide.value('$window', {
                localStorage: false,
                sessionStorage: false,
            });
        }));

        it('should by default be enabled', inject(
          expectDefaultToCookieSupporting(true)
        ));

        it('should be possible to disable', function () {
            module(setDefaultToCookie(false));
            inject(expectDefaultToCookieSupporting(false));
        });

        it('should not default to cookies', function () {
            module(setDefaultToCookie(false));
            inject(expectSupporting(false));
            inject(expectStorageTyping('localStorage'));
        });
    });

    //localStorageChanged
    describe('localStorageChanged', function () {
        var listeners = {};
        beforeEach(module('LocalStorageModule', function ($provide) {
            var window = jasmine.createSpyObj('$window', ['addEventListener','removeEventListener']);
            window.localStorage = localStorageMock();
            window.addEventListener.and.callFake(function (event, listener) {
                listeners[event] = listener;
            });
            window.removeEventListener.and.callFake(function (event) {
                listeners[event] = null;
            });
            $provide.value('$window', window);
            $provide.value('$timeout', function (fn) { fn(); });
            module(function (localStorageServiceProvider) {
                localStorageServiceProvider
                  .setPrefix('test')
                  .setNotify(true, true);
            });
        }));

        it('should call $window.addEventListener if storage is supported and notify.setitem is true', inject(function ($window, localStorageService) { // jshint ignore:line
          expect($window.addEventListener).toHaveBeenCalled();
            expect($window.addEventListener.calls.mostRecent().args[0] === 'storage').toBeTruthy();
            expect($window.addEventListener.calls.mostRecent().args[1] instanceof Function).toBeTruthy();
            expect($window.addEventListener.calls.mostRecent().args[2]).toEqual(false);
        }));

        it('localStorageChanged should call $broadcast', inject(function ($window, localStorageService, $rootScope) {
            var spy = spyOn($rootScope, '$broadcast');
            var event = {
                key: localStorageService.deriveKey('foo'),
                newValue: 'bar'
            };
            listeners.storage(event);

            expect(spy).toHaveBeenCalled();
            expect(spy.calls.mostRecent().args[0] === 'LocalStorageModule.notification.changed').toBeTruthy();
            expect(spy.calls.mostRecent().args[1].key === 'foo').toBeTruthy();
            expect(spy.calls.mostRecent().args[1].newvalue === 'bar').toBeTruthy();
        }));

        it('localStorageChanged should not $broadcast on non-string keys', inject(function ($window, localStorageService, $rootScope) {
            var spy = spyOn($rootScope, '$broadcast');
            var event = {
                key: null,
                newValue: 'bar'
            };
            listeners.storage(event);

            expect(spy).not.toHaveBeenCalled();
        }));
    });


});
