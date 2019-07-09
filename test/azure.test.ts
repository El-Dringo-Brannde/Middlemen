import chai from 'chai';
import Joi from '@hapi/joi';
import spies from 'chai-spies';

import { AzureMiddleMen } from '../src/index';

const { expect } = chai;
chai.use(spies);

const EventSchema = Joi.object()
	.keys({
		event: Joi.string()
			.valid('example')
			.required(),
		payload: Joi.object()
			.keys({
				text: Joi.string()
			})
			.required()
	})
	.required();

const handler = ctx => {
	ctx.log.info('Im called first');
	ctx.next();
};

const defaultctx = {
	log: chai.spy.interface('log', ['info', 'error', 'warn']),
	bindings: () => ({})
};

it('should handle chained functions', done => {
	const ChainedFunction = new AzureMiddleMen()
		.use(handler)
		.use(ctx => {
			Promise.resolve(1).then(() => {
				ctx.log.info('Im called second');
				ctx.next();
			});
		})
		.use(ctx => {
			ctx.log.info('Im called third');
			ctx.done(null, { status: 200 });
		})
		.listen();

	const message = {
		event: 'example',
		payload: { text: 'holamundo' }
	};
	const mockCtx = {
		...defaultctx,
		done: (err, res) => {
			try {
				expect(err).to.equal(null);
				expect(res).to.deep.equal({ status: 200 });
				expect(mockCtx.log.info).to.have.been.called.with('Im called first');
				expect(mockCtx.log.info).to.have.been.called.with('Im called second');
				expect(mockCtx.log.info).to.have.been.called.with('Im called third');
				done();
			} catch (error) {
				done(error);
			}
		}
	};
	//@ts-ignore
	ChainedFunction(mockCtx, message);
});

it('should handle error in catch', done => {
	const CatchedFunction = new AzureMiddleMen()
		.use(() => {
			throw 'This is an error';
		})
		.use(ctx => {
			ctx.log.info('Im not called');
			ctx.done();
		})
		.catch((err, ctx) => {
			ctx.log.error(err);
			ctx.done(err);
		})
		.listen();

	const message = {
		event: 'example',
		payload: { text: 'holamundo' }
	};

	const mockCtx = {
		...defaultctx,
		done: err => {
			try {
				expect(err).to.equal('This is an error');
				expect(mockCtx.log.error).to.have.been.called.with('This is an error');
				done();
			} catch (error) {
				done(error);
			}
		}
	};

	//@ts-ignore
	CatchedFunction(mockCtx, message);
});

it('should handle valid schema inputs', done => {
	const message = {
		event: 'example',
		payload: { text: 'holamundo' }
	};

	const ValidSchemaFunction = new AzureMiddleMen()
		.validate(EventSchema)
		.use(ctx => {
			ctx.log.info('Im called');
			ctx.done();
		})
		.catch((err, ctx) => {
			ctx.log.error(err);
			ctx.done(err);
		})
		.listen();

	const mockCtx = {
		...defaultctx,
		done: err => {
			try {
				expect(err).to.equal(undefined);
				expect(mockCtx.log.info).to.have.been.called.with('Im called');
				done();
			} catch (error) {
				done(error);
			}
		}
	};

	//@ts-ignore
	ValidSchemaFunction(mockCtx, message);
});

it('should handle invalid schema inputs', done => {
	const message = {};

	const InvalidSchemaFunction = new AzureMiddleMen()
		.validate(EventSchema)
		.use(ctx => {
			ctx.log.info('Im not called');
			ctx.done();
		})
		.catch((err, ctx) => {
			ctx.log.error(err);
			ctx.done(err);
		})
		.listen();

	const mockCtx = {
		...defaultctx,
		done: err => {
			try {
				expect(err.message).to.include('Invalid input');
				expect(err.input).to.equal(message);
				expect(mockCtx.log.info).to.have.not.been.called.with('Im not called');
				expect(mockCtx.log.error).to.have.been.called();
				done();
			} catch (error) {
				done(error);
			}
		}
	};

	//@ts-ignore
	InvalidSchemaFunction(mockCtx, message);
});

