const chartContainer = document.getElementById('chart');
const uploadInput = document.getElementById('uploadFile');
const uploadLabel = document.querySelector('label[for="uploadFile"]');
const cutBtn = document.getElementById('cut'); 
const timeframeSelect = document.getElementById('timeframe');
const playBtn = document.getElementById('play');
const nextBtn = document.getElementById('next');

const cursorBtn = document.getElementById('cursor');
const trendBtn = document.getElementById('draw-trend');
const horzBtn = document.getElementById('draw-horz');
const rectBtn = document.getElementById('draw-rect');
const clearDrawingsBtn = document.getElementById('clear-drawings');

let rawData = []; 
let currentSeries = null;
let isCutMode = false;
let activeTool = 'cursor'; 

let firstPoint = null; 
let isDrawing = false;
let previewSeries = null; 
let permanentDrawings = [];

const drawingStore = {
    priceLines: [],
    markers: []
};

let isPlaying = false;
let playbackTimer = null;
let lastCutIndex = -1; 

let Green = '#1be851';
let Red = '#e81b1b';
let Pink = '#ff4da6'; 

function resizeChart() {
    const newHeight = window.innerHeight - chartContainer.getBoundingClientRect().top - 20;
    chart.applyOptions({ width: chartContainer.clientWidth, height: newHeight });
    if (currentSeries) chart.timeScale().fitContent();
}

const chart = LightweightCharts.createChart(chartContainer, {
    width: chartContainer.clientWidth,
    height: 500,
    layout: { background: { color: '#0f0f0f' }, textColor: '#ffffff' },
    grid: { vertLines: { color: '#222' }, horzLines: { color: '#222' } },
    crosshair: {
        mode: 0, 
        vertLine: { color: Pink, labelBackgroundColor: Pink },
        horzLine: { color: Pink, labelBackgroundColor: Pink },
    },
    timeScale: { 
        borderColor: '#444', 
        timeVisible: true, 
        secondsVisible: false,
    },
});

resizeChart();

function setSeriesType(type) {
    if (currentSeries) chart.removeSeries(currentSeries);
    currentSeries = chart.addCandlestickSeries({
        upColor: Green,
        downColor: Red,
        borderDownColor: Red,
        borderUpColor: Green,
        wickDownColor: Red,
        wickUpColor: Green,
    });
    if (rawData.length > 0) refreshChart(true);
}

function createDrawingSeries(isDashed = false) {
    return chart.addLineSeries({
        color: Pink,
        lineWidth: 2,
        lineStyle: isDashed ? 2 : 0,
        lastValueVisible: false,
        priceLineVisible: false,
        crosshairMarkerVisible: false,
        autoscaleInfoProvider: () => null, // Prevents drawings from squishing the chart
    });
}

function activateTool(tool, btn) {
    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    activeTool = tool;
    firstPoint = null;
    isDrawing = false;
    if (previewSeries) {
        chart.removeSeries(previewSeries);
        previewSeries = null;
    }
}

[cursorBtn, trendBtn, horzBtn, rectBtn].forEach(btn => {
    if (!btn) return;
    btn.addEventListener('click', () => activateTool(btn.id, btn));
});

clearDrawingsBtn.addEventListener('click', () => {
    drawingStore.priceLines.forEach(l => currentSeries.removePriceLine(l));
    drawingStore.priceLines = [];
    drawingStore.markers = [];
    currentSeries.setMarkers([]);
    permanentDrawings.forEach(s => chart.removeSeries(s));
    permanentDrawings = [];
    firstPoint = null;
    isDrawing = false;
});

chart.subscribeCrosshairMove(param => {
    if (!isDrawing || !firstPoint || !param.point || !param.time) return;

    const currentPrice = currentSeries.coordinateToPrice(param.point.y);
    const currentTime = param.time;

    if (!previewSeries) previewSeries = createDrawingSeries(true);

    // TODO

});

