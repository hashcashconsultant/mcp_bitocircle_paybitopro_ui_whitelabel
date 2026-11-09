// public/firebase-messaging-sw.js
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDu3Y05l0bYg2grajUK74hzFGrRal_O_mM",
  authDomain: "paybitopro-bitocircle.firebaseapp.com",
  projectId: "paybitopro-bitocircle",
  storageBucket: "paybitopro-bitocircle.firebasestorage.app",
  messagingSenderId: "9935580940",
  appId: "1:9935580940:web:b0d2a46f85fb0f76796329",
  measurementId: "G-MK8RWV2TFL"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Background message received:", payload);

  const notificationTitle = payload.notification?.title || "New Notification";
  const notificationOptions = {
    body: payload.notification?.body || "",
    icon: "/icon-192x192.png", // Update with your app icon path
    badge: "/icon-192x192.png",
    data: payload.data,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || "/";
  
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          return client.focus();
        }
      }
      return clients.openWindow(urlToOpen);
    })
  );
});