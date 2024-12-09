export async function handle({ event, resolve }) {
    const response = await resolve(event, {
      filterSerializedResponseHeaders(name) {
        // Allow SvelteKit to set specific headers, then add custom ones below.
        return true;
      }
    });
  
    // Set the necessary headers
    response.headers.set('Content-Security-Policy', "frame-ancestors 'self' https://example.com");
    response.headers.set('X-Frame-Options', 'ALLOW-FROM https://example.com'); // Optional: May not be widely supported.
  
    return response;
  }
  