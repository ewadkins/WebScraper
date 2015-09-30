
var cheerio = require('cheerio');
var request = require('request');
var fs = require('fs');

//shortestPath('Hentai', 'Massachusetts Institute of Technology'); // 2 clicks
//shortestPath('Education', 'Massachusetts Institute of Technology'); // 2 clicks
//shortestPath('Fire', 'Toothpaste'); // 2 clicks
//shortestPath('Toothpaste', 'Coefficient'); // 2 clicks
//shortestPath('Atomic Bomb', 'Massachusetts Institute of Technology'); // 2 clicks
//shortestPath('Bubble', 'Marilyn Monroe'); // 2 clicks
//shortestPath('Allegory', 'Bill Clinton'); // 3 clicks
//shortestPath('Labour Party (UK)', 'Productivity') // 2 clicks
shortestPath('Fallout (series)', 'Noam Chomsky'); // 2 clicks
//shortestPath('P versus NP problem', 'Adolf Hitler'); // 2 clicks
//shortestPath('The Last Airbender', 'Somalia'); // 3 clicks
//shortestPath('Dylan', 'Bacon'); // 3 clicks
//shortestPath('Aaron', 'Autism'); // 3 clicks
//shortestPath('BDSM', 'Giraffe'); // 3 clicks

//shortestPath('Tomato', 'Neuschwanstein Castle'); // Unknown
//shortestPath('Dylan', 'Fried Chicken'); // Unknown
//shortestPath('Orangutang', 'Amorphism'); // Unknown
//shortestPath('Poland Spring', 'Lint (material)') // Unknown



