import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class ResponseFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    response.status(200).json({
      msg: `${exception as string}`,
      code: 500,
      data: null,
    });
  }
}
