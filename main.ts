import { serve } from "https://deno.land/std@0.181.0/http/server.ts";
import { CSS, render } from "https://deno.land/x/gfm@0.1.22/mod.ts";

const readme = await Deno.readTextFile("./README.md");
const readmeBody = render(readme);
const readmeHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CORS Proxy</title>
    <style>
      body {
        margin: 0;
        background-color: var(--color-canvas-default);
        color: var(--color-fg-default);
      }
      main {
        max-width: 800px;
        margin: 0 auto;
        padding: 2rem 1rem;
      }
      ${CSS}
    </style>
  </head>
  <body data-color-mode="auto" data-light-theme="light" data-dark-theme="dark">
    <main class="markdown-body">
      ${readmeBody}
    </main>
  </body>
</html>`;

function addCorsIfNeeded(request: Request): Headers {
    const headers = new Headers();

    headers.set(
        "access-control-allow-origin",
        request.headers.get("origin") ?? "*"
    );
    headers.set("access-control-allow-credentials", "true");

    return headers;
}

function isUrl(url: string) {
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
        return false;
    }

    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

async function handleRequest(request: Request) {
    const { pathname, search } = new URL(request.url);
    const url = pathname.substring(1) + search;

    if (isUrl(url)) {
        console.log(`proxy to ${url}`);
        const corsHeaders = addCorsIfNeeded(request);
        if (request.method.toUpperCase() === "OPTIONS") {
            return new Response(null, { headers: corsHeaders });
        }

        const response = await fetch(url, request);
        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: {
                ...response.headers,
                ...corsHeaders
            }
        });
    }

    return new Response(readmeHtml, {
        headers: {
            "content-type": "text/html;charset=utf-8"
        }
    });
}

const port = Deno.env.get("PORT") ?? "8000";

serve(handleRequest, { port: Number(port) });