chart.subscribeClick(param => {
    if (!param.point || !rawData.length) return;
    // if (isCutMode && param.time) {
    //     const timeframe = timeframeSelect ? timeframeSelect.value : '1m';
    //     const displayData = aggregateData(rawData, timeframe);
    //     const cutIndex = displayData.findIndex(d => d.time === param.time);
    //     if (cutIndex !== -1) {
    //         lastCutIndex = cutIndex;
    //         currentSeries.setData(displayData.slice(0, cutIndex + 1));
    //         isCutMode = false;
    //         cutBtn.style.background = 'transparent';
    //         cutBtn.style.color = Pink;
    //     }
    //     return;
    // }

    if (isCutMode && param.time) {
    const timeframe = timeframeSelect ? timeframeSelect.value : '1m';
    const displayData = aggregateData(rawData, timeframe);
    const cutIndex = displayData.findIndex(d => d.time === param.time);

    if (cutIndex !== -1) {
        const timeScale = chart.timeScale();
        const visibleRange = timeScale.getVisibleLogicalRange();

        lastCutIndex = cutIndex;

        // Cut candles
        currentSeries.setData(displayData.slice(0, cutIndex + 1));

        // Restore viewport (THIS FIXES THE SHIFT)
        if (visibleRange !== null) {
            timeScale.setVisibleLogicalRange(visibleRange);
        }

        isCutMode = false;
        cutBtn.style.background = 'transparent';
        cutBtn.style.color = Pink;
    }
    return;
}

    const price = currentSeries.coordinateToPrice(param.point.y);
    const time = param.time;

    if (activeTool === 'draw-horz') {
        const line = currentSeries.createPriceLine({
            price: price,
            color: Pink,
            lineWidth: 2,
            lineStyle: 0,        
            axisLabelVisible: true,
            axisLabelColor: Pink,
            axisLabelTextColor: '#000',
        });

        drawingStore.priceLines.push(line);
        activateTool('cursor', cursorBtn);
    }
    else if ((activeTool === 'draw-trend' || activeTool === 'draw-rect') && time) {
        if (!isDrawing) {
            isDrawing = true;
            firstPoint = { time, price };
            drawingStore.markers.push({
                time: time,
                position: 'inBar',
                color: Pink,
                shape: 'circle',
                size: 0.2
            });
            currentSeries.setMarkers([...drawingStore.markers]);
        } else {
            const finalSeries = createDrawingSeries(false);
            if (activeTool === 'draw-trend') {
                finalSeries.setData([
                    { time: firstPoint.time, value: firstPoint.price },
                    { time: time, value: price }
                ]);
            } else {
                finalSeries.setData([
                    { time: firstPoint.time, value: firstPoint.price },
                    { time: time, value: firstPoint.price },
                    { time: time, value: price },
                    { time: firstPoint.time, value: price },
                    { time: firstPoint.time, value: firstPoint.price },
                ]);
            }
            permanentDrawings.push(finalSeries);
            
            // Reset Preview and markers
            if (previewSeries) {
                chart.removeSeries(previewSeries);
                previewSeries = null;
            }
            drawingStore.markers.pop();
            currentSeries.setMarkers([...drawingStore.markers]);
            activateTool('cursor', cursorBtn);
        }
    }
});

function stepNext() {
    if (!rawData.length) return;
    const timeframe = timeframeSelect ? timeframeSelect.value : '1m';
    const displayData = aggregateData(rawData, timeframe);
    if (lastCutIndex < displayData.length - 1) {
        lastCutIndex++;
        currentSeries.update(displayData[lastCutIndex]);
    } else {
        stopPlayback();
    }
}

function stopPlayback() {
    isPlaying = false;
    clearInterval(playbackTimer);
    if (playBtn) playBtn.innerHTML = '▶';
}

function togglePlay() {
    if (isPlaying) {
        stopPlayback();
    } else {
        isPlaying = true;
        if (playBtn) playBtn.innerHTML = '⏸';
        playbackTimer = setInterval(stepNext, 100);
    }
}

if (playBtn) playBtn.addEventListener('click', togglePlay);
if (nextBtn) nextBtn.addEventListener('click', stepNext);

if (cutBtn) {
    cutBtn.addEventListener('click', () => {
        isCutMode = !isCutMode;
        activateTool('cursor', cursorBtn);
        cutBtn.style.background = isCutMode ? Pink : 'transparent';
        cutBtn.style.color = isCutMode ? '#000' : Pink;
        if (!isCutMode) refreshChart(false);
    });
}

function aggregateData(data, timeframe) {
    if (timeframe === '1m') return data;
    const intervalMap = { '5m': 5, '15m': 15, '30m': 30, '1h': 60, '1d': 1440 };
    const seconds = (intervalMap[timeframe] || 1) * 60;
    const aggregated = [];
    let bucket = null;
    data.forEach(bar => {
        const bucketTime = Math.floor(bar.time / seconds) * seconds;
        if (!bucket || bucket.time !== bucketTime) {
            if (bucket) aggregated.push(bucket);
            bucket = { ...bar, time: bucketTime };
        } else {
            bucket.high = Math.max(bucket.high, bar.high);
            bucket.low = Math.min(bucket.low, bar.low);
            bucket.close = bar.close;
        }
    });
    if (bucket) aggregated.push(bucket);
    return aggregated;
}

function refreshChart(shouldFit = false) {
    if (!rawData.length || !currentSeries) return;
    const timeframe = timeframeSelect ? timeframeSelect.value : '1m';
    const displayData = aggregateData(rawData, timeframe);
    currentSeries.setData(displayData);
    lastCutIndex = displayData.length - 1;
    if (shouldFit) requestAnimationFrame(() => chart.timeScale().fitContent());
}

function parseOHLCV(csvText) {
    const lines = csvText.trim().split('\n');
    const result = [];
    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',');
        if (cols.length < 7) continue;
        const d = cols[1].split('-'); 
        const t = cols[2].split(':');
        const timestamp = Date.UTC(d[2], d[1]-1, d[0], t[0], t[1], t[2] || 0) / 1000;
        if (!isNaN(timestamp)) {
            result.push({
                time: timestamp,
                open: parseFloat(cols[3]), high: parseFloat(cols[4]),
                low: parseFloat(cols[5]), close: parseFloat(cols[6])
            });
        }
    }
    return result.sort((a, b) => a.time - b.time);
}

uploadInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        rawData = parseOHLCV(event.target.result);
        refreshChart(true);
    };
    reader.readAsText(file);
});

if (timeframeSelect) timeframeSelect.addEventListener('change', () => refreshChart(true));

setSeriesType('candles');
window.addEventListener('resize', () => {
    chart.applyOptions({ width: chartContainer.clientWidth });
    resizeChart();
});