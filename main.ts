import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { serveDir } from "https://deno.land/std@0.203.0/http/file_server.ts";

const KV_KEY = "glass-table-v1";
const WIDTHS_KEY = "glass-table-widths-v1";

async function handleApi(req: Request): Promise<Response | undefined> {
  const kv = await Deno.openKv();
  const url = new URL(req.url);

  if (url.pathname === "/api/data") {
    if (req.method === "GET") {
      const data = (await kv.get([KV_KEY])).value ?? null;
      return new Response(JSON.stringify(data), {
        headers: { "content-type": "application/json; charset=utf-8" },
      });
    } else if (req.method === "POST") {
      const body = await req.json();
      await kv.set([KV_KEY], body);
      return new Response("ok");
    }
  }

  if (url.pathname === "/api/widths") {
    if (req.method === "GET") {
      const widths = (await kv.get([WIDTHS_KEY])).value ?? {};
      return new Response(JSON.stringify(widths), {
        headers: { "content-type": "application/json; charset=utf-8" },
      });
    } else if (req.method === "POST") {
      const body = await req.json();
      await kv.set([WIDTHS_KEY], body);
      return new Response("ok");
    }
  }

  return undefined;
}

serve(async (req) => {
  // API først
  const api = await handleApi(req);
  if (api) return api;

  // Ellers: serve statiske filer fra ./public
  return serveDir(req, {
    fsRoot: "./public",
    urlRoot: "",
    showDirListing: false,
  });
});
