
module.exports = {
		shortestPath: shortestPath
};

var cheerio = require('cheerio');
var request = require('request');
var fs = require('fs');

var WebScraper = require('./WebScraper');
var URLObject = WebScraper.URLObject;
var URLStack = WebScraper.URLStack;
var algorithms = require('./algorithms');

//shortestPath('Hentai', 'Massachusetts Institute of Technology'); // 2 clicks
//shortestPath('Education', 'Massachusetts Institute of Technology'); // 2 clicks
shortestPath('Fire', 'Toothpaste'); // 2 clicks
//shortestPath('Toothpaste', 'Coefficient'); // 2 clicks
//shortestPath('Atomic Bomb', 'Massachusetts Institute of Technology'); // 2 clicks
//shortestPath('Bubble', 'Marilyn Monroe'); // 2 clicks
//shortestPath('Allegory', 'Bill Clinton'); // 3 clicks
//shortestPath('Labour Party (UK)', 'Productivity') // 2 clicks
//shortestPath('Fallout (series)', 'Noam Chomsky'); // 2 clicks
//shortestPath('P versus NP problem', 'Adolf Hitler'); // 2 clicks
//shortestPath('The Last Airbender', 'Somalia'); // 3 clicks
//shortestPath('Dylan', 'Bacon'); // 3 clicks
//shortestPath('Aaron', 'Autism'); // 3 clicks
//shortestPath('BDSM', 'Giraffe'); // 3 clicks

//shortestPath('Tomato', 'Neuschwanstein Castle'); // Unknown
//shortestPath('Dylan', 'Fried Chicken'); // Unknown
//shortestPath('Orangutang', 'Amorphism'); // Unknown
//shortestPath('Poland Spring', 'Lint (material)') // Unknown

//shortestPath('Commando', 'Tornado'); // 3 clicks
//shortestPath('Hooker', 'Iced tea'); // Unknown
//shortestPath('Diner', 'Iced tea'); // 3 clicks
//shortestPath('Northern United States', 'Sweet tea'); // 3 clicks
//shortestPath('United States', 'Deez Nuts (politician)');

//shortestPath('Racial Diversity', 'Air force');



function shortestPath(start, goal) {
	var scrapedUrls = [];
	var linksFound = 0;

	var startTime = new Date();
	scrapePages(new URLStack(wikiURL(start)), filter, 6, function(result) {
		if (result.success) {
			console.log();
	    	console.log(result.stack);
	    	console.log();
	    	var startStr = decodeURI(result.stack[0].pathname.replace(/^\/wiki\//, '').slice(0, -1).replace(/[^\w\s![()]]|_/g, ' ').replace(/\s+/g, ' '));
	    	var indent = startStr.length;
	    	for (var p = 1; p < result.stack.length; p++) {
	    		var str = decodeURI(result.stack[p].pathname.replace(/^\/wiki\//, '').slice(0, -1).replace(/[^\w\s![()]]|_/g, ' ').replace(/\s+/g, ' '));
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
	    	console.log('Found ' + decodeURI(goal.replace(/[^\w\s![()]]|_/g, ' ').replace(/\s+/g, ' ').trim() + ' in ' + (result.stack.length - 1) + ' clicks'));
	    	console.log();
		}
		else {
			console.log();
			console.log('Scraped ' + scrapedUrls.length + ' sites');
			console.log('Failed to find ' + decodeURI(goal.replace(/[^\w\s![()]]|_/g, ' ').replace(/\s+/g, ' ').trim()));
			console.log();
		}
		var elapsed = new Date().getTime() - startTime.getTime();
		console.log(elapsed / 1000 + ' seconds elapsed');
	});

	function scrapePages(urlStacks, filter, depth, callback) {
		if (depth > 0) {
			var children = [];
			var childrenUrls = [];
			var result;
			var count = 0;
			WebScraper.scrape(urlStacks, { timeout: 3000 }, function(urlStack, body, next) {
				count++;
				analyzePage(urlStack, body, function(c) {
					if (c.success) {
			    		result = c;
						next(false); // Stops the scraping process
					}
					else {
						if (body) {
							console.log(scrapedUrls.length + '. [L: ' + linksFound + ', D: ' + (urlStack.stack.length - 1) + ' (' + count + '/' + (Array.isArray(urlStacks) ? urlStacks.length : 1) + ')] ' + decodeURI(urlStack.current.pathname.replace(/^\/wiki\//, '').slice(0, -1).replace(/[^\w\s![()]]|_/g, ' ').replace(/\s+/g, ' ')));
						}
						for (var j = 0; j < c.length; j++) {
							if (algorithms.binarySearch(childrenUrls, c[j].current.origin + c[j].current.pathname) === null) {
								childrenUrls = algorithms.binaryInsert(childrenUrls, c[j].current.origin + c[j].current.pathname);
								children.push(c[j]);
								childrenUrls.push(c[j].current.origin + c[j].current.pathname);
							}
						}
						next(); // Continues on with scraping
					}
				});
				
			}, function() {
				if (!result) {
					scrapePages(children, filter, depth - 1, callback);	
				}
				else {
					callback(result);
				}
			});		
		}
		else {
			if (callback) {
				callback({ success: false });
			}
		}
	}

	function analyzePage(urlStack, body, callback) {
		if (algorithms.binarySearch(scrapedUrls, urlStack.current.origin + urlStack.current.pathname) === null) {
			scrapedUrls = algorithms.binaryInsert(scrapedUrls, urlStack.current.origin + urlStack.current.pathname);
			if (!body) {
				callback([]);
			}
			else {
			    var $ = cheerio.load(body);
			    //var title = $('.firstHeading').text();
			    //console.log(title);
			    var children = [];
			    var anchors = $('div#bodyContent a');
			    linksFound += anchors.length;
			    anchors.each(function() {
			    	var href = $(this).attr('href');
			    	if (href) {
			    		var urlObject = new URLObject(urlStack.current.url, href);
			    		var newStack = new URLStack(urlObject, urlStack);
			    		var title = urlObject.pathname.replace(/^\/wiki\//, '').replace(/[^\w\s]|_/g, ' ').trim();
			    		if (!filter || filter(newStack.current.url)) {
					    	children.push(newStack);
			    		}
					    if (title === goal.replace(/[^\w\s]|_/g, ' ').replace(/\s+/g, ' ').trim()) {
					    	callback({ success: true, stack: newStack.stack });
					    }
			    	}
			    });
			    callback(children);
			}
		}
		else {
			callback([]);
		}
	}
}

function wikiURL(str) {
	return 'https://en.wikipedia.org/wiki/' + (str ? str : '');
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
