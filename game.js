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
                <td>${gameState.currentPrices[commodity.name].toFixed(2)}</td>
                <td>${forecast.price.toFixed(2)}</td>
                <td class="${trendClass}">${trendStrength}</td>
                <td>${commodity.marketDepth}</td>