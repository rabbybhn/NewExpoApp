# PlantID — AI Plant Identifier

An Expo (SDK 57, Expo Router) app: snap or pick a photo of a plant, send it to the OpenAI
Vision API, and get back a structured identification with a care guide, pet/human toxicity,
and a health check. Results can be saved to a local collection. Scans are metered by a mock
credit system: 3 free scans, then a simulated "Green Thumb Pack" purchase (20 scans for $1.99).

## Quick start

```bash
npm install
cp .env.example .env       # add EXPO_PUBLIC_OPENAI_API_KEY
npx expo start
```

Open the app in **Expo Go** (all native modules used are part of the Expo SDK) or a dev build.
The camera needs a real device; the iOS simulator has no camera, so use **Library** there.

## Project structure

```
app/
  _layout.tsx          Root stack, dark navigation theme, icon fonts, splash, providers, paywall
  (tabs)/_layout.tsx   Bottom tabs: Scanner · Collection · Credits
  (tabs)/index.tsx     Camera viewfinder, shutter, flash toggle, library picker, credit pill
  (tabs)/collection.tsx  Saved plants grid
  (tabs)/store.tsx     Credit balance and top-up
  result.tsx           Analysis screen (fresh scan via ?uri=…, saved plant via ?id=…)
components/
  PaywallModal.tsx     Simulated in-app purchase sheet (offer → processing → success)
  ScanningOverlay.tsx  Laser sweep + rotating status text while analyzing
  Skeleton.tsx         Pulsing skeleton loaders
  GradientButton.tsx, CreditPill.tsx
services/
  openai.ts            identifyPlant(base64) — strict JSON-schema response, timeout, typed errors
  image.ts             Downscale/re-encode to JPEG before upload; persist photos for the collection
  storage.ts           AsyncStorage persistence for credits and collection
  types.ts             PlantIdentification / CollectionItem
context/               CreditsContext (balance + paywall), CollectionContext
constants/             Theme tokens and runtime config
```

## How it works

- **Capture**: `expo-camera` `CameraView` (unmounted when the tab isn't focused) or
  `expo-image-picker`. Photos are resized to a max edge of 1024 px with
  `expo-image-manipulator` before upload to keep requests fast and cheap.
- **Identification**: `services/openai.ts` calls Chat Completions with
  `response_format: json_schema` (strict), so the model can only return the shape the UI
  renders. Responses are still validated and normalized defensively. Errors are classified
  (`config`, `network`, `timeout`, `auth`, `rate_limit`, `server`, `invalid_response`) and
  shown with a retry where it makes sense. Requests time out after 45 s and are aborted if
  you leave the screen.
- **Credits**: one credit is deducted only after a successful identification of an actual
  plant. Failed requests and "no plant detected" results are free. Your balance is stored in
  AsyncStorage.
- **Collection**: saved photos are copied out of the cache into the app's document directory
  (`expo-file-system`) so they survive cache eviction.

## Before shipping to the stores

1. **Move the OpenAI key server-side.** Anything prefixed with `EXPO_PUBLIC_` is readable in
   the app bundle. Deploy a small proxy, for example an
   [Expo Router API route](https://docs.expo.dev/router/web/api-routes/) or a serverless
   function, and set `EXPO_PUBLIC_PLANTID_API_URL`.
2. **Replace the mock purchase** in `components/PaywallModal.tsx` (`purchase()`) with a real
   IAP SDK such as RevenueCat or `expo-iap`. Verify receipts server-side, and track credits
   server-side if they need to be tamper-proof.
3. Replace the placeholder icon and splash in `assets/`.

## Scripts

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # expo lint
npx expo-doctor     # dependency and config checks
```
