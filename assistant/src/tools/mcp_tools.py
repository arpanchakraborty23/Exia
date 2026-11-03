    import json


fnc_ctx = llm.FunctionContext()

    @fnc_ctx.ai_callable(
        description=(
            "Discover which MCP tools are available across all connected servers. "
            "Returns tool names, server names, descriptions, and expected parameter schemas. "
            "Always call this first when the user asks for actions or external tools."
        )
    )
    def search_mcp_tools(
        query: str = ""
    ) -> str:
        """
        Tool 1: Search and inspect available MCP tools.
        """
        logger.info(f"🔍 [Tool 1] search_mcp_tools called with query='{query}'")
        res = mcp_manager.search_mcp_tools(query)
        return json.dumps(res)

    @fnc_ctx.ai_callable(
        description=(
            "Execute an MCP tool on a specific server using its tool name and arguments. "
            "Call 'search_mcp_tools' first to get the server_name and argument schema."
        )
    )
    async def execute_mcp_tool(
        server_name: str,
        tool_name: str,
        arguments_json: str = "{}"
    ) -> str:
        """
        Tool 2: Execute an MCP tool client.
        """
        logger.info(f"⚙️ [Tool 2] execute_mcp_tool called: server='{server_name}', tool='{tool_name}', args={arguments_json}")
        try:
            args = json.loads(arguments_json) if isinstance(arguments_json, str) else arguments_json
        except Exception:
            args = {}
        res = await mcp_manager.execute_mcp_tool(server_name, tool_name, args)
        return json.dumps(res)