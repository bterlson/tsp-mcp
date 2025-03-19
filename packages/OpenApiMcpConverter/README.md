# OpenAPI to MCP Converter

This tool automatically converts an OpenAPI specification to a Model Context Protocol (MCP) server. It works with OpenAPI 3.0 specifications and generates a fully functional MCP server that can be used to communicate with the underlying REST API.

## Overview

The OpenApiMcpConverter provides three main operations:
1. `convert_openapi_to_mcp`: Converts an OpenAPI spec to TypeScript code for an MCP server
2. `generate_mcp_server`: Compiles and prepares the generated MCP server code
3. `test_mcp_server`: Tests operations of the generated MCP server

## Project Structure

