// Intraday Soft Commodity Market Making Simulation
// Web browser version

// Game state and data
const gameState = {
    playerCash: 10000,
    inventory: {},
    currentPrices: {},
    forecasts: {},
    recentTrades: {},
    orderBooks: {},
    currentEvent: null,
    tradingResults: {},
    totalProfit: 0,
    commodities: [
        { name: "Coffee", basePrice: 180.45, volatility: 0.03, unit: "pound", marketDepth: "medium" },
        { name: "Cocoa", basePrice: 3725.00, volatility: 0.025, unit: "tonne", marketDepth: "high" },
        { name: "Sugar", basePrice: 21.85, volatility: 0.035, unit: "pound", marketDepth: "high" },
        { name: "Cotton", basePrice: 83.25, volatility: 0.02, unit: "pound", marketDepth: "medium" },
        { name: "Orange Juice", basePrice: 338.70, volatility: 0.04, unit: "pound", marketDepth: "low" }
    ],
    currentCommodity: null,
    commoditiesTraded: 0
};

// Market data for additional context
const marketDepthInfo = {
    "high": { 
        description: "Deep market with high liquidity", 
        spreadAdvice: "Use tight spreads (0.1-0.3%)",
        executionImpact: 0.8, // Higher means execution probability changes more with price changes
        holdingCost: 0.01 // % per hour
    },
    "medium": { 
        description: "Moderate market depth", 
        spreadAdvice: "Use medium spreads (0.3-0.6%)",
        executionImpact: 1.0,
        holdingCost: 0.02
    },
    "low": { 
        description: "Shallow market, lower liquidity", 
        spreadAdvice: "Use wider spreads (0.6-1.0%)",
        executionImpact: 1.2,
        holdingCost: 0.03
    }
};

// Intraday market events - more subtle and relevant to soft commodities
const marketEvents = [
    { 
        description: "Weather report affecting growing regions", 
        priceEffect: 0.005, 
        affectedCommodities: ["Coffee", "Cocoa", "Sugar"],
        executionEffect: { bid: 0.1, ask: -0.05 } // Positive means increased execution probability
    },
    { 
        description: "Shipping delay reported", 
        priceEffect: 0.003, 
        affectedCommodities: ["Coffee", "Cocoa", "Cotton"],
        executionEffect: { bid: 0.05, ask: 0 }
    },
    { 
        description: "Large commercial buyer entered the market", 
        priceEffect: 0.004, 
        affectedCommodities: ["Sugar", "Cotton"],
        executionEffect: { bid: -0.1, ask: 0.15 }
    },
    { 
        description: "Export restrictions rumored", 
        priceEffect: -0.003, 
        affectedCommodities: ["Coffee", "Cocoa"],
        executionEffect: { bid: -0.05, ask: 0.1 }
    },
    { 
        description: "Favorable harvest report", 
        priceEffect: -0.004, 
        affectedCommodities: ["Orange Juice", "Cotton"],
        executionEffect: { bid: 0, ask: 0.1 }
    },
    { 
        description: "Minor currency fluctuation in producing region", 
        priceEffect: 0.002, 
        affectedCommodities: ["Coffee", "Sugar", "Cocoa"],
        executionEffect: { bid: 0.03, ask: -0.03 }
    },
    { 
        description: "Increasing consumer demand", 
        priceEffect: 0.003, 
        affectedCommodities: ["Sugar", "Cocoa", "Orange Juice"],
        executionEffect: { bid: -0.05, ask: 0.1 }
    },
    { 
        description: "Normal trading conditions", 
        priceEffect: 0.0, 
        affectedCommodities: [],
        executionEffect: { bid: 0, ask: 0 }
    }
];

// Recent trading activity simulation
function generateRecentTrades(commodity, currentPrice) {
    const trades = [];
    const tradeCount = 5;
    const timeIntervals = [1, 3, 6, 10, 15]; // minutes ago
    
    for (let i = 0; i < tradeCount; i++) {
        // Smaller price fluctuations for intraday
        const priceVariation = (Math.random() - 0.5) * 0.002 * currentPrice;
        const tradePrice = currentPrice + priceVariation;
        const volume = Math.floor(Math.random() * 10) + 1;
        
        trades.push({
            time: timeIntervals[i],
            price: Math.round(tradePrice * 100) / 100,
            volume: volume,
            direction: priceVariation >= 0 ? "buy" : "sell"
        });
    }
    
    return trades;
}

