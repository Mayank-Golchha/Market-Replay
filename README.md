# Market Replay

Market Replay is a lightweight, browser-only tool for cutting historical market data and replaying candles one by one. It's built for price-action study, and controlled market replay sessions.

- Load OHLC data from CSV
- Cut the chart at any point
- Replay candles step-by-step or automatically
- Draw horizontal lines, trendlines, and rectangles
- Fast, portable, and easy to use

---

## Quick demo

1. Open `index.html` in your browser (or host on a static server).
2. Upload a CSV file with OHLC data.
3. Choose a timeframe.
4. Use the Cut tool to choose a starting index.
5. Replay manually (Next) or automatically (Play).
6. Use drawing tools to annotate market structure and setups.

---

## Supported CSV format

The application expects a CSV with the following header:

Instrument,Date,Time,Open,High,Low,Close

Column details:
- Date — `DD-MM-YYYY`
- Time — `HH:MM` or `HH:MM:SS`
- Open, High, Low, Close — numeric price values

Example CSV:

```csv
Instrument,Date,Time,Open,High,Low,Close
NIFTY,01-01-2025,09:15:00,21500,21550,21480,21520
NIFTY,01-01-2025,09:16:00,21520,21570,21500,21550
```

Notes:
- Missing seconds in the Time column are accepted (e.g., `09:15`).

---


## Contributing

Contributions are welcome! Suggestions:

To contribute:
1. Fork the repo
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Commit your changes and open a PR

---
