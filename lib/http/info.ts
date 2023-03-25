import { serve } from "../deps/deno.ts";

function handleRequest(request: Request) {
  const output = {
    method: request.method,
    url: request.url,
    headers: Array.from(request.headers.entries()),
  };
  return new Response(JSON.stringify(output), {
    headers: {
      "Content-Type": "application/json",
    },
  });
}

await serve(handleRequest, {
  port: 8080,
});