// Generate market prices based on base price, reduced volatility, and intraday events
function generateMarketPrices() {
    const currentEvent = marketEvents[Math.floor(Math.random() * marketEvents.length)];
    gameState.currentEvent = currentEvent;
    
    const prices = {};
    const recentTrades = {};
    const orderBooks = {};
    
    gameState.commodities.forEach(commodity => {
        // Generate a random but small price movement (intraday)
        const randomMovement = (Math.random() - 0.5) * 2 * commodity.volatility * 0.3; // Reduced for intraday
        
        // Apply event effect only to affected commodities
        let eventImpact = 0;
        if (currentEvent.affectedCommodities.includes(commodity.name)) {
            eventImpact = currentEvent.priceEffect;
        }
        
        // Calculate new price with smaller movements
        const priceChange = commodity.basePrice * (randomMovement + eventImpact);
        prices[commodity.name] = Math.max(commodity.basePrice + priceChange, commodity.basePrice * 0.995);
        
        // Round to appropriate decimal places based on price level
        if (commodity.basePrice < 50) {
            prices[commodity.name] = Math.round(prices[commodity.name] * 1000) / 1000; // 3 decimal places
        } else {
            prices[commodity.name] = Math.round(prices[commodity.name] * 100) / 100; // 2 decimal places
        }
        
        // Generate recent trades for additional information
        recentTrades[commodity.name] = generateRecentTrades(commodity, prices[commodity.name]);
        
        // Generate simple order book data
        const spread = prices[commodity.name] * (commodity.marketDepth === "high" ? 0.001 : commodity.marketDepth === "medium" ? 0.003 : 0.005);
        
        orderBooks[commodity.name] = {
            bids: [
                { price: Math.round((prices[commodity.name] - spread) * 100) / 100, volume: Math.floor(Math.random() * 15) + 5 },
                { price: Math.round((prices[commodity.name] - spread * 2) * 100) / 100, volume: Math.floor(Math.random() * 25) + 10 },
                { price: Math.round((prices[commodity.name] - spread * 3) * 100) / 100, volume: Math.floor(Math.random() * 35) + 15 }
            ],
            asks: [
                { price: Math.round((prices[commodity.name] + spread) * 100) / 100, volume: Math.floor(Math.random() * 15) + 5 },
                { price: Math.round((prices[commodity.name] + spread * 2) * 100) / 100, volume: Math.floor(Math.random() * 25) + 10 },
                { price: Math.round((prices[commodity.name] + spread * 3) * 100) / 100, volume: Math.floor(Math.random() * 35) + 15 }
            ]
        };
    });
    
    return { prices, recentTrades, orderBooks };
}

// Generate expected short-term price movements (next hour)
function generateShortTermForecasts(currentPrices) {
    const forecasts = {};
    
    gameState.commodities.forEach(commodity => {
        // Short-term forecast with tighter range (intraday)
        const accuracy = 0.9 + Math.random() * 0.05; // 90-95% accuracy
        const bias = (Math.random() - 0.5) * 0.05; // slight bias in either direction
        
        // Calculate estimated price movement in next hour (intraday timeframe)
        const shortTermMovement = (Math.random() - 0.5 + bias) * commodity.volatility * 0.4;
        const estimatedChange = currentPrices[commodity.name] * shortTermMovement * accuracy;
        
        // Include trend strength indicator
        const trendStrength = Math.abs(shortTermMovement) > (commodity.volatility * 0.2) ? "strong" : "weak";
        
        forecasts[commodity.name] = {
            price: Math.round((currentPrices[commodity.name] + estimatedChange) * 100) / 100,
            timeframe: "1 hour",
            direction: estimatedChange >= 0 ? "up" : "down",
            strength: trendStrength,
            changePct: Math.round((estimatedChange / currentPrices[commodity.name]) * 10000) / 100 // For EV calculations
        };
    });
    
    return forecasts;
}

