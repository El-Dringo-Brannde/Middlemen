import { Context, HttpRequest } from '@azure/functions';

type MiddlewareFunc = {
	func: (context: Context, req: HttpRequest) => void | Error;
};

type Func = (context: Context, req: HttpRequest) => void | Error;
type CatchMiddlewareFunc = (err: Error, ctx: Context) => void;

export { Context, MiddlewareFunc, CatchMiddlewareFunc, Func, HttpRequest };
