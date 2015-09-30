
module.exports = {
		scrape: scrape,
		URLObject: URLObject,
		URLStack: URLStack
};

var request = require('request');

function scrape(urls, options, scrapeFunction, callback) {
	if (Array.isArray(urls)) {
		var requestGroup = 30;
		var i = 0;
		next();
		function next() {
			if (i < urls.length) {
				var requestCounter = 0;
				var numRequests = Math.min(requestGroup, urls.length - i);
				for (var n = 0; n < numRequests; n++) {
					requestCounter++;
					i++;
					scrape(urls[i - 1], options, scrapeFunction, function() {
						requestCounter--;
						if (!requestCounter) {
							next();
						}
					});	
				}
			}
			else {
				if (callback) {
					callback();
				}
			}
		}
	}
	else {
		var url = urls;
		if (url.isURLObject) {
			url = url.url;
		}
		else if (url.isURLStack) {
			url = url.current.url;
		}
		var requestOptions = {
				method: 'GET',
				url: url
		};
		if (options instanceof Object && !Array.isArray(options)) {
			for (var key in options) {
				if (options.hasOwnProperty(key)) {
					requestOptions[key] = options[key];
				}
			}
		}
		if (typeof options === 'function') {
			if (typeof scrapeFunction === 'function') {
				callback = scrapeFunction;
			}
			scrapeFunction = options;
		}
		request(requestOptions, function (error, response, body){
			if (error) {
				scrapeFunction(urls, null);
				if (callback) {
					callback();
				}
			}
			else {
				scrapeFunction(urls, body);
				if (callback) {
					callback();
				}
			}
		});
	}
}

/*function scrape(url, options, callback) {
	if (url.isURLObject) {
		url = url.url;
	}
	else if (url.isURLStack) {
		url = url.current.url;
	}
	var requestOptions = {
			method: 'GET',
			url: url
	};
	if (options instanceof Object && !Array.isArray(options)) {
		for (var key in options) {
			if (options.hasOwnProperty(key)) {
				requestOptions[key] = options[key];
			}
		}
	}
	else if (typeof options === 'function') {
		callback = options;
	}
	request(requestOptions, function (error, response, body){
		if (error) {
			callback(null);
		}
		else {
			callback(body);
		}
	});
}*/

function URLObject(url, href) {
	var info = analyzeUrl(url, href);
	for (var key in info) {
		if (info.hasOwnProperty(key)) {
			this[key] = info[key];
		}
	}
	this.isURLObject = true;
}

function URLStack(url, parentStack) {
	if (typeof url === 'string') {
		url = new URLObject(url);
	}
	this.stack = [];
	if (parentStack) {
		for (var i = 0; i < parentStack.stack.length; i++) {
			this.stack.push(parentStack.stack[i]);
		}	
		this.parent = parentStack.current;
	}
	this.stack.push(url);
	this.current = url;
	this.isURLStack = true;
}

function analyzeUrl(parentUrl, url) {
	var origin = parentUrl.substr(0, parentUrl.slice(parentUrl.indexOf('//') + 2).indexOf('/') + parentUrl.indexOf('//') + 2);
	var protocol = parentUrl.substr(0, parentUrl.indexOf('//'));
	var host = origin.slice(origin.indexOf('//') + 2);
	var hostname = host.indexOf(':') !== -1 ? host.substr(0, host.indexOf(':')) : host;
	var port = host.indexOf(':') !== -1 ? host.slice(host.indexOf(':') + 1) : '';
	var pathname = parentUrl.slice(parentUrl.slice(parentUrl.indexOf('//') + 2).indexOf('/') + parentUrl.indexOf('//') + 2);
	pathname = pathname.indexOf('#') !== -1 ? pathname.substr(0, pathname.indexOf('#')) : pathname;
	pathname = pathname.indexOf('?') !== -1 ? pathname.substr(0, pathname.indexOf('?')) : pathname;
	pathname = pathname.match('^.*/$') ? pathname : pathname + '/';
	var search = (parentUrl.indexOf('?') !== -1 ? parentUrl.slice(parentUrl.indexOf('?')) : '');
	search = search.indexOf('#') !== -1 ? search.substr(0, search.indexOf('#')) : search;
	var hash = (parentUrl.indexOf('#') !== -1 ? parentUrl.slice(parentUrl.indexOf('#')) : '');

	if (!(url === undefined || url === null)) {
		if (url === '') {
			url = parentUrl;
		}
		else if (url.match('^//')) {
			url = protocol + url;
		}
		else if (url.match('^/')) {
			url = origin + url;
		}
		else if (url.match('^\\?')) {
			url = origin + pathname + url;
		}
		else if (url.match('^#')) {
			url = origin + pathname + search + url;
		}
		else if (url.match('^./') || url.match('^../')) {
			var temp = pathname.split('/');
			var paths = [];
			for (var i = 0; i < temp.length; i++) {
				if (temp[i]) {
					paths.push(temp[i]);
				}
			}
			while (url.match('^./')) {
				url = url.slice(2);
			}
			while (url.match('^../')) {
				url = url.slice(3);
				if (paths.length) {
					paths.pop();
				}
			}
			var newPath = '/';
			for (var i = 0; i < paths.length; i++) {
				newPath += paths[i] + '/';
			}
			url = origin + newPath + url;
		}
		else if (!url.match(':')){
			url = origin + pathname + url;
		}
		else if (url.match('^javascript:')) {
			// Do nothing
		}
		return analyzeUrl(url);
	}

	/*console.log('URL: ' + url);
	console.log('Origin: ' + origin);
	console.log('Protocol: ' + protocol);
	console.log('Host: ' + host);
	console.log('Hostname: ' + hostname);
	console.log('Port: ' + port);
	console.log('Pathname: ' + pathname);
	console.log('Search: ' + search);
	console.log('Hash: ' + hash);*/
	
	return {
		url: url || parentUrl,
		origin: origin,
		protocol: protocol,
		host: host,
		hostname: hostname,
		port: port,
		pathname: pathname,
		search: search,
		hash: hash
	};
}
