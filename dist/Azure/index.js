"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var joi_1 = __importDefault(require("@hapi/joi"));
var validateSchema = function (schema) { return function (ctx, input) {
    var error = joi_1.default.validate(input, schema).error;
    return ctx.next(error
        ? {
            message: "Invalid input, " + error.message,
            details: error.details,
            input: input
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
        var _this = this;
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
        ctx.next = function (err) { return __awaiter(_this, void 0, void 0, function () {
            var layer, retVal, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        layer = stack[index++];
                        // No more layers to evaluate, Call done and exit
                        if (!layer)
                            return [2 /*return*/, ctx.done(err)];
                        // Both next called with err AND layers is error handler
                        // Call error handler
                        //@ts-ignore
                        if (err && layer.error)
                            return [2 /*return*/, layer.func.apply(layer, [err, ctx, input].concat(args))];
                        // Next called with err OR layers is error handler, but not both
                        // Next layer
                        if (err || layer.error)
                            return [2 /*return*/, ctx.next(err)];
                        // Layer is optional and predicate resolves to false
                        // Next layer
                        if (layer.optional && !layer.predicate(ctx, input))
                            return [2 /*return*/, ctx.next()];
                        return [4 /*yield*/, layer.func.apply(layer, [ctx, input].concat(args))];
                    case 1:
                        retVal = _a.sent();
                        if (retVal instanceof Error)
                            throw retVal;
                        // @ts-ignore
                        else
                            return [2 /*return*/, layer.func.apply(layer, [ctx, input].concat(args))];
                        return [3 /*break*/, 3];
                    case 2:
                        e_1 = _a.sent();
                        return [2 /*return*/, ctx.next(e_1)];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        ctx.next();
    };
    return AzureMiddleMen;
}());
exports.default = AzureMiddleMen;