function shortestPath(start, goal) {
	var scrapedUrls = [];
	var stacks = [];
	var linksFound = 0;

	scrapePages([new URLStack(new URLObject(wikiURL(start)))], filter, 6, function() {
		console.log('');
		console.log(stacks);
		console.log();
		console.log('Scraped ' + scrapedUrls.length + ' sites');
		console.log('Failed to find ' + decodeURI(goal.replace(/[^\w\s![()]]|_/g, ' ').replace(/\s+/g, ' ').trim()));
		console.log();
	});

	function scrapePages(urlStacks, filter, depth, callback) {
		var children = [];
		var requestGroup = 30;
		var i = 0;
		next();
		function next() {
			if (i < urlStacks.length) {
				var requestCounter = 0;
				var numRequests = Math.min(requestGroup, urlStacks.length - i);
				for (var n = 0; n < numRequests; n++) {
					if (!filter || filter(urlStacks[i].current.url)) {
						requestCounter++;
						i++;
						scrapePage(urlStacks[i - 1], function(c) {
							for (var j = 0; j < c.length; j++) {
								children.push(c[j]);
							}
							requestCounter--;
							if (!requestCounter) {
								next();
							}
						});	
					}
					else {
						i++;
						if (i >= urlStacks.length && !requestCounter) {
							next();
						}
					}
				}
			}
			else {
				if (depth > 0) {
					scrapePages(children, filter, depth - 1, callback);
				}
				else {
					if (callback) {
						callback();
					}
				}
			}
		}
	}

	function scrapePage(urlStack, callback) {
		stacks.push(urlStack.stack);
		if (binarySearch(scrapedUrls, urlStack.current.origin + urlStack.current.pathname) === null) {
			var requestOptions = {
					method: 'GET',
					url: urlStack.current.url,
					timeout: 2000
			};
			request(requestOptions, function (error, response, body){
				scrapedUrls = binaryInsert(scrapedUrls, urlStack.current.origin + urlStack.current.pathname);
				if (error) {
					callback([]);
				}
				else {
				    var $ = cheerio.load(body);
				    //var title = $('.firstHeading').text();
				    //console.log(title);
				    var children = [];
				    var anchors = $('div#bodyContent a');
				    linksFound += anchors.length;
					console.log(scrapedUrls.length + '. [Links: ' + linksFound + ', Depth: ' + (urlStack.stack.length - 1) + '] ' + decodeURI(urlStack.current.pathname.replace(/^\/wiki\//, '').slice(0, -1).replace(/[^\w\s![()]]|_/g, ' ').replace(/\s+/g, ' ')));
				    anchors.each(function() {
				    	var href = $(this).attr('href');
				    	if (href) {
				    		var urlObject = new URLObject(urlStack.current.url, href);
				    		var newStack = new URLStack(urlObject, urlStack);
				    		var title = urlObject.pathname.replace(/^\/wiki\//, '').replace(/[^\w\s]|_/g, ' ').trim();
						    if (title === goal.replace(/[^\w\s]|_/g, ' ').replace(/\s+/g, ' ').trim()) {
						    	console.log();
						    	console.log({ stack: newStack.stack } );
						    	console.log();
						    	var startStr = decodeURI(newStack.stack[0].pathname.replace(/^\/wiki\//, '').slice(0, -1).replace(/[^\w\s![()]]|_/g, ' ').replace(/\s+/g, ' '));
						    	var indent = startStr.length;
						    	for (var p = 1; p < newStack.stack.length; p++) {
						    		var str = decodeURI(newStack.stack[p].pathname.replace(/^\/wiki\//, '').slice(0, -1).replace(/[^\w\s![()]]|_/g, ' ').replace(/\s+/g, ' '));
						    		if (p === 1) {
						    			console.log(startStr + ' ==> ' + str);
						    		}
						    		else {
						    			var temp = '';
						    			for (var n = 0; n < indent + (p - 1)*2; n++) {
						    				temp += ' ';
						    			}
						    			console.log(temp + ' ==> ' + str);
						    		}
						    	}
						    	console.log();
						    	console.log('Found ' + decodeURI(goal.replace(/[^\w\s![()]]|_/g, ' ').replace(/\s+/g, ' ').trim() + ' in ' + (newStack.stack.length - 1) + ' clicks'));
						    	console.log();
						    	process.exit();
						    }
					    	children.push(newStack);
				    	}
				    });
				    callback(children);
				}
			});
		}
		else {
			setTimeout(function() {
				callback([]);
			}, 0);
		}
	}
}

function wikiURL(str) {
	return 'https://en.wikipedia.org/wiki/' + (str ? str : '');
}

function URLStack(url, parentStack) {
	this.stack = [];
	if (parentStack) {
		for (var i = 0; i < parentStack.stack.length; i++) {
			this.stack.push(parentStack.stack[i]);
		}	
		this.parent = parentStack.current;
	}
	this.stack.push(url);
	this.current = url;
}

function URLObject(url, href) {
	var info = analyzeUrl(url, href);
	for (var key in info) {
		if (info.hasOwnProperty(key)) {
			this[key] = info[key];
		}
	}
}

function filter(url) {
	var extensions = ['asp','aspx','axd','asx','asmx','ashx','css','cfm','yaws','swf','html','htm','xhtml','jhtml','jsp','jspx','wss','do','action','js','pl','php','php4','php3','phtml','py','rb','rhtml','xml','rss','svg','cgi','dll'];
	var end = url.slice(url.lastIndexOf('/'));
	var match = false;
	for (var e = 0; e < extensions.length; e++) {
		if (end.match('\.' + extensions[e] + '$')) {
			match = true;
			break;
		}
	}
	if (!match) {
		if (!end.match('\\.')) {
			match = true;
		}
	}
	return match && url.match('^https://en.wikipedia.org');
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
		//protocol: protocol,
		//host: host,
		//hostname: hostname,
		//port: port,
		pathname: pathname,
		//search: search,
		//hash: hash
	};
}

function binarySearch(A, x) {
	var low = 0;
	var high = A.length - 1;
	var mid;
	while (low <= high) {
		mid = low + ((high - low) >> 1);
		if (x === A[mid]) {
			return mid;
		}
		else if (x > A[mid]) {
			low = mid + 1;
		}
		else {
			high = mid - 1;
		}
	}
	return null;
}

function binaryInsert(A, x) {
	if (A.length === 0) {
		return [x];
	}
	if (x <= A[0]) {
		A.splice(0, 0, x);
		return A;
	}
	if (x > A[A.length - 1]) {
		A.push(x);
		return A;
	}
	var low = 0;
	var high = A.length - 1;
	var mid;
	while (low <= high) {
		mid = low + ((high - low) >> 1);
		if (x === A[mid]) {
			A.splice(mid, 0, x);
			return A;
		}
		else if (x > A[mid]) {
			low = mid + 1;
		}
		else {
			high = mid - 1;
		}
	}
	if (x <= A[low]) {
		A.splice(low, 0, x);
	}
	else {
		A.splice(low + 1, 0, x);
	}
	return A;
}

function mergeSort(A) {
	if (A.length <= 1) {
		return A;
	}
	var mid = A.length >> 1;
	var left = new Array(mid);
	var right = new Array(A.length - mid);
	for (var i = 0; i < mid; i++) {
		left[i] = A[i];
	}
	for (var i = mid; i < A.length; i++) {
		right[i - mid] = A[i];
	}
	left = mergeSort(left);
	right = mergeSort(right);
	var result = new Array(A.length);
	var l = 0;
	var r = 0;
	while (l < left.length && r < right.length) {
		if (left[l] <= right[r]) {
			result[l + r] = left[l];
			l++;
		}
		else {
			result[l + r] = right[r];
			r++;
		}
	}
	while (l < left.length) {
		result[l + r] = left[l];
		l++;
	}
	while (r < right.length) {
		result[l + r] = right[r];
		r++;
	}
	return result;
}
