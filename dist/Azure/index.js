"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var joi_1 = __importDefault(require("@hapi/joi"));
var validateSchema = function (schema) { return function (ctx, input) {
    var error = joi_1.default.validate(input, schema).error;
    return ctx.next(error
        ? {
            message: "Invalid input, " + error.message,
            details: JSON.stringify(error.details),
            input: JSON.stringify(input)
        }
        : null);
}; };
var AzureMiddleMen = /** @class */ (function () {
    function AzureMiddleMen() {
        var _this = this;
        this.middlewareStack = [];
        this.listen = function () { return function (context, inputs) {
            var args = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                args[_i - 2] = arguments[_i];
            }
            return _this._handle.apply(_this, [context, inputs].concat(args));
        }; };
    }
    AzureMiddleMen.prototype.validate = function (schema) {
        if (!schema)
            throw Error('schema should not be empty!');
        this.middlewareStack = [
            { func: validateSchema(schema) }
        ].concat(this.middlewareStack);
        return this;
    };
    AzureMiddleMen.prototype.use = function (func) {
        this.middlewareStack.push({ func: func });
        return this;
    };
    AzureMiddleMen.prototype.iterate = function (args, iterator) {
        var _this = this;
        args.forEach(function (arg) { return _this.middlewareStack.push({ func: iterator(arg) }); });
        return this;
    };
    AzureMiddleMen.prototype.useIf = function (predicate, func) {
        this.middlewareStack.push({ func: func, predicate: predicate, optional: true });
        return this;
    };
    AzureMiddleMen.prototype.catch = function (func) {
        this.middlewareStack.push({ func: func, error: true });
        return this;
    };
    AzureMiddleMen.prototype._handle = function (ctx, input) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        var originalDoneImplementation = ctx.done;
        var stack = this.middlewareStack;
        var index = 0;
        var doneWasCalled = false;
        ctx.done = function () {
            var params = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                params[_i] = arguments[_i];
            }
            if (doneWasCalled)
                return;
            doneWasCalled = true;
            originalDoneImplementation.apply(void 0, params);
        };
        ctx.next = function (err) {
            try {
                var layer = stack[index++];
                // No more layers to evaluate, Call done and exit
                if (!layer)
                    return ctx.done(err);
                // Both next called with err AND layers is error handler
                // Call error handler
                if (err && layer.error)
                    return layer.func.apply(layer, [err, ctx, input].concat(args));
                // Next called with err OR layers is error handler, but not both
                // Next layer
                if (err || layer.error)
                    return ctx.next(err);
                // Layer is optional and predicate resolves to false
                // Next layer
                if (layer.optional && !layer.predicate(ctx, input))
                    return ctx.next();
                // Call original function handler
                return layer.func.apply(layer, [ctx, input].concat(args));
            }
            catch (e) {
                return ctx.next(e);
            }
        };
        ctx.next();
    };
    return AzureMiddleMen;
}());
module.exports = AzureMiddleMen;
//# sourceMappingURL=index.js.map