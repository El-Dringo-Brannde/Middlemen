import { Context } from '@azure/functions';

interface NextContext extends Context {
	next: (error?: Error) => any;
	data?: any;
	args?: Array<any>;
}

type MiddlewareFunc = (context: NextContext) => void;
type CatchMiddlewareFunc = (err: Error, ctx: Context) => void;
type PredicateMiddlewareFunc = (ctx: NextContext, msg: any) => boolean;

type MiddlewareStack = {
	func: MiddlewareFunc | CatchMiddlewareFunc;
	predicate?: PredicateMiddlewareFunc;
	optional?: boolean;
	error?: boolean;
};

export {
	NextContext,
	Context,
	MiddlewareFunc,
	CatchMiddlewareFunc,
	PredicateMiddlewareFunc,
	MiddlewareStack
};
