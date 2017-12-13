var stockResults;
var stockMap;
var contentDiv;
var priceLoaded;
var autoRefreshInterval = null;
var resultVersion = 0;
var inRefresh = false;
var leadCanvas = 'a';

function getJson(symbol, prices, version) {
	var url = prices ?
		('https://testfakestocks.azurewebsites.net/values/stock/' + symbol) :
		('https://testfakestocks.azurewebsites.net/values/top5');

    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (this.readyState == 4) {
            var data = this.responseText;
            try {
                data = JSON.parse(data);
            } catch (e) {}

			if (this.status == 200) (prices ? setPrice : setAdx)(symbol, data, version);
        }
    }

	xhr.open('GET', url, true);
	xhr.send();
	console.log('Requested ' + (prices ? 'price' : 'ADX') + ' data for ' + symbol + ' / ' + version);
}

function setPrice(symbol, data, version) {
	console.log('Setting price for ' + symbol + ' / ' + version);
	if (version !== resultVersion) return;

	var stock = stockMap[symbol];
	stock.name = data.name;
	stock.price = data.price;

	stock.history = data.history;
	stock.history.sort(function(l, r) { return l.date.localeCompare(r.date); });

	showContent(symbol);
}

function setAdx(symbol, data, version) {
	console.log('Setting ADX / ' + version);
	if (version !== resultVersion) return;

	for (var i = 0; i < data.length; i++) {
		var stock = { symbol: data[i], price: null };
		stockResults.push(stock);
		stockMap[data[i]] = stock;
	}

	for (var i = 0; i < 5 && i < stockResults.length; i++) {
		getJson(stockResults[i].symbol, true, version);
	}
}

function showContent(symbol) {
	console.log('Showing content for ' + stockResults.length + ' result' + (stockResults.length == 1 ? '' : 's'));

	for (var i = 0; i < 5 && i < stockResults.length; i++) {
		var stock = stockResults[i];
		if (stock.symbol == symbol) {
			document.getElementById('loadingContainer').style.display = 'none';
			var oldSymbol = document.getElementById('oldSymbol' + (i + 1));
			var newSymbol = document.getElementById('newSymbol' + (i + 1));
			var oldPrice = document.getElementById('oldPrice' + (i + 1));
			var newPrice = document.getElementById('newPrice' + (i + 1));
			var oldChange = document.getElementById('oldChange' + (i + 1));
			var newChange = document.getElementById('newChange' + (i + 1));
			var oldCanvas = document.getElementById('history' + (i + 1) + (leadCanvas === 'a' ? 'b' : 'a'));
			var newCanvas = document.getElementById('history' + (i + 1) + leadCanvas);
			var lastPrice = stock.history[stock.history.length - 2].price;
			var change = stock.price - lastPrice;
			var changeColor = change >= 0.01 ? '64,255,64' : (change <= -0.01 ? '255,64,64' : '0,0,0');

			oldSymbol.innerHTML = newSymbol.innerHTML;
			oldPrice.innerHTML = newPrice.innerHTML;
			oldChange.innerHTML = newChange.innerHTML;
			newSymbol.innerHTML = '<a href="https://www.google.com/search?tbm=fin&q=NASDAQ:+' + stock.symbol + '">' + stock.symbol + '</a>';
			newPrice.innerHTML = '$' + stock.price.toFixed(2);
			newChange.innerHTML = (change < 0 ? '' : '+') + change.toFixed(2);
			drawHistory(newCanvas, stock.history);

			oldSymbol.style.transition = 'all 0s ease 0s';
			oldPrice.style.transition = 'all 0s ease 0s';
			oldChange.style.transition = 'all 0s ease 0s';
			oldCanvas.style.transition = 'all 0s ease 0s';
			newSymbol.style.transition = 'all 0s ease 0s';
			newPrice.style.transition = 'all 0s ease 0s';
			newChange.style.transition = 'all 0s ease 0s';
			newCanvas.style.transition = 'all 0s ease 0s';

			oldSymbol.style.color = '#4040FF';
			oldPrice.style.color = 'black';
			oldChange.style.color = newChange.style.color;
			oldCanvas.style.transform = 'scale(1, 1)';
			newSymbol.style.color = 'rgba(32,32,255,0)';
			newPrice.style.color = 'rgba(0,0,0,0)';
			newChange.style.color = 'rgba(' + changeColor + ',0)';
			newCanvas.style.transform = 'scale(1, 0)';
			newCanvas.style.display = 'inline';

			setTimeout(function() {
				oldSymbol.style.transition = 'color 1.7s';
				oldPrice.style.transition = 'color 1.7s';
				oldChange.style.transition = 'color 1.7s';
				oldCanvas.style.transition = 'transform 2.4s';
				newSymbol.style.transition = 'color 1.7s';
				newPrice.style.transition = 'color 1.7s';
				newChange.style.transition = 'color 1.7s';
				newCanvas.style.transition = 'transform 2.4s';

				oldSymbol.style.color = 'rgba(32,32,255,0)';
				oldPrice.style.color = 'rgba(0,0,0,0)';
				oldChange.style.color = 'rgba(' + changeColor + ',0)';
				oldCanvas.style.transform = 'scale(1, 0)';
				newSymbol.style.color = '#4040FF';
				newPrice.style.color = 'black';
				newChange.style.color = 'rgba(' + changeColor + ',1)';
				newCanvas.style.transform = 'scale(1, 1)';
				
				setTimeout(function() {
					oldCanvas.style.transition = 'all 0s ease 0s';
					oldCanvas.style.transform = 'none';
					oldCanvas.style.display = 'none';
				}, 2400);
			}, 30);

			priceLoaded++;
			if (priceLoaded >= 5 || priceLoaded >= stockResults.length) {
				document.getElementById('btnAutorenew').classList.remove('spinner');
				document.getElementById('btnRefresh').classList.remove('spinner');
				document.getElementById('commandOverlay').style.display = 'none';
				document.getElementById('btnAutorenew').style.cursor = 'pointer';
				document.getElementById('btnRefresh').style.cursor = 'pointer';
				inRefresh = false;
			}
		}
	}
}