it('should handle when done in called early', done => {
	const message = {
		event: 'example',
		payload: { text: 'holamundo' }
	};

	const DoneEarlyFunction = new AzureMiddleMen()
		.use(ctx => {
			const predicate = true;
			if (predicate) {
				ctx.log.info('Im called');
				ctx.done(null);
			}
			ctx.next();
		})
		.use(ctx => {
			ctx.log.info('Im not called');
			ctx.done();
		})
		.catch((err, ctx) => {
			ctx.log.error(err);
			ctx.done(err);
		})
		.listen();

	const mockCtx = {
		...defaultctx,
		done: err => {
			try {
				expect(err).to.equal(null);
				expect(mockCtx.log.info).to.have.been.called.with('Im called');
				expect(mockCtx.log.info).to.have.not.been.called.with('Im not called');
				done();
			} catch (error) {
				done(error);
			}
		}
	};

	//@ts-ignore
	DoneEarlyFunction(mockCtx, message);
});

it('should handle data spreading', done => {
	const message = {
		event: 'example',
		payload: { text: 'holamundo' }
	};

	const SpreadDataFunction = new AzureMiddleMen()
		.use(ctx => {
			ctx.data = 'some info';
			ctx.next();
		})
		.use(ctx => {
			ctx.log.info('Im not called');
			ctx.done(null, { data: ctx.data });
		})
		.catch((err, ctx) => {
			ctx.log.error(err);
			ctx.done(err);
		})
		.listen();

	const mockCtx = {
		...defaultctx,
		done: (err, response) => {
			try {
				expect(err).to.equal(null);
				expect(response.data).to.equal('some info');
				done();
			} catch (error) {
				done(error);
			}
		}
	};

	//@ts-ignore
	SpreadDataFunction(mockCtx, message);
});

it('should handle when optional chaining function handlers', done => {
	const message = {
		event: 'example',
		payload: { text: 'holamundo' }
	};

	const OptionalFunction = new AzureMiddleMen()
		.use(ctx => {
			ctx.data = [];
			ctx.next();
		})
		.useIf(
			(ctx, msg) => msg.event === 'example',
			ctx => {
				ctx.data.push(1);
				ctx.next();
			}
		)
		.use(ctx => {
			ctx.data.push(2);
			ctx.next();
		})
		.useIf(
			(ctx, msg) => msg.event !== 'example',
			ctx => {
				ctx.data.push(3);
				ctx.next();
			}
		)
		.use(ctx => {
			ctx.data.push(4);
			ctx.done(null, ctx.data);
		})
		.catch((err, ctx) => {
			ctx.done(err);
		})
		.listen();

	const mockCtx = {
		...defaultctx,
		done: (err, data) => {
			try {
				expect(err).to.equal(null);
				expect(data).to.deep.equal([1, 2, 4]);
				done();
			} catch (error) {
				done(error);
			}
		}
	};

	//@ts-ignore
	OptionalFunction(mockCtx, message);
});

it('should handle empty argument in validation and throw error', done => {
	try {
		// @ts-ignore
		new AzureMiddleMen()
			.validate()
			.use(handler)
			.catch((err, ctx) => ctx.done(err))
			.listen();
		done('should throw!');
	} catch (e) {
		expect(e.message).to.equal('schema should not be empty!');
		done();
	}
});

it('should handle when optional chaining function handlers', done => {
	const message = {
		event: 'example',
		payload: { text: 'holamundo' }
	};

	const NextFunction = new AzureMiddleMen()
		.use(ctx => {
			ctx.log.info('Im called first');
			ctx.next();
		})
		.use(ctx => {
			ctx.log.info('Im called second');
			ctx.next(null);
		})
		.listen();

	const mockCtx = {
		...defaultctx,
		done: err => {
			try {
				expect(err).to.equal(null);
				expect(mockCtx.log.info).to.have.been.called.with('Im called first');
				expect(mockCtx.log.info).to.have.been.called.with('Im called second');
				done();
			} catch (error) {
				done(error);
			}
		}
	};

	// @ts-ignore
	NextFunction(mockCtx, message);
});
