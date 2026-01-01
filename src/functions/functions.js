/* global CustomFunctions, console, document, Office */

console.log("functions.js loaded - AbstractState enabled");

// Global CoolProp module reference
let CoolPropModule = null;
let isLoading = false;
let loadPromise = null;

// AbstractState cache for performance
const stateCache = new Map();
const STATE_CACHE_MAX_SIZE = 100;

// Helper to load the CoolProp WASM module
async function initCoolProp() {
  if (CoolPropModule) return CoolPropModule;
  if (isLoading) return loadPromise;

  console.log("Initializing CoolProp...");
  isLoading = true;

  loadPromise = new Promise(async (resolve, reject) => {
    try {
      console.log("Starting dynamic import of coolprop.js...");

      const modulePath = "https://localhost:3000/wasm/coolprop.js";
      const coolpropLib = await import(/* webpackIgnore: true */ modulePath);

      console.log("coolprop.js imported successfully");
      const createCoolPropModule = coolpropLib.default || coolpropLib;

      if (typeof createCoolPropModule !== "function") {
        throw new Error("Imported module is not a factory function");
      }

      console.log("Creating WASM module instance...");
      const module = await createCoolPropModule({
        locateFile: (path) => {
          if (path.endsWith(".wasm")) {
            const wasmPath = "https://localhost:3000/wasm/coolprop.wasm";
            return wasmPath;
          }
          return path;
        },
        print: (text) => console.log("[CoolProp]:", text),
        printErr: (text) => console.error("[CoolProp Err]:", text),
      });

      CoolPropModule = module;
      isLoading = false;
      console.log("CoolProp WASM module initialized successfully");
      console.log("Available input_pairs:", Object.keys(module.input_pairs || {}));
      resolve(module);
    } catch (error) {
      console.error("Error in initCoolProp:", error);
      isLoading = false;
      reject(error);
    }
  });

  return loadPromise;
}

// Get or create cached AbstractState
function getOrCreateState(fluid, backend = "HEOS") {
  const key = `${backend}:${fluid}`;
  if (stateCache.has(key)) {
    return stateCache.get(key);
  }

  // Clear old entries if cache is full
  if (stateCache.size >= STATE_CACHE_MAX_SIZE) {
    const firstKey = stateCache.keys().next().value;
    const oldState = stateCache.get(firstKey);
    oldState.delete();
    stateCache.delete(firstKey);
  }

  const state = CoolPropModule.factory(backend, fluid);
  stateCache.set(key, state);
  return state;
}

// Get input_pairs enum value
function getInputPair(name) {
  if (!CoolPropModule || !CoolPropModule.input_pairs) {
    throw new Error("CoolProp module not initialized");
  }
  const pair = CoolPropModule.input_pairs[name];
  if (!pair) {
    throw new Error(
      `Unknown input pair: ${name}. Valid: PT_INPUTS, PQ_INPUTS, QT_INPUTS, DmassT_INPUTS, etc.`
    );
  }
  return pair;
}

// Auto-initialize on load if Office is ready
if (typeof Office !== "undefined") {
  Office.onReady(() => {
    initCoolProp().catch((err) => {
      console.error("CoolProp pre-load failed:", err);
    });
  });
} else {
  initCoolProp().catch((e) => console.error("Immediate init failed:", e));
}

/**
 * Test function to verify add-in is working
 * @customfunction
 * @returns {string}
 */
function TEST_HELLO() {
  return "CoolProp Ready (with AbstractState)";
}

/**
 * Get CoolProp version
 * @customfunction
 * @returns {string}
 */
async function VERSION() {
  try {
    if (!CoolPropModule) await initCoolProp();
    return CoolPropModule.get_global_param_string("version");
  } catch (error) {
    return "Error: " + error.message;
  }
}

/**
 * CoolProp PropsSI function (High-Level API)
 * @customfunction
 * @param {string} output Output property (D, H, S, T, P, etc.)
 * @param {string} name1 First input name
 * @param {number} prop1 First input value
 * @param {string} name2 Second input name
 * @param {number} prop2 Second input value
 * @param {string} ref Fluid name (Water, Air, R134a, etc.)
 * @returns {number}
 */
async function PROPSI(output, name1, prop1, name2, prop2, ref) {
  try {
    if (!CoolPropModule) await initCoolProp();
    return CoolPropModule.PropsSI(output, name1, prop1, name2, prop2, ref);
  } catch (error) {
    throw new CustomFunctions.Error(CustomFunctions.ErrorCode.invalidValue, error.message);
  }
}

/**
 * AbstractState property calculation - Low-Level API with cached state
 * @customfunction
 * @param {string} fluid Fluid name (Water, R134a, Methane&Ethane for mixtures)
 * @param {string} inputPair Input pair (PT_INPUTS, PQ_INPUTS, QT_INPUTS, etc.)
 * @param {number} value1 First input value
 * @param {number} value2 Second input value
 * @param {string} output Output property (T, p, rhomass, hmass, smass, cpmass, viscosity, conductivity, etc.)
 * @returns {number}
 */
async function STATEPROPS(fluid, inputPair, value1, value2, output) {
  try {
    if (!CoolPropModule) await initCoolProp();

    const state = getOrCreateState(fluid);
    const pair = getInputPair(inputPair);

    state.update(pair, value1, value2);

    // Map output string to method call
    const outputLower = output.toLowerCase();
    const methodMap = {
      t: "T",
      p: "p",
      rhomass: "rhomass",
      rhomolar: "rhomolar",
      hmass: "hmass",
      hmolar: "hmolar",
      smass: "smass",
      smolar: "smolar",
      umass: "umass",
      umolar: "umolar",
      cpmass: "cpmass",
      cpmolar: "cpmolar",
      cvmass: "cvmass",
      cvmolar: "cvmolar",
      viscosity: "viscosity",
      conductivity: "conductivity",
      speed_sound: "speed_sound",
      q: "Q",
      prandtl: "Prandtl",
      surface_tension: "surface_tension",
      gibbsmass: "gibbsmass",
      helmholtzmass: "helmholtzmass",
      t_critical: "T_critical",
      p_critical: "p_critical",
      rhomass_critical: "rhomass_critical",
      molar_mass: "molar_mass",
      gas_constant: "gas_constant",
      acentric_factor: "acentric_factor",
    };

    const methodName = methodMap[outputLower] || output;
    if (typeof state[methodName] !== "function") {
      throw new Error(`Unknown output property: ${output}`);
    }

    return state[methodName]();
  } catch (error) {
    throw new CustomFunctions.Error(CustomFunctions.ErrorCode.invalidValue, error.message);
  }
}

// Register functions
try {
  CustomFunctions.associate("TEST_HELLO", TEST_HELLO);
  CustomFunctions.associate("VERSION", VERSION);
  CustomFunctions.associate("PROPSI", PROPSI);
  CustomFunctions.associate("STATEPROPS", STATEPROPS);
} catch (error) {
  console.error("Error associating functions:", error);
}
