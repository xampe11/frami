// src/lib/rainbowkit-theme.ts
import { Theme } from "@rainbow-me/rainbowkit";

export const customTheme: Theme = {
  blurs: {
    modalOverlay: "blur(4px)",
  },
  colors: {
    accentColor: "#8A63D2",
    accentColorForeground: "#ffffff",
    actionButtonBorder: "rgba(138, 99, 210, 0.2)",
    actionButtonBorderMobile: "rgba(138, 99, 210, 0.2)",
    actionButtonSecondaryBackground: "rgba(138, 99, 210, 0.1)",
    closeButton: "#64748b",
    closeButtonBackground: "rgba(100, 116, 139, 0.1)",
    connectButtonBackground: "#ffffff",
    connectButtonBackgroundError: "#ef4444",
    connectButtonInnerBackground:
      "linear-gradient(90deg, #8A63D2 0%, #9376FF 100%)",
    connectButtonText: "#ffffff",
    connectButtonTextError: "#ffffff",
    connectionIndicator: "#10b981",
    downloadBottomCardBackground:
      "linear-gradient(126deg, rgba(138, 99, 210, 0.1) 9.49%, rgba(147, 118, 255, 0.1) 71.04%)",
    downloadTopCardBackground:
      "linear-gradient(126deg, rgba(138, 99, 210, 0.15) 9.49%, rgba(147, 118, 255, 0.15) 71.04%)",
    error: "#ef4444",
    generalBorder: "rgba(138, 99, 210, 0.2)",
    generalBorderDim: "rgba(138, 99, 210, 0.1)",
    menuItemBackground: "rgba(138, 99, 210, 0.05)",
    modalBackdrop: "rgba(0, 0, 0, 0.6)",
    modalBackground: "#ffffff",
    modalBorder: "rgba(138, 99, 210, 0.2)",
    modalText: "#1f2937",
    modalTextDim: "#6b7280",
    modalTextSecondary: "#6b7280",
    profileAction: "rgba(138, 99, 210, 0.1)",
    profileActionHover: "rgba(138, 99, 210, 0.2)",
    profileForeground: "#ffffff",
    selectedOptionBorder: "#8A63D2",
    standby: "#fbbf24",
  },
  fonts: {
    body: "Inter, system-ui, sans-serif",
  },
  radii: {
    actionButton: "8px",
    connectButton: "8px",
    menuButton: "8px",
    modal: "12px",
    modalMobile: "12px",
  },
  shadows: {
    connectButton: "0 4px 12px rgba(138, 99, 210, 0.25)",
    dialog:
      "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    profileDetailsAction: "0 2px 4px rgba(138, 99, 210, 0.1)",
    selectedOption: "0 4px 12px rgba(138, 99, 210, 0.2)",
    selectedWallet: "0 4px 12px rgba(138, 99, 210, 0.2)",
    walletLogo: "0 2px 8px rgba(138, 99, 210, 0.15)",
  },
};

export const customDarkTheme: Theme = {
  ...customTheme,
  colors: {
    ...customTheme.colors,
    actionButtonSecondaryBackground: "rgba(138, 99, 210, 0.15)",
    closeButton: "#94a3b8",
    closeButtonBackground: "rgba(148, 163, 184, 0.1)",
    connectButtonBackground: "#1f2937",
    downloadBottomCardBackground:
      "linear-gradient(126deg, rgba(138, 99, 210, 0.15) 9.49%, rgba(147, 118, 255, 0.15) 71.04%)",
    downloadTopCardBackground:
      "linear-gradient(126deg, rgba(138, 99, 210, 0.2) 9.49%, rgba(147, 118, 255, 0.2) 71.04%)",
    generalBorder: "rgba(138, 99, 210, 0.3)",
    generalBorderDim: "rgba(138, 99, 210, 0.15)",
    menuItemBackground: "rgba(138, 99, 210, 0.1)",
    modalBackdrop: "rgba(0, 0, 0, 0.8)",
    modalBackground: "#111827",
    modalBorder: "rgba(138, 99, 210, 0.3)",
    modalText: "#f9fafb",
    modalTextDim: "#d1d5db",
    modalTextSecondary: "#9ca3af",
    profileAction: "rgba(138, 99, 210, 0.15)",
    profileActionHover: "rgba(138, 99, 210, 0.25)",
    profileForeground: "#111827",
  },
};
