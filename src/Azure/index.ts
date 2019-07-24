import Joi from '@hapi/joi';
import {
	MiddlewareFunc,
	CatchMiddlewareFunc,
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
	private catchFunc;

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

	catch(func: CatchMiddlewareFunc): AzureMiddleMen {
		this.catchFunc = func;
		return this;
	}

	listen = () => async (context, inputs) => {
		let res;

		for await (let layer of this.middlewareStack) {
			res = await layer.func(context, inputs);
			if (res instanceof Error) break;
		}

		const exit = () => {
			context.res = {
				status: 400,
				body: { error: res.toString() }
			};
			context.done();
		};

		if (res instanceof Error && !this.catchFunc) exit();
		else if (res instanceof Error && this.catchFunc)
			this.catchFunc(res, context);
	};
}

export default AzureMiddleMen;
