# Food Data Central MCP Server

This is a Model Context Protocol (MCP) server for exposing API access to
the [USDA's FoodData Central API](https://fdc.nal.usda.gov/api-guide).

## Features

- Search for foods in the USDA FoodData Central database
- Access food nutrient information
- Paginated results
- Support for multiple data types (Foundation, SR Legacy, Survey, Branded)

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:

   - Copy the `.env.template` file to `.env`:
     ```bash
     cp .env.template .env
     ```
   - Edit the `.env` file and add your USDA API key
   - You can get a USDA API key by registering at [https://fdc.nal.usda.gov/api-key-signup.html](https://fdc.nal.usda.gov/api-key-signup.html)

4. Build the project:
   ```bash
   npm run build
   ```

## Running the Server

The server uses stdio transport, which means it's designed to be run as a subprocess by an MCP client. To run it directly:

```bash
npm start
```

For development with hot reloading:

```bash
npm run dev
```

## Using with Claude Desktop

To use this MCP server with Claude Desktop:

1. Build the server:

   ```bash
   npm run build
   ```

2. Open the Claude Desktop settings:

   - On macOS: Click on the Claude menu and select "Settings..."
   - On Windows: Click on the Claude menu and select "Settings..."

3. In the Settings pane, click on "Developer" in the left-hand bar, and then click on "Edit Config"

4. This will create or open a configuration file at:

   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`

5. Add the Food Data Central MCP server to the configuration file:

   ```json
   {
     "mcpServers": {
       "food-data-central": {
         "command": "node",
         "args": ["/path/to/your/repo/dist/index.js"]
       }
     }
   }
   ```

   Replace `/path/to/your/repo` with the absolute path to this repository.

6. Since the server requires the USDA API key as an environment variable, you'll need to set it in your system environment or modify the server code to read from a configuration file.

7. Save the configuration file and restart Claude Desktop

8. After restarting, you should see a hammer icon in the bottom right corner of the input box. Click on it to see the available tools.

Now Claude will be able to access the Food Data Central API through this MCP server. You can ask Claude to search for foods, get nutrient information, or retrieve detailed food data.

## MCP Resources and Tools

### Resources

- `food://details` - Get detailed information about a specific food by ID

  - Query parameters:
    - `fdcId`: Food Data Central ID (required)
    - `format`: Optional. 'abridged' for an abridged set of elements, 'full' for all elements (default)
    - `nutrients`: Optional. List of up to 25 nutrient numbers (comma-separated)

- `food://foods` - Get details for multiple food items using input FDC IDs

  - Query parameters:
    - `fdcIds`: List of multiple FDC IDs (required, comma-separated)
    - `format`: Optional. 'abridged' for an abridged set of elements, 'full' for all elements (default)
    - `nutrients`: Optional. List of up to 25 nutrient numbers (comma-separated)

- `food://list` - Get a paged list of foods
  - Query parameters:
    - `dataType`: Optional. Filter on a specific data type (comma-separated list)
    - `pageSize`: Optional. Maximum number of results to return (default: 50)
    - `pageNumber`: Optional. Page number to retrieve (default: 1)
    - `sortBy`: Optional. Field to sort by
    - `sortOrder`: Optional. Sort order, "asc" or "desc"

### Tools

- `search-foods` - Search for foods using keywords
  - Parameters:
    - `query`: Search terms to find foods (required)
    - `dataType`: Optional. Filter on a specific data type (array of strings)
    - `pageSize`: Optional. Maximum number of results to return (default: 50)
    - `pageNumber`: Optional. Page number to retrieve (default: 1)
    - `sortBy`: Optional. Field to sort by
    - `sortOrder`: Optional. Sort order, "asc" or "desc"
    - `brandOwner`: Optional. Filter results based on the brand owner of the food (only for Branded Foods)
    - `tradeChannel`: Optional. Filter foods containing any of the specified trade channels
    - `startDate`: Optional. Filter foods published on or after this date (format: YYYY-MM-DD)
    - `endDate`: Optional. Filter foods published on or before this date (format: YYYY-MM-DD)

## Example Usage

Get food details using the MCP resource:

```
food://details?fdcId=2345678&format=full
```

Get multiple foods using the MCP resource:

```
food://foods?fdcIds=534358,373052,616350
```

Get a list of foods using the MCP resource:

```
food://list?dataType=Foundation,SR Legacy&pageSize=10&pageNumber=1
```

Search for foods using the MCP tool:

```json
{
  "name": "search-foods",
  "arguments": {
    "query": "apple",
    "dataType": ["Foundation", "SR Legacy"],
    "pageSize": 10,
    "pageNumber": 1
  }
}
```

## Using with MCP Clients

This server is designed to be used with MCP clients that can spawn subprocesses. The client should:

1. Build the server: `npm run build`
2. Spawn the server as a subprocess: `node dist/index.js`
3. Communicate with the server via stdin/stdout

For example, using the MCP TypeScript client:

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: "node",
  args: ["dist/index.js"],
});

const client = new Client(
  {
    name: "food-data-client",
    version: "1.0.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

await client.connect(transport);

// Now you can use the client to access resources and tools
const result = await client.callTool({
  name: "search-foods",
  arguments: {
    query: "apple",
    pageSize: 10,
  },
});
```
