# CoolProp Excel Add-in

This Excel add-in brings the power of **CoolProp** (Thermodynamic properties database) directly into Microsoft Excel using Custom Functions.
It runs on **Windows, Mac, and Excel on the Web**.

## Features

- **PropsSI**: Calculate thermodynamic properties (e.g., density, enthalpy, entropy) for over 100 fluids.
- **AbstractState**: Use the low-level AbstractState interface for higher performance and advanced calculations (Flash calculations, phases, etc.).
- **WASM Powered**: Runs entirely in the browser/Excel using WebAssembly. No external server required for calculations.

## Installation

### Excel for Web (Recommended for try-out)

1. Download the manifest file: [manifest-prod.xml](https://volkan-a.github.io/coolprop-excel/manifest-prod.xml) (Right-click > Save Link As)
2. Go to [Excel Online](https://onedrive.live.com) and create a new workbook.
3. Go to `Insert` tab > `Add-ins`.
4. Select `Manage My Add-ins` -> `Upload My Add-in`.
5. Select the `manifest-prod.xml` file you downloaded.

### Excel Desktop (Windows/Mac)

1. Download the manifest file: [manifest-prod.xml](https://volkan-a.github.io/coolprop-excel/manifest-prod.xml)
2. Follow the setup instructions for [Excel Sideloading](https://learn.microsoft.com/en-us/office/dev/add-ins/testing/test-debug-office-add-ins#sideload-an-office-add-in-for-testing).
   - **Mac**: Copy the manifest to `/Users/<username>/Library/Containers/com.microsoft.Excel/Data/Documents/wef`.
   - **Windows**: Share a folder, put the manifest in it, and add that folder as a "Trusted Add-in Catalog" in Excel Options.

## Usage

### Simple Property Calculation (PropsSI)

Calculate density of Water at 300 K and 101325 Pa:

```excel
=COOLPROP.PROPSSI("D", "T", 300, "P", 101325, "Water")
```

### Phase Calculation

Get the phase of the fluid:

```excel
=COOLPROP.PHASE("T", 300, "P", 101325, "Water")
```

## Functions List

| Function           | Description                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------ |
| `COOLPROP.PROPSSI` | High-level interface for property calculation. Same as the Python/MATLAB interface.        |
| `COOLPROP.PHASE`   | Returns the phase of the fluid state.                                                      |
| `COOLPROP.HAST`    | Returns the enthalpy and entropy (as a JSON string or array, depending on implementation). |

## Troubleshooting

- If you see `#BUSY!` for a long time, the WebAssembly module might be downloading (it's around 7MB).
- Ensure you have a working internet connection for the first load.
