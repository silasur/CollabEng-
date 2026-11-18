# CollabEng

An AI-supported collaborative engineering workspace for university teams.

## Setup

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local URL shown in the terminal.

## CAD Preview

The notebook’s 3D CAD preview uses Three.js and occt-import-js.
Both packages are installed automatically with `npm install`.

Supported preview formats: STEP/STP, IGES/IGS, STL and OBJ.

## Development Status

Backend integration is in progress. Data persistence currently varies
by feature; some data is stored in the browser, while other data
is kept in memory and cleared when the page reloads.

## Build

```bash
npm run build
```