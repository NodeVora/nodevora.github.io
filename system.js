export function initSystemPanel() {

  const ramUsageEl = document.getElementById("ramUsage");
  const netSpeedEl = document.getElementById("netSpeed");
  const netStatusEl = document.getElementById("netStatus");

  function updateRAM() {
    if (performance.memory) {
      const used = performance.memory.usedJSHeapSize;
      const total = performance.memory.jsHeapSizeLimit;
      ramUsageEl.textContent = ((used / total) * 100).toFixed(1) + "%";
    } else {
      ramUsageEl.textContent = "--%";
    }
  }

  setInterval(updateRAM, 2000);

  function updateNetworkStatus() {
    netStatusEl.textContent = navigator.onLine ? "Online" : "Offline";
  }

  window.addEventListener("online", updateNetworkStatus);
  window.addEventListener("offline", updateNetworkStatus);

  async function testNetworkSpeed() {
    const start = performance.now();

    try {
      await fetch("https://speed.cloudflare.com/__down?bytes=1000000");

      const sec = (performance.now() - start) / 1000;

      netSpeedEl.textContent = (8 / sec).toFixed(1) + " Mbps";

    } catch {
      netSpeedEl.textContent = "-- Mbps";
    }
  }

  setInterval(testNetworkSpeed, 5000);

  updateNetworkStatus();
}
