import "https://deno.land/x/dotenv/load.ts";
import { serve } from "https://deno.land/std/http/server.ts";

const PORT = Deno.env.get("PORT") || "8000";
const MERCADOPAGO_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");

if (!MERCADOPAGO_ACCESS_TOKEN) {
  console.error(
    "El Access Token de Mercado Pago no está configurado. Asegúrate de tener el archivo .env configurado."
  );
  Deno.exit(1);
}

const handler = async (req: Request): Promise<Response> => {
  const url = new URL(req.url);

  if (url.pathname === "/crear-preferencia" && req.method === "POST") {
    try {
      const body = await req.json();
      const { price } = body;

      // Configurar el objeto de preferencia de Mercado Pago
      const preferenceData = {
        items: [
          {
            title: "Pago de Prenda",
            unit_price: parseFloat(price),
            quantity: 1,
          },
        ],
        back_urls: {
          success: "https://tu-dominio.com/success",
          failure: "https://tu-dominio.com/failure",
          pending: "https://tu-dominio.com/pending",
        },
        auto_return: "approved",
      };

      // Realizar la solicitud a la API de Mercado Pago
      const response = await fetch(
        "https://api.mercadopago.com/checkout/preferences",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
          },
          body: JSON.stringify(preferenceData),
        }
      );

      if (!response.ok) {
        const errorResponse = await response.json();
        console.error("Error al crear la preferencia:", errorResponse);
        return new Response("Error al crear la preferencia de pago", {
          status: 500,
        });
      }

      const preference = await response.json();
      return new Response(JSON.stringify({ id: preference.id }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      console.error("Error al procesar la solicitud:", error);
      return new Response("Error al procesar la solicitud", { status: 500 });
    }
  } else {
    return new Response("Not Found", { status: 404 });
  }
};

console.log(`Servidor corriendo en http://localhost:${PORT}`);
await serve(handler, { port: Number(PORT) });
