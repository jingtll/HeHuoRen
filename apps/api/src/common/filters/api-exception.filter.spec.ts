import { UnauthorizedException, type ArgumentsHost } from "@nestjs/common";
import { jest } from "@jest/globals";
import { ApiExceptionFilter } from "./api-exception.filter.js";

function createHost() {
  const reply = {
    status: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  };
  const host = {
    switchToHttp: () => ({
      getRequest: () => ({ id: "request-123" }),
      getResponse: () => reply,
    }),
  } as unknown as ArgumentsHost;

  return { host, reply };
}

describe("ApiExceptionFilter", () => {
  it("returns a generic message and request id without leaking unknown errors", () => {
    const { host, reply } = createHost();

    new ApiExceptionFilter().catch(
      new Error("secret database password at internalFunction"),
      host,
    );

    expect(reply.status).toHaveBeenCalledWith(500);
    expect(reply.send).toHaveBeenCalledWith({
      code: "INTERNAL_SERVER_ERROR",
      message: "服务器内部错误",
      requestId: "request-123",
    });
    expect(JSON.stringify(reply.send.mock.calls)).not.toContain(
      "secret database password",
    );
    expect(JSON.stringify(reply.send.mock.calls)).not.toContain(
      "at internalFunction",
    );
  });

  it("maps an HTTP exception to a stable code and preserves its status", () => {
    const { host, reply } = createHost();

    new ApiExceptionFilter().catch(new UnauthorizedException(), host);

    expect(reply.status).toHaveBeenCalledWith(401);
    expect(reply.send).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "UNAUTHORIZED",
        requestId: "request-123",
      }),
    );
  });
});
