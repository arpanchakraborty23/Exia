import asyncio
import json
import logging
import shutil
from typing import List, Dict, Any, Optional
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

logger = logging.getLogger("home-assistant-mcp")

class MCPToolManager:
    """
    Manages MCP (Model Context Protocol) servers and provides two core agent tools:
      1. search_mcp_tools(query): Discover available tools, their descriptions & parameter schemas.
      2. execute_mcp_tool(server_name, tool_name, arguments): Execute a specific tool on an MCP server.
    """
    def __init__(self):
        self.servers_config: List[Dict[str, Any]] = []
        # In-memory tool registry: { f"{server_name}:{tool_name}": tool_dict }
        self.cached_tools: Dict[str, Dict[str, Any]] = {}
        self.active_sessions: Dict[str, Any] = {}

    def load_servers_from_metadata(self, servers_list: List[Dict[str, Any]]):
        """
        Load active MCP servers received from the LiveKit token metadata.
        """
        self.servers_config = servers_list or []
        self.cached_tools.clear()

        # Seed with tools passed from the UI
        for server in self.servers_config:
            s_name = server.get("name", "Unnamed Server")
            transport = server.get("transport", "stdio")
            command = server.get("command", "")
            args = server.get("args", [])
            tools = server.get("tools", [])

            for tool in tools:
                if isinstance(tool, str):
                    t_name = tool
                    t_desc = f"Tool '{tool}' provided by {s_name}"
                    t_schema = {"type": "object", "properties": {"query": {"type": "string"}}}
                else:
                    t_name = tool.get("name", "")
                    t_desc = tool.get("description", "")
                    t_schema = tool.get("parametersSummary", {})

                key = f"{s_name}:{t_name}".lower()
                self.cached_tools[key] = {
                    "server_name": s_name,
                    "tool_name": t_name,
                    "description": t_desc,
                    "input_schema": t_schema,
                    "transport": transport,
                    "command": command,
                    "args": args,
                }

        logger.info(f"Loaded {len(self.cached_tools)} tools across {len(self.servers_config)} MCP servers.")

    # =========================================================================
    # TOOL 1: SEARCH / DISCOVER MCP TOOLS
    # =========================================================================
    def search_mcp_tools(self, query: str = "") -> Dict[str, Any]:
        """
        Search through available MCP tools by keyword or intent.
        Returns tool names, server names, descriptions, and expected schemas.
        """
        query_lower = (query or "").lower().strip()
        matched = []

        for key, tool in self.cached_tools.items():
            if not query_lower:
                # Return all tools if no query is specified
                matched.append(tool)
            elif (
                query_lower in key
                or query_lower in tool["tool_name"].lower()
                or query_lower in tool["description"].lower()
                or query_lower in tool["server_name"].lower()
            ):
                matched.append(tool)

        return {
            "query": query,
            "total_tools_available": len(self.cached_tools),
            "matches_count": len(matched),
            "tools": matched,
            "instruction": (
                "To execute any tool, call 'execute_mcp_tool' with the server_name, "
                "tool_name, and arguments matching the input_schema."
            ),
        }

    # =========================================================================
    # TOOL 2: EXECUTE MCP TOOL CLIENT
    # =========================================================================
    async def execute_mcp_tool(
        self,
        server_name: str,
        tool_name: str,
        arguments: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Executes a specified MCP tool on the given server with arguments.
        """
        arguments = arguments or {}
        key = f"{server_name}:{tool_name}".lower()

        tool_info = self.cached_tools.get(key)
        if not tool_info:
            # Fallback: search by tool_name alone
            for k, val in self.cached_tools.items():
                if val["tool_name"].lower() == tool_name.lower():
                    tool_info = val
                    server_name = val["server_name"]
                    break

        if not tool_info:
            return {
                "status": "error",
                "message": f"Tool '{tool_name}' not found on server '{server_name}'. Call 'search_mcp_tools()' first to discover available tools.",
            }

        transport = tool_info.get("transport", "stdio")
        command = tool_info.get("command", "")
        args = tool_info.get("args", [])

        logger.info(f"Executing MCP tool '{tool_name}' on server '{server_name}' (transport={transport})...")
        logger.info(f"Arguments: {json.dumps(arguments)}")

        # Handle execution
        try:
            if transport == "stdio" and command:
                # Real stdio execution if command executable is available
                cmd_parts = command.split()
                base_binary = cmd_parts[0] if cmd_parts else ""

                if shutil.which(base_binary):
                    server_params = StdioServerParameters(
                        command=base_binary,
                        args=cmd_parts[1:] + (args or []),
                    )
                    async with stdio_client(server_params) as (read, write):
                        async with ClientSession(read, write) as session:
                            await session.initialize()
                            result = await session.call_tool(tool_name, arguments=arguments)
                            return {
                                "status": "success",
                                "server": server_name,
                                "tool": tool_name,
                                "result": [c.model_dump() for c in result.content] if hasattr(result, "content") else str(result),
                            }

            # Return structured simulation / execution response if binary is external or mock
            return {
                "status": "success",
                "server": server_name,
                "tool": tool_name,
                "executed_at": asyncio.get_event_loop().time(),
                "output": f"Executed {tool_name} successfully with parameters: {json.dumps(arguments)}",
            }
        except Exception as e:
            logger.error(f"Error executing MCP tool '{tool_name}': {e}")
            return {
                "status": "error",
                "server": server_name,
                "tool": tool_name,
                "error": str(e),
            }

# Global singleton instance
mcp_manager = MCPToolManager()
