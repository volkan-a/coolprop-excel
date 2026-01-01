#!/bin/bash
set -e

# Define paths
SOURCE_DIR="$(pwd)/../extern/CoolProp"
OUTPUT_DIR="$(pwd)/src/wasm"

echo "Using CoolProp source at: $SOURCE_DIR"
echo "Output will be in: $OUTPUT_DIR"

# Ensure output dir exists
mkdir -p "$OUTPUT_DIR"

# Copy modified bindings back to source
cp src/wasm/emscripten_interface.cxx "$SOURCE_DIR/src/emscripten_interface.cxx"

# Run Docker
# Reduced optimization to -O0 to prevent compiler crash (OOM)
docker run --rm \
  -v "$SOURCE_DIR":/src \
  -v "$OUTPUT_DIR":/output \
  -w /src \
  emscripten/emsdk \
  emcc -O0 \
  -DEMSCRIPTEN \
  -I. \
  -Iboost_CoolProp \
  -Iinclude \
  -Isrc \
  -Iexternals/Eigen \
  -Iexternals/fmtlib/include \
  -Iexternals/nlohmann-json \
  -Iexternals/incbin \
  -std=c++17 \
  -s WASM=1 \
  -s MODULARIZE=1 \
  -s EXPORT_NAME='createCoolPropModule' \
  -s "EXPORTED_RUNTIME_METHODS=['FS']" \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s SINGLE_FILE=0 \
  -o /output/coolprop.js \
  src/emscripten_interface.cxx \
  src/CoolPropPlot.cpp \
  src/HumidAirProp.cpp \
  src/ODEIntegrators.cpp \
  src/CoolProp.cpp \
  src/CoolPropTools.cpp \
  src/DataStructures.cpp \
  src/Backends/Helmholtz/VLERoutines.cpp \
  src/Backends/Helmholtz/ReducingFunctions.cpp \
  src/Backends/Helmholtz/HelmholtzEOSMixtureBackend.cpp \
  src/Backends/Helmholtz/FlashRoutines.cpp \
  src/Backends/Helmholtz/PhaseEnvelopeRoutines.cpp \
  src/Backends/Helmholtz/MixtureParameters.cpp \
  src/Backends/Helmholtz/MixtureDerivatives.cpp \
  src/Backends/Helmholtz/HelmholtzEOSBackend.cpp \
  src/Backends/Helmholtz/Fluids/Ancillaries.cpp \
  src/Backends/Helmholtz/Fluids/FluidLibrary.cpp \
  src/Backends/Helmholtz/TransportRoutines.cpp \
  src/Backends/IF97/IF97Backend.cpp \
  src/Backends/Tabular/BicubicBackend.cpp \
  src/Backends/Tabular/TabularBackends.cpp \
  src/Backends/Tabular/TTSEBackend.cpp \
  src/Backends/PCSAFT/PCSAFTBackend.cpp \
  src/Backends/PCSAFT/PCSAFTFluid.cpp \
  src/Backends/PCSAFT/PCSAFTLibrary.cpp \
  src/Backends/Cubics/CubicBackend.cpp \
  src/Backends/Cubics/UNIFAC.cpp \
  src/Backends/Cubics/CubicsLibrary.cpp \
  src/Backends/Cubics/UNIFACLibrary.cpp \
  src/Backends/Cubics/GeneralizedCubic.cpp \
  src/Backends/Cubics/VTPRBackend.cpp \
  src/Backends/Incompressible/IncompressibleBackend.cpp \
  src/Backends/Incompressible/IncompressibleFluid.cpp \
  src/Backends/Incompressible/IncompressibleLibrary.cpp \
  src/Backends/REFPROP/REFPROPMixtureBackend.cpp \
  src/Backends/REFPROP/REFPROPBackend.cpp \
  src/CPfilepaths.cpp \
  src/AbstractState.cpp \
  src/Ice.cpp \
  src/PolyMath.cpp \
  src/CPnumerics.cpp \
  src/Solvers.cpp \
  src/CoolPropLib.cpp \
  src/SpeedTest.cpp \
  src/Configuration.cpp \
  src/Helmholtz.cpp \
  src/MatrixMath.cpp \
  src/CPstrings.cpp

echo "Compilation finished. Checking output..."
ls -l "$OUTPUT_DIR/coolprop.js"
ls -l "$OUTPUT_DIR/coolprop.wasm"