// Calculate expected value for a potential bid or ask price
function calculateExpectedValue(action, price, commodity, marketPrice, forecast, orderBook, currentEvent) {
    const commodityData = gameState.commodities.find(c => c.name === commodity.name);
    const marketDepthData = marketDepthInfo[commodityData.marketDepth];
    const isAffectedByEvent = currentEvent.affectedCommodities.includes(commodity.name);
    
    // Calculate base execution probability
    const priceRatio = action === "bid" ? price / marketPrice : marketPrice / price;
    const deviation = Math.abs(1 - priceRatio);
    
    let executionProbability;
    if (action === "bid") {
        // Higher bid = higher execution probability
        executionProbability = Math.max(0, Math.min(0.95, 0.5 + (price / marketPrice - 1) * 50 * marketDepthData.executionImpact));
        
        // Event effect
        if (isAffectedByEvent) {
            executionProbability += currentEvent.executionEffect.bid;
        }
        
        // Trend effect - downward trend makes selling to you more likely
        if (forecast.direction === "down") {
            executionProbability += 0.1;
            if (forecast.strength === "strong") executionProbability += 0.1;
        }
    } else { // ask
        // Lower ask = higher execution probability
        executionProbability = Math.max(0, Math.min(0.95, 0.5 + (1 - price / marketPrice) * 50 * marketDepthData.executionImpact));
        
        // Event effect
        if (isAffectedByEvent) {
            executionProbability += currentEvent.executionEffect.ask;
        }
        
        // Trend effect - upward trend makes buying from you more likely
        if (forecast.direction === "up") {
            executionProbability += 0.1;
            if (forecast.strength === "strong") executionProbability += 0.1;
        }
    }
    
    // Clamp probability to reasonable range
    executionProbability = Math.max(0, Math.min(0.95, executionProbability));
    
    // Calculate expected trade volume
    const avgVolumePerTrade = 5;
    const volumeFactor = commodityData.marketDepth === "high" ? 3 : commodityData.marketDepth === "medium" ? 2 : 1;
    const expectedVolume = executionProbability * avgVolumePerTrade * volumeFactor;
    
    // Calculate expected profit
    let expectedProfit;
    if (action === "bid") {
        // For bid, profit = expected future price - bid price
        const holdingCost = marketDepthData.holdingCost * marketPrice * 0.01; // For 30 min period
        expectedProfit = (forecast.price - price - holdingCost) * expectedVolume;
    } else { // ask
        // For ask, profit = ask price - expected future price
        expectedProfit = (price - forecast.price) * expectedVolume;
    }
    
    return {
        action,
        price,
        executionProbability: Math.round(executionProbability * 100) / 100,
        expectedVolume: Math.round(expectedVolume * 10) / 10,
        expectedProfit: Math.round(expectedProfit * 100) / 100,
        ev: Math.round(executionProbability * expectedProfit * 100) / 100
    };
}

// Generate EV table for several price levels
function generateEVTable(commodity, marketPrice, forecast, orderBook, currentEvent) {
    const bidOptions = [];
    const askOptions = [];
    
    const spread = marketPrice * (commodity.marketDepth === "high" ? 0.002 : commodity.marketDepth === "medium" ? 0.004 : 0.008);
    
    // Generate 5 bid options
    for (let i = -2; i <= 2; i++) {
        const bidPrice = Math.round((marketPrice + i * spread / 2) * 100) / 100;
        bidOptions.push(calculateExpectedValue("bid", bidPrice, commodity, marketPrice, forecast, orderBook, currentEvent));
    }
    
    // Generate 5 ask options
    for (let i = -2; i <= 2; i++) {
        const askPrice = Math.round((marketPrice + spread + i * spread / 2) * 100) / 100;
        askOptions.push(calculateExpectedValue("ask", askPrice, commodity, marketPrice, forecast, orderBook, currentEvent));
    }
    
    // Find optimal bid and ask
    const optimalBid = bidOptions.reduce((prev, current) => (current.ev > prev.ev) ? current : prev, bidOptions[0]);
    const optimalAsk = askOptions.reduce((prev, current) => (current.ev > prev.ev) ? current : prev, askOptions[0]);
    
    return { bidOptions, askOptions, optimalBid, optimalAsk };
}

