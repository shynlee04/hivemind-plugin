/**
 * CliFormatter — A utility for consistent CLI output formatting.
 *
 * Provides a builder pattern for constructing lists, sections, and headers.
 * Simplifies tool output generation and ensures a unified look and feel.
 */
export class CliFormatter {
  private lines: string[] = [];
  private indentSize: number;

  constructor({ indentSize = 2 } = {}) {
    this.indentSize = indentSize;
  }

  /**
   * Adds a main header line, e.g., "=== TITLE ===" followed by an empty line.
   */
  header(title: string): this {
    this.lines.push(`=== ${title} ===`);
    this.lines.push("");
    return this;
  }

  /**
   * Adds a section header, e.g., "## Title".
   */
  section(title: string): this {
    this.lines.push(`## ${title}`);
    return this;
  }

  /**
   * Adds a single line of text with optional indentation level.
   * If text is empty, adds a blank line regardless of indentation.
   */
  line(text: string = "", level: number = 0): this {
    if (text === "") {
      this.lines.push("");
    } else {
      const prefix = " ".repeat(level * this.indentSize);
      this.lines.push(`${prefix}${text}`);
    }
    return this;
  }

  /**
   * Adds multiple lines from an array, all at the specified indentation level.
   */
  list(items: string[], level: number = 1): this {
    for (const item of items) {
      this.line(item, level);
    }
    return this;
  }

  /**
   * Adds a footer line, e.g., "=== END TITLE ===".
   */
  footer(title: string): this {
    this.lines.push(`=== ${title} ===`);
    return this;
  }

  /**
   * Returns the formatted string joined by newlines.
   */
  toString(): string {
    return this.lines.join("\n");
  }
}
