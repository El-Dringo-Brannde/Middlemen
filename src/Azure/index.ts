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
	return error
		? {
				message: `Invalid input, ${error.message}`,
				details: error.details,
				input: input
		  }
		: null;
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
	) => void) => async (context, inputs, ...args) => {
		let res;

		for await (let layer of this.middlewareStack) {
			//@ts-ignore
			res = await layer.func(context, inputs, ...args);
			if (res instanceof Error) break;
		}

		const exit = () => {
			context.res = {
				status: 403,
				body: res.toString()
			};
			context.done();
		};
		if (res instanceof Error) exit();
	};
}

export default AzureMiddleMen;
