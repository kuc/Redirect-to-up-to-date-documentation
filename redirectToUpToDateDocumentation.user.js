// ==UserScript==
// @name        Redirect to up to date documentation
// @namespace   sieradzki.it
// @description Detects if currently viewed online documentation page is the most recent version available, and if not, redirects user to the latest version.
// @version     1.2.0
// @downloadURL https://github.com/kuc/Redirect-to-up-to-date-documentation/raw/master/redirectToUpToDateDocumentation.user.js

// @grant       GM_xmlhttpRequest

// @match       *://docs.oracle.com/*
// @match       *://download.java.net/*
// @match       *://wiki.eclipse.org/Jetty*
// @match       *://www.playframework.com/documentation/*
// @match       *://www.postgresql.org/docs/*
// @match       *://docs.spring.io/*
// ==/UserScript==

/*jshint nonew:true, curly:true, noarg:true, trailing:true, loopfunc:true, forin:true, noempty:true, eqeqeq:true,
 strict:true, undef:true, bitwise:true, newcap:false, browser:true, devel:true, nonbsp:true */
/*global GM_xmlhttpRequest */

(function () {
	'use strict';

	var documentations = {
		javaSE: {
			currentVersion: '8',
			isDocumentationPageOutdated: function (url) {
				var matches = url.match(/^http(s)?:\/\/docs\.oracle\.com\/javase\/([0-9\.]+)\/docs\/api\//);
				return matches !== null && matches[2] !== this.currentVersion;
			},
			rewriteUrl: function (url) {
				url = url.replace(/\/javase\/([0-9\.]+)\/docs\/api\//, '/javase/' + this.currentVersion + '/docs/api/');
				url = url.replace(/%2[8-9]|\(|\)|,%20|, /g, '-'); // "(", ")", ",%20" and ", " to "-"
				url = url.replace(/%5B|\[/g, ':'); // "[" to ":"
				url = url.replace(/%5D|\]/g, 'A'); // "]" to "A"
				return url;
			}
		},
		javaSE_Archive: {
			currentVersion: '8',
			isDocumentationPageOutdated: function (url) {
				var matches =
					url.match(/^http(s)?:\/\/download\.java\.net\/jdk([0-9\.]+)\/archive\/b([0-9\.]+)\/docs\/api\//);
				return matches !== null && matches[2] !== this.currentVersion;
			},
			rewriteUrl: function (url) {
				url = url.replace(
					/^http(s)?:\/\/download\.java\.net\/jdk([0-9\.]+)\/archive\/b([0-9\.]+)\/docs\/api\//,
					'https://docs.oracle.com/javase/' + this.currentVersion + '/docs/api/'
				);
				url = url.replace(/%2[8-9]|\(|\)|,%20|, /g, '-'); // "(", ")", ",%20" and ", " to "-"
				url = url.replace(/%5B|\[/g, ':'); // "[" to ":"
				url = url.replace(/%5D|\]/g, 'A'); // "]" to "A"
				return url;
			}
		},
		javaEE: {
			currentVersion: '7',
			isDocumentationPageOutdated: function (url) {
				var matches = url.match(/^http(s)?:\/\/docs\.oracle\.com\/javaee\/([0-9\.]+)\/api\//);
				return matches !== null && matches[2] !== this.currentVersion;
			},
			rewriteUrl: function (url) {
				return url.replace(/\/javaee\/([0-9\.]+)\/api\//, '/javaee/' + this.currentVersion + '/api/');
			}
		},
		javaFX: {
			currentVersion: '8',
			isDocumentationPageOutdated: function (url) {
				var matches = url.match(/^http(s)?:\/\/docs\.oracle\.com\/javafx\/([0-9\.]+)\/api\//);
				return matches !== null && matches[2] !== this.currentVersion;
			},
			rewriteUrl: function (url) {
				return url.replace(/\/javafx\/([0-9\.]+)\/api\//, '/javase/' + this.currentVersion + '/javafx/api/');
			}
		},
		jetty: {
			isDocumentationPageOutdated: function (url) {
				var matches = url.match(/^http(s)?:\/\/wiki\.eclipse\.org\/Jetty/);
				var messageBoxLinks =
					document.querySelectorAll('div.messagebox a[href^="http://www.eclipse.org/jetty/documentation"]');
				return matches !== null && messageBoxLinks !== null && messageBoxLinks.length === 2;
			},
			rewriteUrl: function () {
				return document.querySelectorAll('div.messagebox a[href^="http://www.eclipse.org/jetty/documentation"]')[1].href;
			}
		},
		postgreSQL: {
			currentVersion: 'current',
			isDocumentationPageOutdated: function (url) {
				var matches = url.match(/^http(s)?:\/\/www\.postgresql\.org\/docs\/([0-9\.]+)\/(static|interactive)\//);
				return matches !== null && matches[2] !== this.currentVersion && matches[2] !== 'devel';
			},
			rewriteUrl: function (url) {
				return url.replace(/\/docs\/([0-9\.]+)\//, '/docs/' + this.currentVersion + '/');
			}
		},
		playFrameworkJava: {
			currentVersion: '2.3.x',
			isDocumentationPageOutdated: function (url) {
				var matches = url.match(/^http(s)?:\/\/www\.playframework\.com\/documentation\/([0-9\.A-Zx\-]+)\/api\/java\//);
				return matches !== null && matches[2] !== this.currentVersion;
			},
			rewriteUrl: function (url) {
				return url.replace(/\/documentation\/([0-9\.A-Zx\-]+)\/api\/java\//,
						'/documentation/' + this.currentVersion + '/api/java/');
			}
		},
		playFrameworkScala: {
			currentVersion: '2.3.x',
			isDocumentationPageOutdated: function (url) {
				var matches = url.match(/^http(s)?:\/\/www\.playframework\.com\/documentation\/([0-9\.A-Zx\-]+)\/api\/scala\//);
				return matches !== null && matches[2] !== this.currentVersion;
			},
			rewriteUrl: function (url) {
				return url.replace(/\/documentation\/([0-9\.A-Zx\-]+)\/api\/scala\//,
						'/documentation/' + this.currentVersion + '/api/scala/');
			}
		},
		springData: {
			currentVersion: 'current',
			isDocumentationPageOutdated: function (url) {
				var matches = url.match(
					/^http(s)?:\/\/docs\.spring\.io\/spring\-data\/([0-9a-z\-]+)\/docs\/([0-9\.A-Zx\-]+)\//);
				return matches !== null && matches[2] !== this.currentVersion;
			},
			rewriteUrl: function (url) {
				return url.replace(/\/docs\/([0-9\.A-Zx\-]+)\//, '/docs/' + this.currentVersion + '/');
			}
		},
		springFramework: {
			currentVersion: 'current',
			isDocumentationPageOutdated: function (url) {
				var matches = url.match(
					/^http(s)?:\/\/docs\.spring\.io\/spring(\-framework)?\/docs\/([0-9\.A-Zx\-]+)\/(javadoc\-)?api\//
				);
				return matches !== null && matches[3] !== this.currentVersion;
			},
			rewriteUrl: function (url) {
				return url.replace(
					/\/spring(\-framework)?\/docs\/([0-9\.A-Zx\-]+)\/(javadoc\-)?api\//,
					'/spring/docs/' + this.currentVersion + '/javadoc-api/'
				);
			}
		},
		springFrameworkReferenceDocumentation: {
			currentVersion: 'current',
			isDocumentationPageOutdated: function (url) {
				var matches = url.match(
					/^http(s)?:\/\/docs\.spring\.io\/spring\/docs\/([0-9\.A-Zx\-]+)\/reference\//
				);
				return matches !== null && matches[2] !== this.currentVersion;
			},
			rewriteUrl: function (url) {
				return url.replace(
					/\/docs\/([0-9\.A-Zx\-]+)\/reference\//,
					'/docs/' + this.currentVersion + '/spring-framework-reference/html/'
				);
			}
		},
		springSecurity: {
			currentVersion: 'current',
			isDocumentationPageOutdated: function (url) {
				var matches = url.match(/^http(s)?:\/\/docs\.spring\.io\/spring\-security\/site\/docs\/([0-9\.A-Zx\-]+)\/apidocs\//);
				return matches !== null && matches[2] !== this.currentVersion;
			},
			rewriteUrl: function (url) {
				return url.replace(/\/site\/docs\/([0-9\.A-Zx\-]+)\/apidocs\//, '/site/docs/' + this.currentVersion +
					'/apidocs/');
			}
		},
		springSocial: {
			currentVersion: 'current',
			isDocumentationPageOutdated: function (url) {
				var matches = url.match(/^http(s)?:\/\/docs\.spring\.io\/spring\-social\/docs\/([0-9\.A-Zx\-]+)\/api(docs)?\//);
				return matches !== null && matches[2] !== this.currentVersion;
			},
			rewriteUrl: function (url) {
				return url.replace(/\/docs\/([0-9\.A-Zx\-]+)\/api(docs)?\//, '/docs/' + this.currentVersion +
					'/apidocs/');
			}
		}
	};

	var DocumentationRedirect = function () {

		for (var key in documentations) {
			if (documentations.hasOwnProperty(key)) {
				if (documentations[key].isDocumentationPageOutdated(window.location.href)) {
					var rewrittenUrl = documentations[key].rewriteUrl(window.location.href);

					// In newer version of documentation e.g. current viewed class could be permanently deleted, so
					// redirection should only occur when we are sure that target page exists
					this.ifPageExists(rewrittenUrl, function (url) {
						window.location.replace(url);
					});

					break;
				}
			}
		}
	};

	/**
	 * @private
	 */
	DocumentationRedirect.prototype.ifPageExists = function (url, callback) {

		GM_xmlhttpRequest({
			method: 'HEAD',
			url: url,
			'onload': function (response) {
				if (response.status < 400) {
					callback(url);
				}
			}
		});
	};

	window.DocumentationRedirect = new DocumentationRedirect();
})();
