// src/utils/bin/network.ts

// Helper function to format JSON with syntax highlighting
const formatJSON = (obj: any): string => {
  const json = JSON.stringify(obj, null, 2);
  return json
    .replace(/"([^"]+)":/g, '<span style="color: #87CEEB">"$1"</span>:')
    .replace(/: "([^"]+)"/g, ': <span style="color: #98FB98">"$1"</span>')
    .replace(/: (\d+)/g, ': <span style="color: #FFB6C1">$1</span>')
    .replace(/: (true|false)/g, ': <span style="color: #DDA0DD">$1</span>')
    .replace(/: null/g, ': <span style="color: #F0E68C">null</span>');
};

// Helper function to format response headers
const formatHeaders = (headers: Headers): string => {
  const headerObj: Record<string, string> = {};
  headers.forEach((value, key) => {
    headerObj[key] = value;
  });
  return formatJSON(headerObj);
};

// Helper function to create delays with progress updates
const createProgressDelay = async (
  totalMs: number,
  steps: string[],
  onProgress?: (message: string) => void
): Promise<void> => {
  if (!onProgress) {
    await new Promise(resolve => setTimeout(resolve, totalMs));
    return;
  }

  const stepDelay = totalMs / steps.length;
  
  for (const step of steps) {
    onProgress(step);
    await new Promise(resolve => setTimeout(resolve, stepDelay));
  }
};

// Progress callback interface
interface ProgressCallback {
  (message: string): void;
}