// Simulate intraday trading - more realistic with smaller trades
function simulateIntraDayTrading(commodity, buyPrice, sellPrice, marketPrice, forecast, orderBook, currentEvent) {
    // Calculate execution probabilities using the EV model
    const bidEV = calculateExpectedValue("bid", buyPrice, commodity, marketPrice, forecast, orderBook, currentEvent);
    const askEV = calculateExpectedValue("ask", sellPrice, commodity, marketPrice, forecast, orderBook, currentEvent);
    
    const sellToPlayerProbability = bidEV.executionProbability;
    const buyFromPlayerProbability = askEV.executionProbability;
    
    // Simulate number of trades over 30 minutes (intraday period)
    const tradeVolume = commodity.marketDepth === "high" ? 15 : commodity.marketDepth === "medium" ? 10 : 5;
    const potentialSellsToPlayer = Math.floor(sellToPlayerProbability * tradeVolume);
    const potentialBuysFromPlayer = Math.floor(buyFromPlayerProbability * tradeVolume);
    
    // Generate individual trades
    const trades = [];
    let totalBuys = 0;
    let totalSells = 0;
    
    // Process sells to player (player buys)
    for (let i = 0; i < potentialSellsToPlayer; i++) {
        const volume = Math.floor(Math.random() * 3) + 1; // 1-3 units per trade
        totalBuys += volume;
        
        trades.push({
            direction: "buy",
            price: buyPrice,
            volume: volume,
            time: Math.floor(Math.random() * 30) // Random minute in the 30-min window
        });
    }
    
    // Process buys from player (player sells)
    for (let i = 0; i < potentialBuysFromPlayer; i++) {
        // Can only sell what we have or what we've bought
        const availableToSell = Math.max(0, gameState.inventory[commodity.name] + totalBuys - totalSells);
        
        if (availableToSell > 0) {
            const volume = Math.min(availableToSell, Math.floor(Math.random() * 3) + 1);
            totalSells += volume;
            
            trades.push({
                direction: "sell",
                price: sellPrice,
                volume: volume,
                time: Math.floor(Math.random() * 30) // Random minute in the 30-min window
            });
        }
    }
    
    // Calculate profit/loss
    const buysCost = totalBuys * buyPrice;
    const sellsRevenue = totalSells * sellPrice;
    const profit = sellsRevenue - buysCost;
    
    // Sort trades by time
    trades.sort((a, b) => a.time - b.time);
    
    return {
        buys: totalBuys,
        sells: totalSells,
        profit: profit,
        trades: trades
    };
}

// Initialize the game
function initializeGame() {
    // Reset game state
    gameState.playerCash = 10000;
    gameState.inventory = {};
    gameState.tradingResults = {};
    gameState.totalProfit = 0;
    gameState.commoditiesTraded = 0;
    
    // Initialize inventory
    gameState.commodities.forEach(commodity => {
        gameState.inventory[commodity.name] = 0;
    });
    
    // Generate market data
    const { prices, recentTrades, orderBooks } = generateMarketPrices();
    gameState.currentPrices = prices;
    gameState.recentTrades = recentTrades;
    gameState.orderBooks = orderBooks;
    
    // Generate forecasts
    gameState.forecasts = generateShortTermForecasts(gameState.currentPrices);
    
    // Update UI
    displayMarketOverview();
    setupCommodityButtons();
}

// Display market overview
function displayMarketOverview() {
    const marketEvent = document.getElementById('market-event');
    marketEvent.innerHTML = `<strong>Market event:</strong> ${gameState.currentEvent.description}`;
    
    const portfolioSummary = document.getElementById('portfolio-summary');
    
    let inventoryValue = 0;
    let inventoryItems = 0;
    
    for (const commodity in gameState.inventory) {
        if (gameState.inventory[commodity] > 0) {
            const value = gameState.inventory[commodity] * gameState.currentPrices[commodity];
            inventoryValue += value;
            inventoryItems++;
        }
    }
    
    portfolioSummary.innerHTML = `<strong>Your cash:</strong> $${gameState.playerCash.toFixed(2)}<br>`;
    
    if (inventoryItems > 0) {
        portfolioSummary.innerHTML += `<strong>Current inventory value:</strong> $${inventoryValue.toFixed(2)}<br>`;
    } else {
        portfolioSummary.innerHTML += "<strong>Current inventory:</strong> None<br>";
    }
    
    const marketOverviewBody = document.getElementById('market-overview-body');
    marketOverviewBody.innerHTML = '';
    
    gameState.commodities.forEach(commodity => {
        const forecast = gameState.forecasts[commodity.name];
        const trend = forecast.direction === "up" ? "↑" : "↓";
        const trendStrength = forecast.strength === "strong" ? (trend.repeat(2)) : trend;
        const trendClass = forecast.direction === "up" ? "up-arrow" : "down-arrow";
        
        marketOverviewBody.innerHTML += `
            <tr>
                <td>${commodity.name}</td>
                <td>$${gameState.currentPrices[commodity.name].toFixed(2)}</td>
                <td>$${forecast.price.toFixed(2)}</td>
                <td class="${trendClass}">${trendStrength}</td>
                <td>${commodity.marketDepth}</td>
            </tr>`;
    });
}

