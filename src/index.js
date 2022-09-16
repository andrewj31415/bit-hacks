// for simple assertions

/**
 *  Throws the given message if bool is false.
 *
 * @param {boolean} bool
 * @param {string} message
 */
var assert = (bool, message) => {
    if (!bool) {
        throw new Error(message);
    }
};

var N = 32; //number of bits

// Bit = Fixed(0|1) + Var(n: number) + And(Array<Bit>)
// every Bit has a .v (variant: string) and a .p (precednce: number).
// atomic Bit values (Fixed, Var) have precedence 100.
// Every bit has .name = "Bit" for type-checking.
class Fixed {
    constructor(s) {
        /* s: 0|1 */
        assert(s === 0 || s === 1, `Bit value must be 0 or 1, not ${s}`);
        this.v = "Fixed";
        this.p = 100;
        this.value = s;
        this.name = "Bit";
    }
    toString() {
        return String(this.value);
    }
}
class Var {
    constructor(n) {
        /* n: number */
        this.v = "Var";
        this.p = 100;
        this.index = n;
        this.name = "Bit";
    }
    toString() {
        return "x" + String(this.index);
    }
}
class And {
    constructor(A) {
        /* A: Array<Bit> */
        this.v = "And";
        this.p = 50;
        this.A = A;
        this.name = "Bit";
    }
    toString() {
        return this.A.map((b) => {
            return (this.p > b.p ? "(" : "") + b.toString() + (this.p > b.p ? ")" : "");
        }).join("&");
    }
}
let getBitAnd = (a, b) => {
    if (a.v === "Fixed") {
        return a.value === 0 ? a : b;
    }
    if (b.v === "Fixed") {
        return b.value === 0 ? b : a;
    }
    return new And([a, b]);
};
class Or {
    constructor(A) {
        /* A: Array<Bit> */
        for (let b of A) {
            assert(b.name === "Bit");
        }
        this.v = "Or";
        this.p = 30;
        this.A = A;
        this.name = "Bit";
    }
    toString() {
        return this.A.map((b) => {
            return (this.p > b.p ? "(" : "") + b.toString() + (this.p > b.p ? ")" : "");
        }).join("|");
    }
}
let getBitOr = (a, b) => {
    if (a.v === "Fixed") {
        return a.value === 1 ? a : b;
    }
    if (b.v === "Fixed") {
        return b.value === 1 ? b : a;
    }
    return new Or([a, b]);
};
class Not {
    constructor(b) {
        /* b: Bit */
        this.v = "Not";
        this.p = 70;
        this.b = b;
        this.name = "Bit";
    }
    toString() {
        return "!" + (this.p > this.b.p ? "(" : "") + this.b.toString() + (this.p > this.b.p ? ")" : "");
    }
}
let getBitNot = (b) => {
    if (b.v === "Not") {
        return b.b;
    }
    if (b.v === "And") {
        return new Or(b.A.map((c) => getBitNot(c)));
    }
    if (b.v === "Or") {
        return new And(
            b.A.map((c) => {
                getBitNot(c);
            })
        );
    }
    if (b.v === "Fixed") {
        return new Fixed(1 - b.value);
    }
    return new Not(b);
};
// console.log(getBitNot(new Var(1)).toString());
// console.log(getBitNot(getBitNot(new Var(1))).toString());

// a bitstring
/**
 * An N-bit integer.
 */
class Int {
    /**
     *  Constructs an integer whose ith bit is A[i].
     *
     * @param {Array<Bit>} A
     */
    constructor(A) {
        /* A: Array<Bit> */
        assert(A.length === N, `Int must have correct number of bits ${N}, not ${A.length}`);
        this.A = A;
        this.name = "Int";
    }
    toString() {
        return this.A.map((bit) => bit.toString()).join(" ");
    }
    /**
     *
     * @param {number} int the value of the int
     * @returns an Int, all of whose bits are fixed values
     */
    static fromInt(int) {
        let newA = [];
        for (let i = 0; i < N; i++) {
            newA.push(new Fixed((int >> i) % 2));
        }
        return new Int(newA);
    }
    and(that) {
        let newA = [];
        for (let i = 0; i < N; i++) {
            newA.push(getBitAnd(this.A[i], that.A[i]));
        }
        return new Int(newA);
    }
    or(that) {
        let newA = [];
        for (let i = 0; i < N; i++) {
            newA.push(getBitOr(this.A[i], that.A[i]));
        }
        return new Int(newA);
    }
    not() {
        let newA = [];
        for (let i = 0; i < N; i++) {
            newA.push(getBitNot(this.A[i]));
        }
        return new Int(newA);
    }
}

