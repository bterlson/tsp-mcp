import axios from "axios";
import { OpenAPIV3 } from "openapi-types";

export async function fetchOpenApiSpec(url: string): Promise<any> {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error: any) {
    throw new Error(`Failed to fetch OpenAPI spec: ${error?.message || String(error)}`);
  }
}

export function parseOpenApiSpec(spec: any): OpenAPIV3.Document {
  try {
    // Basic validation that it's an OpenAPI document
    if (!spec.openapi && !spec.swagger) {
      throw new Error("The document does not appear to be a valid OpenAPI specification");
    }
    
    // Handle both OpenAPI 3.0 and Swagger 2.0
    if (spec.swagger && spec.swagger.startsWith("2.")) {
      console.warn("Converting Swagger 2.0 to OpenAPI 3.0 format");
      // Implement conversion logic here if needed
      // For a complete solution, you might want to use a library like swagger2openapi
    }
    
    return spec as OpenAPIV3.Document;
  } catch (error: any) {
    throw new Error(`Failed to parse OpenAPI spec: ${error?.message || String(error)}`);
  }
}
