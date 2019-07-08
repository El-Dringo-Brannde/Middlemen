import Joi from '@hapi/joi';
import {
	NextContext,
	Context,
	MiddlewareFunc,
	CatchMiddlewareFunc,
	PredicateMiddlewareFunc,
	MiddlewareStack
} from './index.d';

const validateSchema = schema => (ctx, input) => {
	const { error } = Joi.validate(input, schema);
	return ctx.next(
		error
			? {
					message: `Invalid input, ${error.message}`,
					details: JSON.stringify(error.details),
					input: JSON.stringify(input)
			  }
			: null
	);
};

class AzureMiddleMen {
	private middlewareStack: MiddlewareStack[] = [];

	validate(schema): AzureMiddleMen {
		if (!schema) throw Error('schema should not be empty!');

		this.middlewareStack = [
			{ func: validateSchema(schema) },
			...this.middlewareStack
		];

		return this;
	}

	use(func: MiddlewareFunc): AzureMiddleMen {
		this.middlewareStack.push({ func });
		return this;
	}

	iterate(args: Array<any>, iterator): AzureMiddleMen {
		args.forEach(arg => this.middlewareStack.push({ func: iterator(arg) }));
		return this;
	}

	useIf(
		predicate: PredicateMiddlewareFunc,
		func: MiddlewareFunc
	): AzureMiddleMen {
		this.middlewareStack.push({ func, predicate, optional: true });
		return this;
	}

	catch(func: CatchMiddlewareFunc): AzureMiddleMen {
		this.middlewareStack.push({ func, error: true });
		return this;
	}

	listen = (): ((
		context: NextContext & Context,
		inputs: any,
		...args: Array<any>
	) => void) => (context, inputs, ...args) =>
		this._handle(context, inputs, ...args);

	private _handle(ctx: NextContext, input, ...args): void {
		const originalDoneImplementation = ctx.done;
		const stack = this.middlewareStack;
		let index = 0;
		let doneWasCalled = false;

		ctx.done = (...params: Array<any>) => {
			if (doneWasCalled) return;
			doneWasCalled = true;
			originalDoneImplementation(...params);
		};

		ctx.next = err => {
			try {
				const layer = stack[index++];
				// No more layers to evaluate, Call done and exit
				if (!layer) return ctx.done(err);
				// Both next called with err AND layers is error handler
				// Call error handler
				if (err && layer.error) return layer.func(err, ctx, input, ...args);
				// Next called with err OR layers is error handler, but not both
				// Next layer
				if (err || layer.error) return ctx.next(err);
				// Layer is optional and predicate resolves to false
				// Next layer
				if (layer.optional && !layer.predicate(ctx, input)) return ctx.next();

				// Call original function handler
				return layer.func(ctx, input, ...args);
			} catch (e) {
				return ctx.next(e);
			}
		};
		ctx.next();
	}
}

export = AzureMiddleMen;
