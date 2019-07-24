import Joi from '@hapi/joi';
import {
	MiddlewareFunc,
	HttpRequest,
	CatchMiddlewareFunc,
	Context,
	Func
} from './index.d';

const validateSchema = schema => (ctx, input) => {
	const { error } = Joi.validate(input, schema);
	return error ? Error(`Invalid input, ${error.message}`) : null;
};
class AzureMiddleMen {
	private middlewareStack: Array<MiddlewareFunc> = [];
	private catchFunc: CatchMiddlewareFunc;

	validate(joiSchema): AzureMiddleMen {
		if (!joiSchema) throw Error('schema should not be empty!');

		this.middlewareStack = [
			{ func: validateSchema(joiSchema) },
			...this.middlewareStack
		];

		return this;
	}

	use(func: Func): AzureMiddleMen {
		this.middlewareStack.push({ func });
		return this;
	}

	catch(func: CatchMiddlewareFunc): AzureMiddleMen {
		this.catchFunc = func;
		return this;
	}

	listen = () => async (context: Context, req: HttpRequest) => {
		let res, err;

		for await (let layer of this.middlewareStack) {
			try {
				res = await layer.func(context, req);
				if (res instanceof Error) break;
			} catch (error) {
				err = error;
				break;
			}
		}

		const exit = error => {
			context.res = {
				status: 400,
				body: { error: error.toString() }
			};
			context.done();
		};

		if ((res instanceof Error || err instanceof Error) && !this.catchFunc) {
			const error = res instanceof Error ? res : err;
			exit(error);
		} else if (
			(res instanceof Error || err instanceof Error) &&
			this.catchFunc
		) {
			const error = res instanceof Error ? res : err;
			this.catchFunc(error, context);
		}
	};
}

export default AzureMiddleMen;
