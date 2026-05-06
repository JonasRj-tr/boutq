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

  // API Route for Mercado Livre Products Proxy
  app.get("/api/mercado-livre/products", async (_req, res) => {
    try {
      // Use different strategies to get products
      const searchQueries = [
        { url: "https://api.mercadolibre.com/sites/MLB/search?q=Botaniq", label: "general_brand" },
        { url: "https://api.mercadolibre.com/sites/MLB/search?q=Botaniq%20Sabonete%20Artesanal", label: "keyword_brand" },
        { url: "https://api.mercadolibre.com/sites/MLB/search?nickname=rida72480", label: "nickname" }
      ];
      
      let data = { results: [] };
      let lastError = null;

      const commonHeaders = {
        'Accept': 'application/json',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Connection': 'keep-alive'
      };

      for (const query of searchQueries) {
        try {
          console.log(`Trying ML Strategy: ${query.label}`);
          const response = await fetch(query.url, { 
            headers: commonHeaders,
            method: 'GET',
            redirect: 'follow'
          });

          if (response.ok) {
            const result = await response.json();
            if (result.results && result.results.length > 0) {
              data = result;
              console.log(`ML Success with strategy: ${query.label}`);
              break;
            } else {
              console.warn(`ML Empty results for ${query.label}`);
            }
          } else {
            const errorBody = await response.text();
            lastError = errorBody;
            console.error(`ML API Error (${query.label}):`, response.status, errorBody);
            
            // If we get a 403, we might want to try one last desperate attempt with NO headers at all
            if (response.status === 403) {
               console.log("Retrying with minimal headers...");
               const retryRes = await fetch(query.url, { 
                 headers: { 'User-Agent': 'Mozilla/5.0' } 
               });
               if (retryRes.ok) {
                 const retryResult = await retryRes.json();
                 if (retryResult.results && retryResult.results.length > 0) {
                   data = retryResult;
                   break;
                 }
               }
            }
          }
        } catch (e) {
          console.error(`ML Fetch Exception (${query.label}):`, e);
        }
      }

      // If absolutely everything failed, we use discovered real product data
      if (data.results.length === 0) {
        console.warn("Mercado Livre API failed all strategies, using user-provided product data.");
        data.results = [
          {
            id: "USER_PROD_1",
            title: "Kit Farol Sabonetes Artesanais Botaniq Cesto Crochê Azul",
            price: 504.00,
            thumbnail: "https://i.postimg.cc/zvVDmLTH/D-NQ-NP-2X-967843-MLB111276624139-052026-F-kit-farol-sabonetes-artesanais-botaniq-cesto-croch-azul-1.webp",
            permalink: "https://www.mercadolivre.com.br/social/rida72480",
            condition: "new"
          } as any,
          {
            id: "USER_PROD_2",
            title: "Óleo De Banho Em Barra Botaniq",
            price: 13.90,
            thumbnail: "https://i.postimg.cc/tJKjLBqy/D-NQ-NP-2X-762274-MLB111271103451-052026-F-oleo-de-banho-em-barra-botaniq-1.webp",
            permalink: "https://www.mercadolivre.com.br/social/rida72480",
            condition: "new"
          } as any,
          {
            id: "USER_PROD_3",
            title: "Kit 4 Palito Espátula Mista Manicure Cutelaria Desencravador",
            price: 19.00,
            thumbnail: "https://i.postimg.cc/DZDkXxb7/D-NQ-NP-2X-642950-MLA79744315367-102024-F-1.webp",
            permalink: "https://www.mercadolivre.com.br/social/rida72480",
            condition: "new"
          } as any,
          {
            id: "USER_PROD_4",
            title: "Escova Gringa Fitagem Raquete Cabelo Cacheado Definidora Modeladora Cacho Profissional Mariazinha",
            price: 19.90,
            thumbnail: "https://i.postimg.cc/T3Gw1PxM/D-NQ-NP-2X-790488-MLA103750762355-012026-F-1.webp",
            permalink: "https://www.mercadolivre.com.br/social/rida72480",
            condition: "new"
          } as any,
          {
            id: "USER_PROD_5",
            title: "Kit Pincel De Maquiagem Com 13 Unidades Sombra Blush Cor Marrom",
            price: 19.39,
            thumbnail: "https://i.postimg.cc/JzP1hcKn/D-NQ-NP-2X-672781-MLA92082962837-092025-F-1.webp",
            permalink: "https://www.mercadolivre.com.br/social/rida72480",
            condition: "new"
          } as any,
          {
            id: "USER_PROD_6",
            title: "Alicate Unha Profissional E Cuticulas Em Aço Inox Cirúrgico Alta Precisão",
            price: 45.90,
            thumbnail: "https://i.postimg.cc/Qd43DNx6/D-NQ-NP-2X-977462-MLA108167552182-032026-F-1.webp",
            permalink: "https://www.mercadolivre.com.br/social/rida72480",
            condition: "new"
          } as any,
          {
            id: "USER_PROD_7",
            title: "Aparelho Lixa Pés Elétrico Esfoliante Removedor De Calos Usb",
            price: 39.90,
            thumbnail: "https://i.postimg.cc/N03ZGKhb/D-NQ-NP-2X-880687-MLB94953153035-102025-F-1.webp",
            permalink: "https://www.mercadolivre.com.br/social/rida72480",
            condition: "new"
          } as any,
          {
            id: "USER_PROD_8",
            title: "Gloss Fran By Franciny Ehlke Liphoney Mel",
            price: 42.00,
            thumbnail: "https://i.postimg.cc/zX2tXyKX/D-NQ-NP-2X-855365-MLB95050151929-102025-F-1.webp",
            permalink: "https://www.mercadolivre.com.br/social/rida72480",
            condition: "new"
          } as any
        ];
      }

      res.json(data);
    } catch (error: any) {
      console.error("ML Proxy Error:", error);
      res.status(500).json({ error: "Internal Server Error", message: error.message });
    }
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
