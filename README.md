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

## Design: cyanotype herbarium

The visual identity comes from Anna Atkins' *Photographs of British Algae* (1843), the first
book illustrated with photographs, whose plants were printed as cyanotypes, and from
herbarium sheets, where specimens are taped to paper with a typed determination label.

| Token | Hex | Use |
|---|---|---|
| Prussian | `#0F2742` | App ground |
| Print blue | `#1F4F8F` | Cyanotype wash over photos |
| Herbarium paper | `#EEF2EF` | Sheets, primary buttons |
| Wash | `#9DB8D6` | Secondary text on blue |
| Ferricyanide | `#E2643F` | Toxicity warnings only |
| Citrate | `#D4E28A` | "Safe" states only |

- **Type:** Bodoni Moda for plant names only (Latin binomials in italic, as botanists write
  them), Atkinson Hyperlegible for body text (it's read outdoors), and Courier Prime for
  typed label data.
- **Signature moment:** while a photo is analyzed it sits under the blue wash with an
  exposure line passing over it. When the result arrives it develops into full colour.
  Saved plants stay as blue prints, numbered "Pl. 1, 2, 3…" in the order they were saved.
  Animation is skipped when the OS "reduce motion" setting is on.
- Tokens live in `constants/theme.ts`. Custom faces carry their own weight, so don't combine
  them with `fontWeight`.

## Project structure

```
app/
  _layout.tsx          Root stack, navigation theme, Bodoni/Atkinson/Courier fonts, splash, providers, paywall
  (tabs)/_layout.tsx   Bottom tabs: Identify · Collection · Scans
  (tabs)/index.tsx     Camera viewfinder, shutter, flash toggle, library picker, scan tag
  (tabs)/collection.tsx  Saved plants as numbered cyanotype plates
  (tabs)/store.tsx     Scan balance and top-up
  result.tsx           Analysis screen (fresh scan via ?uri=…, saved plant via ?id=…)
components/
  PaywallModal.tsx     Simulated in-app purchase sheet (offer → buying → done)
  Cyanotype.tsx        Cyanotype wash: DevelopingPhoto (analysis) and CyanotypePrint (plates)
  HerbariumLabel.tsx   Typed determination label (family, habit, native range, confidence)
  Skeleton.tsx         Placeholder lines on the sheet while analyzing
  Button.tsx, ScanTag.tsx
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
  (`expo-file-system`) so they survive cache eviction. On web they're stored as data URIs
  in localStorage, which holds roughly 30 plants.

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
