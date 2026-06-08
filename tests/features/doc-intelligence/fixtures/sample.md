---
title: Sample Document
author: Test
---

# Sample Document

This is the introduction paragraph.

## Installation

To install, run the following command:

```
npm install my-package
```

Follow the setup guide in the next section.

## Usage

Here is how to use the package:

```typescript
import { myFunction } from "my-package"
const result = myFunction("input")
console.log(result)
```

### Advanced Usage

For advanced scenarios, configure the options:

```typescript
const config = { verbose: true, timeout: 5000 }
const result = myFunction("input", config)
```

## API Reference

### myFunction

The main function for processing input.

**Parameters:**
- input: string - The input to process
- options: object - Optional configuration

**Returns:** Promise<Result>
