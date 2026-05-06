import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for Correios Shipping Calculation (Simplified Simulation)
  app.post("/api/shipping", (req, res) => {
    const { zip, items } = req.body;
    
    if (!zip || !items) {
      return res.status(400).json({ error: "ZIP and items are required" });
    }

    // Mock logic: Base price R$ 15, + R$ 2 per item if outside Paraná
    // Parana ZIP range: 80000-000 to 87999-999
    const cleanZip = zip.replace(/\D/g, "");
    const isPR = cleanZip.startsWith("8");
    
    let base = isPR ? 15.00 : 25.00;
    const itemsCount = Array.isArray(items) ? items.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0) : 1;
    
    const cost = base + (itemsCount * 1.5);

    res.json({
      price: parseFloat(cost.toFixed(2)),
      estimatedDays: isPR ? 3 : 7,
      carrier: "Correios"
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
