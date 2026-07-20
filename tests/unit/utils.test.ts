import { describe, it, expect } from "vitest";
import { formatFileSize, countLines, isBinaryFile } from "../../src/utils/file.js";

describe("formatFileSize", () => {
  it("formats bytes", () => {
    expect(formatFileSize(500)).toBe("500.00 B");
  });

  it("formats kilobytes", () => {
    expect(formatFileSize(2048)).toBe("2.00 KB");
  });

  it("formats megabytes", () => {
    expect(formatFileSize(2_097_152)).toBe("2.00 MB");
  });

  it("formats gigabytes", () => {
    expect(formatFileSize(2_147_483_648)).toBe("2.00 GB");
  });

  it("handles zero", () => {
    expect(formatFileSize(0)).toBe("0.00 B");
  });

  it("formats decimal values", () => {
    const result = formatFileSize(1536);
    expect(result).toBe("1.50 KB");
  });
});

describe("countLines", () => {
  it("counts lines in a string", () => {
    expect(countLines("line1\nline2\nline3")).toBe(3);
  });

  it("handles empty string", () => {
    expect(countLines("")).toBe(0);
  });

  it("handles single line", () => {
    expect(countLines("only one line")).toBe(1);
  });

  it("handles trailing newline", () => {
    expect(countLines("line1\nline2\n")).toBe(3);
  });
});

describe("isBinaryFile", () => {
  it("identifies PNG as binary", () => {
    expect(isBinaryFile("image.png")).toBe(true);
  });

  it("identifies JPG as binary", () => {
    expect(isBinaryFile("photo.jpg")).toBe(true);
  });

  it("identifies JS as non-binary", () => {
    expect(isBinaryFile("file.js")).toBe(false);
  });

  it("identifies TS as non-binary", () => {
    expect(isBinaryFile("file.ts")).toBe(false);
  });

  it("is case insensitive", () => {
    expect(isBinaryFile("image.PNG")).toBe(true);
  });

  it("handles no extension", () => {
    expect(isBinaryFile("Makefile")).toBe(false);
  });
});
