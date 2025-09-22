import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { serveDir } from "https://deno.land/std@0.203.0/http/file_server.ts";

const KV_KEY = "glass-table-v1";
const WIDTHS_KEY = "glass-table-widths-v1";


// Enkel filbasert fallback for lokal utvikling
async function readJsonFile(path: string) {
  try {
    const data = await Deno.readTextFile(path);
    return JSON.parse(data);
  } catch {
    return null;
  }
}
async function writeJsonFile(path: string, data: unknown) {
  await Deno.writeTextFile(path, JSON.stringify(data));
}

async function handleApi(req: Request): Promise<Response | undefined> {
  const url = new URL(req.url);
  const isDeploy = typeof (Deno as any).openKv === "function";
  let kv: any = null;
  if (isDeploy) {
    kv = await (Deno as any).openKv();
  }

  if (url.pathname === "/api/data") {
    if (req.method === "GET") {
      let data;
      if (isDeploy) {
        data = (await kv.get([KV_KEY])).value ?? null;
      } else {
        data = await readJsonFile("./data.json");
      }
      return new Response(JSON.stringify(data), {
        headers: { "content-type": "application/json; charset=utf-8" },
      });
    } else if (req.method === "POST") {
      const body = await req.json();
      if (isDeploy) {
        await kv.set([KV_KEY], body);
      } else {
        await writeJsonFile("./data.json", body);
      }
      return new Response("ok");
    }
  }

  if (url.pathname === "/api/widths") {
    if (req.method === "GET") {
      let widths;
      if (isDeploy) {
        widths = (await kv.get([WIDTHS_KEY])).value ?? {};
      } else {
        widths = await readJsonFile("./widths.json") ?? {};
      }
      return new Response(JSON.stringify(widths), {
        headers: { "content-type": "application/json; charset=utf-8" },
      });
    } else if (req.method === "POST") {
      const body = await req.json();
      if (isDeploy) {
        await kv.set([WIDTHS_KEY], body);
      } else {
        await writeJsonFile("./widths.json", body);
      }
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