export const curl = async (args: string[], onProgress?: ProgressCallback): Promise<string> => {
  if (args.length === 0) {
    return `curl: try 'curl --help' for more information
Usage: curl [options] <url>

Common options:
  -H "Header: Value"    Add custom header
  -X POST              HTTP method
  -d "data"            POST data
  -i                   Include response headers
  -s                   Silent mode
  -w                   Show timing info

Examples:
  curl https://api.github.com/users/octocat
  curl -H "Accept: application/json" https://httpbin.org/get
  curl -X POST -d '{"name":"test"}' https://httpbin.org/post`;
  }

  const includeHeaders = args.includes('-i');
  const silent = args.includes('-s');
  const showTiming = args.includes('-w');
  
  // Parse custom headers
  const customHeaders: Record<string, string> = {};
  let i = 0;
  while (i < args.length) {
    if (args[i] === '-H' && i + 1 < args.length) {
      const header = args[i + 1];
      const [key, ...valueParts] = header.split(':');
      if (key && valueParts.length > 0) {
        customHeaders[key.trim()] = valueParts.join(':').trim();
      }
      args.splice(i, 2);
    } else {
      i++;
    }
  }

  // Parse method
  let method = 'GET';
  const methodIndex = args.indexOf('-X');
  if (methodIndex !== -1 && methodIndex + 1 < args.length) {
    method = args[methodIndex + 1];
    args.splice(methodIndex, 2);
  }

  // Parse data
  let data: string | undefined;
  const dataIndex = args.indexOf('-d');
  if (dataIndex !== -1 && dataIndex + 1 < args.length) {
    data = args[dataIndex + 1];
    args.splice(dataIndex, 2);
    if (method === 'GET') method = 'POST';
  }

  // Get URL (should be the last remaining argument)
  const url = args.filter(arg => !arg.startsWith('-')).pop();
  
  if (!url) {
    return 'curl: no URL specified';
  }

  // Progress steps
  if (!silent) {
    await createProgressDelay(400, [
      'Resolving hostname...',
      'Connecting to server...',
      'Sending request...'
    ], onProgress);
  }

  try {
    const startTime = Date.now();
    
    const headers = new Headers({
      'User-Agent': 'curl/7.68.0',
      ...customHeaders
    });

    if (data && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    if (onProgress && !silent) {
      onProgress('Waiting for response...');
    }

    const response = await fetch(url, {
      method,
      headers,
      body: data,
    });

    if (onProgress && !silent) {
      onProgress(`Response received (${response.status})`);
    }

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    let result = '';

    if (includeHeaders) {
      result += `HTTP/${response.status} ${response.statusText}\n`;
      result += formatHeaders(response.headers) + '\n\n';
    }

    const contentType = response.headers.get('content-type') || '';
    
    if (onProgress && !silent) {
      onProgress('Processing response data...');
    }
    
    if (contentType.includes('application/json')) {
      const jsonData = await response.json();
      result += formatJSON(jsonData);
    } else {
      const textData = await response.text();
      result += textData;
    }

    if (showTiming) {
      result += `\n\n<span style="color: #87CEEB">Timing info:</span>
  Response time: <span style="color: #98FB98">${responseTime}ms</span>
  Status: <span style="color: #FFB6C1">${response.status}</span>
  Size: <span style="color: #DDA0DD">${result.length} bytes</span>`;
    }

    return result;

  } catch (error) {
    return `curl: (6) Could not resolve host: ${url}\n${error.message}`;
  }
};

export const fetch_api = async (args: string[], onProgress?: ProgressCallback): Promise<string> => {
  if (args.length === 0) {
    return `fetch: missing URL
Usage: fetch <url> [options]

Options:
  --method GET|POST|PUT|DELETE    HTTP method (default: GET)
  --headers '{"key":"value"}'     Custom headers as JSON
  --data '{"key":"value"}'        Request body as JSON

Examples:
  fetch https://api.github.com/users/octocat
  fetch https://httpbin.org/post --method POST --data '{"test":"data"}'`;
  }

  const url = args[0];
  let method = 'GET';
  let customHeaders = {};
  let data: any = null;

  await createProgressDelay(200, [
    'Parsing arguments...',
    'Validating parameters...'
  ], onProgress);

  // Parse options
  for (let i = 1; i < args.length; i += 2) {
    const option = args[i];
    const value = args[i + 1];

    switch (option) {
      case '--method':
        method = value?.toUpperCase() || 'GET';
        break;
      case '--headers':
        try {
          customHeaders = JSON.parse(value || '{}');
        } catch {
          return 'fetch: invalid JSON in --headers';
        }
        break;
      case '--data':
        try {
          data = JSON.parse(value || '{}');
          if (method === 'GET') method = 'POST';
        } catch {
          return 'fetch: invalid JSON in --data';
        }
        break;
    }
  }

  await createProgressDelay(300, [
    `Preparing ${method} request...`,
    'Building headers...',
    'Connecting to server...'
  ], onProgress);

  try {
    const startTime = Date.now();
    
    const headers = new Headers({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...customHeaders
    });

    if (onProgress) {
      onProgress('Sending request...');
    }

    const response = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    if (onProgress) {
      onProgress(`Processing response (${response.status})...`);
    }

    const endTime = Date.now();
    const responseData = await response.json();

    const result = {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      data: responseData,
      timing: {
        responseTime: `${endTime - startTime}ms`,
        timestamp: new Date().toISOString()
      }
    };

    return formatJSON(result);

  } catch (error) {
    return `fetch: Error - ${error.message}`;
  }
};

export const wget = async (args: string[], onProgress?: ProgressCallback): Promise<string> => {
  if (args.length === 0) {
    return `wget: missing URL
Usage: wget <url> [options]

Options:
  -O <filename>    Save as filename
  -q              Quiet mode

Examples:
  wget https://api.github.com/users/octocat
  wget https://httpbin.org/json -O data.json`;
  }

  const quiet = args.includes('-q');
  let filename: string | undefined;
  let url: string;

  // Parse arguments
  const oIndex = args.indexOf('-O');
  if (oIndex !== -1 && oIndex + 1 < args.length) {
    filename = args[oIndex + 1];
    args.splice(oIndex, 2);
  }

  url = args.filter(arg => !arg.startsWith('-')).pop() || '';

  if (!url) {
    return 'wget: no URL specified';
  }

  // Extract filename from URL if not specified
  if (!filename) {
    const urlParts = url.split('/');
    filename = urlParts[urlParts.length - 1] || 'index.html';
    if (!filename.includes('.')) {
      filename += '.html';
    }
  }

  if (!quiet) {
    await createProgressDelay(500, [
      `Resolving ${url}...`,
      `Connecting to ${new URL(url).hostname}...`,
      'Downloading...'
    ], onProgress);
  }

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      return `wget: ERROR ${response.status}: ${response.statusText}`;
    }

    if (onProgress && !quiet) {
      onProgress('Reading response data...');
    }

    const content = await response.text();
    
    // Import filesystem functions dynamically to avoid circular dependencies
    const { getFileSystem, saveFileSystem, normalizePath, pathExists, isDirectory } = await import('./filesystem');
    
    const fs = getFileSystem();
    const targetPath = normalizePath(filename);

    // Check if parent directory exists
    const parentPath = targetPath.substring(0, targetPath.lastIndexOf('/')) || '/';
    if (!pathExists(fs, parentPath)) {
      return `wget: ${filename}: No such file or directory`;
    }

    if (pathExists(fs, targetPath) && isDirectory(fs, targetPath)) {
      return `wget: ${filename}: Is a directory`;
    }

    if (onProgress && !quiet) {
      onProgress(`Saving to ${filename}...`);
    }

    // Save file
    fs[targetPath] = {
      type: 'file',
      content: content,
      created: new Date(),
      modified: new Date()
    };

    saveFileSystem(fs);

    const size = content.length;

    return quiet ? '' : `<span style="color: #98FB98">'${filename}' saved [${size} bytes]</span>`;

  } catch (error) {
    return `wget: unable to resolve host address '${url}'\n${error.message}`;
  }
};

