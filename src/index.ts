require('dotenv').config();

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import axios from "axios";
import {
  SearchResponse,
  FoodDetailResponse,
} from "./types/food-data-central";

// Get API key from environment variable
const USDA_API_KEY = process.env.USDA_API_KEY;
const BASE_URL = "https://api.nal.usda.gov/fdc/v1";

// Check if API key is available
if (!USDA_API_KEY) {
  console.error("Error: USDA_API_KEY environment variable is not set");
  process.exit(1);
}

const server = new McpServer({
  name: "Food Data Central",
  version: "1.0.0",
  description: "Access USDA's FoodData Central database through MCP",
});

// Resource to get food details by ID
server.resource("food-details", "food://details", async (uri: URL) => {
  const params = new URLSearchParams(uri.search);
  const fdcId = params.get("fdcId");
  const format = params.get("format") || "full";
  const nutrients = params.get("nutrients");

  if (!fdcId) {
    throw new Error("fdcId parameter is required");
  }

  try {
    /*
     * OpenAPI Spec:
     * '/v1/food/{fdcId}':
     *   get:
     *     tags:
     *       - FDC
     *     summary: Fetches details for one food item by FDC ID
     *     description:  Retrieves a single food item by an FDC ID. Optional format and nutrients can be specified.
     *     parameters:
     *       - in: path
     *         name: fdcId
     *         description: FDC id of the food to retrieve
     *         required: true
     *         schema:
     *          type: string
     *       - in: query
     *         name: format
     *         description: Optional. 'abridged' for an abridged set of elements, 'full' for all elements (default).
     *         required: false
     *         schema:
     *           type: string
     *           enum: [abridged, full]
     *       - in: query
     *         name: nutrients
     *         description: Optional. List of up to 25 nutrient numbers. Only the nutrient information for the specified nutrients will be returned. Should be comma separated list (e.g. nutrients=203,204) or repeating parameters (e.g. nutrients=203&nutrients=204). If a food does not have any matching nutrients, the food will be returned with an empty foodNutrients element.
     */
    const response = await axios.get<FoodDetailResponse>(
      `${BASE_URL}/food/${fdcId}`,
      {
        params: {
          api_key: USDA_API_KEY,
          format,
          ...(nutrients ? { nutrients } : {}),
        },
      }
    );

    return {
      contents: [
        {
          uri: uri.href,
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  } catch (error) {
    console.error("Error fetching food details:", error);
    throw error;
  }
});

// Resource to get multiple foods by IDs
server.resource("foods", "food://foods", async (uri: URL) => {
  const params = new URLSearchParams(uri.search);
  const fdcIds = params.get("fdcIds");
  const format = params.get("format") || "full";
  const nutrients = params.get("nutrients");

  if (!fdcIds) {
    throw new Error("fdcIds parameter is required");
  }

  try {
    /*
     * OpenAPI Spec:
     * '/v1/foods':
     *   get:
     *     tags:
     *       - FDC
     *     summary: Fetches details for multiple food items using input FDC IDs
     *     description:  Retrieves a list of food items by a list of up to 20 FDC IDs. Optional format and nutrients can be specified. Invalid FDC ID's or ones that are not found are omitted and an empty set is returned if there are no matches.
     *     parameters:
     *       - in: query
     *         name: fdcIds
     *         required: true
     *         description: List of multiple FDC ID's. Should be comma separated list (e.g. fdcIds=534358,373052) or repeating parameters (e.g. fdcIds=534358&fdcIds=373052).
     *         schema:
     *           type: array
     *           minItems: 1
     *           maxItems: 20
     *           items:
     *             type: string
     *             example: [534358,373052,616350]
     *       - in: query
     *         name: format
     *         description: Optional. 'abridged' for an abridged set of elements, 'full' for all elements (default).
     *         required: false
     *         schema:
     *           type: string
     *           enum: [abridged, full]
     *       - in: query
     *         name: nutrients
     *         description: Optional. List of up to 25 nutrient numbers. Only the nutrient information for the specified nutrients will be returned. Should be comma separated list (e.g. nutrients=203,204) or repeating parameters (e.g. nutrients=203&nutrients=204). If a food does not have any matching nutrients, the food will be returned with an empty foodNutrients element.
     *         schema:
     *           type: array
     *           minItems: 1
     *           maxItems: 25
     *           items:
     *               type: integer
     *           example: [203, 204, 205]
     */
    const response = await axios.get<FoodDetailResponse[]>(
      `${BASE_URL}/foods`,
      {
        params: {
          api_key: USDA_API_KEY,
          fdcIds,
          format,
          ...(nutrients ? { nutrients } : {}),
        },
      }
    );

    return {
      contents: [
        {
          uri: uri.href,
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  } catch (error) {
    console.error("Error fetching foods:", error);
    throw error;
  }
});

// Resource to get food list
server.resource("food-list", "food://list", async (uri: URL) => {
  const params = new URLSearchParams(uri.search);
  const dataType = params.get("dataType");
  const pageSize = params.get("pageSize") || "50";
  const pageNumber = params.get("pageNumber") || "1";
  const sortBy = params.get("sortBy");
  const sortOrder = params.get("sortOrder");

  try {
    /*
     * OpenAPI Spec:
     * '/v1/foods/list':
     *   get:
     *     tags:
     *       - FDC
     *     summary: Returns a paged list of foods, in the 'abridged' format
     *     description:  Retrieves a paged list of foods. Use the pageNumber parameter to page through the entire result set.
     *     parameters:
     *       - in: query
     *         name: dataType
     *         description: Optional. Filter on a specific data type; specify one or more values in an array.
     *         schema:
     *           type: array
     *           items:
     *             type: string
     *             enum:
     *               - Branded
     *               - Foundation
     *               - Survey (FNDDS)
     *               - SR Legacy
     *           minItems: 1
     *           maxItems: 4
     *         explode: false
     *         style: form
     *         example: ["Foundation","SR Legacy"]
     *       - in: query
     *         name: pageSize
     *         description: Optional. Maximum number of results to return for the current page. Default is 50.
     *         schema:
     *           type: integer
     *           minimum: 1
     *           maximum: 200
     *         example: 25
     *       - in: query
     *         name: pageNumber
     *         description: Optional. Page number to retrieve. The offset into the overall result set is expressed as (pageNumber * pageSize)
     *         schema:
     *           type: integer
     *         example: 2
     *       - in: query
     *         name: sortBy
     *         description: Optional. Specify one of the possible values to sort by that field. Note, dataType.keyword will be dataType and lowercaseDescription.keyword will be description in future releases.
     *         schema:
     *           type: string
     *           enum:
     *             - dataType.keyword
     *             - lowercaseDescription.keyword
     *             - fdcId
     *             - publishedDate
     *       - in: query
     *         name: sortOrder
     *         description: Optional. The sort direction for the results. Only applicable if sortBy is specified.
     *         schema:
     *           type: string
     *           enum:
     *             - asc
     *             - desc
     */
    const response = await axios.get(`${BASE_URL}/foods/list`, {
      params: {
        api_key: USDA_API_KEY,
        ...(dataType ? { dataType } : {}),
        pageSize,
        pageNumber,
        ...(sortBy ? { sortBy } : {}),
        ...(sortOrder ? { sortOrder } : {}),
      },
    });

    return {
      contents: [
        {
          uri: uri.href,
          text: JSON.stringify(response.data, null, 2),
        },
      ],
    };
  } catch (error) {
    console.error("Error fetching food list:", error);
    throw error;
  }
});

const searchFoodsInputSchema = z.object({
  query: z.string().describe("Search query for foods"),
  dataType: z
    .array(
      z.enum([
        "Branded",
        "Foundation",
        "SR Legacy",
        "Survey (FNDDS)",
        "Experimental",
      ])
    )
    .optional()
    .describe(
      "Optional. Filter on a specific data type; specify one or more values in an array."
    ),
  pageSize: z
    .number()
    .int()
    .min(1)
    .max(200)
    .optional()
    .default(50)
    .describe(
      "Optional. Maximum number of results to return for the current page. Default is 50."
    ),
  pageNumber: z
    .number()
    .int()
    .min(1)
    .optional()
    .default(1)
    .describe(
      "Optional. Page number to retrieve. The offset into the overall result set is expressed as (pageNumber * pageSize)"
    ),
  sortBy: z
    .enum(["dataType.keyword", "lowercaseDescription.keyword", "fdcId", "publishedDate"])
    .optional()
    .describe(
      "Optional. Specify one of the possible values to sort by that field."
    ),
  sortOrder: z.enum(["asc", "desc"]).optional().describe("Optional. The sort direction for the results. Only applicable if sortBy is specified."),
  brandOwner: z.string().optional().describe("Optional. Filter results based on the brand owner of the food. Only applies to Branded Foods"),
  tradeChannel: z
    .array(z.enum(["CHILD_NUTRITION_FOOD_PROGRAMS", "DRUG", "FOOD_SERVICE", "GROCERY", "MASS_MERCHANDISING", "MILITARY", "ONLINE", "VENDING"]))
    .min(1)
    .max(3)
    .optional()
    .describe("Optional. Filter foods containing any of the specified trade channels."),
  startDate: z.string().optional().describe("Optional. Filter foods published on or after this date. Format: YYYY-MM-DD"),
  endDate: z.string().optional().describe("Optional. Filter foods published on or before this date. Format: YYYY-MM-DD"),
}).describe("Input schema for the search-foods tool");

type SearchFoodsInput = z.infer<typeof searchFoodsInputSchema>;

// Plain object to satisfy SDK's type for the schema argument
const sdkSchemaArg = {
  title: searchFoodsInputSchema._def.description || "Tool for searching foods",
  // Adding a property to make it clear this is a plain object for SDK's type system
  _sdkArg: true 
};

/**
 * @tool search-foods
 * @summary Returns a list of foods that matched search (query) keywords
 * @description Search for foods using keywords. Results can be filtered by dataType and there are options for result page sizes or sorting.
 * @param {string} query - One or more search terms. The string may include [search operators](https://fdc.nal.usda.gov/help.html#bkmk-2)
 * @param {Array<string>} [dataType] - Optional. Filter on a specific data type; specify one or more values in an array. Enum: "Branded", "Foundation", "SR Legacy", "Survey (FNDDS)", "Experimental".
 * @param {number} [pageSize=50] - Optional. Maximum number of results to return for the current page. Default is 50. Minimum 1, Maximum 200.
 * @param {number} [pageNumber=1] - Optional. Page number to retrieve. The offset into the overall result set is expressed as (pageNumber * pageSize). Minimum 1.
 * @param {string} [sortBy] - Optional. Specify one of the possible values to sort by that field. Enum: "dataType.keyword", "lowercaseDescription.keyword", "fdcId", "publishedDate".
 * @param {string} [sortOrder] - Optional. The sort direction for the results. Only applicable if sortBy is specified. Enum: "asc", "desc".
 * @param {string} [brandOwner] - Optional. Filter results based on the brand owner of the food. Only applies to Branded Foods.
 * @param {Array<string>} [tradeChannel] - Optional. Filter foods containing any of the specified trade channels. Enum: "CHILD_NUTRITION_FOOD_PROGRAMS", "DRUG", "FOOD_SERVICE", "GROCERY", "MASS_MERCHANDISING", "MILITARY", "ONLINE", "VENDING". MinItems: 1, MaxItems: 3.
 * @param {string} [startDate] - Optional. Filter foods published on or after this date. Format: YYYY-MM-DD.
 * @param {string} [endDate] - Optional. Filter foods published on or before this date. Format: YYYY-MM-DD.
 */
server.tool(
  "search-foods",
  sdkSchemaArg, // Use the plain object for the SDK
  async (params: any) => { // Handler params as any
    // Validate and get typed parameters using the original Zod schema
    const {
      query,
      dataType,
      pageSize, // Defaults are handled by Zod's .parse() if optional fields are undefined
      pageNumber,
      sortBy,
      sortOrder,
      brandOwner,
      tradeChannel,
      startDate,
      endDate,
    } = searchFoodsInputSchema.parse(params) as SearchFoodsInput;
    try {
      const response = await axios.get<SearchResponse>(
        `${BASE_URL}/foods/search`,
        {
          params: {
            api_key: USDA_API_KEY,
            query,
            ...(dataType ? { dataType } : {}),
            pageSize,
            pageNumber,
            ...(sortBy ? { sortBy } : {}),
            ...(sortOrder ? { sortOrder } : {}),
            ...(brandOwner ? { brandOwner } : {}),
            ...(tradeChannel ? { tradeChannel } : {}),
            ...(startDate ? { startDate } : {}),
            ...(endDate ? { endDate } : {}),
          },
        }
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    } catch (error) {
      console.error("Error searching foods:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error searching foods: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Start the server with stdio transport
const transport = new StdioServerTransport();
server.connect(transport).then(() => {
  console.error("Food Data Central MCP server started with stdio transport");
});
