import Joi from '@hapi/joi';

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
	private middlewareStack = [];

	validate(schema): AzureMiddleMen {
		if (!schema) {
			throw Error('schema should not be empty!');
		}
		this.middlewareStack = [
			{ fn: validateSchema(schema) },
			...this.middlewareStack
		];
		return this;
	}

	use(fn): AzureMiddleMen {
		this.middlewareStack.push({ fn });
		return this;
	}

	iterate(args, iterator): AzureMiddleMen {
		args.forEach(arg => {
			this.middlewareStack.push({ fn: iterator(arg) });
		});
		return this;
	}

	useIf(predicate, fn): AzureMiddleMen {
		this.middlewareStack.push({ fn, predicate, optional: true });
		return this;
	}

	catch(fn): AzureMiddleMen {
		this.middlewareStack.push({ fn, error: true });
		return this;
	}

	listen() {
		const self = this;
		return (context, inputs, ...args) => self._handle(context, inputs, ...args);
	}

	private _handle(ctx, input, ...args): void {
		const originalDoneImplementation = ctx.done;
		const stack = this.middlewareStack;
		let index = 0;
		let doneWasCalled = false;

		ctx.done = (...params: [any]) => {
			if (doneWasCalled) return;
			doneWasCalled = true;
			originalDoneImplementation(...params);
		};

		ctx.next = err => {
			try {
				const layer = stack[index++];
				// No more layers to evaluate
				// Call DONE
				if (!layer) return ctx.done(err);
				// Both next called with err AND layers is error handler
				// Call error handler
				if (err && layer.error) return layer.fn(err, ctx, input, ...args);
				// Next called with err OR layers is error handler, but not both
				// Next layer
				if (err || layer.error) return ctx.next(err);
				// Layer is optional and predicate resolves to false
				// Next layer
				if (layer.optional && !layer.predicate(ctx, input)) return ctx.next();

				// Call function handler
				return layer.fn(ctx, input, ...args);
			} catch (e) {
				return ctx.next(e);
			}
		};
		ctx.next();
	}
}

export = AzureMiddleMen;
