// Light/Dark Mode Toggle with smooth transition
const toggleBtn = document.getElementById("modeToggle");
if (toggleBtn) {
  toggleBtn.addEventListener("click", () => {
    document.body.classList.toggle("light");
    localStorage.setItem("mode", document.body.classList.contains("light") ? "light" : "dark");
    playClickSound();
  });

  if (localStorage.getItem("mode") === "light") {
    document.body.classList.add("light");
  }
}

// Button click sound
let clickSound = new Audio("click.mp3");
function playClickSound() {
  clickSound.currentTime = 0;
  clickSound.play();
}

// Sound on all buttons
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', playClickSound);
  });
});

// Page fade
window.addEventListener("beforeunload", () => {
  document.body.style.opacity = "0";
});

// Glow pulse for nav buttons
document.querySelectorAll('.glow-button').forEach(btn => {
  btn.addEventListener('click', () => {
    btn.classList.remove('clicked');
    void btn.offsetWidth;
    btn.classList.add('clicked');
  });
});

let buyPrice = 0;
let cachedData = null;
let lastFetchTime = 0;
const CACHE_DURATION = 30000;

async function fetchPrice(itemID, targetDivId = "price", calculatorIndex = null) {
  const now = Date.now();
  let data = null;
  const cacheTime = parseInt(localStorage.getItem("bazaarCacheTime") || "0");
  if (now - cacheTime < CACHE_DURATION) {
    try {
      data = JSON.parse(localStorage.getItem("bazaarData"));
    } catch (e) {}
  }

  if (!data) {
    try {
      document.getElementById(targetDivId).innerText = "Loading...";
      const res = await fetch("https://api.hypixel.net/skyblock/bazaar");
      data = await res.json();
    } catch (e) {
      document.getElementById(targetDivId).innerText = "Failed to load price.";
      console.error(e);
      return;
    }
  }

  updatePriceDisplay(data, itemID, targetDivId, calculatorIndex);
}

function updatePriceDisplay(data, itemID, targetDivId, calculatorIndex) {
  const item = data.products[itemID];
  buyPrice = item.buy_summary[0]?.pricePerUnit || 0;
  const sellPrice = item.sell_summary[0]?.pricePerUnit || 0;
  document.getElementById(targetDivId).innerText =
    `Buy: ${buyPrice.toFixed(2)} coins | Sell: ${sellPrice.toFixed(2)} coins`;

  if (calculatorIndex !== null) {
    window[`buyPrice_${calculatorIndex}`] = buyPrice;
  }
}

function calculateEarnings(calculatorIndex = null) {
  const inputId = calculatorIndex !== null ? `blocksInput_${calculatorIndex}` : "blocksInput";
  const outputId = calculatorIndex !== null ? `earnings_${calculatorIndex}` : "earnings";
  const price = calculatorIndex !== null ? window[`buyPrice_${calculatorIndex}`] : buyPrice;

  const blocksPerMinute = parseFloat(document.getElementById(inputId).value);

  if (isNaN(blocksPerMinute) || price === 0) {
    document.getElementById(outputId).innerText = "Invalid input or price not loaded.";
    return;
  }

  const totalPerHour = blocksPerMinute * 60 * price;
  document.getElementById(outputId).innerText =
    `Estimated earnings/hour: ${Math.round(totalPerHour).toLocaleString()} coins (using buy price)`;
}


function handleRefresh(itemID, targetDivId = "price", calculatorIndex = null) {
  const button = document.querySelector(`#${targetDivId}Button`);
  if (button) {
    button.classList.remove('clicked');
    void button.offsetWidth;
    button.classList.add('clicked');
  }
  fetchPrice(itemID, targetDivId, calculatorIndex);
}

// FIXED: Load price history from Coflnet API
async function loadPriceHistory(itemID, canvasId) {
  try {
    const res = await fetch(`https://sky.coflnet.com/api/bazaar/${itemID}/history`);
    const history = await res.json();

    const sliced = history.slice(-50); // Last 50 data points
    const labels = sliced.map(entry => new Date(entry.timestamp).toLocaleTimeString());
    const prices = sliced.map(entry => entry.buyPrice);

    new Chart(document.getElementById(canvasId).getContext('2d'), {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Buy Price (last 50 points)',
          data: prices,
          fill: false,
          borderColor: '#00b894',
          tension: 0.2
        }]
      },
      options: {
        scales: {
          x: { display: false },
          y: { beginAtZero: true }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  } catch (e) {
    console.error(`Failed to load price history for ${itemID}:`, e);
  }
}
