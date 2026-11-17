const CACHE_NAME = "pande-calc-v3";

const APP_FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./manifest.webmanifest",
  "./icon.svg"
];


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



self.addEventListener(
  "fetch",
  event => {

    if (
      event.request.method !== "GET"
    ) {

      return;

    }


    event.respondWith(

      caches.match(
        event.request
      )
      .then(
        cached => {

          if (
            cached
          ) {

            return cached;

          }


          return fetch(
            event.request
          )
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


              caches.open(
                CACHE_NAME
              )
              .then(
                cache => {

                  cache.put(
                    event.request,
                    clone
                  );

                }
              );


              return response;

            }
          )
          .catch(
            () => {

              return caches.match(
                "./index.html"
              );

            }
          );

        }
      )

    );

  }
);