import antlr4 from "antlr4";
import ExpressionLexer from "../build/ExpressionLexer";
import ExpressionParser from "../build/ExpressionParser";
import ExpressionVisitor from "../build/ExpressionVisitor";

class Evaluate extends ExpressionVisitor {
    // Visit a parse tree produced by ExpressionParser#input.
    visitInput(ctx) {
        return this.visitChildren(ctx);
    }

    // Visit a parse tree produced by ExpressionParser#variable.
    visitVariable(ctx) {
        let newA = [];
        for (let i = 0; i < N; i++) {
            newA.push(new Var(i));
        }
        let val = new Int(newA);
        return val;
    }

    // Visit a parse tree produced by ExpressionParser#number.
    visitNumber(ctx) {
        let value = Int.fromInt(Number(ctx.getText()));
        assert(value.name === "Int");
        return value;
    }

    // Visit a parse tree produced by ExpressionParser#expr.
    visitExpr(ctx) {
        if (ctx.expr() !== null) {
            return this.visit(ctx.expr());
        }
        if (ctx.binOp() !== null) {
            return this.visit(ctx.binOp());
        }
        assert(false, "Did the grammar change?");
    }

    // Visit a parse tree produced by ExpressionParser#binOp.
    visitBinOp(ctx) {
        if (ctx.unOp() !== null) {
            let value = this.visit(ctx.unOp());
            assert(value.name === "Int");
            return value;
        }
        if (ctx.op !== null) {
            let first = this.visit(ctx.left);
            let second = this.visit(ctx.right);
            let op = ctx.op.text;
            if (op === "&") {
                return first.and(second);
            }
            if (op === "|") {
                return first.or(second);
            }
            assert(false, "Did the grammar change?");
        }
        assert(false, "Did the grammar change?");
    }

    // Visit a parse tree produced by ExpressionParser#unOp.
    visitUnOp(ctx) {
        if (ctx.op !== null) {
            let expr = this.visit(ctx.unOp());
            assert(expr.name === "Int");
            let op = ctx.op.text;
            if (op === "!") {
                return expr.not();
            }
            if (op === "~") {
                return expr.not();
            }
            assert(false, "Did the grammar change?");
        }
        if (ctx.exprPrimary() !== null) {
            let value = this.visit(ctx.exprPrimary());
            assert(value.name === "Int");
            return value;
        }
        assert(false, "Did the grammar change?");
    }

    // Visit a parse tree produced by ExpressionParser#exprPrimary.
    visitExprPrimary(ctx) {
        if (ctx.expr() !== null) {
            let value = this.visit(ctx.expr());
            assert(value.name === "Int");
            return value;
        }
        if (ctx.variable() !== null) {
            let value = this.visit(ctx.variable());
            assert(value.name === "Int");
            return value;
        }
        if (ctx.number() !== null) {
            let value = this.visit(ctx.number());
            assert(value.name === "Int");
            return value;
        }
        assert(false, "Did the grammar change?");
    }
}

let setOutput = () => {
    try {
        let text = document.getElementById("input").value;
        let stream = new antlr4.InputStream(text);
        let lexer = new ExpressionLexer(stream);
        let tokens = new antlr4.CommonTokenStream(lexer);
        let parser = new ExpressionParser(tokens);
        let tree = parser.expr();
        // console.log("Parsed", tree);
        // console.log(tree.toStringTree(null, parser));

        let visitor = new Evaluate();
        let outputInt = visitor.visit(tree);
        document.getElementById("output").textContent = outputInt.toString();
    } catch (err) {
        document.getElementById("output").textContent = "Error! Can't parse";
    }
};

//add interactivity
document.getElementById("goButton").addEventListener("click", () => {
    setOutput();
});
document.getElementById("input").addEventListener("input", () => {
    setOutput();
});
setOutput();