// Set up commodity selection buttons
function setupCommodityButtons() {
    const commodityButtons = document.getElementById('commodity-buttons');
    commodityButtons.innerHTML = '';
    
    gameState.commodities.forEach(commodity => {
        // Check if this commodity has already been traded
        const isTraded = gameState.tradingResults[commodity.name] !== undefined;
        
        const button = document.createElement('button');
        button.textContent = commodity.name;
        button.style.margin = '5px';
        button.style.padding = '10px 15px';
        
        // Disable button if already traded
        if (isTraded) {
            button.disabled = true;
            button.style.opacity = '0.5';
        } else {
            button.addEventListener('click', () => {
                selectCommodity(commodity);
            });
        }
        
        commodityButtons.appendChild(button);
    });
}

// Select a commodity to trade
function selectCommodity(commodity) {
    gameState.currentCommodity = commodity;
    
    // Hide commodity selection, show commodity detail
    document.getElementById('commodity-selection').classList.add('hidden');
    document.getElementById('commodity-detail').classList.remove('hidden');
    
    // Display commodity details
    displayCommodityDetail(commodity);
}

// Display detailed information for a specific commodity
function displayCommodityDetail(commodity) {
    const commodityName = document.getElementById('commodity-name');
    commodityName.textContent = commodity.name;
    
    const commodityInfo = document.getElementById('commodity-info');
    const price = gameState.currentPrices[commodity.name];
    const forecast = gameState.forecasts[commodity.name];
    
    commodityInfo.innerHTML = `
        <p><strong>Current price:</strong> $${price.toFixed(2)} per ${commodity.unit}</p>
        <p><strong>1-hour forecast:</strong> $${forecast.price.toFixed(2)} (${forecast.direction}, ${forecast.strength} trend)</p>
        <p><strong>Expected price change:</strong> ${forecast.changePct > 0 ? '+' : ''}${forecast.changePct}% in next hour</p>
        <p><strong>Market depth:</strong> ${commodity.marketDepth} - ${marketDepthInfo[commodity.marketDepth].description}</p>
        <p><strong>Holding cost:</strong> ~${marketDepthInfo[commodity.marketDepth].holdingCost}% per hour</p>
    `;
    
    // Display recent trades
    displayRecentTrades(commodity);
    
    // Display order book
    displayOrderBook(commodity);
    
    // Display price options with EV analysis
    displayPriceOptions(commodity);
    
    // Set up price inputs
    setupPriceInputs(commodity);
}

// Display recent trades for a commodity
function displayRecentTrades(commodity) {
    const recentTradesBody = document.getElementById('recent-trades-body');
    recentTradesBody.innerHTML = '';
    
    const trades = gameState.recentTrades[commodity.name];
    
    trades.forEach(trade => {
        const directionClass = trade.direction === 'buy' ? 'up-arrow' : 'down-arrow';
        
        recentTradesBody.innerHTML += `
            <tr>
                <td>${trade.time}</td>
                <td>$${trade.price.toFixed(2)}</td>
                <td>${trade.volume}</td>
                <td class="${directionClass}">${trade.direction}</td>
            </tr>
        `;
    });
}