function drawHistory(canvas, hists) {
	var minPrice = 999999999;
	var maxPrice = -999999999;

	for (var i = 0; i < 99 && i < hists.length; i++) {
		var hist = hists[i];
		if (hist.price < minPrice) minPrice = hist.price;
		if (hist.price > maxPrice) maxPrice = hist.price;
	}
	
	var range = maxPrice - minPrice;
	var step = range / 38.0;

	var ctx = canvas.getContext('2d');
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.beginPath();

	for (var i = 0; i < 99 && i < hists.length; i++) {
		var hist = hists[i];
		var X = 39.0 - ((hist.price - minPrice) / step);

		if (i === 0) ctx.moveTo(1, X);
		else ctx.lineTo(1 + (i * 4), X);
	}
	
	ctx.stroke();
	ctx.closePath();
}

function toggleAutoRefresh() {
	if (autoRefreshInterval === null) {
		document.getElementById('btnAutorenew').style.color = '#40FF40';
		autoRefreshInterval = setInterval(refreshDataFromAutoRenew, 10000);
		localStorage.autoRefresh = 'true';
		refreshDataFromAutoRenew();
	} else {
		clearInterval(autoRefreshInterval);
		autoRefreshInterval = null;
		document.getElementById('btnAutorenew').style.color = 'black';
		localStorage.autoRefresh = 'false';
	}
}

function refreshData() {
	var version = ++resultVersion;

	document.getElementById('btnAutorenew').style.cursor = 'wait';
	document.getElementById('btnRefresh').style.cursor = 'wait';
	document.getElementById('commandOverlay').style.display = 'block';
	leadCanvas = leadCanvas === 'a' ? 'b' : 'a';
	inRefresh = true;
	stockResults = [];
	stockMap = {};
	priceLoaded = 0;
	console.log('Refreshing version ' + version);
	getJson(null, false, version);
}

function refreshDataFromButton() {
	console.log('Refreshing from button');
	if (inRefresh) return;

	document.getElementById('btnRefresh').classList.add('spinner');
	refreshData();
}

function refreshDataFromAutoRenew() {
	console.log('Refreshing from auto-renew');
	if (inRefresh) return;

	document.getElementById('btnAutorenew').classList.add('spinner');
	refreshData();
}

function contentLoaded() {
	if (localStorage.autoRefresh === 'true') toggleAutoRefresh();
	else refreshData();
}

document.addEventListener("DOMContentLoaded", contentLoaded);