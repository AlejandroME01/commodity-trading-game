# commodity-trading-game

This project is a browser-based simulation that lets you step into the shoes of an intraday commodity market maker. I built this to aid people in better understanding what market making is.

## What This Project Does

This simulator:
- Lets you set bid/ask prices for soft commodities (Coffee, Cocoa, Sugar, etc.)
- Simulates trading activity based on your pricing decisions
- Helps you understand the concept of expected value (EV) in trading
- Shows you the results of your trading strategy in a 30-minute window

## Why I Made This

After watching this video from [QuantGuild](https://www.youtube.com/watch?v=A9o2El2FN_M), I found that it really intersting that he managed to simplify market making and the concept of EV by gamifying the lesson. When I first tied learning about this I found most of the info out there is either super basic or way too complex, so I wanted to build something in the middle.

The simulator isn't 100% accurate to how institutional market makers work (they have way more complex models and way more money), but it does capture some key concepts:
- The trade-off between spread width and execution probability
- How market depth affects optimal pricing strategy
- The way market news drives price movements
- Why calculating expected value matters

## How to Play

1. Hit the "Start Simulation" button
2. Choose a commodity to trade
3. Check out the market conditions, recent trades, and order book
4. Calculate the expected value for different price levels
5. Set your bid price (what you'll pay to buy) and ask price (what you'll charge to sell)
6. See how your decisions play out in the simulated 30-minute trading window
7. Try to end with more money than you started with

## Tech Stack

Nothing fancy here:
- Plain HTML/CSS for the UI
- Vanilla JavaScript for all the logic
- No external dependencies or frameworks

## Future Improvements

Some things I'm thinking about adding:
- More advanced pricing models
- Multi-day trading simulation
- Different volatility regimes
- Portfolio-level risk constraints

## Credits

Once again thanks to QuantGuild for his awesome tutorial that inspired this project. Also thanks to Jane Street, QuantPy, and CodewithMosh for their amazing educational content.

---

Feel free to reach out if you have questions