// Display order book for a commodity
function displayOrderBook(commodity) {
    const bidBookBody = document.getElementById('bid-book-body');
    const askBookBody = document.getElementById('ask-book-body');
    const marketSpread = document.getElementById('market-spread');
    
    bidBookBody.innerHTML = '';
    askBookBody.innerHTML = '';
    
    const orderBook = gameState.orderBooks[commodity.name];
    
    // Display bids
    orderBook.bids.forEach(bid => {
        bidBookBody.innerHTML += `
            <tr>
                <td>${bid.volume}</td>
                <td>$${bid.price.toFixed(2)}</td>
            </tr>
        `;
    });
    
    // Display asks
    orderBook.asks.forEach(ask => {
        askBookBody.innerHTML += `
            <tr>
                <td>$${ask.price.toFixed(2)}</td>
                <td>${ask.volume}</td>
            </tr>
        `;
    });
    
    // Calculate and display market spread
    const topBid = orderBook.bids[0].price;
    const topAsk = orderBook.asks[0].price;
    const spread = topAsk - topBid;
    const spreadPct = (spread / topBid) * 100;
    
    marketSpread.innerHTML = `<p><strong>Current market spread:</strong> $${spread.toFixed(2)} (${spreadPct.toFixed(2)}%)</p>`;
}

// Display price options with EV calculations
function displayPriceOptions(commodity) {
    const bidOptionsBody = document.getElementById('bid-options-body');
    const askOptionsBody = document.getElementById('ask-options-body');
    const forecastInfo = document.getElementById('forecast-info');
    
    bidOptionsBody.innerHTML = '';
    askOptionsBody.innerHTML = '';
    
    const price = gameState.currentPrices[commodity.name];
    const forecast = gameState.forecasts[commodity.name];
    const orderBook = gameState.orderBooks[commodity.name];
    
    // Generate EV table
    const evAnalysis = generateEVTable(commodity, price, forecast, orderBook, gameState.currentEvent);
    
    // Display bid options (without EV)
    evAnalysis.bidOptions.forEach(option => {
        bidOptionsBody.innerHTML += `
            <tr>
                <td>$${option.price.toFixed(2)}</td>
                <td>${(option.executionProbability * 100).toFixed(0)}%</td>
                <td>${option.expectedVolume.toFixed(1)}</td>
            </tr>
        `;
    });
    
    // Display ask options (without EV)
    evAnalysis.askOptions.forEach(option => {
        askOptionsBody.innerHTML += `
            <tr>
                <td>$${option.price.toFixed(2)}</td>
                <td>${(option.executionProbability * 100).toFixed(0)}%</td>
                <td>${option.expectedVolume.toFixed(1)}</td>
            </tr>
        `;
    });
    
    // Display forecast info and holding cost
    forecastInfo.innerHTML = `
        <p><strong>Forecast price:</strong> $${forecast.price.toFixed(2)} | <strong>Market price:</strong> $${price.toFixed(2)}</p>
        <p><strong>Holding cost:</strong> ~$${(price * marketDepthInfo[commodity.marketDepth].holdingCost / 100).toFixed(2)} per unit per hour</p>
    `;
}

// Set up price input handlers
function setupPriceInputs(commodity) {
    const bidPriceInput = document.getElementById('bid-price');
    const askPriceInput = document.getElementById('ask-price');
    const submitButton = document.getElementById('submit-prices');
    
    const price = gameState.currentPrices[commodity.name];
    
    // Set min and max values
    const minBid = price * 0.98;
    const maxBid = price * 1.005;
    const minAsk = price;
    const maxAsk = price * 1.02;
    
    // Set default values
    bidPriceInput.value = price.toFixed(2);
    bidPriceInput.min = minBid.toFixed(2);
    bidPriceInput.max = maxBid.toFixed(2);
    bidPriceInput.step = 0.01;
    
    askPriceInput.value = (price * 1.005).toFixed(2);
    askPriceInput.min = price.toFixed(2);
    askPriceInput.max = maxAsk.toFixed(2);
    askPriceInput.step = 0.01;
    
    // Ensure ask is greater than bid
    bidPriceInput.addEventListener('input', () => {
        const bidValue = parseFloat(bidPriceInput.value);
        if (!isNaN(bidValue) && askPriceInput.value < bidValue) {
            askPriceInput.value = bidValue;
        }
    });
    
    askPriceInput.addEventListener('input', () => {
        const askValue = parseFloat(askPriceInput.value);
        if (!isNaN(askValue) && bidPriceInput.value > askValue) {
            bidPriceInput.value = askValue;
        }
    });
    
    // Submit button handler
    submitButton.addEventListener('click', () => {
        const bidValue = parseFloat(bidPriceInput.value);
        const askValue = parseFloat(askPriceInput.value);
        
        if (isNaN(bidValue) || isNaN(askValue) || bidValue < minBid || bidValue > maxBid || askValue < minAsk || askValue > maxAsk) {
            alert('Please enter valid bid and ask prices within the allowed range.');
            return;
        }
        
        submitPrices(commodity, bidValue, askValue);
    });
}

