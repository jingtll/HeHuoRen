import {
  Catch,
  HttpException,
  type ArgumentsHost,
  type ExceptionFilter,
} from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";

interface ApiErrorPayload {
  code: string;
  message: string;
  requestId: string;
}

const errorCodesByStatus: Record<number, string> = {
  400: "BAD_REQUEST",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "CONFLICT",
  422: "UNPROCESSABLE_ENTITY",
  429: "TOO_MANY_REQUESTS",
};

const messagesByStatus: Record<number, string> = {
  400: "请求参数无效",
  401: "未授权",
  403: "禁止访问",
  404: "请求的资源不存在",
  409: "请求冲突",
  422: "请求无法处理",
  429: "请求过于频繁",
};

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const httpContext = host.switchToHttp();
    const request = httpContext.getRequest<FastifyRequest>();
    const reply = httpContext.getResponse<FastifyReply>();
    const statusCode =
      exception instanceof HttpException ? exception.getStatus() : 500;

    const payload: ApiErrorPayload = {
      code:
        statusCode >= 500
          ? "INTERNAL_SERVER_ERROR"
          : (errorCodesByStatus[statusCode] ?? "HTTP_ERROR"),
      message:
        statusCode >= 500
          ? "服务器内部错误"
          : (messagesByStatus[statusCode] ?? "请求失败"),
      requestId: request.id,
    };

    reply.status(statusCode).send(payload);
  }
}
