"use client"

import { useCallback } from "react"
import { useSN } from "./sn-context"

// Common service UUIDs that might contain device identification info
const COMMON_SN_SERVICES = [
  "0000180a-0000-1000-8000-00805f9b34fb", // Device Information
  "00001800-0000-1000-8000-00805f9b34fb", // Generic Access (device name)
]

const COMMON_SN_CHARS = [
  "00002a25-0000-1000-8000-00805f9b34fb", // Serial Number String (standard)
  "00002a24-0000-1000-8000-00805f9b34fb", // Model Number String
  "00002a29-0000-1000-8000-00805f9b34fb", // Manufacturer Name String
  "00002a00-0000-1000-8000-00805f9b34fb", // Device Name
]

const SN_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,63}$/

function tryDecodeSN(value: DataView): string | null {
  // Prefer UTF-8
  try {
    const decoded = new TextDecoder("utf-8").decode(value)
    const trimmed = decoded.replace(/\0/g, "").trim()
    if (trimmed && SN_REGEX.test(trimmed)) return trimmed
  } catch {}

  // Fallback to ASCII
  try {
    const decoded = new TextDecoder("ascii").decode(value)
    const trimmed = decoded.replace(/\0/g, "").trim()
    if (trimmed && SN_REGEX.test(trimmed)) return trimmed
  } catch {}

  return null
}

export function useBle() {
  const { setDeviceSN, setIsConnected } = useSN()

  const connect = useCallback(async () => {
    if (!navigator.bluetooth) {
      throw new Error(
        "此浏览器不支持蓝牙。\n" +
        "• Android: 请使用 Chrome 浏览器\n" +
        "• iPhone: Safari 不支持蓝牙，请手动输入设备 SN\n" +
        "• PC: 请使用 Chrome 或 Edge"
      )
    }

    let device: BluetoothDevice

    try {
      // Step 1: scan all nearby BLE devices (no UUID filter)
      // Android Chrome requires Location Services to be enabled for BLE scanning
      device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
      })
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("User cancelled")) {
        throw new Error("用户取消了蓝牙配对")
      }
      throw err
    }

    try {
      const server = await device.gatt?.connect()
      if (!server) throw new Error("无法连接设备 GATT 服务")

      // Step 2: try known SN characteristics first
      for (const svcUuid of COMMON_SN_SERVICES) {
        try {
          const service = await server.getPrimaryService(svcUuid)
          for (const charUuid of COMMON_SN_CHARS) {
            try {
              const char = await service.getCharacteristic(charUuid)
              const value = await char.readValue()
              const sn = tryDecodeSN(value)
              if (sn) {
                return finalizeConnection(device, sn)
              }
            } catch {}
          }
        } catch {}
      }

      // Step 3: iterate ALL services and characteristics as last resort
      const services = await server.getPrimaryServices()
      for (const service of services) {
        try {
          const chars = await service.getCharacteristics()
          for (const char of chars) {
            try {
              if (!char.properties.read) continue
              const value = await char.readValue()
              // Only try small values (SNs are short strings)
              if (value.byteLength > 128) continue
              const sn = tryDecodeSN(value)
              if (sn) {
                return finalizeConnection(device, sn)
              }
            } catch {}
          }
        } catch {}
      }

      // Step 4: try device name as fallback
      if (device.name && SN_REGEX.test(device.name.trim())) {
        return finalizeConnection(device, device.name.trim())
      }

      throw new Error(
        "已连接设备但无法读取 SN。\n\n" +
        "Android 用户请注意：\n" +
        "• 确保手机已开启「位置信息」\n" +
        "• 确保 MCU 已上电且蓝牙在广播\n\n" +
        "如仍无法读取，建议用 nRF Connect App 扫描设备，查看实际的 GATT 服务 UUID。"
      )
    } catch (err: unknown) {
      if (err instanceof Error && err.message.startsWith("已连接设备")) {
        throw err
      }
      throw new Error(`连接 MCU 失败: ${err instanceof Error ? err.message : "未知错误"}`)
    }
  }, [setDeviceSN, setIsConnected])

  function finalizeConnection(device: BluetoothDevice, sn: string) {
    const trimmed = sn.trim()
    setDeviceSN(trimmed)
    setIsConnected(true)

    device.addEventListener("gattserverdisconnected", () => {
      setIsConnected(false)
    })

    return trimmed
  }

  return { connect }
}
