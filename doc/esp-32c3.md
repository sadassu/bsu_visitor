#include <NimBLEDevice.h>

// ===================== CONFIG =====================
#define BEACON_NAME "ESP32_OFFICE"
// =================================================

NimBLEAdvertising *pAdvertising;

void setup() {
  Serial.begin(115200);
  Serial.println("Starting BLE Beacon: " BEACON_NAME);

  NimBLEDevice::init(BEACON_NAME);

  // Create server (needed for stability)
  NimBLEServer *pServer = NimBLEDevice::createServer();

  // Advertising
  pAdvertising = NimBLEDevice::getAdvertising();

  NimBLEAdvertisementData advData;
  advData.setName(BEACON_NAME);

  NimBLEAdvertisementData scanResponse;
  scanResponse.setName(BEACON_NAME);

  pAdvertising->setAdvertisementData(advData);
  pAdvertising->setScanResponseData(scanResponse);

  pAdvertising->start();

  Serial.println("Broadcasting as: " BEACON_NAME);
}

void loop() {
  delay(30000);
  pAdvertising->start(); // refresh
  Serial.println("Advertising refreshed.");
}