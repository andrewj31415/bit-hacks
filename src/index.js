console.log("hi, webpack");

// Bit = Fixed(0|1) + Var(n: number) + And(Array<Bit>)
// every Bit has a .v (variant: string) and a .p (precednce: number).
// atomic Bit values (Fixed, Var) have precedence 100.
class Fixed {
    constructor(s) {
        /* s: 0|1 */
        this.v = "Fixed";
        this.p = 100;
        this.value = s;
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
        this.value = n;
    }
    toString() {
        return "x" + String(this.value);
    }
}
class And {
    constructor(A) {
        /* A: Array<Bit> */
        this.v = "And";
        this.p = 50;
        this.A = A;
    }
    toString() {
        return this.A.map((b) => {
            return (this.p > b.p ? "(" : "") + b.toString() + (this.p > b.p ? ")" : "");
        }).join("&");
    }
}
let getAnd = (a, b) => {
    return new And([a, b]);
};
class Or {
    constructor(A) {
        /* A: Array<Bit> */
        this.v = "Or";
        this.p = 30;
        this.A = A;
    }
    toString() {
        return this.A.map((b) => {
            return (this.p > b.p ? "(" : "") + b.toString() + (this.p > b.p ? ")" : "");
        }).join("|");
    }
}
let getOr = (a, b) => {
    return new Or([a, b]);
};
class Not {
    constructor(b) {
        /* b: Bit */
        this.v = "Not";
        this.p = 70;
        this.b = b;
    }
    toString() {
        return "!" + (this.p > this.b.p ? "(" : "") + this.b.toString() + (this.p > this.b.p ? ")" : "");
    }
}
let getNot = (b) => {
    if (b.v === "Not") {
        return b.b;
    }
    if (b.v === "And") {
        return new Or(
            b.A.map((c) => {
                getNot(c);
            })
        );
    }
    if (b.v === "Or") {
        return new And(
            b.A.map((c) => {
                getNot(c);
            })
        );
    }
    if (b.v === "Fixed") {
        return new Fixed(1 - b.value);
    }
    return new Not(b);
};
console.log(getNot(new Var(1)).toString());
console.log(getNot(getNot(new Var(1))).toString());

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
        return this.visitChildren(ctx);
    }

    // Visit a parse tree produced by ExpressionParser#number.
    visitNumber(ctx) {
        console.log("number", ctx);
        console.log(ctx.getText());
        return this.visitChildren(ctx);
    }

    // Visit a parse tree produced by ExpressionParser#expr.
    visitExpr(ctx) {
        return this.visitChildren(ctx);
    }

    // Visit a parse tree produced by ExpressionParser#binOp.
    visitBinOp(ctx) {
        return this.visitChildren(ctx);
    }

    // Visit a parse tree produced by ExpressionParser#unOp.
    visitUnOp(ctx) {
        return this.visitChildren(ctx);
    }

    // Visit a parse tree produced by ExpressionParser#exprPrimary.
    visitExprPrimary(ctx) {
        return this.visitChildren(ctx);
    }
}

//add interactivity
document.getElementById("goButton").addEventListener("click", () => {
    let text = document.getElementById("input").value;
    console.log("text", text);
    let stream = new antlr4.InputStream(text);
    let lexer = new ExpressionLexer(stream);
    let tokens = new antlr4.CommonTokenStream(lexer);
    let parser = new ExpressionParser(tokens);
    let tree = parser.expr();
    console.log("Parsed", tree);
    console.log(tree.toStringTree(null, parser));

    let visitor = new Evaluate();
    let outputBit = visitor.visit(tree);
    document.getElementById("output").innerHTML = outputBit.toString();
});