// Submit prices and simulate trading
function submitPrices(commodity, bidPrice, askPrice) {
    const price = gameState.currentPrices[commodity.name];
    const forecast = gameState.forecasts[commodity.name];
    const orderBook = gameState.orderBooks[commodity.name];
    
   // Simulate trading
    const tradingResult = simulateIntraDayTrading(
        commodity,
        bidPrice,
        askPrice,
        price,
        forecast,
        orderBook,
        gameState.currentEvent
    );
    
    // Update inventory and cash
    gameState.inventory[commodity.name] += tradingResult.buys - tradingResult.sells;
    gameState.playerCash += tradingResult.profit;
    
    // Store result
    gameState.tradingResults[commodity.name] = {
        buys: tradingResult.buys,
        sells: tradingResult.sells,
        profit: tradingResult.profit,
        trades: tradingResult.trades,
        price: price,
        bidPrice: bidPrice,
        askPrice: askPrice
    };
    
    gameState.totalProfit += tradingResult.profit;
    gameState.commoditiesTraded++;
    
    // Check if all commodities traded
    if (gameState.commoditiesTraded === gameState.commodities.length) {
        displayFinalResults();
    } else {
        // Return to commodity selection
        document.getElementById('commodity-detail').classList.add('hidden');
        document.getElementById('commodity-selection').classList.remove('hidden');
        
        // Update buttons
        setupCommodityButtons();
    }
}

// Display final results
function displayFinalResults() {
    // Hide game sections, show results
    document.getElementById('commodity-detail').classList.add('hidden');
    document.getElementById('commodity-selection').classList.add('hidden');
    document.getElementById('results-container').classList.remove('hidden');
    
    // Populate results summary
    const resultsSummaryBody = document.getElementById('results-summary-body');
    resultsSummaryBody.innerHTML = '';
    
    for (const commodityName in gameState.tradingResults) {
        const result = gameState.tradingResults[commodityName];
        const profitClass = result.profit >= 0 ? 'profit' : 'loss';
        
        resultsSummaryBody.innerHTML += `
            <tr>
                <td>${commodityName}</td>
                <td>$${result.bidPrice.toFixed(2)}</td>
                <td>$${result.askPrice.toFixed(2)}</td>
                <td>${result.buys}</td>
                <td>${result.sells}</td>
                <td class="${profitClass}">$${result.profit.toFixed(2)}</td>
            </tr>
        `;
    }
    
    const totalProfitElement = document.getElementById('total-profit');
    const totalProfitClass = gameState.totalProfit >= 0 ? 'profit' : 'loss';
    totalProfitElement.innerHTML = `<p class="${totalProfitClass}">Total profit/loss: $${gameState.totalProfit.toFixed(2)}</p>`;
    
    // Trade details
    displayTradeDetails();
    
    // Final portfolio
    displayFinalPortfolio();
    
    // Performance analysis
    displayPerformanceAnalysis();
    
    // Set up play again button
    document.getElementById('play-again').addEventListener('click', () => {
        document.getElementById('results-container').classList.add('hidden');
        document.getElementById('game-container').classList.remove('hidden');
        initializeGame();
    });
}

