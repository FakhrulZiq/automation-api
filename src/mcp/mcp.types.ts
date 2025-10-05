export interface McpMessageBase {
  id?: string;
  type: string;
}

export interface InitializeRequest extends McpMessageBase {
  type: 'initialize';
  client?: {
    name?: string;
    version?: string;
  };
}

export interface ListToolsRequest extends McpMessageBase {
  type: 'list_tools';
}

export interface CallToolRequest extends McpMessageBase {
  type: 'call_tool';
  tool: string;
  params?: Record<string, unknown>;
}

export interface PingRequest extends McpMessageBase {
  type: 'ping';
}

export interface AuthenticateRequest extends McpMessageBase {
  type: 'authenticate';
  token: string;
}

export type McpRequest =
  | InitializeRequest
  | ListToolsRequest
  | CallToolRequest
  | PingRequest
  | AuthenticateRequest;

export interface McpResultResponse extends McpMessageBase {
  type: 'result';
  result: unknown;
}

export interface McpErrorResponse extends McpMessageBase {
  type: 'error';
  error: {
    message: string;
    code?: string;
  };
}

export interface McpEventMessage extends McpMessageBase {
  type: 'event';
  event: string;
  data?: unknown;
}

export type McpResponse =
  | McpResultResponse
  | McpErrorResponse
  | McpEventMessage;
