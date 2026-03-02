const fs = require('fs');
const os = require('os');
const path = require('path');

function updateConfig(filePath) {
  if (!fs.existsSync(filePath)) return;
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  if (!data.mcp) data.mcp = {};
  
  // Disable these
  ['z-reader', 'web-reader', 'web-prime-search', 'web-search-prime', 'zread'].forEach(key => {
    if (data.mcp[key]) {
      data.mcp[key].enabled = false;
    } else {
      data.mcp[key] = { enabled: false };
    }
  });

  // Enable these
  ['repomix', 'context7', 'deepwiki'].forEach(key => {
    if (data.mcp[key]) {
      data.mcp[key].enabled = true;
    } else {
      data.mcp[key] = { enabled: true };
    }
  });
  
  // Update tavily
  data.mcp.tavily = {
    type: "remote",
    url: "https://mcp.tavily.com/mcp/?tavilyApiKey=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",
    enabled: true,
    timeout: 15000
  };

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log('Updated ' + filePath);
}

const globalConfig = path.join(os.homedir(), '.config', 'opencode', 'opencode.json');
const projectConfig = path.join(process.cwd(), 'opencode.json');
const worktreeConfig = path.join(process.cwd(), '.worktrees', 'framework-upgrade', 'opencode.json');

updateConfig(globalConfig);
updateConfig(projectConfig);
updateConfig(worktreeConfig);
