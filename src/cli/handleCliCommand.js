// src/cli/commandHandler.js
const connections = require("../network/connections");
const LFTConfigService = require("../services/LFTConfig");
const mdns = require("../network/mdns");

async function handleCliCommand(command) {
  switch (command) {
    case "test":
      console.log("hello test");
      break;

    case "config":
      console.log("=== config ===");
      console.log(await LFTConfigService.getLFTConfig());
      break;

    case "connections":
      console.log(connections);
      break;

    case "connections:summary":
      console.log("=== SOCKET CONNECTIONS SUMMARY ===");
      console.log(
        `Front sockets       : ${Object.keys(connections.frontSockets).length}`
      );
      console.log(
        `DEM servers         : ${Object.keys(connections.demSockets).length}`
      );
      console.log(
        `Device Managers     : ${
          Object.keys(connections.deviceManagerSockets).length
        }`
      );
      console.log(
        `Devices             : ${Object.keys(connections.deviceSockets).length}`
      );
      console.log(
        `Devices connected   : ${
          Object.keys(connections.devicesConnected).length
        }`
      );
      console.log(
        `Devices on DM list  : ${connections.devicesOnDeviceManager.length}`
      );
      console.log(`Flushing mode       : ${connections.flushing}`);
      console.log("=================================");
      break;

    case "connections:list:dem":
      console.log("=== DEM SERVERS ===");
      for (const [id, data] of Object.entries(connections.demSockets)) {
        console.log(`DEM ID: ${id}`);
        console.log(`  Socket ID: ${data.socket.id}`);
        console.log(`  Server ID: ${data.server_id}`);
        console.log(`  Modules: ${data.modules?.length || 0}`);
      }
      break;

    case "connections:list:dm":
      console.log("=== DEVICE MANAGERS ===");
      for (const [ip, data] of Object.entries(
        connections.deviceManagerSockets
      )) {
        console.log(`IP: ${ip}`);
        console.log(`  Socket ID: ${data.socket.id}`);
        console.log(`  Manager ID: ${data.deviceManager?.id}`);
      }
      break;

    case "connections:list:devices":
      console.log("=== DEVICES CONNECTED ===");
      for (const [id, data] of Object.entries(connections.deviceSockets)) {
        const tag = data.device?.device_tag || "unknown";
        console.log(`Socket ID: ${id} | Device: ${tag}`);
      }
      break;

    case "connections:flush":
      connections.flushing = true;
      console.log("Flushing all connections...");
      for (const s of Object.values(connections.frontSockets))
        s.disconnect?.(true);
      for (const s of Object.values(connections.deviceSockets))
        s.socket?.disconnect?.(true);
      for (const s of Object.values(connections.demSockets))
        s.socket?.disconnect?.(true);
      for (const s of Object.values(connections.deviceManagerSockets))
        s.socket?.disconnect?.(true);

      connections.frontSockets = {};
      connections.deviceSockets = {};
      connections.demSockets = {};
      connections.deviceManagerSockets = {};
      connections.flushing = false;
      console.log("✅ All connections flushed.");
      break;

    case "connections:test":
      if (connections.getActivedemSocket()) {
        connections
          .getActivedemSocket()
          .emit("ping-test", { time: Date.now() }, (ack) => {
            console.log("ACK from DEM:", ack);
          });
      } else {
        console.log("❌ No active DEM socket found");
      }
      break;
    case "mdns:list":
      console.log("=== M-DNS DISCOVERED DEVICE MANAGERS ===");
      if (mdns.getDiscoveredDevices().length === 0) {
        console.log("📭 No Device Managers detected.");
      } else {
        for (const d of mdns.getDiscoveredDevices()) {
          console.log(
            `• ${d.name} (${d.ip}:${d.port}) | last seen ${Math.round(
              (Date.now() - d.lastSeen) / 1000
            )}s ago`
          );
        }
      }
      console.log("========================================");
      break;

    case "help":
      console.log(`
Available commands:
  test                        - Simple test
  connections                 - Raw dump of connections object
  connections:summary         - Summary of all socket states
  connections:list:dem        - List connected DEM servers
  connections:list:dm         - List connected Device Managers
  connections:list:devices    - List connected devices
  connections:flush           - Disconnect and clear all sockets
  connections:test            - Send test ping to active DEM
  mdns:list                 - Show Device Managers discovered via mDNS
  help                        - Show this menu
  `);
      break;

    default:
      console.log(`Unknown command: ${command}`);
      break;
  }
}

module.exports = handleCliCommand;
