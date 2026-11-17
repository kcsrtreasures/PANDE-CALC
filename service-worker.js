
const CACHE_NAME = "pande-calc-v4";

const APP_FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./manifest.webmanifest",
  "./icon.svg"
];


// ==========================================
// INSTALL
// ==========================================

self.addEventListener(
  "install",
  event => {

    event.waitUntil(

      caches.open(
        CACHE_NAME
      )
      .then(
        cache => {

          return cache.addAll(
            APP_FILES
          );

        }
      )
      .then(
        () => {

          return self.skipWaiting();

        }
      )

    );

  }
);


// ==========================================
// ACTIVATE
// ==========================================

self.addEventListener(
  "activate",
  event => {

    event.waitUntil(

      caches.keys()
        .then(
          cacheNames => {

            return Promise.all(

              cacheNames
                .filter(
                  name =>

                    name.startsWith("pande-calc-") &&
                    name !== CACHE_NAME

                )
                .map(
                  name =>

                    caches.delete(
                      name
                    )

                )

            );

          }
        )
        .then(
          () => {

            return self.clients.claim();

          }
        )

    );

  }
);


// ==========================================
// FETCH
// ==========================================

self.addEventListener(
  "fetch",
  event => {

    if (
      event.request.method !== "GET"
    ) {

      return;

    }


    const request =
      event.request;

    const url =
      new URL(request.url);


    // Only handle requests from this app.

    if (
      url.origin !== self.location.origin
    ) {

      return;

    }


    // Network-first strategy:
    // Always try to get the latest version.
    // Use cached files when offline.

    event.respondWith(

      fetch(request)

        .then(
          response => {

            if (
              !response ||
              response.status !== 200 ||
              response.type !== "basic"
            ) {

              return response;

            }


            const clone =
              response.clone();


            event.waitUntil(

              caches.open(
                CACHE_NAME
              )
              .then(
                cache => {

                  return cache.put(
                    request,
                    clone
                  );

                }
              )

            );


            return response;

          }
        )

        .catch(
          async () => {

            const cached = await caches.match(
              request
            );


            if (
              cached
            ) {

              return cached;

            }


            // Show the app when navigating offline.

            if (
              request.mode === "navigate"
            ) {

              return caches.match(
                "./index.html"
              );

            }


            return new Response(
              "You are offline and this file is not cached.",
              {
                status: 503,
                statusText: "Offline"
              }
            );

          }
        )

    );

  }
);
