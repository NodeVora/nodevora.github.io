const si = require("systeminformation");
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());

app.get("/stats", async (req, res) => {
  try {
    const cpu = await si.currentLoad();
    const gpu = await si.graphics();
    const disk = await si.fsSize();
    const mem = await si.mem();

    res.json({
      cpu: cpu.currentLoad.toFixed(1),
      gpu: gpu.controllers?.[0]?.utilizationGpu || 0,
      disk: disk[0]?.use || 0,
      ram: ((mem.active / mem.total) * 100).toFixed(1)
    });
  } catch (err) {
    res.json({ error: true });
  }
});

app.listen(3001, () => console.log("Nodevora system monitor running on port 3001"));
