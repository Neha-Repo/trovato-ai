# Trovato AI

> Find tickets before everyone else.

Trovato AI is a mobile cultural travel assistant that helps travelers discover experiences, check ticket availability, find alternative dates, create availability alerts, and plan activities through a conversational interface.

Built with Ionic, Angular, TypeScript, and NestJS, the application uses a provider-independent architecture designed to support multiple ticket and availability providers.

The core application is substantially complete and is currently being prepared for production deployment and Android release.

---

## 📱 Screenshots

<!-- Add screenshots here -->

Coming soon.

---

## ✨ Features

* Conversational attraction and experience search
* Museum and cultural experience discovery
* Real-time ticket availability checking
* Available time-slot discovery
* Alternative date recommendations
* Availability alerts
* Push notifications
* Saved favourites
* Trip planning
* User authentication
* Notification deep linking
* Mobile-first user experience

---

## 🛠️ Tech Stack

### Frontend & Mobile

* Ionic
* Angular
* Capacitor
* TypeScript

### Backend

* NestJS

### Services & Integrations

* Firebase Authentication
* Cloud Firestore
* Firebase Cloud Messaging
* Supabase
* Viator Partner API

---

## 🏗️ Architecture

Trovato AI uses a provider-independent availability architecture.

The frontend works with generic availability models while provider-specific logic remains in the backend.

```text
User
  ↓
Chat & Search
  ↓
Results
  ↓
Availability Service
  ↓
Provider Service
  ↓
Viator / Mock Provider
  ↓
Available Slots & Alternative Dates
  ↓
Continue Booking
  ↓
Provider Checkout
```

This approach allows additional ticket providers to be integrated without changing the main application flow.

---

## 🎟️ Viator Integration

The Viator sandbox integration is implemented and validated at the availability level.

The provider handles:

* Product schedule validation
* Operating dates and days
* Date-specific sold-out times
* Available time-slot generation
* Slot deduplication and chronological sorting
* Alternative available dates
* Provider error handling

The booking/checkout integration is the final provider-side functionality being validated before release.

---

## 🔔 Alerts & Notifications

The alert and notification flow has been implemented and tested end-to-end on a physical Android device.

It includes:

* Background availability matching
* Availability alerts
* Push notifications
* Notification handling
* Deep-link navigation
* Delayed authentication

---

## 🧪 Testing

Backend automated testing currently reports:

* ✅ 6 test suites passed
* ✅ 34 tests passed
* ✅ Viator sandbox responses validated
* ✅ Core flows tested on a physical Android device

---

## 🚀 Project Status

Core development is substantially complete.

### Completed

* ✅ Chat & navigation
* ✅ Search → Results flow
* ✅ Provider-independent availability architecture
* ✅ Mock availability provider
* ✅ Viator availability integration
* ✅ Authentication
* ✅ Alerts & push notifications
* ✅ Deep-link notification flow
* ✅ Backend automated testing
* ✅ Physical Android device testing

### Remaining Before Release

* ⏳ Final Viator booking/checkout validation
* ⏳ Production configuration
* ⏳ Final regression testing
* ⏳ Android signing & release build
* ⏳ Backend deployment
* ⏳ Production smoke testing

---

## 🔒 Security

Sensitive provider credentials are kept on the backend and are not exposed to the Ionic/Angular frontend.

Production preparation includes HTTPS, environment configuration, OAuth verification, CORS restrictions, secret scanning, Android permission review, and production notification configuration.

---

## 👩‍💻 Built By

Neha

Frontend & Mobile Developer

Angular • Ionic • TypeScript • NestJS

---

Built with ❤️ using Ionic, Angular, Capacitor, TypeScript, NestJS, Firebase, Supabase, and Viator.
