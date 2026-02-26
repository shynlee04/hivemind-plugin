/** @jsxImportSource @opentui/react */
import * as OpenTUIReact from "@opentui/react";
import type {} from "@opentui/react/jsx-runtime";
import { useState } from "react";

type KeyboardEventLike = {
  name: string;
};

const useKeyboard = (OpenTUIReact as unknown as {
  useKeyboard: (handler: (key: KeyboardEventLike) => void) => void;
}).useKeyboard;

// Color scheme - Cyberpunk/Terminal aesthetic (same as main app)
const COLORS = {
  bg: "#0d0d0d",
  panelBg: "#111111",
  border: "#333333",
  neonGreen: "#00ff41",
  neonAmber: "#ffb000",
  neonBlue: "#00f0ff",
  dimText: "#666666",
  text: "#cccccc",
  error: "#ff4444",
};

export interface InputModalProps {
  title: string;
  placeholder: string;
  submitLabel?: string;
  cancelLabel?: string;
  onSubmit: (value: string) => void | Promise<void>;
  onCancel: () => void;
  initialValue?: string;
}

export function InputModal({
  title,
  placeholder,
  submitLabel = "Submit",
  cancelLabel = "Cancel",
  onSubmit,
  onCancel,
  initialValue = "",
}: InputModalProps) {
  const [value, setValue] = useState(initialValue);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Calculate modal dimensions
  const modalWidth = 50;
  const modalHeight = 7;

  // Handle keyboard input - wait for Escape or Enter
  // Note: <input> component handles the actual text typing events
  useKeyboard(async (key) => {
    if (isSubmitting) return;

    if (key.name === "escape") {
      onCancel();
      return;
    }

    if ((key.name === "return" || key.name === "enter") && value.trim()) {
      setIsSubmitting(true);
      setError(null);
      try {
        await onSubmit(value.trim());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setIsSubmitting(false);
      }
    }
  });

  return (
    <box
      position="absolute"
      left="25%"
      top="30%"
      width={modalWidth}
      height={modalHeight}
      border
      borderStyle="double"
      borderColor={COLORS.neonGreen}
      backgroundColor={COLORS.panelBg}
      flexDirection="column"
      zIndex={100}
    >
      {/* Title bar */}
      <box
        border
        borderStyle="single"
        borderColor={COLORS.neonBlue}
        backgroundColor={COLORS.bg}
        paddingX={1}
        paddingY={0}
        marginBottom={1}
      >
        <text fg={COLORS.neonBlue}><strong>:: {title.toUpperCase()}</strong></text>
      </box>

      {/* Input field */}
      <box paddingX={1} paddingY={1}>
        <input
          value={value}
          onChange={(val: string) => {
            setValue(val);
            if (error) setError(null);
          }}
          placeholder={placeholder}
          focused={!isSubmitting}
          width={modalWidth - 4}
          backgroundColor={COLORS.bg}
          textColor={COLORS.text}
          cursorColor={COLORS.neonGreen}
          placeholderColor={COLORS.dimText}
        />
      </box>

      {/* Status/Error bar */}
      <box flexDirection="row" justifyContent="space-between" paddingX={1} paddingTop={1}>
        <box flexDirection="row">
          {error && <text fg={COLORS.error}>ERROR: {error}</text>}
          {isSubmitting && <text fg={COLORS.neonAmber}>SUBMITTING...</text>}
          {!error && !isSubmitting && <text> </text>}
        </box>
        <box flexDirection="row">
          <text fg={COLORS.dimText}>[Enter] {submitLabel}</text>
          <text fg={COLORS.dimText}> | </text>
          <text fg={COLORS.dimText}>[Esc] {cancelLabel}</text>
        </box>
      </box>
    </box>
  );
}
