function loadLegacyTransmitterRuntime() {
  const script = document.createElement("script");
  script.src = "../../../mobile-transmitter.js";
  script.defer = true;
  script.dataset.entry = "transmitter-domain";
  document.body.appendChild(script);
}

loadLegacyTransmitterRuntime();
