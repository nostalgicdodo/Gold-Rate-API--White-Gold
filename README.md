
# about
A little API server that returns the current live gold rate (and the rates throughout the current day), as reported on the MCX market.
Powers the Gold Rate page on the [White Gold website](https://whitegold.money/ka/live-gold).

The 3rd-party API providing the gold rates came with constraints, one of which being a limited request load.
Hence, this server is essentially a caching layer that proxies requests to the API.
It also leverages Cloudflare's CDN service as a redundant caching layer to reduce the load on the server.

## Built with
- Fastify
- axios
- nodeJS
