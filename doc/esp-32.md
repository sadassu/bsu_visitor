#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>

// ===================== HARD CODED CONFIG =====================
// Must exactly match the keys in your Vue BEACON_DICTIONARY
#define BEACON_NAME "ESP32_TEST"
// ============================================================

BLEAdvertising *pAdvertising;

void setup() {
  Serial.begin(115200);
  Serial.println("Starting BLE Beacon: " BEACON_NAME);

  // Init with the beacon name
  BLEDevice::init(BEACON_NAME);

  // Required for BLE stack stability
  BLEServer *pServer = BLEDevice::createServer();

  // Advertisement data
  BLEAdvertisementData advData;
  advData.setName(BEACON_NAME);  // This is what the phone scans

  // Scan response data (also set name here so Android picks it up reliably)
  BLEAdvertisementData scanResponse;
  scanResponse.setName(BEACON_NAME);

  pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->setAdvertisementData(advData);
  pAdvertising->setScanResponseData(scanResponse); // 👈 critical for Android
  pAdvertising->setScanFilter(false, false);        // allow all devices to scan
  pAdvertising->setMinPreferred(0x06);              // helps with Android detection
  pAdvertising->setMaxPreferred(0x12);

  BLEDevice::startAdvertising();

  Serial.println("Broadcasting as: " BEACON_NAME);
}

void loop() {
  // Restart advertising every 30s — Android sometimes stops seeing it
  delay(30000);
  BLEDevice::startAdvertising();
  Serial.println("Advertising refreshed.");
}