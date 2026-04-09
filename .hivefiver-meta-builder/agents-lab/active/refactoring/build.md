---
name: build
description: the default primary agent with all tools enabled. This is the standard agent for development work where you need full access to file operations and system commands. 
mode: all
skill:
    "*": deny
    "hm-*": allow
---