export const ping = async (args: string[], onProgress?: ProgressCallback): Promise<string> => {
  if (args.length === 0) {
    return `ping: usage error: Destination address required
Usage: ping <hostname>

Examples:
  ping google.com
  ping github.com`;
  }

  const host = args[0];
  const count = 4; // Default ping count

  if (onProgress) {
    onProgress(`PING ${host} (simulation starting...)`);
  }

  let result = `<span style="color: #87CEEB">PING ${host} (simulated): 56 data bytes</span>\n`;

  for (let i = 0; i < count; i++) {
    if (onProgress) {
      onProgress(`Ping ${i + 1}/${count}: Sending ICMP packet to ${host}...`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay between pings
    
    const time = (Math.random() * 50 + 10).toFixed(1); // Random time between 10-60ms
    const success = Math.random() > 0.1; // 90% success rate

    if (success) {
      const pingResult = `64 bytes from ${host}: icmp_seq=${i + 1} time=${time}ms`;
      result += `<span style="color: #98FB98">${pingResult}</span>\n`;
      if (onProgress) {
        onProgress(`Ping ${i + 1}: Reply from ${host} (${time}ms)`);
      }
    } else {
      const timeoutResult = `Request timeout for icmp_seq ${i + 1}`;
      result += `<span style="color: #FFB6C1">${timeoutResult}</span>\n`;
      if (onProgress) {
        onProgress(`Ping ${i + 1}: Timeout (no reply)`);
      }
    }
  }

  if (onProgress) {
    onProgress('Calculating statistics...');
  }

  result += `\n<span style="color: #DDA0DD">--- ${host} ping statistics ---</span>\n`;
  result += `<span style="color: #F0E68C">${count} packets transmitted, ${count - 1} received, 25% packet loss</span>`;

  return result;
};

export const whois = async (args: string[], onProgress?: ProgressCallback): Promise<string> => {
  if (args.length === 0) {
    return `whois: missing domain
Usage: whois <domain>

Examples:
  whois google.com
  whois github.com`;
  }

  const domain = args[0].replace(/^https?:\/\//, '').replace(/\/.*$/, '');

  await createProgressDelay(800, [
    `Looking up whois information for ${domain}...`,
    'Connecting to whois server...',
    'Querying domain registration data...',
    'Processing whois response...'
  ], onProgress);

  // Simulate whois data (since we can't actually do real whois lookups from browser)
  const whoisData = {
    domain: domain,
    registrar: "Simulated Registrar Inc.",
    registrationDate: "2010-03-15T00:00:00Z",
    expirationDate: "2025-03-15T00:00:00Z",
    nameServers: [
      "ns1.example.com",
      "ns2.example.com"
    ],
    status: "clientTransferProhibited",
    registrant: {
      organization: "Example Organization",
      country: "US"
    },
    dnssec: "unsigned",
    lastUpdated: new Date().toISOString()
  };

  let result = `<span style="color: #87CEEB">Domain Name:</span> <span style="color: #98FB98">${domain.toUpperCase()}</span>\n`;
  result += `<span style="color: #87CEEB">Registry Domain ID:</span> <span style="color: #FFB6C1">SIM123456789</span>\n`;
  result += `<span style="color: #87CEEB">Registrar:</span> <span style="color: #98FB98">${whoisData.registrar}</span>\n`;
  result += `<span style="color: #87CEEB">Registration Date:</span> <span style="color: #DDA0DD">${whoisData.registrationDate}</span>\n`;
  result += `<span style="color: #87CEEB">Expiration Date:</span> <span style="color: #DDA0DD">${whoisData.expirationDate}</span>\n`;
  result += `<span style="color: #87CEEB">Domain Status:</span> <span style="color: #F0E68C">${whoisData.status}</span>\n`;
  result += `<span style="color: #87CEEB">Name Servers:</span>\n`;
  whoisData.nameServers.forEach(ns => {
    result += `    <span style="color: #98FB98">${ns}</span>\n`;
  });
  result += `<span style="color: #87CEEB">DNSSEC:</span> <span style="color: #FFB6C1">${whoisData.dnssec}</span>\n`;
  result += `<span style="color: #87CEEB">Last Updated:</span> <span style="color: #DDA0DD">${whoisData.lastUpdated}</span>\n`;
  result += `\n<span style="color: #F0E68C">Note: This is simulated whois data for demonstration purposes.</span>`;

  return result;
};

export const nslookup = async (args: string[], onProgress?: ProgressCallback): Promise<string> => {
  if (args.length === 0) {
    return `nslookup: missing domain
Usage: nslookup <domain>

Examples:
  nslookup google.com
  nslookup github.com`;
  }

  const domain = args[0].replace(/^https?:\/\//, '').replace(/\/.*$/, '');

  await createProgressDelay(400, [
    `Looking up DNS records for ${domain}...`,
    'Connecting to DNS server (8.8.8.8)...',
    'Querying A records...',
    'Processing DNS response...'
  ], onProgress);

  try {
    // We can't do real DNS lookups from the browser, so we'll simulate it
    // In a real implementation, you might use a DNS-over-HTTPS service
    
    const simulatedIPs = [
      `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
      `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`
    ];

    if (onProgress) {
      onProgress(`Found ${simulatedIPs.length} IP addresses`);
    }

    let result = `<span style="color: #87CEEB">Server:</span>    <span style="color: #98FB98">8.8.8.8</span>\n`;
    result += `<span style="color: #87CEEB">Address:</span>   <span style="color: #98FB98">8.8.8.8#53</span>\n\n`;
    result += `<span style="color: #DDA0DD">Non-authoritative answer:</span>\n`;
    result += `<span style="color: #87CEEB">Name:</span>   <span style="color: #F0E68C">${domain}</span>\n`;
    
    simulatedIPs.forEach(ip => {
      result += `<span style="color: #87CEEB">Address:</span> <span style="color: #FFB6C1">${ip}</span>\n`;
    });

    result += `\n<span style="color: #F0E68C">Note: These are simulated IP addresses for demonstration purposes.</span>`;

    return result;

  } catch (error) {
    return `nslookup: can't resolve '${domain}': ${error.message}`;
  }
};