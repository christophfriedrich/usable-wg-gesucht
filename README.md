# usable-wg-gesucht

Provides a nicer user interface for discovering flat share offers on wg-gesucht.de

## Why?
Because the original site is so full of ads that it is almost unusable. Also, I wanted some cool extra features.

## How?
Basically you only need to open the index.html in your browser and should be ready to go.

However, wg-gesucht.de's API server doesn't send cross-origin headers (the API is only intended for their app), so you'll need to tell your browser to accept the data anyways. For my beloved Firefox, I use the [CORS Everywhere addon](https://addons.mozilla.org/de/firefox/addon/cors-everywhere/) to do that.

The app stores its database in your browser cache. It should still be there when you open the site the next time.