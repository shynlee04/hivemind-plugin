import { describe, expect, it } from "vitest"

import { createPtyBuffer } from "../../../src/features/background-command/pty/pty-buffer.js"

describe("createPtyBuffer", () => {
  it("returns exact incremental reads for appended content", () => {
    const buffer = createPtyBuffer(10)

    buffer.append("abc")
    expect(buffer.readSince(0)).toEqual({
      content: "abc",
      nextOffset: 3,
      truncated: false,
    })

    buffer.append("def")
    expect(buffer.readSince(3)).toEqual({
      content: "def",
      nextOffset: 6,
      truncated: false,
    })
    expect(buffer.snapshot()).toEqual({
      content: "abcdef",
      nextOffset: 6,
      truncated: false,
    })
  })

  it("truncates old content once the cap is exceeded", () => {
    const buffer = createPtyBuffer(5)

    buffer.append("abc")
    buffer.append("def")

    expect(buffer.readSince(0)).toEqual({
      content: "bcdef",
      nextOffset: 6,
      truncated: true,
    })
    expect(buffer.readSince(4)).toEqual({
      content: "ef",
      nextOffset: 6,
      truncated: true,
    })
    expect(buffer.snapshot()).toEqual({
      content: "bcdef",
      nextOffset: 6,
      truncated: true,
    })
  })

  it("readSince on empty buffer returns empty content with zero offset", () => {
    const buffer = createPtyBuffer(10)

    expect(buffer.readSince(0)).toEqual({
      content: "",
      nextOffset: 0,
      truncated: false,
    })
  })

  it("readSince with offset beyond nextOffset returns empty content", () => {
    const buffer = createPtyBuffer(10)

    buffer.append("abc")

    expect(buffer.readSince(100)).toEqual({
      content: "",
      nextOffset: 3,
      truncated: false,
    })
  })

  it("snapshot on empty buffer returns empty content", () => {
    const buffer = createPtyBuffer(10)

    expect(buffer.snapshot()).toEqual({
      content: "",
      nextOffset: 0,
      truncated: false,
    })
  })

  it("append with empty string does not change buffer", () => {
    const buffer = createPtyBuffer(10)

    buffer.append("abc")
    buffer.append("")
    buffer.append("")

    expect(buffer.snapshot()).toEqual({
      content: "abc",
      nextOffset: 3,
      truncated: false,
    })
    expect(buffer.readSince(0)).toEqual({
      content: "abc",
      nextOffset: 3,
      truncated: false,
    })
  })
})