// Display trade execution details
function displayTradeDetails() {
    const tradeDetails = document.getElementById('trade-details');
    tradeDetails.innerHTML = '';
    
    for (const commodityName in gameState.tradingResults) {
        const result = gameState.tradingResults[commodityName];
        
        if (result.trades.length > 0) {
            tradeDetails.innerHTML += `
                <h4>${commodityName} Trades:</h4>
                <table>
                    <thead>
                        <tr>
                            <th>Time (min)</th>
                            <th>Direction</th>
                            <th>Price</th>
                            <th>Volume</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            result.trades.forEach(trade => {
                tradeDetails.innerHTML += `
                    <tr>
                        <td>${trade.time}</td>
                        <td>${trade.direction}</td>
                        <td>$${trade.price.toFixed(2)}</td>
                        <td>${trade.volume}</td>
                    </tr>
                `;
            });
            
            tradeDetails.innerHTML += `
                    </tbody>
                </table>
            `;
        } else {
            tradeDetails.innerHTML += `<p>${commodityName}: No trades executed</p>`;
        }
    }
}

// Display final portfolio
function displayFinalPortfolio() {
    const finalPortfolio = document.getElementById('final-portfolio');
    finalPortfolio.innerHTML = `<p><strong>Cash:</strong> $${gameState.playerCash.toFixed(2)}</p>`;
    
    let totalInventoryValue = 0;
    let inventoryItems = 0;
    
    finalPortfolio.innerHTML += `<p><strong>Commodity Inventory:</strong></p>`;
    let inventoryList = '<ul>';
    
    for (const commodity in gameState.inventory) {
        if (gameState.inventory[commodity] > 0) {
            const commodityData = gameState.commodities.find(c => c.name === commodity);
            const value = gameState.inventory[commodity] * gameState.currentPrices[commodity];
            totalInventoryValue += value;
            inventoryItems++;
            
            inventoryList += `<li>${commodity}: ${gameState.inventory[commodity]} ${commodityData.unit}s (Worth: $${value.toFixed(2)})</li>`;
        }
    }
    
    if (inventoryItems === 0) {
        inventoryList += '<li>No commodities in inventory</li>';
    }
    
    inventoryList += '</ul>';
    finalPortfolio.innerHTML += inventoryList;
    
    if (totalInventoryValue > 0) {
        finalPortfolio.innerHTML += `<p><strong>Total inventory value:</strong> $${totalInventoryValue.toFixed(2)}</p>`;
    }
    
    finalPortfolio.innerHTML += `<p><strong>Total portfolio value:</strong> $${(gameState.playerCash + totalInventoryValue).toFixed(2)}</p>`;
}

// Display performance analysis
function displayPerformanceAnalysis() {
    const performanceAnalysis = document.getElementById('performance-analysis');
    
    // Calculate performance
    const totalInventoryValue = Object.keys(gameState.inventory).reduce((sum, commodity) => {
        return sum + (gameState.inventory[commodity] * gameState.currentPrices[commodity]);
    }, 0);
    
    const performance = gameState.playerCash + totalInventoryValue - 10000;
    const performancePct = (performance / 10000) * 100;
    
    const performanceClass = performance >= 0 ? 'profit' : 'loss';
    performanceAnalysis.innerHTML = `<p class="${performanceClass}"><strong>Profit/Loss:</strong> $${performance.toFixed(2)} (${performancePct.toFixed(2)}%)</p>`;
    
    // Trading efficiency metrics
    let effectiveSpreads = 0;
    let totalTrades = 0;
    let profitableCommodities = 0;
    
    for (const commodity in gameState.tradingResults) {
        const result = gameState.tradingResults[commodity];
        if (result.profit > 0) profitableCommodities++;
        
        if (result.buys > 0 || result.sells > 0) {
            effectiveSpreads += (result.askPrice - result.bidPrice);
            totalTrades++;
        }
    }
    
    if (totalTrades > 0) {
        const avgSpread = effectiveSpreads / totalTrades;
        performanceAnalysis.innerHTML += `<p><strong>Average spread:</strong> $${avgSpread.toFixed(2)}</p>`;
    }
    
    performanceAnalysis.innerHTML += `<p><strong>Profitable commodities:</strong> ${profitableCommodities} of ${Object.keys(gameState.tradingResults).length}</p>`;
    
    // Market maker rating
    let rating;
    if (performancePct >= 1.0) {
        rating = "Elite Market Maker";
    } else if (performancePct >= 0.5) {
        rating = "Advanced Market Maker";
    } else if (performancePct >= 0.1) {
        rating = "Skilled Market Maker";
    } else if (performancePct >= 0) {
        rating = "Novice Market Maker";
    } else {
        rating = "Needs Improvement";
    }
    
    performanceAnalysis.innerHTML += `<p><strong>Your market maker rating:</strong> ${rating}</p>`;
    
    if (performancePct > 0) {
        performanceAnalysis.innerHTML += `<p>Annualized, this 30-minute performance would be equivalent to <strong>${(performancePct * 48 * 252).toFixed(2)}%</strong> return!</p>`;
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Start button
    document.getElementById('start-game').addEventListener('click', () => {
        document.getElementById('intro-container').classList.add('hidden');
        document.getElementById('game-container').classList.remove('hidden');
        initializeGame();
    });
});
        
