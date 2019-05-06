interface ImiddlewareFunc { 
	(context: any, ...opts: any): void;
}

const contextEx = require('./context');
const reqEx = require('./req');

class MiddleMen {
	private _handler; 
	private _middlewareFuncStack = []

	use(middlewareFunc: ImiddlewareFunc) {
		this._middlewareFuncStack.push(middlewareFunc)	
		return this; 
	}

	handle(handler): Function {
		return handler();
	}

	run(context, req) {
		
	}
}

const middleMen = new MiddleMen();

middleMen.use((context, req) => {
	console.log(1)
})

middleMen.handle((contextEx, reqEx) => {
	console.log('In the handler')
}) 
